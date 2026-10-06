# 架构与目录说明（面向手动修改）

这份文档回答一个问题：**想改某样东西，应该动哪个文件。**
（快速开始 / 部署见 `README.md`，设计语言与背景素材来源也见 `README.md`。）

---

## 1. 启动链路

```
index.html
  ├─ <script> 同步应用主题（避免首屏闪烁）        ← 内联脚本，读 localStorage / prefers-color-scheme
  ├─ SEO / OG / favicon（data URI）
  └─ <script type="module" src="/src/main.ts">
        └─ main.ts
             ├─ initTheme()                       ← composables/useTheme.ts
             ├─ createApp(App)  →  App.vue         ← 外壳：Sidebar / Topbar / 背景 / 路由出口 / Footer
             ├─ use(router)                        ← router/index.ts
             └─ mount('#app')
```

两个全局单例：

| 单例 | 文件 | 作用 |
| --- | --- | --- |
| 主题 | `src/composables/useTheme.ts` | 模块级 `ref`，`data-theme` 写到 `<html>`，同时校正 `meta[name=theme-color]` |
| 路由 | `src/router/index.ts` | 懒加载页面 + 每页 `title/description/canonical/OG` |

> 站点没有数据 store：所有内容都是 `src/data/` 下的静态模块，构建时直接打进产物，
> 因此也没有任何运行时请求、加载态或失败态。

---

## 2. 依赖方向（改代码时请守住）

```
views/*.vue           页面：布局、交互、组合
   │  只读
   ├─→ components/**           展示组件（props 进、事件出）
   ├─→ composables/**          useTheme / useReveal
   └─→ data/** + utils/**      静态内容与纯函数
config/site.ts          站点级配置（谁都可以读）
types/index.ts          所有共享类型（Project / Note / Architecture*）
```

规则：**只有 `data/` 放内容；`utils/` 保持纯函数；页面不发任何网络请求。**

---

## 3. 目录树与逐文件职责

