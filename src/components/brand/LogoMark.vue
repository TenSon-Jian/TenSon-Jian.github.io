<script setup lang="ts">
/**
 * 极简个人品牌标识：抽象兽耳 + 头顶轮廓。
 * 只有三笔线条，不使用写实兽人头像。
 */
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>

<template>
  <svg
    class="logo-mark"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M4.6 16.4c0-4.2 3.3-7.4 7.4-7.4s7.4 3.2 7.4 7.4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M6 12.1 5.5 5.5c-.06-.9.95-1.4 1.6-.8l3.2 3"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path
      d="M18 12.1l.5-6.6c.06-.9-.95-1.4-1.6-.8l-3.2 3"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped lang="scss">
.logo-mark {
  display: block;
  color: var(--accent);
  transition: color var(--dur) var(--ease);
}
</style>
