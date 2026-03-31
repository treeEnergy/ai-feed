# AI Feed---非常非常初级by gcw

**AI Feed** 是一个本地运行的桌面应用，自动聚合 AI 领域大牛在各平台的动态，翻译为中文，以优雅的卡片式阅读体验呈现。

**AI Feed** is a local desktop app that aggregates AI leaders' content from multiple platforms, translates it to Chinese, and presents it in an elegant card-based reading experience.

---

## 功能特性 / Features

- **多平台聚合 / Multi-platform Aggregation** — 从 X (Twitter)、GitHub、arXiv、Facebook 抓取内容 / Scrapes content from X, GitHub, arXiv, and Facebook
- **AI 翻译 / AI Translation** — 使用 DeepSeek API 将英文内容翻译为流畅的中文，保留专业术语 / Translates English content to Chinese via DeepSeek API, preserving technical terms
- **Anthropic 风格 UI / Anthropic-style UI** — 暖奶白配色、衬线字体、优雅的卡片布局 / Warm cream palette, serif typography, elegant card layout
- **人物追踪 / Person Tracking** — 内置 10 位 AI 领域知名人物，支持自定义添加 / Pre-loaded with 10 AI leaders, with custom additions
- **每周热点 / Weekly Highlights** — 时间轴展示每周关注的热门话题 / Timeline showing trending topics by week
- **定时同步 / Scheduled Sync** — 可配置的自动抓取频率（30分钟 ~ 6小时）/ Configurable auto-fetch interval (30min – 6hrs)
- **纯本地运行 / Fully Local** — 所有数据存储在本地 SQLite，无需服务器 / All data stored in local SQLite, no server required

## 截图 / Screenshots

```
┌─────────────┬──────────────────────────────────┐
│  AI Feed    │  每周关注热点                      │
│             │  ● AGI  ● 具身智能  ● Scaling     │
│  ◉ 全部动态  ├──────────────────────────────────┤
│  ☆ 收藏     │  全部动态                          │
│  ◈ 论文追踪  │                                   │
│             │  ┌────────────────────────────┐   │
│  关注的人    │  │ YL · Yann LeCun · 𝕏 · 2h │   │
│  ● LeCun    │  │                            │   │
│  ● Karpathy │  │ 我认为当前的 LLM 方法不可能  │   │
│  ● Jim Fan  │  │ 实现真正的 AGI...           │   │
│  ● ...      │  │                            │   │
│             │  │ ↗ 原文  ⊡ 复制  ☆ 收藏     │   │
│  + 添加     │  └────────────────────────────┘   │
│             │                                   │
│  ● 已同步   │  ┌────────────────────────────┐   │
│    3分钟前   │  │ AK · Karpathy · GitHub     │   │
│         ⚙  │  │ karpathy/minbpe  ★ 8.2k    │   │
└─────────────┴──────────────────────────────────┘
```

## 预设人物 / Pre-loaded AI Leaders

| 姓名 / Name | 机构 / Org | 平台 / Platforms |
|---|---|---|
| Yann LeCun | Meta AI | X, Facebook, arXiv |
| Andrej Karpathy | Eureka Labs | X, GitHub |
| Jim Fan | NVIDIA | X |
| Ilya Sutskever | SSI | X |
| Demis Hassabis | Google DeepMind | X |
| Fei-Fei Li | Stanford / World Labs | X, arXiv |
| Geoffrey Hinton | University of Toronto | X, arXiv |
| Andrew Ng | DeepLearning.AI | X, Facebook |
| Sam Altman | OpenAI | X |
| Dario Amodei | Anthropic | X |

## 技术栈 / Tech Stack

| 组件 / Component | 技术 / Technology |
|---|---|
| 框架 / Framework | Electron 33+ |
| 前端 / Frontend | React 18 + TypeScript |
| 构建 / Build | Vite + electron-builder |
| 样式 / Styling | Tailwind CSS (Anthropic theme) |
| 状态管理 / State | Zustand |
| 爬取 / Scraping | axios + cheerio (arXiv/GitHub), puppeteer-core (X/Facebook) |
| 翻译 / Translation | DeepSeek API |
| 数据库 / Database | SQLite (better-sqlite3) |
| 调度 / Scheduling | node-cron |

## 快速开始 / Quick Start

### 环境要求 / Prerequisites

- Node.js 18+
- Chrome 或 Edge 浏览器（Puppeteer 需要）/ Chrome or Edge browser (required by Puppeteer)
- DeepSeek API Key（[获取 / Get one](https://platform.deepseek.com/)）

### 安装 / Install

```bash
git clone https://github.com/treeEnergy/ai-feed.git
cd ai-feed
npm install
```

### 开发模式 / Development

```bash
npm run dev
```

### 打包 / Build

```bash
npm run build
```

打包后的应用在 `release-v01/win-unpacked/AI Feed.exe`。

Built application is at `release-v01/win-unpacked/AI Feed.exe`.

### 配置 / Configuration

1. 启动应用后，点击左下角 **⚙ 齿轮图标** 进入设置 / Launch app, click **⚙ gear icon** to open settings
2. 输入你的 **DeepSeek API Key** / Enter your **DeepSeek API Key**
3. 选择同步频率 / Choose sync interval
4. 点击 **"立即同步"** 开始抓取 / Click **"Sync Now"** to start fetching

## 项目结构 / Project Structure

```
ai-feed/
├── electron/                # Electron 主进程 / Main process
│   ├── main.ts              # 应用入口 / App entry
│   ├── preload.ts           # IPC 桥接 / IPC bridge
│   ├── ipc.ts               # IPC 处理器 / IPC handlers
│   ├── scheduler.ts         # 定时调度 / Cron scheduler
│   ├── scraper/             # 爬虫引擎 / Scraper engine
│   │   ├── arxiv.ts         # arXiv 论文爬取 / arXiv paper scraper
│   │   ├── github.ts        # GitHub 仓库爬取 / GitHub repo scraper
│   │   ├── x.ts             # X/Twitter 爬取 / X/Twitter scraper
│   │   └── facebook.ts      # Facebook 爬取 / Facebook scraper
│   ├── translator/
│   │   └── deepseek.ts      # DeepSeek 翻译 / DeepSeek translator
│   └── storage/
│       ├── database.ts      # SQLite 数据库 / SQLite database
│       ├── queries.ts       # 查询层 / Query layer
│       └── settings.ts      # 设置持久化 / Settings persistence
├── src/                     # React 前端 / Frontend
│   ├── App.tsx              # 根布局 / Root layout
│   ├── components/          # UI 组件 / UI components
│   ├── stores/              # Zustand 状态 / Zustand stores
│   ├── hooks/               # React Hooks
│   └── types/               # TypeScript 类型 / Type definitions
└── docs/
    ├── design-system.md     # 设计系统 / Design system
    └── superpowers/
        └── specs/           # 设计文档 / Design specs
```

## 设计系统 / Design System

采用 Anthropic 官网风格的暖色调设计语言。详见 [docs/design-system.md](docs/design-system.md)。

Anthropic-inspired warm cream design language. See [docs/design-system.md](docs/design-system.md).

| 属性 / Property | 值 / Value |
|---|---|
| 主背景 / Primary BG | `#faf9f5` |
| 强调色 / Accent | `#c6613f` (Terracotta) |
| 主文字 / Primary Text | `#141413` |
| 正文字体 / Body Font | Source Serif 4 |
| UI 字体 / UI Font | Inter |
| 卡片圆角 / Card Radius | 16px |

## 许可 / License

MIT
