<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Activity, ArrowUpRight, GitFork, Search, Star } from 'lucide-vue-next'
import { useGithubStore } from '@/stores/github'
import { projects as localProjects, fallbackRepos } from '@/data/fallback'
import { siteConfig } from '@/config/site'
import type { Project } from '@/types'
import { formatNumber, relativeTime } from '@/utils/format'

const github = useGithubStore()
const keyword = ref('')
const activeLanguage = ref<string>('All')

// 规范 §11：GitHub 数据包含 Repositories / Stars / Followers / 最近活动 / 更新时间，
// 因此项目页一并拉取 events，用于右侧「最近活动」列表。
onMounted(() => {
  void github.ensureLoaded({ withEvents: true })
})

/** 本地档案提供中文名称与技术栈，GitHub 提供实时数据 */
const merged = computed<Project[]>(() => {
  const repos = github.repos.length ? github.repos : fallbackRepos
  const usedSlugs = new Set<string>()

  const fromLocal = localProjects.map((project) => {
    const repoName = project.repositoryUrl.split('/').pop()?.toLowerCase() ?? project.slug
    const live = repos.find(
      (repo) => repo.name.toLowerCase() === repoName || repo.name.toLowerCase() === project.slug,
    )
    usedSlugs.add(project.slug)
    if (!live) return project
    return {
      ...project,
      stars: live.stargazers_count,
      forks: live.forks_count,
      updatedAt: live.pushed_at ?? live.updated_at,
      description: live.description ?? project.description,
    }
  })

  const fromGithub: Project[] = repos
    .filter((repo) => !usedSlugs.has(repo.name.toLowerCase()))
    .map((repo) => ({
      id: repo.name,
      name: repo.name,
      slug: repo.name.toLowerCase(),
      description: repo.description ?? '暂无描述',
      language: repo.language ?? undefined,
      technologies: (repo.topics ?? []).slice(0, 4).length
        ? (repo.topics ?? []).slice(0, 4)
        : repo.language
          ? [repo.language]
          : [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.pushed_at ?? repo.updated_at,
      repositoryUrl: repo.html_url,
      demoUrl: repo.homepage ?? undefined,
    }))

  return [...fromLocal, ...fromGithub]
})

const languages = computed(() => {
  const set = new Set<string>()
  merged.value.forEach((project) => {
    if (project.language) set.add(project.language)
  })
  return ['All', ...Array.from(set).sort()]
})

const filtered = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return merged.value.filter((project) => {
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

const isEmpty = computed(() => !github.loading && filtered.value.length === 0)

/** 最近活动：只展示最近 6 条，避免页面被动态数据淹没 */
const activity = computed(() => github.events.slice(0, 6))

const EVENT_LABELS: Record<string, string> = {
  PushEvent: '推送',
  CreateEvent: '新建',
  DeleteEvent: '删除',
  WatchEvent: 'Star',
  ForkEvent: 'Fork',
  IssuesEvent: 'Issue',
  IssueCommentEvent: '评论',
  PullRequestEvent: 'PR',
  ReleaseEvent: '发布',
  PublicEvent: '公开',
}

function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type.replace(/Event$/, '')
}

function shortRepo(repo: string): string {
  return repo.includes('/') ? repo.split('/').slice(1).join('/') : repo
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">Projects</h1>
      <p class="page-subtitle">
        Selected works &amp; experiments. 数据来自 GitHub，与本地项目档案合并展示。
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

    <!-- 加载态 -->
    <div v-if="github.loading && !github.repos.length" class="archive">
      <div v-for="n in 4" :key="n" class="archive__row archive__row--skeleton">
        <div class="skeleton" style="height: 12px; width: 42px" />
        <div class="skeleton" style="height: 16px; width: 220px" />
        <div class="skeleton" style="height: 10px; width: 320px" />
      </div>
    </div>

    <!-- 项目档案式列表 -->
    <ol v-else-if="filtered.length" class="archive">
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
                <Star :size="13" :stroke-width="1.8" aria-hidden="true" />
                {{ formatNumber(project.stars ?? 0) }}
              </span>
              <span class="archive__stat">
                <GitFork :size="13" :stroke-width="1.8" aria-hidden="true" />
                {{ formatNumber(project.forks ?? 0) }}
              </span>
              <span class="archive__updated">Updated {{ relativeTime(project.updatedAt) }}</span>
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
    <div v-else-if="isEmpty" class="empty-state">
      <p v-if="keyword || activeLanguage !== 'All'">
        没有匹配「{{ keyword || activeLanguage }}」的项目。
        <button type="button" class="empty-state__action" @click="keyword = ''; activeLanguage = 'All'">
          清除筛选
        </button>
      </p>
      <p v-else>暂时没有可展示的仓库。</p>
    </div>

    <p class="archive__footnote">
      共 {{ filtered.length }} 个项目 · 数据缓存于本地，避免重复请求 GitHub API
      <RouterLink to="/tools/json" class="archive__footnote-link">在工具页做点别的 →</RouterLink>
    </p>

    <!-- ── 最近活动（规范 §11：Latest Activity）── -->
    <section class="activity" aria-labelledby="activity-title">
      <div class="activity__head">
        <h2 id="activity-title" class="activity__title">
          <Activity :size="15" :stroke-width="1.8" aria-hidden="true" />
          最近活动
        </h2>
        <a
          class="activity__all"
          :href="siteConfig.links.github"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub <ArrowUpRight :size="13" :stroke-width="1.8" aria-hidden="true" />
        </a>
      </div>

      <ul v-if="github.loading && !github.events.length" class="activity__list">
        <li v-for="n in 4" :key="n" class="activity__item activity__item--skeleton">
          <div class="skeleton" style="height: 11px; width: 54px" />
          <div class="skeleton" style="height: 11px; width: 190px" />
        </li>
      </ul>

      <ul v-else-if="activity.length" class="activity__list fade-in">
        <li v-for="event in activity" :key="event.id" class="activity__item">
          <span class="activity__kind mono">{{ eventLabel(event.type) }}</span>
          <span class="activity__body">
            <span class="activity__repo">{{ shortRepo(event.repo) }}</span>
            <span class="activity__summary">{{ event.summary }}</span>
          </span>
          <span class="activity__time mono">{{ relativeTime(event.createdAt) }}</span>
        </li>
      </ul>

      <p v-else class="activity__empty">暂时读不到公开动态。</p>
    </section>
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

.archive__row--skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--space-6) 0;
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

// ── 最近活动 ──
.activity {
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.activity__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.activity__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;

  svg {
    color: var(--accent);
  }
}

.activity__all {
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
      transform: translate(1px, -1px);
    }
  }
}

.activity__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--space-6);
}

.activity__item {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) auto;
  align-items: baseline;
  gap: var(--space-3);
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
  font-size: 12.8px;
}

.activity__item--skeleton {
  grid-template-columns: 62px minmax(0, 1fr);
}

.activity__kind {
  color: var(--text-tertiary);
  font-size: 11px;
}

.activity__body {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.activity__repo {
  font-weight: 500;
  color: var(--text-primary);
}

.activity__summary {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity__time {
  color: var(--text-tertiary);
  font-size: 11px;
  white-space: nowrap;
}

.activity__empty {
  font-size: 12.5px;
  color: var(--text-tertiary);
}

@media (max-width: 1199px) {
  .activity__list {
    grid-template-columns: minmax(0, 1fr);
  }
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

  .activity__item {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .activity__time {
    display: none;
  }
}
</style>
