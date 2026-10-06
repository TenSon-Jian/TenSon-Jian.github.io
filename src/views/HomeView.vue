<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'
import { projects as localProjects } from '@/data/projects'
import { notes } from '@/data/notes'
import { tools } from '@/data/tools'
import { useReveal } from '@/composables/useReveal'
import SiteBackground from '@/components/brand/SiteBackground.vue'
import ProjectCard from '@/components/project/ProjectCard.vue'
import NoteRow from '@/components/note/NoteRow.vue'
import { toolIcons } from '@/components/brand/icons'
import type { Project } from '@/types'

const notesReveal = useReveal<HTMLElement>()
const toolsReveal = useReveal<HTMLElement>()

const featured = computed<Project[]>(() =>
  localProjects.filter((project) => project.featured).slice(0, 3),
)

/** 统计值全部由本地数据现算，不需要网络请求，也就没有加载态与失败态 */
const statItems = computed(() => [
  { value: localProjects.length, label: 'Projects' },
  { value: notes.length, label: 'Notes' },
  { value: tools.length, label: 'Tools' },
])

const latestNotes = computed(() => notes.slice(0, 3))
const toolPreview = computed(() => tools.slice(0, 8))
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

        <!-- 站点内容统计（全部由本地数据现算） -->
        <dl class="stats">
          <div v-for="item in statItems" :key="item.label" class="stats__item">
            <dt class="stats__value">{{ item.value }}</dt>
            <dd class="stats__label">{{ item.label }}</dd>
          </div>
        </dl>
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
        <ProjectCard
          v-for="(project, index) in featured"
          :key="project.id"
          :project="project"
          :index="index"
          class="fade-in"
        />
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

// ── 项目网格 ──
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
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
