# AJIAN — 极简个人博客 / GitHub 作品集

> Building things quietly.

一个安静、干净、具有个人风格的开发者网站：GitHub 项目档案、Markdown 笔记、纯前端开发工具箱，
以及少量藏在角落里的兽人视觉元素。

技术栈：**Vue 3 · TypeScript · Vite · Vue Router · Pinia · SCSS · Lucide Icons**

> 想手动改代码？先看 **[ARCHITECTURE.md](./ARCHITECTURE.md)**：分层依赖、逐文件职责、
> 「想改 X → 改哪个文件」速查表、组件接口、加页面/加工具/加文章的配方，以及几个容易踩的坑。

---

## 快速开始

```bash
# 安装依赖（若你的 npm 安装脚本被安全软件拦截，可加 --ignore-scripts）
npm install

# 开发（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建产物（http://localhost:4173）
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env`：

```ini
VITE_GITHUB_USERNAME=TenSon-Jian
# 可选：Personal Access Token，仅用于提升 GitHub API 速率限制
VITE_GITHUB_TOKEN=
# auto（默认，快照优先）| live（总是实时）| snapshot（只用快照，零请求）
VITE_GITHUB_MODE=auto
# 站点规范地址：注入 index.html 的 canonical / og:url / og:image
VITE_SITE_URL=https://tenson-jian.github.io
```

> 不配置也能运行：GitHub 数据会按「构建快照 → 缓存 → 网络 → 陈旧缓存 → 内置回退数据」的顺序降级，
> 页面永远不会因为 API 不可用而白屏。

### 构建快照（推荐开启）

GitHub 未认证配额只有 **60 次/小时，而且按出口 IP 计算** —— 走代理或公司网关时，
这份配额经常被别人耗尽，实时取数必然失败。因此站点支持在构建前把数据抓成静态快照：

```bash
npm run snapshot   # 手动抓取，写入 src/data/github-snapshot.json
npm run build      # prebuild 会自动抓取（已有可用快照则跳过）
```

快照直接打包进产物，**运行时零 API 请求**，配额问题从架构上消失；代价是数据只在构建时更新，
首页会显示「数据来自构建快照 · 日期」。

- 快照文件缺失或结构不合法时，会自动退回内置回退数据，不会白屏。
- 想强制刷新：`npm run snapshot`（`--force`），或 `node scripts/generate-github-snapshot.mjs --force`。
- 抓取时设置 `GITHUB_TOKEN`（或 `VITE_GITHUB_TOKEN`）可把配额提到 5000 次/小时，成功率更高。
- 想让本地开发始终看到实时数据：把 `VITE_GITHUB_MODE` 设为 `live`。

## 部署到 GitHub Pages

仓库已包含 [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)，推送到 `main` 即自动构建并发布。

**目标：用户站点 `https://tenson-jian.github.io/`**（仓库名必须是 `<用户名>.github.io`）

```bash
# 本地已配好名为 pages 的 remote
git add -A
git commit -m "deploy: github pages"
git push pages main
```

首次推送后，到仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**
（不是 "Deploy from a branch"）。

要点：

- **base 路径**。用户站点部署在根路径，`base = '/'`，与代码默认值一致，**无需任何配置**。
  若改部署到项目页（`<user>.github.io/<repo>/`），需设置构建环境变量 `VITE_BASE_PATH=/<repo>/`，
  该值会同时注入 `index.html`、`public/404.html` 与 vue-router 的 `BASE_URL`。
- **规范地址**。`index.html` 的 canonical / og:url / og:image 以及 `siteConfig.url` 都取自
  `VITE_SITE_URL`（默认 `https://tenson-jian.github.io`）。换绑域名时只需设置这一个变量，
  无需改 HTML —— 见下方「自定义域名」。
- **SPA 深链**。路由是 history 模式，直接访问 `/projects/rms` 会命中 [public/404.html](./public/404.html)：
  它把原始路由暂存到 `?p=` 再跳回根目录，由 `index.html` 的还原脚本改写回真实地址，因此刷新深链不会 404。
