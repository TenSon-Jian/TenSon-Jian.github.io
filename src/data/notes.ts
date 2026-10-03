import { markdownToPlainText, readingMinutes } from '@/utils/markdown'
import { generateCover } from '@/utils/cover'
import type { Note } from '@/types'

// 文章正文以 Markdown 存放，构建时内联（Front Matter 语义由元数据对象承担）
import aboutSite from './notes/about-my-site.md?raw'
import springBootLog from './notes/spring-boot-project-log.md?raw'
import gamesPlaying from './notes/games-i-play.md?raw'
import quietTooling from './notes/quiet-tooling.md?raw'
import pixelArt from './notes/pixel-art-and-creative.md?raw'
import devEnvironment from './notes/dev-environment.md?raw'

interface NoteMeta {
  id: string
  slug: string
  title: string
  date: string
  category: string
  tags?: string[]
  summary?: string
  content: string
}

const raw: NoteMeta[] = [
  {
    id: 'n1',
    slug: 'about-my-site',
    title: '关于我的个人网站',
    date: '2026-09-18',
    category: 'Design',
    tags: ['Design', 'Vue', 'Life'],
    content: aboutSite,
  },
  {
    id: 'n2',
    slug: 'spring-boot-project-log',
    title: 'Spring Boot 项目开发记录',
    date: '2026-09-11',
    category: 'Backend',
    tags: ['Spring Boot', 'MySQL', 'Redis'],
    content: springBootLog,
  },
  {
    id: 'n3',
    slug: 'games-i-play',
    title: '最近在玩的游戏',
    date: '2026-08-25',
    category: 'Life',
    tags: ['Games', 'Life'],
    content: gamesPlaying,
  },
  {
    id: 'n4',
    slug: 'quiet-tooling',
    title: '把工具做小一点',
    date: '2026-08-06',
    category: 'Product',
    tags: ['Tools', 'Frontend'],
    content: quietTooling,
  },
  {
    id: 'n5',
    slug: 'pixel-art-and-creative',
    title: 'Pixel Art / Game / Creative',
    date: '2026-07-24',
    category: 'Creative',
    tags: ['Creative', 'Pixel Art'],
    content: pixelArt,
  },
  {
    id: 'n6',
    slug: 'dev-environment',
    title: '我的开发环境与常用快捷操作',
    date: '2026-07-02',
    category: 'Workflow',
    tags: ['Workflow', 'Tools'],
    content: devEnvironment,
  },
]

export const notes: Note[] = raw
  .map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    date: item.date,
    category: item.category,
    tags: item.tags ?? [],
    summary: item.summary ?? markdownToPlainText(item.content, 92),
    content: item.content,
    cover: generateCover({ seed: item.slug, kind: undefined }),
    readingMinutes: readingMinutes(item.content),
  }))
  .sort((a, b) => +new Date(b.date) - +new Date(a.date))

export function findNote(slug: string): Note | undefined {
  return notes.find((note) => note.slug === slug)
}

export function adjacentNotes(slug: string): { prev?: Note; next?: Note } {
  const index = notes.findIndex((note) => note.slug === slug)
  if (index === -1) return {}
  return { prev: notes[index + 1], next: notes[index - 1] }
}

export const noteCategories = Array.from(new Set(notes.map((note) => note.category)))
