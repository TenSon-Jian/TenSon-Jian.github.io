/**
 * 轻量语法高亮。
 * 不引入第三方高亮库：按语言维护关键字表 + 单遍扫描词法着色，
 * 输出受控的 <span class="tok-*">，HTML 全部转义。
 */

export type HighlightLanguage =
  | 'javascript'
  | 'typescript'
  | 'vue'
  | 'html'
  | 'css'
  | 'scss'
  | 'json'
  | 'java'
  | 'python'
  | 'sql'
  | 'bash'
  | 'yaml'
  | 'markdown'
  | 'text'

const LANGUAGE_ALIASES: Record<string, HighlightLanguage> = {
  js: 'javascript',
  javascript: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  vue: 'vue',
  html: 'html',
  xml: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  json: 'json',
  jsonc: 'json',
  java: 'java',
  kt: 'java',
  python: 'python',
  py: 'python',
  sql: 'sql',
  mysql: 'sql',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  powershell: 'bash',
  ps1: 'bash',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  text: 'text',
  txt: 'text',
  plain: 'text',
}

export function normalizeLanguage(input?: string): HighlightLanguage {
  if (!input) return 'text'
  return LANGUAGE_ALIASES[input.trim().toLowerCase()] ?? 'text'
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface LanguageSpec {
  keywords: string[]
  builtins?: string[]
  lineComment?: string[]
  blockComment?: [string, string] | null
  /** 支持反引号模板字符串 / 多行字符串 */
  template?: boolean
}

const SPECS: Record<HighlightLanguage, LanguageSpec> = {
  javascript: {
    keywords: [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'break',
      'continue', 'new', 'class', 'extends', 'super', 'this', 'import', 'from', 'export', 'default',
      'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of',
      'delete', 'void', 'yield', 'static', 'get', 'set',
    ],
    builtins: ['console', 'window', 'document', 'Math', 'JSON', 'Object', 'Array', 'Promise', 'Date', 'Error'],
    lineComment: ['//'],
    blockComment: ['/*', '*/'],
    template: true,
  },
  typescript: {
    keywords: [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'break',
      'continue', 'new', 'class', 'extends', 'implements', 'interface', 'type', 'enum', 'super',
      'this', 'import', 'from', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally',
      'throw', 'typeof', 'instanceof', 'in', 'of', 'as', 'satisfies', 'keyof', 'readonly', 'public',
      'private', 'protected', 'declare', 'namespace', 'abstract', 'override', 'void', 'never',
      'unknown', 'any', 'string', 'number', 'boolean', 'null', 'undefined', 'yield', 'static',
    ],
    builtins: ['console', 'Promise', 'Record', 'Partial', 'Array', 'Ref', 'ComputedRef', 'defineProps', 'defineEmits'],
    lineComment: ['//'],
    blockComment: ['/*', '*/'],
    template: true,
  },
  vue: {
    keywords: ['template', 'script', 'style', 'setup', 'lang', 'scoped'],
    lineComment: ['//'],
    blockComment: ['<!--', '-->'],
    template: true,
  },
  html: {
    keywords: [],
    lineComment: [],
    blockComment: ['<!--', '-->'],
  },
  css: {
    keywords: [],
    lineComment: [],
    blockComment: ['/*', '*/'],
  },
  scss: {
    keywords: ['use', 'mixin', 'include', 'extend', 'if', 'else', 'each', 'for', 'function', 'return', 'import'],
    lineComment: ['//'],
    blockComment: ['/*', '*/'],
  },
  json: {
    keywords: ['true', 'false', 'null'],
    lineComment: [],
    blockComment: null,
  },
  java: {
    keywords: [
      'public', 'private', 'protected', 'class', 'interface', 'enum', 'extends', 'implements',
      'static', 'final', 'void', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
      'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'import',
      'package', 'this', 'super', 'instanceof', 'synchronized', 'volatile', 'transient', 'record',
      'boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double', 'var',
    ],
    builtins: ['String', 'Integer', 'Long', 'Boolean', 'List', 'Map', 'Set', 'Optional', 'System', 'Override'],
    lineComment: ['//'],
    blockComment: ['/*', '*/'],
  },
  python: {
    keywords: [
      'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'import',
      'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield', 'global',
      'nonlocal', 'assert', 'pass', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False', 'async', 'await',
    ],
    builtins: ['print', 'len', 'range', 'str', 'int', 'dict', 'list', 'set', 'self', 'super'],
    lineComment: ['#'],
    blockComment: null,
    template: true,
  },
  sql: {
    keywords: [
      'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create',
      'table', 'alter', 'drop', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group', 'by',
      'order', 'having', 'limit', 'offset', 'as', 'and', 'or', 'not', 'null', 'primary', 'key',
      'foreign', 'references', 'index', 'distinct', 'count', 'sum', 'avg', 'max', 'min', 'case', 'when', 'then', 'end',
    ],
    lineComment: ['--'],
    blockComment: ['/*', '*/'],
  },
  bash: {
    keywords: [
      'cd', 'ls', 'npm', 'pnpm', 'yarn', 'node', 'git', 'docker', 'sudo', 'echo', 'export', 'if',
      'then', 'else', 'fi', 'for', 'in', 'do', 'done', 'while', 'function', 'return', 'exit', 'set',
      'source', 'curl', 'grep', 'mkdir', 'rm', 'cp', 'mv', 'chmod',
    ],
    lineComment: ['#'],
    blockComment: null,
  },
  yaml: {
    keywords: ['true', 'false', 'null'],
    lineComment: ['#'],
    blockComment: null,
  },
  markdown: {
    keywords: [],
    lineComment: [],
    blockComment: null,
  },
  text: {
    keywords: [],
    lineComment: [],
    blockComment: null,
  },
}

const IDENT_START = /[A-Za-z_$@#-]/
const IDENT_PART = /[A-Za-z0-9_$.-]/
const DIGIT = /[0-9]/

function span(className: string, value: string): string {
  return `<span class="tok-${className}">${escapeHtml(value)}</span>`
}

/**
 * 单遍扫描：按字符推进，优先匹配注释 / 字符串，其次是标识符与数字。
 */
export function highlight(code: string, language?: string): string {
  const lang = normalizeLanguage(language)
  const spec = SPECS[lang]
  const keywordSet = new Set(spec.keywords.map((k) => k.toLowerCase()))
  const builtinSet = new Set((spec.builtins ?? []).map((b) => b.toLowerCase()))

  let out = ''
  let i = 0
  const source = code.replace(/\r\n?/g, '\n')

  const matchAt = (token: string, index: number) => source.startsWith(token, index)

  while (i < source.length) {
    const char = source[i]

    // 块注释
    if (spec.blockComment && matchAt(spec.blockComment[0], i)) {
      const [open, close] = spec.blockComment
      const end = source.indexOf(close, i + open.length)
      const stop = end === -1 ? source.length : end + close.length
      out += span('comment', source.slice(i, stop))
      i = stop
      continue
    }

    // 行注释
    if (spec.lineComment?.some((token) => matchAt(token, i))) {
      const end = source.indexOf('\n', i)
      const stop = end === -1 ? source.length : end
      out += span('comment', source.slice(i, stop))
      i = stop
      continue
    }

    // 字符串
    if (char === '"' || char === "'" || (spec.template && char === '`')) {
      const quote = char
      let j = i + 1
      let closed = false
      while (j < source.length) {
        if (source[j] === '\\') {
          j += 2
          continue
        }
        if (source[j] === quote) {
          closed = true
          j += 1
          break
        }
        if (quote !== '`' && source[j] === '\n') break
        j += 1
      }
      const stop = closed ? j : source.length
      out += span('string', source.slice(i, stop))
      i = stop
      continue
    }

    // 数字
    if (DIGIT.test(char) && !IDENT_PART.test(source[i - 1] ?? '')) {
      let j = i
      while (j < source.length && /[0-9a-fA-FxX._]/.test(source[j])) j += 1
      out += span('number', source.slice(i, j))
      i = j
      continue
    }

    // 标识符 / 关键字
    // 注意：IDENT_START 比 IDENT_PART 多出 @ 与 #（用于 @media / #id），
    // 因此扫描必须从 i + 1 开始，否则遇到单独的 @ 或 # 时 j 不会前进，会死循环。
    if (IDENT_START.test(char) && !IDENT_PART.test(source[i - 1] ?? '')) {
      let j = i + 1
      while (j < source.length && IDENT_PART.test(source[j])) j += 1
      const word = source.slice(i, j)
      const lower = word.toLowerCase()

      if (keywordSet.has(lower)) {
        out += span('keyword', word)
      } else if (builtinSet.has(lower)) {
        out += span('builtin', word)
      } else if (/(^|\n)\s*[A-Za-z_$][\w$]*\s*\(/.test(source.slice(0, i) + word)) {
        out += span('function', word)
      } else {
        out += escapeHtml(word)
      }
      i = j
      continue
    }

    out += escapeHtml(char)
    i += 1
  }

  return out
}
