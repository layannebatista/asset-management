/**
 * Builds and optimizes prompts for each analysis type.
 *
 * Design rules:
 * 1. System prompts define the AI's role, output schema, and constraints.
 * 2. User prompts contain the filtered, masked metadata snapshot.
 * 3. Output schemas are embedded directly – no separate schema file needed.
 * 4. Keep prompts under 3000 tokens to stay cost-efficient.
 */
export class PromptOptimizer {

  static observability(context: Record<string, unknown>): { system: string; user: string } {
    return {
      system: `You are a senior Site Reliability Engineer specializing in JVM-based systems and Spring Boot.
Analyze the provided system metrics and identify anomalies, bottlenecks, and performance risks.
Be concise, precise, and actionable. Focus on what engineers must act on now vs. later.

Return a JSON object with this exact structure:
{
  "summary": "string (2-3 sentences executive summary)",
  "overallHealthScore": number (0-100, 100=perfect),
  "anomalies": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "bottlenecks": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "recommendations": [{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],
  "jvmInsights": {"heapUsageTrend":"string","gcPressure":"critical|high|medium|low|info","threadPoolStatus":"string"},
  "httpInsights": {"p95LatencyMs":number,"errorRatePct":number,"slowestEndpoints":["string"]}
}`,
      user: `Analyze these system metrics snapshot:\n\n${JSON.stringify(context, null, 2)}`,
    };
  }

  static testIntelligence(context: Record<string, unknown>): { system: string; user: string } {
    return {
      system: `You are a senior QA Engineer and test automation architect with deep Playwright and Cucumber expertise.
Analyze the provided test execution results. Detect flaky tests, failure patterns, and test quality issues.
Provide root cause hypotheses and concrete improvements.

Return a JSON object with this exact structure:
{
  "summary": "string (2-3 sentences)",
  "totalTests": number,
  "passRate": number (0-100),
  "flakyTests": [{"name":"string","suite":"string","durationMs":number,"status":"flaky","failureCount":number,"errorMessage":"string"}],
  "slowTests": [{"name":"string","suite":"string","durationMs":number,"status":"passed"}],
  "failurePatterns": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "recommendations": [{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],
  "prioritization": ["string (ordered list of areas to fix first)"]
}`,
      user: `Analyze these test execution results:\n\n${JSON.stringify(context, null, 2)}`,
    };
  }

  static cicd(context: Record<string, unknown>): { system: string; user: string } {
    return {
      system: `You are a senior DevOps engineer specializing in GitHub Actions and CI/CD optimization.
Analyze the pipeline data. Identify slow jobs, redundant steps, caching opportunities, and failure patterns.
Suggest concrete, implementable optimizations.

Return a JSON object with this exact structure:
{
  "summary": "string",
  "averagePipelineDurationMinutes": number,
  "successRate": number (0-100),
  "slowJobs": [{"name":"string","durationSeconds":number,"status":"string","conclusion":"string"}],
  "failureTrends": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "optimizationOpportunities": [{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],
  "estimatedTimeSavingsMinutes": number
}`,
      user: `Analyze this CI/CD pipeline data:\n\n${JSON.stringify(context, null, 2)}`,
    };
  }

  static incident(context: Record<string, unknown>): { system: string; user: string } {
    return {
      system: `You are a senior backend engineer performing incident analysis on a Spring Boot Clean Architecture system.
The system has these layers: domain, application, infrastructure, security, interfaces/rest.
Analyze logs and errors. Identify the most likely root cause, impacted layers, and remediation steps.
Do not speculate wildly – only draw conclusions supported by the provided evidence.

Return a JSON object with this exact structure:
{
  "summary": "string",
  "severity": "critical|high|medium|low|info",
  "rootCauseHypothesis": "string (specific, evidence-backed hypothesis)",
  "impactedLayers": [{"layer":"domain|application|infrastructure|security|interface","component":"string","confidence":number}],
  "errorPatterns": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "suggestedFixes": [{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],
  "preventionMeasures": ["string"]
}`,
      user: `Analyze this incident data:\n\n${JSON.stringify(context, null, 2)}`,
    };
  }

  static risk(context: Record<string, unknown>): { system: string; user: string } {
    return {
      system: `You are a domain expert in enterprise asset management systems and financial risk.
The system manages assets with lifecycle states: AVAILABLE, ASSIGNED, MAINTENANCE, DISPOSED.
Key domains: assets, transfers, maintenance, depreciation, insurance, inventory.
Analyze the domain data for inconsistencies, risk scenarios, and compliance concerns.

Return a JSON object with this exact structure:
{
  "summary": "string",
  "overallRiskScore": number (0-100),
  "riskLevel": "critical|high|medium|low|info",
  "scenarios": [{"id":"string","domain":"asset|transfer|maintenance|depreciation|insurance|inventory","title":"string","description":"string","riskScore":number,"likelihood":"critical|high|medium|low|info","impact":"critical|high|medium|low|info","affectedAssetCount":number}],
  "inconsistencies": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "recommendations": [{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],
  "complianceFlags": ["string"]
}`,
      user: `Analyze this domain risk data:\n\n${JSON.stringify(context, null, 2)}`,
    };
  }

  static agentSynthesis(agentReports: unknown[]): { system: string; user: string } {
    return {
      system: `You are a principal engineer synthesizing reports from multiple specialized AI agents.
Your job is to produce a unified executive analysis that identifies cross-cutting concerns
and prioritizes actions across DevOps, QA, Backend, and Architecture dimensions.

Return a JSON object with this exact structure:
{
  "executiveSummary": "string (4-5 sentences for engineering leadership)",
  "overallSystemHealthScore": number (0-100),
  "crossCuttingConcerns": [{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],
  "prioritizedActions": [{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}]
}`,
      user: `Synthesize these agent reports into a unified analysis:\n\n${JSON.stringify(agentReports, null, 2)}`,
    };
  }
}
