import { siteConfig } from '@/config/site'
import { fallbackProfile, fallbackRepos, fallbackStats } from '@/data/fallback'
import type { DataSource, GithubEvent, GithubProfile, GithubRepo, GithubStats } from '@/types'

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
  /** 缓存写入时间 */
  cachedAt: number
  /** 网络请求失败时的错误信息 */
  error?: string
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

// ── 网络请求 ──

class GithubRequestError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'GithubRequestError'
    this.status = status
  }
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
      const hint =
        response.status === 403
          ? 'GitHub API 访问受限（速率限制或网络策略拦截）'
          : response.status === 404
            ? 'GitHub 资源不存在'
            : `GitHub API 返回 ${response.status}`
      throw new GithubRequestError(hint, response.status)
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

/**
 * 通用取数流程：新鲜缓存 → 网络 → 陈旧缓存 → 内置回退数据
 */
async function resolveWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallback: T,
  validate?: (data: T) => boolean,
): Promise<CachedPayload<T>> {
  const cached = readCache<T>(key)
  const isValid = (value: T) => (validate ? validate(value) : true)

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
    const message = error instanceof Error ? error.message : '未知错误'

    if (cached && isValid(cached.data) && cacheAge(cached) < STALE_TTL) {
      return { data: cached.data, source: 'cache', cachedAt: cached.cachedAt, error: message }
    }

    return { data: fallback, source: 'fallback', cachedAt: Date.now(), error: message }
  }
}

// ── 对外接口 ──

export function getProfile(): Promise<CachedPayload<GithubProfile>> {
  return resolveWithCache<GithubProfile>(
    `profile:${username}`,
    () => request<GithubProfile>(`/users/${username}`),
    fallbackProfile,
    (data) => Boolean(data && data.login),
  )
}

export function getRepositories(): Promise<CachedPayload<GithubRepo[]>> {
  return resolveWithCache<GithubRepo[]>(
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
  )
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

export function getStats(): Promise<CachedPayload<GithubStats>> {
  const fallback: GithubStats = fallbackStats

  return resolveWithCache<GithubStats>(
    `stats:${username}`,
    async () => {
      const [profile, repos] = await Promise.all([
        request<GithubProfile>(`/users/${username}`),
        request<GithubRepo[]>(`/users/${username}/repos?per_page=100&type=owner`),
      ])
      return {
        repositories: profile.public_repos,
        stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        followers: profile.followers,
        following: profile.following,
      }
    },
    fallback,
  )
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
    (data) => Array.isArray(data),
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
