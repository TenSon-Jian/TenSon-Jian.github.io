<script setup lang="ts">
/**
 * 爪印：仅用于 Empty State、Cursor 与加载态，
 * 保持极简圆点构成，不做写实。
 */
withDefaults(defineProps<{ size?: number; opacity?: number }>(), { size: 28, opacity: 0.28 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    :style="{ opacity }"
  >
    <ellipse cx="16" cy="21" rx="6.4" ry="5.2" />
    <ellipse cx="9.2" cy="13.6" rx="2.6" ry="3.2" transform="rotate(-14 9.2 13.6)" />
    <ellipse cx="14.4" cy="10.6" rx="2.6" ry="3.4" />
    <ellipse cx="20.2" cy="10.6" rx="2.6" ry="3.4" />
    <ellipse cx="24.9" cy="13.6" rx="2.6" ry="3.2" transform="rotate(14 24.9 13.6)" />
  </svg>
</template>
