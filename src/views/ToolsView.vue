<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Search } from 'lucide-vue-next'
import { tools } from '@/data/tools'
import { toolIcons } from '@/components/brand/icons'

const keyword = ref('')

const filtered = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return tools
  return tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(key) ||
      tool.title.toLowerCase().includes(key) ||
      tool.description.toLowerCase().includes(key),
  )
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">Tools</h1>
      <p class="page-subtitle">一些我平时会使用的小工具。全部在浏览器里执行，输入不会离开本机。</p>
    </header>

    <label class="search-field">
      <Search :size="15" :stroke-width="1.8" aria-hidden="true" />
      <span class="sr-only">搜索工具</span>
      <input v-model="keyword" type="search" placeholder="搜索工具…" />
    </label>

    <ul v-if="filtered.length" class="tools-grid">
      <li v-for="tool in filtered" :key="tool.id">
        <RouterLink :to="tool.path" class="tool-card surface-card hoverable">
          <span class="tool-card__icon">
            <component :is="toolIcons[tool.icon]" :size="19" :stroke-width="1.6" aria-hidden="true" />
          </span>
          <span class="tool-card__body">
            <span class="tool-card__name">{{ tool.name }}</span>
            <span class="tool-card__desc">{{ tool.title }} · {{ tool.description }}</span>
          </span>
          <ArrowUpRight class="tool-card__arrow" :size="15" :stroke-width="1.8" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>

    <div v-else class="empty-state">
      <p>没有匹配「{{ keyword }}」的工具。</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 320px;
  height: 36px;
  margin-bottom: var(--space-5);
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-tertiary);
  transition: border-color var(--dur) var(--ease);

  &:focus-within {
    border-color: var(--accent);
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: none;
    outline: none;
    font-size: 13px;
    color: var(--text-primary);

    &::placeholder {
      color: var(--text-tertiary);
    }
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.tool-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: 100%;
  padding: var(--space-4);
}

.tool-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
  color: var(--accent-dark);
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}

.tool-card:hover .tool-card__icon {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.tool-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tool-card__name {
  font-size: 14px;
  font-weight: 600;
}

.tool-card__desc {
  font-size: 12px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-card__arrow {
  margin-left: auto;
  flex: none;
  color: var(--text-tertiary);
  opacity: 0;
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.tool-card:hover .tool-card__arrow {
  opacity: 1;
  transform: translate(2px, -2px);
}

@media (max-width: 1199px) {
  .tools-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .tools-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .tool-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: var(--space-3);
  }

  .tool-card__arrow {
    display: none;
  }

  .tool-card__name {
    font-size: 13px;
  }

  .tool-card__desc {
    font-size: 11.5px;
  }
}
</style>
