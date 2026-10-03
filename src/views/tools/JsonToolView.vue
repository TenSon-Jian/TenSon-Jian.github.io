<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import CopyButton from '@/components/tools/CopyButton.vue'

const input = ref('')
const output = ref('')
const error = ref('')
const indent = ref(2)
const dirty = ref(false)

const sample = `{
  "name": "AJIAN",
  "role": "Developer / Builder / Student",
  "stack": ["Vue 3", "TypeScript", "Vite"],
  "quiet": true,
  "projects": 18
}`

/** 从 JSON.parse 的错误信息里提取出错位置，尽量给出人话提示 */
function describeError(message: string, source: string): string {
  const positionMatch = /position (\d+)/.exec(message)
  if (!positionMatch) return message

  const position = Number(positionMatch[1])
  const before = source.slice(0, position)
  const line = before.split('\n').length
  const column = position - before.lastIndexOf('\n')
  return `${message}（第 ${line} 行，第 ${column} 个字符附近）`
}

function parse(): unknown | undefined {
  if (!input.value.trim()) {
    output.value = ''
    error.value = ''
    return undefined
  }
  try {
    const value = JSON.parse(input.value)
    error.value = ''
    return value
  } catch (err) {
    error.value = describeError((err as Error).message, input.value)
    output.value = ''
    return undefined
  }
}

function format() {
  const value = parse()
  if (value === undefined) return
  output.value = JSON.stringify(value, null, indent.value)
  dirty.value = true
}

function minify() {
  const value = parse()
  if (value === undefined) return
  output.value = JSON.stringify(value)
  dirty.value = true
}

function validate() {
  const value = parse()
  if (value === undefined) {
    if (!input.value.trim()) error.value = '请输入 JSON 内容'
    return
  }
  output.value = '✓ JSON 语法正确'
  dirty.value = true
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  dirty.value = false
}

const stats = computed(() => {
  if (!input.value.trim()) return null
  const lines = input.value.split('\n').length
  return { lines, chars: input.value.length }
})
</script>

<template>
  <ToolPage title="JSON Formatter" description="格式化 / 压缩 JSON，并在语法错误时定位到具体位置。">
    <ToolGrid>
      <ToolPanel label="Input">
        <template #actions>
          <ToolButton variant="quiet" @click="input = sample">示例</ToolButton>
          <ToolButton variant="quiet" :disabled="!input" @click="clearAll">清空</ToolButton>
        </template>
        <textarea
          v-model="input"
          class="editor"
          rows="16"
          spellcheck="false"
          placeholder='粘贴 JSON，例如 { "hello": "world" }'
          aria-label="JSON 输入"
        />
        <template #footer>
          <span v-if="stats">{{ stats.lines }} 行 · {{ stats.chars }} 字符</span>
          <span v-else>等待输入</span>
        </template>
      </ToolPanel>

      <ToolPanel label="Output">
        <template #actions>
          <label class="indent-picker">
            缩进
            <select v-model.number="indent" aria-label="缩进空格数">
              <option :value="2">2</option>
              <option :value="4">4</option>
              <option :value="8">8</option>
            </select>
          </label>
          <ToolButton variant="primary" @click="format">格式化</ToolButton>
          <ToolButton @click="minify">压缩</ToolButton>
          <ToolButton @click="validate">校验</ToolButton>
        </template>

        <p v-if="error" class="error-box" role="alert">{{ error }}</p>
        <pre v-else-if="output" class="output mono">{{ output }}</pre>
        <p v-else class="placeholder">格式化结果会显示在这里。</p>

        <template #footer>
          <div class="output-foot">
            <span>{{ error ? '解析失败' : output ? '解析成功' : '空闲' }}</span>
            <CopyButton v-if="output && !error && dirty" :value="output" />
          </div>
        </template>
      </ToolPanel>
    </ToolGrid>

    <p class="tool-note">
      实现方式：<code class="inline">JSON.parse</code> 校验 → <code class="inline">JSON.stringify</code> 输出，
      全程在浏览器内完成。
    </p>
  </ToolPage>
</template>

<style scoped lang="scss">
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
  tab-size: 2;
}

.editor:focus {
  border-color: var(--accent);
}

.output {
  margin: 0;
  max-height: 420px;
  overflow: auto;
  white-space: pre;
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
  font-family: var(--font-mono);
}

.indent-picker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-tertiary);

  select {
    height: 26px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 12px;
    padding: 0 6px;
  }
}

.output-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.tool-note {
  font-size: 12.5px;
  color: var(--text-tertiary);

  code.inline {
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    background: var(--code-bg);
    border: 1px solid var(--code-border);
  }
}
</style>