- **构建期快照**。CI 里没有 `.env`，默认账号取自 `src/config/site.ts`。想让线上抓到真实数据，
  在仓库 **Settings → Secrets and variables → Actions** 配置 `VITE_GITHUB_USERNAME`（目标账号）与可选的
  `SNAPSHOT_TOKEN`（PAT，提高抓取成功率）。不配置也能发布：快照抓不到时退回内置回退数据，构建不会失败。
- **自定义域名**。本仓库**不含 CNAME 文件**。当前规范地址是 `https://tenson-jian.github.io`。
  若要改用 `ajian.dev`：先确认域名 DNS 已指向 GitHub Pages，再到 Settings → Pages → Custom domain
  填写 —— 顺序反了会导致 `tenson-jian.github.io` 也打不开；最后设置构建环境变量
  `VITE_SITE_URL=https://ajian.dev`（仓库 Variables 或工作流 env），让 canonical 一并切换。

## 信息架构

```
/
├── /projects
│   └── /projects/:slug
├── /notes
│   └── /notes/:slug
├── /tools
│   ├── /tools/json        JSON 格式化 / 压缩 / 校验
│   ├── /tools/color       HEX · RGB · HSL 互转 + 对比度
│   ├── /tools/timestamp   秒 / 毫秒自动识别
│   ├── /tools/markdown    实时 Markdown 预览
│   ├── /tools/uuid        批量 UUID v4
│   ├── /tools/image       Canvas 本地图片压缩
│   ├── /tools/base64      UTF-8 安全的 Base64
│   └── /tools/regex       实时匹配 / 分组 / 替换
├── /about
└── /404
```

## 目录结构

```
src/
├── assets/           orc-hero.png · orc-seated.png（背景兽人素材，见下节）
├── components/
│   ├── brand/        SiteBackground（全站背景）· LogoMark · PawIcon
│   ├── layout/       AppSidebar · AppFooter
│   ├── note/         NoteRow · MarkdownView（代码块复制按钮）
│   ├── project/      ProjectCard · ArchitectureDiagram · ImageLightbox
│   └── tools/        ToolPage · ToolPanel · ToolGrid · ToolButton · CopyButton
├── composables/      useTheme · useReveal
├── config/           site.ts（站点信息 / 导航）
├── data/             fallback.ts（项目档案 + 回退数据）· notes.ts · tools.ts
│   └── notes/        Markdown 文章正文
├── router/           路由表 + 每页 title / description / canonical / OG
├── services/         github.ts（唯一的 GitHub 出口）
├── stores/           github.ts（Pinia，loading / error / empty / source）
├── styles/           tokens · base · utilities
├── types/            Project · Note · Github* · DataSource
├── utils/            markdown · highlight · cover · color · format
└── views/            页面 + tools/*
public/
└── og-cover.png      社交分享封面（由同一份兽人素材生成）
```

## 关键实现

### GitHub 数据层

```
GitHub API → services/github.ts → Local Cache(localStorage) → Frontend
```

- 30 分钟内直接使用缓存，24 小时内的陈旧缓存可作降级数据
- 8 秒超时 + `AbortController`，403 / 404 / 超时都有明确提示
- 区分 `network` / `cache` / `fallback` 三种来源，首页会淡淡提示当前来源并提供「重试」
- 首页统计与项目卡片在请求期间显示骨架屏，完成后淡入
- 覆盖 Repositories / Stars / Followers / **最近活动** / 更新时间；
  「最近活动」在项目页底部以两列列表呈现，同样有骨架屏与空状态

### Markdown 与代码高亮

零依赖实现：`utils/markdown.ts` 负责块级与行内解析，`utils/highlight.ts` 负责
单遍扫描的词法着色。代码块自动附上语言标签与复制按钮。

### 视觉体系

