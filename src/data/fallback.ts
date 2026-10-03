import type { GithubProfile, GithubRepo, GithubStats, Project } from '@/types'

/**
 * 离线回退数据。
 * GitHub API 不可用（公司网络拦截 / 速率限制 / 离线）时，
 * 网站依然使用这份数据完整呈现，不会白屏。
 */

export const fallbackProfile: GithubProfile = {
  login: 'ajian',
  name: 'AJIAN',
  avatar_url: '',
  bio: 'Developer / Builder / Student — Building things quietly.',
  company: null,
  location: 'China',
  blog: 'https://ajian.dev',
  html_url: 'https://github.com/ajian',
  public_repos: 18,
  followers: 36,
  following: 24,
}

/**
 * 离线统计值 = 设计稿中的固定数值（示意图与规范第 11 节：18 / 42 / 36）。
 * 联网时统计值由 GitHub API 实时汇总，不再使用这里的数字。
 */
export const fallbackStats: GithubStats = {
  repositories: fallbackProfile.public_repos,
  stars: 42,
  followers: fallbackProfile.followers,
  following: fallbackProfile.following,
}

function repo(input: Partial<GithubRepo> & { name: string }): GithubRepo {
  const now = new Date('2026-09-15T10:00:00Z')
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()
  return {
    id: Math.abs(hash(input.name)),
    full_name: `ajian/${input.name}`,
    description: null,
    html_url: `https://github.com/ajian/${input.name}`,
    homepage: null,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
    watchers_count: 0,
    topics: [],
    created_at: daysAgo(400),
    updated_at: daysAgo(3),
    pushed_at: daysAgo(3),
    fork: false,
    archived: false,
    size: 2048,
    ...input,
  } as GithubRepo
}

function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i)
    h |= 0
  }
  return h
}

export const fallbackRepos: GithubRepo[] = [
  repo({
    name: 'RMS',
    description:
      'Restaurant Management System — 一套面向中小型餐饮门店的综合管理系统，覆盖点餐、库存、采购与财务。',
    language: 'Java',
    stargazers_count: 32,
    forks_count: 12,
    topics: ['spring-boot', 'vue', 'mysql', 'redis', 'mybatis'],
  }),
  repo({
    name: 'library-system',
    description: '图书借阅管理系统，支持借还、预约、逾期提醒与馆藏统计。',
    language: 'Java',
    stargazers_count: 11,
    forks_count: 4,
    topics: ['spring-boot', 'mybatis', 'vue'],
  }),
  repo({
    name: 'game-forum',
    description: '一个小型游戏社区论坛，支持发帖、评论、标签与图片上传。',
    language: 'Vue',
    stargazers_count: 7,
    forks_count: 2,
    topics: ['vue', 'nodejs', 'oss'],
  }),
  repo({
    name: 'qiwo-admin',
    description: '后台管理系统模板：权限、菜单、表单与图表开箱即用。',
    language: 'TypeScript',
    stargazers_count: 9,
    forks_count: 3,
    topics: ['vue3', 'typescript', 'vite'],
  }),
  repo({
    name: 'ajian-blog',
    description: '本站源码：极简个人博客与 GitHub 作品集，Vue 3 + Vite。',
    language: 'TypeScript',
    stargazers_count: 5,
    forks_count: 1,
    topics: ['vue3', 'blog', 'github-api'],
  }),
  repo({
    name: 'tiny-tools',
    description: '纯前端小工具箱：JSON、颜色、时间戳、Base64、正则。',
    language: 'TypeScript',
    stargazers_count: 4,
    forks_count: 0,
    topics: ['tools', 'frontend'],
  }),
]

// ─────────────────────────────────────────────
// 项目档案（详情页使用的静态资料，与 GitHub 数据互补）
// ─────────────────────────────────────────────

