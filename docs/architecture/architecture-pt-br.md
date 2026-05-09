# Arquitetura

Este projeto é uma aplicação de gestão de ativos com frontend, backend, banco de dados e serviços de apoio para qualidade e observabilidade.

## Visão rápida

```text
Usuário
  -> Frontend React
  -> API Spring Boot
  -> PostgreSQL

Serviços de apoio:
  -> Grafana/Prometheus para métricas
  -> Allure para testes
  -> Sprint Reporter para relatórios
  -> RTK Dashboard para economia de tokens
```

## Backend

O backend fica em `backend/` e usa Spring Boot. A organização segue uma ideia simples:

- Controllers recebem chamadas HTTP.
- Services aplicam regras de negócio.
- Domain representa entidades e decisões do negócio.
- Repositories conversam com o banco.
- Configurations cuidam de segurança, CORS, observabilidade e integração.

Essa separação ajuda a evitar que regra de negócio fique espalhada por controller ou SQL.

## Frontend

O frontend fica em `frontend/` e usa React com TypeScript. Ele consome a API REST e concentra a experiência de uso: login, listagem de ativos, ações operacionais e telas de apoio.

## Banco de dados

O PostgreSQL guarda usuários, organizações, unidades, ativos, históricos, transferências, inventários, manutenção, custos, seguros e auditoria.

As mudanças de schema devem passar por migrações Flyway. Evite alterar tabelas manualmente em ambiente compartilhado.

## Segurança

O acesso é feito por JWT. Cada usuário tem perfil:

- `ADMIN`: visão global.
- `GESTOR`: visão da unidade ou escopo permitido.
- `OPERADOR`: visão operacional limitada.

O sistema também filtra dados por organização e unidade para reduzir risco de vazamento entre tenants.

## Multi-tenant

Multi-tenant aqui significa que o mesmo sistema pode atender organizações diferentes. A API sempre precisa considerar o escopo do usuário logado antes de consultar ou alterar dados.

Na prática: nunca busque ativos, usuários ou inventários apenas pelo `id`; aplique também organização/unidade quando a regra exigir.

## Serviços auxiliares

| Serviço | Papel |
|---|---|
| Prometheus | Coleta métricas |
| Grafana | Exibe dashboards |
| Allure | Mostra resultados de testes |
| Sprint Reporter | Junta métricas da sprint e exporta PowerPoint |
| RTK Dashboard | Mostra economia de tokens e ROI |
| k6/InfluxDB | Testes e histórico de performance |

## Decisões importantes

- Docker Compose é o caminho padrão para execução local.
- Swagger é a referência prática para testar API.
- Flyway é a fonte de verdade para evolução do banco.
- Testes devem cobrir regra de negócio, API e fluxos principais do frontend.
- Logs, métricas e healthchecks devem ser mantidos simples e úteis.

## Onde mexer

| Quero alterar | Comece por |
|---|---|
| Regra de ativo | `backend/` services e domain |
| Endpoint | controller, service e testes |
| Tela | `frontend/` |
| Relatório executivo | `sprint-reporter/` |
| Métrica/alerta | `infra/prometheus/` e `infra/grafana/` |
| Banco | migrações Flyway no backend |