```
ajian-blog/
├── index.html                 主题引导 + SEO/OG + favicon（data URI）
├── vite.config.ts             @ → src 别名、SCSS modern-compiler、vendor 手动分包
├── tsconfig.json              严格模式；noUnusedLocals/Parameters 打开
├── .env.example               VITE_SITE_URL
├── public/
│   └── og-cover.png           社交分享大图（原样拷贝，不做 hash）
└── src/
    ├── main.ts                应用入口（16 行）
    ├── App.vue                外壳：Sidebar、移动端 Topbar、全站背景、路由出口、右上角主题按钮、Footer
    ├── env.d.ts               `*.vue` 模块声明 + 自定义 `ImportMetaEnv`（VITE_* 类型）
    │
    ├── assets/
    │   ├── orc-hero.png       ★ 背景兽人主素材（745×742，从设计示意图裁切抠图）
    │   └── orc-seated.png     ★ 404 用的坐姿素材（306×672，同一角色）
    │
    ├── components/
    │   ├── brand/
    │   │   ├── SiteBackground.vue  ★ 全站唯一背景出口（7 个 variant，主题/响应式都在这里）
    │   │   ├── LogoMark.vue        侧边栏与移动端顶栏的兽耳 Logo
    │   │   ├── PawIcon.vue         爪印（404、页脚、空状态）
    │   │   └── icons.ts            图标名 → Lucide 组件的映射表
    │   ├── layout/
    │   │   ├── AppSidebar.vue      桌面侧边导航 + GitHub 链接 + 主题切换
    │   │   └── AppFooter.vue       页脚
    │   ├── note/
    │   │   ├── NoteRow.vue         笔记列表行（日期/标题/摘要/封面/分类）
    │   │   └── MarkdownView.vue    渲染 Markdown HTML，并给代码块挂「复制」按钮
    │   ├── project/
    │   │   ├── ProjectCard.vue     首页项目卡（封面/标题/简介/技术栈/星标）
    │   │   ├── ArchitectureDiagram.vue  纯 HTML/CSS/SVG 架构图（hover 高亮链路）
    │   │   └── ImageLightbox.vue   截图灯箱（opacity + scale + backdrop，含焦点管理）
    │   └── tools/
    │       ├── ToolPage.vue        工具页外壳（返回链接 + 标题 + 「纯前端」徽章）
    │       ├── ToolPanel.vue       输入/输出面板容器（具名插槽 actions）
    │       ├── ToolGrid.vue        工具卡网格
    │       ├── ToolButton.vue      工具页按钮（primary/ghost/quiet）
    │       └── CopyButton.vue      复制按钮
    │
    ├── composables/
    │   ├── useTheme.ts         light/dark 切换、系统跟随、localStorage、theme-color
    │   └── useReveal.ts        滚动进入视口淡入（返回 template ref）
    │
    ├── config/
    │   └── site.ts             站点名/角色/标语/邮箱/社交链接 + 导航项 navItems
    │
    ├── data/
    │   ├── projects.ts         ★ 项目档案（Project[]），全站唯一项目数据源
    │   ├── notes.ts            ★ 笔记元数据 + 注册 .md 正文（读 `?raw`）
    │   ├── notes/*.md          6 篇 Markdown 正文
    │   └── tools.ts            8 个工具的元数据（id/名称/描述/路径/图标）
    │
    ├── router/index.ts         路由表 + afterEach 写 SEO
    │
    ├── styles/
    │   ├── main.scss           只做 @use 汇总
    │   ├── _tokens.scss        ★ 设计令牌（颜色/间距/圆角/时长/背景体系变量）
    │   ├── _base.scss          元素默认样式、focus、滚动条、reduced-motion、skip-link
    │   └── _utilities.scss     全局工具类（.page/.section/.surface-card/.skeleton/.reveal…）
    │
    ├── types/
    │   ├── index.ts            Project / ProjectFeature / Architecture* / Note
    │   └── ui.ts               ButtonVariant
    │
    ├── utils/
    │   ├── markdown.ts         极简 Markdown 解析（标题/表格/列表/引用/代码块…）
    │   ├── highlight.ts        零依赖语法高亮（SPECS 关键字表 + 单遍扫描）
    │   ├── cover.ts            程序化生成封面/截图（SVG data URI，无位图）
    │   ├── color.ts            工具页用的颜色换算与对比度
    │   └── format.ts           数字/日期/相对时间/copyText
    │
    └── views/
        ├── HomeView.vue        Hero + Recent Projects + Notes + Tools
        ├── ProjectsView.vue    档案式列表 + 搜索/语言筛选 + 最近活动
        ├── ProjectDetailView.vue  项目档案（Overview/Architecture/Features/Screenshots/Development）
        ├── NotesView.vue       笔记列表 + 搜索 + 分类筛选
        ├── NoteDetailView.vue  文章正文 + 目录 + 上下篇
        ├── ToolsView.vue       工具网格
        ├── AboutView.vue       About（Hero + Currently/Tech/Interests/Elsewhere）
        ├── NotFoundView.vue    404（坐姿兽人 + 爪印）
        └── tools/*.vue         8 个工具实现（各 ~150–370 行）
```

`dist/` 是构建产物，**不要手改**。

---

## 4. 路由表

