<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteBackground from '@/components/brand/SiteBackground.vue'
import PawIcon from '@/components/brand/PawIcon.vue'
</script>

<template>
  <div class="page notfound">
    <!-- 404 是全站中可以最明显展示兽人的地方（规范 §22），
         但角色與背景仍直接延续示意图中的同一套兽人视觉体系。 -->
    <SiteBackground variant="error" art="seated" eager />

    <!-- 示意图中的爪印与地面阴影，作为同一视觉世界的点缀 -->
    <div class="notfound__paws" aria-hidden="true">
      <PawIcon class="paw paw--1" :size="26" :opacity="0.28" />
      <PawIcon class="paw paw--2" :size="20" :opacity="0.22" />
      <PawIcon class="paw paw--3" :size="30" :opacity="0.2" />
      <PawIcon class="paw paw--4" :size="18" :opacity="0.26" />
    </div>

    <div class="notfound__text">
      <p class="notfound__code">404</p>
      <h1 class="notfound__title">
        Looks like something<br />
        got lost.
      </h1>
      <p class="notfound__desc">
        这个地址没有对应的页面。它可能被移动过，或者从来没有存在过。
      </p>

      <div class="notfound__actions">
        <RouterLink to="/" class="notfound__btn notfound__btn--primary">
          Back to Home
          <span aria-hidden="true">→</span>
        </RouterLink>
        <RouterLink to="/projects" class="notfound__btn">View Projects</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notfound {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  min-height: 68vh;
  padding: var(--space-7) 0;
  overflow: hidden;
}

// 文字在右，角色在左 —— 与示意图的 404 构图一致
.notfound__text {
  position: relative;
  z-index: 1;
  grid-column: 2;
}

.notfound__code {
  font-size: clamp(72px, 12vw, 128px);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.05em;
  color: var(--text-primary);
  opacity: 0.9;
}

.notfound__title {
  margin-top: var(--space-4);
  font-size: clamp(22px, 3.2vw, 30px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.notfound__desc {
  margin-top: var(--space-4);
  max-width: 44ch;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.notfound__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: var(--space-6);
}

.notfound__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 18px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  font-size: 13.5px;
  color: var(--text-secondary);
  transition:
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);

  span {
    transition: transform var(--dur) var(--ease);
  }

  &:hover {
    transform: translateY(-1px);
    border-color: var(--accent);
    color: var(--text-primary);

    span {
      transform: translateX(2px);
    }
  }
}

.notfound__btn--primary {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--bg);

  &:hover {
    background: var(--accent-dark);
    border-color: var(--accent-dark);
    color: var(--surface);
  }
}

// ── 爪印：与示意图同一套装饰语言 ──
.notfound__paws {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.paw {
  position: absolute;
  color: var(--accent);

  &--1 {
    left: 6%;
    top: 12%;
    transform: rotate(-12deg);
  }

  &--2 {
    left: 30%;
    top: 22%;
    transform: rotate(9deg);
  }

  &--3 {
    left: 14%;
    bottom: 12%;
    transform: rotate(6deg);
  }

  &--4 {
    right: 8%;
    bottom: 16%;
    transform: rotate(-8deg);
  }
}

@media (max-width: 767px) {
  .notfound {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: var(--space-5);
    padding: var(--space-5) 0 var(--space-6);
  }

  .notfound__text {
    grid-column: 1;
  }

  .notfound__code {
    font-size: clamp(60px, 22vw, 96px);
  }

  .paw--1,
  .paw--2 {
    top: 4%;
  }
}
</style>
