# CONTEXT.md — 给未来的 Claude

> 这个文件记录了这个 repo 的**当前状态**和**下一步待办**。
> 如果你是新一轮的 Claude 会话，请先读这个再干活。

---

## 这个 repo 是什么

这个 repo **同时包含两个相关但独立的项目**：

### 项目 1：AI Feed（Electron 桌面应用）—— 根目录
- 已存在的项目（用户 gcw 写的）
- 作用：抓取 10 位 AI 大佬在 X/GitHub/arXiv/Facebook 的内容，用 DeepSeek API 翻译成中文，Anthropic 风格卡片 UI 展示
- 关键文件：`electron/`、`src/`、`package.json`、`README.md`
- 状态：**基本完成，可用**
- 预设人物：Yann LeCun、Andrej Karpathy、Jim Fan、Ilya Sutskever、Demis Hassabis、Fei-Fei Li、Geoffrey Hinton、Andrew Ng、Sam Altman、Dario Amodei

### 项目 2：AI 编程情报库（Quartz 静态站）—— `site/` 目录
- 新建的项目，用户想要的"个人知识库网站"
- 基于 Quartz v4，用 Obsidian 编辑 markdown，Git 推送后 Vercel/Cloudflare 自动部署
- 关键文件：`site/content/`（笔记源）、`site/quartz.config.ts`（配置）、`site/README.md`（使用说明）
- 状态：**骨架完成，待做卡片 UI + DeepSeek 翻译工作流**
- 预设人物（8 位 AI 编程方向）：
  - Amjad Masad（Replit CEO，Vibe Coding）
  - Simon Willison（智能体工程模式）
  - DHH（Agent-first）
  - Charity Majors（可观测性/验证）
  - Birgitta Böckeler（Harness Engineering）
  - Gergely Orosz（Pragmatic Engineer）
  - Geoffrey Litt（可塑性软件）
  - Mitchell Hashimoto（Ghostty）

---

## 已完成

- [x] 搭建 Quartz v4 站点骨架到 `site/`
- [x] 8 位大佬人物档案页 + 4 个主题页（Vibe Coding / Agent-first / Harness Engineering / 可观测性与验证）+ 笔记目录
- [x] 配置中文 locale、站点标题「AI 编程情报库」
- [x] 关闭需要联网的 `CustomOgImages` 插件
- [x] `site/vercel.json` 部署配置
- [x] `site/README.md` 本地预览/部署/域名绑定文档
- [x] 本地构建 + `--serve` 模式验证通过（所有页面 HTTP 200）
- [x] 推送到分支 `claude/research-tech-leaders-channels-MFevZ`

---

## 待办（按优先级）

### 🔴 决策未定：两个项目怎么协作？

用户问了但还没选。选项：
- **A** 两套独立（Electron 本地用，Quartz 手工整理）
- **B** Electron app 加「导出到 Quartz」按钮，把翻译结果写成 markdown 到 `site/content/notes/`（**Claude 推荐**）
- **C** 抛弃 Electron，只做 Quartz + 独立翻译 CLI
- **D** 只做 Quartz 卡片 UI 美化

Claude 建议组合：**B + D**

### 🟡 卡片 UI 化（选项 D）

把 `site/content/people/index.md` 从表格改成 Anthropic 风格的卡片网格：
- 暖奶白背景（`#faf9f5`）
- Terracotta 强调色（`#c6613f`）
- Source Serif 4 字体
- 每张卡片：人物名 + 身份 + 1-2 句 pitch + 点击进详情页
- 最简单做法：`site/content/people/index.md` 里嵌 HTML + Quartz 的 custom CSS

### 🟡 DeepSeek 翻译工作流（选项 B 或 C）

- 用户 API：DeepSeek 3.2
- 可参考现有实现：`electron/translator/deepseek.ts`
- 两种形态：
  - **B**: 在 Electron app 里加"导出到 Quartz"按钮
  - **C**: 独立 CLI `npm run translate <url>` → 自动抓网页 → DeepSeek 翻译 → 生成 `site/content/notes/*.md`

### 🟢 可选改进

- 把 Quartz 的配色/字体换成 Anthropic 风格（暖奶白 + Terracotta + Source Serif）
- 主页用真正的卡片网格而不是链接列表
- 给 Quartz 添加自定义 React 组件（改 `site/quartz/components/`）
- 把 Electron app 里那 10 位 AI 研究大佬也加到 Quartz

---

## 用户偏好（从对话里总结）

- 中文为主，但代码注释/变量英文没问题
- 希望网页端能在**手机和电脑**都访问
- 目的是**自己整理信息**，不是公开发布（Google 不收录即可，不强求加密码）
- 愿意买域名（推荐 Cloudflare Registrar）
- 愿意用 Vercel 或 Cloudflare Pages 部署
- **不用 Obsidian Sync 付费**；手机端写笔记不是必需（只读即可）

---

## 环境/工具链备注

- Node.js 20+ 跑 Quartz
- 根目录是 Electron 项目（`npm install` 会装 Electron 依赖）
- `site/` 子目录是 Quartz 项目（需要单独 `cd site && npm install`）
- 两个项目的 `node_modules` 互不影响
- 测试构建命令：`cd site && npx quartz build`
- 测试预览命令：`cd site && npx quartz build --serve`（默认 8080 端口）

---

## 分支策略

- 开发分支：`claude/research-tech-leaders-channels-MFevZ`
- 主分支：`main`（未检查状态）
- 用户没要求合并到 main，所有 push 都到上面这条分支
