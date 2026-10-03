<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Github, Menu, Moon, Sun, X } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LogoMark from '@/components/brand/LogoMark.vue'
import SiteBackground from '@/components/brand/SiteBackground.vue'
import { siteConfig } from '@/config/site'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const menuOpen = ref(false)
const { theme, toggleTheme } = useTheme()

/**
 * 全站统一背景（规范 §4 / §7 / §36）：
 * 同一个兽人角色、同一套绘画语言，随路由只调整「克制程度」。
 * 首页与 404 由页面自己呈现更明显的角色，因此不再叠加环境层。
 */
const bgVariant = computed(() => {
  const name = String(route.name ?? '')
  if (name === 'home' || name === 'not-found') return null
  if (name === 'projects' || name === 'project-detail') return 'project' as const
  if (name === 'notes' || name === 'note-detail') return 'notes' as const
  if (name === 'tools' || name.startsWith('tool-')) return 'tools' as const
  if (name === 'about') return 'about' as const
  return 'default' as const
})

const closeMenu = () => {
  menuOpen.value = false
}

// 移动端抽屉打开时锁定滚动
watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

// 路由变化时自动关闭抽屉
watch(() => route.fullPath, closeMenu)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMenu()
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown)
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <a class="skip-link" href="#main">跳到主要内容</a>

  <!-- 全站背景视觉语言：始终存在，但始终克制 -->
  <SiteBackground v-if="bgVariant" :variant="bgVariant" fixed />

  <div class="app-shell">
    <!-- 桌面端：固定左侧 Sidebar -->
    <aside class="app-sidebar">
      <AppSidebar />
    </aside>

    <!-- 移动端：顶部导航 -->
    <header class="app-topbar">
      <RouterLink to="/" class="topbar__brand" aria-label="返回首页">
        <LogoMark :size="20" />
        <span>AJIAN</span>
      </RouterLink>
      <div class="topbar__actions">
        <a
          class="topbar__icon"
          :href="siteConfig.links.github"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="在 GitHub 上打开 AJIAN 的主页"
        >
          <Github :size="18" :stroke-width="1.7" aria-hidden="true" />
        </a>
        <button
          type="button"
          class="topbar__icon"
          :aria-expanded="menuOpen"
          aria-controls="mobile-nav"
          :aria-label="menuOpen ? '关闭导航菜单' : '打开导航菜单'"
          @click="menuOpen = !menuOpen"
        >
          <Menu v-if="!menuOpen" :size="19" :stroke-width="1.7" aria-hidden="true" />
          <X v-else :size="19" :stroke-width="1.7" aria-hidden="true" />
        </button>
      </div>
    </header>

    <Transition name="drawer">
      <div v-if="menuOpen" id="mobile-nav" class="mobile-drawer">
        <div class="mobile-drawer__panel">
          <AppSidebar mobile @navigate="closeMenu" />
        </div>
      </div>
    </Transition>

    <!-- 主内容区域 -->
    <main id="main" class="app-main">
      <!-- 右上角工具位：与示意图一致的一枚安静的主题切换 -->
      <div class="app-utility">
        <button
          type="button"
          class="app-utility__btn"
          :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          :aria-pressed="theme === 'dark'"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="16" :stroke-width="1.7" aria-hidden="true" />
          <Moon v-else :size="16" :stroke-width="1.7" aria-hidden="true" />
        </button>
      </div>

      <div class="app-page">
        <RouterView v-slot="{ Component, route: current }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="current.path" />
          </Transition>
        </RouterView>
      </div>

      <AppFooter />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
}

// ── 桌面端 Sidebar ──
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-w);
  padding: var(--space-7) var(--space-5) var(--space-6);
  border-right: 1px solid var(--border-light);
  background: color-mix(in srgb, var(--surface) 55%, transparent);
  backdrop-filter: saturate(1.05);
  z-index: 20;
  transition:
    background-color var(--dur-slow) var(--ease),
    border-color var(--dur-slow) var(--ease);
}

.app-main {
  position: relative;
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-w);
  padding: var(--space-9) var(--space-8) var(--space-7);
  display: flex;
  flex-direction: column;
}

.app-page {
  width: 100%;
  max-width: var(--content-max);
  margin-inline: auto;
  flex: 1;
  min-width: 0;
}

// ── 右上角工具位（对应示意图右上角的搜索 / 主题图标）──
.app-utility {
  position: absolute;
  top: var(--space-6);
  right: var(--space-8);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-utility__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);

  &:hover {
    background: var(--surface-secondary);
    color: var(--text-primary);
  }
}

// ── 移动端顶部栏 ──
.app-topbar {
  display: none;
}

.mobile-drawer {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--overlay);
  backdrop-filter: blur(2px);
  animation: fade-in var(--dur) var(--ease) both;
}

.mobile-drawer__panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: var(--space-5) var(--space-5) var(--space-6);
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  box-shadow: 0 18px 40px var(--shadow-strong);
  max-height: 88vh;
  overflow-y: auto;
}

.drawer-enter-active .mobile-drawer__panel,
.drawer-leave-active .mobile-drawer__panel {
  transition: transform var(--dur) var(--ease);
}

.drawer-enter-from .mobile-drawer__panel,
.drawer-leave-to .mobile-drawer__panel {
  transform: translateY(-12px);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--dur) var(--ease);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

// ── 页面切换动画：克制的淡入 + 位移（400 ~ 600ms，规范 §24）──
.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--dur-slow) var(--ease),
    transform var(--dur-slow) var(--ease);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// ── 响应式 ──
@media (max-width: 1199px) {
  .app-main {
    padding: var(--space-7) var(--space-6) var(--space-6);
  }
}

@media (max-width: 767px) {
  .app-shell {
    flex-direction: column;
  }

  .app-sidebar {
    display: none;
  }

  .app-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px var(--space-4);
    border-bottom: 1px solid var(--border-light);
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(8px);
  }

  .topbar__brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.14em;
  }

  .topbar__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .topbar__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius);
    color: var(--text-secondary);
    transition:
      background-color var(--dur) var(--ease),
      color var(--dur) var(--ease);

    &:hover {
      background: var(--surface-secondary);
      color: var(--text-primary);
    }
  }

  .app-main {
    margin-left: 0;
    padding: var(--space-6) var(--space-4) var(--space-5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-from,
  .page-leave-to {
    transform: none;
  }
}
</style>
