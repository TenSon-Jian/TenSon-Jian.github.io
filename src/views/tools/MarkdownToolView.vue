<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import MarkdownView from '@/components/note/MarkdownView.vue'
import { renderMarkdown } from '@/utils/markdown'
import { copyText } from '@/utils/format'

const sample = `# 标题一

这是一段普通文本，支持 **粗体**、*斜体*、~~删除线~~ 与 \`行内代码\`。

## 标题二

- 列表项一
- 列表项二

1. 有序项
2. 有序项

> 引用：把工具做小一点。

\`\`\`ts
const quiet = (input: string) => input.trim()
\`\`\`

| 工具 | 说明 |
| --- | --- |
| JSON | 格式化 |
| Regex | 匹配 |
`

const source = ref(sample)
const view = ref<'split' | 'preview'>('split')
const copied = ref(false)

const html = computed(() => renderMarkdown(source.value))

async function copyHtml() {
  const ok = await copyText(html.value)
  if (!ok) return
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <ToolPage title="Markdown Preview" description="实时渲染 Markdown，支持表格、引用、代码块与语法高亮。">
    <template #default>
      <div class="md-toolbar">
        <div class="view-switch" role="group" aria-label="视图切换">
          <button
            type="button"
            class="filter-chip"
            :class="{ 'is-active': view === 'split' }"
            :aria-pressed="view === 'split'"
            @click="view = 'split'"
          >
            双栏
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ 'is-active': view === 'preview' }"
            :aria-pressed="view === 'preview'"
            @click="view = 'preview'"
          >
            仅预览
          </button>
        </div>
        <div class="md-actions">
          <ToolButton variant="quiet" @click="source = sample">示例</ToolButton>
          <ToolButton variant="quiet" @click="source = ''">清空</ToolButton>
          <ToolButton :disabled="!html" @click="copyHtml">{{ copied ? '已复制 HTML' : '复制 HTML' }}</ToolButton>
        </div>
      </div>

      <div class="md-grid" :class="{ 'md-grid--single': view === 'preview' }">
        <ToolPanel v-if="view === 'split'" label="Markdown">
          <textarea
            v-model="source"
            class="editor"
            rows="22"
            spellcheck="false"
            aria-label="Markdown 输入"
            placeholder="在这里输入 Markdown…"
          />
          <template #footer>{{ source.length }} 字符</template>
        </ToolPanel>

        <ToolPanel label="Preview">
          <div class="preview">
            <MarkdownView :html="html" empty-text="开始输入后即可预览。" />
          </div>
        </ToolPanel>
      </div>
    </template>
  </ToolPage>
</template>

<style scoped lang="scss">
.md-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin: calc(-1 * var(--space-1)) 0 var(--space-4);
}

.view-switch {
  display: flex;
  gap: 6px;
}

.filter-chip {
  height: 28px;
  padding: 0 12px;
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

.md-actions {
  display: flex;
  gap: 8px;
}

.md-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.md-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.editor {
  width: 100%;
  border: 1px solid var(--code-border);
  border-radius: var(--radius);
  background: var(--code-bg);
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--text-primary);
  resize: vertical;
  outline: none;

  &:focus {
    border-color: var(--accent);
  }
}

.preview {
  max-height: 560px;
  overflow: auto;
  padding-right: 4px;
}

@media (max-width: 900px) {
  .md-grid {
    grid-template-columns: 1fr;
  }
}
</style>
