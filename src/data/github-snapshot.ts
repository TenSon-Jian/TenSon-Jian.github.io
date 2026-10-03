import rawSnapshot from '@/data/github-snapshot.json'
import type { GithubSnapshot } from '@/types'

/**
 * 构建期快照的访问入口。
 *
 * 快照由 scripts/generate-github-snapshot.mjs 在构建前生成，直接打包进产物，
 * 因此读取它不会产生任何运行时 API 请求 —— 这是绕开 GitHub 未认证配额（60 次/小时）
 * 最彻底的办法，代价是数据只在构建时更新。
 *
 * 文件缺失或结构不合法时 hasSnapshot 为 false，取数流程会照常走网络与内置回退。
 */

/** 快照超过这个时长就认为"太旧"，snapshot 模式下宁可退回网络（30 天） */
export const SNAPSHOT_MAX_AGE = 30 * 24 * 60 * 60 * 1000

function isValid(value: unknown): value is GithubSnapshot {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<GithubSnapshot>
  return (
    typeof candidate.username === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    Array.isArray(candidate.repos) &&
    candidate.repos.length > 0 &&
    Array.isArray(candidate.events) &&
    Boolean(candidate.stats) &&
    typeof candidate.stats?.repositories === 'number'
  )
}

export const snapshot: GithubSnapshot | null = isValid(rawSnapshot) ? rawSnapshot : null

export const hasSnapshot = snapshot !== null

/** 快照生成时刻（毫秒时间戳）；无快照或时间不可解析时为 null */
export const snapshotAt: number | null = (() => {
  if (!snapshot) return null
  const parsed = Date.parse(snapshot.generatedAt)
  return Number.isNaN(parsed) ? null : parsed
})()

/** 快照已生成多久（毫秒）；无快照时为 null */
export function snapshotAge(): number | null {
  return snapshotAt === null ? null : Date.now() - snapshotAt
}
