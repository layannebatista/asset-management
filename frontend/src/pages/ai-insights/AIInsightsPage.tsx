import { useState } from 'react'
import type { ReactElement } from 'react'
import { aiInsightsApi } from '../../api/aiInsights'
import type {
  AnalysisType,
  AnyAnalysis,
  ObservabilityAnalysis,
  TestIntelligenceAnalysis,
  CICDAnalysis,
  RiskAnalysis,
  MultiAgentAnalysis,
  Finding,
  Recommendation,
  Severity,
} from '../../api/aiInsights'

// ─── Severity badge ───────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  info: 'bg-gray-100 text-gray-700 border-gray-200',
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[severity]}`}>
      {severity.toUpperCase()}
    </span>
  )
}

// ─── Score gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-600'
  return (
    <div className="flex flex-col items-center">
      <span className={`text-4xl font-bold ${color}`}>{Math.round(score)}</span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  )
}

// ─── Finding card ─────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <SeverityBadge severity={finding.severity} />
        <span className="font-medium text-sm text-gray-800">{finding.title}</span>
      </div>
      <p className="text-xs text-gray-600">{finding.description}</p>
      {finding.affectedComponent && (
        <p className="text-xs text-gray-400 mt-1">Component: {finding.affectedComponent}</p>
      )}
      {finding.evidence && (
        <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded p-1 mt-1 truncate">{finding.evidence}</p>
      )}
    </div>
  )
}

// ─── Recommendation card ──────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  immediate: 'border-l-red-500',
  'short-term': 'border-l-yellow-400',
  'long-term': 'border-l-blue-400',
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className={`border-l-4 ${PRIORITY_COLORS[rec.priority]} bg-white border rounded-lg p-3 shadow-sm`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs uppercase font-semibold text-gray-400">{rec.priority}</span>
      </div>
      <p className="text-sm font-medium text-gray-800">{rec.action}</p>
      <p className="text-xs text-gray-500 mt-1">{rec.rationale}</p>
      {rec.estimatedImpact && (
        <p className="text-xs text-green-600 mt-1">Impact: {rec.estimatedImpact}</p>
      )}
    </div>
  )
}

// ─── Analysis type config ─────────────────────────────────────────────────────

const ANALYSIS_TYPES: { type: AnalysisType; label: string; description: string; icon: string }[] = [
  { type: 'observability', label: 'Observability', description: 'JVM + HTTP + system metrics', icon: '📊' },
  { type: 'test-intelligence', label: 'Test Intelligence', description: 'Playwright + Cucumber analysis', icon: '🧪' },
  { type: 'cicd', label: 'CI/CD Pipeline', description: 'GitHub Actions optimization', icon: '⚙️' },
  { type: 'risk', label: 'Domain Risk', description: 'Asset lifecycle risk analysis', icon: '⚠️' },
  { type: 'multi-agent', label: 'Multi-Agent', description: 'All 4 agents + synthesis', icon: '🤖' },
]

// ─── Result renderers ─────────────────────────────────────────────────────────

function ObservabilityResult({ data }: { data: ObservabilityAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-8 items-center bg-gray-50 rounded-lg p-4">
        <ScoreGauge score={data.overallHealthScore} label="Health Score" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">{data.summary}</p>
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <div className="bg-white border rounded p-2"><span className="text-gray-400">p95 Latency</span><br /><strong>{Math.round(data.httpInsights.p95LatencyMs)}ms</strong></div>
            <div className="bg-white border rounded p-2"><span className="text-gray-400">Error Rate</span><br /><strong>{data.httpInsights.errorRatePct.toFixed(2)}%</strong></div>
            <div className="bg-white border rounded p-2"><span className="text-gray-400">GC Pressure</span><br /><SeverityBadge severity={data.jvmInsights.gcPressure} /></div>
          </div>
        </div>
      </div>
      {data.anomalies.length > 0 && (
        <Section title="Anomalies" items={data.anomalies} render={(f) => <FindingCard finding={f} />} />
      )}
      {data.recommendations.length > 0 && (
        <Section title="Recommendations" items={data.recommendations} render={(r) => <RecommendationCard rec={r} />} />
      )}
    </div>
  )
}

function TestIntelligenceResult({ data }: { data: TestIntelligenceAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-8 items-center bg-gray-50 rounded-lg p-4">
        <ScoreGauge score={data.passRate} label="Pass Rate %" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">{data.summary}</p>
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <div className="bg-white border rounded p-2"><span className="text-gray-400">Total Tests</span><br /><strong>{data.totalTests}</strong></div>
            <div className="bg-white border rounded p-2"><span className="text-gray-400">Flaky Tests</span><br /><strong className="text-orange-600">{data.flakyTests.length}</strong></div>
            <div className="bg-white border rounded p-2"><span className="text-gray-400">Slow Tests</span><br /><strong className="text-yellow-600">{data.slowTests.length}</strong></div>
          </div>
        </div>
      </div>
      {data.failurePatterns.length > 0 && (
        <Section title="Failure Patterns" items={data.failurePatterns} render={(f) => <FindingCard finding={f} />} />
      )}
      {data.recommendations.length > 0 && (
        <Section title="Recommendations" items={data.recommendations} render={(r) => <RecommendationCard rec={r} />} />
      )}
    </div>
  )
}

function CICDResult({ data }: { data: CICDAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-8 items-center bg-gray-50 rounded-lg p-4">
        <ScoreGauge score={data.successRate} label="Success Rate %" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">{data.summary}</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div className="bg-white border rounded p-2"><span className="text-gray-400">Avg Duration</span><br /><strong>{data.averagePipelineDurationMinutes.toFixed(1)} min</strong></div>
            {data.estimatedTimeSavingsMinutes && (
              <div className="bg-white border rounded p-2"><span className="text-gray-400">Potential Savings</span><br /><strong className="text-green-600">{data.estimatedTimeSavingsMinutes} min</strong></div>
            )}
          </div>
        </div>
      </div>
      {data.optimizationOpportunities.length > 0 && (
        <Section title="Optimization Opportunities" items={data.optimizationOpportunities} render={(r) => <RecommendationCard rec={r} />} />
      )}
      {data.failureTrends.length > 0 && (
        <Section title="Failure Trends" items={data.failureTrends} render={(f) => <FindingCard finding={f} />} />
      )}
    </div>
  )
}

function RiskResult({ data }: { data: RiskAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-8 items-center bg-gray-50 rounded-lg p-4">
        <ScoreGauge score={100 - data.overallRiskScore} label="Safety Score" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={data.riskLevel} />
            <span className="text-xs text-gray-500">Overall Risk Level</span>
          </div>
          <p className="text-sm text-gray-700">{data.summary}</p>
        </div>
      </div>
      {data.scenarios.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Scenarios</h3>
          <div className="space-y-2">
            {data.scenarios.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={s.likelihood} />
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="ml-auto text-xs text-gray-400">Risk: {s.riskScore}/100</span>
                </div>
                <p className="text-xs text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.recommendations.length > 0 && (
        <Section title="Recommendations" items={data.recommendations} render={(r) => <RecommendationCard rec={r} />} />
      )}
    </div>
  )
}

function MultiAgentResult({ data }: { data: MultiAgentAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex gap-6 items-start">
          <ScoreGauge score={data.overallSystemHealthScore} label="System Health" />
          <p className="text-sm text-gray-700 flex-1">{data.executiveSummary}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.agentReports.map((report) => (
          <div key={report.agentName} className="border rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{report.agentName} Agent</span>
              <span className="text-xs text-gray-400">{(report.confidence * 100).toFixed(0)}% confidence</span>
            </div>
            <p className="text-xs text-gray-600">{report.summary}</p>
            {report.findings.length > 0 && (
              <p className="text-xs text-orange-600 mt-1">{report.findings.length} finding(s)</p>
            )}
          </div>
        ))}
      </div>
      {data.prioritizedActions.length > 0 && (
        <Section title="Prioritized Actions" items={data.prioritizedActions} render={(r) => <RecommendationCard rec={r} />} />
      )}
    </div>
  )
}

function Section<T>({ title, items, render }: { title: string; items: T[]; render: (item: T) => ReactElement }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title} <span className="text-gray-400 font-normal">({items.length})</span></h3>
      <div className="space-y-2">{items.map((item, i) => <div key={i}>{render(item)}</div>)}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AIInsightsPage() {
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null)
  const [result, setResult] = useState<AnyAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async (type: AnalysisType) => {
    setSelectedType(type)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let data: AnyAnalysis
      switch (type) {
        case 'observability': data = await aiInsightsApi.observability(); break
        case 'test-intelligence': data = await aiInsightsApi.testIntelligence('all'); break
        case 'cicd': data = await aiInsightsApi.cicd(7); break
        case 'risk': data = await aiInsightsApi.risk(); break
        case 'multi-agent': data = await aiInsightsApi.multiAgent(); break
        default: return
      }
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered insights across observability, tests, CI/CD, incidents, and domain risk</p>
      </div>

      {/* Analysis type selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ANALYSIS_TYPES.map(({ type, label, description, icon }) => (
          <button
            key={type}
            onClick={() => runAnalysis(type)}
            disabled={loading}
            className={`border rounded-lg p-3 text-left transition-all hover:shadow-md disabled:opacity-50 ${
              selectedType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-sm font-semibold text-gray-800">{label}</div>
            <div className="text-xs text-gray-400">{description}</div>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
          <span className="text-gray-600">Running AI analysis… this may take 30–60 seconds</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Metadata bar */}
      {result && !loading && (
        <div className="bg-gray-50 border rounded-lg p-3 mb-4 flex items-center gap-4 text-xs text-gray-500">
          <span>Model: <strong>{result.metadata.model}</strong></span>
          <span>Duration: <strong>{(result.metadata.durationMs / 1000).toFixed(1)}s</strong></span>
          {result.metadata.tokensUsed && <span>Tokens: <strong>{result.metadata.tokensUsed}</strong></span>}
          <span>Analysis ID: <code className="font-mono">{result.metadata.analysisId.slice(0, 8)}…</code></span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="border rounded-lg bg-white p-4 shadow-sm">
          {result.metadata.type === 'observability' && <ObservabilityResult data={result as ObservabilityAnalysis} />}
          {result.metadata.type === 'test-intelligence' && <TestIntelligenceResult data={result as TestIntelligenceAnalysis} />}
          {result.metadata.type === 'cicd' && <CICDResult data={result as CICDAnalysis} />}
          {result.metadata.type === 'risk' && <RiskResult data={result as RiskAnalysis} />}
          {result.metadata.type === 'multi-agent' && <MultiAgentResult data={result as MultiAgentAnalysis} />}
        </div>
      )}
    </div>
  )
}
