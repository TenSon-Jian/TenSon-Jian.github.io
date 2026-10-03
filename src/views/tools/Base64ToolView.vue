<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import CopyButton from '@/components/tools/CopyButton.vue'
import { decodeBase64, encodeBase64 } from '@/utils/color'

type Mode = 'encode' | 'decode'

const mode = ref<Mode>('encode')
const input = ref('')
const urlSafe = ref(false)

const output = computed(() => {
  const value = input.value
  if (!value.trim()) return { text: '', error: '' }

  try {
    if (mode.value === 'encode') {
      let encoded = encodeBase64(value)
      if (urlSafe.value) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      return { text: encoded, error: '' }
    }

    let normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/')
    const remainder = normalized.length % 4
    if (remainder) normalized += '='.repeat(4 - remainder)
    return { text: decodeBase64(normalized), error: '' }
  } catch {
    return {
      text: '',
      error: mode.value === 'decode' ? '不是合法的 Base64 字符串' : '编码失败，请检查输入',
    }
  }
})

const stats = computed(() => {
  const inputBytes = new TextEncoder().encode(input.value).length
  const outputBytes = output.value.text.length
  return { inputBytes, outputBytes }
})

function swap() {
  if (!output.value.text) return
  input.value = output.value.text
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
}
</script>

<template>
  <ToolPage title="Base64 Encoder" description="文本与 Base64 互转，完整支持 UTF-8 中文与 emoji。">
    <ToolGrid>
      <ToolPanel label="输入">
        <template #actions>
          <div class="mode-switch" role="group" aria-label="模式切换">
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-active': mode === 'encode' }"
              :aria-pressed="mode === 'encode'"
              @click="mode = 'encode'"
            >
              编码
            </button>
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-active': mode === 'decode' }"
              :aria-pressed="mode === 'decode'"
              @click="mode = 'decode'"
            >
              解码
            </button>
          </div>
        </template>

        <textarea
          v-model="input"
          class="editor"
          rows="10"
          spellcheck="false"
          :placeholder="mode === 'encode' ? '输入要编码的文本，例如：你好，AJIAN' : '粘贴 Base64 字符串'"
          aria-label="输入内容"
        />

        <div class="options">
          <label v-if="mode === 'encode'" class="checkbox">
            <input v-model="urlSafe" type="checkbox" />
            <span>URL Safe（- _ 且无 = 填充）</span>
          </label>
          <span class="options__stat">
            输入 {{ stats.inputBytes }} 字节 · 输出 {{ stats.outputBytes }} 字符
          </span>
        </div>

        <template #footer>
          <ToolButton variant="quiet" @click="input = ''">清空</ToolButton>
        </template>
      </ToolPanel>

      <ToolPanel label="输出">
        <template #actions>
          <ToolButton :disabled="!output.text" @click="swap">反向转换</ToolButton>
          <CopyButton :value="output.text" :disabled="!output.text" />
        </template>

        <p v-if="output.error" class="error-box" role="alert">{{ output.error }}</p>
        <pre v-else-if="output.text" class="output mono">{{ output.text }}</pre>
        <p v-else class="placeholder">结果会实时显示在这里。</p>

        <template #footer>使用 TextEncoder / TextDecoder 处理 UTF-8，避免中文乱码</template>
      </ToolPanel>
    </ToolGrid>
  </ToolPage>
</template>

<style scoped lang="scss">
.mode-switch {
  display: flex;
  gap: 6px;
}

.filter-chip {
  height: 26px;
  padding: 0 11px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease);

  &.is-active {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--text-primary);
  }
}

.editor,
.output {
  width: 100%;
  border: 1px solid var(--code-border);
  border-radius: var(--radius);
  background: var(--code-bg);
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-primary);
  resize: vertical;
  outline: none;
}

.editor:focus {
  border-color: var(--accent);
}

.output {
  margin: 0;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-top: var(--space-3);
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

.options__stat {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.placeholder {
  font-size: 13px;
  color: var(--text-tertiary);
}

.error-box {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--danger) 45%, transparent);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
  font-size: 12.5px;
}
</style>
