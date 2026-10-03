<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import { formatBytes } from '@/utils/format'

type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png'

const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)

const originalSrc = ref('')
const originalName = ref('')
const originalSize = ref(0)
const originalType = ref('')
const originalDimensions = ref<{ width: number; height: number } | null>(null)

const resultSrc = ref('')
const resultSize = ref(0)
const resultDimensions = ref<{ width: number; height: number } | null>(null)

const quality = ref(0.8)
const maxWidth = ref(1600)
const format = ref<OutputFormat>('image/jpeg')
const error = ref('')
const processing = ref(false)

const ratio = computed(() => {
  if (!originalSize.value || !resultSize.value) return null
  const saved = 1 - resultSize.value / originalSize.value
  return Math.round(saved * 100)
})

function pickFile() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (files?.[0]) loadFile(files[0])
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  dragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

function loadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件（PNG / JPEG / WebP / GIF）'
    return
  }
  error.value = ''
  originalName.value = file.name
  originalSize.value = file.size
  originalType.value = file.type
  resultSrc.value = ''
  resultSize.value = 0

  if (originalSrc.value) URL.revokeObjectURL(originalSrc.value)
  originalSrc.value = URL.createObjectURL(file)

  const image = new Image()
  image.onload = () => {
    originalDimensions.value = { width: image.naturalWidth, height: image.naturalHeight }
    void process()
  }
  image.src = originalSrc.value
}

/** 纯浏览器本地压缩：Canvas 重绘 → toBlob */
async function process() {
  if (!originalSrc.value) return
  processing.value = true
  error.value = ''

  try {
    const image = await loadImage(originalSrc.value)
    const targetWidth = Math.min(maxWidth.value || image.naturalWidth, image.naturalWidth)
    const scale = targetWidth / image.naturalWidth
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器不支持 Canvas 2D')

    // JPEG 没有透明通道，先铺一层白底，避免透明区域变黑
    if (format.value === 'image/jpeg') {
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, targetWidth, targetHeight)
    }
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, targetWidth, targetHeight)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, format.value, format.value === 'image/png' ? undefined : quality.value),
    )
    if (!blob) throw new Error('压缩失败，请尝试其它格式')

    resultSrc.value = URL.createObjectURL(blob)
    resultSize.value = blob.size
    resultDimensions.value = { width: targetWidth, height: targetHeight }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '处理失败'
  } finally {
    processing.value = false
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解码失败'))
    image.src = src
  })
}

function download() {
  if (!resultSrc.value) return
  const extension = format.value.split('/')[1].replace('jpeg', 'jpg')
  const base = originalName.value.replace(/\.[^.]+$/, '') || 'image'
  const link = document.createElement('a')
  link.href = resultSrc.value
  link.download = `${base}-compressed.${extension}`
  link.click()
}

