import api from './axios'
import { apiService } from './base'
import type {
  LoginRequest, MfaVerifyRequest, AuthResponse,
  UserResponse, UserCreateRequest, Page, PageParams,
  OrganizationResponse, UnitResponse,
  AssetResponse, AssetCreateRequest, AssetStatusHistory, AssetAssignmentHistory,
  MaintenanceResponse, MaintenanceCreateRequest, MaintenanceBudget,
  TransferResponse, TransferCreateRequest, TransferApproveRequest,
  InventoryResponse,
  CategoryResponse, CategoryRequest,
  CostCenterResponse, CostCenterRequest,
  AssetDepreciation, PortfolioDepreciation,
  AssetInsurance, InsuranceCreateRequest, InsuranceSummary,
  AuditEvent,
  ExecutiveDashboard, UnitDashboard, PersonalDashboard,
  AssetStatus, AssetType, TransferStatus, MaintenanceStatus, InventoryStatus, UserStatus,
} from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login: (body: LoginRequest) =>
    apiService.post<AuthResponse>('/auth/login', body),

  mfaVerify: (body: MfaVerifyRequest) =>
    apiService.post<AuthResponse>('/auth/mfa/verify', body),

  refresh: (refreshToken: string) =>
    apiService.post<AuthResponse>('/auth/refresh', { refreshToken }),

  logout: () =>
    apiService.post<void>('/auth/logout'),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const organizationApi = {
  list: () =>
    apiService.get<OrganizationResponse[]>('/organizations'),

  getById: (id: number) =>
    apiService.get<OrganizationResponse>(`/organizations/${id}`),

  updateName: (id: number, name: string) =>
    apiService.patch<OrganizationResponse>(`/organizations/${id}`, { name }),
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════════════════════
export const unitApi = {
  create: (organizationId: number, name: string) =>
    apiService.post<UnitResponse>(`/units/${organizationId}`, { name }),

  listByOrg: (organizationId: number) =>
    apiService.get<UnitResponse[]>(`/units/${organizationId}`),

  getById: (id: number) =>
    apiService.get<UnitResponse>(`/units/unit/${id}`),

  activate: (id: number) =>
    apiService.patch<void>(`/units/${id}/activate`),

  inactivate: (id: number) =>
    apiService.patch<void>(`/units/${id}/inactivate`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
export const userApi = {
  list: (params?: PageParams & { status?: UserStatus; unitId?: number; includeInactive?: boolean }) =>
    apiService.get<Page<UserResponse>>('/users', { params }),

  create: (body: UserCreateRequest) =>
    apiService.post<UserResponse>('/users', body),

  getById: (id: number) =>
    apiService.get<UserResponse>(`/users/${id}`),

  block: (id: number) =>
    apiService.patch<void>(`/users/${id}/block`),

  activate: (id: number) =>
    apiService.patch<void>(`/users/${id}/activate`),

  inactivate: (id: number) =>
    apiService.patch<void>(`/users/${id}/inactivate`),

  generateActivationToken: (userId: number) =>
    apiService.post<string>(`/users/activation/token/${userId}`),

  activateAccount: (token: string, password: string, confirmPassword: string, lgpdAccepted: boolean) =>
    apiService.post<void>('/users/activation/activate', {
      token,
      password,
      confirmPassword,
      lgpdAccepted,
    }),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSETS
// ═══════════════════════════════════════════════════════════════════════════════
export const assetApi = {
  list: (params?: PageParams & {
    status?: AssetStatus; type?: AssetType; unitId?: number;
    assignedUserId?: number; assetTag?: string; model?: string; search?: string
  }) =>
    apiService.get<Page<AssetResponse>>('/assets', { params }),

  getById: (id: number) =>
    apiService.get<AssetResponse>(`/assets/${id}`),

  create: (organizationId: number, body: AssetCreateRequest) =>
    apiService.post<AssetResponse>(`/assets/${organizationId}`, body),

  createAuto: (organizationId: number, body: Omit<AssetCreateRequest, 'assetTag'>) =>
    apiService.post<AssetResponse>(`/assets/${organizationId}/auto`, body),

  retire: (id: number) =>
    apiService.patch<void>(`/assets/${id}/retire`),

  assign: (assetId: number, userId: number) =>
    apiService.patch<void>(`/assets/${assetId}/assign/${userId}`),

  unassign: (assetId: number) =>
    apiService.patch<void>(`/assets/${assetId}/unassign`),

  updateFinancial: (id: number, body: {
    purchaseValue?: number; residualValue?: number; usefulLifeMonths?: number;
    depreciationMethod?: 'LINEAR' | 'DECLINING_BALANCE' | 'SUM_OF_YEARS';
    purchaseDate?: string; warrantyExpiry?: string; supplier?: string;
    invoiceNumber?: string; invoiceDate?: string;
  }) =>
    apiService.patch<AssetResponse>(`/assets/${id}/financial`, body),

  getStatusHistory: (assetId: number) =>
    apiService.get<AssetStatusHistory[]>(`/assets/${assetId}/history/status`),

  getAssignmentHistory: (assetId: number) =>
    apiService.get<AssetAssignmentHistory[]>(`/assets/${assetId}/history/assignment`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════════════════════════════════════════
export const maintenanceApi = {
  list: (params?: PageParams & {
    status?: MaintenanceStatus; assetId?: number; unitId?: number;
    requestedByUserId?: number;
    startDate?: string; endDate?: string
  }) =>
    apiService.get<Page<MaintenanceResponse>>('/maintenance', { params }),

  getBudget: (params: { unitId?: number; startDate?: string; endDate?: string }) =>
    apiService.get<MaintenanceBudget>('/maintenance/budget', { params }),

  create: (body: MaintenanceCreateRequest) =>
    apiService.post<MaintenanceResponse>('/maintenance', body),

  start: (id: number) =>
    apiService.post<MaintenanceResponse>(`/maintenance/${id}/start`),

  // FIX: backend usa @RequestParam, não @RequestBody — enviar como query params
  complete: (id: number, resolution: string, actualCost?: number) =>
    apiService.post<MaintenanceResponse>(`/maintenance/${id}/complete`, undefined, {
      params: {
        resolution,
        ...(actualCost !== undefined ? { actualCost } : {}),
      },
    }),

  cancel: (id: number) =>
    apiService.post<void>(`/maintenance/${id}/cancel`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════════
export const transferApi = {
  list: (params?: PageParams & {
    status?: TransferStatus; assetId?: number; unitId?: number; startDate?: string; endDate?: string
  }) =>
    apiService.get<Page<TransferResponse>>('/transfers', { params }),

  create: (body: TransferCreateRequest) =>
    apiService.post<TransferResponse>('/transfers', body),

  approve: (id: number, body?: TransferApproveRequest) =>
    apiService.patch<void>(`/transfers/${id}/approve`, body ?? {}),

  reject: (id: number, body?: TransferApproveRequest) =>
    apiService.patch<void>(`/transfers/${id}/reject`, body ?? {}),

  complete: (id: number) =>
    apiService.patch<void>(`/transfers/${id}/complete`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
export const inventoryApi = {
  list: () =>
    apiService.get<InventoryResponse[]>('/inventory'),

  create: (unitId: number) =>
    apiService.post<InventoryResponse>('/inventory', { unitId }),

  getById: (id: number) =>
    apiService.get<InventoryResponse>(`/inventory/${id}`),

  start: (id: number) =>
    apiService.patch<void>(`/inventory/${id}/start`),

  close: (id: number) =>
    apiService.patch<void>(`/inventory/${id}/close`),

  cancel: (id: number) =>
    apiService.patch<void>(`/inventory/${id}/cancel`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
export const categoryApi = {
  list: () =>
    apiService.get<CategoryResponse[]>('/categories'),

  getById: (id: number) =>
    apiService.get<CategoryResponse>(`/categories/${id}`),

  create: (body: CategoryRequest) =>
    apiService.post<CategoryResponse>('/categories', body),

  update: (id: number, body: CategoryRequest) =>
    apiService.put<CategoryResponse>(`/categories/${id}`, body),

  delete: (id: number) =>
    apiService.delete<void>(`/categories/${id}`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST CENTERS
// ═══════════════════════════════════════════════════════════════════════════════
export const costCenterApi = {
  list: () =>
    apiService.get<CostCenterResponse[]>('/cost-centers'),

  create: (body: CostCenterRequest) =>
    apiService.post<CostCenterResponse>('/cost-centers', body),

  deactivate: (id: number) =>
    apiService.patch<void>(`/cost-centers/${id}/deactivate`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPRECIATION
// ═══════════════════════════════════════════════════════════════════════════════
export const depreciationApi = {
  getByAsset: (assetId: number) =>
    apiService.get<AssetDepreciation>(`/assets/${assetId}/depreciation`),

  getPortfolio: () =>
    apiService.get<PortfolioDepreciation>('/assets/depreciation/portfolio'),

  getReport: () =>
    apiService.get<{ items: AssetDepreciation[]; totalAssets: number; generatedAt: string }>(
      '/assets/depreciation/report'
    ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSURANCE
// ═══════════════════════════════════════════════════════════════════════════════
export const insuranceApi = {
  create: (assetId: number, body: InsuranceCreateRequest) =>
    apiService.post<AssetInsurance>(`/assets/${assetId}/insurance`, body),

  getByAsset: (assetId: number) =>
    apiService.get<AssetInsurance[]>(`/assets/${assetId}/insurance`),

  getExpiring: (days = 30) =>
    apiService.get<AssetInsurance[]>('/assets/insurance/expiring', { params: { days } }),

  delete: (insuranceId: number) =>
    apiService.delete<void>(`/assets/insurance/${insuranceId}`),

  getSummary: () =>
    apiService.get<InsuranceSummary>('/assets/insurance/summary'),
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════════════════════
export const auditApi = {
  list: (params?: PageParams) =>
    apiService.get<AuditEvent[]>('/audit', { params }),

  byUser: (userId: number, params?: PageParams) =>
    apiService.get<AuditEvent[]>(`/audit/user/${userId}`, { params }),

  byType: (type: string, params?: PageParams) =>
    apiService.get<AuditEvent[]>(`/audit/type/${type}`, { params }),

  byTarget: (targetType: string, targetId: number, params?: PageParams) =>
    apiService.get<AuditEvent[]>('/audit/target', {
      params: { targetType, targetId, ...params },
    }),

  byPeriod: (organizationId: number, start: string, end: string, params?: PageParams) =>
    apiService.get<AuditEvent[]>('/audit/period', {
      params: { organizationId, start, end, ...params },
    }),

  lastByTarget: (targetType: string, targetId: number) =>
    apiService.get<AuditEvent>('/audit/target/last', {
      params: { targetType, targetId },
    }),
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const exportApi = {
  downloadAssets: async (startDate?: string, endDate?: string) => {
    const res = await api.get<Blob>('/export/assets', {
      responseType: 'blob',
      params: { startDate, endDate },
    })
    triggerDownload(res.data, 'ativos.csv')
  },

  downloadMaintenance: async (startDate?: string, endDate?: string) => {
    const res = await api.get<Blob>('/export/maintenance', {
      responseType: 'blob',
      params: { startDate, endDate },
    })
    triggerDownload(res.data, 'manutencoes.csv')
  },

  downloadAudit: async (startDate?: string, endDate?: string) => {
    const res = await api.get<Blob>('/export/audit', {
      responseType: 'blob',
      params: { startDate, endDate },
    })
    triggerDownload(res.data, 'auditoria.csv')
  },
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  executive: () =>
    apiService.get<ExecutiveDashboard>('/api/dashboard/executive'),

  unit: () =>
    apiService.get<UnitDashboard>('/api/dashboard/unit'),

  personal: () =>
    apiService.get<PersonalDashboard>('/api/dashboard/personal'),
}