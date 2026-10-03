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
  stars?: number
  forks?: number
  updatedAt?: string
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

// ── GitHub ──

export interface GithubProfile {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  html_url: string
  public_repos: number
  followers: number
  following: number
}

export interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  topics?: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  fork: boolean
  archived: boolean
  size: number
}

export interface GithubStats {
  repositories: number
  stars: number
  followers: number
  following: number
}

export interface GithubEvent {
  id: string
  type: string
  repo: string
  createdAt: string
  summary: string
}

/** 数据来源标记：用于 UI 提示「离线数据」 */
export type DataSource = 'network' | 'cache' | 'fallback'
