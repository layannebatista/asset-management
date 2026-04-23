import { Logger } from 'winston';
import { EventEmitter } from 'events';

export interface AgentNode {
  id: string;
  name: string;
  analyzer_type: 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk';
  execute: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
  dependencies: string[];
  timeout_ms: number;
}

export interface ExecutionTrace {
  agent_id: string;
  agent_name: string;
  status: 'success' | 'failure';
  duration_ms: number;
  result_keys?: string[];
  error?: string;
}

export class AgentGraphExecutor extends EventEmitter {
  private readonly logger: Logger;
  private nodes: Map<string, AgentNode> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  registerAgent(agent: AgentNode): void {
    this.nodes.set(agent.id, agent);
    this.logger.debug('Agent registered', { agent_id: agent.id, dependencies: agent.dependencies.length });
  }

  async execute(context: Record<string, unknown>): Promise<{
    results: Map<string, Record<string, unknown>>;
    execution_trace: ExecutionTrace[];
    total_time_ms: number;
  }> {
    const start = Date.now();

    if (this.hasCycle()) {
      throw new Error('Circular dependency detected in agent graph');
    }

    const execution_order = this.topologicalSort();
    const results = new Map<string, Record<string, unknown>>();
    const execution_trace: ExecutionTrace[] = [];

    for (const agent_id of execution_order) {
      const agent = this.nodes.get(agent_id);
      if (!agent) continue;

      const agent_start = Date.now();
      try {
        const enriched_context = { ...context, _agent_inputs: new Map() };
        for (const dep of agent.dependencies) {
          const dep_result = results.get(dep);
          if (dep_result) {
            (enriched_context._agent_inputs as Map<string, unknown>).set(dep, dep_result);
          }
        }

        const result = await Promise.race([
          agent.execute(enriched_context),
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout`)), agent.timeout_ms)),
        ]);

        results.set(agent_id, result as Record<string, unknown>);
        execution_trace.push({
          agent_id,
          agent_name: agent.name,
          status: 'success',
          duration_ms: Date.now() - agent_start,
          result_keys: Object.keys(result as Record<string, unknown>),
        });
      } catch (error) {
        execution_trace.push({
          agent_id,
          agent_name: agent.name,
          status: 'failure',
          error: String(error),
          duration_ms: Date.now() - agent_start,
        });
      }
    }

    this.logger.info('Agent graph execution completed', {
      agents_executed: results.size,
      total_time_ms: Date.now() - start,
      errors: execution_trace.filter((t) => t.status === 'failure').length,
    });

    return { results, execution_trace, total_time_ms: Date.now() - start };
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = this.nodes.get(id);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }
      result.push(id);
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }
    return result;
  }

  private hasCycle(): boolean {
    const visited = new Set<string>();
    const rec_stack = new Set<string>();

    const dfs = (id: string): boolean => {
      visited.add(id);
      rec_stack.add(id);
      const node = this.nodes.get(id);
      if (node) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep)) {
            if (dfs(dep)) return true;
          } else if (rec_stack.has(dep)) {
            return true;
          }
        }
      }
      rec_stack.delete(id);
      return false;
    };

    for (const id of this.nodes.keys()) {
      if (!visited.has(id) && dfs(id)) return true;
    }
    return false;
  }
}
