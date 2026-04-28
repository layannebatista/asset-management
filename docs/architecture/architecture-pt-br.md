# Arquitetura Enterprise

Documento revisado contra a estrutura atual do repositório e os módulos implementados.

## 1. Visão Geral do Sistema

O sistema é composto por:

- frontend React + TypeScript
- backend Spring Boot
- PostgreSQL com Flyway
- microsserviço `ai-intelligence` em Node.js + TypeScript
- stack de observabilidade com Prometheus, Grafana, InfluxDB, cAdvisor e Allure

O backend continua sendo o núcleo transacional e o ponto central de autenticação, autorização e multi-tenancy.

---

## 2. Estrutura em Camadas do Backend

Organização observada no código:

- `interfaces` — controllers REST
- `application` — services, DTOs, mappers e orquestração de casos de uso
- `domain` — entidades, enums e regras centrais
- `infrastructure` — persistência e integrações
- `shared` — paginação, exceções, exportação e utilitários transversais

Além disso, existem pacotes dedicados para:

- `security`
- `config`

---

## 3. Módulos Funcionais Implementados

Módulos confirmados no backend:

- autenticação, MFA e refresh token
- organizações, unidades e usuários
- ativos e histórico de ativos
- transferências
- inventário
- manutenção
- auditoria
- categorias
- exportação CSV
- dashboards
- depreciação
- seguros
- centros de custo
- AI Intelligence

---

## 4. Multi-Tenant

O tenant é a organização.

A implementação combina:

- contexto do usuário autenticado
- filtros e validações por `organization_id`
- checagens adicionais de ownership nas regras de serviço

Nem toda tabela precisa armazenar `organization_id` diretamente; em alguns casos o tenant é herdado por relacionamento.

---

## 5. Segurança

Camadas principais:

1. `SecurityFilterChain` com JWT stateless
2. `@PreAuthorize` nos controllers
3. validações de negócio e escopo no service layer
4. constraints e foreign keys no banco

O modelo de papéis implementado é:

- `ADMIN`
- `GESTOR`
- `OPERADOR`

Além do JWT, o sistema já suporta:

- MFA opcional via WhatsApp
- refresh tokens rotativos
- integração service-to-service com `X-AI-Service-Key`

---

## 6. Persistência

Banco principal:

- PostgreSQL

Migrations:

- Flyway

Evoluções recentes do schema:

- MFA
- refresh tokens
- dados fiscais e financeiros dos ativos
- custo de manutenção
- centros de custo
- seguros

---

## 7. Arquitetura de Deploy

Topologia local observada no `docker-compose.yml`:

```
Frontend (Nginx)
  -> Backend Spring Boot
     -> PostgreSQL
     -> AI Intelligence
     -> Prometheus / Allure / Grafana / InfluxDB
```

O frontend em Docker recebe `VITE_API_URL=/api` e usa o Nginx para proxy reverso até o backend.

---

## 8. Observabilidade e Qualidade

Componentes integrados:

- Actuator + Micrometer
- Prometheus
- Grafana
- cAdvisor
- InfluxDB para k6
- Allure para relatórios de teste

O repositório também contém:

- CI via GitHub Actions
- build e scan de imagens Docker
- suíte E2E Playwright

---

## 9. AI Intelligence

O microsserviço `ai-intelligence` roda separado do backend e é acessado pelo módulo `/api/ai`.

Coletores confirmados:

- Prometheus
- Allure
- GitHub Actions
- backend

Tipos de análise expostos hoje:

- `observability`
- `test-intelligence`
- `cicd`
- `incident`
- `risk`
- `multi-agent`

---

## 10. Resumo

A arquitetura atual é mais ampla do que a primeira versão puramente backend. Hoje ela combina aplicação transacional, capacidades financeiras, observabilidade e um sidecar de IA, mantendo o backend Spring Boot como centro de segurança, tenant e regras de negócio.
