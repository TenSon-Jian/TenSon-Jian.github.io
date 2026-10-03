export interface ToolMeta {
  id: string
  name: string
  title: string
  description: string
  path: string
  icon: string
  /** 纯前端执行 */
  local: true
  tags?: string[]
}

export const tools: ToolMeta[] = [
  {
    id: 'json',
    name: 'JSON Formatter',
    title: 'JSON 格式化',
    description: '格式化 / 压缩 JSON，并定位语法错误位置。',
    path: '/tools/json',
    icon: 'braces',
    local: true,
    tags: ['format', 'validate'],
  },
  {
    id: 'color',
    name: 'Color Converter',
    title: '颜色转换',
    description: 'HEX / RGB / HSL 互转，附对比度参考。',
    path: '/tools/color',
    icon: 'palette',
    local: true,
    tags: ['hex', 'rgb', 'hsl'],
  },
  {
    id: 'timestamp',
    name: 'Timestamp',
    title: '时间戳转换',
    description: 'Unix 时间戳与可读时间互转，支持毫秒与秒。',
    path: '/tools/timestamp',
    icon: 'clock',
    local: true,
    tags: ['unix', 'date'],
  },
  {
    id: 'markdown',
    name: 'Markdown Preview',
    title: 'Markdown 预览',
    description: '实时渲染 Markdown，支持表格、代码块与引用。',
    path: '/tools/markdown',
    icon: 'file-text',
    local: true,
    tags: ['markdown', 'preview'],
  },
  {
    id: 'uuid',
    name: 'UUID Generator',
    title: 'UUID 生成',
    description: '批量生成 UUID v4，可选大写与去横线。',
    path: '/tools/uuid',
    icon: 'hash',
    local: true,
    tags: ['uuid', 'random'],
  },
  {
    id: 'image',
    name: 'Image Compressor',
    title: '图片压缩',
    description: '浏览器本地压缩与尺寸调整，图片不上传。',
    path: '/tools/image',
    icon: 'image',
    local: true,
    tags: ['canvas', 'compress'],
  },
  {
    id: 'base64',
    name: 'Base64 Encoder',
    title: 'Base64 编解码',
    description: '文本与 Base64 互转，支持 UTF-8 中文。',
    path: '/tools/base64',
    icon: 'link-2',
    local: true,
    tags: ['base64', 'encode'],
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    title: '正则测试',
    description: '实时匹配、分组高亮与替换预览。',
    path: '/tools/regex',
    icon: 'regex',
    local: true,
    tags: ['regex', 'test'],
  },
]

export function findTool(id: string): ToolMeta | undefined {
  return tools.find((tool) => tool.id === id)
}
