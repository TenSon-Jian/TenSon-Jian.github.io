<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Github, Moon, Sun } from 'lucide-vue-next'
import { navItems, siteConfig } from '@/config/site'
import { navIcons } from '@/components/brand/icons'
import { useTheme } from '@/composables/useTheme'
import LogoMark from '@/components/brand/LogoMark.vue'

const props = defineProps<{ mobile?: boolean }>()
const emit = defineEmits<{ (event: 'navigate'): void }>()

const route = useRoute()
const { theme, toggleTheme } = useTheme()

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

const items = computed(() =>
  navItems.map((item) => ({ ...item, Icon: navIcons[item.icon] })),
)
</script>

<template>
  <nav class="sidebar-nav" :class="{ 'is-mobile': props.mobile }" aria-label="主导航">
    <RouterLink v-if="!props.mobile" to="/" class="brand" @click="emit('navigate')">
      <LogoMark :size="22" />
      <span class="brand__name">AJIAN</span>
    </RouterLink>

    <ul class="nav-list">
      <li v-for="item in items" :key="item.path">
        <RouterLink
          :to="item.path"
          class="nav-item"
          :class="{ 'is-active': isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          @click="emit('navigate')"
        >
          <component :is="item.Icon" :size="16" :stroke-width="1.7" aria-hidden="true" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="nav-footer">
      <a
        class="nav-item nav-item--ghost"
        :href="siteConfig.links.github"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Github :size="16" :stroke-width="1.7" aria-hidden="true" />
        <span>GitHub</span>
        <span class="nav-item__arrow" aria-hidden="true">↗</span>
      </a>

      <button
        type="button"
        class="nav-item nav-item--ghost theme-toggle"
        :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        :aria-pressed="theme === 'dark'"
        @click="toggleTheme"
      >
        <Transition name="icon-swap" mode="out-in">
          <Sun v-if="theme === 'dark'" key="sun" :size="16" :stroke-width="1.7" aria-hidden="true" />
          <Moon v-else key="moon" :size="16" :stroke-width="1.7" aria-hidden="true" />
        </Transition>
        <span>Theme</span>
        <span class="nav-item__hint" aria-hidden="true">{{ theme === 'dark' ? 'Dark' : 'Light' }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  height: 100%;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 2px 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--text-primary);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 13.5px;
  text-align: left;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    transform var(--dur) var(--ease);

  svg {
    flex: none;
    opacity: 0.75;
    transition:
      opacity var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  &:hover {
    background: var(--surface-secondary);
    color: var(--text-primary);
    transform: translateX(1.5px);

    svg {
      opacity: 1;
    }
  }

  &.is-active {
    background: var(--accent-soft);
    color: var(--text-primary);
    font-weight: 500;

    svg {
      opacity: 1;
      color: var(--accent-dark);
    }
  }
}

.nav-item__arrow {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
  transition: transform var(--dur) var(--ease);
}

.nav-item--ghost:hover .nav-item__arrow {
  transform: translate(2px, -2px);
}

.nav-footer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.nav-item__hint {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.theme-toggle svg {
  color: var(--accent-dark);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-30deg) scale(0.9);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(30deg) scale(0.9);
}

// 移动端：竖排列表，作为抽屉内容
.sidebar-nav.is-mobile {
  gap: var(--space-4);

  .nav-item {
    padding: 12px 12px;
    font-size: 15px;
  }

  .nav-footer {
    padding-top: var(--space-4);
  }
}
</style>
