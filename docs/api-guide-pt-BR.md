# Guia da API

---

# 1. Visão Geral

Este documento descreve a API do Sistema de Gestão de Ativos Enterprise.

A API fornece gerenciamento seguro e multi-tenant de:

- Organizações
- Unidades
- Usuários
- Ativos
- Transferências
- Ciclos de inventário
- Operações de manutenção
- Logs de auditoria

A API segue os princípios REST e utiliza JSON para os dados de requisição e resposta.

---

# 2. URL Base

Desenvolvimento:

http://localhost:8080

Produção:

https://api.yourdomain.com

> **Nota:** A API não utiliza prefixo de versionamento nas rotas (ex.: `/api/v1/`). Os endpoints são acessados diretamente a partir da URL base. A exceção é o módulo de manutenção, cujas rotas utilizam o prefixo `/api/maintenance`.

---

# 3. Autenticação

A API utiliza autenticação JWT (JSON Web Token).

Após login bem-sucedido, o cliente deve incluir o token em todas as requisições protegidas.

Header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

# 4. Endpoints Públicos (sem autenticação)

Os seguintes endpoints não requerem JWT:

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Autenticação e geração de token |
| POST | `/users/activation/activate` | Ativação de conta pelo usuário |
| GET | `/v3/api-docs/**` | Documentação OpenAPI |
| GET | `/swagger-ui/**` | Interface Swagger |
| GET | `/actuator/health` | Health check |

---

## POST /auth/login

Autentica o usuário e retorna um token de acesso.

Requisição:

```json
{
  "email": "user@company.com",
  "password": "password"
}
```

Resposta:

