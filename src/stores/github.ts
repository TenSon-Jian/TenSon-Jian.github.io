import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { githubService } from '@/services/github'
import type { DataSource, GithubEvent, GithubProfile, GithubRepo, GithubStats } from '@/types'

/**
 * GitHub 数据仓库：页面只读这里的状态，不直接调用 API。
 * 状态区分 loading / error / empty / ready，并保留数据来源用于提示。
 */
export const useGithubStore = defineStore('github', () => {
  const profile = ref<GithubProfile | null>(null)
  const repos = ref<GithubRepo[]>([])
  const stats = ref<GithubStats | null>(null)
  const events = ref<GithubEvent[]>([])

  const statsSource = ref<DataSource>('fallback')
  const reposSource = ref<DataSource>('fallback')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<number | null>(null)
  const loaded = ref(false)

  /** 数据是否来自非网络来源（缓存或内置回退） */
  const isDegraded = computed(() => statsSource.value !== 'network' || reposSource.value !== 'network')

  const isEmpty = computed(() => !loading.value && repos.value.length === 0)

  async function loadStats() {
    loading.value = true
    try {
      const [statsPayload, profilePayload] = await Promise.all([
        githubService.getStats(),
        githubService.getProfile(),
      ])
      stats.value = statsPayload.data
      statsSource.value = statsPayload.source
      profile.value = profilePayload.data
      error.value = statsPayload.error ?? null
      lastUpdated.value = statsPayload.cachedAt
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'GitHub 数据加载失败'
    } finally {
      loading.value = false
    }
  }

  async function loadRepos() {
    loading.value = true
    try {
      const payload = await githubService.getRepositories()
      repos.value = payload.data
      reposSource.value = payload.source
      error.value = payload.error ?? null
      lastUpdated.value = payload.cachedAt
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'GitHub 仓库加载失败'
      repos.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadEvents() {
    try {
      const payload = await githubService.getEvents()
      events.value = payload.data
    } catch {
      events.value = []
    }
  }

  /** 首页 / 项目页进入时调用，已加载过则不再重复请求 */
  async function ensureLoaded(options: { withEvents?: boolean } = {}) {
    if (loaded.value || loading.value) return
    loaded.value = true
    await Promise.all([loadStats(), loadRepos()])
    if (options.withEvents) await loadEvents()
  }

  async function refresh() {
    loaded.value = false
    error.value = null
    await ensureLoaded({ withEvents: true })
  }

  return {
    profile,
    repos,
    stats,
    events,
    statsSource,
    reposSource,
    loading,
    error,
    loaded,
    lastUpdated,
    isDegraded,
    isEmpty,
    ensureLoaded,
    loadStats,
    loadRepos,
    loadEvents,
    refresh,
  }
})
