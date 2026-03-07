# Segurança

---

# 1. Visão Geral

Este documento descreve o modelo de segurança do Sistema de Gestão de Ativos Enterprise.

O sistema implementa controles de segurança nível enterprise para garantir:

- Autenticação via JWT
- Autorização baseada em roles (RBAC)
- Isolamento multi-tenant
- Proteção de dados e credenciais
- Auditabilidade

A segurança é aplicada em todas as camadas da aplicação.

---

# 2. Autenticação

A autenticação verifica a identidade do usuário.

Método: **JWT (JSON Web Token)**

Processo de autenticação:

1. O usuário fornece e-mail e senha para `POST /auth/login`
2. O sistema valida as credenciais via BCrypt
3. O sistema verifica que o usuário está com status `ACTIVE`
4. O sistema gera um token JWT assinado
5. O cliente utiliza o token JWT no header `Authorization: Bearer <token>` em todas as requisições subsequentes

O token JWT inclui:

- Identidade do usuário (`userId`)
- Organização do usuário (`organizationId`)
- Role do usuário (`role`)
- Expiração (`exp`)

Os tokens JWT devem ser:

- Assinados com segredo seguro (configurado via variável de ambiente `JWT_SECRET`)
- Limitados por tempo (padrão: 86400000ms / 24h, configurável via `JWT_EXPIRATION`)
- Validados em cada requisição pelo `JwtAuthenticationFilter`

---

# 3. Autorização

A autorização controla o acesso aos recursos.

Modelo: **Controle de Acesso Baseado em Roles (RBAC)** implementado via `@PreAuthorize` do Spring Security.

As roles definidas no sistema são:

| Role | Nome no código | Descrição |
|------|---------------|-----------|
| Administrador | `ADMIN` | Acesso total — gerencia usuários, organizações e todas as operações |
| Gestor | `GESTOR` | Gerencia ativos, transferências e manutenções da organização |
| Operador | `OPERADOR` | Acesso de leitura e execução de manutenções |

Matriz de autorização por operação:

| Operação | ADMIN | GESTOR | OPERADOR |
|----------|-------|--------|----------|
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Criar/aposentar ativos | ✅ | ✅ | ❌ |
| Listar/visualizar ativos | ✅ | ✅ | ✅ |
| Criar transferências | ✅ | ✅ | ❌ |
| Aprovar/rejeitar/concluir transferências | ✅ | ✅ | ❌ |
| Criar/cancelar manutenções | ✅ | ✅ | ❌ |
| Iniciar/concluir manutenções | ✅ | ✅ | ✅ |
| Visualizar auditoria | ✅ | ✅ | ❌ |
| Acessar actuator | ✅ | ❌ | ❌ |

O acesso é concedido com base em:

- Role do usuário
- Escopo da organização (tenant)

Acesso não autorizado é rejeitado com `403 Forbidden`.

---

# 4. Endpoints Públicos

Os seguintes endpoints **não requerem autenticação JWT**:

| Endpoint | Justificativa |
|----------|---------------|
| `POST /auth/login` | Geração do token inicial |
| `POST /users/activation/activate` | Usuário ainda não possui senha |
| `GET /v3/api-docs/**` | Documentação OpenAPI |
| `GET /swagger-ui/**` | Interface Swagger |
| `GET /swagger-ui.html` | Interface Swagger |
| `GET /actuator/health` | Health check para infraestrutura |

Todos os demais endpoints exigem token JWT válido.

O endpoint `/actuator/**` (exceto `/actuator/health`) é restrito à role `ADMIN`.

---

# 5. Isolamento Multi-Tenant

O isolamento multi-tenant garante a separação completa dos dados entre organizações.

Regras:

- Cada organização é um tenant isolado
- Usuários acessam apenas os dados de sua própria organização
- O `organizationId` é extraído do token JWT e propagado via `LoggedUserContext`
- O acesso entre tenants é estritamente proibido e resulta em `403 Forbidden`

O isolamento multi-tenant é aplicado em:

- **Camada de filtro JWT:** organização extraída do token
- **Camada de serviço:** validação explícita de ownership (`validateOwnership`, `validateTenant`)
- **Camada de consulta ao banco de dados:** filtros por `organization_id` em todas as queries

---

# 6. Segurança de Senhas

As senhas são armazenadas de forma segura.

Método: **Hash BCrypt**

Regras:

- Senhas em texto puro nunca são armazenadas ou logadas
- A senha não é definida no momento da criação do usuário pelo ADMIN
- A senha é definida pelo próprio usuário no fluxo de ativação de conta via token seguro
- A mudança de senha é realizada apenas pelo método `changePassword()` da entidade `User`, que valida e re-hasheia

