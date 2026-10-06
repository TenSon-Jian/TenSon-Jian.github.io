// ─────────────────────────────────────────────
// 统一数据结构（对应规范第 30 节）
// ─────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  slug: string
  description: string
  /** 主要语言，用于列表中的小型标识 */
  language?: string
  technologies: string[]
  repositoryUrl: string
  demoUrl?: string
  cover?: string
  featured?: boolean
  /** 详情页补充内容 */
  type?: string
  period?: string
  overview?: string
  highlights?: string[]
  features?: ProjectFeature[]
  architecture?: ArchitectureSpec
}

export interface ProjectFeature {
  no: string
  title: string
  summary: string
}

export interface ArchitectureSpec {
  layers: ArchitectureLayer[]
}

export interface ArchitectureLayer {
  id: string
  label: string
  /** 节点类型决定视觉表现 */
  kind?: 'client' | 'api' | 'service' | 'data'
  nodes: ArchitectureNode[]
}

export interface ArchitectureNode {
  id: string
  label: string
  /** 关系描述，Hover 时高亮链路 */
  connectsTo?: string[]
  meta?: string
}

export interface Note {
  id: string
  slug: string
  title: string
  summary: string
  date: string
  category: string
  tags?: string[]
  cover?: string
  content: string
  readingMinutes?: number
}

