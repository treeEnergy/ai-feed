# AI Feed — 个人 AI 信源桌面应用设计文档

## 1. 概述

### 问题与动机
AI 领域的重要人物（Yann LeCun、Andrej Karpathy、Jim Fan 等）活跃在多个平台（X、GitHub、Facebook、arXiv），内容分散且大多为英文。手动跟踪费时费力，缺少一个统一的、中文友好的信息聚合入口。

### 目标
构建一个本地运行的 Electron 桌面应用，自动聚合 AI 大牛在各平台的动态，通过 DeepSeek API 翻译为中文，以类似微信公众号的卡片式阅读体验呈现。

### 成功标准
- 能定时从 X、GitHub、Facebook、arXiv 抓取指定人物的内容
- 内容自动翻译为中文，质量可读
- 界面美观（Anthropic 风格），阅读体验流畅
- 纯本地运行，无需部署服务器

---

## 2. 架构设计

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
│                                                  │
│  ┌──────────┐  IPC  ┌────────────────────────┐  │
│  │ Renderer │◄─────►│     Main Process       │  │
│  │ (React)  │       │                        │  │
│  │          │       │  ┌──────────────────┐  │  │
│  │ - 侧边栏  │       │  │  Scheduler       │  │  │
│  │ - 时间轴  │       │  │  (node-cron)     │  │  │
│  │ - 动态流  │       │  └────────┬─────────┘  │  │
│  │ - 设置页  │       │           │            │  │
│  └──────────┘       │  ┌────────▼─────────┐  │  │
│                     │  │  Scraper Engine   │  │  │
│                     │  │  ┌─────────────┐  │  │  │
│                     │  │  │ HTTP+Cheerio│  │  │  │
│                     │  │  │ (arXiv/GH)  │  │  │  │
│                     │  │  ├─────────────┤  │  │  │
│                     │  │  │ Puppeteer   │  │  │  │
│                     │  │  │ (X/Facebook)│  │  │  │
│                     │  │  └─────────────┘  │  │  │
│                     │  └────────┬─────────┘  │  │
│                     │           │            │  │
│                     │  ┌────────▼─────────┐  │  │
│                     │  │ Translator       │  │  │
│                     │  │ (DeepSeek API)   │  │  │
│                     │  └────────┬─────────┘  │  │
│                     │           │            │  │
│                     │  ┌────────▼─────────┐  │  │
│                     │  │ Storage          │  │  │
│                     │  │ (SQLite)         │  │  │
│                     │  └──────────────────┘  │  │
│                     └────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 进程分工

| 进程 | 职责 |
|------|------|
| Main Process | 爬取调度、数据抓取、翻译调用、数据库读写、系统托盘 |
| Renderer Process | UI 渲染、用户交互、通过 IPC 请求数据 |

---

## 3. 模块设计

### 3.1 数据源爬取引擎（Scraper Engine）

采用**混合爬取策略**：轻量 HTTP 优先，JS 渲染页面用 Puppeteer 降级。

#### 各平台爬取方案

| 平台 | 方式 | 爬取目标 | 说明 |
|------|------|---------|------|
| **arXiv** | HTTP + Cheerio | 论文标题、摘要、作者、链接 | 页面为静态 HTML，结构稳定。通过作者搜索页 `arxiv.org/search/?query=作者名` 获取 |
| **GitHub** | HTTP + Cheerio | 仓库动态、README、Star/Fork 数 | 公开页面可直接请求。获取用户公开活动 `github.com/用户名` |
| **X (Twitter)** | Puppeteer | 推文内容、时间、互动数据 | JS 重度渲染，需无头浏览器。通过用户主页 `x.com/用户名` 滚动加载 |
| **Facebook** | Puppeteer | 公开帖子内容 | JS 渲染 + 反爬较强。仅抓取公开可见内容 |

#### 爬取器接口

每个平台实现统一的 Scraper 接口：

