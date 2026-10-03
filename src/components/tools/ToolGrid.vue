<script setup lang="ts">
/** 工具页共用的双栏布局：输入在左，输出在右；移动端自动堆叠 */
</script>

<template>
  <div class="tool-grid">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: start;
}

@media (max-width: 900px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
