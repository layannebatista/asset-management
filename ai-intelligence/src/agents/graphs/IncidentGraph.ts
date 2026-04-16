import { Logger } from 'winston';
import { AgentGraph, AgentNode } from '../AgentGraph';
import { IAnalyzer } from '../../types/analysis.types';

/**
 * IncidentGraph: Complete incident investigation workflow
 *
 * Flow:
 * 1. Collect Metrics (metrics, logs, traces) [parallel]
 * 2. Detect Anomalies (what went wrong) [parallel]
 * 3. Root Cause Analysis (why it happened) [depends on 1,2]
 * 4. Impact Assessment (how much was affected) [depends on 1,2]
 * 5. Remediation Planning (how to fix) [depends on 3,4]
 * 6. Synthesis & Report (final output) [depends on 5]
 */

export class IncidentGraphBuilder {
  static build(
    metricsAnalyzer: IAnalyzer,
    logAnalyzer: IAnalyzer,
    traceAnalyzer: IAnalyzer,
    anomalyDetector: IAnalyzer,
    rootCauseAnalyzer: IAnalyzer,
    impactAnalyzer: IAnalyzer,
    remediationPlanner: IAnalyzer,
    synthesizer: IAnalyzer,
    logger: Logger,
  ): AgentGraph {
    const graph = new AgentGraph(logger);

    // ── Phase 1: Collect data (no dependencies, all parallel)
    graph.addNode({
      id: 'collect_metrics',
      name: 'Collect Metrics',
      type: 'analyzer',
      dependencies: [],
      analyzer: metricsAnalyzer,
      timeout: 10000,
      retryCount: 1,
    });

    graph.addNode({
      id: 'collect_logs',
      name: 'Collect Logs',
      type: 'analyzer',
      dependencies: [],
      analyzer: logAnalyzer,
      timeout: 15000,
      retryCount: 2,
    });

    graph.addNode({
      id: 'collect_traces',
      name: 'Collect Traces',
      type: 'analyzer',
      dependencies: [],
      analyzer: traceAnalyzer,
      timeout: 10000,
      retryCount: 1,
      optional: true, // Traces are nice to have but not critical
    });

    // ── Phase 2: Detect anomalies (parallel, depends on metrics + logs)
    graph.addNode({
      id: 'detect_anomalies',
      name: 'Detect Anomalies',
      type: 'filter',
      dependencies: ['collect_metrics', 'collect_logs'],
      analyzer: anomalyDetector,
      timeout: 20000,
      retryCount: 0,
    });

    // ── Phase 3a: Root cause analysis (depends on collected data + anomalies)
    graph.addNode({
      id: 'root_cause_analysis',
      name: 'Root Cause Analysis',
      type: 'analyzer',
      dependencies: ['collect_metrics', 'collect_logs', 'collect_traces', 'detect_anomalies'],
      analyzer: rootCauseAnalyzer,
      timeout: 30000,
      retryCount: 1,
    });

    // ── Phase 3b: Impact assessment (depends on data + anomalies)
    graph.addNode({
      id: 'impact_assessment',
      name: 'Impact Assessment',
      type: 'analyzer',
      dependencies: ['collect_metrics', 'detect_anomalies'],
      analyzer: impactAnalyzer,
      timeout: 15000,
      retryCount: 0,
    });

    // ── Phase 4: Remediation planning (depends on root cause + impact)
    graph.addNode({
      id: 'remediation_planning',
      name: 'Remediation Planning',
      type: 'analyzer',
      dependencies: ['root_cause_analysis', 'impact_assessment'],
      analyzer: remediationPlanner,
      timeout: 25000,
      retryCount: 1,
    });

    // ── Phase 5: Synthesis (depends on all analysis)
    graph.addNode({
      id: 'synthesis',
      name: 'Synthesis & Report',
      type: 'synthesizer',
      dependencies: ['remediation_planning', 'impact_assessment', 'detect_anomalies'],
      analyzer: synthesizer,
      timeout: 20000,
      retryCount: 0,
    });

    logger.info('IncidentGraph built', {
      nodes: 8,
      parallelGroups: 3,
    });

    return graph;
  }
}

/**
 * Example usage:
 *
 * const graph = IncidentGraphBuilder.build(
 *   metricsAnalyzer,
 *   logAnalyzer,
 *   traceAnalyzer,
 *   anomalyDetector,
 *   rootCauseAnalyzer,
 *   impactAnalyzer,
 *   remediationPlanner,
 *   synthesizer,
 *   logger,
 * );
 *
 * const state = await graph.execute({
 *   incidentId: 'inc-123',
 *   startTime: new Date('2026-04-16T10:00:00Z'),
 *   endTime: new Date('2026-04-16T10:15:00Z'),
 * });
 *
 * const rootCause = graph.getNodeResult(state, 'root_cause_analysis');
 * const impact = graph.getNodeResult(state, 'impact_assessment');
 * const remediation = graph.getNodeResult(state, 'remediation_planning');
 * const report = graph.getNodeResult(state, 'synthesis');
 */