| path | name | 文件 | 背景 variant | 备注 |
| --- | --- | --- | --- | --- |
| `/` | `home` | `HomeView.vue` | `hero`（页面内自带） | 全站环境层在此页不叠加 |
| `/projects` | `projects` | `ProjectsView.vue` | `project` | 含「最近活动」 |
| `/projects/:slug` | `project-detail` | `ProjectDetailView.vue` | `project` | 挂载后改写 `document.title` |
| `/notes` | `notes` | `NotesView.vue` | `notes` | |
| `/notes/:slug` | `note-detail` | `NoteDetailView.vue` | `notes` | |
| `/tools` | `tools` | `ToolsView.vue` | `tools` | |
| `/tools/{json,color,timestamp,markdown,uuid,image,base64,regex}` | `tool-*` | `views/tools/*` | `tools` | |
| `/about` | `about` | `AboutView.vue` | `about` | 页内还有一层 `about` variant |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundView.vue` | `error`（页内） | 不叠加环境层 |

`App.vue` 里的 `bgVariant` computed 决定全站环境层的 variant：`home` 与 `not-found` 返回 `null`（这两页自己呈现角色）。

---

## 5. 背景视觉体系（最常改的部分）

### 组件

```vue
<SiteBackground variant="hero" art="portrait" :fixed="false" :eager="true" />
```

| prop | 取值 | 说明 |
| --- | --- | --- |
| `variant` | `hero` / `default` / `project` / `notes` / `tools` / `about` / `error` | 只调整克制程度（透明度/位置/裁切/尺寸） |
| `art` | `portrait`（默认）/ `seated` | `seated` 只给 404 用 |
| `fixed` | boolean | `true` = 钉在视口（全站环境层），`false` = 贴合父容器（Hero / About / 404） |
| `eager` | boolean | 首屏用 `true`，其余 `loading="lazy"` |

### 变量（`_tokens.scss` 里的 Background System）

| 变量 | 作用 |
| --- | --- |
| `--background-opacity` | 该 variant 的克制程度 |
| `--background-height` | 相对容器的百分比高度（决定角色大小） |
| `--background-left` / `--background-right` / `--background-bottom` | 定位（不用的一侧设 `auto`） |
| `--background-position` | `object-position`（与定位保持一致，语义化用） |
| `--background-origin` | `transform-origin`，影响轻微漂移的支点 |
| `--background-blend` | `mix-blend-mode`（默认 `normal`，保持克制） |
| `--background-mask-default/project/notes/tools/about` | 各页面的柔化遮罩（`radial-gradient`） |

> `--background-color` 与 `--background-image` 是按规范第 36 节保留的接口名（已声明、当前未参与渲染），
> 真正的素材由组件里的 `<img src>` 承担，这样浏览器才能对同一张图做懒加载与解码控制。

改某个页面的浓淡，只改 `.site-bg--<variant>` 里的 `--background-opacity` 即可；
深色主题的对应值在同一个文件里的 `:root[data-theme='dark']` 块中。

### 换素材

1. 用同尺寸/同比例的新 PNG 覆盖 `src/assets/orc-hero.png`（或 `orc-seated.png`）即可，代码不用动。
2. **注意底色契约**：素材是「符号偏差」抠图，透明区域表示「与米黄底 `#F3EEDF` 一致」。
   若换成底色不同的插画，需要按 README 里的方法重新抠图，否则浅色主题下会出现色偏。
3. 换成 WebP 时只需改 `SiteBackground.vue` 顶部两行 import（README 有命令）。

---

## 6. 样式系统

- **只用变量，不写魔法值**：颜色/间距/圆角/时长都在 `_tokens.scss`。浅色与深色各一块，切换只换变量。
- **工具类在 `_utilities.scss`**：`.page` `.page-head` `.page-title` `.page-subtitle` `.section` `.section-head` `.section-title` `.section-more` `.surface-card` `.hoverable` `.tag` `.tag-row` `.skeleton` `.fade-in` `.reveal` `.empty-state` `.mono` `.muted` `.dim` `.divider`。
- **基础层在 `_base.scss`**：元素默认样式、`:focus-visible`、滚动条、`prefers-reduced-motion` 全局兜底，以及 `.sr-only` / `.skip-link`。
- **页面/组件的私有样式写在自己的 `<style scoped lang="scss">`**，类名用 BEM 风格（`.hero__text`、`.archive__index`）。
- 间距用 `--space-1…9`（4/8/12/16/24/32/48/64/96）；动效用 `--dur-fast/--dur/--dur-slow` + `--ease`。
- 所有动效都必须在 `prefers-reduced-motion: reduce` 下退化（`_base.scss` 已全局兜底）。

---

## 7. 内容与数据维护

### 项目档案（`data/projects.ts` → `projects`）

字段定义见 `types/index.ts` 的 `Project`：

```ts
{ id, name, slug, description, language?, technologies[],
  repositoryUrl, demoUrl?, cover?, featured?,
  type?, period?, overview?, highlights?[], features?[], architecture? }
```

- `featured: true` 的项目才会出现在首页（`HomeView` 里 `slice(0, 3)`）。
- `architecture` 决定项目详情页的架构图；`features` 决定功能清单。两者缺省时页面会显示空状态而不是隐藏整段。
- 首页的统计数字（Projects / Notes / Tools）由这几份数据文件现算，不要写死。

