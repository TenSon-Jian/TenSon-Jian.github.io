import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ajian-theme'

const current = ref<Theme>('light')
let systemQuery: MediaQueryList | null = null
/** 用户是否显式选择过主题；未选择时跟随系统 */
let userPrefers: Theme | null = null
let initialized = false

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const THEME_COLORS: Record<Theme, string> = { light: '#F3EEDF', dark: '#20201F' }

function apply(theme: Theme) {
  current.value = theme
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)

    // 浏览器地址栏配色必须跟随「当前生效的主题」。
    // index.html 里的 media 查询只负责首屏，一旦 JS 介入就统一收敛为单一取值，
    // 否则显式切换主题后会写进 media 不匹配的那个标签，地址栏颜色就错了。
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((tag) => {
      tag.removeAttribute('media')
      tag.setAttribute('content', THEME_COLORS[theme])
    })
  }
}

/** 在 app 挂载前调用一次，避免主题闪烁 */
export function initTheme(): void {
  if (initialized) return
  initialized = true

  userPrefers = readStored()
  apply(userPrefers ?? systemTheme())

  if (typeof window !== 'undefined' && window.matchMedia) {
    systemQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      // 仅在用户没有显式选择时跟随系统
      if (!userPrefers) apply(event.matches ? 'dark' : 'light')
    }
    if (typeof systemQuery.addEventListener === 'function') {
      systemQuery.addEventListener('change', onChange)
    }
  }
}

export function useTheme() {
  const setTheme = (theme: Theme) => {
    userPrefers = theme
    apply(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* 忽略隐私模式下的异常 */
    }
  }

  const toggleTheme = () => setTheme(current.value === 'dark' ? 'light' : 'dark')

  return {
    theme: current,
    isDark: () => current.value === 'dark',
    setTheme,
    toggleTheme,
  }
}