```json
{
  "accessToken": "JWT_TOKEN",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

Respostas de erro:

- `401 Unauthorized` — credenciais inválidas
- `403 Forbidden` — usuário inativo ou bloqueado

---

## POST /users/activation/activate

Permite que o usuário recém-criado defina sua senha e ative sua conta usando o token de ativação recebido.

Este endpoint é **público** — não requer JWT. O usuário ainda não possui senha no momento da criação.

---

# 5. Endpoints de Organização

## POST /organizations

Cria uma nova organização. Requer role `ADMIN`.

## GET /organizations

Retorna a lista de organizações acessíveis ao usuário.

## GET /organizations/{id}

Retorna os detalhes da organização.

---

# 6. Endpoints de Unidade

## POST /units

Cria uma nova unidade. Requer role `ADMIN` ou `GESTOR`.

## GET /units

Retorna as unidades acessíveis ao usuário.

## GET /units/{id}

Retorna os detalhes da unidade.

---

# 7. Endpoints de Usuário

Todos os endpoints abaixo requerem role `ADMIN`, exceto onde indicado.

## POST /users

Cria um novo usuário.

O usuário é criado com status `PENDING_ACTIVATION`. A senha **não** é definida neste momento — o próprio usuário a define no fluxo de ativação via `POST /users/activation/activate`.

## GET /users/{id}

Retorna os detalhes do usuário.

## PATCH /users/{id}/block

Bloqueia o usuário. Usuário bloqueado não consegue autenticar.

## PATCH /users/{id}/activate

Move o usuário para o status `ACTIVE`.

## PATCH /users/{id}/inactivate

Move o usuário para o status `INACTIVE`.

---

# 8. Endpoints de Ativo

## POST /assets/{organizationId}

Cria um novo ativo informando o `assetTag` explicitamente. Requer role `ADMIN` ou `GESTOR`.

## POST /assets/{organizationId}/auto

Cria um novo ativo com `assetTag` gerado automaticamente pelo sistema. Requer role `ADMIN` ou `GESTOR`.

## GET /assets

Retorna lista paginada de ativos com filtros opcionais.

Parâmetros de filtro suportados:

- `status` — ex.: `AVAILABLE`, `ASSIGNED`, `IN_MAINTENANCE`
- `type` — ex.: `NOTEBOOK`, `MOBILE_PHONE`
- `unitId`
- `assignedUserId`
- `assetTag`
- `model`

Suporta paginação via parâmetros `page`, `size` e `sort`.

## GET /assets/{id}

Retorna os detalhes do ativo.

## PATCH /assets/{id}/retire

Aposenta o ativo (move para `RETIRED`). Requer role `ADMIN`.

## PATCH /assets/{assetId}/assign/{userId}

Atribui o ativo a um usuário (move para `ASSIGNED`). Requer role `ADMIN` ou `GESTOR`.

## PATCH /assets/{assetId}/unassign

Remove a atribuição do ativo (retorna para `AVAILABLE`). Requer role `ADMIN` ou `GESTOR`.

---

# 9. Endpoints de Transferência

## POST /transfers

Cria uma solicitação de transferência de ativo entre unidades. Requer role `ADMIN` ou `GESTOR`.

O ativo passa imediatamente para o status `IN_TRANSFER`.

Requisição:

```json
{
  "assetId": 1,
  "toUnitId": 5,
  "reason": "Realocação de equipe"
}
```

## GET /transfers

Retorna as transferências visíveis ao usuário autenticado (como origem ou destino da unidade). Acessível por `ADMIN`, `GESTOR` e `OPERADOR`.

## PATCH /transfers/{id}/approve

Aprova uma transferência com status `PENDING`. Requer role `ADMIN` ou `GESTOR`.

## PATCH /transfers/{id}/reject

Rejeita uma transferência com status `PENDING`. O ativo retorna para `AVAILABLE`. Requer role `ADMIN` ou `GESTOR`.

## PATCH /transfers/{id}/complete

Finaliza uma transferência com status `APPROVED`. Atualiza a unidade do ativo e move para `COMPLETED`. Requer role `ADMIN` ou `GESTOR`.

---

# 10. Endpoints de Inventário

## POST /inventory

Inicia um novo ciclo de inventário para uma unidade. A sessão é criada com status `OPEN`.

## GET /inventory

Retorna os ciclos de inventário da organização do usuário autenticado.

---

# 11. Endpoints de Manutenção

> **Atenção:** As rotas de manutenção utilizam o prefixo `/api/maintenance`.

## POST /api/maintenance

Cria uma solicitação de manutenção para um ativo. Requer role `ADMIN` ou `GESTOR`.

O ativo é imediatamente movido para o status `IN_MAINTENANCE` ao criar a solicitação.

Requisição:

```json
{
  "assetId": 1,
  "description": "Teclado com teclas travadas"
}
```

## GET /api/maintenance

Retorna os registros de manutenção da organização do usuário autenticado.

## POST /api/maintenance/{id}/start

Inicia a execução da manutenção (move de `REQUESTED` para `IN_PROGRESS`). Acessível por `ADMIN`, `GESTOR` e `OPERADOR`.

## POST /api/maintenance/{id}/complete

Conclui a manutenção (move de `IN_PROGRESS` para `COMPLETED`). O ativo retorna para `AVAILABLE` ou `ASSIGNED`. Requer o parâmetro `resolution` (obrigatório). Acessível por `ADMIN`, `GESTOR` e `OPERADOR`.

Parâmetro de query:

```
resolution=Troca da bateria realizada com sucesso
```

## POST /api/maintenance/{id}/cancel

Cancela a manutenção. Não é permitido cancelar manutenções já `COMPLETED`. Requer role `ADMIN` ou `GESTOR`.

---

# 12. Endpoints de Auditoria

## GET /audit

Retorna os logs de auditoria. Restrito a usuários autorizados.

---

# 13. Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 OK | Requisição bem-sucedida |
| 201 Created | Recurso criado |
| 400 Bad Request | Erro de validação |
| 401 Unauthorized | Autenticação necessária |
| 403 Forbidden | Permissão insuficiente |
| 404 Not Found | Recurso não encontrado |
| 409 Conflict | Conflito de estado (ex.: transição inválida) |
| 500 Internal Server Error | Erro interno do servidor |

---

# 14. Formato de Resposta de Erro

Formato padrão:

```json
{
  "errors": [
    {
      "field": "fieldName",
      "message": "descrição do erro",
      "code": "ERROR_CODE"
    }
  ]
}
```

---

# 15. Considerações de Segurança

- Todos os endpoints exigem autenticação JWT, exceto os listados na seção 4
- O acesso é restrito por role e tenant (organização)
- O acesso entre tenants é estritamente proibido
- Todas as ações críticas geram logs de auditoria
- O endpoint `/actuator/**` (exceto `/actuator/health`) é restrito à role `ADMIN`

---

# 16. Comportamento Multi-Tenant

Todas as requisições operam dentro do escopo da organização do usuário autenticado.

Os dados são automaticamente filtrados pela organização.

O acesso entre tenants não é permitido e é considerado uma falha crítica de segurança.