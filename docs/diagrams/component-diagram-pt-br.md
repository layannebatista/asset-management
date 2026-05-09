# Diagrama de componentes

Este documento mostra a visão de componentes sem excesso de detalhe. Use como mapa mental para entender onde cada coisa vive.

## Visão geral

```text
Navegador
  |
  v
Frontend React (5173)
  |
  v
Backend Spring Boot (8080)
  |
  v
PostgreSQL (5433)
```

## Serviços de apoio

```text
Backend Spring Boot
  -> Prometheus coleta métricas
  -> Grafana exibe dashboards
  -> Allure mostra testes
  -> Sprint Reporter monta relatórios
  -> RTK Dashboard mostra economia de tokens
```

## Responsabilidade de cada componente

| Componente | Responsabilidade |
|---|---|
| Frontend | Experiência do usuário e chamadas REST |
| Backend | Regras de negócio, autenticação, autorização e persistência |
| PostgreSQL | Dados transacionais |
| Flyway | Evolução do schema |
| Prometheus | Coleta de métricas |
| Grafana | Dashboards operacionais |
| Allure | Relatórios de testes |
| Sprint Reporter | Relatórios executivos da sprint |
| RTK Dashboard | Indicadores de economia de tokens |

## Fluxo de uma ação comum

```text
Usuário clica no frontend
  -> frontend chama API com JWT
  -> backend valida token e permissão
  -> backend executa regra de negócio
  -> backend salva ou consulta PostgreSQL
  -> backend registra auditoria quando necessário
  -> frontend mostra o resultado
```

## Cuidados

- O frontend não deve decidir permissão sozinho.
- O backend deve validar escopo multi-tenant em consultas e alterações.
- O banco deve ser alterado por migrações.
- Métricas e logs devem ajudar diagnóstico sem vazar dados sensíveis.

