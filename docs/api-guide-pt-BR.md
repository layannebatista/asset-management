# Guia da API

Gerado em: 2026-02-18 02:19:12.433813

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

---

# 3. Autenticação

A API utiliza autenticação JWT (JSON Web Token).

Após login bem-sucedido, o cliente deve incluir o token em todas as requisições.

Header:

Authorization: Bearer <JWT_TOKEN>

---

# 4. Endpoints de Autenticação

## POST /auth/login

Autentica o usuário e retorna um token de acesso.

Requisição:

{
  "email": "user@company.com",
  "password": "password"
}

Resposta:

{
  "accessToken": "JWT_TOKEN",
  "tokenType": "Bearer",
  "expiresIn": 3600
}

Respostas de erro:

401 Unauthorized – credenciais inválidas

403 Forbidden – usuário inativo ou bloqueado

---

# 5. Endpoints de Organização

## POST /organizations

Cria uma nova organização.

Requer privilégios de administrador.

## GET /organizations

Retorna a lista de organizações acessíveis ao usuário.

## GET /organizations/{id}

Retorna os detalhes da organização.

---

# 6. Endpoints de Unidade

## POST /units

Cria uma nova unidade.

## GET /units

Retorna as unidades acessíveis ao usuário.

## GET /units/{id}

Retorna os detalhes da unidade.

---

# 7. Endpoints de Usuário

## POST /users

Cria um novo usuário.

## GET /users

Retorna a lista de usuários.

## GET /users/{id}

Retorna os detalhes do usuário.

---

# 8. Endpoints de Ativo

## POST /assets

Cria um novo ativo.

## GET /assets

Retorna a lista de ativos.

Suporta filtragem.

## GET /assets/{id}

Retorna os detalhes do ativo.

---

# 9. Endpoints de Transferência

## POST /transfers

Cria uma solicitação de transferência.

## GET /transfers

Retorna as transferências.

---

# 10. Endpoints de Inventário

## POST /inventory

Inicia um ciclo de inventário.

## GET /inventory

Retorna os ciclos de inventário.

---

# 11. Endpoints de Manutenção

## POST /maintenance

Cria uma solicitação de manutenção.

## GET /maintenance

Retorna os registros de manutenção.

---

# 12. Endpoints de Auditoria

## GET /audit

Retorna os logs de auditoria.

Restrito a usuários autorizados.

---

# 13. Códigos de Status HTTP

200 OK – requisição bem-sucedida

201 Created – recurso criado

400 Bad Request – erro de validação

401 Unauthorized – autenticação necessária

403 Forbidden – permissão insuficiente

404 Not Found – recurso não encontrado

500 Internal Server Error – erro interno do servidor

---

# 14. Formato de Resposta de Erro

Formato padrão:

{
  "errors": [
    {
      "field": "fieldName",
      "message": "descrição do erro",
      "code": "ERROR_CODE"
    }
  ]
}

---

# 15. Considerações de Segurança

- Todos os endpoints exigem autenticação, exceto o login
- O acesso é restrito por role e tenant
- O acesso entre tenants é proibido
- Todas as ações geram logs de auditoria

---

# 16. Versionamento

Estratégia de versionamento da API:

/api/v1/

Versões futuras manterão compatibilidade retroativa.

---

# 17. Comportamento Multi-Tenant

Todas as requisições operam dentro do escopo da organização do usuário.

Os dados são automaticamente filtrados pela organização.

O acesso entre tenants não é permitido.
