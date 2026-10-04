<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, ArrowUpRight, CircleDot } from 'lucide-vue-next'
import { fallbackRepos, findProject, projects as localProjects } from '@/data/fallback'
import { githubService } from '@/services/github'
import { generateCover, generateScreenshots } from '@/utils/cover'
import { formatDateTime, formatNumber, relativeTime } from '@/utils/format'
import { renderMarkdown } from '@/utils/markdown'
import ArchitectureDiagram from '@/components/project/ArchitectureDiagram.vue'
import ImageLightbox from '@/components/project/ImageLightbox.vue'
import MarkdownView from '@/components/note/MarkdownView.vue'
import type { GithubRepo, Project } from '@/types'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const local = computed(() => findProject(slug.value))

/** 仓库名来自本地档案的 repositoryUrl，而不是本地 slug（两者可能不同） */
const repoName = computed(() => {
  const url = local.value?.repositoryUrl
  const name = url?.split('/').pop()
  return name && name.length ? name : slug.value
})

/** 没有本地档案时，用 GitHub 仓库信息构造一个最小项目 */
const remoteFallback = computed<Project | undefined>(() => {
  const repo =
    fallbackRepos.find((item) => item.name.toLowerCase() === slug.value) ??
    fallbackRepos.find((item) => item.name.toLowerCase().includes(slug.value))
  if (!repo) return undefined
  return {
    id: repo.name,
    name: repo.name,
    slug: slug.value,
    description: repo.description ?? '暂无描述',
    language: repo.language ?? undefined,
    technologies: repo.topics ?? [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.pushed_at,
    repositoryUrl: repo.html_url,
    demoUrl: repo.homepage ?? undefined,
    type: 'GitHub Repository',
    overview: repo.description ?? undefined,
  }
})

const project = computed<Project | undefined>(() => local.value ?? remoteFallback.value)

/** 该仓库的实时数据 */
const repo = ref<GithubRepo | null>(null)
const readme = ref('')
const loading = ref(true)
const lightboxIndex = ref<number | null>(null)

const screenshots = computed(() => generateScreenshots(slug.value, 3))
const cover = computed(() => project.value?.cover ?? generateCover({ seed: slug.value }))

const readmeHtml = computed(() => (readme.value ? renderMarkdown(readme.value) : ''))
const hasReadme = computed(() => Boolean(readme.value.trim()))

const stats = computed(() => [
  { label: 'Stars', value: formatNumber(repo.value?.stargazers_count ?? project.value?.stars ?? 0) },
  { label: 'Forks', value: formatNumber(repo.value?.forks_count ?? project.value?.forks ?? 0) },
  { label: 'Watchers', value: formatNumber(repo.value?.watchers_count ?? 0) },
  {
    label: 'Updated',
    value: relativeTime(repo.value?.pushed_at ?? project.value?.updatedAt),
  },
])

async function loadRepositoryData() {
  loading.value = true
  readme.value = ''
  try {
    // 用仓库名而不是本地 slug 请求，两者可能不一致（例如 slug: rms / repo: RMS）
    const payload = await githubService.getRepository(repoName.value)
    repo.value = payload.data
  } catch {
    repo.value = null
  } finally {
    loading.value = false
  }

  // README 单独请求，不阻塞首屏
  try {
    const payload = await githubService.getRepositoryReadme(repoName.value)
    readme.value = payload.data
  } catch {
    readme.value = ''
  }
}

onMounted(loadRepositoryData)
watch(slug, loadRepositoryData)

const relatedProjects = computed(() =>
  localProjects.filter((item) => item.slug !== slug.value).slice(0, 2),
)

/**
 * 章节导航（对应示意图中的 Overview / Architecture / Features / Screenshots /
 * Development 一行），同时作为滚动定位，方便在长档案中跳转。
 * 五个章节始终存在（缺数据时给出空状态），因此导航是稳定的。
 */
const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'features', label: 'Features' },
  { id: 'screenshots', label: 'Screenshots' },
  { id: 'development', label: 'Development' },
]