function reset() {
  if (originalSrc.value) URL.revokeObjectURL(originalSrc.value)
  if (resultSrc.value) URL.revokeObjectURL(resultSrc.value)
  originalSrc.value = ''
  resultSrc.value = ''
  originalSize.value = 0
  resultSize.value = 0
  originalName.value = ''
  originalDimensions.value = null
  resultDimensions.value = null
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

onBeforeUnmount(() => {
  if (originalSrc.value) URL.revokeObjectURL(originalSrc.value)
  if (resultSrc.value) URL.revokeObjectURL(resultSrc.value)
})
</script>

<template>
  <ToolPage
    title="Image Compressor"
    description="在浏览器本地压缩与调整尺寸。图片只经过 Canvas 处理，不会上传到任何服务器。"
  >
    <ToolGrid>
      <ToolPanel label="选择图片">
        <template #actions>
          <ToolButton variant="quiet" :disabled="!originalSrc" @click="reset">重置</ToolButton>
        </template>

        <div
          class="dropzone"
          :class="{ 'is-active': dragActive, 'has-file': originalSrc }"
          role="button"
          tabindex="0"
          :aria-label="originalSrc ? '重新选择图片' : '选择或拖拽图片'"
          @click="pickFile"
          @keydown.enter.prevent="pickFile"
          @keydown.space.prevent="pickFile"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop="onDrop"
        >
          <template v-if="!originalSrc">
            <p class="dropzone__title">拖拽图片到此处，或点击选择</p>
            <p class="dropzone__hint">支持 PNG / JPEG / WebP，全部在本地处理</p>
          </template>
          <img v-else :src="originalSrc" :alt="originalName" class="dropzone__preview" />
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFileChange"
        />

        <div class="controls">
          <label class="control">
            <span class="control__label">质量 {{ Math.round(quality * 100) }}%</span>
            <input
              v-model.number="quality"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              :disabled="format === 'image/png'"
              @change="process"
            />
          </label>

          <label class="control">
            <span class="control__label">最大宽度（px）</span>
            <input v-model.number="maxWidth" type="number" min="64" max="6000" @change="process" />
          </label>

          <label class="control">
            <span class="control__label">输出格式</span>
            <select v-model="format" @change="process">
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/png">PNG</option>
            </select>
          </label>

          <ToolButton variant="primary" :disabled="!originalSrc || processing" @click="process">
            {{ processing ? '处理中…' : '重新压缩' }}
          </ToolButton>
        </div>

        <template #footer>
          <span v-if="error" class="error-text">{{ error }}</span>
          <span v-else-if="originalDimensions">
            原始尺寸 {{ originalDimensions.width }} × {{ originalDimensions.height }}
          </span>
          <span v-else>选择图片后自动压缩</span>
        </template>
      </ToolPanel>

      <ToolPanel label="压缩结果">
        <template #actions>
          <ToolButton variant="primary" :disabled="!resultSrc" @click="download">下载</ToolButton>
        </template>

        <div v-if="resultSrc" class="result">
          <img :src="resultSrc" alt="压缩后的图片" class="result__preview" />
          <ul class="result__stats">
            <li>
              <span>原始大小</span>
              <code class="mono">{{ formatBytes(originalSize) }}</code>
            </li>
            <li>
              <span>压缩后</span>
              <code class="mono">{{ formatBytes(resultSize) }}</code>
            </li>
            <li v-if="resultDimensions">
              <span>输出尺寸</span>
              <code class="mono">{{ resultDimensions.width }} × {{ resultDimensions.height }}</code>
            </li>
            <li v-if="ratio !== null">
              <span>节省</span>
              <code class="mono" :class="{ 'is-negative': ratio < 0 }">
                {{ ratio >= 0 ? `-${ratio}%` : `+${Math.abs(ratio)}%` }}
              </code>
            </li>
          </ul>
        </div>

        <p v-else class="placeholder">选择图片后在这里预览压缩结果。</p>

        <template #footer>
          使用 Canvas 2D 重绘，不保留 EXIF；质量仅对 JPEG / WebP 生效
        </template>
      </ToolPanel>
    </ToolGrid>
  </ToolPage>
</template>

<style scoped lang="scss">
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 180px;
  padding: var(--space-4);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface-secondary);
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--dur) var(--ease),
    background-color var(--dur) var(--ease);

  &:hover,
  &.is-active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &.has-file {
    padding: 0;
    border-style: solid;
    background: var(--code-bg);
  }
}

.dropzone__title {
  font-size: 13.5px;
  color: var(--text-primary);
}

.dropzone__hint {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.dropzone__preview {
  max-height: 260px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.controls {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-top: var(--space-4);
}

.control {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: var(--text-tertiary);

  input[type='number'],
  select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: 12.5px;
    outline: none;
    width: 130px;
  }

  input[type='range'] {
    width: 150px;
    accent-color: var(--accent-dark);
  }
}

.result {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.result__preview {
  max-height: 260px;
  width: auto;
  max-width: 100%;
  margin-inline: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
}

.result__stats {
  display: flex;
  flex-direction: column;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 8px 0;
    border-bottom: 1px solid var(--border-light);
    font-size: 12px;
    color: var(--text-secondary);

    &:last-child {
      border-bottom: none;
    }
  }
}

.is-negative {
  color: var(--danger);
}

.placeholder {
  font-size: 13px;
  color: var(--text-tertiary);
}

.error-text {
  color: var(--danger);
}
</style>
