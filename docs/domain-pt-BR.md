# Modelo de Domínio

Documento revisado contra o domínio e o schema atuais do projeto.

---

# 1. Núcleo Organizacional

## Organization

Tenant raiz do sistema.

## Unit

Subdivisão operacional de uma organização.

## User

Usuário autenticável com:

- `role`
- `status`
- `documentNumber`
- `phoneNumber`
- vínculo com `Organization` e `Unit`

Estados do usuário:

- `PENDING_ACTIVATION`
- `ACTIVE`
- `BLOCKED`
- `INACTIVE`

---

# 2. Núcleo Patrimonial

## Asset

Entidade central do sistema.

Atributos funcionais principais:

- `assetTag`
- `type`
- `model`
- `status`
- `organization`
- `unit`
- `assignedUser`
- `version`

Atributos financeiros e fiscais já presentes:

- `purchaseDate`
- `purchaseValue`
- `residualValue`
- `usefulLifeMonths`
- `depreciationMethod`
- `invoiceNumber`
- `invoiceDate`
- `supplier`
- `warrantyExpiry`
- `costCenter`

Estados:

- `AVAILABLE`
- `ASSIGNED`
- `IN_TRANSFER`
- `IN_MAINTENANCE`
- `UNAVAILABLE`
- `RETIRED`

## AssetAssignmentHistory

Rastreia atribuição e desatribuição.

## AssetStatusHistory

Rastreia mudança de status.

## AssetCategory

Classificação funcional do ativo.

## AssetInsurance

Apólice de seguro vinculada ao ativo.

---

# 3. Operações de Ciclo de Vida

## TransferRequest

Movimentação de ativo entre unidades com estados:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `COMPLETED`
- `CANCELLED`

## InventorySession

Sessão de inventário por unidade.

Estados:

- `OPEN`
- `IN_PROGRESS`
- `CLOSED`
- `CANCELLED`

## InventoryItem

Resultado da checagem de um ativo dentro da sessão.

## MaintenanceRecord

Manutenção de ativo com:

- `description`
- `resolution`
- `estimatedCost`
- `actualCost`
- `costCenter`

Estados:

- `REQUESTED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

---

# 4. Segurança e Acesso

## UserActivationToken

Token temporário de ativação de conta.

## UserConsent

Aceite LGPD.

## MfaCode

OTP temporário para MFA via WhatsApp.

## RefreshToken

Token rotativo para renovação de sessão.

---

# 5. Governança e Apoio

## AuditEvent

Registro imutável de auditoria.

## CostCenter

Centro de custo por organização, opcionalmente ligado a uma unidade, e reutilizado por ativos e manutenções.

---

# 6. Relações Principais

- `Organization -> Unit/User/Asset/AuditEvent/CostCenter`
- `Unit -> User/Asset/InventorySession`
- `User -> UserActivationToken/UserConsent/MfaCode/RefreshToken`
- `Asset -> AssetAssignmentHistory/AssetStatusHistory/TransferRequest/MaintenanceRecord/AssetInsurance`
- `InventorySession -> InventoryItem`
- `CostCenter -> Asset/MaintenanceRecord`

---

# 7. Regras Essenciais

- entidades de negócio não podem cruzar tenant
- `assetTag` é único
- ativos não são excluídos, apenas aposentados
- manutenção bloqueia o ativo já na criação
- transferência exige controle de estado e unidade de destino válida
- auditoria e históricos preservam rastreabilidade