### 笔记（`data/notes/` + `data/notes.ts`）

新增一篇：

1. 在 `src/data/notes/` 新建 `xxx.md`（普通 Markdown）。
2. 在 `data/notes.ts` 顶部 `import xxx from './notes/xxx.md?raw'`，并在 `raw` 数组里加一条元数据（`id/slug/title/date/category/tags/content`）。
3. `summary` 与 `readingMinutes` 会自动从正文推导；列表按 `date` 倒序。

### 工具（`data/tools.ts` + `views/tools/`）

新增一个工具：见第 9 节「配方」。

---

## 8. 「想改 X → 改哪个文件」速查表

| 想改的东西 | 文件 | 备注 |
| --- | --- | --- |
| 站点名 / 角色 / 标语 / 邮箱 / 社交链接 | `src/config/site.ts` | `siteConfig` |
| 侧边导航项与顺序 | `src/config/site.ts` | `navItems`，`icon` 是 `icons.ts` 里的 key |
| 站点规范地址（canonical / og:url） | `.env`（复制 `.env.example`） | `VITE_SITE_URL` |
| 主题色 / 间距 / 圆角 / 动效时长 | `src/styles/_tokens.scss` | 浅色与深色各一块 |
| 背景兽人浓淡 / 位置 / 裁切 | `src/components/brand/SiteBackground.vue` | `.site-bg--<variant>` |
| 背景素材本体 | `src/assets/orc-*.png` | 直接覆盖文件，注意底色契约 |
| 首页 Hero 文案 / 按钮 | `src/views/HomeView.vue` | template 最上方 |
| 首页 Hero 高度与文字栏宽度 | `HomeView.vue` | `.hero { min-height }` / `.hero__text { max-width }` |
| 首页显示几个精选项目 | `HomeView.vue` | `featured` 里的 `.slice(0, 3)` |
| 项目档案内容 | `src/data/projects.ts` | `projects` 数组 |
| 项目详情页的章节与顺序 | `src/views/ProjectDetailView.vue` | `sections` 常量 + 对应 `<section>` |
| 架构图节点/连线 | `src/data/projects.ts` → `architecture` | 渲染在 `components/project/ArchitectureDiagram.vue` |
| 文章正文 | `src/data/notes/*.md` | |
| 新增文章 | `src/data/notes/` + `src/data/notes.ts` | 见第 7 节 |
| 工具清单 / 描述 / 图标 | `src/data/tools.ts` | |
| 某个工具的实现 | `src/views/tools/<Xxx>ToolView.vue` | 每个工具一个文件 |
| 路由、页面标题与 description | `src/router/index.ts` | `meta.title` / `meta.description` |
| 404 文案与爪印 | `src/views/NotFoundView.vue` | |
| About 各段内容 | `src/views/AboutView.vue` | 顶部 `currently/tech/elsewhere/interests` 常量 |
| 页脚 | `src/components/layout/AppFooter.vue` | |
| 侧边栏（含主题切换） | `src/components/layout/AppSidebar.vue` | |
| 右上角工具位 | `src/App.vue` | `.app-utility` |
| Markdown 支持范围 | `src/utils/markdown.ts` | 块级解析在主循环里 |
| 代码高亮关键字 / 新语言 | `src/utils/highlight.ts` | `SPECS` 表 + `LANGUAGE_ALIASES` |
| 项目截图 / 文章封面的生成规则 | `src/utils/cover.ts` | SVG data URI，无位图 |
| 日期 / 数字 / 相对时间格式 | `src/utils/format.ts` | |
| 站点 SEO、OG、favicon | `index.html` + `router/index.ts` 的 `afterEach` | |
| 分享大图 | `public/og-cover.png` | 也可改 `index.html` 里的 `og:image` |
| 主题切换行为（跟随系统/记忆） | `src/composables/useTheme.ts` | |

---

## 9. 配方

### 加一个页面

