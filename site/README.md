# AI 编程情报库（个人知识站）

> 基于 [Quartz v4](https://quartz.jzhao.xyz/) 搭建的个人知识库，用 [Obsidian](https://obsidian.md/) 编辑。

## 目录结构

```
site/
├── content/              # ← Obsidian vault，写笔记的地方
│   ├── index.md          # 首页
│   ├── people/           # 人物档案
│   ├── topics/           # 主题归纳
│   └── notes/            # 日常笔记 / 周报
├── quartz/               # Quartz 框架代码（一般不用动）
├── quartz.config.ts      # 站点配置（标题、域名、主题色等）
└── quartz.layout.ts      # 页面布局（侧栏、页脚等）
```

---

## 日常使用流程

### 1. 用 Obsidian 打开 vault

- 下载 [Obsidian](https://obsidian.md/) → "Open folder as vault" → 选择 `site/content/`
- 手机端装 Obsidian mobile，用 Obsidian Sync 或 iCloud/Syncthing 同步 `content/` 文件夹即可

### 2. 本地预览

```bash
cd site
npm install          # 只需运行一次
npx quartz build --serve
```

浏览器打开 http://localhost:8080 实时预览。

### 3. 发布到线上

```bash
git add .
git commit -m "更新笔记"
git push
```

推送后 Vercel / Cloudflare 会自动构建并部署（见下方「部署」）。

---

## 部署到 Vercel（推荐）

1. 在 [Vercel](https://vercel.com/) 注册账号
2. **Import Project** → 选这个 GitHub 仓库
3. 配置：
   - **Root Directory**：`site`
   - **Framework Preset**：Other
   - **Build Command**：`npx quartz build`
   - **Output Directory**：`public`
   - **Install Command**：`npm install`
4. 点 Deploy
5. 部署完成后，Vercel 给你一个 `xxx.vercel.app` 地址
6. 买了域名后，在 Vercel 项目的 **Settings → Domains** 里绑定

> 提示：`site/vercel.json` 已经配好了构建命令，直接导入就行。

## 部署到 Cloudflare Pages（免费额度更大）

1. [Cloudflare Pages](https://pages.cloudflare.com/) → Create a project → Connect to Git
2. 选仓库 → 配置：
   - **Build command**：`cd site && npm install && npx quartz build`
   - **Build output directory**：`site/public`
   - **Node version** 环境变量：`NODE_VERSION=20`
3. 部署完给你 `xxx.pages.dev`，同样可以绑域名

---

## 买域名

- **Cloudflare Registrar**（推荐）：成本价无套路，`.com` ~¥70/年
- 买完直接在 Vercel/Cloudflare 项目设置里绑定即可，**不需要国内备案**

---

## 配置定制

### 改站点标题
`site/quartz.config.ts` 的 `pageTitle`

### 改域名
`site/quartz.config.ts` 的 `baseUrl`（影响 RSS / OG 图 / sitemap 里的绝对链接）

### 改主题色
`site/quartz.config.ts` 的 `theme.colors`

### 改字体
`site/quartz.config.ts` 的 `theme.typography`

### 隐私保护
想让整站只有自己能看：
- Vercel：**Settings → Deployment Protection** 开 Password Protection（Pro 版）
- Cloudflare：加 Cloudflare Access 规则（免费额度够个人用）
- 或在 `site/content/private/` 里放不想发布的笔记，Quartz 已默认忽略 `private` 目录

---

## 参考

- Quartz 官方文档：https://quartz.jzhao.xyz/
- Obsidian：https://obsidian.md/
- Markdown 速查：https://quartz.jzhao.xyz/features/Obsidian-compatibility
