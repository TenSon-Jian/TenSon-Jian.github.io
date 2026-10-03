<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { adjacentNotes, findNote } from '@/data/notes'
import { renderMarkdown } from '@/utils/markdown'
import { formatDate } from '@/utils/format'
import MarkdownView from '@/components/note/MarkdownView.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const note = computed(() => findNote(slug.value))
const neighbours = computed(() => adjacentNotes(slug.value))
const prev = computed(() => neighbours.value.prev)
const next = computed(() => neighbours.value.next)
const html = computed(() => (note.value ? renderMarkdown(note.value.content) : ''))

/** 目录：抽取 H2 标题 */
const toc = computed(() => {
  if (!note.value) return []
  return note.value.content
    .split('\n')
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, '').trim())
})
</script>

<template>
  <article v-if="note" class="page note">
    <RouterLink to="/notes" class="note__back">
      <ArrowLeft :size="14" :stroke-width="1.8" aria-hidden="true" />
      <span>Notes</span>
    </RouterLink>

    <header class="note__head">
      <time class="note__date mono" :datetime="note.date">{{ formatDate(note.date) }}</time>
      <h1 class="note__title">{{ note.title }}</h1>
      <p class="note__summary">{{ note.summary }}</p>
      <div class="note__meta">
        <span class="note__category">{{ note.category }}</span>
        <span v-if="note.readingMinutes">{{ note.readingMinutes }} 分钟阅读</span>
        <span v-for="tag in note.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>

    <div class="note__layout">
      <nav v-if="toc.length > 2" class="note__toc" aria-label="目录">
        <p class="note__toc-title">目录</p>
        <ul>
          <li v-for="item in toc" :key="item">{{ item }}</li>
        </ul>
      </nav>

      <div class="note__body">
        <MarkdownView :html="html" />

        <nav class="note__pager" aria-label="相邻文章">
          <RouterLink v-if="prev" :to="`/notes/${prev.slug}`" class="note__pager-link">
            <span class="note__pager-label">← 更早</span>
            <span class="note__pager-title">{{ prev.title }}</span>
          </RouterLink>
          <span v-else />
          <RouterLink v-if="next" :to="`/notes/${next.slug}`" class="note__pager-link note__pager-link--next">
            <span class="note__pager-label">更新 →</span>
            <span class="note__pager-title">{{ next.title }}</span>
          </RouterLink>
        </nav>      </div>
    </div>
  </article>

  <div v-else class="page">
    <div class="empty-state">
      <p>这篇文章不存在或已被移除。</p>
      <RouterLink to="/notes" class="note__back">返回 Notes</RouterLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
.note__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
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

.note__head {
  max-width: 820px;
  margin: var(--space-6) auto var(--space-7);
}

.note__date {
  color: var(--text-tertiary);
}

.note__title {
  margin-top: 10px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
}

.note__summary {
  margin-top: var(--space-3);
  color: var(--text-secondary);
  font-size: 14.5px;
}

.note__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: var(--space-4);
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.note__category {
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
  color: var(--text-secondary);
}

.note__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
}

.note__body {
  max-width: 820px;
  margin-inline: auto;
  padding-bottom: var(--space-7);
  width: 100%;
}

.note__toc {
  display: none;
}

.note__pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.note__pager-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-4);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--surface);
  transition:
    transform var(--dur) var(--ease),
    border-color var(--dur) var(--ease);

  &:hover {
    transform: translateY(-2px);
    border-color: var(--border);
  }
}

.note__pager-link--next {
  text-align: right;
}

.note__pager-label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.note__pager-title {
  font-size: 13.5px;
  font-weight: 500;
}

@media (min-width: 1200px) {
  .note__layout {
    grid-template-columns: 180px minmax(0, 1fr);
  }

  .note__toc {
    display: block;
    position: sticky;
    top: 90px;
    align-self: start;
    padding-top: 6px;
    font-size: 12.5px;
    color: var(--text-tertiary);

    ul {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }

    li {
      line-height: 1.5;
      border-left: 1px solid var(--border-light);
      padding-left: 10px;
    }
  }

  .note__toc-title {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .note__body {
    margin-inline: 0;
  }
}

@media (max-width: 767px) {
  .note__pager {
    grid-template-columns: 1fr;
  }
}
</style>
