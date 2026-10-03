<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    /** 右侧操作区插槽标题 */
    hint?: string
  }>(),
  {},
)
</script>

<template>
  <section class="panel">
    <header v-if="label || $slots.actions" class="panel__head">
      <span class="panel__label">{{ label }}</span>
      <div class="panel__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="panel__body">
      <slot />
    </div>
    <footer v-if="$slots.footer || hint" class="panel__foot">
      <slot name="footer">
        <span class="panel__hint">{{ hint }}</span>
      </slot>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.panel {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface-secondary);
}

.panel__label {
  font-size: 11.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel__body {
  padding: 14px;
}

.panel__foot {
  padding: 8px 14px;
  border-top: 1px solid var(--border-light);
  font-size: 11.5px;
  color: var(--text-tertiary);
}
</style>
