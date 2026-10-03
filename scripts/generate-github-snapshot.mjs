#!/usr/bin/env node
/**
 * 构建期 GitHub 数据快照生成器。
 *
 * 背景：未认证的 GitHub API 只有 60 次/小时，而且配额按出口 IP 计算 ——
 * 代理 / 公司网关的共享出口经常是 0，站点实时取数必然失败。
 * 这个脚本在构建前把数据抓下来写进 src/data/github-snapshot.json，
 * 产物里带的是一份静态数据，运行时零 API 请求，配额问题从架构上消失。
 *
 * 用法：
 *   node scripts/generate-github-snapshot.mjs             # 抓取并写入
 *   node scripts/generate-github-snapshot.mjs --force     # 已有可用快照时也重新抓取
 *   node scripts/generate-github-snapshot.mjs --max-wait=120   # 允许等配额重置最多 120 秒
 *
 * 环境变量（可写在 .env 里，本脚本会自行加载）：
 *   VITE_GITHUB_USERNAME  目标账号，默认取 .env 中的值
 *   GITHUB_TOKEN / VITE_GITHUB_TOKEN  可选；有 token 时配额 5000 次/小时且请求不计费
 *
 * 退出码：0 表示快照可用（新抓取成功，或沿用既有快照）；1 表示抓取失败且无既有快照。
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API_BASE = 'https://api.github.com'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = path.join(ROOT, 'src', 'data', 'github-snapshot.json')
const REQUEST_TIMEOUT = 15000

// ── 环境变量 ──

/** 加载 .env（Node 20.12+ 自带；缺失时静默跳过，交给外部环境变量） */
function loadEnvFile() {
  try {
    process.loadEnvFile(path.join(ROOT, '.env'))
  } catch {
    /* 没有 .env 文件是正常情况 */
  }
}

function parseArgs(argv) {
  const force = argv.includes('--force')
  const maxWaitArg = argv.find((arg) => arg.startsWith('--max-wait='))
  const maxWait = maxWaitArg ? Number(maxWaitArg.split('=')[1]) : 15
  return {
    force,
    maxWait: Number.isFinite(maxWait) && maxWait >= 0 ? maxWait : 15,
  }
}

// ── 网络 ──

function authHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || ''
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ajian-blog-snapshot',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function fetchOnce(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { headers: authHeaders(), signal: controller.signal })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return { ok: false, status: response.status, headers: response.headers, body: body.slice(0, 300) }
    }
    return { ok: true, data: await response.json() }
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) }
  } finally {
    clearTimeout(timer)
  }
}

/** 配额耗尽时按 x-ratelimit-reset 等待后重试一次；等待过久则直接放弃 */
async function requestJson(url, maxWait) {
  let result = await fetchOnce(url)

  if (!result.ok && result.status === 403) {
    const remaining = result.headers?.get('x-ratelimit-remaining')
    const reset = Number(result.headers?.get('x-ratelimit-reset'))
    const waitMs = Number.isFinite(reset) ? reset * 1000 - Date.now() : Infinity

    if (remaining === '0' && waitMs > 0 && waitMs <= maxWait * 1000) {
      console.warn(`  配额已耗尽，等待 ${Math.ceil(waitMs / 1000)} 秒后重试…`)
      await new Promise((resolve) => setTimeout(resolve, waitMs + 1000))
      result = await fetchOnce(url)
    }
  }

  if (!result.ok) {
    const detail = result.status
      ? `HTTP ${result.status}${result.body ? ` — ${result.body.replace(/\s+/g, ' ')}` : ''}`
      : result.error
    throw new Error(`${url} 请求失败：${detail}`)
  }

  return result.data
}

// ── 数据加工（与 src/services/github.ts 的口径保持一致）──

function sortRepos(repos) {
  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        +new Date(b.pushed_at) - +new Date(a.pushed_at),
    )
}

