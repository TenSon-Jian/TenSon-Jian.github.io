/**
 * 程序化封面 / 截图生成器。
 *
 * 规范要求「项目截图」与「文章封面」，但仓库里不应塞入大量位图资源。
 * 这里用确定性的 SVG（data URI）绘制克制的抽象界面缩略图：
 * 暖米白背景 + 灰棕线条，不使用渐变与霓虹色，与整体设计语言一致。
 */

export type CoverKind = 'dashboard' | 'windows' | 'list' | 'chart' | 'wave' | 'grid'

const PALETTE = {
  bg: '#F5F1E7',
  surface: '#FBF9F4',
  line: '#D9D3C5',
  lineStrong: '#C2BAA8',
  fill: '#E7E1D3',
  fillSoft: '#EFEADE',
  accent: '#A9A08D',
  ink: '#6E6A62',
}

function hash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function encode(svg: string): string {
  const compact = svg.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim()
  return `data:image/svg+xml,${encodeURIComponent(compact)}`
}

function frame(content: string, width = 640, height = 400): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
    <rect width="${width}" height="${height}" fill="${PALETTE.bg}"/>
    ${content}
  </svg>`
}

function windowChrome(width: number, title = true): string {
  const dots = [0, 1, 2]
    .map((i) => `<circle cx="${24 + i * 14}" cy="26" r="3.4" fill="${PALETTE.lineStrong}"/>`)
    .join('')
  const bar = title
    ? `<rect x="86" y="20" width="${Math.min(220, width - 140)}" height="12" rx="6" fill="${PALETTE.fill}"/>`
    : ''
  return `<rect x="0" y="0" width="${width}" height="52" fill="${PALETTE.surface}"/>
    <line x1="0" y1="52" x2="${width}" y2="52" stroke="${PALETTE.line}" stroke-width="1"/>
    ${dots}${bar}`
}

interface CoverOptions {
  /** 标题文字（用于绘制抽象的内容条，不渲染真实文字以免字体依赖） */
  seed: string
  kind?: CoverKind
}

/** 生成一张 16:10 的抽象界面封面 */
export function generateCover({ seed, kind }: CoverOptions): string {
  const h = hash(seed)
  const shape = kind ?? (['dashboard', 'windows', 'list', 'chart', 'wave', 'grid'] as CoverKind[])[h % 6]
  const width = 640
  const height = 400
  const body = `${windowChrome(width, shape !== 'windows')}${bodyFor(shape, h, width, height)}`
  return encode(frame(body, width, height))
}

function bodyFor(shape: CoverKind, h: number, width: number, height: number): string {
  switch (shape) {
    case 'windows': {
      // 分栏窗口：左列表 + 右内容
      return `
        <rect x="0" y="52" width="196" height="${height - 52}" fill="${PALETTE.fillSoft}"/>
        <line x1="196" y1="52" x2="196" y2="${height}" stroke="${PALETTE.line}" stroke-width="1"/>
        ${[0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<rect x="24" y="${88 + i * 46}" width="${120 - (i % 3) * 18}" height="10" rx="5" fill="${
                i === 1 ? PALETTE.accent : PALETTE.fill
              }"/>`,
          )
          .join('')}
        <rect x="228" y="92" width="300" height="18" rx="9" fill="${PALETTE.fill}"/>
        <rect x="228" y="126" width="${340 - (h % 60)}" height="10" rx="5" fill="${PALETTE.fillSoft}"/>
        <rect x="228" y="148" width="${280 - (h % 90)}" height="10" rx="5" fill="${PALETTE.fillSoft}"/>
        <rect x="228" y="188" width="180" height="120" rx="10" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        <rect x="424" y="188" width="180" height="120" rx="10" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        <path d="M244 288 l28 -34 l30 22 l34 -46 l30 30" fill="none" stroke="${PALETTE.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    }
    case 'list':
      return `
        ${[0, 1, 2, 3, 4]
          .map((i) => {
            const y = 92 + i * 58
            return `<rect x="40" y="${y}" width="46" height="12" rx="6" fill="${PALETTE.accent}"/>
              <rect x="102" y="${y - 2}" width="${300 - ((h >> i) % 80)}" height="14" rx="7" fill="${PALETTE.fill}"/>
              <rect x="102" y="${y + 22}" width="${420 - (i * 40) % 160}" height="9" rx="4.5" fill="${PALETTE.fillSoft}"/>
              <line x1="40" y1="${y + 46}" x2="${width - 40}" y2="${y + 46}" stroke="${PALETTE.line}" stroke-width="1"/>`
          })
          .join('')}`
    case 'chart':
      return `
        <rect x="40" y="92" width="360" height="240" rx="12" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        ${[0, 1, 2, 3]
          .map((i) => `<line x1="64" y1="${140 + i * 48}" x2="376" y2="${140 + i * 48}" stroke="${PALETTE.line}" stroke-width="1" stroke-dasharray="4 6"/>`)
          .join('')}
        ${[0, 1, 2, 3, 4, 5]
          .map((i) => {
            const barH = 40 + ((h >> (i + 2)) % 120)
            return `<rect x="${76 + i * 50}" y="${312 - barH}" width="26" height="${barH}" rx="6" fill="${
              i === 3 ? PALETTE.accent : PALETTE.fill
            }"/>`
          })
          .join('')}
        <rect x="428" y="92" width="176" height="112" rx="12" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        <circle cx="470" cy="148" r="26" fill="none" stroke="${PALETTE.fill}" stroke-width="12"/>
        <path d="M470 122 a26 26 0 0 1 24 36" fill="none" stroke="${PALETTE.accent}" stroke-width="12" stroke-linecap="round"/>
        <rect x="428" y="220" width="176" height="112" rx="12" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        <rect x="448" y="244" width="120" height="10" rx="5" fill="${PALETTE.fill}"/>
        <rect x="448" y="266" width="86" height="10" rx="5" fill="${PALETTE.fillSoft}"/>
        <rect x="448" y="288" width="104" height="10" rx="5" fill="${PALETTE.fillSoft}"/>`
    case 'wave':
      return `
        <rect x="40" y="88" width="560" height="130" rx="12" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        <path d="M60 152 q30 -46 60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="${PALETTE.accent}" stroke-width="3" stroke-linecap="round"/>
        <rect x="40" y="238" width="268" height="94" rx="12" fill="${PALETTE.fillSoft}"/>
        <rect x="332" y="238" width="268" height="94" rx="12" fill="${PALETTE.fillSoft}"/>
        <rect x="64" y="262" width="140" height="12" rx="6" fill="${PALETTE.fill}"/>
        <rect x="64" y="288" width="200" height="10" rx="5" fill="${PALETTE.surface}"/>
        <rect x="356" y="262" width="120" height="12" rx="6" fill="${PALETTE.fill}"/>
        <rect x="356" y="288" width="180" height="10" rx="5" fill="${PALETTE.surface}"/>`
    case 'grid':
      return `
        ${[0, 1, 2, 3, 4, 5]
          .map((i) => {
            const col = i % 3
            const row = Math.floor(i / 3)
            return `<rect x="${40 + col * 192}" y="${88 + row * 148}" width="168" height="124" rx="12" fill="${
              i % 4 === 1 ? PALETTE.fill : PALETTE.surface
            }" stroke="${PALETTE.line}"/>
              <rect x="${58 + col * 192}" y="${106 + row * 148}" width="72" height="10" rx="5" fill="${PALETTE.accent}"/>
              <rect x="${58 + col * 192}" y="${128 + row * 148}" width="118" height="9" rx="4.5" fill="${PALETTE.fillSoft}"/>
              <rect x="${58 + col * 192}" y="${146 + row * 148}" width="96" height="9" rx="4.5" fill="${PALETTE.fillSoft}"/>
              <rect x="${58 + col * 192}" y="${172 + row * 148}" width="46" height="18" rx="9" fill="${PALETTE.fill}"/>`
          })
          .join('')}`
    case 'dashboard':
    default:
      return `
        <rect x="24" y="76" width="592" height="72" rx="12" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
        <rect x="48" y="98" width="140" height="14" rx="7" fill="${PALETTE.fill}"/>
        <rect x="48" y="122" width="220" height="10" rx="5" fill="${PALETTE.fillSoft}"/>
        <rect x="456" y="98" width="136" height="28" rx="14" fill="${PALETTE.fill}"/>
        ${[0, 1, 2]
          .map(
            (i) => `<rect x="${24 + i * 200}" y="168" width="184" height="96" rx="12" fill="${PALETTE.surface}" stroke="${PALETTE.line}"/>
              <rect x="${44 + i * 200}" y="188" width="60" height="10" rx="5" fill="${PALETTE.accent}"/>
              <rect x="${44 + i * 200}" y="212" width="${112 - i * 18}" height="24" rx="6" fill="${PALETTE.fill}"/>`,
          )
          .join('')}
        <rect x="24" y="284" width="384" height="92" rx="12" fill="${PALETTE.fillSoft}"/>
        <rect x="424" y="284" width="192" height="92" rx="12" fill="${PALETTE.fillSoft}"/>
        <path d="M48 352 l40 -32 l44 18 l46 -40 l44 26" fill="none" stroke="${PALETTE.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  }
}

/** 生成一组项目截图（用于详情页 Screenshots 网格） */
export function generateScreenshots(seed: string, count = 3): Array<{ src: string; alt: string }> {
  const kinds: CoverKind[] = ['dashboard', 'windows', 'list', 'chart', 'wave', 'grid']
  return Array.from({ length: count }, (_, index) => ({
    src: generateCover({ seed: `${seed}-${index}`, kind: kinds[(hash(seed) + index) % kinds.length] }),
    alt: `${seed} 界面截图 ${index + 1}`,
  }))
}
