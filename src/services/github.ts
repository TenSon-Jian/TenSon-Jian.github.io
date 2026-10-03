import { siteConfig } from '@/config/site'
import { fallbackProfile, fallbackRepos } from '@/data/fallback'
import { SNAPSHOT_MAX_AGE, hasSnapshot, snapshot, snapshotAge, snapshotAt } from '@/data/github-snapshot'
import type {
  DataSource,
  GithubErrorInfo,
  GithubEvent,
  GithubProfile,
  GithubRepo,
  GithubSnapshot,
  GithubStats,
} from '@/types'

/**
 * githubService —— 全站唯一访问 GitHub 的地方。
 *
 * 架构：GitHub API → Service Layer（本文件） → Local Cache → Frontend
 *
 * 设计目标：
 *  - 不在页面里散落 fetch 调用
 *  - 缓存优先，避免每次进入网站就大量请求 GitHub API
 *  - 任何失败（网络被拦截 / 403 速率限制 / 超时）都回退到缓存或内置数据
 *  - 明确区分 loading / error / empty，交由 UI 呈现 skeleton 与提示
 *
 * ⚠️ 配额预算：未认证时 GitHub 只给 60 次/小时（按出口 IP 计算，代理/公司网关下与他人共享）。
 * 当前各页面的请求次数：
 *  - 首页：2 次（仓库列表 1 次 + 事件 1 次；统计数字由仓库列表内联的 owner 字段推导）
 *  - 项目详情页：2 次（仓库详情 + README）
 * 参考：认证后提升到 5000 次/小时，见 VITE_GITHUB_TOKEN。
 */

const API_BASE = 'https://api.github.com'
const CACHE_PREFIX = 'ajian-gh:'
const FRESH_TTL = 30 * 60 * 1000 // 30 分钟内直接使用缓存
const STALE_TTL = 24 * 60 * 60 * 1000 // 24 小时内可作为降级数据
const REQUEST_TIMEOUT = 8000

const username = siteConfig.githubUsername

export interface CachedPayload<T> {
  data: T
  source: DataSource
  /** 缓存写入时间；快照与内置回退时为快照生成时间 / 当前时间 */
  cachedAt: number
  /** 网络请求失败时的错误信息（等价于 errorInfo.message，保留旧用法） */
  error?: string
  /** 结构化的失败原因：状态码 / 是否限流 / 何时可以重试 */
  errorInfo?: GithubErrorInfo
  /** 降级数据下建议的重新请求时刻（毫秒时间戳） */
  retryAfter?: number
  /** 当 source 为 snapshot 时，快照的生成时刻 */
  snapshotAt?: number
}

interface CacheEntry<T> {
  data: T
  cachedAt: number
}

// ── 缓存读写 ──

function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (!parsed || typeof parsed.cachedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* 隐私模式或超出配额：忽略缓存失败 */
  }
}

function cacheAge(entry: CacheEntry<unknown>): number {
  return Date.now() - entry.cachedAt
}

// ── 取数策略 ──

/**
 * 构建期快照的使用策略：
 *  - auto（默认）：有快照就直接用，不再打 API —— 未认证配额只有 60 次/小时，
 *    站点默认行为不该依赖它。想强制拿实时数据用 live。
 *  - live：忽略快照，总是走网络（失败后仍会退回陈旧缓存 / 快照 / 内置数据）。
 *  - snapshot：只用快照，零 API 请求；快照缺失或过旧时退回内置数据。
 */
const FETCH_MODE = (import.meta.env.VITE_GITHUB_MODE ?? 'auto').toLowerCase()

// ── 网络请求 ──

class GithubRequestError extends Error {
  status: number
  /** 可重试时刻，来自 Retry-After 或 X-RateLimit-Reset */
  retryAfter?: number
  /** GitHub 判定为超出配额（含二级限流） */
  rateLimited?: boolean
  /** 响应头原值，作为诊断证据保留 */
  rateLimitRemaining?: string
  rateLimitLimit?: string
  /** 本次请求是否携带 Authorization */
  hasToken?: boolean

  constructor(
    message: string,
    status = 0,
    options: {
      retryAfter?: number
      rateLimited?: boolean
      rateLimitRemaining?: string
      rateLimitLimit?: string
      hasToken?: boolean
    } = {},
  ) {
    super(message)
    this.name = 'GithubRequestError'
    this.status = status
    this.retryAfter = options.retryAfter
    this.rateLimited = options.rateLimited
    this.rateLimitRemaining = options.rateLimitRemaining
    this.rateLimitLimit = options.rateLimitLimit
    this.hasToken = options.hasToken
  }
}

