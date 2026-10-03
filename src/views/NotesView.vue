<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { noteCategories, notes } from '@/data/notes'
import NoteRow from '@/components/note/NoteRow.vue'
import PawIcon from '@/components/brand/PawIcon.vue'

const keyword = ref('')
const activeCategory = ref('All')

const categories = computed(() => ['All', ...noteCategories])

const filtered = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return notes.filter((note) => {
    if (activeCategory.value !== 'All' && note.category !== activeCategory.value) return false
    if (!key) return true
    return (
      note.title.toLowerCase().includes(key) ||
      note.summary.toLowerCase().includes(key) ||
      note.content.toLowerCase().includes(key) ||
      (note.tags ?? []).some((tag) => tag.toLowerCase().includes(key))
    )
  })
})

const reset = () => {
  keyword.value = ''
  activeCategory.value = 'All'
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">Notes</h1>
      <p class="page-subtitle">记录技术、生活与灵感。</p>
    </header>

    <div class="notes-toolbar">
      <label class="search-field">
        <Search :size="15" :stroke-width="1.8" aria-hidden="true" />
        <span class="sr-only">搜索笔记</span>
        <input v-model="keyword" type="search" placeholder="搜索标题、正文或标签…" />
      </label>

      <div class="filter-row" role="group" aria-label="按分类筛选">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="filter-chip"
          :class="{ 'is-active': activeCategory === category }"
          :aria-pressed="activeCategory === category"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <div v-if="filtered.length" class="note-list">
      <NoteRow v-for="note in filtered" :key="note.id" :note="note" show-cover />
    </div>

    <div v-else class="empty-state">
      <PawIcon :size="34" :opacity="0.3" />
      <p>没有匹配「{{ keyword || activeCategory }}」的笔记。</p>
      <button type="button" class="empty-state__action" @click="reset">清除筛选</button>
    </div>

    <p class="notes__count">
      共 {{ filtered.length }} 篇 · 全部使用 Markdown 撰写
    </p>
  </div>
</template>

<style scoped lang="scss">
.notes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}

.search-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 240px;
  max-width: 340px;
  height: 36px;
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

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  height: 28px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);

  &:hover {
    color: var(--text-primary);
    border-color: var(--border);
  }

  &.is-active {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--text-primary);
  }
}

.note-list {
  display: flex;
  flex-direction: column;
}

.notes__count {
  margin-top: var(--space-5);
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.empty-state__action {
  color: var(--accent-dark);
  font-size: 12.5px;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
