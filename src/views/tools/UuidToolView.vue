<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import CopyButton from '@/components/tools/CopyButton.vue'
import { copyText } from '@/utils/format'

/** UUID v4：优先使用 Web Crypto，退化到 Math.random */
function uuidV4(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const count = ref(8)
const uppercase = ref(false)
const noDash = ref(false)
const list = ref<string[]>([])

function generate() {
  const total = Math.min(1000, Math.max(1, Math.floor(Number(count.value) || 1)))
  count.value = total
  list.value = Array.from({ length: total }, () => {
    let value = uuidV4()
    if (noDash.value) value = value.replace(/-/g, '')
    if (uppercase.value) value = value.toUpperCase()
    return value
  })
}

const joined = computed(() => list.value.join('\n'))
const allCopied = ref(false)

async function copyAll() {
  const ok = await copyText(joined.value)
  if (!ok) return
  allCopied.value = true
  window.setTimeout(() => (allCopied.value = false), 1600)
}

onMounted(generate)
</script>

<template>
  <ToolPage title="UUID Generator" description="批量生成 UUID v4，可切换大小写与是否保留连字符。">
    <ToolGrid>
      <ToolPanel label="参数">
        <div class="options">
          <label class="field">
            <span>生成数量</span>
            <input v-model.number="count" type="number" min="1" max="1000" />
          </label>

          <label class="checkbox">
            <input v-model="uppercase" type="checkbox" />
            <span>大写</span>
          </label>

          <label class="checkbox">
            <input v-model="noDash" type="checkbox" />
            <span>去掉连字符</span>
          </label>
        </div>

        <div class="actions">
          <ToolButton variant="primary" @click="generate">重新生成</ToolButton>
          <ToolButton :disabled="!list.length" @click="copyAll">
            {{ allCopied ? '已复制全部' : '复制全部' }}
          </ToolButton>
        </div>

        <template #footer>
          预览：<code class="mono">{{ list[0] ?? '—' }}</code>
        </template>
      </ToolPanel>

      <ToolPanel label="结果">
        <template #actions>
          <span class="count-label">{{ list.length }} 个</span>
        </template>
        <ol class="uuid-list mono">
          <li v-for="(item, index) in list" :key="`${item}-${index}`">
            <span class="uuid-list__index">{{ `${index + 1}`.padStart(2, '0') }}</span>
            <span class="uuid-list__value">{{ item }}</span>
            <CopyButton :value="item" label="复制" />
          </li>
        </ol>
        <template #footer>
          <span>生成于浏览器本地，不涉及网络请求</span>
        </template>
      </ToolPanel>
    </ToolGrid>
  </ToolPage>
</template>

<style scoped lang="scss">
.options {
  display: flex;
  align-items: flex-end;
  gap: var(--space-5);
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: var(--text-tertiary);

  input {
    width: 110px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 12.5px;
    outline: none;

    &:focus {
      border-color: var(--accent);
    }
  }
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);

  input {
    accent-color: var(--accent-dark);
  }
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: var(--space-5);
}

.count-label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.uuid-list {
  display: flex;
  flex-direction: column;
  max-height: 400px;
  overflow: auto;
}

.uuid-list li {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-light);
  font-size: 12.5px;

  &:last-child {
    border-bottom: none;
  }
}

.uuid-list__index {
  color: var(--text-tertiary);
}

.uuid-list__value {
  overflow-wrap: anywhere;
}
</style>