/**
 * 解析重试时间提示。
 * - Retry-After 可能是秒数，也可能是 HTTP 日期
 * - X-RateLimit-Reset 是 UTC epoch 秒
 * 结果夹在 [1 秒, 1 小时] 内，避免异常值让倒计时失控。
 */
function parseRetryAfter(headers: Headers): number | undefined {
  const MAX_DELAY = 60 * 60 * 1000
  const now = Date.now()

  const retryAfter = headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds) && seconds > 0) {
      return now + Math.min(seconds * 1000, MAX_DELAY)
    }
    const date = Date.parse(retryAfter)
    if (!Number.isNaN(date)) return Math.min(date, now + MAX_DELAY)
  }

  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')
  if (remaining === '0' && reset) {
    const resetAt = Number(reset) * 1000
    if (Number.isFinite(resetAt) && resetAt > now) return Math.min(resetAt, now + MAX_DELAY)
  }

  return undefined
}

/**
 * 配额耗尽与二级限流都返回 403/429，但处置方式与「凭据无效 / 权限不足」完全不同。
 * 依据官方文档取可靠信号：429、x-ratelimit-remaining: 0、或存在 retry-after。
 */
function isRateLimited(status: number, headers: Headers): boolean {
  if (status === 429) return true
  if (status !== 403) return false
  return headers.get('x-ratelimit-remaining') === '0' || Boolean(headers.get('retry-after'))
}

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (siteConfig.githubToken) {
    headers.Authorization = `Bearer ${siteConfig.githubToken}`
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const limited = isRateLimited(response.status, response.headers)
      const retryAfter = limited ? parseRetryAfter(response.headers) : undefined

      const hint =
        response.status === 403 || response.status === 429
          ? limited
            ? 'GitHub API 配额已用尽（速率限制），请稍后重试'
            : 'GitHub API 拒绝了请求：凭据无效或权限不足（403）'
          : response.status === 401
            ? 'GitHub API 认证失败：VITE_GITHUB_TOKEN 无效或已过期'
            : response.status === 404
              ? 'GitHub 资源不存在'
              : `GitHub API 返回 ${response.status}`

      throw new GithubRequestError(hint, response.status, {
        retryAfter,
        rateLimited: limited,
        rateLimitRemaining: response.headers.get('x-ratelimit-remaining') ?? undefined,
        rateLimitLimit: response.headers.get('x-ratelimit-limit') ?? undefined,
        hasToken: Boolean(siteConfig.githubToken),
      })
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof GithubRequestError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GithubRequestError('GitHub API 请求超时')
    }
    throw new GithubRequestError('无法连接 GitHub API')
  } finally {
    clearTimeout(timer)
  }
}

/** 把任意异常整理成可上屏的失败描述，同时保留是否限流与重试时刻 */
function describeFailure(error: unknown): GithubErrorInfo {
  if (error instanceof GithubRequestError) {
    return {
      message: error.message,
      status: error.status || undefined,
      rateLimited: error.rateLimited,
      retryAfter: error.retryAfter,
      rateLimitRemaining: error.rateLimitRemaining,
      rateLimitLimit: error.rateLimitLimit,
      hasToken: error.hasToken,
    }
  }
  return { message: error instanceof Error ? error.message : '未知错误' }
}

/**
 * 开发态诊断日志：把 GitHub 的响应头原样打出来。
 * 403 有两种完全不同的成因（配额耗尽 vs 凭据无效/权限不足），只看状态码无法区分；
 * x-ratelimit-remaining 与是否携带 Authorization 是决定性证据。
 * 生产构建中 import.meta.env.DEV 会被静态替换，这段随之被移除。
 */
function reportDegraded(path: string, info: GithubErrorInfo, retryAfter?: number): void {
  if (!import.meta.env.DEV) return

  console.warn(
    `[github] ${path} 降级为离线数据\n` +
      `  HTTP 状态：${info.status ?? '网络层失败（无响应状态）'}\n` +
      `  判定为配额问题：${info.rateLimited ? '是' : '否'}\n` +
      `  携带 Authorization：${info.hasToken ? '是（VITE_GITHUB_TOKEN 非空）' : '否（未配置 token，按 60 次/小时计算）'}\n` +
      `  x-ratelimit-remaining：${info.rateLimitRemaining ?? '响应头未暴露（可能未通过 CORS 白名单）'}\n` +
      `  x-ratelimit-limit：${info.rateLimitLimit ?? '未暴露'}\n` +
      `  建议可重试时刻：${retryAfter ? new Date(retryAfter).toLocaleTimeString() : '未提供'}\n` +
      `  原因：${info.message}`,
  )
}

