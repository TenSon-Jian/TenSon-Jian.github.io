<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { copyText } from '@/utils/format'

/**
 * Markdown 渲染内容的容器。
 * 渲染完成后为每个代码块挂上「复制」按钮（规范第 19 节）。
 */
const props = defineProps<{ html: string; emptyText?: string }>()

const root = ref<HTMLElement | null>(null)
const copiedIndex = ref<number | null>(null)

function decorateCodeBlocks() {
  const host = root.value
  if (!host) return

  host.querySelectorAll<HTMLElement>('.code-block').forEach((block, index) => {
    if (block.querySelector('.code-block__copy')) return

    const head = block.querySelector('.code-block__head')
    if (!head) return

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'code-block__copy'
    button.setAttribute('aria-label', '复制代码')
    button.innerHTML = '<span>复制</span>'

    button.addEventListener('click', async () => {
      const code = block.querySelector('code')?.textContent ?? ''
      const ok = await copyText(code)
      if (!ok) return
      copiedIndex.value = index
      button.classList.add('is-copied')
      button.innerHTML = '<span>已复制</span>'
      window.setTimeout(() => {
        button.classList.remove('is-copied')
        button.innerHTML = '<span>复制</span>'
        if (copiedIndex.value === index) copiedIndex.value = null
      }, 1600)
    })

    head.appendChild(button)
  })
}

onMounted(decorateCodeBlocks)
watch(
  () => props.html,
  async () => {
    await nextTick()
    decorateCodeBlocks()
  },
)
</script>

<template>
  <div ref="root" class="markdown-body" v-html="html" />
  <p v-if="!html && emptyText" class="markdown-empty">{{ emptyText }}</p>
</template>

<style lang="scss">
// 非 scoped：内容由 v-html 注入，需要全局样式覆盖
.markdown-body {
  font-size: 15px;
  line-height: 1.85;
  color: var(--text-primary);

  > * + * {
    margin-top: 1.1em;
  }

  h1,
  h2,
  h3 {
    letter-spacing: -0.015em;
    scroll-margin-top: 96px;
  }

  h1 {
    font-size: 26px;
    font-weight: 700;
    margin-top: 1.8em;
  }

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin-top: 2em;
    padding-bottom: 0.4em;
    border-bottom: 1px solid var(--border-light);
  }

  h3 {
    font-size: 16.5px;
    font-weight: 600;
    margin-top: 1.6em;
  }

  p {
    color: var(--text-primary);
  }

  a.md-link {
    color: var(--accent-dark);
    border-bottom: 1px solid var(--border);
    transition: border-color var(--dur) var(--ease);

    &:hover {
      border-color: var(--accent-dark);
    }
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
    color: var(--text-secondary);
  }

  del {
    color: var(--text-tertiary);
  }

  ul,
  ol {
    padding-left: 1.4em;

    li {
      list-style: disc;
      margin-top: 0.4em;
    }
  }

  ol li {
    list-style: decimal;
  }

  blockquote {
    margin: 1.4em 0;
    padding: 2px 0 2px 18px;
    border-left: 2px solid var(--border);
    color: var(--text-secondary);
    font-style: normal;
  }

  hr {
    margin: 2.4em 0;
    border-top: 1px solid var(--border-light);
  }

  .inline-code {
    padding: 2px 5px;
    border-radius: var(--radius-sm);
    background: var(--code-bg);
    border: 1px solid var(--code-border);
    font-size: 0.86em;
    color: var(--accent-dark);
  }

  .md-image {
    border-radius: var(--radius);
    border: 1px solid var(--border-light);
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border-light);
    border-radius: var(--radius);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }

  th,
  td {
    padding: 9px 14px;
    text-align: left;
    border-bottom: 1px solid var(--border-light);
  }

  th {
    background: var(--surface-secondary);
    font-weight: 600;
    white-space: nowrap;
  }

  tr:last-child td {
    border-bottom: none;
  }

  // ── 代码块 ──
  .code-block {
    position: relative;
    border: 1px solid var(--code-border);
    border-radius: var(--radius);
    background: var(--code-bg);
    overflow: hidden;
  }

  .code-block__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 6px 10px 6px 14px;
    border-bottom: 1px solid var(--code-border);
    background: color-mix(in srgb, var(--surface) 45%, transparent);
  }

  .code-block__lang {
    font-family: var(--font-mono);
    font-size: 11.5px;
    text-transform: lowercase;
    color: var(--text-tertiary);
  }

  .code-block__copy {
    padding: 2px 9px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 11.5px;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease);

    &:hover {
      color: var(--text-primary);
      border-color: var(--accent);
    }

    &.is-copied {
      color: var(--success);
      border-color: var(--success);
    }
  }

  pre.code-block__body {
    margin: 0;
    padding: 14px 16px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.7;
    tab-size: 2;

    code {
      font-family: var(--font-mono);
      white-space: pre;
    }
  }

  // ── 语法着色：只用低饱和度的灰棕色阶 ──
  .tok-comment {
    color: var(--text-tertiary);
    font-style: italic;
  }

  .tok-keyword {
    color: var(--accent-dark);
    font-weight: 500;
  }

  .tok-string {
    color: var(--success);
  }

  .tok-number {
    color: var(--warn);
  }

  .tok-builtin {
    color: var(--text-primary);
    font-weight: 500;
  }

  .tok-function {
    color: var(--text-primary);
  }
}

.markdown-empty {
  color: var(--text-tertiary);
  font-size: 13.5px;
}
</style>
