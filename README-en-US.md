# Enterprise Asset Management System

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-green)
![Architecture](https://img.shields.io/badge/Architecture-Enterprise-orange)
![Security](https://img.shields.io/badge/Security-JWT-red)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Docker](https://img.shields.io/badge/Containerized-Docker-blue)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

Enterprise-grade multi-tenant asset lifecycle management platform built for learning advanced backend architecture and API automation.

---

# 🚀 Quick Start (Docker - Recommended)

Clone the repository:

```bash
git clone <your-repo-url>
cd asset-management
```

Start the entire application:

```bash
docker compose up --build
```

Access:

- API → http://localhost:8080
- Swagger UI → http://localhost:8080/swagger-ui/index.html
- Health Check → http://localhost:8080/actuator/health

To stop:

```bash
docker compose down
```

To stop and remove database volume:

```bash
docker compose down -v
```

No local Java or PostgreSQL installation required.

---

# 🏗 Project Purpose

This project was built with two main goals:

1. Simulate a real enterprise backend architecture.
2. Serve as a base project to practice API automation using Rest Assured, Playwright, and Cypress.

Anyone is free to clone, fork, copy, and use this project for learning purposes.

---

# 🏛 Architecture

Layered enterprise architecture:

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

Security layer intercepts all requests using JWT authentication.

The system follows:

- Separation of concerns
- Clean architecture principles
- Domain-driven design structure
- Stateless JWT security
- Multi-tenant isolation

---

# 🧠 Core Features

- JWT authentication
- Role-based authorization (ADMIN, MANAGER, OPERATOR)
- Multi-tenant organization isolation
- Asset lifecycle management
- Automatic asset tag generation
- Inventory control
- Maintenance workflow
- Transfer workflow
- Audit logging
- Pagination and filtering
- Optimistic locking (@Version)

---

# 🛠 Tech Stack

## Backend

- Java 17
- Spring Boot 3
- Spring Security
- JWT
- JPA / Hibernate
- Flyway
- H2 (test profile)

## Database

- PostgreSQL 16
- Dockerized environment

## Documentation

- OpenAPI
- Swagger UI
- Postman collection
- BDD structure

## Automation Ready

- Rest Assured (API automation)
- Playwright (frontend automation)
- Cypress (frontend automation)

---

# 📂 Project Structure

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

# 🔐 Authentication

All protected endpoints require JWT authentication.

### How to test:

1. Call `/auth/login`
2. Copy the returned token
3. Click "Authorize" in Swagger
4. Paste:

```
Bearer YOUR_TOKEN
```

---

# 🐳 Docker Environment

When running via Docker:

Database container:

- Host: `postgres`
- Port: `5432`
- Database: `asset_management`
- User: `asset_user`
- Password: `asset123`

Backend container:

- Port: `8080`
- Active profile: `docker`

---

# 🧪 Running Tests

Run all backend tests:

```bash
mvn test
```

Includes:

- Unit tests
- Integration tests
- Rest Assured setup for API automation

---

# 🧪 Automation Learning Strategy

This project is structured to support three automation strategies:

### 1️⃣ API Automation (Rest Assured)

Validate:

- Authentication
- Role authorization
- Asset lifecycle flows
- Pagination and filtering
- Business rules
- Negative scenarios

### 2️⃣ UI Automation (Cypress)

Frontend behavior testing.

### 3️⃣ UI Automation (Playwright)

End-to-end automation and cross-browser testing.

---

# ⚙ Profiles

## application.yml (Local Development)

Uses PostgreSQL on:

```
localhost:5433
```

## application-docker.yml

Uses Docker network:

```
postgres:5432
```

Flyway disabled in Docker profile.
Schema auto-created for development.

---

# 🧩 API Documentation

Swagger UI:

```
http://localhost:8080/swagger-ui/index.html
```

OpenAPI JSON:

```
http://localhost:8080/v3/api-docs
```

---

# 🛡 Security

- Stateless JWT authentication
- Role-based authorization
- Method-level security
- CORS configuration
- Password encryption
- Global exception handling

---

# 📌 Development Philosophy

This project prioritizes:

- Enterprise structure
- Clean separation of layers
- Security-first design
- Automation-ready APIs
- Real-world architecture practices

It is intentionally structured to resemble production-grade systems.

---

# 👩‍💻 Author

Backend enterprise architecture project focused on learning advanced QA automation strategies.

Built as a foundation for API and UI automation practice.

---

# 📜 License

This project is open for learning purposes.

Feel free to use, fork, and adapt.

