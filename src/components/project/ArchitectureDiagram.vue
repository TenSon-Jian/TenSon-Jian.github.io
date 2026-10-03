<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ArchitectureSpec } from '@/types'

/**
 * 技术架构图：用 HTML + CSS 绘制，不使用静态图片。
 *  - 节点可 Hover，Hover 后高亮相关连接，其余淡化
 *  - 连接线上有非常缓慢的流动点，不使用发光效果
 */
const props = defineProps<{ spec: ArchitectureSpec }>()

const activeNode = ref<string | null>(null)

const nodeIndex = computed(() => {
  const map = new Map<string, { layer: number; node: number }>()
  props.spec.layers.forEach((layer, layerIdx) => {
    layer.nodes.forEach((node, nodeIdx) => {
      map.set(node.id, { layer: layerIdx, node: nodeIdx })
    })
  })
  return map
})

/** 当前高亮节点集合：自身 + 直接连接的上下游 */
const highlighted = computed(() => {
  const id = activeNode.value
  if (!id) return null

  const set = new Set<string>([id])
  const position = nodeIndex.value.get(id)
  if (!position) return set

  const layer = props.spec.layers[position.layer]
  const node = layer.nodes[position.node]
  node.connectsTo?.forEach((target) => set.add(target))

  // 反向：谁连接到我
  props.spec.layers.forEach((item) => {
    item.nodes.forEach((candidate) => {
      if (candidate.connectsTo?.includes(id)) set.add(candidate.id)
    })
  })

  return set
})

/** 相邻两层之间存在高亮链路时，连接线保持可见 */
function isConnectorActive(layerIndex: number): boolean {
  if (!highlighted.value) return true
  const currentLayer = props.spec.layers[layerIndex]
  const nextLayer = props.spec.layers[layerIndex + 1]
  if (!nextLayer) return false

  return props.spec.layers.some((layer, index) => {
    if (index !== layerIndex && index !== layerIndex + 1) return false
    return layer.nodes.some((node) => highlighted.value?.has(node.id))
  }) && currentLayer.nodes.length > 0
}

const onEnter = (id: string) => (activeNode.value = id)
const onLeave = () => (activeNode.value = null)
</script>

<template>
  <div class="arch" @mouseleave="onLeave">
    <div
      v-for="(layer, layerIndex) in spec.layers"
      :key="layer.id"
      class="arch__layer"
      :class="`arch__layer--${layer.kind ?? 'service'}`"
    >
      <div class="arch__nodes">
        <button
          v-for="node in layer.nodes"
          :key="node.id"
          type="button"
          class="arch__node"
          :class="{
            'is-active': activeNode === node.id,
            'is-related': highlighted?.has(node.id) && activeNode !== node.id,
            'is-dimmed': highlighted !== null && !highlighted.has(node.id),
          }"
          :aria-pressed="activeNode === node.id"
          @mouseenter="onEnter(node.id)"
          @focus="onEnter(node.id)"
          @blur="onLeave"
          @click="activeNode = activeNode === node.id ? null : node.id"
        >
          <span class="arch__node-label">{{ node.label }}</span>
          <span v-if="node.meta" class="arch__node-meta">{{ node.meta }}</span>
        </button>
      </div>

      <div
        v-if="layerIndex < spec.layers.length - 1"
        class="arch__connector"
        :class="{ 'is-muted': highlighted !== null && !isConnectorActive(layerIndex) }"
        aria-hidden="true"
      >
        <span class="arch__connector-line" />
        <span class="arch__connector-dot" />
        <span class="arch__connector-arrow" />
      </div>
    </div>

    <p class="arch__hint">Hover 或点击节点可查看相关链路</p>
  </div>
</template>

<style scoped lang="scss">
.arch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: var(--space-6) var(--space-5);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 70%, transparent), transparent 60%),
    var(--surface-secondary);
}

.arch__layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.arch__nodes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

.arch__node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 118px;
  padding: 12px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 1px 2px var(--shadow);
  transition:
    transform var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease),
    opacity var(--dur) var(--ease);

  &:hover,
  &.is-active {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 8px 20px var(--shadow);
  }

  &.is-related {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent-soft) 60%, var(--surface));
  }

  &.is-dimmed {
    opacity: 0.42;
  }
}

.arch__node-label {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.arch__node-meta {
  font-size: 11px;
  color: var(--text-tertiary);
}

.arch__layer--client .arch__node {
  border-style: dashed;
}

.arch__layer--data .arch__node {
  background: var(--surface-secondary);
}

// ── 连接线 ──
.arch__connector {
  position: relative;
  width: 2px;
  height: 54px;
  margin: 2px 0;
  transition: opacity var(--dur) var(--ease);

  &.is-muted {
    opacity: 0.25;
  }
}

.arch__connector-line {
  position: absolute;
  inset: 0 auto 0 0;
  width: 1.5px;
  background: var(--border);
}

.arch__connector-arrow {
  position: absolute;
  bottom: -1px;
  left: 50%;
  width: 7px;
  height: 7px;
  border-right: 1.5px solid var(--border);
  border-bottom: 1.5px solid var(--border);
  transform: translateX(-50%) rotate(45deg);
}

// 缓慢流动的点：节奏很慢，不使用发光
.arch__connector-dot {
  position: absolute;
  left: 50%;
  top: 0;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.55;
  animation: arch-flow 3.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

@keyframes arch-flow {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  20% {
    opacity: 0.6;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(50px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arch__connector-dot {
    animation: none;
    opacity: 0.45;
  }
}

.arch__hint {
  margin-top: var(--space-5);
  font-size: 11.5px;
  color: var(--text-tertiary);
}
</style>
