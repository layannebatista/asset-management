# Esquema do Banco de Dados

---

# 1. Visão Geral

Este documento descreve o esquema de banco de dados utilizado pelo Sistema de Gestão de Ativos Enterprise.

O banco de dados utiliza PostgreSQL e segue um modelo relacional.

O esquema suporta:

- Isolamento multi-tenant
- Gerenciamento do ciclo de vida de ativos
- Transferências com aprovação
- Gestão de inventário
- Acompanhamento de manutenção
- Registro de auditoria
- Ativação de contas e conformidade LGPD

A integridade do banco de dados é aplicada utilizando chaves estrangeiras e constraints.

As migrações são gerenciadas com **Flyway**, localizadas em `db/migration/`.

---

# 2. Tabelas Principais

---

## organizations

Representa os tenants do sistema.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK, gerado automaticamente |
| `name` | `varchar(255)` | NOT NULL, UNIQUE |
| `status` | `varchar(20)` | NOT NULL, CHECK (`ACTIVE`, `INACTIVE`) |

---

## units

Representa unidades organizacionais (filiais, departamentos).

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `organization_id` | `bigint` | NOT NULL, FK → `organizations(id)` |
| `name` | `varchar(255)` | NOT NULL |
| `is_main` | `boolean` | NOT NULL |
| `status` | `varchar(20)` | NOT NULL, CHECK (`ACTIVE`, `INACTIVE`) |

---

## users

Representa usuários do sistema.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `organization_id` | `bigint` | NOT NULL, FK → `organizations(id)` |
| `unit_id` | `bigint` | NOT NULL, FK → `units(id)` |
| `version` | `bigint` | NOT NULL (controle otimista) |
| `name` | `varchar(255)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password_hash` | `varchar(255)` | NULL até ativação da conta |
| `document_number` | `varchar(50)` | NOT NULL |
| `role` | `varchar(50)` | NOT NULL, CHECK (`ADMIN`, `GESTOR`, `OPERADOR`) |
| `status` | `varchar(50)` | NOT NULL, CHECK (`PENDING_ACTIVATION`, `ACTIVE`, `BLOCKED`, `INACTIVE`) |
| `lgpd_accepted` | `boolean` | NOT NULL |

> **Nota:** `password_hash` aceita NULL pois a senha é definida pelo usuário no fluxo de ativação (migration V3).

---

## assets

Representa ativos gerenciados.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `organization_id` | `bigint` | NOT NULL, FK → `organizations(id)` |
| `unit_id` | `bigint` | NOT NULL, FK → `units(id)` |
| `user_id` | `bigint` | NULL, FK → `users(id)` (usuário atribuído) |
| `version` | `bigint` | NOT NULL (controle otimista) |
| `asset_tag` | `varchar(255)` | NOT NULL, UNIQUE (identificador físico do ativo) |
| `model` | `varchar(255)` | NOT NULL |
| `type` | `varchar(255)` | NOT NULL, CHECK (`MOBILE_PHONE`, `NOTEBOOK`, `TABLET`, `DESKTOP`, `VEHICLE`, `OTHER`) |
| `status` | `varchar(255)` | NOT NULL, CHECK (`AVAILABLE`, `ASSIGNED`, `IN_TRANSFER`, `IN_MAINTENANCE`, `UNAVAILABLE`, `RETIRED`) |

---

## asset_assignment_history

Registra o histórico de atribuições e desatribuições de ativos a usuários.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `asset_id` | `bigint` | NOT NULL |
| `from_user_id` | `bigint` | NULL (nulo quando primeira atribuição) |
| `to_user_id` | `bigint` | NULL (nulo quando desatribuição) |
| `changed_by_user_id` | `bigint` | NOT NULL |
| `changed_at` | `timestamp with time zone` | NOT NULL |

---

## asset_status_history

Registra o histórico de mudanças de status dos ativos.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `asset_id` | `bigint` | NOT NULL |
| `previous_status` | `varchar` | NOT NULL |
| `new_status` | `varchar` | NOT NULL |
| `changed_by_user_id` | `bigint` | NOT NULL |
| `changed_at` | `timestamp with time zone` | NOT NULL |

---

## transfer_requests

