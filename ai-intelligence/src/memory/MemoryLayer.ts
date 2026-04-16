import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool, PoolClient } from 'pg';
import { AnalysisType } from '../types/analysis.types';
import { ContextChunk } from '../context/ContextFilter';

export interface AnalysisMemory {
  id: string;
  analysisId: string;
  type: AnalysisType;
  query: string;
  embedding: number[]; // Vector embedding (1536 dims for text-embedding-3-small)
  result: {
    keyPoints: string[];
    recommendations: string[];
    qualityScore: number;
  };
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface MemoryRetrievalResult {
  memory: AnalysisMemory;
  similarity: number; // 0-1
  fromCache: 'redis' | 'pgvector' | 'lru';
}

/**
 * MemoryLayer: Armazena e recupera análises similares usando pgvector + Redis
 *
 * Hierarquia de cache:
 * 1. LRU em memória (1000 itens, rápido)
 * 2. Redis (hot cache, 1h TTL)
 * 3. PostgreSQL + pgvector (cold storage, semantic search)
 *
 * Fluxo:
 * - Análise nova → armazenar em Redis + pgvector
 * - Recuperar similar → LRU → Redis → pgvector vector search
 */
export class MemoryLayer {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;
  private lruCache: Map<string, AnalysisMemory> = new Map();
  private readonly lruMaxSize = 1000;
  private embeddingModel = 'text-embedding-3-small'; // OpenAI

  constructor(redis: Redis, pgPool: Pool, logger: Logger) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
  }

  /**
   * Inicializar tabelas no PostgreSQL (pgvector)
   */
  async initialize(): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      // Criar extensão pgvector
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Criar tabela de análises
      await client.query(`
        CREATE TABLE IF NOT EXISTS analysis_memories (
          id VARCHAR(255) PRIMARY KEY,
          analysis_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          query TEXT NOT NULL,
          embedding vector(1536),
          result JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          access_count INT DEFAULT 0,
          last_accessed TIMESTAMP DEFAULT NOW(),
          INDEX idx_type_created (type, created_at),
          INDEX idx_analysis_id (analysis_id)
        );
      `);