export const projects: Project[] = [
  {
    id: 'rms',
    name: '智店通餐饮综合管理系统',
    slug: 'rms',
    description:
      'A lightweight restaurant management system for small and medium-sized restaurants.',
    language: 'Java',
    technologies: ['Spring Boot', 'Vue', 'MySQL', 'MyBatis-Plus', 'Redis'],
    stars: 32,
    forks: 12,
    updatedAt: '2026-09-12T08:00:00Z',
    repositoryUrl: 'https://github.com/ajian/RMS',
    demoUrl: 'https://demo.ajian.dev/rms',
    featured: true,
    type: '全栈 · 团队项目（7 人）',
    period: '2025.09 — 2026.06',
    overview:
      '智店通是一套面向中小型餐饮门店的综合管理系统，将点餐、库存、采购、财务等日常经营环节收敛到一个后台里。项目以 Spring Boot 提供 RESTful 接口，Vue 3 构建管理端，MySQL 承载业务数据，Redis 负责会话与热点缓存，图片资源存放在对象存储。',
    highlights: [
      '点餐到出品链路完整闭环，高峰期单店订单处理稳定',
      '库存与采购联动，缺货自动生成采购建议',
      'Redis 缓存菜单与桌台状态，接口平均响应 < 80ms',
    ],
    features: [
      { no: '01', title: '用户与权限', summary: '基于 RBAC 的角色权限模型，支持门店级数据隔离。' },
      { no: '02', title: '菜品管理', summary: '分类、规格、做法与图片维护，支持批量上下架。' },
      { no: '03', title: '点餐管理', summary: '桌台扫码点餐、加菜、退菜与结账的完整流程。' },
      { no: '04', title: '库存管理', summary: '原料出入库记录与安全库存预警。' },
      { no: '05', title: '采购管理', summary: '根据库存缺口生成采购单并跟踪到货。' },
      { no: '06', title: '财务管理', summary: '日结、流水与营业报表导出。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'vue', label: 'Vue', connectsTo: ['api'], meta: 'Vue 3 · Vite' }] },
        {
          id: 'gateway',
          label: 'Gateway',
          kind: 'api',
          nodes: [{ id: 'api', label: 'RESTful API', connectsTo: ['boot'], meta: 'JWT · 统一响应' }],
        },
        {
          id: 'service',
          label: 'Service',
          kind: 'service',
          nodes: [{ id: 'boot', label: 'Spring Boot', connectsTo: ['mysql', 'redis', 'oss'], meta: '分层架构 · MyBatis-Plus' }],
        },
        {
          id: 'data',
          label: 'Storage',
          kind: 'data',
          nodes: [
            { id: 'mysql', label: 'MySQL', meta: '业务数据' },
            { id: 'redis', label: 'Redis', meta: '缓存 · 会话' },
            { id: 'oss', label: 'OSS', meta: '图片资源' },
          ],
        },
      ],
    },
  },
  {
    id: 'library-system',
    name: '图书借阅管理系统',
    slug: 'library-system',
    description:
      'Library management system with borrowing, reservation and overdue notification.',
    language: 'Java',
    technologies: ['Spring Boot', 'MyBatis', 'Vue', 'MySQL'],
    stars: 11,
    forks: 4,
    updatedAt: '2026-08-02T08:00:00Z',
    repositoryUrl: 'https://github.com/ajian/library-system',
    featured: true,
    type: '全栈 · 课程设计',
    period: '2025.03 — 2025.06',
    overview:
      '图书借阅管理系统面向学校与小型图书馆，覆盖读者管理、借还、预约、逾期提醒与馆藏统计。后端以 Spring Boot + MyBatis 实现，前端使用 Vue 3。',
    highlights: ['借还与预约状态机清晰，避免重复占用', '逾期自动计算罚金并生成提醒', '馆藏统计按分类与时间维度聚合'],
    features: [
      { no: '01', title: '读者管理', summary: '读者档案、借阅额度与状态维护。' },
      { no: '02', title: '图书管理', summary: 'ISBN 录入、分类与馆藏副本管理。' },
      { no: '03', title: '借还流程', summary: '扫码借还，自动计算应还日期。' },
      { no: '04', title: '预约与提醒', summary: '预约队列与到期邮件提醒。' },
      { no: '05', title: '统计分析', summary: '借阅热度、分类分布与月度报表。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'vue', label: 'Vue', connectsTo: ['api'], meta: 'Vue 3' }] },
        { id: 'gateway', label: 'Gateway', kind: 'api', nodes: [{ id: 'api', label: 'RESTful API', connectsTo: ['boot'], meta: 'Session 鉴权' }] },
        { id: 'service', label: 'Service', kind: 'service', nodes: [{ id: 'boot', label: 'Spring Boot', connectsTo: ['mysql', 'sched'], meta: 'MyBatis' }] },
        {
          id: 'data',
          label: 'Storage',
          kind: 'data',
          nodes: [
            { id: 'mysql', label: 'MySQL', meta: '业务数据' },
            { id: 'sched', label: 'Scheduler', meta: '逾期扫描' },
          ],
        },
      ],
    },
  },
  {
    id: 'game-forum',
    name: '游戏社区论坛',
    slug: 'game-forum',
    description: 'A small community forum for players — posts, comments, tags and uploads.',
    language: 'Vue',
    technologies: ['Vue', 'Node.js', 'MySQL', 'OSS'],
    stars: 7,
    forks: 2,
    updatedAt: '2026-07-18T08:00:00Z',
    repositoryUrl: 'https://github.com/ajian/game-forum',
    featured: true,
    type: '全栈 · 个人项目',
    period: '2025.11 — 2026.01',
    overview:
      '一个轻量的游戏社区论坛，支持发帖、评论、标签、图片上传与简单的热度排序。前端 Vue 3，服务端 Node.js + MySQL，图片走对象存储。',
    highlights: ['标签与热度排序，冷启动即可用', '图片直传对象存储，不经过应用服务器', '移动端优先的排版'],
    features: [
      { no: '01', title: '帖子', summary: 'Markdown 发帖与草稿保存。' },
      { no: '02', title: '评论', summary: '两级评论与 @ 提醒。' },
      { no: '03', title: '标签', summary: '标签聚合与热门话题。' },
      { no: '04', title: '上传', summary: '对象存储直传与压缩。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'vue', label: 'Vue', connectsTo: ['api'] }] },
        { id: 'gateway', label: 'Gateway', kind: 'api', nodes: [{ id: 'api', label: 'RESTful API', connectsTo: ['node'] }] },
        { id: 'service', label: 'Service', kind: 'service', nodes: [{ id: 'node', label: 'Node.js', connectsTo: ['mysql', 'oss'] }] },
        {
          id: 'data',
          label: 'Storage',
          kind: 'data',
          nodes: [
            { id: 'mysql', label: 'MySQL' },
            { id: 'oss', label: 'OSS' },
          ],
        },
      ],
    },
  },
  {
    id: 'qiwo-admin',
    name: 'Qiwo 后台管理模板',
    slug: 'qiwo-admin',
    description: 'An admin dashboard starter with auth, menus, forms and charts.',
    language: 'TypeScript',
    technologies: ['Vue 3', 'TypeScript', 'Vite', 'Pinia'],
    stars: 9,
    forks: 3,
    updatedAt: '2026-05-21T08:00:00Z',
    repositoryUrl: 'https://github.com/ajian/qiwo-admin',
    type: '前端 · 开源模板',
    period: '2025.08 — 2025.10',
    overview:
      '一个开箱即用的后台管理模板：动态菜单、按钮级权限、表单校验、图表与主题切换都已接好，业务方只需关注页面本身。',
    highlights: ['动态路由与按钮级权限', '表单与表格的通用封装', '亮暗主题与布局切换'],
    features: [
      { no: '01', title: '动态菜单', summary: '由后端权限生成路由与侧边栏。' },
      { no: '02', title: '权限指令', summary: 'v-permission 控制按钮可见性。' },
      { no: '03', title: '通用表格', summary: '查询、分页、列的配置化封装。' },
      { no: '04', title: '主题切换', summary: '亮暗主题与主色配置。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'vue', label: 'Vue 3', connectsTo: ['api'] }] },
        { id: 'gateway', label: 'Gateway', kind: 'api', nodes: [{ id: 'api', label: 'RESTful API', connectsTo: ['mock'] }] },
        { id: 'service', label: 'Service', kind: 'service', nodes: [{ id: 'mock', label: 'Mock / 后端', connectsTo: ['store'] }] },
        { id: 'data', label: 'State', kind: 'data', nodes: [{ id: 'store', label: 'Pinia', meta: '本地状态' }] },
      ],
    },
  },
  {
    id: 'ajian-blog',
    name: '本站 · AJIAN Blog',
    slug: 'ajian-blog',
    description: 'This site — a quiet personal blog and GitHub portfolio built with Vue 3 + Vite.',
    language: 'TypeScript',
    technologies: ['Vue 3', 'TypeScript', 'Vite', 'GitHub API'],
    stars: 5,
    forks: 1,
    updatedAt: '2026-09-18T08:00:00Z',
    repositoryUrl: 'https://github.com/ajian/ajian-blog',
    demoUrl: 'https://ajian.dev',
    type: '前端 · 个人项目',
    period: '2026.09 — 至今',
    overview:
      '你现在看到的这个网站。极简的排版、克制的动效、GitHub 数据驱动的项目档案，以及一套纯前端的小工具。',
    highlights: ['GitHub API + 本地缓存 + 离线回退', '纯前端工具箱，输入不出浏览器', '亮暗主题与移动端适配'],
    features: [
      { no: '01', title: '作品集', summary: '项目档案式列表与详情页。' },
      { no: '02', title: 'Notes', summary: 'Markdown 笔记与全文搜索。' },
      { no: '03', title: '工具箱', summary: '八个常用开发小工具。' },
      { no: '04', title: 'GitHub 同步', summary: '仓库、星标与动态数据。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'vue', label: 'Vue 3', connectsTo: ['router'] }] },
        { id: 'gateway', label: 'App', kind: 'api', nodes: [{ id: 'router', label: 'Vue Router', connectsTo: ['service'] }] },
        { id: 'service', label: 'Service', kind: 'service', nodes: [{ id: 'service', label: 'githubService', connectsTo: ['cache', 'gh'] }] },
        {
          id: 'data',
          label: 'Data',
          kind: 'data',
          nodes: [
            { id: 'gh', label: 'GitHub API' },
            { id: 'cache', label: 'Local Cache' },
          ],
        },
      ],
    },
  },
  {
    id: 'tiny-tools',
    name: 'Tiny Tools 纯前端工具箱',
    slug: 'tiny-tools',
    description: 'Browser-only developer utilities: JSON, color, timestamp, base64, regex.',
    language: 'TypeScript',
    technologies: ['TypeScript', 'Vite', 'Canvas API'],
    stars: 4,
    forks: 0,
    updatedAt: '2026-09-20T08:00:00Z',
    repositoryUrl: 'https://github.com/ajian/tiny-tools',
    type: '前端 · 实验',
    period: '2026.07 — 2026.08',
    overview:
      '一组完全运行在浏览器里的开发小工具，所有输入都不会离开本机。包含 JSON 格式化、颜色转换、时间戳、Base64、正则测试与图片压缩。',
    highlights: ['零后端依赖', '统一的小工具界面范式', '键盘优先的操作路径'],
    features: [
      { no: '01', title: 'JSON', summary: '格式化、压缩与错误定位。' },
      { no: '02', title: '图片', summary: 'Canvas 本地压缩与格式转换。' },
      { no: '03', title: '正则', summary: '实时匹配与分组高亮。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'ui', label: 'Tool UI', connectsTo: ['core'] }] },
        { id: 'service', label: 'Core', kind: 'service', nodes: [{ id: 'core', label: 'Pure Functions', connectsTo: ['canvas'] }] },
        { id: 'data', label: 'Runtime', kind: 'data', nodes: [{ id: 'canvas', label: 'Canvas / Web APIs', meta: '浏览器内置' }] },
      ],
    },
  },
]

export function findProject(slug: string): Project | undefined {
  return projects.find((item) => item.slug === slug)
}
