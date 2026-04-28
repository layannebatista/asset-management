# Esquema do Banco de Dados

Este documento resume o schema relacional validado nas migrations Flyway em `backend/src/main/resources/db/migration`.

---

# 1. Visão Geral

O banco principal é PostgreSQL e o schema evolui via Flyway (`V1` a `V9` no estado atual). Além do domínio base de ativos, hoje o banco já inclui:

- ativação de conta, MFA e refresh tokens
- histórico de status e atribuição
- custos e dados financeiros de ativos e manutenção
- centros de custo e seguros
- seeds para testes E2E

---

# 2. Tabelas Principais

## organizations

Tenant raiz do sistema.

Colunas principais:

- `id`
- `name` (`UNIQUE`)
- `status`

## units

Subdivisão de uma organização.

Colunas principais:

- `id`
- `organization_id` (`FK -> organizations`)
- `name`
- `is_main`
- `status`

## users

Usuários autenticáveis do sistema.

Colunas principais:

- `id`
- `organization_id`
- `unit_id`
- `version`
- `name`
- `email` (`UNIQUE`)
- `password_hash` (`NULL` até ativação)
- `document_number`
- `phone_number` (`V5`, usado para MFA)
- `role`
- `status`

## user_consents

Aceite LGPD por usuário.

Colunas principais:

- `id`
- `user_id`
- `lgpd_accepted`
- `accepted_at`

## user_activation_tokens

Tokens de ativação de conta.

Colunas principais:

- `id`
- `user_id`
- `token` (`UNIQUE`)
- `used`
- `created_at`
- `expires_at`

## mfa_codes

Códigos OTP de uso único para MFA via WhatsApp.

Colunas principais:

- `id`
- `user_id`
- `code`
- `used`
- `expires_at`
- `created_at`

## refresh_tokens

Refresh tokens rotativos de autenticação.

Colunas principais:

- `id`
- `user_id`
- `token` (`UNIQUE`)
- `expires_at`
- `revoked`
- `created_at`

## assets

Ativos do sistema.

Colunas principais do núcleo:

- `id`
- `organization_id`
- `unit_id`
- `user_id`
- `version`
- `asset_tag` (`UNIQUE`)
- `model`
- `type`
- `status`

Colunas adicionadas nas evoluções:

- `purchase_date`
- `invoice_number`
- `invoice_date`
- `supplier`
- `warranty_expiry`
- `purchase_value`
- `residual_value`
- `useful_life_months`
- `depreciation_method`
- `cost_center_id`

## asset_assignment_history

Histórico de atribuição e desatribuição.

Campos principais:

- `asset_id`
- `from_user_id`
- `to_user_id`
- `changed_by_user_id`
- `changed_at`

## asset_status_history

Histórico de mudança de status.

Campos principais:

- `asset_id`
- `previous_status`
- `new_status`
- `changed_by_user_id`
- `changed_at`

## transfer_requests

Solicitações de transferência entre unidades.

Campos principais:

- `asset_id`
- `from_unit_id`
- `to_unit_id`
- `requested_by`
- `approved_by`
- `requested_at`
- `approved_at`
- `completed_at`
- `reason`
- `status`
- `version`

## inventory_sessions

Sessões de inventário.

Campos principais:

- `organization_id`
- `unit_id`
- `created_by`
- `created_at`
- `closed_at`
- `status`
- `version`

## inventory_items

Resultado da verificação por ativo em uma sessão.

Campos principais:

- `session_id`
- `asset_id`
- `present`

Constraint importante:

- `UNIQUE (session_id, asset_id)`

## maintenance_records

Registros de manutenção.

Campos principais:

- `asset_id`
- `organization_id`
- `unit_id`
- `requested_by_user_id`
- `started_by_user_id`
- `completed_by_user_id`
- `description`
- `resolution`
- `estimated_cost`
- `actual_cost`
- `cost_center_id`
- `status`
- `created_at`
- `started_at`
- `completed_at`
- `version`

## asset_categories

