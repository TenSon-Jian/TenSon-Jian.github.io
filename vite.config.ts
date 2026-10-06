import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// 使用 import.meta.dirname（Node 20.11+ / 浏览器构建时由 Vite 处理），
// 避免为配置文件引入 node 类型依赖。
const srcDir = new URL('./src', import.meta.url).pathname

/**
 * HTML 占位符，构建时统一替换：
 * - `__BASE_PATH__`：站点根路径。index.html 与 public/404.html 里各有多处。
 *   部署到 <user>.github.io 时 base 为 '/'，部署到项目页时通过 VITE_BASE_PATH 指定。
 * - `__SITE_URL__`：站点规范地址（canonical / og:url / og:image 用）。
 *   通过 VITE_SITE_URL 指定，换绑自定义域名时只需改这一个环境变量。
 */
const BASE_PLACEHOLDER = '__BASE_PATH__'
const SITE_URL_PLACEHOLDER = '__SITE_URL__'

/** public/ 下需要做占位符替换的静态 HTML（相对 outDir 的路径） */
const STATIC_HTML = ['404.html']

function injectSiteMeta(base: string, siteUrl: string, outDir: string): Plugin[] {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedSite = siteUrl.replace(/\/+$/, '')

  const transform = (html: string) =>
    html.includes(BASE_PLACEHOLDER) || html.includes(SITE_URL_PLACEHOLDER)
      ? html.split(BASE_PLACEHOLDER).join(normalizedBase).split(SITE_URL_PLACEHOLDER).join(normalizedSite)
      : html

  return [
    {
      name: 'ajian:inject-site-meta-index',
      // index.html：dev 与 build 都替换，保证本地预览的 canonical 与线上一致
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => transform(html),
      },
    },
    {
      name: 'ajian:inject-site-meta-static',
      apply: 'build',
      /**
       * public/ 下的文件不经 Rollup 管线：Vite 在 bundle.write() 之前就把它原样
       * 复制进了 outDir（prepareOutDir → copyDir），因此它既不是 bundle 里的 asset，
       * 也不会走 transform / generateBundle。只能等落盘后按路径直接改。
       */
      async writeBundle() {
        for (const rel of STATIC_HTML) {
          const file = resolve(outDir, rel)
          let source: string
          try {
            source = await readFile(file, 'utf8')
          } catch {
            continue // 该静态文件不存在时跳过，不影响构建
          }
          if (!source.includes(BASE_PLACEHOLDER) && !source.includes(SITE_URL_PLACEHOLDER)) continue
          await writeFile(file, transform(source), 'utf8')
        }
      },
    },
  ]
}

export default defineConfig(() => {
  // 用户站点（<user>.github.io）用默认的 '/'；
  // 若改部署到项目页（<user>.github.io/<repo>/），设置 VITE_BASE_PATH=/<repo>/
  const envBase = process.env.VITE_BASE_PATH?.trim()
  const base = envBase ? (envBase.startsWith('/') ? envBase : `/${envBase}`) : '/'

  // 站点规范地址：默认用户站点；绑定自定义域名时设置 VITE_SITE_URL=https://example.com
  const siteUrl = process.env.VITE_SITE_URL?.trim() || 'https://tenson-jian.github.io'
  // 与下方 build.outDir 保持一致，供 public/ 静态文件的落盘后修正使用
  const outDir = 'dist'

  return {
    base,
    plugins: [vue(), ...injectSiteMeta(base, siteUrl, outDir)],
    resolve: {
      alias: {
        '@': decodeURIComponent(srcDir),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    build: {
      outDir,
      target: 'es2019',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
          },
        },
      },
    },
  }
})
