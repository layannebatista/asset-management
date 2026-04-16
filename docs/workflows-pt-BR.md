# Fluxos de Trabalho

Este documento descreve os fluxos operacionais implementados hoje no sistema, com foco nas transições observadas nos controllers e services atuais.

---

# 1. Visão Geral

Os fluxos principais continuam cobrindo:

- ciclo de vida do ativo
- transferência
- inventário
- manutenção
- autenticação, ativação e autorização
- auditoria

Além disso, o sistema agora inclui fluxos complementares para MFA, refresh token, depreciação, seguros e exportações.

---

# 2. Fluxo do Ciclo de Vida do Ativo

Estados documentados no domínio atual:

- `AVAILABLE`
- `ASSIGNED`
- `IN_TRANSFER`
- `IN_MAINTENANCE`
- `UNAVAILABLE`
- `RETIRED`

Transições típicas:

- criação -> `AVAILABLE`
- atribuição -> `ASSIGNED`
- desatribuição -> `AVAILABLE`
- abertura de transferência -> `IN_TRANSFER`
- abertura de manutenção -> `IN_MAINTENANCE`
- aposentadoria -> `RETIRED`

O sistema também mantém histórico em:

- `asset_assignment_history`
- `asset_status_history`

---

## Fluxo de Criação de Ativo

1. `ADMIN` ou `GESTOR` cria o ativo manualmente ou com tag automática
2. o sistema valida organização, unidade, tipo e unicidade da tag
3. o ativo nasce com status `AVAILABLE`
4. dados fiscais e financeiros podem ser complementados depois por `PATCH /assets/{id}/financial`

---

## Fluxo de Atribuição de Ativo

1. `ADMIN` ou `GESTOR` chama `PATCH /assets/{assetId}/assign/{userId}`
2. o sistema valida tenant, ativo e usuário
3. o ativo passa para `ASSIGNED`
4. o vínculo com `user_id` é atualizado
5. o histórico de atribuição é persistido

Fluxo inverso:

1. `PATCH /assets/{assetId}/unassign`
2. o ativo volta para `AVAILABLE`
3. o vínculo com usuário é removido

---

## Fluxo de Aposentadoria

1. `ADMIN` chama `PATCH /assets/{id}/retire`
2. o sistema bloqueia aposentadoria repetida
3. o ativo passa para `RETIRED`
4. históricos e auditoria são atualizados

---

# 3. Fluxo de Transferência

Estados da transferência:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `COMPLETED`
- `CANCELLED`

Fluxo principal:

1. usuário autenticado cria a solicitação
2. o sistema valida ativo, tenant, unidade destino e conflitos
3. o ativo vai para `IN_TRANSFER`
4. a solicitação nasce em `PENDING`
5. `ADMIN` ou `GESTOR` aprova ou rejeita
6. a conclusão atualiza a unidade do ativo e encerra o processo

Observação:

- aprovação e rejeição são restritas por role
- conclusão e cancelamento possuem validação adicional de negócio no service

---

# 4. Fluxo de Inventário

Estados atuais:

- `OPEN`
- `IN_PROGRESS`
- `CLOSED`
- `CANCELLED`

Fluxo:

1. `ADMIN` ou `GESTOR` cria a sessão com `POST /inventory`
2. a sessão nasce em `OPEN`
3. `PATCH /inventory/{id}/start` move para `IN_PROGRESS`
4. a verificação física é registrada em `inventory_items`
5. `PATCH /inventory/{id}/close` encerra a sessão
6. `PATCH /inventory/{id}/cancel` é alternativa de interrupção

`OPERADOR` pode consultar sessões, mas não iniciar, fechar ou cancelar.

---

# 5. Fluxo de Manutenção

Estados atuais:

- `REQUESTED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

Fluxo:

1. `ADMIN` ou `GESTOR` cria a manutenção em `/maintenance`
2. o ativo é movido para `IN_MAINTENANCE` já na criação
3. o registro nasce em `REQUESTED`
4. `ADMIN`, `GESTOR` ou `OPERADOR` podem iniciar com `/maintenance/{id}/start`
5. a conclusão em `/maintenance/{id}/complete` exige `resolution` e pode receber `actualCost`
6. o ativo retorna para `ASSIGNED` ou `AVAILABLE`
7. cancelamento é permitido apenas para `ADMIN` e `GESTOR`

O módulo também expõe:

- listagem paginada com filtros
- relatório de orçamento em `/maintenance/budget`

---

# 6. Fluxo de Autenticação

## Login sem MFA

1. usuário envia e-mail e senha para `/auth/login`
2. a API valida status e credenciais
3. retorna `accessToken` e `refreshToken`

## Login com MFA

1. usuário envia login e senha
2. a API detecta `phoneNumber` cadastrado
3. gera OTP e retorna desafio MFA
4. usuário envia o código para `/auth/mfa/verify`
5. a API retorna `accessToken` e `refreshToken`

## Renovação

1. cliente chama `/auth/refresh`
2. o refresh token anterior é revogado
3. novo par de tokens é emitido

## Logout

1. cliente autenticado chama `/auth/logout`
2. refresh tokens do usuário são revogados

---

# 7. Fluxo de Ativação de Conta

1. `ADMIN` cria o usuário sem senha
2. o usuário fica em `PENDING_ACTIVATION`
3. um token de ativação pode ser gerado por `/users/activation/token/{userId}`
4. o usuário chama `/users/activation/activate`
5. define a senha
6. o token é marcado como usado
7. o status muda para `ACTIVE`

---

# 8. Fluxo de Autorização

1. a requisição entra com `Authorization: Bearer ...`
2. o filtro JWT valida assinatura e expiração
3. o Spring Security popula o contexto autenticado
4. `@PreAuthorize` valida o papel exigido
5. os serviços reforçam tenant e ownership
6. a operação é executada ou rejeitada com `401/403`

---

# 9. Fluxos Complementares

## Depreciação

- cálculo individual em `/assets/{id}/depreciation`
- portfolio e relatório com base nos campos financeiros do ativo

## Seguro

- cadastro de apólice por ativo
- consulta de apólice ativa
- listagem de vencimentos próximos e resumo

## Exportação

- CSV de ativos
- CSV de manutenção
- CSV de auditoria

## AI Intelligence

- análises acionadas pelo backend via `/api/ai/analysis/*`
- histórico acessível para usuários autenticados

---

# 10. Tratamento de Erros

O tratamento é centralizado por handlers globais no backend. Os cenários mais comuns são:

- validação de entrada
- entidade não encontrada
- conflito de estado
- acesso negado
- erro de autenticação

O formato de resposta pode variar conforme a origem, então consumidores devem priorizar o status HTTP e a mensagem retornada.
