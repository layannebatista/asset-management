# Modelo de Domínio

---

# 1. Visão Geral

Este documento descreve o modelo de domínio do Sistema de Gestão de Ativos Enterprise.

O modelo de domínio define as entidades centrais de negócio, seus relacionamentos e suas responsabilidades.

O sistema é projetado seguindo os princípios de Domain-Driven Design (DDD).

---

# 2. Estrutura de Domínio Multi-Tenant

O sistema é multi-tenant.

Cada tenant é representado por uma Organização.

Hierarquia:

```
Organization
 └── Units
      ├── Users
      └── Assets
           ├── AssetAssignmentHistory
           ├── AssetStatusHistory
           ├── TransferRequests
           ├── InventorySessions
           │    └── InventoryItems
           └── MaintenanceRecords

Organization → AuditEvents
User → AuditActivationTokens
User → UserConsents
```

Todas as entidades de domínio pertencem exatamente a uma organização.

---

# 3. Entidades Principais do Domínio

---

## 3.1 Organization

Representa um tenant.

Responsabilidades:

- Define o limite do tenant
- Possui todos os dados dentro de seu escopo

Atributos:

- `id`
- `name` (único no sistema)
- `status` — `ACTIVE` ou `INACTIVE`

Relacionamentos:

- Uma organização possui muitas unidades
- Uma organização possui muitos usuários
- Uma organização possui muitos ativos

---

## 3.2 Unit

Representa uma subdivisão física ou lógica de uma organização.

Exemplos: departamento, escritório, filial.

Atributos:

- `id`
- `name`
- `organization` (relação com Organization)
- `status` — `ACTIVE` ou `INACTIVE`
- `mainUnit` — indica se é a unidade principal

Relacionamentos:

- Pertence a uma organização
- Possui muitos usuários
- Possui muitos ativos

---

## 3.3 User

Representa um usuário do sistema.

Responsabilidades:

- Autenticar no sistema
- Executar operações conforme sua role
- Acessar ativos dentro do escopo permitido

Atributos:

- `id`
- `name`
- `email` (único no sistema)
- `passwordHash` (definido na ativação — pode ser nulo até então)
- `documentNumber`
- `role` — `ADMIN`, `GESTOR` ou `OPERADOR`
- `status` — `PENDING_ACTIVATION`, `ACTIVE`, `BLOCKED` ou `INACTIVE`
- `lgpdAccepted`
- `organization` (relação com Organization)
- `unit` (relação com Unit)

Roles:

| Role | Descrição |
|------|-----------|
| `ADMIN` | Acesso total ao sistema |
| `GESTOR` | Gerenciamento de ativos, transferências e manutenções da organização |
| `OPERADOR` | Acesso de leitura e execução de manutenções |

Relacionamentos:

- Pertence a uma organização
- Pertence a uma unidade (da mesma organização)

---

## 3.4 Asset

Representa um ativo gerenciado.

Exemplos: notebook, celular corporativo, veículo.

Atributos:

- `id`
- `assetTag` (único e imutável — identificador físico do ativo)
- `type` — `MOBILE_PHONE`, `NOTEBOOK`, `TABLET`, `DESKTOP`, `VEHICLE` ou `OTHER`
- `model` (modelo do ativo, ex.: "Dell Latitude 5430")
- `status` — `AVAILABLE`, `ASSIGNED`, `IN_TRANSFER`, `IN_MAINTENANCE`, `UNAVAILABLE` ou `RETIRED`
- `organization` (relação com Organization)
- `unit` (relação com Unit — unidade atual do ativo)
- `assignedUser` (relação com User — pode ser nulo)
- `version` (controle de concorrência otimista)

Regras:

- O `assetTag` é único e imutável
- O ativo não pode ser excluído
- O status inicial é sempre `AVAILABLE`

Relacionamentos:

- Pertence a uma organização
- Pertence a uma unidade
- Pode estar atribuído a um usuário
- Possui histórico de status (`AssetStatusHistory`)
- Possui histórico de atribuições (`AssetAssignmentHistory`)
- Possui transferências (`TransferRequest`)
- Possui registros de manutenção (`MaintenanceRecord`)

---

## 3.5 AssetAssignmentHistory

Registra o histórico de atribuições e desatribuições de ativos a usuários.

Atributos:

- `id`
- `assetId`
- `fromUserId` (usuário anterior — pode ser nulo)
- `toUserId` (novo usuário — pode ser nulo)
- `changedByUserId` (quem realizou a operação)
- `changedAt`

---

## 3.6 AssetStatusHistory

Registra o histórico de mudanças de status de ativos.

Atributos:

- `id`
- `assetId`
- `previousStatus`
- `newStatus`
- `changedByUserId`
- `changedAt`

---

## 3.7 TransferRequest

Representa a movimentação de um ativo entre unidades com fluxo de aprovação.

Atributos:

- `id`
- `asset` (relação com Asset)
- `fromUnit` (relação com Unit — unidade de origem)
- `toUnit` (relação com Unit — unidade de destino)
- `requestedBy` (relação com User)
- `approvedBy` (relação com User — pode ser nulo)
- `status` — `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` ou `CANCELLED`
- `reason` (motivo obrigatório)
- `requestedAt`
- `approvedAt` (pode ser nulo)
- `completedAt` (pode ser nulo)
- `version` (controle de concorrência otimista)

Responsabilidades:

- Rastrear movimentação de ativos entre unidades
- Manter histórico de transferências com aprovação

Relacionamentos:

- Pertence a um ativo
- Referencia unidades de origem e destino
- Referencia usuário solicitante e aprovador

---

## 3.8 InventorySession

Representa um processo de verificação de inventário em uma unidade.

Atributos:

- `id`
- `organization` (relação com Organization)
- `unit` (relação com Unit)
- `createdBy` (relação com User)
- `status` — `OPEN`, `IN_PROGRESS`, `CLOSED` ou `CANCELLED`
- `createdAt`
- `closedAt` (pode ser nulo)
- `version` (controle de concorrência otimista)

Responsabilidades:

- Verificar presença física de ativos em uma unidade
- Acompanhar status do inventário

Relacionamentos:

- Pertence a uma organização
- Pertence a uma unidade
- Possui itens de inventário (`InventoryItem`)

---

## 3.9 InventoryItem

Representa o registro de verificação de um ativo específico dentro de uma sessão de inventário.

Atributos:

- `id`
- `session` (relação com InventorySession)
- `asset` (relação com Asset)
- `present` (booleano — se o ativo foi encontrado)

---

## 3.10 MaintenanceRecord

Representa uma atividade de manutenção de ativo.

Atributos:

- `id`
- `asset` (relação com Asset)
- `organizationId`
- `unitId`
- `requestedByUserId`
- `startedByUserId` (pode ser nulo)
- `completedByUserId` (pode ser nulo)
- `status` — `REQUESTED`, `IN_PROGRESS`, `COMPLETED` ou `CANCELLED`
- `description` (obrigatório — descrição do problema)
- `resolution` (obrigatório para concluir — descrição da solução)
- `createdAt`
- `startedAt` (pode ser nulo)
- `completedAt` (pode ser nulo)
- `version` (controle de concorrência otimista)

Responsabilidades:

- Rastrear o ciclo de vida da manutenção
- Manter histórico completo com responsáveis em cada etapa

Relacionamentos:

- Pertence a um ativo

---

## 3.11 AssetCategory

Representa uma categoria para classificação de ativos.

Atributos:

- `id`
- `name` (único no sistema)
- `description`
- `active`
- `version` (controle de concorrência otimista)

---

## 3.12 AuditEvent

Representa um registro de auditoria de operação do sistema.

Atributos:

- `id`
- `type` (tipo do evento — ex.: `ASSET_STATUS_CHANGED`)
- `actorUserId` (usuário que realizou a operação)
- `organizationId`
- `unitId`
- `targetId` (id da entidade afetada)
- `targetType` (tipo da entidade afetada)
- `details` (texto descritivo)
- `createdAt`

Responsabilidades:

- Fornecer rastreabilidade completa
- Registrar todas as operações críticas do sistema

---

## 3.13 UserActivationToken

Representa o token de ativação de conta enviado ao usuário.

Atributos:

- `id`
- `token` (UUID único)
- `user` (relação com User)
- `expiresAt`
- `createdAt`
- `used` (booleano — se já foi utilizado)

---

## 3.14 UserConsent

Registra o aceite dos termos LGPD pelo usuário.

Atributos:

- `id`
- `userId`
- `lgpdAccepted`
- `acceptedAt`

---

# 4. Resumo dos Relacionamentos de Domínio

```
Organization → Units
Organization → Users
Organization → Assets
Organization → AuditEvents

Unit → Users
Unit → Assets

Asset → AssetStatusHistory
Asset → AssetAssignmentHistory
Asset → TransferRequests
Asset → MaintenanceRecords

InventorySession → InventoryItems
InventoryItems → Asset

User → UserActivationToken
User → UserConsents
User → AuditEvents
```

---

# 5. Regras de Domínio

Regras principais do domínio:

- Todas as entidades pertencem a uma organização
- O `assetTag` dos ativos é único e imutável
- Ativos não podem ser excluídos (apenas aposentados com status `RETIRED`)
- Transferências rastreiam a movimentação de ativos entre unidades
- Manutenções bloqueiam o ativo imediatamente ao serem criadas
- Logs de auditoria (`AuditEvent`) são imutáveis
- O acesso do usuário é restrito por organização e role

---

# 6. Isolamento de Domínio

O isolamento de tenant é aplicado no nível de domínio.

Regras:

- Entidades não podem referenciar entidades de outro tenant
- Todas as operações devem validar o escopo da organização
- O construtor das entidades valida que unidades e usuários pertencem à mesma organização

---

# 7. Ciclo de Vida de Domínio

As entidades seguem estados definidos de ciclo de vida.

Ciclo de vida do ativo:

```
AVAILABLE → ASSIGNED → AVAILABLE
          → IN_TRANSFER → AVAILABLE
          → IN_MAINTENANCE → AVAILABLE / ASSIGNED
          → RETIRED (terminal)
```

Ciclo de vida da transferência:

```
PENDING → APPROVED → COMPLETED
        → REJECTED
```

Ciclo de vida da manutenção:

```
REQUESTED → IN_PROGRESS → COMPLETED
          → CANCELLED
IN_PROGRESS → CANCELLED
```

Ciclo de vida do usuário:

```
PENDING_ACTIVATION → ACTIVE → BLOCKED
                            → INACTIVE
```

Ciclo de vida do inventário:

```
OPEN → IN_PROGRESS → CLOSED
     → CANCELLED
IN_PROGRESS → CANCELLED
```

---

# 8. Integridade de Domínio

A integridade é garantida por meio de:

- Chaves estrangeiras no banco de dados
- Regras de validação nos construtores das entidades de domínio
- Aplicação da lógica de negócio nos métodos de transição de estado
- Controle de concorrência otimista via `@Version`

---

# 9. Resumo

O modelo de domínio fornece:

- Estrutura clara de negócio com entidades bem definidas
- Isolamento multi-tenant aplicado em todas as camadas
- Gerenciamento completo de ciclo de vida para todas as entidades
- Auditabilidade completa com rastreabilidade de todas as operações

Este modelo de domínio suporta gestão de ativos nível enterprise.