const activeSection = ref('overview')
let observer: IntersectionObserver | null = null

function observeSections() {
  observer?.disconnect()
  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]?.target.id) activeSection.value = visible[0].target.id
    },
    { rootMargin: '-140px 0px -60% 0px', threshold: 0 },
  )
  for (const item of sections) {
    const el = document.getElementById(item.id)
    if (el) observer.observe(el)
  }
}

// 规范 §33：项目详情页也应有具体标题，而不是所有 slug 共用「Project — AJIAN」。
// 必须在挂载后写，因为 router.afterEach 会先写入路由级标题。
function syncTitle() {
  const name = project.value?.name
  if (name) document.title = `${name} — AJIAN`
}

onMounted(async () => {
  await nextTick()
  observeSections()
  syncTitle()
})

watch(slug, async () => {
  await nextTick()
  observeSections()
  syncTitle()
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div v-if="project" class="page detail">
    <RouterLink to="/projects" class="detail__back">
      <ArrowLeft :size="14" :stroke-width="1.8" aria-hidden="true" />
      <span>Projects</span>
    </RouterLink>

    <!-- ── 头部 ── -->
    <header class="detail__head">
      <div class="detail__head-main">
        <h1 class="detail__title">{{ project.name }}</h1>
        <p class="detail__desc">{{ project.description }}</p>

        <div class="tag-row detail__tags">
          <span v-for="tech in project.technologies" :key="tech" class="tag">{{ tech }}</span>
        </div>

        <div class="detail__actions">
          <a class="btn btn--primary" :href="project.repositoryUrl" target="_blank" rel="noopener noreferrer">
            GitHub
            <ArrowUpRight :size="14" :stroke-width="1.8" aria-hidden="true" />
          </a>
          <a
            v-if="project.demoUrl"
            class="btn btn--ghost"
            :href="project.demoUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Live Demo
            <ArrowUpRight :size="14" :stroke-width="1.8" aria-hidden="true" />
          </a>
        </div>
      </div>

      <dl class="detail__stats">
        <div v-for="item in stats" :key="item.label">
          <dt>{{ item.value }}</dt>
          <dd>{{ item.label }}</dd>
        </div>
      </dl>
    </header>

    <!-- ── 章节导航（示意图中的一行 Overview / Architecture / … ）── -->
    <nav class="detail__nav" aria-label="项目页面章节">
      <RouterLink
        v-for="item in sections"
        :key="item.id"
        :to="{ hash: `#${item.id}` }"
        class="detail__nav-link"
        :class="{ 'is-active': activeSection === item.id }"
        :aria-current="activeSection === item.id ? 'true' : undefined"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <!-- ── Overview ── -->
    <section id="overview" class="detail__section">
      <h2 class="detail__section-title">Overview</h2>
      <div class="overview">
        <div class="overview__text">
          <p>{{ project.overview ?? project.description }}</p>
          <ul v-if="project.highlights?.length" class="overview__list">
            <li v-for="item in project.highlights" :key="item">
              <CircleDot :size="12" :stroke-width="2" aria-hidden="true" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <dl class="overview__meta">
          <div>
            <dt>技术栈</dt>
            <dd>{{ project.technologies.join(' · ') || '—' }}</dd>
          </div>
          <div>
            <dt>开发时间</dt>
            <dd>{{ project.period ?? '—' }}</dd>
          </div>
          <div>
            <dt>项目类型</dt>
            <dd>{{ project.type ?? '—' }}</dd>
          </div>
          <div>
            <dt>主要语言</dt>
            <dd>{{ repo?.language ?? project.language ?? '—' }}</dd>
          </div>
          <div v-if="repo">
            <dt>最近提交</dt>
            <dd>{{ formatDateTime(repo.pushed_at) }}</dd>
          </div>
          <div v-if="repo?.topics?.length">
            <dt>Topics</dt>
            <dd class="overview__topics">
              <span v-for="topic in repo.topics" :key="topic" class="tag">{{ topic }}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ── Architecture ── -->
    <section id="architecture" class="detail__section">
      <h2 class="detail__section-title">Architecture</h2>
      <template v-if="project.architecture">
        <p class="detail__section-note">
          以 HTML / CSS 绘制，不使用静态图片；Hover 节点可查看相关链路。
        </p>
        <ArchitectureDiagram :spec="project.architecture" />
      </template>
      <p v-else class="detail__section-note">
        这个项目还没有整理架构图。技术栈：{{ project.technologies.join(' · ') || '—' }}。
      </p>
    </section>

    <!-- ── Features ── -->
    <section id="features" class="detail__section">
      <h2 class="detail__section-title">Features</h2>
      <ol v-if="project.features?.length" class="features">
        <li v-for="feature in project.features" :key="feature.no" class="features__item">
          <span class="features__no mono">{{ feature.no }}</span>
          <div>
            <h3 class="features__title">{{ feature.title }}</h3>
            <p class="features__summary">{{ feature.summary }}</p>
          </div>
        </li>
      </ol>
      <p v-else class="detail__section-note">
        功能清单还在整理中，可以先到 GitHub 仓库看提交记录。
      </p>
    </section>

    <!-- ── Screenshots ── -->
    <section id="screenshots" class="detail__section">
      <h2 class="detail__section-title">Screenshots</h2>
      <p class="detail__section-note">点击图片可放大查看。</p>
      <div class="shots">
        <button
          v-for="(shot, index) in screenshots"
          :key="shot.src"
          type="button"
          class="shots__item"
          :class="{ 'shots__item--wide': index === screenshots.length - 1 }"
          :aria-label="`放大查看 ${shot.alt}`"
          @click="lightboxIndex = index"
        >
          <img :src="shot.src" :alt="shot.alt" loading="lazy" decoding="async" />
        </button>
      </div>
    </section>

    <!-- ── Development / README ── -->
    <section id="development" class="detail__section">
      <h2 class="detail__section-title">Development</h2>

      <div v-if="loading" class="readme-skeleton">
        <div class="skeleton" style="height: 16px; width: 42%" />
        <div class="skeleton" style="height: 10px; width: 88%" />
        <div class="skeleton" style="height: 10px; width: 76%" />
        <div class="skeleton" style="height: 120px; width: 100%" />
      </div>

      <MarkdownView
        v-else-if="hasReadme"
        :html="readmeHtml"
        empty-text="这个仓库暂时没有 README。"
      />

      <div v-else class="empty-state">
        <img :src="cover" alt="" class="empty-state__cover" aria-hidden="true" />
        <p>
          暂时无法读取该仓库的 README（GitHub API 在当前网络下不可达）。
          你可以直接前往
          <a :href="project.repositoryUrl" target="_blank" rel="noopener noreferrer">GitHub 仓库</a>
          查看完整文档。
        </p>
      </div>
    </section>

    <!-- ── 相关项目 ── -->
    <section v-if="relatedProjects.length" class="detail__section">
      <h2 class="detail__section-title">More Projects</h2>
      <ul class="related">
        <li v-for="item in relatedProjects" :key="item.id">
          <RouterLink :to="`/projects/${item.slug}`" class="related__link">
            <span class="related__name">{{ item.name }}</span>
            <span class="related__desc">{{ item.description }}</span>
            <span class="related__arrow" aria-hidden="true">→</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <ImageLightbox
      :items="screenshots"
      :index="lightboxIndex"
      @close="lightboxIndex = null"
      @update:index="lightboxIndex = $event"
    />
  </div>

  <!-- 项目不存在 -->
  <div v-else class="page">
    <div class="empty-state">
      <p>没有找到这个项目。</p>
      <RouterLink to="/projects" class="btn btn--ghost">返回 Projects</RouterLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: var(--space-5);
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

.detail__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-7);
  align-items: end;
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-light);
}

