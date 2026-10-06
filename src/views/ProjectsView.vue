<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Layers, Search } from 'lucide-vue-next'
import { projects } from '@/data/projects'
import type { Project } from '@/types'

const keyword = ref('')
const activeLanguage = ref<string>('All')

const languages = computed(() => {
  const set = new Set<string>()
  projects.forEach((project) => {
    if (project.language) set.add(project.language)
  })
  return ['All', ...Array.from(set).sort()]
})

const filtered = computed<Project[]>(() => {
  const key = keyword.value.trim().toLowerCase()
  return projects.filter((project) => {
    const matchesLanguage = activeLanguage.value === 'All' || project.language === activeLanguage.value
    if (!matchesLanguage) return false
    if (!key) return true
    return (
      project.name.toLowerCase().includes(key) ||
      project.slug.includes(key) ||
      project.description.toLowerCase().includes(key) ||
      project.technologies.some((tech) => tech.toLowerCase().includes(key))
    )
  })
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">Projects</h1>
      <p class="page-subtitle">
        Selected works &amp; experiments. 来自本地项目档案。
      </p>
    </header>

    <!-- 过滤与搜索 -->
    <div class="project-toolbar">
      <label class="search-field">
        <Search :size="15" :stroke-width="1.8" aria-hidden="true" />
        <span class="sr-only">搜索项目</span>
        <input v-model="keyword" type="search" placeholder="搜索项目、技术栈…" />
      </label>

      <div class="filter-row" role="group" aria-label="按语言筛选">
        <button
          v-for="language in languages"
          :key="language"
          type="button"
          class="filter-chip"
          :class="{ 'is-active': activeLanguage === language }"
          :aria-pressed="activeLanguage === language"
          @click="activeLanguage = language"
        >
          {{ language }}
        </button>
      </div>
    </div>

    <!-- 项目档案式列表 -->
    <ol v-if="filtered.length" class="archive">
      <li v-for="(project, index) in filtered" :key="project.id" class="archive__row">
        <RouterLink :to="`/projects/${project.slug}`" class="archive__link">
          <div class="archive__index mono">{{ `${index + 1}`.padStart(2, '0') }}</div>

          <div class="archive__main">
            <div class="archive__title-row">
              <h2 class="archive__title">{{ project.name }}</h2>
              <span v-if="project.featured" class="archive__badge">Featured</span>
            </div>

            <p class="archive__tech mono">
              {{ project.technologies.join(' · ') || project.language || '—' }}
            </p>

            <p class="archive__desc">{{ project.description }}</p>

            <div class="archive__meta">
              <span class="archive__stat">
                <Layers :size="13" :stroke-width="1.8" aria-hidden="true" />
                {{ project.technologies.length }} 项技术
              </span>
              <span v-if="project.period" class="archive__updated">{{ project.period }}</span>
            </div>
          </div>

          <div class="archive__aside">
            <span class="archive__cta">
              View Project
              <ArrowUpRight :size="14" :stroke-width="1.8" aria-hidden="true" />
            </span>
          </div>
        </RouterLink>
      </li>
    </ol>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p v-if="keyword || activeLanguage !== 'All'">
        没有匹配「{{ keyword || activeLanguage }}」的项目。
        <button type="button" class="empty-state__action" @click="keyword = ''; activeLanguage = 'All'">
          清除筛选
        </button>
      </p>
      <p v-else>暂时没有可展示的项目。</p>
    </div>

    <p class="archive__footnote">
      共 {{ filtered.length }} 个项目 · 全部来自仓库内的静态档案
      <RouterLink to="/tools/json" class="archive__footnote-link">在工具页做点别的 →</RouterLink>
    </p>
  </div>
</template>

<style scoped lang="scss">
.project-toolbar {
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
  flex: 1 1 220px;
  max-width: 320px;
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

// ── 档案式列表 ──
.archive {
  border-top: 1px solid var(--border-light);
}

.archive__row {
  border-bottom: 1px solid var(--border-light);
}

.archive__link {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: var(--space-5);
  align-items: start;
  padding: var(--space-6) var(--space-3) var(--space-6) 0;
  transition: background-color var(--dur) var(--ease);

  &:hover {
    background: color-mix(in srgb, var(--surface) 55%, transparent);
  }
}

.archive__index {
  padding-top: 4px;
  color: var(--text-tertiary);
  font-size: 12.5px;
  letter-spacing: 0.06em;
}

.archive__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.archive__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.archive__title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.015em;
  transition: color var(--dur) var(--ease);
}

.archive__link:hover .archive__title {
  color: var(--accent-dark);
}

.archive__badge {
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-size: 11px;
}

.archive__tech {
  color: var(--text-tertiary);
}

.archive__desc {
  max-width: 68ch;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.archive__meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.archive__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.archive__aside {
  padding-top: 4px;
}

.archive__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: color var(--dur) var(--ease);

  svg {
    transition: transform var(--dur) var(--ease);
  }
}

.archive__link:hover .archive__cta {
  color: var(--accent-dark);

  svg {
    transform: translate(2px, -2px);
  }
}

.archive__footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-top: var(--space-5);
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.archive__footnote-link {
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.empty-state__action {
  margin-left: 6px;
  color: var(--accent-dark);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 767px) {
  .archive__link {
    grid-template-columns: 1fr;
    gap: var(--space-3);
    padding: var(--space-5) 0;
  }

  .archive__index {
    padding-top: 0;
  }

  .archive__aside {
    display: none;
  }

  .archive__title {
    font-size: 17px;
  }
}
</style>
