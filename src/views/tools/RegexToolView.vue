<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import CopyButton from '@/components/tools/CopyButton.vue'

const pattern = ref('(\\w+)@(\\w+)\\.com')
type FlagKey = 'g' | 'i' | 'm' | 's' | 'u'
const flagKeys: FlagKey[] = ['g', 'i', 'm', 's', 'u']
const flags = ref<Record<FlagKey, boolean>>({ g: true, i: false, m: false, s: false, u: false })
const text = ref(`联系我们：hello@ajian.com
备用邮箱：support@dev.com
无效行：not-an-email`)
const replacement = ref('[$1 at $2]')

const toggleFlag = (flag: FlagKey) => {
  flags.value[flag] = !flags.value[flag]
}

const flagString = computed(() => flagKeys.filter((flag) => flags.value[flag]).join(''))

const compiled = computed(() => {
  if (!pattern.value) return { regex: null, error: '' }
  try {
    return { regex: new RegExp(pattern.value, flagString.value), error: '' }
  } catch (err) {
    return { regex: null, error: (err as Error).message }
  }
})

interface MatchInfo {
  index: number
  value: string
  groups: string[]
  named: Record<string, string>
}

const matches = computed<MatchInfo[]>(() => {
  const regex = compiled.value.regex
  if (!regex || !text.value) return []

  const result: MatchInfo[] = []
  const global = regex.flags.includes('g')
  const runner = global ? new RegExp(regex.source, regex.flags) : regex

  let match: RegExpExecArray | null
  let guard = 0

  while ((match = runner.exec(text.value)) !== null) {
    guard += 1
    if (guard > 5000) break

    result.push({
      index: match.index,
      value: match[0],
      groups: match.slice(1).map((group) => group ?? ''),
      named: { ...(match.groups ?? {}) },
    })

    if (!global) break
    if (match[0] === '') runner.lastIndex += 1
  }

  return result
})

