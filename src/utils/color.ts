import { formatDate } from './format'

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value))

export function normalizeHex(input: string): string | null {
  const value = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value
      .split('')
      .map((char) => char + char)
      .join('')
      .toUpperCase()}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value.toUpperCase()}`
  return null
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const value = normalized.slice(1)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (value: number) => clamp(Math.round(value)).toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === red) h = ((green - blue) / delta) % 6
    else if (max === green) h = (blue - red) / delta + 2
    else h = (red - green) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const saturation = s / 100
  const lightness = l / 100
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lightness - c / 2

  let rgb: [number, number, number]
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl))
}

/** 相对亮度（WCAG 2.1） */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** 对比度：用于提示文字在该背景上是否可读 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function randomHex(): string {
  const value = Math.floor(Math.random() * 0xffffff)
  return `#${value.toString(16).padStart(6, '0').toUpperCase()}`
}

/** Base64：正确处理 UTF-8 中文 */
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary)
}

export function decodeBase64(input: string): string {
  const binary = atob(input.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

export { formatDate }
