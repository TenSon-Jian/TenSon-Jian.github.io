<script setup lang="ts">
/**
 * SiteBackground —— 站点统一背景组件（规范 §36 / §37）
 *
 * 兽人角色不是装饰，而是整个网站的「背景视觉语言」。
 * 本组件是唯一的背景出口：所有页面共享同一角色、同一绘画语言、同一米灰色系，
 * 各页面之间只允许调整透明度 / 位置 / 裁切 / 尺寸，绝不改变角色本身。
 *
 * 资产来源：直接从网站示意图中裁切提取（规范 §8 —— 优先复用原始素材）。
 * 提取方式：对示意图的米黄底稿做「符号偏差」抠图 ——
 *   alpha = |亮度 − 底色| / K，颜色 = 底色 ± K
 *   因此在与示意图相同的米黄底色上合成时，像素级还原示意图；
 *   换到深色主题上时，同一张图自然呈现为「浅色线稿」，无需另做一套插画。
 */
import { computed } from 'vue'
import orcHero from '@/assets/orc-hero.png'
import orcSeated from '@/assets/orc-seated.png'

type Variant = 'hero' | 'default' | 'project' | 'notes' | 'tools' | 'about' | 'error'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    /** 坐姿兽人仅用于 404：姿势不同但仍是同一角色（规范 §7 / §22） */
    art?: 'portrait' | 'seated'
    /** 固定在整个视口上的环境层，随滚动始终存在（规范 §4） */
    fixed?: boolean
    eager?: boolean
  }>(),
  { variant: 'default', art: 'portrait', fixed: false, eager: false },
)

const src = computed(() => (props.art === 'seated' ? orcSeated : orcHero))
</script>

<template>
  <div
    class="site-bg"
    :class="[`site-bg--${variant}`, { 'site-bg--fixed': fixed }]"
    aria-hidden="true"
  >
    <img
      class="site-bg__art"
      :src="src"
      alt=""
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      draggable="false"
    />
  </div>
</template>

<style scoped lang="scss">
.site-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  z-index: 0;
  // 背景体系变量，与 tokens 中声明的接口一致（规范 §36）
  opacity: var(--background-opacity, 0.16);
  transition: opacity var(--dur-slow) var(--ease);
}

.site-bg--fixed {
  position: fixed;
}

.site-bg__art {
  position: absolute;
  left: var(--background-left, auto);
  right: var(--background-right, 0);
  bottom: var(--background-bottom, 0);
  height: var(--background-height, 100%);
  width: auto;
  max-width: none;
  object-position: var(--background-position, right bottom);
  mix-blend-mode: var(--background-blend, normal);
  transform-origin: var(--background-origin, 88% 96%);
  will-change: transform;
}

/* ── 各页面的克制程度（规范 §6）────────────────────
   Hero 首页角色最明显；Projects 降低对比度；Notes 非常淡；
   Tools 以 UI 为主，角色只做局部背景；About 适度增强；404 完整展示。 */
.site-bg--hero {
  --background-opacity: 1;
  --background-height: 100%;
  --background-right: 0;
  --background-bottom: 0;
  --background-position: right bottom;
}

.site-bg--default {
  --background-opacity: 0.16;
  --background-height: 118%;
  --background-right: -6%;
  --background-bottom: -8%;
  --background-position: right bottom;
  -webkit-mask-image: var(--background-mask-default);
  mask-image: var(--background-mask-default);
}

.site-bg--project {
  --background-opacity: 0.12;
  --background-height: 112%;
  --background-right: -8%;
  --background-bottom: -10%;
  --background-position: right bottom;
  -webkit-mask-image: var(--background-mask-project);
  mask-image: var(--background-mask-project);
}

.site-bg--notes {
  --background-opacity: 0.07;
  --background-height: 128%;
  --background-right: -12%;
  --background-bottom: -14%;
  --background-position: right bottom;
  -webkit-mask-image: var(--background-mask-notes);
  mask-image: var(--background-mask-notes);
}

.site-bg--tools {
  --background-opacity: 0.06;
  --background-height: 86%;
  --background-right: -10%;
  --background-bottom: -12%;
  --background-position: right bottom;
  -webkit-mask-image: var(--background-mask-tools);
  mask-image: var(--background-mask-tools);
}

.site-bg--about {
  --background-opacity: 0.22;
  --background-height: 124%;
  --background-right: -4%;
  --background-bottom: -10%;
  --background-position: right bottom;
  -webkit-mask-image: var(--background-mask-about);
  mask-image: var(--background-mask-about);
}

.site-bg--error {
  --background-opacity: 0.94;
  --background-height: 76%;
  --background-left: 8%;
  --background-right: auto;
  --background-bottom: 0;
  --background-position: left bottom;
  --background-origin: 50% 100%;
}

/* ── Dark Mode：同一张图，靠透明度融入深灰（规范 §23）──
   资产是「符号偏差」抠图，在深底上自然变成浅色线稿。 */
:root[data-theme='dark'] {
  .site-bg--hero {
    --background-opacity: 0.24;
  }

  .site-bg--default {
    --background-opacity: 0.1;
  }

  .site-bg--project {
    --background-opacity: 0.09;
  }

  .site-bg--notes {
    --background-opacity: 0.06;
  }

  .site-bg--tools {
    --background-opacity: 0.05;
  }

  .site-bg--about {
    --background-opacity: 0.14;
  }

  .site-bg--error {
    --background-opacity: 0.3;
  }
}

/* ── 极其轻微的「活着」感（规范 §25）──
   位移与透明度都以用户察觉不到为限。 */
@media (prefers-reduced-motion: no-preference) {
  .site-bg__art {
    animation:
      orc-drift 32s ease-in-out infinite,
      orc-breathe 23s ease-in-out infinite;
  }
}

@keyframes orc-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-0.55%, -0.45%, 0) scale(1.006);
  }
}

@keyframes orc-breathe {
  0%,
  100% {
    opacity: 0.95;
  }
  50% {
    opacity: 1;
  }
}

/* ── 响应式：移动端不删除角色，只缩放 / 裁切 / 降透明度（规范 §28）── */
@media (max-width: 767px) {
  .site-bg--hero {
    --background-height: 76%;
    --background-right: -16%;
    --background-bottom: 0;
    --background-opacity: 0.6;
  }

  .site-bg--default,
  .site-bg--project,
  .site-bg--notes,
  .site-bg--tools,
  .site-bg--about {
    --background-height: 82%;
    --background-right: -26%;
    --background-bottom: -6%;
  }

  .site-bg--error {
    --background-height: 52%;
    --background-left: 4%;
    --background-bottom: 2%;
  }
}

:root[data-theme='dark'] .site-bg--hero {
  @media (max-width: 767px) {
    --background-opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-bg__art {
    animation: none;
  }
}
</style>