Representa solicitações de transferência de ativos entre unidades.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `asset_id` | `bigint` | NOT NULL, FK → `assets(id)` |
| `from_unit_id` | `bigint` | NOT NULL, FK → `units(id)` |
| `to_unit_id` | `bigint` | NOT NULL, FK → `units(id)` |
| `requested_by` | `bigint` | NOT NULL, FK → `users(id)` |
| `approved_by` | `bigint` | NULL, FK → `users(id)` |
| `version` | `bigint` | NOT NULL (controle otimista) |
| `requested_at` | `timestamp` | NOT NULL |
| `approved_at` | `timestamp` | NULL |
| `completed_at` | `timestamp` | NULL |
| `reason` | `varchar(500)` | NOT NULL |
| `status` | `varchar(30)` | NOT NULL, CHECK (`PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`) |

---

## inventory_sessions

Representa sessões de inventário de ativos por unidade.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `organization_id` | `bigint` | NOT NULL, FK → `organizations(id)` |
| `unit_id` | `bigint` | NOT NULL, FK → `units(id)` |
| `created_by` | `bigint` | NOT NULL, FK → `users(id)` |
| `version` | `bigint` | NOT NULL (controle otimista) |
| `created_at` | `timestamp` | NOT NULL |
| `closed_at` | `timestamp` | NULL |
| `status` | `varchar(255)` | NOT NULL, CHECK (`OPEN`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`) |

Índices: `organization_id`, `unit_id`, `status`

---

## inventory_items

Registra a verificação de cada ativo dentro de uma sessão de inventário.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `session_id` | `bigint` | NOT NULL, FK → `inventory_sessions(id)` |
| `asset_id` | `bigint` | NOT NULL, FK → `assets(id)` |
| `present` | `boolean` | NOT NULL |

Constraint: `UNIQUE (session_id, asset_id)` — cada ativo é verificado uma única vez por sessão.

---

## maintenance_records

Representa registros de manutenção de ativos.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `asset_id` | `bigint` | NOT NULL, FK → `assets(id)` |
| `organization_id` | `bigint` | NOT NULL |
| `unit_id` | `bigint` | NOT NULL |
| `requested_by_user_id` | `bigint` | NOT NULL |
| `started_by_user_id` | `bigint` | NULL |
| `completed_by_user_id` | `bigint` | NULL |
| `version` | `bigint` | NOT NULL (controle otimista) |
| `description` | `text` | NOT NULL |
| `resolution` | `text` | NULL (obrigatório na conclusão) |
| `created_at` | `timestamp with time zone` | NOT NULL |
| `started_at` | `timestamp with time zone` | NULL |
| `completed_at` | `timestamp with time zone` | NULL |
| `status` | `varchar(255)` | NOT NULL, CHECK (`REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) |

Índices: `asset_id`, `organization_id`, `status`

---

## asset_categories

Representa categorias para classificação de ativos.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `version` | `bigint` | NOT NULL DEFAULT 0 |
| `name` | `varchar(100)` | NOT NULL, UNIQUE |
| `description` | `varchar(255)` | NULL |
| `active` | `boolean` | NOT NULL DEFAULT true |

---

## audit_events

Representa registros de auditoria de operações do sistema.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `type` | `varchar(255)` | NOT NULL |
| `actor_user_id` | `bigint` | NULL (pode ser sistema) |
| `organization_id` | `bigint` | NOT NULL |
| `unit_id` | `bigint` | NULL |
| `target_id` | `bigint` | NULL (id da entidade afetada) |
| `target_type` | `varchar(100)` | NULL |
| `details` | `text` | NULL |
| `created_at` | `timestamp with time zone` | NOT NULL |

Índices: `organization_id`, `actor_user_id`, `target_id`, `created_at`, `type`

---

## user_activation_tokens

Tokens gerados para o fluxo de ativação de conta de usuários.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `user_id` | `bigint` | NOT NULL, FK → `users(id)` |
| `token` | `varchar(100)` | NOT NULL, UNIQUE |
| `used` | `boolean` | NOT NULL |
| `created_at` | `timestamp with time zone` | NOT NULL |
| `expires_at` | `timestamp with time zone` | NOT NULL |

