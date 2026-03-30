// ─── AUTH ───────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string }
export interface MfaVerifyRequest { userId: number; code: string }
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  role: UserRole
  mfaRequired: boolean
  userId: number

  email?: string
  organizationId?: number
  unitId?: number
}

// ─── USER ───────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'GESTOR' | 'OPERADOR'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_ACTIVATION'

export interface UserResponse {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  organizationId: number
  unitId: number
  lgpdAccepted: boolean
  mfaEnabled: boolean
}
export interface UserCreateRequest {
  name: string
  email: string
  documentNumber: string
  role: UserRole
  organizationId: number
  unitId: number
  phoneNumber?: string
}

// ─── ORGANIZATION / UNIT ────────────────────────────────────────────────────
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE'
export type UnitStatus = 'ACTIVE' | 'INACTIVE'

export interface OrganizationResponse { id: number; name: string; status: OrganizationStatus }
export interface UnitResponse { id: number; name: string; status: UnitStatus; mainUnit: boolean }

// ─── ASSET ──────────────────────────────────────────────────────────────────
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_MAINTENANCE' | 'IN_TRANSFER' | 'UNAVAILABLE' | 'RETIRED'
export type AssetType = 'MOBILE_PHONE' | 'NOTEBOOK' | 'TABLET' | 'DESKTOP' | 'VEHICLE' | 'OTHER'

export interface AssetResponse {
  id: number
  assetTag: string
  type: AssetType
  model: string
  status: AssetStatus
  organizationId: number
  unitId: number
  assignedUserId?: number
}
export interface AssetCreateRequest { assetTag?: string; type: AssetType; model: string; unitId: number }

export interface AssetStatusHistory {
  id: number
  assetId: number
  previousStatus: AssetStatus
  newStatus: AssetStatus
  changedAt: string
  changedByUserId: number
}

export interface AssetAssignmentHistory {
  id: number
  assetId: number
  fromUserId: number | null
  toUserId: number | null
  changedByUserId: number
  changedAt: string
}

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

// 🔥 CORREÇÃO AQUI (tipagem segura para evitar erro com Record)
export const MAINTENANCE_STATUS_VALUES = [
  'REQUESTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const

export type MaintenanceStatus = typeof MAINTENANCE_STATUS_VALUES[number]

export interface MaintenanceResponse {
  id: number
  assetId: number
  organizationId: number
  unitId: number
  requestedByUserId: number
  startedByUserId?: number
  completedByUserId?: number
  status: MaintenanceStatus
  description: string
  resolution?: string
  estimatedCost?: number
  actualCost?: number
  createdAt: string
  startedAt?: string
  completedAt?: string
}
export interface MaintenanceCreateRequest { assetId: number; description: string; estimatedCost?: number }
export interface MaintenanceBudget {
  totalEstimatedCost: number
  totalActualCost: number
  variance: number
  totalRecords: number
  completedRecords: number
  periodStart: string
  periodEnd: string
}

// ─── TRANSFER ────────────────────────────────────────────────────────────────
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export interface TransferResponse {
  id: number
  assetId: number
  fromUnitId: number
  toUnitId: number
  status: TransferStatus
  reason: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
}
export interface TransferCreateRequest { assetId: number; toUnitId: number; reason: string }
export interface TransferApproveRequest { comment?: string }

// ─── INVENTORY ───────────────────────────────────────────────────────────────
export type InventoryStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED'

export interface InventoryResponse {
  id: number
  unitId: number
  status: InventoryStatus
  createdAt: string
  closedAt?: string
}

// ─── CATEGORY ────────────────────────────────────────────────────────────────
export interface CategoryResponse { id: number; name: string; description?: string; active: boolean }
export interface CategoryRequest { name: string; description?: string }

// ─── COST CENTER ─────────────────────────────────────────────────────────────
export interface CostCenterResponse { id: number; code: string; name: string; unitId?: number; active: boolean }
export interface CostCenterRequest { code: string; name: string; unitId?: number }

// ─── DEPRECIATION ────────────────────────────────────────────────────────────
export interface AssetDepreciation {
  assetId: number
  assetTag: string
  model: string
  depreciationMethod: string
  purchaseValue: number
  residualValue: number
  currentValue: number
  accumulatedDepreciation: number
  usefulLifeMonths: number
  elapsedMonths: number
  remainingMonths: number
  depreciationPercentage: number
  fullyDepreciated: boolean
  calculationDate: string
}
export interface PortfolioDepreciation {
  totalPurchaseValue: number
  totalCurrentValue: number
  totalDepreciation: number
  depreciationPercentage: number
  totalAssets: number
  calculationDate: string
}

export interface DepreciationReport {
  items: AssetDepreciation[]
  totalAssets: number
  generatedAt: string
}

// ─── INSURANCE ───────────────────────────────────────────────────────────────
export interface AssetInsurance {
  id: number
  assetId: number
  policyNumber: string
  insurer: string
  coverageValue: number
  premium?: number
  startDate: string
  expiryDate: string
  active: boolean
}
export interface InsuranceCreateRequest {
  policyNumber: string
  insurer: string
  coverageValue: number
  premium?: number
  startDate: string
  expiryDate: string
}
export interface InsuranceSummary { expiringIn30Days: number; totalCoverageExpiring: number }

// ─── AUDIT ───────────────────────────────────────────────────────────────────
export interface AuditEvent {
  id: number
  eventType: string
  targetType: string
  targetId: number
  actorUserId: number
  organizationId: number
  unitId: number
  details?: string
  createdAt: string
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export interface ExecutiveDashboard {
  totalAssets: number
  totalMaintenance: number
  totalUsers: number
  assetsByStatus: Record<string, number>
  assetsByUnit: Record<string, number>
  assetsByType: Record<string, number>
  maintenanceByStatus: Record<string, number>
  maintenanceByMonth: Record<string, number>
  transferByStatus: Record<string, number>
  transferByMonth: Record<string, number>
  usersByStatus: Record<string, number>
  usersByRole: Record<string, number>
  assetsAvailable: number
  assetsRetiredThisMonth: number
  assetsIdleCount: number
  pendingTransfersCount: number
  maintenanceCostMonth: number
  insuranceExpiringCount: number
}

export interface UnitDashboard {
  totalAssets: number
  totalMaintenance: number
  totalUsers: number
  assetsByStatus: Record<string, number>
  maintenanceByStatus: Record<string, number>
  assetsAvailable: number
  assetsIdleList: AssetIdleItem[]
  pendingTransfersCount: number
  maintenanceCostMonth: number
  utilizationRate: number
}

export interface PersonalDashboard {
  totalAssetsAssigned: number
  totalMaintenanceRelated: number
  myAssets: PersonalAsset[]
  myPendingTransfers: number
  myOpenMaintenances: PersonalMaintenance[]
}

export interface AssetIdleItem {
  assetTag: string
  model: string
  type: AssetType
  idleDays: number
}

export interface PersonalAsset {
  assetTag: string
  model: string
  type: AssetType
  status: AssetStatus
  assignedSince?: string
  maintenanceCode?: string
}

export interface PersonalMaintenance {
  code: string
  assetTag: string
  status: MaintenanceStatus
  createdAt: string
}

// ─── PAGINATION ──────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}
export interface PageParams { page?: number; size?: number; sort?: string }