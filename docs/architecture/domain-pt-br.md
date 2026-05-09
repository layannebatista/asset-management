# Modelo de domínio

O domínio descreve as principais coisas que existem no sistema e como elas se relacionam.

## Organização e acesso

| Entidade | O que representa |
|---|---|
| `Organization` | Empresa ou tenant que usa o sistema |
| `Unit` | Unidade, filial, área ou local dentro da organização |
| `User` | Pessoa que acessa o sistema |
| `UserConsent` | Aceites e consentimentos do usuário |
| `UserActivationToken` | Token de ativação de conta |
| `MfaCode` | Código de autenticação em dois fatores |
| `RefreshToken` | Token para renovar sessão |

Relação principal:

```text
Organization -> Units
Organization -> Users
User -> Role
```

## Ativos

| Entidade | O que representa |
|---|---|
| `Asset` | Bem patrimonial gerenciado pelo sistema |
| `AssetCategory` | Categoria do ativo, como notebook, veículo ou equipamento |
| `AssetAssignmentHistory` | Histórico de responsáveis |
| `AssetStatusHistory` | Histórico de status |
| `AssetInsurance` | Dados de seguro do ativo |
| `CostCenter` | Centro de custo associado |

Um ativo normalmente pertence a uma organização, pode estar ligado a uma unidade e pode ter um responsável.

## Operações

| Entidade | O que representa |
|---|---|
| `TransferRequest` | Pedido de transferência de ativo |
| `InventorySession` | Rodada de inventário |
| `InventoryItem` | Conferência de um ativo dentro do inventário |
| `MaintenanceRecord` | Registro de manutenção |

Essas entidades contam a história operacional do ativo.

## Auditoria

| Entidade | O que representa |
|---|---|
| `AuditEvent` | Registro de ação relevante no sistema |

Eventos de auditoria devem acompanhar operações sensíveis, como login, alteração de ativo, transferência, mudança de perfil e ações administrativas.

## Relações importantes

```text
Organization
  -> Unit
  -> User
  -> Asset

Asset
  -> Category
  -> CostCenter
  -> Insurance
  -> AssignmentHistory
  -> StatusHistory
  -> MaintenanceRecord
  -> InventoryItem
  -> TransferRequest
```

## Cuidados ao evoluir o domínio

- Não crie entidade nova se uma existente já representa bem o conceito.
- Preserve histórico quando a mudança tiver valor de auditoria.
- Evite campo obrigatório sem migração e sem valor padrão.
- Pense no escopo multi-tenant em toda nova consulta.
- Atualize testes e documentação quando alterar regra essencial.

