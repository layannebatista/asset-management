# Observabilidade

Observabilidade é o conjunto de ferramentas que ajuda a responder: o sistema está funcionando, está rápido e onde está falhando?

## Ferramentas

| Ferramenta | Papel |
|---|---|
| Actuator | Expõe saúde e métricas do backend |
| Prometheus | Coleta e guarda métricas |
| Grafana | Mostra dashboards |
| cAdvisor | Métricas de containers |
| InfluxDB | Histórico de testes k6 |
| Allure | Resultado de testes automatizados |

## Acessos locais

| Serviço | URL |
|---|---|
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Allure | http://localhost:5252 |

Credencial padrão do Grafana local:

```text
admin / admin123
```

## Métricas úteis

Observe principalmente:

- API fora do ar;
- tempo de resposta alto;
- aumento de erros 4xx e 5xx;
- uso de CPU e memória;
- falhas de banco;
- aumento de latência em testes k6;
- queda de sucesso nos testes automatizados.

## Prometheus

A configuração fica em:

```text
infra/prometheus/prometheus.yml
infra/prometheus/alerts.yml
```

Prometheus coleta métricas periodicamente. Se um gráfico não aparece no Grafana, confirme primeiro se o alvo está `UP` no Prometheus.

## Grafana

Provisionamento e dashboards ficam em:

```text
infra/grafana/provisioning/
infra/grafana/dashboards/
```

Use o Grafana para acompanhar tendências. Um pico isolado pode ser normal; uma tendência de crescimento costuma merecer investigação.

## Consultas úteis

Exemplos de PromQL para começar:

```promql
up
rate(http_server_requests_seconds_count[5m])
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
```

## Como investigar um problema

1. Veja se o container está saudável.
2. Olhe logs do serviço afetado.
3. Confirme o alvo no Prometheus.
4. Compare Grafana antes e depois do horário do problema.
5. Verifique se houve deploy, teste pesado ou mudança de configuração.

