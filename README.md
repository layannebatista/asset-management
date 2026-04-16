# Asset Management — Plataforma Enterprise de Gestão de Ativos

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![CI](https://github.com/layannebatista/asset-management/actions/workflows/ci.yml/badge.svg)

Plataforma enterprise multitenante para gestão completa do ciclo de vida de ativos corporativos. Uma organização central com múltiplas unidades, controle de acesso por perfil (ADMIN / GESTOR / OPERADOR), rastreabilidade financeira e auditoria completa.

Backend Java 17 + Spring Boot 3. Frontend React 19 + TypeScript. IA embarcada com análise de observabilidade, testes, CI/CD e risco de domínio. Observabilidade com Prometheus + Grafana. Pipeline CI/CD com GitHub Actions.

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclui Docker Compose)
- Git

Não é necessário ter Java, Node.js ou PostgreSQL instalados localmente.

---

## Início Rápido

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd asset-management

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env: defina JWT_SECRET, MAIL_* e AI_SERVICE_API_KEY
# Os demais valores padrão já funcionam para rodar localmente

# 3. Suba toda a stack
docker compose up --build
```

A sequência de inicialização é gerenciada automaticamente pelos `healthcheck` do Docker Compose. Aguarde todos os containers ficarem `healthy` (cerca de 2–3 minutos no primeiro build).

Para parar:

```bash
docker compose down        # mantém dados (volumes persistem)
docker compose down -v     # reset completo — apaga banco e volumes
```

---

## Serviços e Acessos

| Serviço | URL | Credenciais |
|---|---|---|
| **Frontend** | http://localhost:5173 | ver tabela abaixo |
| **API REST** | http://localhost:8080 | — |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Bearer token |
| **Prometheus** | http://localhost:9090 | — |
| **Grafana** | http://localhost:3001 | `admin` / `admin123` |
| **Allure UI** | http://localhost:5252 | — |
| **AI Intelligence** | http://localhost:3100/health | — |

> Credenciais do Grafana são configuráveis via `GRAFANA_USER` e `GRAFANA_PASSWORD` no `.env`.

---

## Credenciais de Demonstração

Criadas automaticamente na inicialização:

| E-mail | Senha | Perfil |
|---|---|---|
| admin@empresa.com | Admin@123 | ADMIN — acesso global |
| gestor@empresa.com | Gestor@123 | GESTOR — acesso por unidade |
| operador@empresa.com | Op@12345 | OPERADOR — acesso pessoal |

---

## Arquitetura em uma visão

```
┌─────────────────────────────────────────────────────┐
│  React 19 + TypeScript  (porta 5173)                │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP / JWT
┌──────────────────────────▼──────────────────────────┐
│  Spring Boot 3.2  (porta 8080)                      │
│  Clean Architecture + DDD                           │
│  interfaces → application → domain → infrastructure │
└──────────────┬───────────────────────┬──────────────┘
               │                       │
┌──────────────▼──────┐   ┌────────────▼─────────────┐
│  PostgreSQL 16       │   │  AI Intelligence         │
│  (porta 5433)        │   │  Node.js + OpenAI        │
│  Flyway migrations   │   │  (porta 3100)            │
└─────────────────────┘   └──────────────────────────┘
```

O isolamento multitenante é aplicado via `LoggedUserContext`: cada requisição autenticada é vinculada automaticamente à organização → unidade → usuário do JWT, e todos os serviços filtram dados por esse escopo.

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [Arquitetura](docs/architecture-pt-BR.md) | Camadas, componentes, decisões de design |
| [Regras de Negócio](docs/business-rules-pt-BR.md) | Ciclo de vida dos ativos, fluxos e restrições |
| [Domínio](docs/domain-pt-BR.md) | Entidades, atributos e relacionamentos |
| [API](docs/api-guide-pt-BR.md) | Endpoints, autenticação, exemplos de request/response |
| [Segurança](docs/security-pt-BR.md) | JWT, RBAC, matriz de autorização |
| [Arquitetura de Segurança](docs/security-architecture-pt-BR.md) | Camadas de defesa, modelo de confiança |
| [Modelo de Ameaças](docs/threat-model-pt-BR.md) | STRIDE, superfície de ataque, controles |
| [Banco de Dados](docs/database-schema-pt-BR.md) | Schema completo, índices, migrações Flyway |
| [Testes](docs/testing-pt-BR.md) | Backend (JUnit/BDD), Frontend (Playwright), k6 |
| [Observabilidade](docs/observability-pt-BR.md) | Prometheus, Grafana, alertas |
| [AI Intelligence](docs/ai-intelligence-pt-BR.md) | Camada de IA: analyzers, agentes, orquestrador |
| [Deploy](docs/deployment-pt-BR.md) | Variáveis de ambiente, produção, requisitos |
| [Workflows](docs/workflows-pt-BR.md) | Fluxos operacionais detalhados |
| [Diagramas de Sequência](docs/sequence-diagrams-pt-BR.md) | Fluxos de autenticação, transferência, inventário |
| [Backup e Recuperação](docs/backup-recovery-pt-BR.md) | Estratégia de backup, RTO/RPO |
| [Resposta a Incidentes](docs/incident-response-pt-BR.md) | Classificação, contenção, pós-incidente |
| [Classificação de Dados](docs/data-classification-pt-BR.md) | Níveis de sensibilidade, controles de acesso |

---

## Objetivo

Plataforma de referência para aprendizado de arquitetura enterprise, automação de testes e engenharia de software com IA embarcada. Pode ser clonada, adaptada e utilizada livremente.