```typescript
interface ScrapedItem {
  id: string;              // 唯一标识（平台+原始ID hash）
  platform: 'x' | 'github' | 'arxiv' | 'facebook';
  personId: string;        // 关联的人物 ID
  originalText: string;    // 原文内容
  translatedText?: string; // 中文翻译
  url: string;             // 原文链接
  publishedAt: Date;       // 发布时间
  scrapedAt: Date;         // 抓取时间
  metadata: {              // 平台特定元数据
    // X: 点赞数、转发数
    // GitHub: star数、fork数、语言
    // arXiv: 论文ID、分类、共同作者
    // Facebook: 反应数
    [key: string]: any;
  };
  topics?: string[];       // AI 自动生成的主题标签（1-2 个）
}

interface Scraper {
  platform: string;
  scrape(person: Person): Promise<ScrapedItem[]>;
}
```

#### 反爬与容错策略
- **请求间隔**：每次请求间随机延迟 2-5 秒
- **User-Agent 轮转**：维护常见浏览器 UA 列表
- **失败重试**：最多 3 次，指数退避
- **Puppeteer 复用**：X 和 Facebook 共享同一个浏览器实例，减少资源消耗
- **超时控制**：单次爬取最长 30 秒，超时跳过并记录日志

### 3.2 翻译模块（Translator）

使用 DeepSeek API 进行翻译。

```typescript
interface TranslationService {
  translate(text: string, context?: string): Promise<string>;
  translateBatch(items: ScrapedItem[]): Promise<ScrapedItem[]>;
}
```

#### 设计要点
- **批量翻译**：将同一次抓取的多条内容合并为一次 API 调用，减少请求次数和成本
- **Prompt 设计**：指定为 AI/ML 领域翻译，保留专业术语原文（如 Transformer、RLHF），确保翻译自然流畅
- **缓存**：已翻译内容存入数据库，相同内容不重复翻译
- **主题提取**：翻译的同时让 DeepSeek 提取 1-2 个关键主题标签（如"AGI"、"具身智能"、"开源"）
- **降级**：API 不可用时保留原文，标记为"待翻译"，下次调度时重试

#### API 调用示例 Prompt
```
你是一个 AI/ML 领域的专业翻译。请将以下英文内容翻译为流畅的中文。
规则：
1. 保留专业术语原文，如 Transformer、RLHF、AGI、LLM 等
2. 人名保持英文
3. 翻译要自然，不要翻译腔
4. 同时提取 1-2 个关键主题标签（中文）

原文：
{content}

请返回 JSON 格式：{"translation": "...", "topics": ["...", "..."]}
```

### 3.3 数据存储（Storage）

使用 **SQLite**（通过 better-sqlite3），纯本地，无需额外服务。

#### 数据表设计

```sql
-- 关注的人物
CREATE TABLE persons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,            -- 职位/简介
  avatarColor TEXT,      -- 头像渐变色
  platforms JSON,        -- 各平台 URL {"x": "...", "github": "...", ...}
  isPreset INTEGER DEFAULT 0,  -- 是否为预设人物
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 抓取的内容
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  personId TEXT NOT NULL REFERENCES persons(id),
  platform TEXT NOT NULL,
  originalText TEXT NOT NULL,
  translatedText TEXT,
  url TEXT,
  publishedAt TEXT NOT NULL,
  scrapedAt TEXT DEFAULT (datetime('now')),
  metadata JSON,
  topics JSON,           -- 主题标签数组
  isRead INTEGER DEFAULT 0,
  isStarred INTEGER DEFAULT 0,
  translationStatus TEXT DEFAULT 'pending'  -- pending | done | failed
);

-- 每周热点缓存
CREATE TABLE weekly_topics (
  weekStart TEXT NOT NULL, -- 周一日期
  personId TEXT,           -- NULL 表示全局热点
  topics JSON NOT NULL,    -- [{"name": "AGI", "count": 5}, ...]
  PRIMARY KEY (weekStart, personId)
);
```

#### 索引
```sql
CREATE INDEX idx_items_person_date ON items(personId, publishedAt DESC);
CREATE INDEX idx_items_platform ON items(platform);
CREATE INDEX idx_items_published ON items(publishedAt DESC);
CREATE INDEX idx_items_starred ON items(isStarred) WHERE isStarred = 1;
```

