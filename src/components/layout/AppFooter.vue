<script setup lang="ts">
import { Github } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'
import PawIcon from '@/components/brand/PawIcon.vue'

const year = siteConfig.copyrightYear
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <nav class="app-footer__links" aria-label="页脚导航">
        <a :href="siteConfig.links.github" target="_blank" rel="noopener noreferrer">
          <Github :size="15" :stroke-width="1.7" aria-hidden="true" />
          <span>GitHub</span>
        </a>
        <a :href="siteConfig.links.x" target="_blank" rel="noopener noreferrer">X / Twitter</a>
        <a :href="`mailto:${siteConfig.email}`">Email</a>
      </nav>

      <div class="app-footer__meta">
        <PawIcon :size="22" :opacity="0.22" />
        <span>© {{ year }} AJIAN — {{ siteConfig.tagline }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  margin-top: var(--space-9);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-light);
}

.app-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--text-tertiary);
}

.app-footer__links {
  display: flex;
  align-items: center;
  gap: var(--space-5);

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    transition: color var(--dur) var(--ease);

    &:hover {
      color: var(--text-primary);
    }
  }
}

.app-footer__meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  :deep(svg) {
    color: var(--accent);
  }
}

@media (max-width: 767px) {
  .app-footer__inner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}
</style>
