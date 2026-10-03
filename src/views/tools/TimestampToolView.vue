<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import CopyButton from '@/components/tools/CopyButton.vue'
import { formatDateTime, relativeTime } from '@/utils/format'

const now = ref(Date.now())
const tsInput = ref(String(Math.floor(Date.now() / 1000)))
const dateInput = ref(toLocalInput(new Date()))

let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => window.clearInterval(timer))

function toLocalInput(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 自动判断秒 / 毫秒 */
const parsed = computed(() => {
  const raw = tsInput.value.trim()
  if (!raw) return null
  if (!/^-?\d+$/.test(raw)) return { error: '请输入纯数字时间戳' as const }

  const value = Number(raw)
  const isSeconds = Math.abs(value) < 1e11
  const ms = isSeconds ? value * 1000 : value
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return { error: '时间戳超出可表示范围' as const }

  return { date, ms, unit: isSeconds ? ('秒' as const) : ('毫秒' as const) }
})

const outputs = computed(() => {
  const result = parsed.value
  if (!result || 'error' in result) return []
  const date = result.date
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return [
    { label: '本地时间', value: formatDateTime(date) },
    { label: 'UTC', value: date.toUTCString() },
    { label: 'ISO 8601', value: date.toISOString() },
    { label: '星期', value: weekdays[date.getDay()] },
    { label: '相对现在', value: relativeTime(date.getTime()) },
    { label: '识别单位', value: result.unit },
  ]
})

const dateToTs = computed(() => {
  if (!dateInput.value) return null
  const date = new Date(dateInput.value)
  if (Number.isNaN(date.getTime())) return null
  return { seconds: Math.floor(date.getTime() / 1000), ms: date.getTime() }
})

function useNow() {
  tsInput.value = String(Math.floor(Date.now() / 1000))
  dateInput.value = toLocalInput(new Date())
}

watch(
  () => dateInput.value,
  (value) => {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      tsInput.value = String(Math.floor(date.getTime() / 1000))
    }
  },
)

const currentSeconds = computed(() => Math.floor(now.value / 1000))
</script>

<template>
  <ToolPage title="Timestamp" description="Unix 时间戳与可读时间互转，自动识别秒与毫秒。">
    <ToolGrid>
      <ToolPanel label="当前时间">
        <template #actions>
          <ToolButton @click="useNow">使用当前时间</ToolButton>
        </template>

        <div class="now">
          <div class="now__item">
            <span class="now__label">秒</span>
            <code class="now__value mono">{{ currentSeconds }}</code>
            <CopyButton :value="String(currentSeconds)" />
          </div>
          <div class="now__item">
            <span class="now__label">毫秒</span>
            <code class="now__value mono">{{ now }}</code>
            <CopyButton :value="String(now)" />
          </div>
          <p class="now__readable">{{ formatDateTime(now) }}</p>
        </div>

        <div class="fields">
          <label class="field">
            <span>时间戳</span>
            <input v-model="tsInput" type="text" class="mono" spellcheck="false" placeholder="1700000000" />
          </label>
          <label class="field">
            <span>日期时间（本地）</span>
            <input v-model="dateInput" type="datetime-local" class="mono" />
          </label>
        </div>

        <template #footer>
          <span v-if="parsed && 'error' in parsed" class="error-text">{{ parsed.error }}</span>
          <span v-else>小于 1e11 的数字按「秒」解析，其余按「毫秒」</span>
        </template>
      </ToolPanel>

      <ToolPanel label="转换结果">
        <ul v-if="outputs.length" class="values">
          <li v-for="row in outputs" :key="row.label" class="values__row">
            <span class="values__label">{{ row.label }}</span>
            <code class="values__value mono">{{ row.value }}</code>
            <CopyButton :value="row.value" />
          </li>
        </ul>
        <p v-else class="placeholder">输入合法的时间戳后显示结果。</p>

        <template #footer>
          <div v-if="dateToTs" class="reverse">
            <span>反向：{{ dateToTs.seconds }} 秒</span>
            <CopyButton :value="String(dateToTs.seconds)" />
          </div>
        </template>
      </ToolPanel>
    </ToolGrid>
  </ToolPage>
</template>

<style scoped lang="scss">
.now {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.now__item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--code-bg);
}

.now__label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.now__value {
  font-size: 14px;
  letter-spacing: 0.02em;
}

.now__readable {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
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
    width: 100%;

    &:focus {
      border-color: var(--accent);
    }
  }
}

.values {
  display: flex;
  flex-direction: column;
}

.values__row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: 9px 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.values__label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.values__value {
  font-size: 12.5px;
  overflow-wrap: anywhere;
}

.placeholder {
  font-size: 13px;
  color: var(--text-tertiary);
}

.error-text {
  color: var(--danger);
}

.reverse {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

@media (max-width: 767px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
