import type { Project } from '@/types'

// ─────────────────────────────────────────────
// 项目档案（全站唯一的项目数据源）
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
    description: 'This site — a quiet personal blog and portfolio built with Vue 3 + Vite.',
    language: 'TypeScript',
    technologies: ['Vue 3', 'TypeScript', 'Vite', 'SCSS'],
    repositoryUrl: 'https://github.com/ajian/ajian-blog',
    demoUrl: 'https://ajian.dev',
    type: '前端 · 个人项目',
    period: '2026.09 — 至今',
    overview:
      '你现在看到的这个网站。极简的排版、克制的动效、档案式的项目展示，以及一套纯前端的小工具。',
    highlights: ['纯前端工具箱，输入不出浏览器', '亮暗主题与移动端适配', '零后端依赖，静态部署'],
    features: [
      { no: '01', title: '作品集', summary: '项目档案式列表与详情页。' },
      { no: '02', title: 'Notes', summary: 'Markdown 笔记与全文搜索。' },
      { no: '03', title: '工具箱', summary: '八个常用开发小工具。' },
      { no: '04', title: '架构图', summary: '项目分层与依赖的可视化。' },
    ],
    architecture: {
      layers: [
        { id: 'client', label: 'Client', kind: 'client', nodes: [{ id: 'vue', label: 'Vue 3', connectsTo: ['router'] }] },
        { id: 'gateway', label: 'App', kind: 'api', nodes: [{ id: 'router', label: 'Vue Router', connectsTo: ['data'] }] },
        { id: 'service', label: 'Data', kind: 'service', nodes: [{ id: 'data', label: '静态数据模块', connectsTo: ['assets'] }] },
        {
          id: 'data',
          label: 'Assets',
          kind: 'data',
          nodes: [
            { id: 'assets', label: 'Markdown / TS' },
            { id: 'canvas', label: 'Canvas 生成封面' },
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
