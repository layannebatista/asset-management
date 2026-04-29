# Observabilidade — Prometheus, Grafana e Alertas

Documento revisado contra `docker-compose.yml`, `infra/prometheus/*`, `application.yml` e provisionamento do Grafana.

Fonte oficial para execucao local via Docker Compose:

- `infra/prometheus/prometheus.yml`
- `infra/prometheus/alerts.yml`
- `infra/grafana/provisioning/*`
- `infra/grafana/dashboards/*`

## Visão Geral

```
Backend (/actuator/prometheus)
    ↓ coleta a cada 15s
Prometheus :9090
    ↓ datasource
Grafana :3001
```

Pipeline de performance:

```
k6 --out influxdb=http://localhost:8086/k6
    ↓
InfluxDB :8086
    ↓
Grafana :3001
```

---

## Prometheus

### Alvos configurados

| Job | Target | Intervalo |
|---|---|---|
| `asset-management-backend` | `asset-management:8080/actuator/prometheus` | 15s |
| `prometheus` | `localhost:9090` | 15s |
| `cadvisor` | `cadvisor:8080` | 15s |

### Retenção

No `docker-compose.yml`, o Prometheus sobe com:

- `--storage.tsdb.retention.time=7d`

### Alertas

Arquivo: `infra/prometheus/alerts.yml`

Alertas configurados hoje:

- `BackendIndisponivel`
- `AltaTaxaDeErros5xx`
- `AltaLatenciaP99`
- `HeapMemoriaAlta`
- `HeapMemoriaCritica`
- `AltoPauseGC`
- `PoolConexoesEsgotado`
- `PoolConexoesAtivoCritico`

---

## Actuator

Endpoints realmente expostos:

| Endpoint | Acesso |
|---|---|
| `/actuator/health` | público |
| `/actuator/health/**` | público |
| `/actuator/prometheus` | público |
| `/actuator/info` | `ADMIN` |
| `/actuator/metrics` | `ADMIN` |
| `/actuator/loggers` | `ADMIN` |

Observação importante:

- `management.endpoint.health.probes.enabled=false`, então `liveness` e `readiness` não estão habilitados no estado atual

---

## Métricas do Backend

O Micrometer expõe principalmente:

- `http_server_requests_*`
- `jvm_memory_*`
- `jvm_gc_*`
- `jvm_threads_*`
- `hikaricp_connections_*`
- `process_cpu_usage`
- `system_cpu_usage`
- `tomcat_connections_*`

No `application.yml`, o backend também configura:

- histogramas para `http.server.requests`
- percentis `0.5`, `0.90`, `0.95`, `0.99`
- SLOs de `100ms`, `500ms`, `1s` e `2s`

---

## Grafana

**Acesso:** `http://localhost:3001`

Credenciais padrão:

- usuário: `admin`
- senha: `admin123`

Provisionamento automático:

- datasource Prometheus
- datasource InfluxDB
- dashboards em `infra/grafana/dashboards/`

Dashboards encontrados no repositório:

- `backend.json`
- `k6-performance.json`
- `executive-overview.json`
- `infra.json`

---

## cAdvisor

**Acesso:** `http://localhost:8081`

Função:

- coleta métricas de CPU, memória, rede e disco dos containers Docker
- publica para consumo do Prometheus

---

## Consultas PromQL Úteis

```promql
rate(http_server_requests_seconds_count[5m])
```

```promql
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
```

```promql
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100
```

```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m])) * 100
```

```promql
hikaricp_connections_active
```

```promql
rate(jvm_gc_pause_seconds_sum[5m])
```
