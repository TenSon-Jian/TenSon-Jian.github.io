<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = defineProps<{
  items: Array<{ src: string; alt: string }>
  index: number | null
}>()

const emit = defineEmits<{ (event: 'close'): void; (event: 'update:index', value: number): void }>()

const current = ref(0)
const closeButton = ref<HTMLButtonElement | null>(null)
/** 打开前的焦点，关闭后要还回去（规范 §32 键盘可达性） */
let restoreFocus: HTMLElement | null = null

watch(
  () => props.index,
  (value, previous) => {
    if (value !== null) {
      current.value = value
      if (previous === null) {
        restoreFocus = (document.activeElement as HTMLElement) ?? null
        void nextTick(() => closeButton.value?.focus())
      }
    } else if (previous !== null) {
      restoreFocus?.focus?.()
      restoreFocus = null
    }
  },
  { immediate: true },
)

function close() {
  emit('close')
}

function step(delta: number) {
  const next = (current.value + delta + props.items.length) % props.items.length
  current.value = next
  emit('update:index', next)
}

function onKeydown(event: KeyboardEvent) {
  if (props.index === null) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') step(1)
  if (event.key === 'ArrowLeft') step(-1)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="index !== null"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="图片查看"
        @click.self="close"
      >
        <button
          ref="closeButton"
          type="button"
          class="lightbox__close"
          aria-label="关闭"
          @click="close"
        >
          <X :size="20" :stroke-width="1.7" aria-hidden="true" />
        </button>

        <button
          v-if="items.length > 1"
          type="button"
          class="lightbox__nav lightbox__nav--prev"
          aria-label="上一张"
          @click.stop="step(-1)"
        >
          <ChevronLeft :size="22" :stroke-width="1.6" aria-hidden="true" />
        </button>

        <figure class="lightbox__figure" @click.stop>
          <img :src="items[current].src" :alt="items[current].alt" />
          <figcaption>
            {{ items[current].alt }}
            <span class="lightbox__counter">{{ current + 1 }} / {{ items.length }}</span>
          </figcaption>
        </figure>

        <button
          v-if="items.length > 1"
          type="button"
          class="lightbox__nav lightbox__nav--next"
          aria-label="下一张"
          @click.stop="step(1)"
        >
          <ChevronRight :size="22" :stroke-width="1.6" aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--overlay);
  backdrop-filter: blur(6px);
  animation: fade-in var(--dur) var(--ease) both;
}

.lightbox__figure {
  margin: 0;
  max-width: min(1080px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 12px;

  img {
    width: 100%;
    max-height: 78vh;
    object-fit: contain;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: 0 24px 60px var(--shadow-strong);
  }

  figcaption {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    font-size: 12.5px;
    color: color-mix(in srgb, #fff 78%, transparent);
  }
}

.lightbox__counter {
  opacity: 0.7;
}

.lightbox__close,
.lightbox__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  border: 1px solid color-mix(in srgb, #fff 22%, transparent);
  background: color-mix(in srgb, #000 26%, transparent);
  color: #f5f1e7;
  transition:
    background-color var(--dur) var(--ease),
    transform var(--dur) var(--ease);
  flex: none;

  &:hover {
    background: color-mix(in srgb, #000 44%, transparent);
  }
}

.lightbox__close {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
}

.lightbox__nav--prev:hover {
  transform: translateX(-2px);
}

.lightbox__nav--next:hover {
  transform: translateX(2px);
}

// 放大：Opacity + Scale + Backdrop（规范 §17）
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity var(--dur) var(--ease);

  .lightbox__figure {
    transition:
      transform var(--dur-slow) var(--ease),
      opacity var(--dur-slow) var(--ease);
  }
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;

  .lightbox__figure {
    opacity: 0;
    transform: scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-enter-from .lightbox__figure,
  .lightbox-leave-to .lightbox__figure {
    transform: none;
  }
}

@media (max-width: 767px) {
  .lightbox {
    padding: var(--space-4);
    flex-direction: column;
  }

  .lightbox__nav {
    position: absolute;
    bottom: var(--space-5);
  }

  .lightbox__nav--prev {
    left: var(--space-5);
  }

  .lightbox__nav--next {
    right: var(--space-5);
  }
}
</style>