/**
 * 通用取数流程。
 *
 * auto 模式：快照 → 新鲜缓存 → 网络 → 陈旧缓存 → 内置回退
 * live 模式：新鲜缓存 → 网络 → 陈旧缓存 → 快照 → 内置回退
 * snapshot 模式：快照 → 内置回退（完全不发请求）
 *
 * `snapshotFallback` 让每个端点能挂上快照里对应的那份数据。
 */
async function resolveWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallback: T,
  validate?: (data: T) => boolean,
  snapshotFallback?: unknown,
): Promise<CachedPayload<T>> {
  const cached = readCache<T>(key)
  const isValid = (value: T) => (validate ? validate(value) : true)

  // auto 模式：只要快照存在就直接采用，把配额消耗降为零
  if (FETCH_MODE === 'auto' && hasSnapshot) {
    return fromSnapshotOrFallback(key, fallback, validate, snapshotFallback)
  }

  if (FETCH_MODE === 'snapshot') {
    return fromSnapshotOrFallback(key, fallback, validate, snapshotFallback)
  }

  if (cached && isValid(cached.data) && cacheAge(cached) < FRESH_TTL) {
    return { data: cached.data, source: 'cache', cachedAt: cached.cachedAt }
  }

  try {
    const fresh = await fetcher()
    if (isValid(fresh)) {
      writeCache(key, fresh)
      return { data: fresh, source: 'network', cachedAt: Date.now() }
    }
    throw new GithubRequestError('GitHub 返回了空数据')
  } catch (error) {
    const errorInfo = describeFailure(error)

    // 降级顺序：快照 → 陈旧缓存 → 内置回退。
    // 快照通常比 24 小时前的缓存更有参考价值，且能让界面说明数据的确切时间。
    if (hasSnapshot && snapshot) {
      const data = pickFromSnapshot<T>(snapshot, key, validate, snapshotFallback)
      if (data !== undefined) {
        reportDegraded(`构建快照 · ${key}`, errorInfo, errorInfo.retryAfter)
        return {
          data,
          source: 'snapshot',
          cachedAt: snapshotAt ?? Date.now(),
          snapshotAt: snapshotAt ?? undefined,
          error: errorInfo.message,
          errorInfo,
          retryAfter: errorInfo.retryAfter,
        }
      }
    }

    if (cached && isValid(cached.data) && cacheAge(cached) < STALE_TTL) {
      reportDegraded(`陈旧缓存 · ${key}`, errorInfo, errorInfo.retryAfter)
      return {
        data: cached.data,
        source: 'cache',
        cachedAt: cached.cachedAt,
        error: errorInfo.message,
        errorInfo,
        retryAfter: errorInfo.retryAfter,
      }
    }

    reportDegraded(`内置回退 · ${key}`, errorInfo, errorInfo.retryAfter)
    return {
      data: fallback,
      source: 'fallback',
      cachedAt: Date.now(),
      error: errorInfo.message,
      errorInfo,
      retryAfter: errorInfo.retryAfter,
    }
  }
}

/**
 * 从快照里挑出这个端点对应的数据。
 * 返回 undefined 表示快照里没有可用数据（例如 events 抓取失败时为空数组），
 * 调用方会继续往下一级降级。
 */
function pickFromSnapshot<T>(
  source: GithubSnapshot,
  key: string,
  validate: ((data: T) => boolean) | undefined,
  snapshotFallback: unknown,
): T | undefined {
  // 按 key 前缀判断端点，避免在调用处到处传 lambda
  const byKey: Record<string, unknown> = {
    repos: source.repos,
    stats: source.stats,
    events: source.events,
  }
  const endpoint = key.split(':')[0]
  const candidate = (snapshotFallback ?? byKey[endpoint]) as T | undefined
  if (candidate === undefined) return undefined
  if (validate && !validate(candidate)) return undefined
  return candidate
}

