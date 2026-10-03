<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight, RefreshCw } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'
import { projects as localProjects } from '@/data/fallback'
import { notes } from '@/data/notes'
import { tools } from '@/data/tools'
import { useGithubStore } from '@/stores/github'
import { useReveal } from '@/composables/useReveal'
import SiteBackground from '@/components/brand/SiteBackground.vue'
import ProjectCard from '@/components/project/ProjectCard.vue'
import NoteRow from '@/components/note/NoteRow.vue'
import { toolIcons } from '@/components/brand/icons'
import type { Project } from '@/types'
import { fallbackRepos } from '@/data/fallback'

const github = useGithubStore()
const notesReveal = useReveal<HTMLElement>()
const toolsReveal = useReveal<HTMLElement>()

onMounted(() => {
  void github.ensureLoaded()
})

const featured = computed<Project[]>(() => {
  // 本地档案提供中文名称与技术栈，GitHub 提供实时星标 / 更新时间
  const byName = new Map(github.repos.map((repo) => [repo.name.toLowerCase(), repo]))

  return localProjects
    .filter((project) => project.featured)
    .slice(0, 3)
    .map((project) => {
      const repoName = project.repositoryUrl.split('/').pop()?.toLowerCase() ?? project.slug
      const live = byName.get(repoName) ?? byName.get(project.slug) ?? fallbackRepos.find((r) => r.name.toLowerCase() === repoName)
      if (!live) return project
      return {
        ...project,
        stars: live.stargazers_count,
        forks: live.forks_count,
        updatedAt: live.pushed_at ?? live.updated_at,
        description: live.description ?? project.description,
      }
    })
})

const statItems = computed(() => [
  { value: github.stats?.repositories ?? 18, label: 'Repositories' },
  { value: github.stats?.stars ?? 42, label: 'Stars' },
  { value: github.stats?.followers ?? 36, label: 'Followers' },
])

const latestNotes = computed(() => notes.slice(0, 3))
const toolPreview = computed(() => tools.slice(0, 8))

const sourceLabel = computed(() => {
  if (github.statsSource === 'network') return null
  if (github.statsSource === 'cache') return '来自本地缓存'
  return 'GitHub 暂时不可达，显示离线数据'
})
</script>

<template>
  <div class="home">
    <!-- ── Hero ──
         构图完全对应示意图：左侧文字与导航，右侧大型兽人角色，
         角色贴住 Hero 右缘、并被 Hero 底边裁切（规范 §5 / §9）。 -->
    <section class="hero" aria-labelledby="hero-title">
      <SiteBackground variant="hero" eager />

      <div class="hero__text">
        <p class="hero__eyebrow">Hello, I'm</p>
        <h1 id="hero-title" class="hero__name">藤狩</h1>
        <p class="hero__role">{{ siteConfig.role }}</p>
        <p class="hero__tagline">{{ siteConfig.tagline }}</p>

        <div class="hero__actions">
          <RouterLink to="/projects" class="btn btn--primary">
            View Projects
            <span aria-hidden="true">→</span>
          </RouterLink>
          <RouterLink to="/about" class="btn btn--ghost">About Me</RouterLink>
        </div>

        <!-- GitHub 数据统计 -->
        <dl class="stats" :aria-busy="github.loading">
          <template v-if="github.loading && !github.stats">
            <div v-for="n in 3" :key="n" class="stats__item">
              <div class="skeleton stats__skeleton-value" />
              <div class="skeleton stats__skeleton-label" />
            </div>
          </template>
          <template v-else>
            <div v-for="item in statItems" :key="item.label" class="stats__item fade-in">
              <dt class="stats__value">{{ item.value }}</dt>
              <dd class="stats__label">{{ item.label }}</dd>
            </div>
          </template>
        </dl>

        <p v-if="sourceLabel" class="stats__source">
          <RefreshCw :size="12" :stroke-width="1.8" aria-hidden="true" />
          {{ sourceLabel }}
          <button type="button" class="stats__retry" @click="github.refresh()">重试</button>
        </p>
      </div>
    </section>

    <!-- ── Recent Projects ── -->
    <section class="section" aria-labelledby="recent-title">
      <div class="section-head">
        <h2 id="recent-title" class="section-title">Recent Projects</h2>
        <RouterLink to="/projects" class="section-more">
          View all <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div class="project-grid">
        <template v-if="github.loading && !github.repos.length">
          <div v-for="n in 3" :key="n" class="surface-card skeleton-card">
            <div class="skeleton skeleton-card__cover" />
            <div class="skeleton-card__body">
              <div class="skeleton" style="height: 14px; width: 60%" />
              <div class="skeleton" style="height: 10px; width: 92%" />
              <div class="skeleton" style="height: 10px; width: 74%" />
            </div>
          </div>
        </template>
        <template v-else>
          <ProjectCard
            v-for="(project, index) in featured"
            :key="project.id"
            :project="project"
            :index="index"
            class="fade-in"
          />
        </template>
      </div>
    </section>

    <!-- ── Notes ── -->
    <section ref="notesReveal" class="section reveal" aria-labelledby="recent-notes-title">
      <div class="section-head">
        <h2 id="recent-notes-title" class="section-title">Notes</h2>
        <RouterLink to="/notes" class="section-more">
          更多笔记 <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
      <div class="note-list">
        <NoteRow v-for="note in latestNotes" :key="note.id" :note="note" />
      </div>
    </section>

    <!-- ── Tools ── -->
    <section ref="toolsReveal" class="section reveal" aria-labelledby="recent-tools-title">
      <div class="section-head">
        <h2 id="recent-tools-title" class="section-title">Tools</h2>
        <RouterLink to="/tools" class="section-more">
          全部工具 <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
      <ul class="tool-strip">
        <li v-for="tool in toolPreview" :key="tool.id">
          <RouterLink :to="tool.path" class="tool-strip__item">
            <component :is="toolIcons[tool.icon]" :size="15" :stroke-width="1.7" aria-hidden="true" />
            <span>{{ tool.title }}</span>
            <ArrowUpRight class="tool-strip__arrow" :size="13" :stroke-width="1.8" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
