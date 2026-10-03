import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 元素滚动进入视口后淡入，用于「延迟展示」的次要内容。
 * 尊重 prefers-reduced-motion。
 */
export function useReveal<T extends Element = HTMLElement>(): Ref<T | null> {
  const el = ref<T | null>(null) as Ref<T | null>
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const node = el.value
    if (!node) return

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce || typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible')
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    observer.observe(node)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return el
}
