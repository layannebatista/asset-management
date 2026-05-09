# Deploy e execução

O caminho recomendado para desenvolvimento local é Docker Compose. Ele sobe banco, backend, frontend e serviços auxiliares sem exigir instalação local de Java, Node ou PostgreSQL.

## Execução local básica

```bash
cp .env.example .env
docker compose -f docker-compose.yml up --build
```

Esse modo sobe o essencial:

- PostgreSQL;
- backend;
- frontend.

## Stack completa local

```bash
docker compose up --build
```

Esse comando também considera o override local e pode subir:

- observabilidade;
- relatórios;
- RTK;
- serviços auxiliares de testes.

## Variáveis importantes

| Variável | Uso |
|---|---|
| `JWT_SECRET` | Assinatura dos tokens |
| `SPRING_DATASOURCE_*` | Conexão do backend com PostgreSQL |
| `MAIL_*` | Envio de e-mails |
| `AI_SERVICE_API_KEY` | Integrações de IA |
| `GITHUB_TOKEN` | Coleta de dados para relatórios |
| `GRAFANA_USER` | Usuário do Grafana |
| `GRAFANA_PASSWORD` | Senha do Grafana |

Em produção, não use segredos fracos nem valores de exemplo.

## Healthchecks

Use healthchecks para saber se os serviços estão prontos:

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:3100/health
curl http://localhost:3200/health
```

## Banco de dados

- PostgreSQL roda em container.
- Migrações são aplicadas pelo Flyway.
- Dados locais ficam em volume Docker.
- `docker compose down -v` apaga o banco local.

## Produção

Antes de produção, revise:

- segredos fortes;
- HTTPS obrigatório;
- backup configurado;
- logs e métricas habilitados;
- CORS restrito ao domínio real;
- política de retenção de dados;
- alertas para API, banco e infraestrutura;
- plano de rollback.

## Troubleshooting rápido

```bash
docker compose ps -a
docker compose logs -f asset-management
docker compose logs -f frontend
docker compose logs -f postgres
```

Se a porta estiver ocupada, pare o processo local ou ajuste o mapeamento no Compose.

