# Regras de Negócio

---

# 1. Visão Geral

Este documento define as regras de negócio centrais que regem o Sistema de Gestão de Ativos Enterprise.

Essas regras garantem integridade dos dados, segurança, auditabilidade e o gerenciamento adequado do ciclo de vida de todas as entidades.

Essas regras são aplicadas nas camadas de aplicação e de domínio.

---

# 2. Regras Multi-Tenant

O sistema é totalmente multi-tenant.

Regras:

- Cada organização representa um tenant
- Todos os dados pertencem exatamente a uma organização
- Todas as operações são restritas à organização do usuário
- O acesso entre tenants é estritamente proibido
- O isolamento de tenant deve ser aplicado em todas as consultas ao banco de dados e na lógica dos serviços

A violação do isolamento entre tenants é considerada uma falha crítica de segurança.

---

# 3. Regras de Organização

Regras:

- A organização deve possuir um identificador único
- A organização deve possuir um nome único no sistema
- A organização pode estar nos status `ACTIVE` ou `INACTIVE`
- Organizações inativas não podem executar operações

---

# 4. Regras de Unidade

Regras:

- A unidade deve pertencer exatamente a uma organização
- A unidade deve possuir um nome
- A unidade pode estar nos status `ACTIVE` ou `INACTIVE`
- Unidades não podem existir sem uma organização
- Uma unidade pode ser marcada como unidade principal (`is_main`)

---

# 5. Regras de Usuário

Regras:

- O usuário deve pertencer exatamente a uma organização
- O usuário deve pertencer exatamente a uma unidade
- A unidade do usuário deve pertencer à mesma organização do usuário
- O e-mail do usuário deve ser único no sistema
- O usuário deve possuir uma role válida: `ADMIN`, `GESTOR` ou `OPERADOR`
- O usuário é criado sempre com o status `PENDING_ACTIVATION`
- A senha **não** é definida no momento da criação — ela é definida pelo próprio usuário no fluxo de ativação
- Usuários com status `BLOCKED` ou `INACTIVE` não podem se autenticar
- As credenciais do usuário são armazenadas como hash BCrypt

Ciclo de vida do usuário:

```
PENDING_ACTIVATION → ACTIVE → BLOCKED
                            → INACTIVE
```

---

# 6. Regras de Ativação de Conta

Regras:

- Ao criar um usuário, o sistema gera um token de ativação com prazo de expiração
- O token é enviado ao usuário por mecanismo externo (e-mail)
- O usuário utiliza o token para definir sua senha e ativar a conta
- O token de ativação é de uso único — após utilizado, é marcado como usado
- Tokens expirados não são aceitos
- O endpoint de ativação é **público** (não requer JWT)

---

# 7. Regras de Autenticação

Regras:

- A autenticação requer e-mail e senha válidos
- Apenas usuários com status `ACTIVE` podem autenticar
- Um token JWT deve ser emitido após autenticação bem-sucedida
- O token JWT deve incluir a identidade do usuário, sua role e sua organização
- O token JWT deve expirar após o tempo configurado (padrão: 86400000ms / 24h)
- Todos os endpoints protegidos exigem um token JWT válido

---

# 8. Regras de Ativo

Regras:

- O ativo deve pertencer exatamente a uma organização
- O ativo deve pertencer exatamente a uma unidade
- O `assetTag` do ativo deve ser único no sistema
- O `assetTag` é imutável após a criação
- O ativo não pode ser excluído permanentemente (apenas aposentado)
- O ativo possui um `type` (tipo): `MOBILE_PHONE`, `NOTEBOOK`, `TABLET`, `DESKTOP`, `VEHICLE` ou `OTHER`

Status possíveis do ativo:

| Status | Descrição |
|--------|-----------|
| `AVAILABLE` | Ativo disponível, sem vínculo com usuário |
| `ASSIGNED` | Ativo vinculado a um usuário |
| `IN_TRANSFER` | Ativo em processo de transferência entre unidades |
| `IN_MAINTENANCE` | Ativo em manutenção |
| `UNAVAILABLE` | Ativo temporariamente indisponível |
| `RETIRED` | Ativo baixado/desativado definitivamente |

Transições válidas de status:

```
AVAILABLE   → ASSIGNED       (atribuição a usuário)
ASSIGNED    → AVAILABLE      (remoção de atribuição)
AVAILABLE   → IN_TRANSFER    (solicitação de transferência)
ASSIGNED    → IN_TRANSFER    (solicitação de transferência)
IN_TRANSFER → AVAILABLE      (transferência concluída ou rejeitada)
AVAILABLE   → IN_MAINTENANCE (abertura de manutenção)
ASSIGNED    → IN_MAINTENANCE (abertura de manutenção)
IN_MAINTENANCE → AVAILABLE   (manutenção concluída/cancelada, sem usuário)
IN_MAINTENANCE → ASSIGNED    (manutenção concluída/cancelada, com usuário atribuído)
qualquer    → RETIRED        (aposentadoria do ativo)
```

A exclusão de ativos não é permitida para preservar o histórico de auditoria.

---

# 9. Regras de Transferência

Regras:

