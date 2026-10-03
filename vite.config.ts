import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 使用 import.meta.dirname（Node 20.11+ / 浏览器构建时由 Vite 处理），
// 避免为配置文件引入 node 类型依赖。
const srcDir = new URL('./src', import.meta.url).pathname

export default defineConfig({
  plugins: [vue()],
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
})
