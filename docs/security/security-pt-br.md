# Segurança

Este documento foi revisado contra `SecurityConfig`, `AuthController` e os controllers REST atuais.

---

# 1. Visão Geral

O sistema aplica defesa em profundidade com:

- JWT stateless
- MFA opcional via WhatsApp
- refresh tokens rotativos
- RBAC com `@PreAuthorize`
- isolamento multi-tenant
- auditoria de operações críticas

---

# 2. Autenticação

## Login principal

O fluxo começa em `POST /auth/login`.

Comportamento atual:

- usuário com telefone cadastrado: a autenticação exige MFA e o login inicial retorna `mfaRequired: true`
- usuário sem telefone cadastrado: a API já retorna `accessToken` e `refreshToken`

## MFA

`POST /auth/mfa/verify`

- OTP de 6 dígitos
- expiração padrão de 5 minutos
- uso único
- persistido em `mfa_codes`

## Renovação de sessão

`POST /auth/refresh`

- faz rotação do refresh token
- revoga o token anterior
- usa a tabela `refresh_tokens`

## Logout

`POST /auth/logout`

- revoga os refresh tokens do usuário autenticado
- o access token atual segue válido até expirar

---

# 3. JWT

O JWT é assinado com `JWT_SECRET` e validado em todas as rotas protegidas pelo `JwtAuthenticationFilter`.

Configuração atual em `application.yml`:

- `security.jwt.expiration`: padrão `3600000` ms
- `security.jwt.refresh-expiration`: padrão `604800`

Claims e contexto efetivo usados pela aplicação incluem identidade, organização e role do usuário autenticado.

---

# 4. Autorização

O modelo é RBAC com três papéis:

| Role | Descrição |
|---|---|
| `ADMIN` | acesso global da organização, inclusive governança e operações sensíveis |
| `GESTOR` | gestão operacional de ativos, transferências, manutenção e parte analítica |
| `OPERADOR` | acesso operacional e leitura limitada |

Exemplos reais do código:

- `ADMIN`: organizações, centros de custo, aposentadoria de ativo, dashboard executivo
- `ADMIN` e `GESTOR`: criação de ativo, manutenção, orçamento, AI analyses
- `ADMIN`, `GESTOR`, `OPERADOR`: leitura de ativos, inventário por ID, parte do fluxo de manutenção

---

# 5. Endpoints Públicos

Rotas liberadas explicitamente pelo `SecurityConfig`:

- `/auth/**`
- `/users/activation/activate`
- `/v3/api-docs/**`
- `/swagger-ui/**`
- `/swagger-ui.html`
- `/actuator/health`
- `/actuator/health/**`
- `/actuator/prometheus`
- `OPTIONS /**`

Os demais endpoints exigem autenticação.

---

# 6. Actuator e Observabilidade

Regras atuais:

- `/actuator/health` e variações são públicos
- `/actuator/prometheus` é público para scrape do Prometheus
- demais rotas `/actuator/**` exigem `ADMIN`

Isso é importante porque o Prometheus do `docker-compose` depende de acesso livre a `/actuator/prometheus`.

---

# 7. Isolamento Multi-Tenant

O isolamento ocorre em múltiplas camadas:

- contexto autenticado do usuário
- validações de ownership e tenant na camada de serviço
- queries filtradas por `organization_id` ou por relacionamentos derivados do tenant

O código ainda utiliza `LoggedUserContext` em partes do sistema para resolver organização, unidade e usuário autenticado.

---

# 8. Senhas e Ativação

- senha nunca é armazenada em texto puro
- `password_hash` pode ser `NULL` até o usuário ativar a conta
- o hash é BCrypt
- a ativação usa `user_activation_tokens`
- o endpoint público de ativação continua sendo `POST /users/activation/activate`

---

# 9. CORS e Superfície HTTP

CORS é centralizado em `SecurityConfig`.

Configuração atual:

- origens via `app.cors.allowed-origins`
- métodos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- headers permitidos: `*`
- header exposto: `Authorization`
- `allowCredentials=true`

---

# 10. Auditoria

Operações críticas geram eventos em `audit_events`. Além disso, o sistema mantém histórico dedicado de ativos em:

- `asset_assignment_history`
- `asset_status_history`

Esses registros reforçam rastreabilidade operacional e investigação.

---

# 11. Concorrência e Integridade

Além de `@Version` nas entidades principais, existem serviços especializados para reduzir condições de corrida:

- `MaintenanceLockService`
- `InventoryLockService`
- `TransferConcurrencyService`
- `OptimisticLockService`

---

# 12. Segurança de Infraestrutura

Controles atuais observados:

- segredos via `.env` e variáveis de ambiente
- banco configurado por `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- Hibernate em modo `validate`
- serviço de IA protegido por `X-AI-Service-Key`
- rate limiting no serviço `ai-intelligence` com `express-rate-limit`

---

# 13. Recomendações Operacionais

Para produção:

- habilitar HTTPS no proxy ou balanceador
- usar `JWT_SECRET` e `AI_SERVICE_API_KEY` com alta entropia
- restringir `CORS_ALLOWED_ORIGINS` a domínios válidos
- não expor PostgreSQL publicamente
- rotacionar credenciais SMTP, banco e tokens de integração
