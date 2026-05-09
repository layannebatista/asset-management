# Asset Management

Plataforma para gerenciar ativos corporativos: cadastro, responsáveis, unidades, transferências, inventário, manutenção, auditoria e relatórios. O projeto também traz uma stack de apoio para qualidade, observabilidade, testes automatizados e dashboards executivos.

## O que o sistema entrega

- Gestão de ativos com ciclo de vida completo.
- Controle de acesso por perfil: `ADMIN`, `GESTOR` e `OPERADOR`.
- Isolamento por organização e unidade.
- Histórico de movimentações, status e auditoria.
- Frontend React para uso diário.
- API Spring Boot documentada por Swagger/OpenAPI.
- Banco PostgreSQL com migrações Flyway.
- Testes automatizados de backend, frontend e performance.
- Dashboards com Grafana, Allure, Sprint Reporter e RTK Dashboard.

## Stack principal

| Área | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Java 17, Spring Boot 3, Maven |
| Banco | PostgreSQL 16, Flyway |
| Testes | JUnit, Cucumber, Playwright, k6, Allure |
| Observabilidade | Prometheus, Grafana, cAdvisor, InfluxDB |
| Relatórios | Sprint Reporter, PowerPoint export |
| RTK | Dashboard local de economia de tokens |
| Execução | Docker Compose |

## Pré-requisitos

- Docker Desktop com Docker Compose.
- Git.

Você não precisa instalar Java, Node.js ou PostgreSQL para rodar pelo Docker.

## Início rápido

```bash
git clone <url-do-repositorio>
cd asset-management

cp .env.example .env

# Sobe a aplicação principal: banco, backend e frontend
docker compose -f docker-compose.yml up --build
```

Depois de subir, aguarde os containers ficarem saudáveis. No primeiro build isso pode levar alguns minutos.

Para subir a stack completa local, incluindo observabilidade, relatórios e serviços auxiliares:

```bash
docker compose up --build
```

Para parar:

```bash
docker compose down
```

Para apagar containers e volumes, incluindo o banco local:

```bash
docker compose down -v
```

## Acessos locais

| Serviço | URL | Para que serve |
|---|---|---|
| Frontend | http://localhost:5173 | Tela principal de gestão de ativos |
| API | http://localhost:8080 | Backend Spring Boot |
| Swagger | http://localhost:8080/swagger-ui.html | Testar e consultar endpoints |
| RTK Dashboard | http://localhost:3100 | Economia de tokens e ROI |
| Sprint Reporter | http://localhost:3200 | Relatórios executivos da sprint |
| Allure | http://localhost:5252 | Resultado dos testes automatizados |
| Grafana | http://localhost:3001 | Dashboards técnicos |
| Prometheus | http://localhost:9090 | Métricas coletadas |

Credenciais do Grafana em ambiente local:

```text
Usuário: admin
Senha: admin123
```

## Usuários de demonstração

Criados automaticamente no ambiente local:

| E-mail | Senha | Perfil |
|---|---|---|
| admin@empresa.com | Admin@123 | Acesso global |
| gestor@empresa.com | Gestor@123 | Gestão por unidade |
| operador@empresa.com | Op@12345 | Uso operacional |

## Como o projeto está organizado

```text
backend/          API Spring Boot e regras de negócio
frontend/         Interface React
sprint-reporter/  Dashboard e exportação de relatórios
rtk-dashboard/    Métricas de economia de tokens
infra/            Prometheus, Grafana e configurações de apoio
k6/               Testes de performance
scripts/          Automação local
docs/             Documentação do projeto
```

## Fluxo básico de uso

1. Entrar no frontend com um usuário de demonstração.
2. Cadastrar ou consultar ativos.
3. Acompanhar mudanças de responsável, unidade e status.
4. Registrar inventário, manutenção, seguro e centro de custo quando necessário.
5. Usar Swagger para validar chamadas da API.
6. Usar Allure, Grafana e Sprint Reporter para acompanhar qualidade e operação.

## Testes

O caminho mais prático para rodar a suíte integrada é:

```powershell
./scripts/run-all-tests-docker.ps1 -Build
```

Para rebuild sem cache:

```powershell
./scripts/run-all-tests-docker.ps1 -Build -NoCache
```

Depois, acesse o Allure em http://localhost:5252.

## Documentação

Comece pelo índice:

- [Índice da documentação](docs/indice-pt-br.md)
- [Guia da API](docs/api/api-guide-pt-br.md)
- [Arquitetura](docs/architecture/architecture-pt-br.md)
- [Regras de negócio](docs/architecture/business-rules-pt-br.md)
- [Modelo de domínio](docs/architecture/domain-pt-br.md)
- [Testes](docs/testing/testing-pt-br.md)
- [Deploy](docs/operations/deployment-pt-br.md)
- [Observabilidade](docs/operations/observability-pt-br.md)
- [Segurança](docs/security/security-pt-br.md)
- [Sprint Reporter](docs/projects/sprint-reporter-pt-br.md)
- [RTK Dashboard](docs/rtk-dashboard/README.md)

## Problemas comuns

Ver logs:

```bash
docker compose logs -f asset-management
docker compose logs -f frontend
docker compose logs -f sprint-reporter
```

Ver containers:

```bash
docker compose ps -a
```

Porta ocupada no Windows:

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Reset local completo:

```bash
docker compose down -v
docker compose up --build
```

## Variáveis importantes

Copie `.env.example` para `.env` e revise principalmente:

- `JWT_SECRET`: chave usada nos tokens.
- `MAIL_*`: envio de e-mails, se habilitado.
- `AI_SERVICE_API_KEY`: integrações de IA, quando usadas.
- `GITHUB_TOKEN`: coleta de dados do GitHub no Sprint Reporter.
- `GRAFANA_USER` e `GRAFANA_PASSWORD`: acesso ao Grafana local.

## Objetivo do projeto

Este repositório funciona como uma base de referência para uma aplicação corporativa moderna: backend em camadas, frontend tipado, autenticação, autorização, auditoria, testes, observabilidade, relatórios e execução reproduzível por Docker.