      // Criar índice de vector para busca semântica eficiente
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_embedding_ivfflat
        ON analysis_memories
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);

      this.logger.info('MemoryLayer inicializado com sucesso');
    } catch (error) {
      // Tabela pode já existir, é normal
      if (
        error instanceof Error &&
        !error.message.includes('already exists')
      ) {
        throw error;
      }
    } finally {
      client.release();
    }
  }

  /**
   * Armazenar análise em memória (Redis + pgvector)
   */
  async store(analysis: {
    id: string;
    type: AnalysisType;
    query: string;
    keyPoints: string[];
    recommendations: string[];
    qualityScore: number;
  }): Promise<void> {
    const embedding = await this._generateEmbedding(analysis.query);

    const memory: AnalysisMemory = {
      id: `mem_${analysis.id}`,
      analysisId: analysis.id,
      type: analysis.type,
      query: analysis.query,
      embedding,
      result: {
        keyPoints: analysis.keyPoints,
        recommendations: analysis.recommendations,
        qualityScore: analysis.qualityScore,
      },
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
    };

    // ── Store em Redis (hot cache, 1h TTL)
    await this.redis.setex(
      `analysis:${memory.id}`,
      3600,
      JSON.stringify(memory),
    );

    // ── Store em PostgreSQL (cold storage)
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO analysis_memories
        (id, analysis_id, type, query, embedding, result, created_at, access_count, last_accessed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE
        SET access_count = access_count + 1, last_accessed = NOW()`,
        [
          memory.id,
          memory.analysisId,
          memory.type,
          memory.query,
          JSON.stringify(embedding), // pgvector espera JSON array
          JSON.stringify(memory.result),
          memory.createdAt,
          memory.accessCount,
          memory.lastAccessed,
        ],
      );
    } finally {
      client.release();
    }

    // ── Store em LRU cache
    this._storeLRU(memory);

    this.logger.debug('Análise armazenada em memória', {
      memoryId: memory.id,
      type: memory.type,
    });
  }

  /**
   * Recuperar análises similares (RAG-like)
   */
  async retrieve(
    query: string,
    analysisType: AnalysisType,
    topK: number = 5,
  ): Promise<MemoryRetrievalResult[]> {
    const cacheKey = `similar:${this._hashQuery(query)}:${analysisType}`;

    // ── Step 1: Tentar Redis (hot cache)
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.logger.debug('Memória recuperada de Redis cache', {
          query,
          analysisType,
          count: parsed.length,
        });

        return parsed.map((m: AnalysisMemory & { similarity: number }) => ({
          memory: m,
          similarity: m.similarity || 0.8,
          fromCache: 'redis' as const,
        }));
      }
    } catch (error) {
      this.logger.warn('Erro ao recuperar de Redis', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }

    // ── Step 2: Vector search em PostgreSQL
    const embedding = await this._generateEmbedding(query);
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          id, analysis_id, type, query, embedding, result, created_at, access_count, last_accessed,
          1 - (embedding <=> $1::vector) as similarity
        FROM analysis_memories
        WHERE type = $2 AND (1 - (embedding <=> $1::vector)) > $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4`,
        [
          JSON.stringify(embedding),
          analysisType,
          0.6, // threshold de similaridade mínima
          topK,
        ],
      );

      const memories: MemoryRetrievalResult[] = result.rows.map((row) => ({
        memory: {
          id: row.id,
          analysisId: row.analysis_id,
          type: row.type,
          query: row.query,
          embedding: JSON.parse(row.embedding),
          result: row.result,
          createdAt: row.created_at,
          accessCount: row.access_count,
          lastAccessed: row.last_accessed,
        },
        similarity: row.similarity,
        fromCache: 'pgvector' as const,
      }));

      // ── Step 3: Atualizar access_count
      if (memories.length > 0) {
        const ids = memories.map((m) => m.memory.id);

        await client.query(
          `UPDATE analysis_memories
          SET access_count = access_count + 1, last_accessed = NOW()
          WHERE id = ANY($1)`,
          [ids],
        );
      }

      // ── Step 4: Cache resultado em Redis
      await this.redis.setex(
        cacheKey,
        7200,
        JSON.stringify(memories),
      );

      this.logger.debug('Análises similares recuperadas', {
        query,
        analysisType,
        found: memories.length,
      });

      return memories;
    } finally {
      client.release();
    }
  }

  /**
   * Usar memória para enriquecer contexto (RAG)
   */
  async enhanceContext(
    query: string,
    analysisType: AnalysisType,
    currentContext: ContextChunk[],
  ): Promise<ContextChunk[]> {
    try {
      const similar = await this.retrieve(query, analysisType, 3);

      if (similar.length === 0) {
        return currentContext;
      }

      // Criar chunks sintéticos a partir da memória
      const memoryChunks: ContextChunk[] = similar.map((retrieval, idx) => ({
        id: `memory:${retrieval.memory.id}`,
        data: {
          type: 'memory_insight',
          from: retrieval.memory.analysisId,
          keyPoints: retrieval.memory.result.keyPoints,
          recommendations: retrieval.memory.result.recommendations,
          qualityScore: retrieval.memory.result.qualityScore,
        },
        score:
          0.7 +
          (retrieval.similarity * 0.2) +
          (retrieval.memory.result.qualityScore * 0.1),
        metadata: {
          sourceType: 'memory',
          retrieval: 'semantic',
          similarity: retrieval.similarity.toFixed(3),
          fromCache: retrieval.fromCache,
        },
      }));

      this.logger.info('Contexto enriquecido com memória', {
        originalChunks: currentContext.length,
        addedChunks: memoryChunks.length,
        similarityScores: similar.map((s) => s.similarity.toFixed(2)),
      });

      return [...currentContext, ...memoryChunks];
    } catch (error) {
      this.logger.warn('Falha ao enriquecer contexto com memória', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Fail gracefully: retorna contexto original
      return currentContext;
    }
  }

  /**
   * Limpar memórias antigas (older than X days)
   */
  async cleanup(daysOld: number = 30): Promise<number> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `DELETE FROM analysis_memories
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'`,
      );

      const deleted = result.rowCount || 0;

      this.logger.info('Limpeza de memória realizada', {
        daysOld,
        deleted,
      });

      return deleted;
    } finally {
      client.release();
    }
  }

  /**
   * Obter estatísticas de memória
   */
  async getStats(): Promise<{
    totalMemories: number;
    byType: Record<AnalysisType, number>;
    avgQualityScore: number;
    redisSize: number;
    oldestMemory: Date;
    newestMemory: Date;
  }> {
    const client = await this.pgPool.connect();

    try {
      const stats = await client.query(`
        SELECT
          COUNT(*) as total,
          AVG(result->>'qualityScore')::float as avg_quality,
          MIN(created_at) as oldest,
          MAX(created_at) as newest,
          type,
          COUNT(*) as type_count
        FROM analysis_memories
        GROUP BY type
      `);

      const redisSize = await this.redis.dbsize();

      const byType: Record<AnalysisType, number> = {};

      stats.rows.forEach((row) => {
        byType[row.type as AnalysisType] = parseInt(row.type_count);
      });

      return {
        totalMemories: parseInt(stats.rows[0]?.total || 0),
        byType,
        avgQualityScore: parseFloat(stats.rows[0]?.avg_quality || 0),
        redisSize,
        oldestMemory: new Date(stats.rows[0]?.oldest),
        newestMemory: new Date(stats.rows[0]?.newest),
      };
    } finally {
      client.release();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  /**
   * Gerar embedding para um texto (usando API OpenAI)
   */
  private async _generateEmbedding(text: string): Promise<number[]> {
    // TODO: Implementar chamada real à API OpenAI
    // Por enquanto, retorna um vetor dummy determinístico
    // Em produção, seria:
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: text,
    // });
    // return response.data[0].embedding;

    // Dummy implementation: hash texto em vetor
    return this._hashToVector(text, 1536);
  }

  /**
   * Converter hash de texto em vetor (para testes)
   */
  private _hashToVector(text: string, dimensions: number): number[] {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    const vector: number[] = [];

    for (let i = 0; i < dimensions; i++) {
      vector.push(
        Math.sin((hash + i) * 12.9898) *
          43758.5453,
      );
    }

    // Normalizar
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));

    return vector.map((x) => x / norm);
  }

  /**
   * Hash simples de query para cache key
   */
  private _hashQuery(query: string): string {
    let hash = 0;

    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Armazenar em LRU cache
   */
  private _storeLRU(memory: AnalysisMemory): void {
    this.lruCache.set(memory.id, memory);

    // Se exceder tamanho máximo, remover entrada antiga
    if (this.lruCache.size > this.lruMaxSize) {
      const firstKey = this.lruCache.keys().next().value;

      if (firstKey) {
        this.lruCache.delete(firstKey);
      }
    }
  }
}
