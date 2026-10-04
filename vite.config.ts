import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// 使用 import.meta.dirname（Node 20.11+ / 浏览器构建时由 Vite 处理），
// 避免为配置文件引入 node 类型依赖。
const srcDir = new URL('./src', import.meta.url).pathname

/**
 * 站点根路径占位符：index.html 与 public/404.html 里各有一处 `__BASE_PATH__`。
 * 部署到 <user>.github.io 时 base 为 '/'，部署到项目页时通过 VITE_BASE_PATH 指定。
 */
const BASE_PLACEHOLDER = '__BASE_PATH__'

function injectBasePath(base: string): Plugin {
  const normalized = base.endsWith('/') ? base : `${base}/`

  const replaceOnce = (html: string) => {
    const at = html.indexOf(BASE_PLACEHOLDER)
    return at === -1 ? html : html.slice(0, at) + normalized + html.slice(at + BASE_PLACEHOLDER.length)
  }

  return {
    name: 'ajian:inject-base-path',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => replaceOnce(html),
    },
    // public/ 下的静态文件会原样复制，需要单独替换，否则 404.html 里的占位符会残留
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.html')) continue
        const source = typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source)
        if (source.includes(BASE_PLACEHOLDER)) file.source = replaceOnce(source)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // 用户站点（<user>.github.io）用默认的 '/'；
  // 若改部署到项目页（<user>.github.io/<repo>/），设置 VITE_BASE_PATH=/<repo>/
  const envBase = process.env.VITE_BASE_PATH?.trim()
  const base = envBase ? (envBase.startsWith('/') ? envBase : `/${envBase}`) : '/'

  return {
    base,
    plugins: [vue(), injectBasePath(base)],
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
      target: 'es2019',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
          },
        },
      },
    },
  }
})
