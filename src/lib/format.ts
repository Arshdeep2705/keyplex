export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

export function moneyShort(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}k`
  return money(n)
}

export function pct(n: number | null | undefined, dp = 1): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toFixed(dp)}%`
}

export function num(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-AU')
}

export function sqm(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${num(n)} m²`
}

export function daysAgo(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Listed today'
  if (days === 1) return 'Listed yesterday'
  if (days < 30) return `Listed ${days} days ago`
  const months = Math.floor(days / 30)
  return `Listed ${months} month${months > 1 ? 's' : ''} ago`
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
