/** 相对时间：3 days ago / just now，与卡片元数据一致 */
export function relativeTime(input?: string | number | Date): string {
  if (!input) return '—'
  const time = typeof input === 'number' ? input : new Date(input).getTime()
  if (Number.isNaN(time)) return '—'

  const diff = Date.now() - time
  if (diff < 0) return 'just now'

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`

  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

/** 2026.09.18 —— 与设计稿一致的日期写法 */
export function formatDate(input?: string | number | Date): string {
  if (input === undefined || input === null) return '—'
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}.${m}.${d}`
}

export function formatDateTime(input?: string | number | Date): string {
  if (input === undefined || input === null) return '—'
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  return `${formatDate(date)} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}

export function formatNumber(value?: number): string {
  if (value === undefined || value === null) return '—'
  if (value >= 10000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 文本复制：兼容非安全上下文 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
