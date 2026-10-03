<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolPage from '@/components/tools/ToolPage.vue'
import ToolPanel from '@/components/tools/ToolPanel.vue'
import ToolGrid from '@/components/tools/ToolGrid.vue'
import ToolButton from '@/components/tools/ToolButton.vue'
import CopyButton from '@/components/tools/CopyButton.vue'
import {
  contrastRatio,
  hexToRgb,
  hslToRgb,
  normalizeHex,
  randomHex,
  rgbToHex,
  rgbToHsl,
} from '@/utils/color'

const hex = ref('#8F887A')

const rgb = computed(() => hexToRgb(hex.value) ?? { r: 0, g: 0, b: 0 })
const hsl = computed(() => rgbToHsl(rgb.value))

const hexValue = computed(() => rgbToHex(rgb.value))
const rgbValue = computed(() => `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`)
const hslValue = computed(() => `hsl(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%)`)

/** 当前色相对站点的浅色 / 深色背景的对比度 */
const contrastOnLight = computed(() =>
  contrastRatio(rgb.value, { r: 243, g: 238, b: 223 }).toFixed(2),
)
const contrastOnDark = computed(() =>
  contrastRatio(rgb.value, { r: 32, g: 32, b: 31 }).toFixed(2),
)

const onHexInput = (value: string) => {
  const normalized = normalizeHex(value)
  if (normalized) hex.value = normalized
}

const setChannel = (key: 'h' | 's' | 'l', value: number) => {
  const next = { ...hsl.value, [key]: Number(value) }
  hex.value = rgbToHex(hslToRgb(next))
}

const rows = computed(() => [
  { label: 'HEX', value: hexValue.value },
  { label: 'RGB', value: rgbValue.value },
  { label: 'HSL', value: hslValue.value },
])
</script>

<template>
  <ToolPage title="Color Converter" description="HEX / RGB / HSL 互相转换，并给出与该站点配色的对比度参考。">
    <ToolGrid>
      <ToolPanel label="Input">
        <template #actions>
          <ToolButton variant="quiet" @click="hex = randomHex()">随机</ToolButton>
        </template>

        <div class="picker">
          <input
            :value="hexValue"
            type="color"
            class="picker__native"
            aria-label="选择颜色"
            @input="onHexInput(($event.target as HTMLInputElement).value)"
          />
          <div class="picker__fields">
            <label class="field">
              <span>HEX</span>
              <input
                :value="hex"
                type="text"
                spellcheck="false"
                class="mono"
                @input="onHexInput(($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="field">
              <span>R</span>
              <input
                :value="rgb.r"
                type="number"
                min="0"
                max="255"
                @input="hex = rgbToHex({ ...rgb, r: Number(($event.target as HTMLInputElement).value) })"
              />
            </label>
            <label class="field">
              <span>G</span>
              <input
                :value="rgb.g"
                type="number"
                min="0"
                max="255"
                @input="hex = rgbToHex({ ...rgb, g: Number(($event.target as HTMLInputElement).value) })"
              />
            </label>
            <label class="field">
              <span>B</span>
              <input
                :value="rgb.b"
                type="number"
                min="0"
                max="255"
                @input="hex = rgbToHex({ ...rgb, b: Number(($event.target as HTMLInputElement).value) })"
              />
            </label>
          </div>
        </div>

        <div class="sliders">
          <label class="slider">
            <span class="slider__label">H {{ hsl.h }}°</span>
            <input
              :value="hsl.h"
              type="range"
              min="0"
              max="360"
              @input="setChannel('h', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="slider">
            <span class="slider__label">S {{ hsl.s }}%</span>
            <input
              :value="hsl.s"
              type="range"
              min="0"
              max="100"
              @input="setChannel('s', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="slider">
            <span class="slider__label">L {{ hsl.l }}%</span>
            <input
              :value="hsl.l"
              type="range"
              min="0"
              max="100"
              @input="setChannel('l', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </div>

        <template #footer>拖动滑块或直接输入数值即可实时转换</template>
      </ToolPanel>

      <ToolPanel label="Output">
        <div class="preview" :style="{ background: hexValue }">
          <span class="preview__sample" :style="{ color: hexValue }">Sample text</span>
        </div>

        <ul class="values">
          <li v-for="row in rows" :key="row.label" class="values__row">
            <span class="values__label">{{ row.label }}</span>
            <code class="values__value mono">{{ row.value }}</code>
            <CopyButton :value="row.value" label="复制" />
          </li>
        </ul>

        <template #footer>
          <div class="contrast">
            <span>与站点浅色底对比度 {{ contrastOnLight }}</span>
            <span>与深色底对比度 {{ contrastOnDark }}</span>
          </div>
        </template>
      </ToolPanel>
    </ToolGrid>
  </ToolPage>
</template>

<style scoped lang="scss">
.picker {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.picker__native {
  width: 74px;
  height: 74px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: none;
  cursor: pointer;
}

.picker__fields {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text-tertiary);

  input {
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--code-bg);
    font-size: 12.5px;
    outline: none;
    width: 100%;

    &:focus {
      border-color: var(--accent);
    }
  }
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: var(--space-4);
}

.slider {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.slider__label {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-secondary);
}

input[type='range'] {
  accent-color: var(--accent-dark);
  width: 100%;
}

.preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 108px;
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  transition: background-color var(--dur) var(--ease);
}

.preview__sample {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: 13px;
  font-weight: 500;
}

.values {
  display: flex;
  flex-direction: column;
  margin-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

.values__row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.values__label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.values__value {
  font-size: 12.5px;
  color: var(--text-primary);
}

.contrast {
  display: flex;
  gap: var(--space-5);
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .picker {
    flex-direction: column;
  }

  .picker__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
