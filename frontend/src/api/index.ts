import api from './axios'
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
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),

  mfaVerify: (body: MfaVerifyRequest) =>
    api.post<AuthResponse>('/auth/mfa/verify', body).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => api.post('/auth/logout'),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const organizationApi = {
  create: (name: string) =>
    api.post<OrganizationResponse>('/organizations', { name }).then((r) => r.data),

  getById: (id: number) =>
    api.get<OrganizationResponse>(`/organizations/${id}`).then((r) => r.data),

  activate: (id: number) => api.patch(`/organizations/${id}/activate`),
  inactivate: (id: number) => api.patch(`/organizations/${id}/inactivate`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════════════════════
export const unitApi = {
  create: (organizationId: number, name: string) =>
    api.post<UnitResponse>(`/units/${organizationId}`, { name }).then((r) => r.data),

  listByOrg: (organizationId: number) =>
    api.get<UnitResponse[]>(`/units/${organizationId}`).then((r) => r.data),

  getById: (id: number) =>
    api.get<UnitResponse>(`/units/unit/${id}`).then((r) => r.data),

  activate: (id: number) => api.patch(`/units/${id}/activate`),
  inactivate: (id: number) => api.patch(`/units/${id}/inactivate`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
export const userApi = {
  list: (params?: PageParams & { status?: UserStatus; unitId?: number; includeInactive?: boolean }) =>
    api.get<Page<UserResponse>>('/users', { params }).then((r) => r.data),

  create: (body: UserCreateRequest) =>
    api.post<UserResponse>('/users', body).then((r) => r.data),

  getById: (id: number) =>
    api.get<UserResponse>(`/users/${id}`).then((r) => r.data),

  block: (id: number) => api.patch(`/users/${id}/block`),
  activate: (id: number) => api.patch(`/users/${id}/activate`),
  inactivate: (id: number) => api.patch(`/users/${id}/inactivate`),

  generateActivationToken: (userId: number) =>
    api.post<string>(`/users/activation/token/${userId}`).then((r) => r.data),

  activateAccount: (token: string, password: string, confirmPassword: string, lgpdAccepted: boolean) =>
    api.post('/users/activation/activate', null, {
      params: { token, password, confirmPassword, lgpdAccepted },
    }),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSETS
// ═══════════════════════════════════════════════════════════════════════════════
export const assetApi = {
  list: (params?: PageParams & {
    status?: AssetStatus; type?: AssetType; unitId?: number;
    assignedUserId?: number; assetTag?: string; model?: string
  }) =>
    api.get<Page<AssetResponse>>('/assets', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<AssetResponse>(`/assets/${id}`).then((r) => r.data),

  create: (organizationId: number, body: AssetCreateRequest) =>
    api.post<AssetResponse>(`/assets/${organizationId}`, body).then((r) => r.data),

  createAuto: (organizationId: number, body: Omit<AssetCreateRequest, 'assetTag'>) =>
    api.post<AssetResponse>(`/assets/${organizationId}/auto`, body).then((r) => r.data),

  retire: (id: number) => api.patch(`/assets/${id}/retire`),

  assign: (assetId: number, userId: number) =>
    api.patch(`/assets/${assetId}/assign/${userId}`),

  unassign: (assetId: number) =>
    api.patch(`/assets/${assetId}/unassign`),

  getStatusHistory: (assetId: number) =>
    api.get<AssetStatusHistory[]>(`/assets/${assetId}/history/status`).then((r) => r.data),

  getAssignmentHistory: (assetId: number) =>
    api.get<AssetAssignmentHistory[]>(`/assets/${assetId}/history/assignment`).then((r) => r.data),
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════════════════════════════════════════
export const maintenanceApi = {
  list: (params?: PageParams & {
    status?: MaintenanceStatus; assetId?: number; unitId?: number;
    startDate?: string; endDate?: string
  }) =>
    api.get<Page<MaintenanceResponse>>('/api/maintenance', { params }).then((r) => r.data),

  getBudget: (params: { unitId?: number; startDate?: string; endDate?: string }) =>
    api.get<MaintenanceBudget>('/api/maintenance/budget', { params }).then((r) => r.data),

  create: (body: MaintenanceCreateRequest) =>
    api.post<MaintenanceResponse>('/api/maintenance', body).then((r) => r.data),

  start: (id: number) =>
    api.post<MaintenanceResponse>(`/api/maintenance/${id}/start`).then((r) => r.data),

  complete: (id: number, resolution: string, actualCost?: number) =>
    api.post(`/api/maintenance/${id}/complete`, null, {
      params: { resolution, ...(actualCost !== undefined ? { actualCost } : {}) },
    }),

  cancel: (id: number) =>
    api.post(`/api/maintenance/${id}/cancel`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════════
export const transferApi = {
  list: (params?: PageParams & {
    status?: TransferStatus; assetId?: number; startDate?: string; endDate?: string
  }) =>
    api.get<Page<TransferResponse>>('/transfers', { params }).then((r) => r.data),

  create: (body: TransferCreateRequest) =>
    api.post<TransferResponse>('/transfers', body).then((r) => r.data),

  approve: (id: number, body?: TransferApproveRequest) =>
    api.patch(`/transfers/${id}/approve`, body ?? {}),

  reject: (id: number, body?: TransferApproveRequest) =>
    api.patch(`/transfers/${id}/reject`, body ?? {}),

  complete: (id: number) =>
    api.patch(`/transfers/${id}/complete`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
export const inventoryApi = {
  list: (params?: PageParams) =>
    api.get<Page<InventoryResponse>>('/inventory', { params }).then((r) => r.data),

  create: (unitId: number) =>
    api.post<InventoryResponse>('/inventory', { unitId }).then((r) => r.data),

  getById: (id: number) =>
    api.get<InventoryResponse>(`/inventory/${id}`).then((r) => r.data),

  start: (id: number) => api.patch(`/inventory/${id}/start`),
  close: (id: number) => api.patch(`/inventory/${id}/close`),
  cancel: (id: number) => api.patch(`/inventory/${id}/cancel`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
export const categoryApi = {
  list: () => api.get<CategoryResponse[]>('/categories').then((r) => r.data),
  getById: (id: number) => api.get<CategoryResponse>(`/categories/${id}`).then((r) => r.data),
  create: (body: CategoryRequest) =>
    api.post<CategoryResponse>('/categories', body).then((r) => r.data),
  update: (id: number, body: CategoryRequest) =>
    api.put<CategoryResponse>(`/categories/${id}`, body).then((r) => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST CENTERS
// ═══════════════════════════════════════════════════════════════════════════════
export const costCenterApi = {
  list: () => api.get<CostCenterResponse[]>('/cost-centers').then((r) => r.data),
  create: (body: CostCenterRequest) =>
    api.post<CostCenterResponse>('/cost-centers', body).then((r) => r.data),
  deactivate: (id: number) => api.patch(`/cost-centers/${id}/deactivate`),
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPRECIATION
// ═══════════════════════════════════════════════════════════════════════════════
export const depreciationApi = {
  getByAsset: (assetId: number) =>
    api.get<AssetDepreciation>(`/assets/${assetId}/depreciation`).then((r) => r.data),

  getPortfolio: () =>
    api.get<PortfolioDepreciation>('/assets/depreciation/portfolio').then((r) => r.data),

  getReport: () =>
    api.get<AssetDepreciation[]>('/assets/depreciation/report').then((r) => r.data),
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSURANCE
// ═══════════════════════════════════════════════════════════════════════════════
export const insuranceApi = {
  create: (assetId: number, body: InsuranceCreateRequest) =>
    api.post<AssetInsurance>(`/assets/${assetId}/insurance`, body).then((r) => r.data),

  getByAsset: (assetId: number) =>
    api.get<AssetInsurance[]>(`/assets/${assetId}/insurance`).then((r) => r.data),

  getExpiring: (days = 30) =>
    api.get<AssetInsurance[]>('/assets/insurance/expiring', { params: { days } }).then((r) => r.data),

  getSummary: () =>
    api.get<InsuranceSummary>('/assets/insurance/summary').then((r) => r.data),
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════════════════════
export const auditApi = {
  list: (params?: PageParams) =>
    api.get<Page<AuditEvent>>('/audit', { params }).then((r) => r.data),

  byUser: (userId: number, params?: PageParams) =>
    api.get<Page<AuditEvent>>(`/audit/user/${userId}`, { params }).then((r) => r.data),

  byType: (type: string, params?: PageParams) =>
    api.get<Page<AuditEvent>>(`/audit/type/${type}`, { params }).then((r) => r.data),

  byTarget: (targetType: string, targetId: number, params?: PageParams) =>
    api.get<Page<AuditEvent>>('/audit/target', { params: { targetType, targetId, ...params } }).then((r) => r.data),

  byPeriod: (organizationId: number, start: string, end: string, params?: PageParams) =>
    api.get<Page<AuditEvent>>('/audit/period', { params: { organizationId, start, end, ...params } }).then((r) => r.data),

  lastByTarget: (targetType: string, targetId: number) =>
    api.get<AuditEvent>('/audit/target/last', { params: { targetType, targetId } }).then((r) => r.data),
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT  (streams CSV — create blob download)
// ═══════════════════════════════════════════════════════════════════════════════
export const exportApi = {
  downloadAssets: async () => {
    const res = await api.get('/export/assets', { responseType: 'blob' })
    triggerDownload(res.data, 'ativos.csv')
  },

  downloadMaintenance: async (startDate?: string, endDate?: string) => {
    const res = await api.get('/export/maintenance', {
      responseType: 'blob',
      params: { startDate, endDate },
    })
    triggerDownload(res.data, 'manutencoes.csv')
  },

  downloadAudit: async (startDate?: string, endDate?: string) => {
    const res = await api.get('/export/audit', {
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
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  executive: () =>
    api.get<ExecutiveDashboard>('/api/dashboard/executive').then((r) => r.data),

  unit: () =>
    api.get<UnitDashboard>('/api/dashboard/unit').then((r) => r.data),

  personal: () =>
    api.get<PersonalDashboard>('/api/dashboard/personal').then((r) => r.data),
}