---

# 7. Segurança de Token JWT

Os tokens JWT devem ser:

- Assinados utilizando segredo seguro configurado via variável de ambiente (`JWT_SECRET`)
- Validados em todas as requisições pelo `JwtAuthenticationFilter`
- Expirados após o período configurado (padrão: 24h)

Tokens expirados ou inválidos são rejeitados com `401 Unauthorized`, retornando resposta JSON padronizada via `JwtAuthenticationEntryPoint`.

---

# 8. Segurança de Ativação de Conta

O fluxo de ativação de conta usa tokens temporários para garantir que apenas o destinatário legítimo possa ativar a conta:

- Token gerado como UUID aleatório
- Token tem prazo de expiração configurável
- Token é de uso único (marcado como `used` após utilização)
- Tokens expirados ou já usados são rejeitados
- O endpoint de ativação é público mas o token é o único meio de acesso

---

# 9. Segurança da API

Todos os endpoints protegidos exigem:

- Token JWT válido no header `Authorization: Bearer <token>`
- Autorização adequada conforme role do usuário

Requisições sem autenticação válida retornam `401 Unauthorized` com corpo JSON padronizado.

Requisições autenticadas sem a role necessária retornam `403 Forbidden`.

CORS é configurado via `SecurityConfig`:

- Origens permitidas configuráveis via variável de ambiente `CORS_ALLOWED_ORIGINS` (padrão: `http://localhost:5173`)
- Métodos permitidos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Headers permitidos: `Authorization`, `Content-Type`

---

# 10. Registro de Auditoria

Eventos de segurança e operacionais são registrados na tabela `audit_events`.

Eventos registrados incluem:

- Mudanças de status de ativos
- Operações de transferência
- Operações de manutenção
- Outras operações críticas de negócio

Os logs de auditoria são imutáveis — não é permitido alterar ou excluir registros.

---

# 11. Controle de Concorrência

Para evitar condições de corrida em operações críticas (ex.: dois usuários iniciando a mesma manutenção simultaneamente), o sistema utiliza:

- **Controle otimista** via `@Version` do Hibernate nas entidades principais
- **Locks explícitos** via `MaintenanceLockService`, `InventoryLockService` e `TransferConcurrencyService` para operações de alta contenção

---

# 12. Segurança de Infraestrutura

A segurança de infraestrutura inclui:

- Credenciais de banco de dados via variáveis de ambiente (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`)
- Segredo JWT via variável de ambiente (`JWT_SECRET`)
- Acesso ao banco de dados restrito à aplicação
- `ddl-auto: validate` — Hibernate nunca altera o schema em produção

---

# 13. Proteção de Dados

Dados sensíveis devem ser:

- Protegidos contra acesso não autorizado
- Com acesso controlado por role e tenant
- Armazenados de forma segura (passwords como hash BCrypt)

O campo `document_number` do usuário é armazenado mas não exposto desnecessariamente.

---

# 14. Pontos de Aplicação de Segurança

A segurança é aplicada em múltiplas camadas (defesa em profundidade):

1. **Camada de filtro:** `JwtAuthenticationFilter` valida o token antes de qualquer processamento
2. **Camada de controller:** `@PreAuthorize` verifica role do usuário
3. **Camada de serviço:** validação de ownership e isolamento de tenant
4. **Camada de domínio:** construtores validam integridade (unidade pertence à organização, etc.)
5. **Camada de banco de dados:** constraints, chaves estrangeiras e `organization_id` em todas as tabelas

---

# 15. Monitoramento de Segurança

O monitoramento de segurança inclui:

- Logs de auditoria para rastrear todas as operações críticas
- Endpoint `/actuator/health` público para monitoramento de infraestrutura
- Demais endpoints do actuator restritos à role `ADMIN`

---

# 16. Requisitos de Segurança para Produção

Requisitos de produção:

- HTTPS habilitado (TLS/SSL no load balancer ou aplicação)
- `JWT_SECRET` com entropia suficiente (mínimo 256 bits)
- `DB_PASSWORD` complexa e rotacionada periodicamente
- Isolamento de rede do banco de dados
- `CORS_ALLOWED_ORIGINS` configurado apenas para domínios autorizados

---

# 17. Resumo

Este modelo de segurança garante:

- Autenticação segura via JWT com expiração configurável
- Autorização granular por role (`ADMIN`, `GESTOR`, `OPERADOR`)
- Isolamento multi-tenant em todas as camadas
- Proteção de credenciais via BCrypt e variáveis de ambiente
- Ativação segura de contas via token temporário de uso único
- Auditabilidade completa das operações
- Defesa em profundidade com múltiplas camadas de controle