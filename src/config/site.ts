// ─────────────────────────────────────────────
// 站点级配置
// ─────────────────────────────────────────────

export const siteConfig = {
  name: 'AJIAN',
  /** GitHub 用户名：可在 .env 中用 VITE_GITHUB_USERNAME 覆盖 */
  githubUsername: import.meta.env.VITE_GITHUB_USERNAME || 'ajian',
  /** 可选的 Personal Access Token，仅用于提升 API 速率限制 */
  githubToken: import.meta.env.VITE_GITHUB_TOKEN || '',
  tagline: 'Building things quietly.',
  role: 'Developer / Builder / Student',
  description: '安静地做东西。GitHub 项目档案、开发笔记与在线小工具。',
  url: import.meta.env.VITE_SITE_URL || 'https://ajian.dev',
  email: '1216800668a@gmail.com',
  links: {
    github: 'https://github.com/Tengshou233',
    bilibili: 'https://space.bilibili.com/23215191?spm_id_from=333.788.0.0',
    steam: 'https://steamcommunity.com/profiles/76561198321359595/',
  },
  copyrightYear: new Date().getFullYear(),
} as const

export const navItems = [
  { name: 'Home', path: '/', icon: 'home' },
  { name: 'Projects', path: '/projects', icon: 'folder' },
  { name: 'Notes', path: '/notes', icon: 'file-text' },
  { name: 'Tools', path: '/tools', icon: 'wrench' },
  { name: 'About', path: '/about', icon: 'user' },
] as const
