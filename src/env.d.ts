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
  readonly VITE_SITE_URL?: string
}
