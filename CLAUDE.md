# CLAUDE.md

> 给 Claude Code 的长期项目指引。每次新会话开始时自动读取。

## 本 repo 的双项目结构

本 repo 同时包含两个项目：

1. **根目录**：`ai-feed` Electron 桌面应用（已存在）
2. **`site/` 目录**：Quartz v4 静态知识站（新建）

**重要**：在根目录 `npm install` 装的是 Electron 的依赖；在 `site/` 目录 `npm install` 装的是 Quartz 的依赖。两套互不影响。

## 做事之前

- 先读 `CONTEXT.md` 了解当前进度和待办
- 有变更时同步更新 `CONTEXT.md`

## 编码偏好

- **回复用中文**（用户是中文用户）
- **代码注释/变量名用英文**，除非用户明确要求中文
- **Commit 消息用英文**，风格参考 `git log` 里已有的（如 `feat:`、`fix:`、`docs:`）
- **不要过度工程**：用户说自用、简单就好
- **不要删除已有 Electron app 的代码**，它是 repo 的主体

## Quartz 站点约定

- 内容放 `site/content/`，Obsidian 当 vault 用
- 人物档案在 `site/content/people/`
- 主题归纳在 `site/content/topics/`
- 日常笔记在 `site/content/notes/`
- 每个 markdown 顶部都要有 frontmatter（`title`、`tags` 等）
- 内部链接用 Obsidian 的 `[[wiki-link]]` 语法

## Quartz 构建/验证

修改 `site/` 下文件后，要跑一次构建确认没报错：

```bash
cd site && npx quartz build
```

临时预览：

```bash
cd site && npx quartz build --serve
# 访问 http://localhost:8080
```

**注意**：`CustomOgImages` 插件已在 `quartz.config.ts` 里注释掉（需要联网拉字体）。如果用户想要社交媒体预览图，可以取消注释。

## DeepSeek 翻译

用户使用 DeepSeek 3.2 API。现有实现在 `electron/translator/deepseek.ts`，可以复用/参考。翻译任何大佬内容时：

- 保留专业术语（如 Vibe Coding、Agent-first、Harness Engineering）
- 原文链接必须保留
- 输出格式：markdown，带 frontmatter

## 分支

开发在 `claude/research-tech-leaders-channels-MFevZ`。不要 push 到其他分支，除非用户明确要求。

## 部署

Quartz 站计划部署到 Vercel（Root Directory = `site`）或 Cloudflare Pages。用户还没实际部署，域名也没买。`site/vercel.json` 已预配好。
