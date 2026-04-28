import { Logger } from 'winston';
import { IAnalyzer } from '../types/enterprise.types';

/**
 * AgentGraph: DAG-based multi-agent orchestration
 *
 * Transforms parallel agent execution into a dependency graph:
 * - Topological sort for execution order
 * - Data flow between nodes
 * - Parallel execution where possible
 * - Failure isolation
 *
 * Graph structure allows:
 * 1. Node A: Collect metrics (no deps) → runs first
 * 2. Node B: Detect patterns (depends on A) → waits for A
 * 3. Node C: Analyze root cause (depends on B) → waits for B
 * 4. Node D: Assess impact (depends on B, C) → waits for both
 * 5. Node E: Synthesize (depends on D) → final output
 */

export type NodeType = 'analyzer' | 'filter' | 'synthesizer' | 'evaluator';

export interface AgentNode {
  id: string;
  name: string;
  type: NodeType;
  dependencies: string[]; // IDs of nodes that must execute first
  analyzer: IAnalyzer;
  timeout?: number; // ms, default 30000
  retryCount?: number; // default 0
  optional?: boolean; // if true, failure doesn't block dependents
}

export interface AgentGraphState {
  nodeResults: Map<string, unknown>;
  errors: Map<string, Error>;
  metrics: Map<string, number>; // execution time, etc
  executionOrder: string[];
  parallelGroups: string[][]; // which nodes can run in parallel
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface ExecutionMetrics {
  totalDuration: number;
  nodeMetrics: Map<string, {
    duration: number;
    retries: number;
    inputSize: number;
    outputSize: number;
  }>;
  parallelEfficiency: number; // 0-1, how well we parallelized
}

export class AgentGraph {
  private nodes: Map<string, AgentNode> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Add a node to the graph
   */
  addNode(node: AgentNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node ${node.id} already exists`);
    }

    // Validate dependencies exist
    for (const depId of node.dependencies) {
      if (!this.nodes.has(depId)) {
        this.logger.warn(`Node ${node.id} depends on non-existent node ${depId}`);
      }
    }

    this.nodes.set(node.id, node);
    this.logger.debug(`Node added: ${node.id}`, {
      type: node.type,
      dependencies: node.dependencies,
    });
  }

  /**
   * Execute graph: topological sort + parallel execution
   */
  async execute(input: unknown): Promise<AgentGraphState> {
    const state: AgentGraphState = {
      nodeResults: new Map(),
      errors: new Map(),
      metrics: new Map(),
      executionOrder: [],
      parallelGroups: [],
      startTime: new Date(),
      status: 'executing',
    };

    // Step 1: Validate graph (no cycles)
    this._validateGraph();

    // Step 2: Topological sort
    const executionOrder = this._topologicalSort();
    state.executionOrder = executionOrder;

    // Step 3: Identify parallel groups
    state.parallelGroups = this._identifyParallelGroups(executionOrder);

    this.logger.info('🚀 AgentGraph execution starting', {
      totalNodes: this.nodes.size,
      executionOrder,
      parallelGroups: state.parallelGroups,
    });

    // Step 4: Execute groups in order
    for (const group of state.parallelGroups) {
      const groupResults = await Promise.allSettled(
        group.map(nodeId => this._executeNode(nodeId, input, state))
      );

      // Check for failures
      for (let i = 0; i < groupResults.length; i++) {
        const result = groupResults[i];
        const nodeId = group[i];
        const node = this.nodes.get(nodeId)!;

        if (result.status === 'rejected') {
          state.errors.set(nodeId, result.reason);

          if (!node.optional) {
            state.status = 'failed';
            this.logger.error(`❌ Node failed: ${nodeId}`, {
              error: result.reason,
              blocking: true,
            });
            return state;
          } else {
            this.logger.warn(`⚠️ Optional node failed: ${nodeId}`, {
              error: result.reason,
            });
          }
        }
      }
    }

    state.endTime = new Date();
    state.status = 'completed';

    const duration = state.endTime.getTime() - state.startTime.getTime();
    this.logger.info('✅ AgentGraph execution completed', {
      duration: `${duration}ms`,
      nodes: this.nodes.size,
      errors: state.errors.size,
      parallelEfficiency: this._calculateParallelEfficiency(state),
    });

    return state;
  }

  /**
   * Get result of a node
   */
  getNodeResult(state: AgentGraphState, nodeId: string): unknown {
    return state.nodeResults.get(nodeId);
  }

  /**
   * Get execution metrics
   */
  getMetrics(state: AgentGraphState): ExecutionMetrics {
    const totalDuration = state.endTime
      ? state.endTime.getTime() - state.startTime.getTime()
      : 0;

    const nodeMetrics = new Map<string, {
      duration: number;
      retries: number;
      inputSize: number;
      outputSize: number;
    }>();

    for (const [nodeId] of this.nodes) {
      const duration = state.metrics.get(`${nodeId}:duration`) || 0;
      const retries = state.metrics.get(`${nodeId}:retries`) || 0;
      const inputSize = state.metrics.get(`${nodeId}:inputSize`) || 0;
      const outputSize = state.metrics.get(`${nodeId}:outputSize`) || 0;

      nodeMetrics.set(nodeId, { duration, retries, inputSize, outputSize });
    }

    return {
      totalDuration,
      nodeMetrics,
      parallelEfficiency: this._calculateParallelEfficiency(state),
    };
  }

  /**
   * Visualize graph as ASCII
   */
  visualize(): string {
    let output = '🔗 AgentGraph Structure\n\n';

    const executionOrder = this._topologicalSort();
    const visitedNodes = new Set<string>();

    for (const nodeId of executionOrder) {
      const node = this.nodes.get(nodeId)!;
      const indent = node.dependencies.length === 0 ? '' : '  ';
      const icon = node.type === 'analyzer' ? '📊' : node.type === 'filter' ? '🔍' : '🎯';

      output += `${indent}${icon} ${node.name} (${nodeId})\n`;

      if (node.dependencies.length > 0) {
        output += `${indent}   ↑ depends on: ${node.dependencies.join(', ')}\n`;
      }

      visitedNodes.add(nodeId);
    }

    return output;
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private async _executeNode(
    nodeId: string,
    input: unknown,
    state: AgentGraphState,
  ): Promise<void> {
    const node = this.nodes.get(nodeId)!;
    const nodeStartTime = Date.now();

    try {
      // Prepare node input (merge with dependency results)
      const nodeInput = this._prepareNodeInput(input, node, state);

      // Execute with timeout and retries
      let result: unknown;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= (node.retryCount || 0); attempt++) {
        try {
          const timeoutMs = node.timeout || 30000;
          result = await Promise.race([
            node.analyzer.analyze(nodeInput),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
            ),
          ]);

          state.nodeResults.set(nodeId, result);
          break;
        } catch (error) {
          lastError = error as Error;
          state.metrics.set(`${nodeId}:retries`, attempt);

          if (attempt < (node.retryCount || 0)) {
            this.logger.warn(`Retry attempt ${attempt + 1} for ${nodeId}`, {
              error: (error as Error).message,
            });
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
      }

      if (!state.nodeResults.has(nodeId) && lastError) {
        throw lastError;
      }

      const nodeDuration = Date.now() - nodeStartTime;
      state.metrics.set(`${nodeId}:duration`, nodeDuration);

      this.logger.debug(`Node executed: ${nodeId}`, {
        duration: `${nodeDuration}ms`,
        type: node.type,
      });
    } catch (error) {
      state.errors.set(nodeId, error as Error);
      throw error;
    }
  }

  private _prepareNodeInput(
    input: unknown,
    node: AgentNode,
    state: AgentGraphState,
  ): unknown {
    // Merge input with results from dependencies
    const inputObject = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
    const mergedContext: any = {
      ...inputObject,
      nodeId: node.id,
      dependencyResults: {},
    };

    for (const depId of node.dependencies) {
      const depResult = state.nodeResults.get(depId);
      if (depResult) {
        mergedContext.dependencyResults[depId] = depResult;
      }
    }

    return mergedContext;
  }

  private _topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Cycle detected involving ${nodeId}`);
      }

