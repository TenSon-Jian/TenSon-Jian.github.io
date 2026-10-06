<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Project } from '@/types'
import { generateCover } from '@/utils/cover'

const props = defineProps<{ project: Project; index?: number }>()

const cover = computed(() => props.project.cover ?? generateCover({ seed: props.project.slug }))
</script>

<template>
  <article class="project-card surface-card hoverable">
    <RouterLink
      :to="`/projects/${project.slug}`"
      class="project-card__link"
      :aria-label="`查看项目 ${project.name}`"
    >
      <div class="project-card__cover">
        <img :src="cover" :alt="`${project.name} 预览图`" loading="lazy" decoding="async" />
      </div>

      <div class="project-card__body">
        <h3 class="project-card__title">{{ project.name }}</h3>
        <p class="project-card__desc">{{ project.description }}</p>

        <div class="tag-row project-card__tags">
          <span v-for="tech in project.technologies.slice(0, 4)" :key="tech" class="tag">{{ tech }}</span>
        </div>

        <div class="project-card__meta">
          <span class="project-card__type">{{ project.type ?? project.language ?? '项目' }}</span>
          <span v-if="project.period" class="project-card__period">{{ project.period }}</span>
        </div>

        <span class="project-card__cta">
          View Project
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped lang="scss">
.project-card {
  overflow: hidden;
  height: 100%;
}

.project-card__link {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.project-card__cover {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface-secondary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--dur-slow) var(--ease);
  }
}

.project-card:hover .project-card__cover img {
  transform: scale(1.015);
}

.project-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-4) var(--space-4) var(--space-4);
  flex: 1;
}

.project-card__title {
  font-size: 15px;
  font-weight: 600;
}

.project-card__desc {
  font-size: 12.8px;
  line-height: 1.6;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card__tags {
  margin-top: 2px;
}

.project-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-3);
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.project-card__type {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card__period {
  margin-left: auto;
  white-space: nowrap;
}

.project-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--space-2);
  font-size: 12.5px;
  color: var(--text-secondary);
  transition: color var(--dur) var(--ease);

  span {
    transition: transform var(--dur) var(--ease);
  }
}

.project-card:hover .project-card__cta {
  color: var(--accent-dark);

  span {
    transform: translateX(2px);
  }
}
</style>