/** auto / snapshot 模式下的取数：快照 → 内置回退，全程不发请求 */
function fromSnapshotOrFallback<T>(
  key: string,
  fallback: T,
  validate: ((data: T) => boolean) | undefined,
  snapshotFallback: unknown,
): CachedPayload<T> {
  const age = snapshotAge()

  if (hasSnapshot && snapshot && (age === null || age <= SNAPSHOT_MAX_AGE)) {
    const data = pickFromSnapshot<T>(snapshot, key, validate, snapshotFallback)
    if (data !== undefined) {
      return {
        data,
        source: 'snapshot',
        cachedAt: snapshotAt ?? Date.now(),
        snapshotAt: snapshotAt ?? undefined,
      }
    }
  }

  if (import.meta.env.DEV) {
    console.info(
      `[github] 快照模式下 ${key} 没有可用快照（${
        hasSnapshot ? '快照内容不匹配或已超过 30 天' : '快照文件不存在或缺 username/generatedAt/repos'
      }），已退回内置回退数据。`,
    )
  }

  return { data: fallback, source: 'fallback', cachedAt: Date.now() }
}

// ── 对外接口 ──

/**
 * 个人资料（头像 / bio / blog 等展示用字段）。
 * 注意：为了避免浪费未认证配额，首页加载流程**不再**调用它 ——
 * 统计数字已改由仓库列表内联的 owner 字段推导，见 getStats()。
 */
export function getProfile(): Promise<CachedPayload<GithubProfile>> {
  return resolveWithCache<GithubProfile>(
    `profile:${username}`,
    () => request<GithubProfile>(`/users/${username}`),
    fallbackProfile,
    (data) => Boolean(data && data.login),
  )
}

let repositoriesInflight: Promise<CachedPayload<GithubRepo[]>> | null = null

/**
 * 仓库列表取数，并做「同一时刻只发一次请求」的去重。
 * `ensureLoaded()` 会让 getStats() 与 getRepositories() 并发执行，
 * 两者都需要仓库数组；去重后一次页面加载只消耗 1 次配额，而不是 2 次。
 */
function resolveRepositories(): Promise<CachedPayload<GithubRepo[]>> {
  if (repositoriesInflight) return repositoriesInflight

  repositoriesInflight = resolveWithCache<GithubRepo[]>(
    `repos:${username}`,
    async () => {
      const repos = await request<GithubRepo[]>(
        `/users/${username}/repos?per_page=100&sort=updated&type=owner`,
      )
      return repos
        .filter((repo) => !repo.fork && !repo.archived)
        .sort((a, b) => b.stargazers_count - a.stargazers_count || +new Date(b.pushed_at) - +new Date(a.pushed_at))
    },
    fallbackRepos,
    (data) => Array.isArray(data) && data.length > 0,
    // 快照里的仓库列表结构完全一致，可以直接作为降级数据
    snapshot?.repos,
  ).finally(() => {
    repositoriesInflight = null
  })

  return repositoriesInflight
}

export function getRepositories(): Promise<CachedPayload<GithubRepo[]>> {
  return resolveRepositories()
}

export function getRepository(name: string): Promise<CachedPayload<GithubRepo | null>> {
  const fallback = fallbackRepos.find((repo) => repo.name.toLowerCase() === name.toLowerCase()) ?? null
  return resolveWithCache<GithubRepo | null>(
    `repo:${username}:${name}`,
    () => request<GithubRepo>(`/repos/${username}/${name}`),
    fallback,
  )
}

export async function getRepositoryReadme(name: string): Promise<CachedPayload<string>> {
  return resolveWithCache<string>(
    `readme:${username}:${name}`,
    async () => {
      const data = await request<{ content?: string; encoding?: string }>(
        `/repos/${username}/${name}/readme`,
      )
      if (!data?.content) return ''
      // GitHub 返回 base64，需要按 UTF-8 解码
      const binary = atob(data.content.replace(/\n/g, ''))
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      return new TextDecoder('utf-8').decode(bytes)
    },
    '',
  )
}

export async function getRepositoryLanguages(name: string): Promise<CachedPayload<Record<string, number>>> {
  return resolveWithCache<Record<string, number>>(
    `langs:${username}:${name}`,
    () => request<Record<string, number>>(`/repos/${username}/${name}/languages`),
    {},
  )
}

export async function getRepositoryReleases(
  name: string,
): Promise<CachedPayload<Array<{ tag_name: string; name: string; published_at: string }>>> {
  return resolveWithCache(
    `releases:${username}:${name}`,
    () => request<Array<{ tag_name: string; name: string; published_at: string }>>(
      `/repos/${username}/${name}/releases?per_page=5`,
    ),
    [],
  )
}