function summarizeEvent(event) {
  switch (event.type) {
    case 'PushEvent': {
      const size = event.payload?.size ?? event.payload?.commits?.length ?? 0
      const ref = event.payload?.ref?.replace('refs/heads/', '') ?? 'main'
      return `Pushed ${size} commit${size === 1 ? '' : 's'} to ${ref}`
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

function mapEvents(events) {
  return events.slice(0, 8).map((event, index) => ({
    id: String(event.id ?? index),
    type: String(event.type ?? 'Event'),
    repo: String(event.repo?.name ?? ''),
    createdAt: String(event.created_at ?? ''),
    summary: summarizeEvent(event),
  }))
}

/** 快照里的仓库只保留站点真正用到的字段，避免把整个 GitHub 响应塞进产物 */
function slimRepo(repo) {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description ?? null,
    html_url: repo.html_url,
    homepage: repo.homepage ?? null,
    language: repo.language ?? null,
    stargazers_count: repo.stargazers_count ?? 0,
    forks_count: repo.forks_count ?? 0,
    watchers_count: repo.watchers_count ?? 0,
    topics: repo.topics ?? [],
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
    size: repo.size ?? 0,
  }
}

// ── 主流程 ──

async function readExisting() {
  try {
    const raw = await readFile(OUTPUT, 'utf8')
    const parsed = JSON.parse(raw)
    const usable =
      parsed &&
      Array.isArray(parsed.repos) &&
      parsed.repos.length > 0 &&
      typeof parsed.generatedAt === 'string' &&
      parsed.generatedAt !== ''
    return usable ? parsed : null
  } catch {
    return null
  }
}

async function main() {
  loadEnvFile()
  const { force, maxWait } = parseArgs(process.argv.slice(2))
  const username = process.env.VITE_GITHUB_USERNAME || 'ajian'

  const existing = await readExisting()
  if (existing && !force) {
    console.log(`[snapshot] 已存在可用快照（${existing.generatedAt}，${existing.repos.length} 个仓库），跳过抓取。`)
    console.log('[snapshot] 需要刷新请加 --force。')
    return
  }

  console.log(`[snapshot] 抓取 GitHub 数据：${username}`)
  console.log(`[snapshot] 认证方式：${process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN ? 'token' : '未认证（60 次/小时）'}`)

  try {
    const profile = await requestJson(`${API_BASE}/users/${username}`, maxWait)
    const rawRepos = await requestJson(
      `${API_BASE}/users/${username}/repos?per_page=100&sort=updated&type=owner`,
      maxWait,
    )
    const repos = sortRepos(rawRepos).map(slimRepo)

    if (repos.length === 0) {
      throw new Error(
        `账号 ${username} 没有公开仓库；快照会退化成空列表，已放弃写入（保留现有数据）。`,
      )
    }

    // 事件是次要数据，抓不到不算失败
    let events = []
    try {
      const rawEvents = await requestJson(`${API_BASE}/users/${username}/events/public?per_page=30`, maxWait)
      events = mapEvents(rawEvents)
    } catch (error) {
      console.warn(`[snapshot] 事件数据抓取失败，已留空：${error.message}`)
    }

    const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const snapshot = {
      username,
      generatedAt: new Date().toISOString(),
      stats: {
        // 必须用 /users/{user} 的公开计数：仓库列表接口的 owner 对象并不包含这些字段
        repositories: profile.public_repos ?? repos.length,
        stars,
        followers: profile.followers ?? 0,
        following: profile.following ?? 0,
      },
      repos,
      events,
    }

    await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
    console.log(
      `[snapshot] 已写入 ${path.relative(ROOT, OUTPUT)}：` +
        `${snapshot.stats.repositories} 个仓库 / ${stars} stars / ${events.length} 条活动`,
    )
  } catch (error) {
    const fallbackExists = await readExisting()
    if (fallbackExists) {
      console.warn(`[snapshot] 抓取失败，沿用既有快照（${fallbackExists.generatedAt}）：${error.message}`)
      return
    }
    console.warn(`[snapshot] 抓取失败且没有既有快照：${error.message}`)
    console.warn('[snapshot] 站点将退回内置回退数据。配置 GITHUB_TOKEN 可显著提高成功率。')
    process.exitCode = 1
  }
}

main()
