import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { siteConfig } from '@/config/site'

/**
 * 路由表（对应规范第 35 节）。
 * 全部页面按路由懒加载，首页优先加载。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'AJIAN — Developer / Builder / Furry', description: siteConfig.description },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: {
      title: 'Projects — AJIAN',
      description: 'Selected works & experiments. GitHub 驱动项目档案。',
    },
  },
  {
    path: '/projects/:slug',
    name: 'project-detail',
    component: () => import('@/views/ProjectDetailView.vue'),
    meta: { title: 'Project — AJIAN' },
  },
  {
    path: '/notes',
    name: 'notes',
    component: () => import('@/views/NotesView.vue'),
    meta: { title: 'Notes — AJIAN', description: '记录技术、生活与灵感。' },
  },
  {
    path: '/notes/:slug',
    name: 'note-detail',
    component: () => import('@/views/NoteDetailView.vue'),
    meta: { title: 'Note — AJIAN' },
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { title: 'Tools — AJIAN', description: '一些我平时会使用的小工具。' },
  },
  {
    path: '/tools/json',
    name: 'tool-json',
    component: () => import('@/views/tools/JsonToolView.vue'),
    meta: { title: 'JSON Formatter — AJIAN' },
  },
  {
    path: '/tools/color',
    name: 'tool-color',
    component: () => import('@/views/tools/ColorToolView.vue'),
    meta: { title: 'Color Converter — AJIAN' },
  },
  {
    path: '/tools/timestamp',
    name: 'tool-timestamp',
    component: () => import('@/views/tools/TimestampToolView.vue'),
    meta: { title: 'Timestamp — AJIAN' },
  },
  {
    path: '/tools/markdown',
    name: 'tool-markdown',
    component: () => import('@/views/tools/MarkdownToolView.vue'),
    meta: { title: 'Markdown Preview — AJIAN' },
  },
  {
    path: '/tools/uuid',
    name: 'tool-uuid',
    component: () => import('@/views/tools/UuidToolView.vue'),
    meta: { title: 'UUID Generator — AJIAN' },
  },
  {
    path: '/tools/image',
    name: 'tool-image',
    component: () => import('@/views/tools/ImageToolView.vue'),
    meta: { title: 'Image Compressor — AJIAN' },
  },
  {
    path: '/tools/base64',
    name: 'tool-base64',
    component: () => import('@/views/tools/Base64ToolView.vue'),
    meta: { title: 'Base64 Encoder — AJIAN' },
  },
  {
    path: '/tools/regex',
    name: 'tool-regex',
    component: () => import('@/views/tools/RegexToolView.vue'),
    meta: { title: 'Regex Tester — AJIAN' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About — AJIAN', description: '关于 AJIAN：开发者、建造者，以及一些别的。' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404 — AJIAN' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 96 }
    if (to.path !== from.path) return { top: 0 }
    return undefined
  },
})

// ── SEO：为每个页面设置独立的 title / description / canonical / OG ──
function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

router.afterEach((to) => {
  const title = (to.meta.title as string) ?? 'AJIAN'
  const description = (to.meta.description as string) ?? siteConfig.description
  const url = `${siteConfig.url}${to.path === '/' ? '' : to.path}`

  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
})

export default router
