# Sistema Enterprise de Gestão de Ativos

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-green)
![Arquitetura](https://img.shields.io/badge/Architecture-Enterprise-orange)
![Segurança](https://img.shields.io/badge/Security-JWT-red)
![Banco de Dados](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Docker](https://img.shields.io/badge/Containerized-Docker-blue)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

Plataforma enterprise multi-tenant para gestão completa do ciclo de vida de ativos, desenvolvida com foco em arquitetura backend avançada e automação de APIs.

---

# 🚀 Início Rápido (Docker - Recomendado)

Clone o repositório:

```bash
git clone <url-do-seu-repositorio>
cd asset-management
```

Inicie toda a aplicação:

```bash
docker compose up --build
```

Acesse:

- API → http://localhost:8080
- Swagger UI → http://localhost:8080/swagger-ui/index.html
- Health Check → http://localhost:8080/actuator/health

Para parar:

```bash
docker compose down
```

Para parar e remover o volume do banco de dados:

```bash
docker compose down -v
```

Não é necessário ter Java ou PostgreSQL instalados localmente.

---

# 🏗 Objetivo do Projeto

Este projeto foi construído com dois objetivos principais:

1. Simular uma arquitetura backend real de nível enterprise.
2. Servir como base para prática de automação de APIs utilizando Rest Assured, Playwright e Cypress.

Qualquer pessoa pode clonar, fazer fork, copiar e utilizar este projeto para fins de aprendizado.

---

# 🏛 Arquitetura

Arquitetura enterprise em camadas:

```
Cliente
 ↓
API REST (Spring Boot)
 ↓
Camada de Aplicação
 ↓
Camada de Domínio
 ↓
Camada de Persistência
 ↓
PostgreSQL
```

A camada de segurança intercepta todas as requisições utilizando autenticação JWT.

O sistema segue:

- Separação de responsabilidades
- Princípios de Clean Architecture
- Estrutura inspirada em Domain-Driven Design
- Segurança stateless com JWT
- Isolamento multi-tenant

---

# 🧠 Funcionalidades Principais

- Autenticação com JWT
- Autorização baseada em papéis (ADMIN, MANAGER, OPERATOR)
- Isolamento de organizações (multi-tenant)
- Gestão do ciclo de vida de ativos
- Geração automática de assetTag
- Controle de inventário
- Fluxo de manutenção
- Fluxo de transferências
- Auditoria completa
- Paginação e filtros avançados
- Controle de concorrência com @Version (Optimistic Locking)

---

# 🛠 Tecnologias Utilizadas

## Backend

- Java 17
- Spring Boot 3
- Spring Security
- JWT
- JPA / Hibernate
- Flyway
- H2 (perfil de teste)

## Banco de Dados

- PostgreSQL 16
- Ambiente totalmente containerizado com Docker

## Documentação

- OpenAPI
- Swagger UI
- Coleção Postman
- Estrutura BDD

## Preparado para Automação

- Rest Assured (automação de API)
- Playwright (automação frontend)
- Cypress (automação frontend)

---

# 📂 Estrutura do Projeto

```
asset-management/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│
├── patrimonio-frontend/
│
├── docker-compose.yml
├── docs/
├── openapi/
├── postman/
```

---

# 🔐 Autenticação

Todos os endpoints protegidos exigem autenticação JWT.

### Como testar:

1. Acesse `/auth/login`
2. Copie o token retornado
3. Clique em "Authorize" no Swagger
4. Cole:

```
Bearer SEU_TOKEN_AQUI
```

---

# 🐳 Ambiente Docker

Quando executado via Docker:

Container do banco de dados:

- Host: `postgres`
- Porta: `5432`
- Banco: `asset_management`
- Usuário: `asset_user`
- Senha: `asset123`

Container do backend:

- Porta: `8080`
- Perfil ativo: `docker`

---

# 🧪 Executando os Testes

Execute todos os testes do backend:

```bash
mvn test
```

Inclui:

- Testes unitários
- Testes de integração
- Estrutura preparada para automação com Rest Assured

---

# 🧪 Estratégia de Automação

Este projeto está estruturado para suportar três estratégias de automação:

### 1️⃣ Automação de API (Rest Assured)

Validar:

- Autenticação
- Autorização por papéis
- Fluxos completos do ciclo de vida do ativo
- Paginação e filtros
- Regras de negócio
- Cenários negativos

### 2️⃣ Automação de UI (Cypress)

Testes de comportamento do frontend.

### 3️⃣ Automação de UI (Playwright)

Testes end-to-end e execução cross-browser.

---

# ⚙ Perfis de Configuração

## application.yml (Desenvolvimento Local)

Utiliza PostgreSQL em:

```
localhost:5433
```

## application-docker.yml

Utiliza rede interna do Docker:

```
postgres:5432
```

Flyway desabilitado no perfil Docker.  
Schema gerado automaticamente para ambiente de desenvolvimento.

---

# 🧩 Documentação da API

Swagger UI:

```
http://localhost:8080/swagger-ui/index.html
```

OpenAPI JSON:

```
http://localhost:8080/v3/api-docs
```

---

# 🛡 Segurança

- Autenticação JWT stateless
- Autorização baseada em papéis
- Segurança em nível de método
- Configuração CORS
- Criptografia de senhas
- Tratamento global de exceções

---

# 📌 Filosofia de Desenvolvimento

Este projeto prioriza:

- Estrutura enterprise
- Separação clara de camadas
- Design orientado à segurança
- APIs preparadas para automação
- Práticas reais de arquitetura de produção

Foi intencionalmente estruturado para se aproximar de sistemas corporativos reais.

---

# 👩‍💻 Autora

Projeto backend com arquitetura enterprise focado em aprendizado avançado de estratégias de automação QA.

Construído como base para prática de automação de APIs e testes end-to-end.

---

# 📜 Licença

Projeto aberto para fins de aprendizado.

Sinta-se à vontade para utilizar, fazer fork e adaptar.