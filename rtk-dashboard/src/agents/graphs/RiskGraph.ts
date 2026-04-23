import { Logger } from 'winston';
import { AgentGraph } from '../AgentGraph';
import { IAnalyzer } from '../../types/enterprise.types';

/**
 * RiskGraph: Compliance and security risk assessment workflow
 *
 * Flow:
 * 1. Data Classification (identify sensitive data) [parallel]
 * 2. Threat Analysis (potential threats) [parallel]
 * 3. Vulnerability Assessment (existing vulnerabilities) [parallel]
 * 4. Risk Scoring (combine all factors) [depends on 1,2,3]
 * 5. Compliance Check (LGPD/regulatory) [depends on 1,4]
 * 6. Mitigation Planning (how to reduce risk) [depends on 4,5]
 * 7. Report & Recommendations (final output) [depends on 6]
 */

export class RiskGraphBuilder {
  static build(
    dataClassifier: IAnalyzer,
    threatAnalyzer: IAnalyzer,
    vulnerabilityAnalyzer: IAnalyzer,
    riskScorer: IAnalyzer,
    complianceChecker: IAnalyzer,
    mitigationPlanner: IAnalyzer,
    reportSynthesizer: IAnalyzer,
    logger: Logger,
  ): AgentGraph {
    const graph = new AgentGraph(logger);

    // ── Phase 1: Data classification (no dependencies)
    graph.addNode({
      id: 'classify_data',
      name: 'Data Classification',
      type: 'filter',
      dependencies: [],
      analyzer: dataClassifier,
      timeout: 15000,
      retryCount: 1,
    });

    // ── Phase 2: Threat analysis (no dependencies)
    graph.addNode({
      id: 'analyze_threats',
      name: 'Threat Analysis',
      type: 'analyzer',
      dependencies: [],
      analyzer: threatAnalyzer,
      timeout: 20000,
      retryCount: 1,
    });

    // ── Phase 3: Vulnerability assessment (no dependencies)
    graph.addNode({
      id: 'assess_vulnerabilities',
      name: 'Vulnerability Assessment',
      type: 'analyzer',
      dependencies: [],
      analyzer: vulnerabilityAnalyzer,
      timeout: 25000,
      retryCount: 2,
    });

    // ── Phase 4: Risk scoring (depends on all 3 above)
    graph.addNode({
      id: 'score_risk',
      name: 'Risk Scoring',
      type: 'analyzer',
      dependencies: ['classify_data', 'analyze_threats', 'assess_vulnerabilities'],
      analyzer: riskScorer,
      timeout: 20000,
      retryCount: 1,
    });

    // ── Phase 5: Compliance check (depends on data classification + risk scoring)
    graph.addNode({
      id: 'check_compliance',
      name: 'Compliance Check',
      type: 'filter',
      dependencies: ['classify_data', 'score_risk'],
      analyzer: complianceChecker,
      timeout: 15000,
      retryCount: 0,
    });

    // ── Phase 6: Mitigation planning (depends on risk score + compliance)
    graph.addNode({
      id: 'plan_mitigation',
      name: 'Mitigation Planning',
      type: 'analyzer',
      dependencies: ['score_risk', 'check_compliance'],
      analyzer: mitigationPlanner,
      timeout: 30000,
      retryCount: 1,
    });

    // ── Phase 7: Report synthesis (depends on mitigation plan)
    graph.addNode({
      id: 'synthesize_report',
      name: 'Report & Recommendations',
      type: 'synthesizer',
      dependencies: ['plan_mitigation', 'analyze_threats', 'assess_vulnerabilities'],
      analyzer: reportSynthesizer,
      timeout: 25000,
      retryCount: 0,
    });

    logger.info('RiskGraph built', {
      nodes: 7,
      parallelGroups: 3,
    });

    return graph;
  }
}

/**
 * Example usage:
 *
 * const graph = RiskGraphBuilder.build(
 *   dataClassifier,
 *   threatAnalyzer,
 *   vulnerabilityAnalyzer,
 *   riskScorer,
 *   complianceChecker,
 *   mitigationPlanner,
 *   reportSynthesizer,
 *   logger,
 * );
 *
 * const state = await graph.execute({
 *   assetId: 'asset-456',
 *   dataTypes: ['customer_pii', 'financial_records'],
 * });
 *
 * const riskScore = graph.getNodeResult(state, 'score_risk');
 * const complianceStatus = graph.getNodeResult(state, 'check_compliance');
 * const mitigations = graph.getNodeResult(state, 'plan_mitigation');
 * const report = graph.getNodeResult(state, 'synthesize_report');
 */