Cadastro de categorias de ativo.

Campos principais:

- `id`
- `version`
- `name` (`UNIQUE`)
- `description`
- `active`

## cost_centers

Centros de custo por organização.

Campos principais:

- `id`
- `organization_id`
- `unit_id`
- `code`
- `name`
- `active`

Constraint importante:

- `UNIQUE (organization_id, code)`

## asset_insurance

Apólices de seguro vinculadas a ativos.

Campos principais:

- `id`
- `asset_id`
- `organization_id`
- `policy_number`
- `insurer`
- `coverage_value`
- `premium`
- `start_date`
- `expiry_date`
- `active`
- `created_at`

## audit_events

Eventos de auditoria.

Campos principais:

- `id`
- `type`
- `actor_user_id`
- `organization_id`
- `unit_id`
- `target_id`
- `target_type`
- `details`
- `created_at`

---

# 3. Relacionamentos

Relações principais:

- `organizations -> units/users/assets/inventory_sessions/audit_events/cost_centers/asset_insurance`
- `units -> users/assets/inventory_sessions/cost_centers`
- `users -> user_activation_tokens/user_consents/mfa_codes/refresh_tokens`
- `assets -> asset_assignment_history/asset_status_history/transfer_requests/inventory_items/maintenance_records/asset_insurance`
- `inventory_sessions -> inventory_items`
- `cost_centers -> assets/maintenance_records`

---

# 4. Multi-Tenant

O isolamento é feito principalmente por `organization_id`.

Tabelas centrais multi-tenant:

- `users`
- `assets`
- `inventory_sessions`
- `maintenance_records`
- `audit_events`
- `cost_centers`
- `asset_insurance`

Há também tabelas dependentes cujo tenant é inferido por chave estrangeira, como `transfer_requests`, `inventory_items`, `mfa_codes` e `refresh_tokens`.

---

# 5. Índices e Constraints Relevantes

Índices explícitos observados nas migrations:

- `audit_events`: `actor_user_id`, `created_at`, `organization_id`, `target_id`, `type`
- `maintenance_records`: `asset_id`, `organization_id`, `status`
- `inventory_sessions`: `organization_id`, `unit_id`, `status`
- `inventory_items`: `session_id`, `asset_id`
- `mfa_codes`: `user_id`, `expires_at`
- `refresh_tokens`: `token`, `user_id`, `expires_at`
- `cost_centers`: `organization_id`
- `asset_insurance`: `asset_id`, `expiry_date`, `organization_id`

Constraints importantes:

- unicidade em `organizations.name`, `users.email`, `assets.asset_tag`, `asset_categories.name`, `user_activation_tokens.token`, `refresh_tokens.token`
- checks de domínio em colunas de `status`, `type` e `depreciation_method`
- FKs para garantir consistência referencial entre módulos

---

# 6. Estratégia de Migração

Versões presentes no repositório:

| Versão | Descrição |
|---|---|
| `V1` | schema inicial |
| `V2` | histórico de ativos |
| `V3` | `password_hash` nullable |
| `V4` | categorias de ativos |
| `V5` | MFA via WhatsApp |
| `V6` | refresh token, custos de manutenção e dados fiscais |
| `V7` | depreciação, centros de custo e seguros |
| `V8` | ajuste de constraint de auditoria |
| `V9` | seed E2E |

---

# 7. Concorrência

Entidades com coluna `version` documentadas no schema atual:

- `users`
- `assets`
- `transfer_requests`
- `inventory_sessions`
- `maintenance_records`
- `asset_categories`

O projeto também combina controle otimista com serviços específicos de lock para operações de manutenção, inventário e transferência.

---

# 8. Observações de Segurança

- `password_hash` armazena apenas hash BCrypt
- segredos e credenciais entram por variáveis de ambiente
- `spring.jpa.hibernate.ddl-auto=validate` impede alterações automáticas de schema
- o serviço `ai-intelligence` usa o mesmo PostgreSQL, mas persiste em schema próprio (`ai_intelligence`)
