<script setup lang="ts">
import type { ButtonVariant } from '@/types/ui'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'ghost', disabled: false, type: 'button' },
)
</script>

<template>
  <button :type="type" class="tbtn" :class="`tbtn--${variant}`" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.tbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius);
  font-size: 12.5px;
  white-space: nowrap;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.tbtn--primary {
  background: var(--text-primary);
  color: var(--bg);

  &:hover:not(:disabled) {
    background: var(--accent-dark);
    color: var(--surface);
  }
}

.tbtn--ghost {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);

  &:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--text-primary);
  }
}

.tbtn--quiet {
  border: 1px solid transparent;
  color: var(--text-tertiary);

  &:hover:not(:disabled) {
    color: var(--text-primary);
    background: var(--surface-secondary);
  }
}
</style>
