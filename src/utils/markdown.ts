import { escapeHtml, highlight } from './highlight'

/**
 * 极简 Markdown 解析器（无第三方依赖）。
 *
 * 支持：H1–H3、粗体、斜体、链接、图片、行内代码、代码块（带语言与高亮）、
 * 表格、引用、有序 / 无序列表、分隔线、段落。
 *
 * 规范第 19 节要求代码块具备「语言标签 + 复制按钮」，
 * 因此代码块渲染为 <div class="code-block" data-lang="...">，由视图层挂载按钮。
 */

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const html: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    // 代码块
    const fence = /^\s*(```|~~~)\s*([\w+-]*)\s*$/.exec(line)
    if (fence) {
      const marker = fence[1]
      const lang = fence[2] || 'text'
      const body: string[] = []
      index += 1
      while (index < lines.length && !new RegExp(`^\\s*${marker}\\s*$`).test(lines[index])) {
        body.push(lines[index])
        index += 1
      }
      index += 1 // 跳过结束围栏
      html.push(codeBlock(body.join('\n'), lang))
      continue
    }

    // 标题
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`)
      index += 1
      continue
    }

    // 分隔线
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      html.push('<hr />')
      index += 1
      continue
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      const body: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        body.push(lines[index].replace(/^\s*>\s?/, ''))
        index += 1
      }
      html.push(`<blockquote>${renderMarkdown(body.join('\n'))}</blockquote>`)
      continue
    }

    // 表格
    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[index + 1])) {
      const head = splitRow(line)
      index += 2
      const rows: string[][] = []
      while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
        rows.push(splitRow(lines[index]))
        index += 1
      }
      html.push(table(head, rows))
      continue
    }

    // 列表
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (index < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*([-*+]|\d+\.)\s+/, ''))
        index += 1
      }
      const tag = ordered ? 'ol' : 'ul'
      html.push(`<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`)
      continue
    }

    // 空行
    if (line.trim() === '') {
      index += 1
      continue
    }

    // 段落
    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !/^\s*(```|~~~)/.test(lines[index]) &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !/^\s*>\s?/.test(lines[index]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    html.push(`<p>${inline(paragraph.join(' '))}</p>`)
  }

  return html.join('\n')
}

function codeBlock(code: string, lang: string): string {
  const language = (lang || 'text').toLowerCase()
  return [
    `<div class="code-block" data-lang="${escapeHtml(language)}">`,
    `<div class="code-block__head"><span class="code-block__lang">${escapeHtml(language)}</span></div>`,
    `<pre class="code-block__body"><code>${highlight(code, language)}</code></pre>`,
    '</div>',
  ].join('')
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function table(head: string[], rows: string[][]): string {
  const thead = `<thead><tr>${head.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead>`
  const tbody = `<tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`
  return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`
}

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'image'; alt: string; href: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'strong'; value: string }
  | { kind: 'em'; value: string }
  | { kind: 'del'; value: string }

const INLINE_PATTERN = new RegExp(
  [
    '(`[^`]+`)', // 1 行内代码
    '(!\\[[^\\]]*\\]\\([^)\\s]+\\))', // 2 图片
    '(\\[[^\\]]+\\]\\([^)\\s]+\\))', // 3 链接
    '(\\*\\*[^*]+\\*\\*)', // 4 粗体
    '(__[^_]+__)', // 5 粗体
    '(\\*[^*]+\\*)', // 6 斜体
    '(_[^_]+_)', // 7 斜体
    '(~~[^~]+~~)', // 8 删除线
  ].join('|'),
  'g',
)

function inline(source: string): string {
  const tokens: Token[] = []
  let lastIndex = 0

  for (const match of source.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0
    if (start > lastIndex) tokens.push({ kind: 'text', value: source.slice(lastIndex, start) })
    const raw = match[0]

    if (match[1]) {
      tokens.push({ kind: 'code', value: raw.slice(1, -1) })
    } else if (match[2]) {
      const parsed = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(raw)
      if (parsed) tokens.push({ kind: 'image', alt: parsed[1], href: parsed[2] })
      else tokens.push({ kind: 'text', value: raw })
    } else if (match[3]) {
      const parsed = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(raw)
      if (parsed) tokens.push({ kind: 'link', text: parsed[1], href: parsed[2] })
      else tokens.push({ kind: 'text', value: raw })
    } else if (match[4] || match[5]) {
      tokens.push({ kind: 'strong', value: raw.slice(2, -2) })
    } else if (match[6] || match[7]) {
      tokens.push({ kind: 'em', value: raw.slice(1, -1) })
    } else if (match[8]) {
      tokens.push({ kind: 'del', value: raw.slice(2, -2) })
    }

    lastIndex = start + raw.length
  }

  if (lastIndex < source.length) tokens.push({ kind: 'text', value: source.slice(lastIndex) })

  return tokens.map(tokenToHtml).join('')
}

function tokenToHtml(token: Token): string {
  switch (token.kind) {
    case 'code':
      return `<code class="inline-code">${escapeHtml(token.value)}</code>`
    case 'image':
      return `<img class="md-image" src="${escapeHtml(token.href)}" alt="${escapeHtml(token.alt)}" loading="lazy" />`
    case 'link':
      return `<a class="md-link" href="${escapeHtml(token.href)}"${
        /^https?:/.test(token.href) ? ' target="_blank" rel="noopener noreferrer"' : ''
      }>${escapeHtml(token.text)}</a>`
    case 'strong':
      return `<strong>${escapeHtml(token.value)}</strong>`
    case 'em':
      return `<em>${escapeHtml(token.value)}</em>`
    case 'del':
      return `<del>${escapeHtml(token.value)}</del>`
    default:
      return escapeHtml(token.value)
  }
}

/** 提取纯文本，用于摘要或搜索 */
export function markdownToPlainText(markdown: string, limit = 160): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > limit ? `${plain.slice(0, limit)}…` : plain
}

/** 估算阅读时长（分钟） */
export function readingMinutes(markdown: string): number {
  const text = markdownToPlainText(markdown, Number.MAX_SAFE_INTEGER)
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length
  const words = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length
  // 中文 400 字/分钟，英文 200 词/分钟
  return Math.max(1, Math.round(cjk / 400 + words / 200))
}
