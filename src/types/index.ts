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

/**
 * 数据来源标记。
 * - network：本次会话从 GitHub API 实时取得
 * - cache：浏览器 localStorage 中的缓存
 * - snapshot：构建时预生成的数据快照（见 scripts/generate-github-snapshot.mjs）
 * - fallback：仓库内置的静态示例数据
 */
export type DataSource = 'network' | 'cache' | 'snapshot' | 'fallback'

/**
 * 构建期快照的结构。
 * 与运行时取到的数据类型保持一致，因此可以直接当作降级数据使用。
 */
export interface GithubSnapshot {
  username: string
  /** 快照生成时刻（ISO 字符串），用于向用户说明数据新鲜度 */
  generatedAt: string
  stats: GithubStats
  repos: GithubRepo[]
  events: GithubEvent[]
}

/**
 * 降级原因的结构化描述。
 * `source` 只说「数据从哪来」，这里补充「为什么没能走 network」——
 * 403 限流与超时都需要完全不同的处置，不能共用一句文案。
 */
export interface GithubErrorInfo {
  message: string
  /** HTTP 状态码；网络层失败（超时 / 被拦截）时为 undefined */
  status?: number
  /** 据此判断是否属于配额问题，需要等待而非重试 */
  rateLimited?: boolean
  /** 可重试的最早时刻（毫秒时间戳），来自 Retry-After 或 X-RateLimit-Reset */
  retryAfter?: number
  /** 响应头 x-ratelimit-remaining 的原值，仅用于诊断展示 */
  rateLimitRemaining?: string
  /** 响应头 x-ratelimit-limit 的原值，0 配额说明当前按未认证配额计算 */
  rateLimitLimit?: string
  /** 本次请求是否携带了 Authorization，用于区分「凭据问题」与「配额问题」 */
  hasToken?: boolean
}
