# Sprint Reporter - setup rápido

O Sprint Reporter gera dashboards e apresentações com dados de sprint, testes, CI e métricas auxiliares.

## Subir pelo Docker

```bash
docker compose up --build
```

Acesse:

```text
http://localhost:3200
```

Healthcheck:

```text
http://localhost:3200/health
```

## Variáveis úteis

| Variável | Uso |
|---|---|
| `GITHUB_TOKEN` | Coleta de dados do GitHub |
| `DATABASE_URL` ou equivalentes | Conexão com banco |
| `ALLURE_RESULTS_DIR` | Origem dos resultados de teste |

## Uso básico

1. Abra o dashboard.
2. Escolha o período da sprint.
3. Gere o relatório.
4. Revise o resumo.
5. Baixe o PowerPoint se precisar apresentar.

