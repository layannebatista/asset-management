import type { AssetResponse, UnitResponse, UserResponse } from '../../types'

// ─── MOEDA ───────────────────────────────────────────────────────────────────

/** Converte string mascarada "R$ 1.234,56" → número 1234.56 */
export function parseCurrency(val: string): number {
  if (!val) return 0
  const raw = val.replace(/\D/g, '')
  return raw ? Number(raw) / 100 : 0
}

/** Formata número como moeda BRL: 1234.56 → "R$ 1.234,56" */
export function formatCurrency(val: number): string {
  const safe = Number.isFinite(val) ? val : 0
  return safe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Handler para inputs de moeda.
 * Uso: onChange={(e) => setVal(formatCurrencyInput(e.target.value))}
 */
export function formatCurrencyInput(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  const num = digits ? Number(digits) / 100 : 0
  return digits ? formatCurrency(num) : ''
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

function isValidDate(d: Date) {
  return !isNaN(d.getTime())
}

/** Formata ISO string como data curta: "2024-03-15" → "15/03/2024" */
export function formatDate(iso: string): string {
  if (!iso) return '—'

  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (!isValidDate(date)) return '—'

  return date.toLocaleDateString('pt-BR')
}

/** Formata ISO string como data e hora: "2024-03-15T10:30:00" → "15/03/2024, 10:30" */
export function formatDateTime(iso: string): string {
  if (!iso) return '—'

  const date = new Date(iso)
  if (!isValidDate(date)) return '—'

  return date.toLocaleString('pt-BR')
}

/** Formata ISO string como data curta com hora (para dashboards): "15/03 10:30" */
export function formatDateTimeShort(iso: string): string {
  if (!iso) return '—'

  const date = new Date(iso)
  if (!isValidDate(date)) return '—'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── RESOLVERS DE NOME ────────────────────────────────────────────────────────
// Centralizam a lógica de "ID → nome legível" que estava duplicada em 6+ arquivos.
// Retornam fallback descritivo quando o item não é encontrado na lista local.

/** Resolve unitId → nome da unidade. Fallback: "Unidade #id" */
export function resolveUnitName(id: number, units: UnitResponse[] = []): string {
  return units.find((u) => u.id === id)?.name ?? '—'
}

/** Resolve userId → nome do usuário. Fallback: "Usuário #id" */
export function resolveUserName(id: number | undefined | null, users: UserResponse[] = []): string {
  if (!id) return '—'
  return users.find((u) => u.id === id)?.name ?? '—'
}

/**
 * Resolve assetId → "TAG — Modelo".
 * Fallback: "Ativo #id"
 */
export function resolveAssetLabel(id: number, assets: AssetResponse[] = []): string {
  const a = assets.find((x) => x.id === id)
  return a ? `${a.assetTag} — ${a.model}` : '—'
}

// ─── MISC ─────────────────────────────────────────────────────────────────────

/** Gera código formatado com prefixo e zero-padding. Ex: formatCode("MNT", 5) → "MNT-0005" */
export function formatCode(prefix: string, id: number, pad = 4): string {
  return `${prefix}-${String(id).padStart(pad, '0')}`
}