---

## user_consents

Registra o aceite dos termos LGPD pelos usuários.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | `bigint` | PK |
| `user_id` | `bigint` | NOT NULL, FK → `users(id)` |
| `lgpd_accepted` | `boolean` | NOT NULL |
| `accepted_at` | `timestamp` | NOT NULL |

---

# 3. Relacionamentos

```
organizations → units            (1:N)
organizations → users            (1:N)
organizations → assets           (1:N)
organizations → audit_events     (1:N)
organizations → inventory_sessions (1:N)

units → users                    (1:N)
units → assets                   (1:N)
units → inventory_sessions       (1:N)

assets → asset_assignment_history (1:N)
assets → asset_status_history    (1:N)
assets → transfer_requests       (1:N)
assets → maintenance_records     (1:N)
assets → inventory_items         (1:N)

inventory_sessions → inventory_items (1:N)

users → user_activation_tokens   (1:N)
users → user_consents            (1:N)
users → audit_events             (1:N, via actor_user_id)
```

---

# 4. Design Multi-Tenant

O isolamento multi-tenant é implementado por meio do campo `organization_id` presente em todas as tabelas relevantes.

Todas as consultas devem filtrar por `organization_id`. Isso garante que dados de diferentes tenants nunca se misturem.

---

# 5. Constraints Principais

- Chaves primárias em todas as tabelas
- Chaves estrangeiras com integridade referencial
- `UNIQUE` em `organizations.name`, `users.email`, `assets.asset_tag`, `asset_categories.name`, `user_activation_tokens.token`
- `CHECK` constraints nos campos de status e type para garantir valores válidos
- `UNIQUE (session_id, asset_id)` em `inventory_items`
- `NOT NULL` em todos os campos obrigatórios

---

# 6. Estratégia de Indexação

Índices criados para:

- Todas as chaves primárias (automático)
- Todas as chaves estrangeiras usadas em joins frequentes
- `asset_tag` — busca e unicidade
- `organization_id` — filtragem multi-tenant
- `status` — filtros operacionais frequentes
- `created_at` em `audit_events` — consultas por período
- `type` em `audit_events` — filtros por tipo de evento

---

# 7. Estratégia de Migração

As migrações do banco de dados são gerenciadas utilizando **Flyway**.

Arquivos de migração localizados em: `src/main/resources/db/migration/`

| Versão | Descrição |
|--------|-----------|
| V1 | Schema inicial completo |
| V2 | Tabelas de histórico de ativos |
| V3 | Permite `password_hash` nulo (ativação de conta) |
| V4 | Criação da tabela `asset_categories` |

A migração garante consistência do esquema entre ambientes (dev, staging, produção).

---

# 8. Controle de Concorrência Otimista

As entidades principais possuem coluna `version` para controle de concorrência otimista via Hibernate (`@Version`):

- `users`
- `assets`
- `transfer_requests`
- `maintenance_records`
- `inventory_sessions`
- `asset_categories`

Isso previne atualizações simultâneas inconsistentes sem uso de locks pessimistas.

---

# 9. Auditoria e Rastreabilidade

A tabela `audit_events` fornece:

- Histórico completo de operações críticas
- Rastreamento de atividades por usuário
- Monitoramento de segurança

Os registros de auditoria são imutáveis — não há operação de update ou delete permitida.

Complementarmente, `asset_assignment_history` e `asset_status_history` fornecem rastreabilidade específica do ciclo de vida dos ativos.

---

# 10. Considerações de Segurança

- Acesso ao banco de dados deve ser restrito a credenciais da aplicação
- Credenciais configuradas via variáveis de ambiente (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`)
- `password_hash` armazena apenas o hash BCrypt — nunca a senha em texto puro
- O Flyway valida o schema no startup (`validate-on-migrate: true`)

---

# 11. Resumo

O esquema de banco de dados garante:

- Isolamento multi-tenant via `organization_id`
- Integridade dos dados via constraints e chaves estrangeiras
- Rastreabilidade completa via `audit_events` e históricos específicos
- Controle de concorrência via coluna `version`
- Escalabilidade com indexação estratégica
- Confiabilidade nível enterprise com migrations versionadas