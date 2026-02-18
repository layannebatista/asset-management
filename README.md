# Enterprise Asset Management System

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-green)
![Architecture](https://img.shields.io/badge/Architecture-Enterprise-orange)
![Security](https://img.shields.io/badge/Security-JWT-red)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

Multi-tenant enterprise-grade asset lifecycle management platform.

---

# 🇺🇸 English

## Overview

This system provides enterprise-level management of organizational assets, including:

- Authentication and authorization (JWT)
- Multi-tenant isolation
- Asset lifecycle management
- Transfers, inventory, and maintenance workflows
- Full audit logging

Built following enterprise architecture and security best practices.

---

## Architecture

Layered architecture:

```
Client
 ↓
REST API (Spring Boot)
 ↓
Application Layer
 ↓
Domain Layer
 ↓
Persistence Layer
 ↓
PostgreSQL
```

Security layer intercepts all requests.

---

## Tech Stack

Backend:

- Java 17
- Spring Boot
- Spring Security
- JWT
- JPA / Hibernate

Database:

- PostgreSQL
- Flyway

Documentation:

- OpenAPI
- Swagger
- Postman
- BDD

---

## Running

```bash
mvn clean install
mvn spring-boot:run
```

Swagger:

```
http://localhost:8080/swagger-ui.html
```

---

## Security

Includes:

- JWT authentication
- Role-based authorization
- Tenant isolation
- Audit logging

---

# 🇧🇷 Português

## Visão Geral

Sistema enterprise para gestão completa do ciclo de vida de ativos organizacionais.

Inclui:

- Autenticação e autorização com JWT
- Isolamento multi-tenant
- Controle completo de ativos
- Transferências, inventário e manutenção
- Auditoria completa

Arquitetura projetada seguindo padrões enterprise.

---

## Arquitetura

Arquitetura em camadas:

```
Cliente
 ↓
API REST (Spring Boot)
 ↓
Camada de Aplicação
 ↓
Camada de Domínio
 ↓
Persistência
 ↓
PostgreSQL
```

---

## Executar

```bash
mvn clean install
mvn spring-boot:run
```

Swagger:

```
http://localhost:8080/swagger-ui.html
```

---

## Documentação

Ver pasta:

```
docs/
```

---

## Autor

Projeto backend enterprise.