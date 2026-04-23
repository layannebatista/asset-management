# IA Intelligence - Operacao, Dashboard e Token Savings

## Escopo
Guia unificado para operacao da IA local, analises, dashboard de metricas e economia de tokens.

## Modo Local (padrao)
- `LOCAL_ONLY_MODE=true`
- `LLM_PROVIDER_ORDER=localfree`
- Chave de servico esperada: `AI_SERVICE_API_KEY`

## Endpoints Principais
- Health: `GET /health`
- Dashboard JSON: `GET /api/v1/metrics/dashboard?days=7`
- Dashboard HTML: `GET /api/v1/metrics/dashboard/html?days=7`
- Token savings resumo: `GET /api/v1/metrics/token-savings?days=7`
- Token savings recente: `GET /api/v1/metrics/token-savings/recent?limit=10`

## Leitura do Dashboard
- Saude geral: conformidade de SLA e estabilidade.
- Qualidade media: tendencia de qualidade das analises.
- Custos e economia: custo total e economia por reducao de tokens.
- Decisoes autonomas: volume, risco e taxa de sucesso.
- Alertas: top issues criticos e warnings.

## A/B Testing e modos de decisao
- Habilitacao opcional via variaveis de ambiente:
  - `AB_TEST_ENABLED`
  - `AB_TEST_AUTONOMOUS_PERCENTAGE`
- Override por requisicao pode existir conforme rota e modo suportado.

## Troubleshooting
- 401 em metricas: validar `X-AI-Service-Key` (ou header legado aceito pelo middleware quando habilitado).
- Dashboard sem dados: verificar periodo e se existem registros no banco/fonte.
- Erro de provider externo em modo local: revisar `LOCAL_ONLY_MODE` e `LLM_PROVIDER_ORDER`.
