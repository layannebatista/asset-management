import type { AssetType, AssetStatus, TransferStatus, MaintenanceStatus, UserStatus, UserRole, InventoryStatus } from '../../types'

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE:      'Disponível',
  ASSIGNED:       'Atribuído',
  IN_MAINTENANCE: 'Em Manutenção',
  IN_TRANSFER:    'Em Transferência',
  UNAVAILABLE:    'Indisponível',
  RETIRED:        'Aposentado',
}

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE:      'bg-emerald-100 text-emerald-700',
  ASSIGNED:       'bg-blue-100 text-blue-700',
  IN_MAINTENANCE: 'bg-amber-100 text-amber-700',
  IN_TRANSFER:    'bg-purple-100 text-purple-700',
  UNAVAILABLE:    'bg-slate-100 text-slate-500',
  RETIRED:        'bg-slate-100 text-slate-500',
}

export const ASSET_STATUS_HEX: Record<AssetStatus, string> = {
  AVAILABLE:      '#1d4ed8',
  ASSIGNED:       '#0891b2',
  IN_MAINTENANCE: '#f59e0b',
  IN_TRANSFER:    '#7c3aed',
  UNAVAILABLE:    '#94a3b8',
  RETIRED:        '#94a3b8',
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  NOTEBOOK:    'Notebook',
  DESKTOP:     'Desktop',
  TABLET:      'Tablet',
  MOBILE_PHONE:'Celular',
  VEHICLE:     'Veículo',
  OTHER:       'Outro',
}

export const ASSET_TYPE_OPTIONS: Array<{ value: AssetType; label: string }> = [
  { value: 'NOTEBOOK',     label: 'Notebook' },
  { value: 'DESKTOP',      label: 'Desktop' },
  { value: 'TABLET',       label: 'Tablet' },
  { value: 'MOBILE_PHONE', label: 'Celular/Smartphone' },
  { value: 'VEHICLE',      label: 'Veículo' },
  { value: 'OTHER',        label: 'Outro' },
]

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  PENDING:   'Pendente',
  APPROVED:  'Aprovado',
  COMPLETED: 'Concluído',
  REJECTED:  'Rejeitado',
  CANCELLED: 'Cancelado',
}

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  APPROVED:  'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export const TRANSFER_STATUS_HEX: Record<TransferStatus, string> = {
  PENDING:   '#f59e0b',
  APPROVED:  '#0891b2',
  COMPLETED: '#10b981',
  REJECTED:  '#ef4444',
  CANCELLED: '#94a3b8',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  REQUESTED:   'Solicitado',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED:   'Concluído',
  CANCELLED:   'Cancelado',
}

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  REQUESTED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  CANCELLED:   'bg-slate-100 text-slate-500',
}

export const MAINTENANCE_STATUS_HEX: Record<MaintenanceStatus, string> = {
  REQUESTED:   '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  COMPLETED:   '#10b981',
  CANCELLED:   '#94a3b8',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE:             'Ativo',
  INACTIVE:           'Inativo',
  BLOCKED:            'Bloqueado',
  PENDING_ACTIVATION: 'Pendente de ativação',
}

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE:             'bg-emerald-100 text-emerald-700',
  INACTIVE:           'bg-slate-100 text-slate-500',
  BLOCKED:            'bg-red-100 text-red-700',
  PENDING_ACTIVATION: 'bg-amber-100 text-amber-700',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:    'Administrador',
  GESTOR:   'Gestor',
  OPERADOR: 'Operador',
}

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:    'bg-red-100 text-red-700',
  GESTOR:   'bg-blue-100 text-blue-700',
  OPERADOR: 'bg-emerald-100 text-emerald-700',
}

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  OPEN:        'Aberto',
  IN_PROGRESS: 'Em Andamento',
  CLOSED:      'Fechado',
  CANCELLED:   'Cancelado',
}

