# Guia da API

Este documento descreve os endpoints implementados atualmente no backend Spring Boot e foi validado contra os controllers em `backend/src/main/java/.../interfaces/rest`.

---

# 1. Visão Geral

A API REST é multi-tenant e usa JSON para entrada e saída. Os módulos atualmente expostos são:

- autenticação e ativação de conta
- organizações, unidades e usuários
- ativos e histórico de ativos
- transferências, inventário e manutenção
- categorias, auditoria e exportação CSV
- dashboards, depreciação, seguros, centros de custo e AI Intelligence

---

# 2. URL Base

Desenvolvimento:

`http://localhost:8080`

Documentação OpenAPI gerada pela aplicação:

- `GET /v3/api-docs`
- `GET /swagger-ui.html`

---

# 3. Autenticação

A API usa JWT Bearer.

Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Fluxo atual:

1. `POST /auth/login`
2. se o usuário tiver telefone cadastrado, a API retorna desafio MFA
3. `POST /auth/mfa/verify` emite `accessToken` e `refreshToken`
4. `POST /auth/refresh` faz rotação do refresh token
5. `POST /auth/logout` revoga os refresh tokens do usuário autenticado

---

# 4. Endpoints Públicos

Os seguintes endpoints não exigem JWT:

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login inicial |
| POST | `/auth/mfa/verify` | Conclusão do MFA |
| POST | `/auth/refresh` | Renovação de token |
| POST | `/users/activation/activate` | Ativação de conta |
| GET | `/v3/api-docs/**` | OpenAPI |
| GET | `/swagger-ui/**` | Swagger UI |
| GET | `/swagger-ui.html` | Swagger UI |
| GET | `/actuator/health` | Health check |
| GET | `/actuator/health/**` | Health details |
| GET | `/actuator/prometheus` | Métricas Prometheus |

---

# 5. Endpoints de Autenticação

## POST /auth/login

Autentica com e-mail e senha.

- usuário com `phoneNumber`: retorna `mfaRequired: true`
- usuário sem telefone: retorna `accessToken` + `refreshToken`

## POST /auth/mfa/verify

Valida o OTP de 6 dígitos enviado via WhatsApp e retorna `accessToken` + `refreshToken`.

## POST /auth/refresh

Recebe `refreshToken` válido e retorna novo par de tokens.

## POST /auth/logout

Revoga os refresh tokens do usuário autenticado.

---

# 6. Endpoints de Organização

Todos exigem role `ADMIN`.

| Método | Rota |
|---|---|
| GET | `/organizations` |
| GET | `/organizations/{id}` |
| POST | `/organizations` |
| PATCH | `/organizations/{id}` |
| PATCH | `/organizations/{id}/activate` |
| PATCH | `/organizations/{id}/inactivate` |

---

# 7. Endpoints de Unidade

| Método | Rota | Acesso |
|---|---|---|
| POST | `/units/{organizationId}` | `ADMIN`, `GESTOR` |
| GET | `/units/{organizationId}` | `ADMIN`, `GESTOR` |
| GET | `/units/unit/{id}` | `ADMIN`, `GESTOR` |
| PATCH | `/units/{id}/activate` | `ADMIN`, `GESTOR` |
| PATCH | `/units/{id}/inactivate` | `ADMIN`, `GESTOR` |

---

# 8. Endpoints de Usuário

| Método | Rota | Acesso |
|---|---|---|
| GET | `/users` | `ADMIN`, `GESTOR`, `OPERADOR` |
| POST | `/users` | `ADMIN` |
| GET | `/users/{id}` | `ADMIN` |
| PATCH | `/users/{id}/block` | `ADMIN` |
| PATCH | `/users/{id}/activate` | `ADMIN` |
| PATCH | `/users/{id}/inactivate` | `ADMIN` |
| POST | `/users/activation/token/{userId}` | `ADMIN` |
| POST | `/users/activation/activate` | público |

Observações:

- a listagem suporta filtros `status`, `unitId` e `includeInactive`
- o usuário é criado sem senha e com ativação posterior por token
- o cadastro já aceita `phoneNumber`, o que habilita MFA no login

---

# 9. Endpoints de Ativo

| Método | Rota | Acesso |
|---|---|---|
| GET | `/assets` | `ADMIN`, `GESTOR`, `OPERADOR` |
| GET | `/assets/{id}` | `ADMIN`, `GESTOR`, `OPERADOR` |
| POST | `/assets/{organizationId}` | `ADMIN`, `GESTOR` |
| POST | `/assets/{organizationId}/auto` | `ADMIN`, `GESTOR` |
| PATCH | `/assets/{id}/retire` | `ADMIN` |
| PATCH | `/assets/{assetId}/assign/{userId}` | `ADMIN`, `GESTOR` |
| PATCH | `/assets/{assetId}/unassign` | `ADMIN`, `GESTOR` |
| PATCH | `/assets/{id}/financial` | `ADMIN`, `GESTOR` |

