import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { MemoryLayer, AnalysisMemory } from '../../src/memory/MemoryLayer';
import { AnalysisType } from '../../src/types/analysis.types';

describe('MemoryLayer', () => {
  let memoryLayer: MemoryLayer;
  let mockRedis: jest.Mocked<Redis>;
  let mockPool: jest.Mocked<Pool>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRedis = {
      setex: vi.fn().mockResolvedValue('OK'),
      get: vi.fn(),
      dbsize: vi.fn().mockResolvedValue(100),
    } as unknown as jest.Mocked<Redis>;

    mockPool = {
      connect: vi.fn(),
    } as unknown as jest.Mocked<Pool>;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as jest.Mocked<Logger>;

    memoryLayer = new MemoryLayer(mockRedis, mockPool, mockLogger);
  });

  describe('initialize', () => {
    it('should create pgvector extension and tables', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rowCount: 0 }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      await memoryLayer.initialize();

      expect(mockClient.query).toHaveBeenCalledWith('CREATE EXTENSION IF NOT EXISTS vector');
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX'));
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle already existing table gracefully', async () => {
      const mockClient = {
        query: vi.fn().mockRejectedValueOnce(new Error('already exists')),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      // Não deve lançar erro
      await expect(memoryLayer.initialize()).resolves.not.toThrow();
    });
  });

  describe('store', () => {
    it('should store analysis in Redis and PostgreSQL', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rowCount: 1 }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const analysis = {
        id: 'analysis_123',
        type: AnalysisType.INCIDENT,
        query: 'Root cause of latency spike?',
        keyPoints: ['Database slow', 'Connection pool exhausted'],
        recommendations: ['Restart DB', 'Optimize queries'],
        qualityScore: 0.85,
      };

      await memoryLayer.store(analysis);

      // Verificar Redis
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('mem_analysis_123'),
        3600,
        expect.any(String),
      );

      // Verificar PostgreSQL
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO analysis_memories'),
        expect.any(Array),
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Análise armazenada em memória',
        expect.any(Object),
      );
    });

    it('should generate embeddings for analysis', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rowCount: 1 }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const analysis = {
        id: 'analysis_456',
        type: AnalysisType.OBSERVABILITY,
        query: 'What caused the latency spike?',
        keyPoints: [],
        recommendations: [],
        qualityScore: 0.8,
      };

      await memoryLayer.store(analysis);

      // Verificar que embedding foi criado
      const callArgs = mockClient.query.mock.calls[0][1];
      const embeddingArg = callArgs[4]; // embedding é o 5º argumento

      expect(embeddingArg).toBeDefined();
      // Embedding deve ser um JSON array string
      const embedding = JSON.parse(embeddingArg);
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });
  });

  describe('retrieve', () => {
    it('should retrieve from Redis cache first', async () => {
      const cached = [
        {
          memory: {
            id: 'mem_123',
            analysisId: 'analysis_123',
            type: AnalysisType.INCIDENT,
            query: 'Root cause?',
            embedding: [0.1, 0.2],
            result: { keyPoints: [], recommendations: [], qualityScore: 0.85 },
            createdAt: new Date(),
            accessCount: 5,
            lastAccessed: new Date(),
          },
          similarity: 0.92,
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(cached));

      const results = await memoryLayer.retrieve(
        'What caused the spike?',
        AnalysisType.INCIDENT,
        5,
      );

      expect(results).toHaveLength(1);
      expect(results[0].fromCache).toBe('redis');
      expect(results[0].similarity).toBe(0.92);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Memória recuperada de Redis cache',
        expect.any(Object),
      );
    });

    it('should fallback to pgvector if not in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: 'mem_456',
              analysis_id: 'analysis_456',
              type: AnalysisType.INCIDENT,
              query: 'Previous incident',
              embedding: JSON.stringify([0.15, 0.25]),
              result: JSON.stringify({
                keyPoints: ['Root cause A'],
                recommendations: ['Fix A'],
                qualityScore: 0.88,
              }),
              created_at: new Date(),
              access_count: 3,
              last_accessed: new Date(),
              similarity: 0.87,
            },
          ],
        }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const results = await memoryLayer.retrieve(
        'Latency issues',
        AnalysisType.INCIDENT,
        5,
      );

      expect(results).toHaveLength(1);
      expect(results[0].fromCache).toBe('pgvector');
      expect(results[0].memory.analysisId).toBe('analysis_456');
      expect(mockClient.query).toHaveBeenCalled();
    });

    it('should update access count when retrieving', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'mem_789',
                analysis_id: 'analysis_789',
                type: AnalysisType.OBSERVABILITY,
                query: 'Query',
                embedding: JSON.stringify([0.1]),
                result: JSON.stringify({
                  keyPoints: [],
                  recommendations: [],
                  qualityScore: 0.8,
                }),
                created_at: new Date(),
                access_count: 1,
                last_accessed: new Date(),
                similarity: 0.75,
              },
            ],
          })
          .mockResolvedValueOnce({ rowCount: 1 }), // Update query
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const results = await memoryLayer.retrieve('query', AnalysisType.OBSERVABILITY);

      expect(results).toHaveLength(1);

      // Verificar que UPDATE foi chamado
      const updateCall = mockClient.query.mock.calls.find((call) =>
        call[0].includes('UPDATE analysis_memories'),
      );

      expect(updateCall).toBeDefined();
    });

    it('should respect similarity threshold', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      await memoryLayer.retrieve('query', AnalysisType.RISK);

      // Verificar que query incluiu threshold
      const queryCall = mockClient.query.mock.calls[0];
      const queryText = queryCall[0];

      expect(queryText).toContain('0.6'); // threshold padrão
    });
  });

  describe('enhanceContext', () => {
    it('should return original context if no similar analyses found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const originalContext = [
        {
          id: 'chunk_1',
          data: { content: 'Some data' },
          score: 0.8,
          metadata: {},
        },
      ];

      const enhanced = await memoryLayer.enhanceContext(
        'query',
        AnalysisType.INCIDENT,
        originalContext,
      );

      expect(enhanced).toEqual(originalContext);
    });

    it('should add memory chunks to context', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: 'mem_001',
              analysis_id: 'analysis_001',
              type: AnalysisType.INCIDENT,
              query: 'Previous incident',
              embedding: JSON.stringify([0.1]),
              result: JSON.stringify({
                keyPoints: ['Key point 1', 'Key point 2'],
                recommendations: ['Rec 1'],
                qualityScore: 0.9,
              }),
              created_at: new Date(),
              access_count: 5,
              last_accessed: new Date(),
              similarity: 0.89,
            },
          ],
        }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const originalContext = [
        {
          id: 'chunk_1',
          data: {},
          score: 0.8,
          metadata: {},
        },
      ];

      const enhanced = await memoryLayer.enhanceContext(
        'query',
        AnalysisType.INCIDENT,
        originalContext,
      );

      expect(enhanced.length).toBeGreaterThan(originalContext.length);
      expect(enhanced.some((c) => c.id.startsWith('memory:'))).toBe(true);
    });

    it('should fail gracefully if memory retrieval fails', async () => {
      const mockError = new Error('Database error');
      mockRedis.get.mockRejectedValue(mockError);

      const originalContext = [{ id: 'chunk_1', data: {}, score: 0.8, metadata: {} }];

      const enhanced = await memoryLayer.enhanceContext(
        'query',
        AnalysisType.OBSERVABILITY,
        originalContext,
      );

      expect(enhanced).toEqual(originalContext);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Falha ao enriquecer contexto com memória',
        expect.any(Object),
      );
    });
  });

  describe('cleanup', () => {
    it('should delete old memories', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rowCount: 5 }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const deleted = await memoryLayer.cleanup(30);

      expect(deleted).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM analysis_memories'),
        [],
      );
      expect(mockClient.query.mock.calls[0][0]).toContain('30 days');
    });
  });

  describe('getStats', () => {
    it('should return memory statistics', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              total: 150,
              type: AnalysisType.INCIDENT,
              type_count: 50,
              avg_quality: 0.85,
              oldest: new Date('2026-01-01'),
              newest: new Date('2026-01-15'),
            },
            {
              total: 150,
              type: AnalysisType.OBSERVABILITY,
              type_count: 100,
              avg_quality: 0.82,
              oldest: new Date('2026-01-01'),
              newest: new Date('2026-01-15'),
            },
          ],
        }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const stats = await memoryLayer.getStats();

      expect(stats.totalMemories).toBeGreaterThan(0);
      expect(stats.avgQualityScore).toBeGreaterThan(0);
      expect(stats.redisSize).toBe(100);
      expect(stats.oldestMemory).toBeInstanceOf(Date);
      expect(stats.newestMemory).toBeInstanceOf(Date);
      expect(Object.keys(stats.byType).length).toBeGreaterThan(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle incident analysis storage and retrieval', async () => {
      const mockClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({ rowCount: 1 })
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'mem_incident_001',
                analysis_id: 'incident_001',
                type: AnalysisType.INCIDENT,
                query: 'Database connection pool exhausted',
                embedding: JSON.stringify([0.1, 0.2]),
                result: JSON.stringify({
                  keyPoints: [
                    'Connection leak detected',
                    'Recently changed max connections',
                  ],
                  recommendations: [
                    'Review connection lifecycle',
                    'Add connection metrics',
                  ],
                  qualityScore: 0.92,
                }),
                created_at: new Date(),
                access_count: 3,
                last_accessed: new Date(),
                similarity: 0.88,
              },
            ],
          })
          .mockResolvedValueOnce({ rowCount: 1 }),
        release: vi.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      // Store
      await memoryLayer.store({
        id: 'incident_001',
        type: AnalysisType.INCIDENT,
        query: 'Database connection pool exhausted',
        keyPoints: ['Connection leak detected', 'Recently changed max connections'],
        recommendations: ['Review connection lifecycle', 'Add connection metrics'],
        qualityScore: 0.92,
      });

      // Retrieve
      mockRedis.get.mockResolvedValue(null);
      const retrieved = await memoryLayer.retrieve(
        'Connection pool issues',
        AnalysisType.INCIDENT,
      );

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].memory.result.qualityScore).toBe(0.92);
    });
  });
});