/**
 * 站点统计。
 *
 * 口径说明（容易搞错，别再走弯路）：
 * `/users/{user}/repos` 返回的**只**包含仓库数据，里面的 `owner` 对象只有 login / id /
 * avatar_url 等标识字段，**没有** public_repos / followers / following。
 * 这三个计数必须来自 `/users/{user}`，或来自快照的 stats。
 *
 * 优化点不在"省掉 profile 请求"，而在别处：
 *  - 仓库列表请求做了在途去重，stats 与 repos 共用同一份结果
 *  - 统计值本身优先读快照（auto/snapshot 模式下运行时零请求）
 *  - profile 请求与仓库请求并发，且失败原因会一并反映到 source 上
 */
export function getStats(): Promise<CachedPayload<GithubStats>> {
  return resolveStatsFromRepos()
}

async function resolveStatsFromRepos(): Promise<CachedPayload<GithubStats>> {
  const [profileResult, reposPayload] = await Promise.all([
    getProfile(),
    resolveRepositories(),
  ])

  const stats: GithubStats = {
    repositories: profileResult.data.public_repos,
    stars: reposPayload.data.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    followers: profileResult.data.followers,
    following: profileResult.data.following,
  }

  // 两个请求里只要有一个没走成网络，整体就算降级：不能拿半真半假的数据冒充实时
  const degraded = profileResult.source !== 'network' || reposPayload.source !== 'network'
  const worst = profileResult.source === 'fallback' || reposPayload.source === 'fallback'
    ? 'fallback'
    : profileResult.source === 'snapshot' || reposPayload.source === 'snapshot'
      ? 'snapshot'
      : 'cache'

  return {
    data: stats,
    source: degraded ? worst : 'network',
    cachedAt: Math.max(profileResult.cachedAt, reposPayload.cachedAt),
    error: profileResult.error ?? reposPayload.error,
    errorInfo: profileResult.errorInfo ?? reposPayload.errorInfo,
    retryAfter: profileResult.retryAfter ?? reposPayload.retryAfter,
    snapshotAt: profileResult.snapshotAt ?? reposPayload.snapshotAt,
  }
}

export function getEvents(limit = 8): Promise<CachedPayload<GithubEvent[]>> {
  const fallback: GithubEvent[] = [
    {
      id: 'f1',
      type: 'PushEvent',
      repo: 'ajian/RMS',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      summary: 'Pushed to main',
    },
    {
      id: 'f2',
      type: 'CreateEvent',
      repo: 'ajian/ajian-blog',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      summary: 'Created repository',
    },
  ]

  return resolveWithCache<GithubEvent[]>(
    `events:${username}`,
    async () => {
      const events = await request<Array<Record<string, any>>>(`/users/${username}/events/public?per_page=30`)
      return events.slice(0, limit).map((event, index) => ({
        id: String(event.id ?? index),
        type: String(event.type ?? 'Event'),
        repo: String(event.repo?.name ?? ''),
        createdAt: String(event.created_at ?? ''),
        summary: summarizeEvent(event),
      }))
    },
    fallback,
    (data) => Array.isArray(data) && data.length > 0,
    snapshot?.events,
  )
}

function summarizeEvent(event: Record<string, any>): string {
  switch (event.type) {
    case 'PushEvent': {
      const size = event.payload?.size ?? event.payload?.commits?.length ?? 0
      return `Pushed ${size} commit${size === 1 ? '' : 's'} to ${event.payload?.ref?.replace('refs/heads/', '') ?? 'main'}`
    }
    case 'CreateEvent':
      return `Created ${event.payload?.ref_type ?? 'repository'}`
    case 'WatchEvent':
      return 'Starred a repository'
    case 'ForkEvent':
      return 'Forked a repository'
    case 'IssuesEvent':
      return `${event.payload?.action ?? 'Updated'} an issue`
    case 'PullRequestEvent':
      return `${event.payload?.action ?? 'Updated'} a pull request`
    default:
      return String(event.type ?? 'Activity').replace('Event', '')
  }
}

export const githubService = {
  getProfile,
  getRepositories,
  getRepository,
  getRepositoryReadme,
  getRepositoryLanguages,
  getRepositoryReleases,
  getStats,
  getEvents,
}
