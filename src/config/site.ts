// ─────────────────────────────────────────────
// 站点级配置
// ─────────────────────────────────────────────

export const siteConfig = {
  name: 'AJIAN',
  tagline: 'Building things quietly.',
  role: 'Developer / Builder / Student',
  description: '安静地做东西。项目档案、开发笔记与在线小工具。',
  url: import.meta.env.VITE_SITE_URL || 'https://tenson-jian.github.io',
  email: '1216800668a@gmail.com',
  links: {
    github: 'https://github.com/TenSon-Jian',
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