// ── Hero ──
// 左侧文字 / 右侧大型兽人背景；角色由 SiteBackground 统一提供，
// 贴住 Hero 右缘并被底边裁切，与示意图完全一致。
.hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  min-height: clamp(420px, 56vh, 620px);
  padding: var(--space-6) 0 var(--space-7);
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
}

.hero__text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: min(520px, 46%);
}

.hero__eyebrow {
  font-size: 13.5px;
  color: var(--text-secondary);
}

.hero__name {
  font-size: clamp(46px, 7vw, 76px);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1;
}

.hero__role {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.hero__tagline {
  font-size: 14.5px;
  color: var(--text-secondary);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: var(--space-4);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: var(--radius-pill);
  font-size: 13.5px;
  font-weight: 500;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);

  span {
    transition: transform var(--dur) var(--ease);
  }

  &:hover span {
    transform: translateX(2px);
  }
}

.btn--primary {
  background: var(--text-primary);
  color: var(--bg);

  &:hover {
    background: var(--accent-dark);
    color: var(--surface);
  }
}

.btn--ghost {
  border: 1px solid var(--border);
  color: var(--text-secondary);
  background: transparent;

  &:hover {
    border-color: var(--accent);
    color: var(--text-primary);
    background: var(--surface);
  }
}

// ── 统计 ──
.stats {
  display: flex;
  gap: var(--space-7);
  margin: var(--space-6) 0 0;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.stats__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 78px;
}

.stats__value {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.stats__label {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.stats__skeleton-value {
  height: 26px;
  width: 44px;
}

.stats__skeleton-label {
  height: 10px;
  width: 66px;
  margin-top: 6px;
}

.stats__source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--space-3);
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.stats__retry {
  color: var(--accent-dark);
  font-size: 11.5px;
  text-decoration: underline;
  text-underline-offset: 2px;
}

// ── 项目网格 ──
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.skeleton-card {
  overflow: hidden;
}

.skeleton-card__cover {
  aspect-ratio: 16 / 10;
  border-radius: 0;
}

.skeleton-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--space-4);
}

// ── 笔记列表 ──
.note-list {
  display: flex;
  flex-direction: column;
}

// ── 工具条 ──
.tool-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.tool-strip__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 13px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 12.8px;
  color: var(--text-secondary);
  transition:
    transform var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease);

  svg {
    flex: none;
    color: var(--accent);
  }

  &:hover {
    transform: translateY(-2px);
    border-color: var(--border);
    color: var(--text-primary);

    .tool-strip__arrow {
      opacity: 1;
      transform: translate(1px, -1px);
    }
  }
}

.tool-strip__arrow {
  margin-left: auto;
  opacity: 0;
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

// ── 响应式 ──
@media (max-width: 1199px) {
  .hero {
    min-height: clamp(380px, 50vh, 520px);
  }

  .hero__text {
    max-width: min(480px, 54%);
  }

  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tool-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .hero {
    min-height: 0;
    padding: var(--space-5) 0 var(--space-6);
    align-items: flex-start;
  }

  // 移动端不删除角色，只缩小 / 右移 / 降透明度（规范 §28）
  .hero__text {
    max-width: 100%;
  }

  .hero__name {
    font-size: clamp(38px, 13vw, 54px);
  }

  .stats {
    gap: var(--space-5);
    justify-content: space-between;
  }

  .stats__value {
    font-size: 22px;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }

  .tool-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
