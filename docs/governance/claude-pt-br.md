# Guia rápido para agentes de código

Este arquivo dá contexto para assistentes de IA ou pessoas que chegam no projeto e precisam trabalhar sem se perder.

## O que é o projeto

Asset Management é uma plataforma de gestão de ativos corporativos com:

- backend Spring Boot;
- frontend React;
- PostgreSQL;
- testes automatizados;
- observabilidade;
- relatórios de sprint;
- RTK Dashboard.

## Pastas principais

| Pasta | Conteúdo |
|---|---|
| `backend/` | API, regras de negócio e persistência |
| `frontend/` | Interface web |
| `sprint-reporter/` | Relatórios executivos |
| `infra/` | Prometheus, Grafana e apoio |
| `k6/` | Testes de performance |
| `scripts/` | Automação local |
| `docs/` | Documentação |

## Como rodar

```bash
cp .env.example .env
docker compose -f docker-compose.yml up --build
```

Stack completa:

```bash
docker compose up --build
```

## Acessos

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| RTK Dashboard | http://localhost:3100 |
| Sprint Reporter | http://localhost:3200 |
| Allure | http://localhost:5252 |
| Grafana | http://localhost:3001 |

## Regras para mexer no código

- Leia o contexto antes de alterar.
- Preserve o isolamento multi-tenant.
- Valide permissões no backend.
- Use Flyway para banco.
- Atualize ou crie testes para mudança de regra.
- Não coloque segredos no repositório.
- Não remova auditoria de ações sensíveis.

## Comandos úteis

```bash
docker compose ps -a
docker compose logs -f asset-management
docker compose logs -f frontend
docker compose logs -f sprint-reporter
```

Testes integrados:

```powershell
./scripts/run-all-tests-docker.ps1 -Build
```

## RTK

No Windows:

```powershell
.\scripts\install-rtk.ps1
Get-Command rtk
```

O dashboard fica em http://localhost:3100.

## Antes de finalizar uma mudança

- A aplicação ainda sobe?
- Os testes relevantes passam?
- A permissão está correta?
- A documentação afetada foi atualizada?
- Logs não expõem dados sensíveis?

