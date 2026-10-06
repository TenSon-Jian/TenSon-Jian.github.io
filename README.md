# AJIAN — 极简个人博客 / 项目档案 / 在线工具箱

> Building things quietly.

一个安静、干净、具有个人风格的开发者网站：项目档案、Markdown 笔记、纯前端开发工具箱，
以及少量藏在角落里的兽人视觉元素。

技术栈：**Vue 3 · TypeScript · Vite · Vue Router · SCSS · Lucide Icons**

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

## 内容与数据

**站点没有任何运行时网络请求。** 所有内容都来自仓库内的静态数据文件，构建时直接打进产物，
因此不存在加载态、失败态或重试逻辑：

| 内容 | 文件 |
| --- | --- |
| 项目档案 | `src/data/projects.ts` |
| 笔记元数据 | `src/data/notes.ts` + `src/data/notes/*.md` |
| 工具清单 | `src/data/tools.ts` |

首页的统计数字（Projects / Notes / Tools 三个计数）由这几份数据现算，不写死。

## 环境变量

复制 `.env.example` 为 `.env`：

```ini
# 站点规范地址：注入 index.html 的 canonical / og:url / og:image，
# 同时作为 vue-router 拼绝对链接的前缀。绑自定义域名时改这里即可。
VITE_SITE_URL=https://tenson-jian.github.io
```

> 不配置也能运行：`vite.config.ts` 里有一份相同的默认值兜底。

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
- **构建无需凭据**。内容全部来自仓库内的静态数据，CI 里不需要任何 token 或账号配置。
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
├── data/             projects.ts（项目档案）· notes.ts · tools.ts
│   └── notes/        Markdown 文章正文
├── router/           路由表 + 每页 title / description / canonical / OG
├── styles/           tokens · base · utilities
├── types/            Project · Note · Architecture*
├── utils/            markdown · highlight · cover · color · format
└── views/            页面 + tools/*
public/
└── og-cover.png      社交分享封面（由同一份兽人素材生成）
```

## 关键实现

### 静态数据层

全站内容都是 `src/data/` 下的普通 TS / Markdown 模块，由 Vite 在构建时打进产物：

```ts
data/projects.ts   // Project[]，首页精选与项目页、详情页共用
data/notes.ts      // 笔记元数据 + 显式 `?raw` 导入的 .md 正文
data/tools.ts      // 工具清单，驱动 /tools 网格与首页工具条
```

没有 store、没有 fetch、没有缓存与降级。代价是加内容要手动改文件，换来的是零运行时复杂度。

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