Filtros suportados em `GET /assets`:

- `status`
- `type`
- `unitId`
- `assignedUserId`
- `assetTag`
- `model`
- `search`
- paginação via `page`, `size` e `sort`

---

# 10. Histórico de Ativos

| Método | Rota | Acesso |
|---|---|---|
| GET | `/assets/{assetId}/history/status` | `ADMIN`, `GESTOR` |
| GET | `/assets/{assetId}/history/assignment` | `ADMIN`, `GESTOR` |

---

# 11. Transferências

| Método | Rota | Acesso |
|---|---|---|
| GET | `/transfers` | autenticado |
| POST | `/transfers` | autenticado |
| PATCH | `/transfers/{id}/approve` | `ADMIN`, `GESTOR` |
| PATCH | `/transfers/{id}/reject` | `ADMIN`, `GESTOR` |
| PATCH | `/transfers/{id}/complete` | autenticado |
| PATCH | `/transfers/{id}/cancel` | autenticado |

O fluxo de negócio continua validando tenant, unidade e estado da transferência.

---

# 12. Inventário

| Método | Rota | Acesso |
|---|---|---|
| POST | `/inventory` | `ADMIN`, `GESTOR` |
| GET | `/inventory` | `ADMIN`, `GESTOR`, `OPERADOR` |
| GET | `/inventory/{id}` | `ADMIN`, `GESTOR`, `OPERADOR` |
| PATCH | `/inventory/{id}/start` | `ADMIN`, `GESTOR` |
| PATCH | `/inventory/{id}/close` | `ADMIN`, `GESTOR` |
| PATCH | `/inventory/{id}/cancel` | `ADMIN`, `GESTOR` |

---

# 13. Manutenção

As rotas implementadas usam o prefixo `/maintenance`, sem `/api`.

| Método | Rota | Acesso |
|---|---|---|
| GET | `/maintenance` | autenticado |
| GET | `/maintenance/budget` | `ADMIN`, `GESTOR` |
| POST | `/maintenance` | `ADMIN`, `GESTOR` |
| POST | `/maintenance/{id}/start` | `ADMIN`, `GESTOR`, `OPERADOR` |
| POST | `/maintenance/{id}/complete` | `ADMIN`, `GESTOR`, `OPERADOR` |
| POST | `/maintenance/{id}/cancel` | `ADMIN`, `GESTOR` |

Filtros disponíveis na listagem:

- `status`
- `assetId`
- `unitId`
- `requestedByUserId`
- `startDate`
- `endDate`

---

# 14. Categorias, Auditoria e Exportação

## Categorias

`/categories`

- `POST`, `PUT`, `DELETE`: `ADMIN`, `GESTOR`
- `GET`, `GET /{id}`: `ADMIN`, `GESTOR`, `OPERADOR`

## Auditoria

`/audit`

- `GET /audit`
- `GET /audit/user/{userId}`
- `GET /audit/type/{type}`
- `GET /audit/target`
- `GET /audit/period`
- `GET /audit/target/last`

Acesso: `ADMIN`, `GESTOR`

## Exportação CSV

`/export`

- `GET /export/assets` — `ADMIN`, `GESTOR`
- `GET /export/maintenance` — `ADMIN`, `GESTOR`
- `GET /export/audit` — `ADMIN`

---

# 15. Módulos Financeiros e Complementares

## Depreciação

`/assets/{id}/depreciation`, `/assets/depreciation/portfolio`, `/assets/depreciation/report`

## Seguros

`/assets/{assetId}/insurance`, `/assets/{assetId}/insurance/active`, `/assets/insurance/expiring`, `/assets/insurance/summary`

## Centros de custo

`/cost-centers`

## Dashboards

- `/api/dashboard/executive` — `ADMIN`
- `/api/dashboard/unit` — `GESTOR`
- `/api/dashboard/personal` — `OPERADOR`

## AI Intelligence

- `POST /api/ai/analysis/observability`
- `POST /api/ai/analysis/test-intelligence`
- `POST /api/ai/analysis/cicd`
- `POST /api/ai/analysis/incident`
- `POST /api/ai/analysis/risk`
- `POST /api/ai/analysis/multi-agent`
- `GET /api/ai/analysis/history`
- `GET /api/ai/analysis/{id}`

---

# 16. Códigos HTTP e Erros

Códigos mais frequentes:

- `200 OK`
- `201 Created`
- `204 No Content`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `500 Internal Server Error`

O formato de erro é centralizado pelo `GlobalExceptionHandler` e pelo entry point JWT. O payload pode variar conforme a origem da falha, então o cliente deve tratar pelo status HTTP e pelos campos textuais retornados.

---

# 17. Considerações de Segurança

- `@PreAuthorize` é aplicado diretamente nos controllers
- `/actuator/prometheus` é público para scrape do Prometheus
- os demais endpoints `/actuator/**` exigem `ADMIN`
- o isolamento multi-tenant continua sendo reforçado na camada de serviço e nas queries