- A transferência deve referenciar um ativo válido
- A transferência deve especificar a unidade de origem e a unidade de destino
- A unidade de origem e destino não podem ser a mesma
- O ativo não pode estar `RETIRED` para ser transferido
- Apenas uma transferência ativa (`PENDING` ou `APPROVED`) pode existir por ativo por vez
- O ativo passa imediatamente para `IN_TRANSFER` ao criar a solicitação
- A transferência deve ser aprovada antes de ser concluída
- A transferência deve ser registrada nos logs de auditoria
- O campo `reason` (motivo) é obrigatório na criação

Status possíveis da transferência:

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando aprovação |
| `APPROVED` | Aprovada, aguardando conclusão |
| `REJECTED` | Rejeitada — ativo retorna para `AVAILABLE` |
| `COMPLETED` | Concluída — unidade do ativo atualizada |
| `CANCELLED` | Cancelada |

As transferências garantem a rastreabilidade da movimentação dos ativos.

---

# 10. Regras de Inventário

Regras:

- O inventário deve pertencer a uma organização
- O inventário deve pertencer a uma unidade, que deve ser da mesma organização
- Apenas um ciclo de inventário ativo (`OPEN` ou `IN_PROGRESS`) é permitido por unidade
- O inventário deve registrar a verificação de presença dos ativos
- O usuário criador deve pertencer à mesma organização

Status possíveis do inventário:

| Status | Descrição |
|--------|-----------|
| `OPEN` | Sessão criada, aguardando início |
| `IN_PROGRESS` | Verificação em andamento |
| `CLOSED` | Inventário concluído |
| `CANCELLED` | Inventário cancelado |

O inventário garante a precisão dos ativos.

---

# 11. Regras de Manutenção

Regras:

- A manutenção deve referenciar um ativo existente
- O ativo é imediatamente movido para `IN_MAINTENANCE` ao criar a solicitação de manutenção
- O campo `description` (descrição do problema) é obrigatório na criação
- O campo `resolution` (resolução) é obrigatório para concluir a manutenção
- Apenas `ADMIN` e `GESTOR` podem criar e cancelar manutenções
- `ADMIN`, `GESTOR` e `OPERADOR` podem iniciar e concluir manutenções
- A manutenção concluída (`COMPLETED`) não pode ser cancelada
- O histórico de manutenção deve ser preservado
- As operações de manutenção devem gerar logs de auditoria

Status possíveis da manutenção:

| Status | Descrição |
|--------|-----------|
| `REQUESTED` | Solicitação criada, aguardando início |
| `IN_PROGRESS` | Manutenção em execução |
| `COMPLETED` | Concluída com sucesso (estado final) |
| `CANCELLED` | Cancelada (estado final) |

Transições válidas:

```
REQUESTED   → IN_PROGRESS  (início da execução)
IN_PROGRESS → COMPLETED    (conclusão, com resolution obrigatória)
REQUESTED   → CANCELLED    (cancelamento)
IN_PROGRESS → CANCELLED    (cancelamento)
```

A manutenção garante a integridade operacional dos ativos.

---

# 12. Regras de Auditoria

Regras:

- Todas as operações críticas devem gerar logs de auditoria
- Os logs de auditoria devem incluir:
  - Usuário responsável (`actor_user_id`)
  - Timestamp da operação
  - Tipo de evento
  - Entidade afetada (`target_id`, `target_type`)
  - Organização e unidade envolvidas
  - Detalhes descritivos da operação
- Os logs de auditoria são imutáveis
- Os logs de auditoria não podem ser excluídos
- Os logs de auditoria garantem rastreabilidade completa

Os logs de auditoria são necessários para conformidade e monitoramento de segurança.

---

# 13. Regras de Autorização

Regras:

- O acesso deve ser restrito com base na role do usuário (`ADMIN`, `GESTOR`, `OPERADOR`)
- O acesso deve ser restrito com base na organização do usuário (tenant)
- O acesso não autorizado deve ser rejeitado com `403 Forbidden`
- Apenas `ADMIN` pode gerenciar usuários, organizações e aposentar ativos
- `ADMIN` e `GESTOR` podem criar e gerenciar ativos, transferências e manutenções
- `OPERADOR` tem acesso de leitura e pode executar operações de manutenção

A autorização garante a segurança do sistema.

---

# 14. Regras de Integridade de Dados

Regras:

- Todos os relacionamentos de chave estrangeira devem ser válidos
- Todos os campos obrigatórios devem estar presentes
- Dados inválidos devem ser rejeitados
- As constraints de integridade do banco de dados devem ser aplicadas
- O controle de concorrência otimista (`@Version`) é aplicado nas entidades principais para evitar atualizações concorrentes inconsistentes

---

# 15. Regras de Ciclo de Vida

Regras:

- As entidades devem seguir estados de ciclo de vida definidos
- As transições de estado devem ser controladas e validadas
- Transições inválidas devem lançar exceção de negócio
- Estados terminais (`RETIRED`, `COMPLETED`, `CANCELLED`) não permitem reversão

---

# 16. Regras de LGPD

Regras:

- O aceite dos termos LGPD é registrado por usuário na tabela `user_consents`
- O campo `lgpd_accepted` no usuário indica se o aceite foi realizado
- O aceite é registrado com timestamp

---

# 17. Resumo

Essas regras de negócio garantem:

- Isolamento multi-tenant
- Controle de acesso seguro por roles
- Integridade dos dados em todas as camadas
- Rastreabilidade completa via auditoria
- Gerenciamento adequado do ciclo de vida de ativos, transferências, inventários e manutenções

Essas regras são aplicadas em todo o sistema.