.detail__title {
  font-size: clamp(24px, 3.4vw, 32px);
  font-weight: 700;
  letter-spacing: -0.025em;
}

.detail__desc {
  margin-top: 10px;
  max-width: 62ch;
  color: var(--text-secondary);
  font-size: 14px;
}

.detail__tags {
  margin-top: var(--space-4);
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: var(--space-5);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 500;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    transform var(--dur) var(--ease);

  &:hover {
    transform: translateY(-1px);
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

  &:hover {
    border-color: var(--accent);
    color: var(--text-primary);
    background: var(--surface);
  }
}

.detail__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, auto));
  gap: var(--space-4) var(--space-6);
  margin: 0;

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  dt {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
    white-space: nowrap;
  }

  dd {
    margin: 0;
    font-size: 11.5px;
    color: var(--text-tertiary);
  }
}

// ── 章节导航：克制的一行文字，当前章节用下划线标记 ──
.detail__nav {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin-top: var(--space-6);
  padding: var(--space-3) 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(6px);
}

.detail__nav-link {
  position: relative;
  font-size: 12.5px;
  color: var(--text-tertiary);
  transition: color var(--dur) var(--ease);

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -9px;
    height: 1.5px;
    background: var(--text-primary);
    opacity: 0;
    transform: scaleX(0.4);
    transform-origin: left;
    transition:
      opacity var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  &:hover {
    color: var(--text-secondary);
  }

  &.is-active {
    color: var(--text-primary);

    &::after {
      opacity: 1;
      transform: none;
    }
  }
}

