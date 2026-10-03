<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { copyText } from '@/utils/format'

const props = withDefaults(
  defineProps<{ value: string; label?: string; disabled?: boolean }>(),
  { label: '复制' },
)

const copied = ref(false)
let timer: number | undefined

async function onCopy() {
  if (props.disabled) return
  const ok = await copyText(props.value)
  if (!ok) return
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <button
    type="button"
    class="copy-button"
    :class="{ 'is-copied': copied }"
    :disabled="disabled"
    :aria-label="copied ? '已复制' : label"
    @click="onCopy"
  >
    <Check v-if="copied" :size="14" :stroke-width="2" aria-hidden="true" />
    <Copy v-else :size="14" :stroke-width="1.8" aria-hidden="true" />
    <span>{{ copied ? '已复制' : label }}</span>
  </button>
</template>

<style scoped lang="scss">
.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  transition:
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    background-color var(--dur) var(--ease);

  &:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-copied {
    color: var(--success);
    border-color: var(--success);
  }
}
</style>
