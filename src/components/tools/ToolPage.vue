<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description?: string
    backTo?: string
    backLabel?: string
  }>(),
  { backTo: '/tools', backLabel: 'Tools' },
)
</script>

<template>
  <div class="tool-page">
    <RouterLink :to="backTo" class="tool-page__back">
      <ArrowLeft :size="14" :stroke-width="1.8" aria-hidden="true" />
      <span>{{ backLabel }}</span>
    </RouterLink>

    <header class="tool-page__head">
      <h1 class="tool-page__title">{{ title }}</h1>
      <p v-if="description" class="tool-page__desc">{{ description }}</p>
      <span class="tool-page__badge">纯前端执行 · 输入不会离开浏览器</span>
    </header>

    <slot />
  </div>
</template>

<style scoped lang="scss">
.tool-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  animation: page-enter var(--dur-slow) var(--ease) both;
}

.tool-page__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
  width: fit-content;
  transition: color var(--dur) var(--ease);

  svg {
    transition: transform var(--dur) var(--ease);
  }

  &:hover {
    color: var(--text-primary);

    svg {
      transform: translateX(-2px);
    }
  }
}

.tool-page__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-page__title {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tool-page__desc {
  color: var(--text-secondary);
  font-size: 13.5px;
  max-width: 68ch;
}

.tool-page__badge {
  margin-top: 4px;
  width: fit-content;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
  color: var(--text-tertiary);
  font-size: 11.5px;
}
</style>
