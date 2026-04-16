import { describe, it, expect, beforeEach } from '@jest/globals';
import { Logger } from 'winston';
import { AgentGraph, AgentNode } from '../../src/agents/AgentGraph';
import { IAnalyzer } from '../../src/types/analysis.types';

// Mock implementations
class MockAnalyzer implements IAnalyzer {
  constructor(private delay: number = 10, private shouldFail = false, private resultValue: unknown = {}) {}

  async analyze(input: unknown): Promise<unknown> {
    await new Promise(resolve => setTimeout(resolve, this.delay));

    if (this.shouldFail) {
      throw new Error('MockAnalyzer error');
    }

    return {
      ...this.resultValue,
      input,
      executedAt: new Date(),
    };
  }
}

describe('AgentGraph - DAG-based multi-agent orchestration', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;
  });

  // ════════════════════════════════════════════════════════════════
  // Basic graph operations
  // ════════════════════════════════════════════════════════════════

  it('should add nodes to graph', () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer();

    graph.addNode({
      id: 'node1',
      name: 'Node 1',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    expect(graph).toBeDefined();
  });

  it('should prevent duplicate node IDs', () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer();

    graph.addNode({
      id: 'node1',
      name: 'Node 1',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    expect(() => {
      graph.addNode({
        id: 'node1',
        name: 'Duplicate',
        type: 'analyzer',
        dependencies: [],
        analyzer,
      });
    }).toThrow('already exists');
  });

  // ════════════════════════════════════════════════════════════════
  // Topological sort and execution order
  // ════════════════════════════════════════════════════════════════

  it('should execute single node without dependencies', async () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer(10, false, { result: 'success' });

    graph.addNode({
      id: 'node1',
      name: 'Node 1',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('completed');
    expect(state.nodeResults.get('node1')).toBeDefined();
    expect(state.errors.size).toBe(0);
  });

  it('should respect dependency order (A → B → C)', async () => {
    const graph = new AgentGraph(logger);
    const executionOrder: string[] = [];

    const makeAnalyzer = (id: string) => ({
      analyze: async () => {
        executionOrder.push(id);
        return { id };
      },
    });

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer('A') as IAnalyzer,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: makeAnalyzer('B') as IAnalyzer,
    });

    graph.addNode({
      id: 'C',
      name: 'C',
      type: 'analyzer',
      dependencies: ['B'],
      analyzer: makeAnalyzer('C') as IAnalyzer,
    });

    await graph.execute({});

    expect(executionOrder).toEqual(['A', 'B', 'C']);
  });

  it('should parallelize independent nodes', async () => {
    const graph = new AgentGraph(logger);
    const timings = new Map<string, { start: number; end: number }>();

    const makeAnalyzer = (id: string, delay: number) => ({
      analyze: async () => {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, delay));
        timings.set(id, { start, end: Date.now() });
        return { id };
      },
    });

    // A and B are independent, should run in parallel
    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer('A', 50) as IAnalyzer,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer('B', 50) as IAnalyzer,
    });

    // C depends on both
    graph.addNode({
      id: 'C',
      name: 'C',
      type: 'analyzer',
      dependencies: ['A', 'B'],
      analyzer: makeAnalyzer('C', 10) as IAnalyzer,
    });

    const start = Date.now();
    const state = await graph.execute({});
    const total = Date.now() - start;

    // If truly parallel: ~50 + 50 + 10 = 110ms
    // If sequential: 50 + 50 + 50 + 10 = 160ms
    expect(total).toBeLessThan(150);
    expect(state.parallelGroups.length).toBe(3); // [A,B], [C]
  });

  // ════════════════════════════════════════════════════════════════
  // Cycle detection
  // ════════════════════════════════════════════════════════════════

  it('should detect cycles in graph', () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer();

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: ['B'], // Depends on B
      analyzer,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: ['A'], // Depends on A → CYCLE
      analyzer,
    });

    expect(() => {
      graph.execute({});
    }).rejects.toThrow(/Cycle/);
  });

  // ════════════════════════════════════════════════════════════════
  // Error handling and resilience
  // ════════════════════════════════════════════════════════════════

  it('should stop execution on critical node failure', async () => {
    const graph = new AgentGraph(logger);
    const analyzer1 = new MockAnalyzer(10, false, { step: 1 });
    const analyzer2 = new MockAnalyzer(10, true); // Fails

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: analyzer1,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: analyzer2,
      optional: false,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('failed');
    expect(state.errors.size).toBe(1);
    expect(state.errors.has('B')).toBe(true);
  });

  it('should continue on optional node failure', async () => {
    const graph = new AgentGraph(logger);
    const analyzer1 = new MockAnalyzer(10, false, { step: 1 });
    const analyzer2 = new MockAnalyzer(10, true); // Fails but optional
    const analyzer3 = new MockAnalyzer(10, false, { step: 3 });

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: analyzer1,
    });

    graph.addNode({
      id: 'B',
      name: 'B (optional)',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: analyzer2,
      optional: true,
    });

    graph.addNode({
      id: 'C',
      name: 'C',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: analyzer3,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('completed');
    expect(state.errors.size).toBe(1);
    expect(state.nodeResults.has('C')).toBe(true);
  });

  // ════════════════════════════════════════════════════════════════
  // Timeout and retry
  // ════════════════════════════════════════════════════════════════

  it('should timeout slow nodes', async () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer(5000); // Very slow

    graph.addNode({
      id: 'slow_node',
      name: 'Slow Node',
      type: 'analyzer',
      dependencies: [],
      analyzer,
      timeout: 100, // 100ms timeout
    });

    const state = await graph.execute({});

    expect(state.status).toBe('failed');
    expect(state.errors.has('slow_node')).toBe(true);
  });

  it('should retry failed nodes', async () => {
    const graph = new AgentGraph(logger);
    let attempts = 0;

    const retryAnalyzer = {
      analyze: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry me');
        }
        return { success: true, attempts };
      },
    };

    graph.addNode({
      id: 'retry_node',
      name: 'Retry Node',
      type: 'analyzer',
      dependencies: [],
      analyzer: retryAnalyzer as IAnalyzer,
      retryCount: 3,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('completed');
    expect(state.nodeResults.get('retry_node')).toEqual({ success: true, attempts: 3 });
  });

  // ════════════════════════════════════════════════════════════════
  // Dependency data flow
  // ════════════════════════════════════════════════════════════════

  it('should pass dependency results to dependent nodes', async () => {
    const graph = new AgentGraph(logger);
    let receivedInput: any;

    const analyzer1 = {
      analyze: async () => ({ data: 'from_A' }),
    };

    const analyzer2 = {
      analyze: async (input: any) => {
        receivedInput = input;
        return { received: input };
      },
    };

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: analyzer1 as IAnalyzer,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: analyzer2 as IAnalyzer,
    });

    const state = await graph.execute({});

    expect(receivedInput).toBeDefined();
    expect(receivedInput.dependencyResults.A).toEqual({ data: 'from_A' });
  });

  // ════════════════════════════════════════════════════════════════
  // Complex scenarios
  // ════════════════════════════════════════════════════════════════

  it('should handle diamond dependency (A ← B,C; D depends on B,C)', async () => {
    const graph = new AgentGraph(logger);
    const execOrder: string[] = [];

    const makeAnalyzer = (id: string) => ({
      analyze: async () => {
        execOrder.push(id);
        return { id };
      },
    });

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer('A') as IAnalyzer,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: makeAnalyzer('B') as IAnalyzer,
    });

    graph.addNode({
      id: 'C',
      name: 'C',
      type: 'analyzer',
      dependencies: ['A'],
      analyzer: makeAnalyzer('C') as IAnalyzer,
    });

    graph.addNode({
      id: 'D',
      name: 'D',
      type: 'analyzer',
      dependencies: ['B', 'C'],
      analyzer: makeAnalyzer('D') as IAnalyzer,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('completed');
    expect(execOrder[0]).toBe('A');
    expect(execOrder[execOrder.length - 1]).toBe('D');
    expect(execOrder.length).toBe(4);
  });

  it('should compute parallel efficiency', async () => {
    const graph = new AgentGraph(logger);

    const makeAnalyzer = () => ({
      analyze: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {};
      },
    });

    graph.addNode({
      id: 'A',
      name: 'A',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer() as IAnalyzer,
    });

    graph.addNode({
      id: 'B',
      name: 'B',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer() as IAnalyzer,
    });

    const state = await graph.execute({});
    const metrics = graph.getMetrics(state);

    // With 2 parallel nodes, efficiency should be high (~2)
    expect(metrics.parallelEfficiency).toBeGreaterThan(1.5);
  });

  it('should generate correct graph visualization', () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer();

    graph.addNode({
      id: 'analyze',
      name: 'Analyze',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    graph.addNode({
      id: 'synthesize',
      name: 'Synthesize',
      type: 'synthesizer',
      dependencies: ['analyze'],
      analyzer,
    });

    const viz = graph.visualize();

    expect(viz).toContain('AgentGraph Structure');
    expect(viz).toContain('Analyze');
    expect(viz).toContain('Synthesize');
    expect(viz).toContain('depends on');
  });

  // ════════════════════════════════════════════════════════════════
  // Metrics and monitoring
  // ════════════════════════════════════════════════════════════════

  it('should track execution metrics for each node', async () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer(50);

    graph.addNode({
      id: 'node1',
      name: 'Node 1',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    const state = await graph.execute({});
    const metrics = graph.getMetrics(state);

    expect(metrics.nodeMetrics.get('node1')).toBeDefined();
    expect(metrics.nodeMetrics.get('node1')!.duration).toBeGreaterThan(40);
    expect(metrics.totalDuration).toBeGreaterThan(40);
  });

  it('should include execution start and end times', async () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer(10);

    graph.addNode({
      id: 'node1',
      name: 'Node 1',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    const state = await graph.execute({});

    expect(state.startTime).toBeDefined();
    expect(state.endTime).toBeDefined();
    expect(state.endTime!.getTime()).toBeGreaterThan(state.startTime.getTime());
  });

  // ════════════════════════════════════════════════════════════════
  // Real-world scenarios
  // ════════════════════════════════════════════════════════════════

  it('should handle incident investigation workflow', async () => {
    const graph = new AgentGraph(logger);

    const makeAnalyzer = (id: string) => ({
      analyze: async () => ({ [id]: true }),
    });

    // Data collection phase
    graph.addNode({
      id: 'collect_metrics',
      name: 'Collect Metrics',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer('metrics') as IAnalyzer,
    });

    graph.addNode({
      id: 'collect_logs',
      name: 'Collect Logs',
      type: 'analyzer',
      dependencies: [],
      analyzer: makeAnalyzer('logs') as IAnalyzer,
    });

    // Analysis phase
    graph.addNode({
      id: 'detect_anomalies',
      name: 'Detect Anomalies',
      type: 'filter',
      dependencies: ['collect_metrics', 'collect_logs'],
      analyzer: makeAnalyzer('anomalies') as IAnalyzer,
    });

    // Root cause
    graph.addNode({
      id: 'root_cause',
      name: 'Root Cause Analysis',
      type: 'analyzer',
      dependencies: ['detect_anomalies'],
      analyzer: makeAnalyzer('root_cause') as IAnalyzer,
    });

    // Synthesis
    graph.addNode({
      id: 'synthesis',
      name: 'Synthesis',
      type: 'synthesizer',
      dependencies: ['root_cause'],
      analyzer: makeAnalyzer('report') as IAnalyzer,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('completed');
    expect(state.nodeResults.size).toBe(5);
    expect(state.parallelGroups[0]).toContain('collect_metrics');
    expect(state.parallelGroups[0]).toContain('collect_logs');
  });

  it('should handle mixed analyzer types', async () => {
    const graph = new AgentGraph(logger);
    const analyzer = new MockAnalyzer();

    graph.addNode({
      id: 'analyze',
      name: 'Analyze',
      type: 'analyzer',
      dependencies: [],
      analyzer,
    });

    graph.addNode({
      id: 'filter',
      name: 'Filter',
      type: 'filter',
      dependencies: ['analyze'],
      analyzer,
    });

    graph.addNode({
      id: 'synthesize',
      name: 'Synthesize',
      type: 'synthesizer',
      dependencies: ['filter'],
      analyzer,
    });

    graph.addNode({
      id: 'evaluate',
      name: 'Evaluate',
      type: 'evaluator',
      dependencies: ['synthesize'],
      analyzer,
    });

    const state = await graph.execute({});

    expect(state.status).toBe('completed');
    expect(state.executionOrder).toEqual(['analyze', 'filter', 'synthesize', 'evaluate']);
  });
});