### 3.4 定时调度器（Scheduler）

使用 `node-cron` 在 Main Process 中运行。

- **默认间隔**：每 2 小时执行一次全量抓取
- **可配置**：用户可在设置中调整为 30 分钟 / 1 小时 / 2 小时 / 6 小时
- **流程**：抓取 → 去重（基于 item.id）→ 翻译 → 入库 → 通知 Renderer 刷新
- **启动时**：应用启动时立即执行一次抓取（如果距离上次抓取超过间隔时间）

### 3.5 每周热点分析

基于已存储的内容，统计每周的热门主题：

- 按周聚合所有 `items.topics` 中的标签
- 按出现频次排序，取 Top 3-5 个标签
- 支持按人物筛选（查看某个人本周在关注什么）
- 缓存到 `weekly_topics` 表，避免重复计算

---

## 4. 界面设计

### 4.1 设计风格

**Anthropic 官网风格**，暖色调、优雅、克制。

| 属性 | 值 |
|------|-----|
| 主背景 | `#faf9f5` |
| 次背景 | `#f0eee6` |
| 内容区背景 | `#f5f3ec` |
| 主文字 | `#141413` |
| 次要文字 | `#878680` |
| 弱文字 | `#b0aea5` |
| 强调色 | `#c6613f`（陶土橙） |
| 辅助色 | `#5c7a6e`（鼠尾草绿）、`#8b7355`（暖棕）、`#6b5b73`（梅紫） |
| 边框 | `rgba(20,20,19,0.06)` ~ `rgba(20,20,19,0.12)` |
| 卡片圆角 | 16px |
| 正文字体 | Source Serif 4（衬线体） |
| UI 字体 | Inter |

### 4.2 页面结构

