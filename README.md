# Asset Management — Plataforma Enterprise de Gestão de Ativos

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![CI](https://github.com/layannebatista/asset-management/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Plataforma Enterprise Completa

**Asset Management** é uma solução enterprise multitenante para gestão do ciclo de vida de ativos corporativos, com **IA embarcada**, **observabilidade em tempo real** e **dashboard executivo de métricas**.

### ✨ Características Principais

- 📊 **Gestão de Ativos**: Ciclo de vida completo com rastreabilidade financeira e auditoria
- 🔐 **Controle de Acesso**: RBAC com perfis (ADMIN / GESTOR / OPERADOR)
- 🤖 **Inteligência Artificial**: Análise automática de testes, CI/CD e risco de domínio
- 📈 **Dashboard Executivo**: Relatórios em tempo real e exportação PowerPoint
- 🔍 **Observabilidade**: Prometheus + Grafana + Alertas automáticos
- ✅ **Testes Automatizados**: BDD (Cucumber), E2E (Playwright), K6 Performance
- 🚀 **Pipeline CI/CD**: GitHub Actions com integração contínua
- 📱 **Frontend Moderno**: React 19 + TypeScript
- ☁️ **Backend Robusto**: Spring Boot 3 + Clean Architecture + DDD
- 🐳 **Containerizado**: Docker Compose para ambiente reprodutível

### 🏗️ Stack Tecnológico

```
Frontend: React 19 + TypeScript
Backend: Java 17 + Spring Boot 3 + Clean Architecture
RTK: Node.js + Otimização de Tokens (100% local, sem APIs pagas)
Banco: PostgreSQL 16 + Flyway
Observabilidade: Prometheus + Grafana
Testes: JUnit + Cucumber + Playwright + K6
CI/CD: GitHub Actions
Container: Docker + Docker Compose
```

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

# 3. Suba o modo base (aplicação principal)
docker compose -f docker-compose.yml up --build

# 4. (Opcional) Suba stack completa (observabilidade + IA + relatórios)
# Usa automaticamente docker-compose.override.yml
docker compose up --build
```

A sequência de inicialização é gerenciada automaticamente pelos `healthcheck` do Docker Compose. Aguarde os containers ficarem `healthy` (cerca de 2–3 minutos no primeiro build).

Perfis disponíveis no arquivo base (`docker-compose.yml`):

- `observability`: Prometheus, Grafana, InfluxDB, cAdvisor
- `ai`: serviço AI Intelligence
- `reports`: Sprint Reporter + Allure
- `tests`: containers one-shot de testes e utilitários

Observação sobre comandos e modo efetivo:

- `docker compose -f docker-compose.yml up` sobe somente a aplicação principal (`postgres`, `asset-management`, `frontend`).
- `docker compose up` aplica também `docker-compose.override.yml` e sobe stack completa local (`observability`, `ai`, `reports`).

Fonte oficial de configuração de observabilidade:

- Prometheus e alertas usados em execução: `infra/prometheus/prometheus.yml` e `infra/prometheus/alerts.yml`.
- Provisionamento do Grafana: `infra/grafana/provisioning/*` e `infra/grafana/dashboards/*`.

Para parar:

```bash
docker compose down        # mantém dados (volumes persistem)
docker compose down -v     # reset completo — apaga banco e volumes
```

---

## 🌐 Serviços e Como Acessar

### Aplicação Principal

| Serviço | URL | Função |
|---|---|---|
| **Frontend** | [http://localhost:5173](http://localhost:5173) | Interface de gestão de ativos |
| **API REST** | [http://localhost:8080](http://localhost:8080) | Backend Spring Boot |
| **Swagger/OpenAPI** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Documentação interativa da API |

### RTK Dashboard — Otimização de Tokens

Disponível em todas as instâncias (local ou Docker).

| Serviço | URL | Função |
|---|---|---|
| **🎯 RTK Dashboard** | [http://localhost:3100](http://localhost:3100) | **Dashboard de economia de tokens (100% local, sem APIs pagas)** |
| **RTK Insights API** | [http://localhost:3100/api/v1/insights/*](http://localhost:3100/api/v1/insights/) | 5 endpoints: token-economy, model-efficiency, analysis-roi, executive-summary, history |
| **Health Check** | [http://localhost:3100/health](http://localhost:3100/health) | Status do serviço |

**📊 Recursos do RTK Dashboard:**
- 📈 Economia real de tokens com visualizações
- 🤖 Eficiência de modelos LLM (Claude, GPT, etc)
- 💰 ROI por tipo de análise em Reais
- 📊 Histórico de últimos 3 meses
- 🚨 Alertas automáticos quando ROI cai
- 📄 Export em PDF
- [Documentação Completa](./docs/rtk-dashboard/guia-completo-pt-br.md)

### Relatórios e Métricas

Disponível no modo completo (`docker compose up`).

| Serviço | URL | Função |
|---|---|---|
| **Sprint Reporter Dashboard** | [http://localhost:3200](http://localhost:3200) | 📊 Dashboard interativo de sprint |
| **Sprint Reporter API** | [http://localhost:3200/health](http://localhost:3200/health) | Health check do Reporter |
| **Allure Test Report** | [http://localhost:5252](http://localhost:5252) | Relatórios detalhados de testes |

### Observabilidade

Disponível no modo completo (`docker compose up`).

| Serviço | URL | Função |
|---|---|---|
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | Métricas em tempo real |
| **Grafana** | [http://localhost:3001](http://localhost:3001) | Dashboards e visualizações |
| **Grafana k6 Dashboard** | [http://localhost:3001/d/k6-performance](http://localhost:3001/d/k6-performance) | Performance testing |
| **InfluxDB** | [http://localhost:8086](http://localhost:8086) | Armazenamento de métricas K6 |

### Credenciais Padrão

```bash
# Grafana (Dashboard de Observabilidade)
Usuário: admin
Senha: admin123

# Frontend Asset Management
Ver "Credenciais de Demonstração" abaixo
```

> 💡 **Dica**: Credenciais do Grafana são configuráveis via `GRAFANA_USER` e `GRAFANA_PASSWORD` no `.env`

---

## Credenciais de Demonstração

Criadas automaticamente na inicialização:

| E-mail | Senha | Perfil |
|---|---|---|
| admin@empresa.com | Admin@123 | ADMIN — acesso global |
| gestor@empresa.com | Gestor@123 | GESTOR — acesso por unidade |
| operador@empresa.com | Op@12345 | OPERADOR — acesso pessoal |

---

## 🏗️ Arquitetura da Plataforma

### Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO PRINCIPAL                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  React 19 + TypeScript (porta 5173)                        │
│  └─ Gestão de Ativos, Transferências, Inventário          │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST + JWT
┌────────────────────────▼────────────────────────────────────┐
│              BACKEND ENTERPRISE (porta 8080)               │
├─────────────────────────────────────────────────────────────┤
│  Spring Boot 3.2 + Clean Architecture + DDD               │
│  └─ Controllers → Services → Domain → Repository          │
│                                                             │
│  ✓ RBAC (ADMIN/GESTOR/OPERADOR)                          │
│  ✓ Autenticação JWT                                       │
│  ✓ Auditoria Completa                                     │
│  ✓ Transações ACID                                        │
│                                                             │
└────────┬────────────────────────────┬──────────────────────┘
         │                            │
    ┌────▼──────────┐        ┌────────▼──────────┐
    │ PostgreSQL 16 │        │  RTK Dashboard    │
    │ (porta 5433)  │        │  (porta 3100)     │
    │               │        │                   │
    │ • Ativos      │        │  Node.js + RTK   │
    │ • Usuários    │        │  Otimização      │
    │ • Auditoria   │        │  Tokens           │
    │ • Flyway      │        │  (100% local)     │
    └───────────────┘        └───────────────────┘
```

### Observabilidade

```
┌─────────────────────────────────────────────────┐
│      COLETA DE MÉTRICAS (Prometheus)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  • Spring Boot Micrometer                      │
│  • Prometheus Scrape (localhost:8080/metrics)  │
│  • InfluxDB (K6 Performance)                   │
│                                                 │
└────────────────────┬────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────────┐  ┌───▼────────┐  ┌───▼────────┐
│ Prometheus │  │  Grafana   │  │  Alertas   │
│ 9090       │  │  3001      │  │  Email/Slack│
│            │  │            │  │            │
│Armazenado  │  │Dashboards  │  │Notificações│
└────────────┘  └────────────┘  └────────────┘
```

### Sprint Reporter (Agregação de Métricas com RTK)

```
┌──────────────────────────────────────────────────┐
│       SPRINT REPORTER (porta 3200)               │
├──────────────────────────────────────────────────┤
│                                                  │
│  Dashboard Interativo + API de Relatórios      │
│  (Métricas de QA com economia RTK)             │
│                                                  │
│  Coleta Paralela:                              │
│  ├─ Allure Collector (testes / JUnit)          │
│  ├─ RTK Insights Collector (economia tokens)   │
│  ├─ PostgreSQL Collector (histórico)           │
│  └─ K6 Collector (performance testing)         │
│                                                  │
│  Processamento:                                 │
│  ├─ Análise de Qualidade de Testes             │
│  ├─ Economia de Tokens RTK                     │
│  └─ Geração de Recomendações                   │
│                                                  │
│  Saída:                                         │
│  ├─ JSON (API)                                 │
│  ├─ HTML (Dashboard)                           │
│  └─ PowerPoint (Apresentação para Sprint)      │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Isolamento Multitenante

O isolamento é aplicado via `LoggedUserContext`: 

```
Requisição com JWT
    ↓
Extrai organização → unidade → usuário
    ↓
Todos os serviços filtram por esse escopo
    ↓
Segurança: dados isolados por tenant
```

Cada usuário acessa apenas seus dados da organização/unidade.

---

## 📊 [Sprint Reporter](http://localhost:3200) - Dashboard Executivo

O **Sprint Reporter** é um gerador inteligente de relatórios que agrega métricas de testes, CI/CD e IA em apresentações profissionais.

### 🎯 Funcionalidades

- 📈 **Dashboard Interativo**: Visualize todas as métricas em um só lugar
- 📋 **Relatórios Customizados**: Gere relatórios para qualquer período
- 💾 **Exportação PowerPoint**: Apresentações profissionais com design moderno
- 🔄 **Coleta Paralela**: Dados de Allure, GitHub Actions e PostgreSQL
- 🤖 **Análises Inteligentes**: Detecção automática de problemas e recomendações
- 🎨 **Design Profissional**: Gráficos, cores e linguagem clara em português

### 🚀 Como Usar

```bash
# 1. Acesse o dashboard
# http://localhost:3200

# 2. Selecione o período desejado
# (Início e fim da sprint)

# 3. Clique em "Gerar Relatório"
# (Aguarde 5-15 segundos)

# 4. Visualize as métricas
# (Resumo, testes, CI/CD, IA, performance, etc.)

# 5. Baixe o PowerPoint
# (Botão "📥 Baixar PowerPoint")
```

### 📊 Seções do Relatório

1. **Resumo Executivo** - Status geral, métricas principais, problemas
2. **Métricas de Testes** - Taxa de sucesso, testes instáveis, distribuição
3. **Pipeline CI/CD** - Execuções, taxa de sucesso, tempo médio
4. **Inteligência Artificial** - Análises executadas, economia de tokens
5. **Performance** - Latência, taxa de erro, distribuição
6. **Saúde da Sprint** - Status geral, checklist de qualidade
7. **Problemas Identificados** - Issues críticas e avisos
8. **Recomendações** - Ações sugeridas por prioridade
9. **Insights Principais** - Padrões e observações

### 📖 Documentação Completa

Para guia detalhado, veja: [Sprint Reporter Guide](docs/projects/sprint-reporter-pt-br.md)

---

## 🤖 Inteligência Artificial Embarcada

A plataforma inclui um **sidecar IA** que analisa automaticamente:

- ✅ **Testes**: Detecta testes flakey, padrões de falha
- 🔄 **CI/CD**: Analisa taxa de sucesso, duration anomalies
- 📊 **Observabilidade**: Identifica anomalias em métricas
- ⚠️ **Riscos**: Detecta padrões de risco em domínio
- 💰 **Economia**: Otimiza tokens e custos de IA

**Acesso**: [http://localhost:3100](http://localhost:3100)

**Documentação**: [AI Intelligence Guide](docs/ia-intelligence/ia-intelligence-overview-pt-br.md)

---

## ✅ Testes Automatizados

A plataforma conta com cobertura completa de testes:

### Backend
- **JUnit 5**: Testes unitários
- **Cucumber/BDD**: Testes de comportamento
- **Cobertura**: ~80% do código

### Frontend
- **Playwright**: Testes E2E
- **Visual Testing**: Regressão visual
- **Acessibilidade**: WCAG compliance

### Performance
- **K6**: Load testing e stress testing
- **Dashboard**: Grafana k6 Performance
- **Histórico**: Rastreamento de trends

### Como Executar

```bash
# Rodar todos os testes com Allure Report
./scripts/run-all-tests-docker.ps1 -Build

# Sem cache (rebuild)
./scripts/run-all-tests-docker.ps1 -Build -NoCache

# Visualizar resultados
# Acesse: http://localhost:5252
```

---

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [Índice de Documentação](docs/indice-pt-br.md) | Navegação central de toda a documentação |
| [Arquitetura](docs/architecture/architecture-pt-br.md) | Camadas, componentes e decisões de design |
| [Domínio](docs/architecture/domain-pt-br.md) | Entidades, atributos e relacionamentos |
| [Regras de Negócio](docs/architecture/business-rules-pt-br.md) | Ciclo de vida dos ativos, fluxos e restrições |
| [API](docs/api/api-guide-pt-br.md) | Endpoints, autenticação e exemplos |
| [Segurança](docs/security/security-pt-br.md) | JWT, RBAC e matriz de autorização |
| [Banco de Dados](docs/architecture/database-schema-pt-br.md) | Schema, índices e migrações Flyway |
| [Testes](docs/testing/testing-pt-br.md) | Backend (JUnit/BDD), Frontend (Playwright), k6 |
| [Observabilidade](docs/operations/observability-pt-br.md) | Prometheus, Grafana, alertas e operação |
| [AI Intelligence](docs/ia-intelligence/ia-intelligence-overview-pt-br.md) | Camada de IA: analyzers, agentes e orquestração |
| [Deploy](docs/operations/deployment-pt-br.md) | Variáveis de ambiente e execução |
| [Workflows](docs/operations/workflows-pt-br.md) | Fluxos operacionais detalhados |
| [Sprint Reporter](docs/projects/sprint-reporter-pt-br.md) | Dashboard de métricas e exportação PowerPoint |

---

---

## 🎓 Objetivo e Propósito

**Asset Management** é uma plataforma de referência para:

- 📚 **Aprendizado**: Arquitetura enterprise, clean code, DDD
- 🏆 **Melhores Práticas**: Testes automatizados, CI/CD, observabilidade
- 🤖 **Engenharia de Software Moderna**: IA embarcada, dashboard executivo
- 📊 **Relatórios**: Sprint reporting com análises automáticas
- 🔐 **Segurança**: RBAC, auditoria, multitenancy

Pode ser clonada, adaptada e utilizada como base para seus projetos.

---

## 🚀 Fluxo Rápido de Testes

### Executar Todos os Testes

```powershell
# Execute com rebuild (docker build)
./scripts/run-all-tests-docker.ps1 -Build

# Ou apenas rebuild sem cache
./scripts/run-all-tests-docker.ps1 -Build -NoCache
```

### Visualizar Resultados

- **Allure Report**: [http://localhost:5252](http://localhost:5252)
- **Grafana Dashboards**: [http://localhost:3001](http://localhost:3001)
- **Prometheus Metrics**: [http://localhost:9090](http://localhost:9090)

### Tipos de Testes

```
✅ Backend: JUnit 5 + Cucumber (BDD)
✅ Frontend: Playwright (E2E)
✅ Performance: K6 (Load Testing)
✅ Cobertura: SonarQube integration
✅ Relatórios: Allure Report
```

---

## 📋 Checklist de Configuração

Após iniciar os serviços desejados com `docker compose up` (com ou sem perfis):

### 1️⃣ Verificar Saúde dos Serviços

```bash
# Essencial (modo leve)
curl http://localhost:8080/actuator/health # Spring Boot

# Opcionais (se perfis ai/reports estiverem ativos)
curl http://localhost:3100/health          # AI Intelligence
curl http://localhost:3200/health          # Sprint Reporter
```

### 2️⃣ Acessar Aplicação

- Frontend: [http://localhost:5173](http://localhost:5173)
- Credenciais: veja tabela de "Credenciais de Demonstração"

### 3️⃣ Explorar Dashboards

- Grafana: [http://localhost:3001](http://localhost:3001) (perfil `observability`)
- Sprint Reporter: [http://localhost:3200](http://localhost:3200) (perfil `reports`)
- Allure: [http://localhost:5252](http://localhost:5252) (perfil `reports`)

### 4️⃣ Testar API

```bash
# Health check da API
curl http://localhost:8080/health

# Swagger documentation
# Acesse: http://localhost:8080/swagger-ui.html
```

---

## 🔧 Troubleshooting

### Serviço não inicia

```bash
# Verificar logs
docker compose logs -f sprint-reporter
docker compose logs -f ai-intelligence
docker compose logs -f backend

# Reiniciar
docker compose restart
```

### Porta já em uso

```bash
# Windows: liberar porta (ex: 3200)
netstat -ano | findstr :3200
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3200
kill -9 <PID>
```

### Reset completo

```bash
# Apagar tudo (containers, volumes, networks)
docker compose down -v

# Reiniciar do zero
docker compose up --build
```

---

## 📖 Documentação Detalhada

### Guias Principais

| Documento | Conteúdo |
|---|---|
| [Sprint Reporter](docs/projects/sprint-reporter-pt-br.md) | Dashboard de métricas e exportação PowerPoint |
| [AI Intelligence](docs/ia-intelligence/ia-intelligence-overview-pt-br.md) | Análises automáticas com IA |
| [API Guide](docs/api/api-guide-pt-br.md) | REST endpoints com exemplos |
| [Testes](docs/testing/testing-pt-br.md) | Estratégia de testes automatizados |
| [Observabilidade](docs/operations/observability-pt-br.md) | Prometheus, Grafana e alertas |
| [Deploy](docs/operations/deployment-pt-br.md) | Guia de produção |

### Documentação Técnica

| Documento | Conteúdo |
|---|---|
| [Arquitetura](docs/architecture/architecture-pt-br.md) | Clean Architecture + DDD |
| [Banco de Dados](docs/architecture/database-schema-pt-br.md) | Schema completo |
| [Segurança](docs/security/security-pt-br.md) | RBAC, JWT, auditoria |
| [Workflows](docs/operations/workflows-pt-br.md) | Fluxos operacionais |

---

## RTK no Windows/PowerShell

Para evitar ambiguidade operacional, valide explicitamente a disponibilidade do comando:

```powershell
Get-Command rtk
```

Se não estiver no PATH, use o instalador PowerShell do repositório:

```powershell
.\scripts\install-rtk.ps1
```

Depois feche e reabra o terminal e confirme novamente com `Get-Command rtk`.

---

## 💡 Recursos Adicionais

### Scripts Disponíveis

```bash
# Testes
./scripts/run-all-tests-docker.ps1 -Build

# Desenvolvimento
npm run dev              # Frontend
./gradlew bootRun       # Backend
npm run dev:sprint-reporter  # Sprint Reporter
```

### Arquivo .env

```bash
# Copiar template
cp .env.example .env

# Configurar (ver arquivo para opções)
# - JWT_SECRET
# - MAIL_* (para notificações)
# - AI_SERVICE_API_KEY (OpenAI)
# - GITHUB_TOKEN (para Sprint Reporter)
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/sua-feature

# Commit com mensagem clara
git commit -m "feat: descrição da mudança"

# Push
git push origin feature/sua-feature

# Criar PR
# (GitHub Actions roda testes automaticamente)
```

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 📞 Suporte

- 📧 Email: [contato.layanne.batista@gmail.com](mailto:contato.layanne.batista@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/layannebatista/asset-management/issues)
- 📚 Documentação: [docs/](docs/) directory

---

**Última atualização:** 21 de abril de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Em produção
