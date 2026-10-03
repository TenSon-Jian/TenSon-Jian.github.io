<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Github, Mail } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'
import SiteBackground from '@/components/brand/SiteBackground.vue'
import PawIcon from '@/components/brand/PawIcon.vue'

const currently = [
  { label: 'Building', value: '这个网站，以及一套更顺手的后台模板。' },
  { label: 'Learning', value: 'Rust 的所有权模型；像素画的人物结构。' },
  { label: 'Exploring', value: '把重复的工作交给脚本，而不是交给耐心。' },
]

const tech = [
  { group: 'Language', items: ['Java', 'TypeScript', 'SQL'] },
  { group: 'Backend', items: ['Spring Boot', 'MyBatis-Plus', 'MySQL', 'Redis'] },
  { group: 'Frontend', items: ['Vue 3', 'Vite', 'Pinia', 'SCSS'] },
  { group: 'Tooling', items: ['Git', 'Docker', 'Nginx'] },
]

const elsewhere = [
  { label: 'GitHub', href: siteConfig.links.github, handle: '@Tenson_' },
  { label: 'Bilibili', href: siteConfig.links.bilibili, handle: '@藤狩' },
  { label: 'Steam', href: siteConfig.links.steam, handle: '@藤狩' },
  { label: 'Email', href: `mailto:${siteConfig.email}`, handle: siteConfig.email },
]

const interests = [
  { title: 'Games', text: '种田、CRPG、音游。喜欢能随时停下来的游戏。' },
  { title: 'Creative', text: '画一点像素图，做点小动画，多半留在硬盘里。' },
  { title: 'Music', text: '写代码时听很安静的东西，钢琴与氛围乐。' },
  { title: 'Interests', text: '排版、字体、以及一切有秩序感的东西。' },
]
</script>

<template>
  <div class="page about">
    <header class="about__head">
      <!-- About 页面允许比 Notes 更明显的兽人背景（规范 §6 / §21），
           仍然使用全站同一个角色与同一套视觉语言。 -->
      <SiteBackground variant="about" />

      <div class="about__intro">
        <p class="about__eyebrow">About</p>
        <h1 class="about__title">Hello. I'm AJIAN.</h1>
        <p class="about__role">{{ siteConfig.role }}</p>
        <div class="about__paragraphs">
          <p>I like building software, playing games, and creating things.</p>
          <p>大多数时候我在写后端，也写前端。做东西的时候我更喜欢安静一点的方式：少一点噪音，多一点留白，把注意力留给真正要解决的问题。</p>
          <p>{{ siteConfig.tagline }}</p>
        </div>

        <div class="about__actions">
          <a class="about__btn about__btn--primary" :href="siteConfig.links.github" target="_blank" rel="noopener noreferrer">
            <Github :size="15" :stroke-width="1.8" aria-hidden="true" />
            GitHub
            <ArrowUpRight :size="14" :stroke-width="1.8" aria-hidden="true" />
          </a>
          <a class="about__btn" :href="`mailto:${siteConfig.email}`">
            <Mail :size="15" :stroke-width="1.8" aria-hidden="true" />
            Email
          </a>
        </div>
      </div>
    </header>

    <!-- Currently -->
    <section class="about__section">
      <h2 class="about__section-title">Currently</h2>
      <ul class="currently">
        <li v-for="item in currently" :key="item.label" class="currently__item">
          <span class="currently__label">{{ item.label }}</span>
          <span class="currently__value">{{ item.value }}</span>
        </li>
      </ul>
    </section>

    <!-- Tech -->
    <section class="about__section">
      <h2 class="about__section-title">Tech</h2>
      <div class="tech">
        <div v-for="group in tech" :key="group.group" class="tech__group">
          <p class="tech__label">{{ group.group }}</p>
          <div class="tag-row">
            <span v-for="item in group.items" :key="item" class="tag">{{ item }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Elsewhere -->
    <section class="about__section">
      <h2 class="about__section-title">Elsewhere</h2>
      <ul class="elsewhere">
        <li v-for="item in elsewhere" :key="item.label">
          <a class="elsewhere__link" :href="item.href" target="_blank" rel="noopener noreferrer">
            <span class="elsewhere__label">{{ item.label }}</span>
            <span class="elsewhere__handle mono">{{ item.handle }}</span>
            <ArrowUpRight :size="14" :stroke-width="1.8" aria-hidden="true" />
          </a>
        </li>
      </ul>
    </section>

    <!-- 个人兴趣：保持克制 -->
    <section class="about__section">
      <h2 class="about__section-title">Interests</h2>
      <div class="interests">
        <div v-for="item in interests" :key="item.title" class="interests__item">
          <h3 class="interests__title">{{ item.title }}</h3>
          <p class="interests__text">{{ item.text }}</p>
        </div>
      </div>
    </section>

    <footer class="about__foot">
      <PawIcon :size="26" :opacity="0.24" />
      <p>
        想聊聊的话，写信给我：<a :href="`mailto:${siteConfig.email}`">{{ siteConfig.email }}</a>
        ，或者在
        <a :href="siteConfig.links.github" target="_blank" rel="noopener noreferrer">GitHub</a>
        上找我。
      </p>
      <RouterLink to="/projects" class="about__foot-link">看看我在做什么 →</RouterLink>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.about__head {
  position: relative;
  isolation: isolate;
  min-height: clamp(360px, 46vh, 520px);
  display: flex;
  align-items: center;
  padding-bottom: var(--space-7);
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
}

.about__intro {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: min(680px, 62%);
}

.about__eyebrow {
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.about__title {
  margin-top: 10px;
  font-size: clamp(28px, 4.4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.about__role {
  margin-top: 8px;
  font-size: 14.5px;
  font-weight: 500;
}

.about__paragraphs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: var(--space-5);
  max-width: 62ch;

  p {
    font-size: 14px;
    line-height: 1.85;
    color: var(--text-secondary);
  }
}

.about__actions {
  display: flex;
  gap: 10px;
  margin-top: var(--space-5);
}

.about__btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
  transition:
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);

  &:hover {
    transform: translateY(-1px);
    border-color: var(--accent);
    color: var(--text-primary);
  }
}

.about__btn--primary {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--bg);

  &:hover {
    background: var(--accent-dark);
    border-color: var(--accent-dark);
    color: var(--surface);
  }
}