      visiting.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      sorted.push(nodeId);
    };

    for (const [nodeId] of this.nodes) {
      visit(nodeId);
    }

    return sorted;
  }

  private _validateGraph(): void {
    // Check for cycles (topological sort will throw)
    try {
      this._topologicalSort();
    } catch (error) {
      this.logger.error('Graph validation failed: cycle detected');
      throw error;
    }

    // Check for missing dependencies
    for (const [nodeId, node] of this.nodes) {
      for (const depId of node.dependencies) {
        if (!this.nodes.has(depId)) {
          throw new Error(`Node ${nodeId} depends on non-existent node ${depId}`);
        }
      }
    }
  }

  private _identifyParallelGroups(executionOrder: string[]): string[][] {
    const groups: string[][] = [];
    const nodeDepths = new Map<string, number>();

    // Calculate depth for each node (max depth of dependencies + 1)
    const calculateDepth = (nodeId: string, visited = new Set<string>()): number => {
      if (nodeDepths.has(nodeId)) return nodeDepths.get(nodeId)!;
      if (visited.has(nodeId)) return 0; // Cycle prevention

      visited.add(nodeId);
      const node = this.nodes.get(nodeId);
      if (!node || node.dependencies.length === 0) return 0;

      const maxDepDepth = Math.max(
        ...node.dependencies.map(depId => calculateDepth(depId, new Set(visited)))
      );

      const depth = maxDepDepth + 1;
      nodeDepths.set(nodeId, depth);
      return depth;
    };

    for (const nodeId of executionOrder) {
      calculateDepth(nodeId);
    }

    // Group nodes by depth
    const depthMap = new Map<number, string[]>();
    for (const [nodeId, depth] of nodeDepths) {
      if (!depthMap.has(depth)) {
        depthMap.set(depth, []);
      }
      depthMap.get(depth)!.push(nodeId);
    }

    // Build groups in order of depth
    const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
    for (const depth of sortedDepths) {
      groups.push(depthMap.get(depth)!);
    }

    return groups;
  }

  private _calculateParallelEfficiency(state: AgentGraphState): number {
    if (state.parallelGroups.length === 0) return 0;

    let maxGroupDuration = 0;
    let totalDuration = 0;

    for (const group of state.parallelGroups) {
      let groupDuration = 0;
      for (const nodeId of group) {
        const nodeDuration = state.metrics.get(`${nodeId}:duration`) || 0;
        groupDuration = Math.max(groupDuration, nodeDuration);
        totalDuration += nodeDuration;
      }
      maxGroupDuration += groupDuration;
    }

    // Efficiency = sequential time / parallel time
    return totalDuration > 0 ? maxGroupDuration / totalDuration : 0;
  }
}