```
┌──────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────────────────────────┐ │
│ │         │ │ 每周关注热点时间轴            │ │
│ │ 导航    │ ├──────────────────────────────┤ │
│ │ ·全部动态│ │ 内容头部（标题 + 平台过滤）  │ │
│ │ ·收藏   │ ├──────────────────────────────┤ │
│ │ ·论文追踪│ │                              │ │
│ │         │ │  动态卡片流                   │ │
│ │─────────│ │  ┌────────────────────────┐  │ │
│ │ 关注的人 │ │  │ 头像 · 姓名 · 来源 · 标签│  │ │
│ │ ·LeCun  │ │  │ 中文翻译正文            │  │ │
│ │ ·Karpathy│ │  │ 英文原文（折叠）        │  │ │
│ │ ·Jim Fan │ │  │ 操作按钮               │  │ │
│ │ ·...    │ │  └────────────────────────┘  │ │
│ │         │ │  ┌────────────────────────┐  │ │
│ │ +添加   │ │  │ 下一张卡片...           │  │ │
│ │         │ │  └────────────────────────┘  │ │
│ │─────────│ │                              │ │
│ │ 同步状态 │ │                              │ │
│ └─────────┘ └──────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 4.3 交互逻辑

| 操作 | 行为 |
|------|------|
| 点击「全部动态」 | 右侧显示所有关注人物的混合时间线，按发布时间倒序 |
| 点击某个人物 | 右侧筛选为该人物的所有动态，时间倒序 |
| 点击平台过滤标签 | 在当前视图基础上按平台过滤（可叠加人物筛选） |
| 点击时间轴上的某一周 | 动态流跳转到该周的内容区域 |
| 点击「原文」链接 | 在系统默认浏览器中打开原文 URL |
| 点击「收藏」 | 将该条目标记为收藏 |
| 点击「复制」 | 将中文翻译复制到剪贴板 |
| 点击「添加关注对象」 | 弹出对话框，输入姓名和各平台 URL |

### 4.4 设置页

- DeepSeek API Key 配置
- 抓取频率设置（30分钟 / 1小时 / 2小时 / 6小时）
- 人物管理（编辑/删除关注对象）
- 数据管理（清除缓存、导出数据）
- 代理设置（可选，用于网络受限环境）

---

## 5. 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Electron 33+ |
| 前端 | React 18 + TypeScript |
| 构建 | Vite + electron-builder |
| 样式 | Tailwind CSS（配置 Anthropic 主题色） |
| 状态管理 | Zustand |
| 轻量 HTTP 爬取 | axios + cheerio |
| JS 渲染爬取 | puppeteer-core（复用系统 Chrome） |
| 翻译 | DeepSeek API（openai 兼容接口） |
| 数据库 | better-sqlite3 |
| 定时任务 | node-cron |
| IPC 通信 | Electron ipcMain / ipcRenderer |

---

## 6. 预设人物列表

应用内置以下 AI 领域知名人物，用户可直接选择关注：

| 姓名 | 机构 | 主要平台 |
|------|------|---------|
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

---

## 7. 项目结构

```
ai-feed/
├── electron/
│   ├── main.ts              # Electron 主进程入口
│   ├── preload.ts           # preload 脚本（暴露 IPC 接口）
│   ├── scraper/
│   │   ├── index.ts         # 爬取调度入口
│   │   ├── base.ts          # Scraper 基类/接口
│   │   ├── x.ts             # X 平台爬取器
│   │   ├── github.ts        # GitHub 爬取器
│   │   ├── arxiv.ts         # arXiv 爬取器
│   │   └── facebook.ts      # Facebook 爬取器
│   ├── translator/
│   │   └── deepseek.ts      # DeepSeek 翻译服务
│   ├── storage/
│   │   ├── database.ts      # SQLite 数据库初始化与迁移
│   │   └── queries.ts       # 数据查询方法
│   └── scheduler.ts         # 定时任务调度
├── src/
│   ├── App.tsx              # React 应用入口
│   ├── components/
│   │   ├── Sidebar.tsx      # 左侧边栏（导航+人物列表）
│   │   ├── WeeklyTimeline.tsx  # 每周热点时间轴
│   │   ├── FeedList.tsx     # 动态卡片流
│   │   ├── FeedCard.tsx     # 单张动态卡片
│   │   ├── RepoCard.tsx     # GitHub 仓库卡片
│   │   ├── FilterBar.tsx    # 内容头部+平台过滤
│   │   ├── AddPersonDialog.tsx # 添加关注对象对话框
│   │   └── Settings.tsx     # 设置页面
│   ├── stores/
│   │   ├── feedStore.ts     # 动态数据状态
│   │   └── settingsStore.ts # 设置状态
│   ├── hooks/
│   │   └── useIPC.ts        # IPC 通信 hook
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   └── styles/
│       └── tailwind.config.ts  # Anthropic 主题色配置
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

---

## 8. 验证方案

### 开发阶段验证
1. **爬取验证**：逐平台测试，确认能获取到指定人物的最新内容
2. **翻译验证**：确认 DeepSeek API 调用正常，翻译质量可读，专业术语保留正确
3. **存储验证**：确认数据正确写入 SQLite，去重逻辑生效
4. **UI 验证**：确认界面与 mockup 一致，交互逻辑正确

### 端到端验证
1. 启动应用 → 选择关注人物 → 触发首次抓取 → 内容出现在动态流中
2. 点击某个人物 → 右侧正确筛选该人动态
3. 等待定时任务执行 → 新内容自动出现
4. 时间轴显示当周热点标签
5. 收藏/复制/查看原文功能正常

---

## 9. 已知风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| X/Facebook 反爬升级 | 无法获取内容 | Puppeteer 模拟真实用户行为；降级提示用户手动输入 |
| DeepSeek API 不可用 | 无法翻译 | 保留原文显示，标记待翻译，恢复后自动重试 |
| 爬取内容结构变更 | 解析失败 | 各平台爬取器独立，单平台失败不影响其他平台 |
| Puppeteer 内存占用 | 应用卡顿 | 爬取完毕后关闭浏览器实例；限制并发爬取数量 |
