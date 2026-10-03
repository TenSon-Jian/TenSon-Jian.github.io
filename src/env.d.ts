/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// 自定义环境变量（与 vite/client 的 ImportMetaEnv 声明合并）
interface ImportMetaEnv {
  readonly VITE_GITHUB_USERNAME?: string
  readonly VITE_GITHUB_TOKEN?: string
  /** 取数策略：auto（默认，快照优先）/ live（总是实时）/ snapshot（只用快照，零请求） */
  readonly VITE_GITHUB_MODE?: string
  readonly VITE_SITE_URL?: string
}

/**
 * 构建期快照。
 * 由 scripts/generate-github-snapshot.mjs 生成，声明在这里是为了让导入具备精确类型。
 */
declare module '@/data/github-snapshot.json' {
  import type { GithubSnapshot } from '@/types'
  const snapshot: GithubSnapshot
  export default snapshot
}
