/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// 自定义环境变量（与 vite/client 的 ImportMetaEnv 声明合并）
interface ImportMetaEnv {
  /** 站点规范地址：注入 index.html 的 canonical / og:url / og:image */
  readonly VITE_SITE_URL?: string
}