/** 用 <mark> 标注匹配位置，输入内容全部转义 */
const highlighted = computed(() => {
  const regex = compiled.value.regex
  if (!regex || !text.value) return escapeHtml(text.value)

  const global = regex.flags.includes('g')
  const runner = global ? new RegExp(regex.source, regex.flags) : regex
  let output = ''
  let last = 0
  let guard = 0
  let match: RegExpExecArray | null

  while ((match = runner.exec(text.value)) !== null) {
    guard += 1
    if (guard > 5000) break

    output += escapeHtml(text.value.slice(last, match.index))
    output += `<mark class="hit">${escapeHtml(match[0]) || '&nbsp;'}</mark>`
    last = match.index + match[0].length

    if (!global) break
    if (match[0] === '') runner.lastIndex += 1
  }

  output += escapeHtml(text.value.slice(last))
  return output
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const replaced = computed(() => {
  const regex = compiled.value.regex
  if (!regex || !text.value) return ''
  try {
    return text.value.replace(regex, replacement.value)
  } catch (err) {
    return `替换失败：${(err as Error).message}`
  }
})

const PRESETS = [
  { label: '邮箱', value: '(\\w+)@(\\w+)\\.com' },
  { label: '手机号', value: '1[3-9]\\d{9}' },
  { label: 'URL', value: 'https?://[\\w.-]+(?:/[\\w./?%&=-]*)?' },
  { label: '日期', value: '(\\d{4})-(\\d{2})-(\\d{2})' },
  { label: '中文字符', value: '[\\u4e00-\\u9fa5]+' },
]
</script>

<template>
  <ToolPage title="Regex Tester" description="实时匹配、分组高亮与替换预览，正则只在浏览器内执行。">
    <ToolGrid>
      <ToolPanel label="正则表达式">
        <template #actions>
          <CopyButton :value="`/${pattern}/${flagString}`" label="复制" />
        </template>

        <div class="pattern">
          <span class="pattern__delimiter">/</span>
          <input
            v-model="pattern"
            type="text"
            class="mono pattern__input"
            spellcheck="false"
            placeholder="输入正则"
            aria-label="正则表达式"
          />
          <span class="pattern__delimiter">/{{ flagString }}</span>
        </div>

        <div class="flags">
          <label v-for="flag in flagKeys" :key="flag" class="checkbox">
            <input type="checkbox" :checked="flags[flag]" @change="toggleFlag(flag)" />
            <span class="mono">{{ flag }}</span>
          </label>
        </div>

        <div class="presets">
          <button v-for="preset in PRESETS" :key="preset.label" type="button" class="preset" @click="pattern = preset.value">
            {{ preset.label }}
          </button>
        </div>

        <template #footer>
          <span v-if="compiled.error" class="error-text">{{ compiled.error }}</span>
          <span v-else>{{ matches.length }} 处匹配</span>
        </template>
      </ToolPanel>

      <ToolPanel label="测试文本">
        <textarea v-model="text" class="editor" rows="8" spellcheck="false" aria-label="测试文本" />
        <div class="highlight mono" v-html="highlighted" />
        <template #footer>匹配位置以浅色标记</template>
      </ToolPanel>
    </ToolGrid>

    <ToolGrid>
      <ToolPanel label="匹配详情">
        <ol v-if="matches.length" class="matches">
          <li v-for="(match, index) in matches" :key="`${match.index}-${index}`" class="matches__item">
            <div class="matches__head">
              <span class="matches__index">#{{ index + 1 }}</span>
              <code class="matches__value mono">{{ match.value }}</code>
              <span class="matches__pos">位置 {{ match.index }}</span>
            </div>
            <ul v-if="match.groups.length" class="matches__groups">
              <li v-for="(group, groupIndex) in match.groups" :key="groupIndex">
                <span class="mono">${{ groupIndex + 1 }}</span>
                <code class="mono">{{ group || '(空)' }}</code>
              </li>
            </ul>
            <ul v-if="Object.keys(match.named).length" class="matches__groups">
              <li v-for="(value, key) in match.named" :key="key">
                <span class="mono">{{ key }}</span>
                <code class="mono">{{ value }}</code>
              </li>
            </ul>
          </li>
        </ol>
        <p v-else class="placeholder">没有匹配结果。</p>
      </ToolPanel>

      <ToolPanel label="替换预览">
        <label class="field">
          <span>替换为（支持 $1、$&lt;name&gt;）</span>
          <input v-model="replacement" type="text" class="mono" spellcheck="false" />
        </label>
        <pre class="output mono">{{ replaced || '—' }}</pre>
        <template #footer>
          <div class="replace-foot">
            <span>结果不写回测试文本</span>
            <ToolButton :disabled="!replaced" @click="text = replaced">应用替换</ToolButton>
          </div>
        </template>
      </ToolPanel>
    </ToolGrid>
  </ToolPage>
</template>

<style scoped lang="scss">
.pattern {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--code-bg);
  transition: border-color var(--dur) var(--ease);

  &:focus-within {
    border-color: var(--accent);
  }
}

.pattern__delimiter {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-tertiary);
}

.pattern__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
}

.flags {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-3);
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-secondary);

  input {
    accent-color: var(--accent-dark);
  }
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-4);
}

.preset {
  height: 26px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 11.5px;
  transition:
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease);

  &:hover {
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

.highlight {
  margin-top: var(--space-3);
  padding: 12px 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--surface-secondary);
  font-size: 12.5px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 220px;
  overflow: auto;

  :deep(.hit) {
    background: var(--accent-soft);
    border-bottom: 1px solid var(--accent);
    color: var(--text-primary);
    border-radius: 2px;
  }
}

.matches {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow: auto;
}

.matches__item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.matches__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.matches__index {
  font-size: 11px;
  color: var(--text-tertiary);
}

.matches__value {
  font-size: 12.5px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
}

.matches__pos {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
}

.matches__groups {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: 6px;

  li {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    color: var(--text-secondary);
  }
}

.output {
  margin: var(--space-3) 0 0;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: var(--text-tertiary);

  input {
    height: 34px;
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

.replace-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.placeholder {
  font-size: 13px;
  color: var(--text-tertiary);
}

.error-text {
  color: var(--danger);
}
</style>
