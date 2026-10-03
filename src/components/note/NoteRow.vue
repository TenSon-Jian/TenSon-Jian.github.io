<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Note } from '@/types'
import { formatDate } from '@/utils/format'

const props = defineProps<{ note: Note; showCover?: boolean }>()

const date = computed(() => formatDate(props.note.date))
</script>

<template>
  <article class="note-row">
    <RouterLink :to="`/notes/${note.slug}`" class="note-row__link">
      <div v-if="showCover" class="note-row__cover">
        <img :src="note.cover" :alt="`${note.title} 封面`" loading="lazy" decoding="async" />
      </div>

      <div class="note-row__body">
        <time class="note-row__date mono" :datetime="note.date">{{ date }}</time>
        <h3 class="note-row__title">{{ note.title }}</h3>
        <p class="note-row__summary">{{ note.summary }}</p>
        <div class="note-row__foot">
          <span class="note-row__category">{{ note.category }}</span>
          <span v-if="note.readingMinutes" class="note-row__reading">{{ note.readingMinutes }} 分钟阅读</span>
        </div>
      </div>

      <span class="note-row__arrow" aria-hidden="true">→</span>
    </RouterLink>
  </article>
</template>

<style scoped lang="scss">
.note-row {
  border-bottom: 1px solid var(--border-light);

  &:first-child {
    border-top: 1px solid var(--border-light);
  }
}

.note-row__link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-5);
  align-items: start;
  padding: var(--space-5) 2px;
  transition: background-color var(--dur) var(--ease);

  &:hover {
    background: color-mix(in srgb, var(--surface) 60%, transparent);
  }
}

.note-row__cover {
  width: 132px;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface-secondary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--dur-slow) var(--ease);
  }
}

.note-row:hover .note-row__cover img {
  transform: scale(1.015);
}

.note-row__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.note-row__date {
  color: var(--text-tertiary);
}

.note-row__title {
  font-size: 16px;
  font-weight: 600;
  transition: color var(--dur) var(--ease);
}

.note-row:hover .note-row__title {
  color: var(--accent-dark);
}

.note-row__summary {
  font-size: 13px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-row__foot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.note-row__category {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
}

.note-row__arrow {
  align-self: center;
  color: var(--text-tertiary);
  transition:
    transform var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.note-row:hover .note-row__arrow {
  transform: translateX(3px);
  color: var(--accent-dark);
}

@media (max-width: 767px) {
  .note-row__link {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .note-row__cover {
    width: 100%;
  }

  .note-row__arrow {
    display: none;
  }
}
</style>
