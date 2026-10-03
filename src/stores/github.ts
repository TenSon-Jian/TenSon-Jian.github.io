import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { githubService } from '@/services/github'
import type { CachedPayload } from '@/services/github'
import type {
  DataSource,
  GithubErrorInfo,
  GithubEvent,
  GithubProfile,
  GithubRepo,
  GithubStats,
} from '@/types'

/**
 * GitHub 数据仓库：页面只读这里的状态，不直接调用 API。
 * 状态区分 loading / error / empty / ready，并保留数据来源用于提示。
 *
 * 降级时除了「数据从哪来」还保留「为什么失败」：
 * 限流（403/429）需要等待并停止请求，凭据错误或超时则可以立即重试。
 */
export const useGithubStore = defineStore('github', () => {
  /**
   * GitHub 个人资料。
   * 注意：为了节省未认证的 60 次/小时配额，`ensureLoaded()` 不再自动抓取它，
   * 因此这个字段通常会保持 null。需要时请显式调用 `githubService.getProfile()`。
   */
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

  /** 结构化失败原因（状态码 / 是否限流 / 何时可重试） */
  const errorInfo = ref<GithubErrorInfo | null>(null)
  /** 冷却截止时刻：此刻之前不再向 GitHub 发请求 */
  const retryAfter = ref<number | null>(null)
  /** 倒计时剩余秒数，仅用于界面展示 */
  const cooldownRemaining = ref(0)
  /** 当来源是构建快照时，快照的生成时刻 */
  const snapshotAt = ref<number | null>(null)

  let cooldownTimer: ReturnType<typeof setInterval> | null = null

  /** 并发计数器：stats 与 repos 同时加载时不会互相提前关掉 loading */
  let pendingRequests = 0

  function beginRequest() {
    pendingRequests += 1
    loading.value = true
  }

  function endRequest() {
    pendingRequests = Math.max(0, pendingRequests - 1)
    if (pendingRequests === 0) loading.value = false
  }

  /** 记录失败：error 供展示，errorInfo/retryAfter 决定是否进入冷却 */
  function setFailure(info: GithubErrorInfo, retryAt?: number) {
    error.value = info.message
    errorInfo.value = info
    retryAfter.value = retryAt ?? null
  }

  function clearFailure() {
    error.value = null
    errorInfo.value = null
    retryAfter.value = null
  }

  /**
   * 统一收敛一次取数结果：
   * 记录来源、快照时间，并决定是清除还是记录失败。
   * 这样 loadStats / loadRepos / loadEvents 三处不会各写一套判断。
   */
  function applyPayload<T>(payload: CachedPayload<T>, failureMessage: string): void {
    snapshotAt.value = payload.source === 'snapshot' ? (payload.snapshotAt ?? null) : null
    lastUpdated.value = payload.cachedAt

    if (payload.source === 'network' || payload.source === 'snapshot') {
      // 快照不是失败，只是数据来自构建时刻；没有错误可报
      clearFailure()
      return
    }

    setFailure(payload.errorInfo ?? { message: payload.error ?? failureMessage }, payload.retryAfter)
  }

  /** 数据是否来自非网络来源（缓存或内置回退） */
  const isDegraded = computed(() => statsSource.value !== 'network' || reposSource.value !== 'network')

  const isEmpty = computed(() => !loading.value && repos.value.length === 0)

  /** 正在冷却：请求已发出也会被 GitHub 拒绝，继续调用只会浪费本就见底的配额 */
  const coolingDown = computed(() => cooldownRemaining.value > 0)

  /** 配额类失败：冷却结束后解除，允许用户手动再试一次 */
  const rateLimitBlocked = computed(() => coolingDown.value && errorInfo.value?.rateLimited === true)

  const cooldownSeconds = computed(() => cooldownRemaining.value)

  function clearCooldownTimer() {
    if (cooldownTimer !== null) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }

  watch(retryAfter, (deadline) => {
    clearCooldownTimer()

    if (deadline === null || deadline <= Date.now()) {
      cooldownRemaining.value = 0
      return
    }

    const tick = () => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000)
      if (remaining <= 0) {
        cooldownRemaining.value = 0
        clearCooldownTimer()
        return
      }
      cooldownRemaining.value = remaining
    }

    tick()
    cooldownTimer = setInterval(tick, 1000)
  })

  onScopeDispose(clearCooldownTimer)

  /**
   * 只取统计数字。
   * 这里原本还会并发请求 `/users/{user}` 填 profile，但那个字段全站无人消费，
   * 而 GitHub 的仓库列表接口已经把 owner 的计数内联返回了 —— 白白多花一次配额。
   */
  async function loadStats() {
    beginRequest()
    try {
      const payload = await githubService.getStats()
      stats.value = payload.data
      statsSource.value = payload.source
      applyPayload(payload, 'GitHub 数据加载失败')
    } catch (err) {
      setFailure({ message: err instanceof Error ? err.message : 'GitHub 数据加载失败' })
    } finally {
      endRequest()
    }
  }

  async function loadRepos() {
    beginRequest()
    try {
      const payload = await githubService.getRepositories()
      repos.value = payload.data
      reposSource.value = payload.source
      applyPayload(payload, 'GitHub 仓库加载失败')
    } catch (err) {
      setFailure({ message: err instanceof Error ? err.message : 'GitHub 仓库加载失败' })
      repos.value = []
    } finally {
      endRequest()
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

  /**
   * 首页 / 项目页进入时调用，已加载过则不再重复请求。
   * 冷却期间（上次请求被判定为限流）直接跳过，避免在配额耗尽时继续发请求。
   */
  async function ensureLoaded(options: { withEvents?: boolean } = {}) {
    if (loaded.value || loading.value || coolingDown.value) return
    loaded.value = true
    await Promise.all([loadStats(), loadRepos()])
    if (options.withEvents) await loadEvents()
  }

  async function refresh() {
    if (coolingDown.value) return
    loaded.value = false
    clearFailure()
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
    errorInfo,
    retryAfter,
    cooldownSeconds,
    coolingDown,
    rateLimitBlocked,
    snapshotAt,
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