.about__section {
  margin-top: var(--space-8);
}

.about__section-title {
  font-size: 17px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
}

.currently {
  margin-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.currently__item {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border-light);
}

.currently__label {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.currently__value {
  font-size: 14px;
}

.tech {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.tech__label {
  margin-bottom: 10px;
  font-size: 11.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.elsewhere {
  margin-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.elsewhere__link {
  display: grid;
  grid-template-columns: minmax(0, 200px) minmax(0, 1fr) auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4) 2px;
  border-bottom: 1px solid var(--border-light);
  transition: background-color var(--dur) var(--ease);

  &:hover {
    background: color-mix(in srgb, var(--surface) 55%, transparent);

    svg {
      transform: translate(2px, -2px);
      color: var(--accent-dark);
    }
  }

  svg {
    transition: transform var(--dur) var(--ease);
    color: var(--text-tertiary);
  }
}

.elsewhere__label {
  font-size: 14px;
  font-weight: 500;
}

.elsewhere__handle {
  color: var(--text-tertiary);
}

.interests {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.interests__item {
  padding: var(--space-4);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.interests__title {
  font-size: 13.5px;
  font-weight: 600;
}

.interests__text {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.about__foot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: var(--space-9);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-light);
  font-size: 13.5px;
  color: var(--text-secondary);

  a {
    color: var(--accent-dark);
    border-bottom: 1px solid var(--border);
  }
}

.about__foot-link {
  font-size: 13px;
  color: var(--text-secondary);

  &:hover {
    color: var(--text-primary);
  }
}

@media (max-width: 1199px) {
  .tech,
  .interests {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .about__head {
    min-height: 0;
    align-items: flex-start;
    padding-bottom: var(--space-6);
  }

  .about__intro {
    max-width: 100%;
  }

  .currently__item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .tech,
  .interests {
    grid-template-columns: 1fr;
  }

  .elsewhere__link {
    grid-template-columns: 1fr auto;
  }

  .elsewhere__handle {
    display: none;
  }
}
</style>