1. `src/views/XxxView.vue`，根元素带 `class="page"`（自带进入动画）。
2. `src/router/index.ts` 加路由，填 `meta.title` / `meta.description`（懒加载照抄现有写法）。
3. 需要进导航就加到 `config/site.ts` 的 `navItems`。
4. 需要背景就确认 `App.vue` 的 `bgVariant` 会返回合适 variant（新 name 默认走 `default`）。

### 加一个工具

1. `src/data/tools.ts` 加一条元数据（`id` 决定路由与图标）。
2. `src/views/tools/XxxToolView.vue`：用 `<ToolPage title="…" description="…">` 包住，内部用 `<ToolPanel label="输入">` / `<ToolPanel label="输出">` + `<ToolButton>` / `<CopyButton>`。
3. `src/router/index.ts` 加 `/tools/xxx`。
4. 若用了新图标，在 `src/components/brand/icons.ts` 注册。

### 换一套配色 / 改成别的气质

只改 `_tokens.scss` 里两个主题块的颜色变量；组件不需要动。若要把米黄换成别的底色，
`SiteBackground` 的素材需要按新底色重新抠图（README 有方法）。

---

## 10. 组件接口速查

| 组件 | props | 事件 |
| --- | --- | --- |
| `SiteBackground` | `variant?`, `art?`, `fixed?`, `eager?` | — |
| `LogoMark` | `size?`（默认 20） | — |
| `PawIcon` | `size?`（28）, `opacity?`（0.28） | — |
| `ProjectCard` | `project: Project`, `index?` | — |
| `NoteRow` | `note: Note`, `showCover?` | — |
| `MarkdownView` | `html: string`, `emptyText?` | — |
| `ImageLightbox` | `items: {src,alt}[]`, `index: number \| null` | `close`, `update:index` |
| `ArchitectureDiagram` | `spec: ArchitectureSpec` | — |
| `AppSidebar` | `mobile?` | `navigate` |
| `ToolPage` | `title`, `description?`, `backTo?`, `backLabel?` | — |
| `ToolPanel` | `label?`, `hint?`（+ `actions` 具名插槽） | — |
| `ToolButton` | `variant?`(primary/ghost/quiet), `disabled?`, `type?` | — |
| `CopyButton` | `value: string`, `label?`, `disabled?` | — |

---

## 11. 构建与产物

```bash
npm run dev        # 开发（默认 5173）
npm run typecheck  # vue-tsc --noEmit
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览 dist（默认 4173）
```

- `vite.config.ts`：`@` → `src`；`vendor` chunk 单独打包 `vue/vue-router/pinia`；
  `cssCodeSplit: true`；`target: es2019`。
- 路由级懒加载，所以 `dist/assets/` 下每个页面一个 js/css。
- `src/assets/**` 会带 hash 输出；`public/**` 原样拷贝到 `dist/`。
- History 路由需要服务端把未知路径回退到 `index.html`（README 有 nginx / Vercel 写法）。

---

## 12. 容易踩的坑

1. **`utils/highlight.ts` 的 `let j = i + 1` 不要改回 `j = i`。**
   `IDENT_START` 比 `IDENT_PART` 多出 `@` 与 `#`，从 `i` 起步时遇到单独的 `@`/`#`
   循环不会前进——任何含 CSS 色值或 shell `#` 注释的代码块都会把标签页卡死（已修复并有回归测试）。
2. **`tsconfig.json` 开了 `noUnusedLocals` / `noUnusedParameters`**：
   留一个没用的 import 就会让 `npm run build` 失败（`npm run dev` 不会报）。
3. **背景素材的底色契约**：透明 = 与 `#F3EEDF` 一致；换素材必须连带换抠图基准色。
4. **别在 `index.html` 里再加一个 `meta[name=theme-color]`**：`useTheme.ts` 会统一改写
   所有该标签并去掉 `media`，多写一个会让地址栏颜色不可预期。
5. **`og:image` 指向真实存在的文件**：目前是 `public/og-cover.png`（1200×630）。
6. `.env.example` 目前是纯注释 + 变量，复制成 `.env` 即可；不要提交真实 Token。
7. 图片规格：Hero 素材 PNG 约 336 KB、404 素材约 104 KB。规范建议 WebP/AVIF，
   离线环境没有编码器，转码命令见 README。