export const INVENTORY_STATUS_COLORS: Record<InventoryStatus, string> = {
  OPEN:        'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  CLOSED:      'bg-emerald-100 text-emerald-700',
  CANCELLED:   'bg-slate-100 text-slate-500',
}

// ─── AUDIT ───────────────────────────────────────────────────────────────────
export const AUDIT_EVENT_LABELS: Record<string, string> = {
  // Assets
  ASSET_CREATED:         'Ativo criado',
  ASSET_ASSIGNED:        'Ativo atribuído',
  ASSET_UNASSIGNED:      'Ativo desatribuído',
  ASSET_RETIRED:         'Ativo aposentado',
  ASSET_UPDATED:         'Ativo atualizado',
  // Transfers
  TRANSFER_REQUESTED:    'Transferência solicitada',
  TRANSFER_APPROVED:     'Transferência aprovada',
  TRANSFER_REJECTED:     'Transferência rejeitada',
  TRANSFER_COMPLETED:    'Transferência concluída',
  TRANSFER_CANCELLED:    'Transferência cancelada',
  // Maintenance
  MAINTENANCE_OPENED:    'Manutenção aberta',
  MAINTENANCE_STARTED:   'Manutenção iniciada',
  MAINTENANCE_COMPLETED: 'Manutenção concluída',
  MAINTENANCE_CANCELLED: 'Manutenção cancelada',
  // Users
  USER_CREATED:          'Usuário criado',
  USER_BLOCKED:          'Usuário bloqueado',
  USER_ACTIVATED:        'Usuário ativado',
  USER_INACTIVATED:      'Usuário inativado',
  // Units
  UNIT_CREATED:          'Unidade criada',
  UNIT_ACTIVATED:        'Unidade ativada',
  UNIT_INACTIVATED:      'Unidade inativada',
}

// Opções de filtro para o select de Auditoria
export const AUDIT_EVENT_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  // Ativos
  { value: 'ASSET_CREATED',         label: 'Ativo criado' },
  { value: 'ASSET_ASSIGNED',        label: 'Ativo atribuído' },
  { value: 'ASSET_UNASSIGNED',      label: 'Ativo desatribuído' },
  { value: 'ASSET_RETIRED',         label: 'Ativo aposentado' },
  // Transferências
  { value: 'TRANSFER_REQUESTED',    label: 'Transferência solicitada' },
  { value: 'TRANSFER_APPROVED',     label: 'Transferência aprovada' },
  { value: 'TRANSFER_REJECTED',     label: 'Transferência rejeitada' },
  { value: 'TRANSFER_COMPLETED',    label: 'Transferência concluída' },
  { value: 'TRANSFER_CANCELLED',    label: 'Transferência cancelada' },
  // Manutenções
  { value: 'MAINTENANCE_OPENED',    label: 'Manutenção aberta' },
  { value: 'MAINTENANCE_STARTED',   label: 'Manutenção iniciada' },
  { value: 'MAINTENANCE_COMPLETED', label: 'Manutenção concluída' },
  { value: 'MAINTENANCE_CANCELLED', label: 'Manutenção cancelada' },
  // Usuários
  { value: 'USER_CREATED',          label: 'Usuário criado' },
  { value: 'USER_BLOCKED',          label: 'Usuário bloqueado' },
  { value: 'USER_ACTIVATED',        label: 'Usuário ativado' },
  { value: 'USER_INACTIVATED',      label: 'Usuário inativado' },
  // Unidades
  { value: 'UNIT_CREATED',          label: 'Unidade criada' },
  { value: 'UNIT_ACTIVATED',        label: 'Unidade ativada' },
  { value: 'UNIT_INACTIVATED',      label: 'Unidade inativada' },
]

export const AUDIT_TARGET_LABELS: Record<string, string> = {
  ASSET:        'Ativo',
  USER:         'Usuário',
  UNIT:         'Unidade',
  ORGANIZATION: 'Organização',
  MAINTENANCE:  'Manutenção',
  TRANSFER:     'Transferência',
  INVENTORY:    'Inventário',
}

export const INPUT_CLS =
  'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'