.detail__section {
  margin-top: var(--space-8);
  scroll-margin-top: 90px;
}

.detail__section-title {
  font-size: 17px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
}

.detail__section-note {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
}

// ── Overview ──
.overview {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: var(--space-7);
  margin-top: var(--space-5);
}

.overview__text p {
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--text-primary);
}

.overview__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: var(--space-4);

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);

    svg {
      margin-top: 4px;
      color: var(--accent);
      flex: none;
    }
  }
}

.overview__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: var(--space-5);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--surface-secondary);

  dt {
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  dd {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: var(--text-primary);
  }
}

.overview__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

// ── Features ──
.features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4) var(--space-6);
  margin-top: var(--space-5);
}

.features__item {
  display: flex;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.features__no {
  color: var(--text-tertiary);
  padding-top: 2px;
}

.features__title {
  font-size: 14.5px;
  font-weight: 600;
}

.features__summary {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

// ── Screenshots ──
.shots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.shots__item {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  padding: 0;
  transition:
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);

  img {
    width: 100%;
    height: auto;
    transition: transform var(--dur-slow) var(--ease);
  }

  &:hover {
    border-color: var(--border);
    box-shadow: 0 10px 26px var(--shadow);

    img {
      transform: scale(1.015);
    }
  }
}

.shots__item--wide {
  grid-column: 1 / -1;
}

// ── README ──
.readme-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: var(--space-5);
}

.empty-state__cover {
  width: 220px;
  border-radius: var(--radius);
  opacity: 0.6;
}

.related {
  margin-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.related__link {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr) auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4) 2px;
  border-bottom: 1px solid var(--border-light);
  transition: background-color var(--dur) var(--ease);

  &:hover {
    background: color-mix(in srgb, var(--surface) 55%, transparent);
  }
}

.related__name {
  font-size: 14px;
  font-weight: 600;
}

.related__desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related__arrow {
  color: var(--text-tertiary);
}

@media (max-width: 1199px) {
  .detail__head {
    grid-template-columns: 1fr;
    gap: var(--space-5);
    align-items: start;
  }

  .detail__stats {
    grid-template-columns: repeat(4, minmax(0, auto));
  }
}

@media (max-width: 767px) {
  .overview,
  .features,
  .shots {
    grid-template-columns: 1fr;
  }

  .detail__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }

  .related__link {
    grid-template-columns: 1fr auto;
  }

  .related__desc {
    display: none;
  }
}
</style>