- 颜色全部收敛为 CSS 变量（`styles/_tokens.scss`），主题切换只替换变量
- 暖米白 / 灰棕 / 深灰，无渐变、无霓虹、无玻璃拟态
- 动效仅使用位移与透明度，统一 `cubic-bezier(0.22, 1, 0.36, 1)`；页面进入 480ms
- 全部动画遵循 `prefers-reduced-motion`（背景兽人会停止漂移）
- 项目截图与文章封面由 `utils/cover.ts` 程序化生成（SVG data URI）；
  位图资源只有两张兽人背景，且只用于背景层

### 兽人背景视觉体系

兽人不是装饰素材，而是整个网站统一的「背景视觉语言」，由唯一组件
`components/brand/SiteBackground.vue` 出口（对应设计规范 §36 / §37）。

**素材来源：直接从设计示意图中裁切提取，而不是重新绘制。**

```
设计示意图（米黄底 + 肉壮兽人插画）
        ↓  按 Hero 区域的真实边界裁切
        ↓  「符号偏差」抠图：alpha = |亮度 − 底色| / K，颜色 = 底色 ± K
   src/assets/orc-hero.png    (745×742，Hero / 全站环境层)
   src/assets/orc-seated.png  (306×672，仅 404 使用，同一角色的坐姿)
```

这套抠图方式有两个好处：

1. **忠实**：在与示意图相同的米黄底（`#F3EEDF`）上合成时像素级还原示意图，
   因此「网页与示意图属于同一个视觉系统」是可以量化验证的（平均误差 < 2/255）。
2. **自适应主题**：素材在深色底上会自然读作浅色线稿，因此 Dark Mode 不需要第二套插画，
   只调整透明度即可（`--background-opacity`）。

各页面共用同一角色，只允许改变透明度 / 位置 / 裁切 / 尺寸：

| variant | 用途 | 克制程度（浅色 / 深色） |
| --- | --- | --- |
| `hero` | 首页 Hero 右侧 | 1 / 0.24 |
| `default` | 兜底环境层 | 0.16 / 0.10 |
| `project` | Projects | 0.12 / 0.09 |
| `notes` | Notes（内容密度最高） | 0.07 / 0.06 |
| `tools` | Tools（以 UI 为主） | 0.06 / 0.05 |
| `about` | About | 0.22 / 0.14 |
| `error` | 404（唯一完整展示） | 0.94 / 0.30 |

背景接口收敛在 `styles/_tokens.scss` 的 Background System 变量里
（`--background-opacity` / `--background-right` / `--background-height` /
`--background-mask-*` 等），页面与组件不再各写一套背景。

其他兽人元素：Logo（兽耳轮廓）、404 爪印、页脚爪印。全部低对比度、不喧哗。

## 部署

`npm run build` 产出纯静态 `dist/`，可直接托管到任意静态服务。
由于使用 History 路由，需要把未知路径回退到 `index.html`：

- Nginx：`try_files $uri $uri/ /index.html;`
- Vercel / Netlify：配置 SPA rewrite 规则

## 无障碍与性能

- 语义化标签、`aria-label`、`aria-current`、跳转到主内容的 skip link、可见的 focus 环
- 路由级懒加载 + 第三方库单独分包（`vendor`），封面图 `loading="lazy"`
- 无第三方动画库，动效全部为 CSS
- 背景兽人：Hero 用 `loading="eager"`（首屏），其余页面用 `loading="lazy"`；
  素材为上采样后的 PNG，单张约 390 KB / 115 KB
- 说明：规范建议背景素材使用 WebP / AVIF。本项目在离线环境下没有可用的编码器
  （sharp / cwebp / ImageMagick 均不可用），因此交付为 PNG；
  若需要进一步压体积，可在有网络的环境执行：

  ```bash
  npx sharp-cli -i src/assets/orc-hero.png -o src/assets/orc-hero.webp -f webp
  npx sharp-cli -i src/assets/orc-seated.png -o src/assets/orc-seated.webp -f webp
  ```

  随后把 `SiteBackground.vue` 里的两处 import 换成 `.webp` 即可，其余无需改动。
