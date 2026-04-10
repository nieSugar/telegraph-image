<div align="center">

# Telegraph Image

**基于 Next.js 的免费图床，图片存储于 Telegram，支持部署到 Cloudflare Workers / Vercel**

[![CI](https://github.com/nieSugar/telegraph-image/actions/workflows/ci.yml/badge.svg)](https://github.com/nieSugar/telegraph-image/actions/workflows/ci.yml)
[![Deploy](https://github.com/nieSugar/telegraph-image/actions/workflows/deploy.yml/badge.svg)](https://github.com/nieSugar/telegraph-image/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)
![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?logo=vercel)
![License](https://img.shields.io/github/license/nieSugar/telegraph-image)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FnieSugar%2Ftelegraph-image&env=TG_BOT_TOKEN,TG_CHAT_ID,CF_ACCOUNT_ID,CF_API_TOKEN,CF_DATABASE_ID,USER_NAME,PASSWORD&envDescription=%E9%85%8D%E7%BD%AE%20Telegram%20Bot%20%E5%92%8C%20Cloudflare%20D1%20%E6%95%B0%E6%8D%AE%E5%BA%93%E4%BF%A1%E6%81%AF&envLink=https%3A%2F%2Fgithub.com%2FnieSugar%2Ftelegraph-image%23%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E8%AF%B4%E6%98%8E&project-name=telegraph-image&repository-name=telegraph-image)

[功能特点](#功能特点) · [一键部署](#一键部署) · [手动部署](#手动部署) · [API 文档](#api-端点) · [故障排查](#故障排查)

</div>

---

## 功能特点

- 🖼️ 拖拽 / 点击上传图片，支持实时预览
- 🔗 上传后即时获取永久链接，一键复制
- 🛡️ 管理后台，可查看、搜索、删除图片
- 📡 REST API 支持第三方调用
- ☁️ 图片通过 Telegram Bot 永久存储，零存储成本
- 🗃️ 元数据持久化到 Cloudflare D1，查询极速
- 🌐 部署在 Cloudflare Workers 或 Vercel，全球边缘加速

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 & SSR | Next.js 15 + React 19 |
| 运行时 | Cloudflare Workers / Vercel |
| 数据库 | Cloudflare D1（SQLite） |
| 对象存储 | Telegram Bot API |
| 语言 | TypeScript |

---

## 一键部署

> 无论哪种方式，都需要提前准备好 **Telegram Bot** 和 **Cloudflare D1 数据库**（详见[环境变量说明](#环境变量说明)）。

### 方式一：部署到 Vercel（推荐新手）

点一下按钮，填好环境变量就完事，全程不用碰命令行。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FnieSugar%2Ftelegraph-image&env=TG_BOT_TOKEN,TG_CHAT_ID,CF_ACCOUNT_ID,CF_API_TOKEN,CF_DATABASE_ID,USER_NAME,PASSWORD&envDescription=%E9%85%8D%E7%BD%AE%20Telegram%20Bot%20%E5%92%8C%20Cloudflare%20D1%20%E6%95%B0%E6%8D%AE%E5%BA%93%E4%BF%A1%E6%81%AF&envLink=https%3A%2F%2Fgithub.com%2FnieSugar%2Ftelegraph-image%23%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E8%AF%B4%E6%98%8E&project-name=telegraph-image&repository-name=telegraph-image)

1. 点击上方按钮，使用 GitHub 登录 Vercel
2. Vercel 会自动 fork 仓库并提示填写环境变量（见下方[环境变量说明](#环境变量说明)）
3. 点击 **Deploy**，等待构建完成
4. 部署成功后会得到一个 `*.vercel.app` 域名，直接可用

> **原理**：Vercel 上运行的是标准 Next.js，数据库通过 Cloudflare D1 REST API 远程访问，无需 D1 binding。

### 方式二：部署到 Cloudflare Workers

通过 GitHub Actions 自动构建并部署到 Cloudflare Workers 边缘网络。

1. **Fork 本仓库**

   点击右上角 **Fork** 按钮将仓库 fork 到你的 GitHub 账号下。

2. **创建 Cloudflare D1 数据库**

   登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → D1 → **Create database**，记下 `database_id`。

   然后在 D1 控制台的 **Console** 标签里执行 [`sql/init.sql`](./sql/init.sql) 的内容来初始化表结构。

3. **配置 GitHub Secrets**

   进入你 fork 的仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，添加以下 secrets：

   | Secret 名称 | 说明 |
   |---|---|
   | `CF_ACCOUNT_ID` | Cloudflare 账户 ID（Dashboard 右侧栏可见） |
   | `CF_API_TOKEN` | Cloudflare API Token（需要 Workers + D1 权限） |
   | `CF_DATABASE_ID` | D1 数据库 UUID |
   | `TG_BOT_TOKEN` | Telegram Bot Token |
   | `TG_CHAT_ID` | 目标聊天的 chat_id |
   | `USER_NAME` | 管理后台登录用户名 |
   | `PASSWORD` | 管理后台登录密码 |

4. **更新 `wrangler.jsonc`**

   修改 fork 仓库中的 `wrangler.jsonc`，把 `d1_databases` 里的 `database_id` 替换成你的 D1 数据库 ID：

   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "telegraph-image",
       "database_id": "<your-database-id>"
     }
   ]
   ```

5. **触发部署**

   推送任意 commit 到 `main` 分支，或进入 **Actions** → **Deploy to Cloudflare** → **Run workflow** 手动触发。

   部署成功后，Cloudflare Dashboard 会显示分配的 `*.workers.dev` 域名。

### 两种部署方式对比

| | Cloudflare Workers | Vercel |
|---|---|---|
| 运行时 | 边缘计算（全球 300+ 节点） | Serverless Functions |
| D1 访问方式 | 原生 binding（低延迟） | REST API（略高延迟） |
| 冷启动 | 极低（~0ms） | 较低（~250ms） |
| 免费额度 | 10 万次请求/天 | 100GB 带宽/月 |
| 部署难度 | 需配置 wrangler + Secrets | 点按钮填变量即可 |

---

## 手动部署

### 前置条件

- Node.js 20+
- pnpm
- Cloudflare 账号 + D1 数据库
- Telegram Bot Token + Chat ID

### 1. 克隆与安装

```bash
git clone https://github.com/nieSugar/telegraph-image.git
cd telegraph-image
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入以下必选项：

| 变量 | 说明 |
|---|---|
| `TG_BOT_TOKEN` | 从 @BotFather 获取 |
| `TG_CHAT_ID` | 目标私聊/群组/频道的 chat_id |
| `CF_ACCOUNT_ID` | Cloudflare 账户 ID |
| `CF_API_TOKEN` | 至少有 D1 读写权限的 API Token |
| `CF_DATABASE_ID` | D1 数据库 UUID |
| `USER_NAME` | 管理后台用户名 |
| `PASSWORD` | 管理后台密码 |

### 3. 初始化 D1 数据库

```bash
pnpm wrangler d1 execute telegraph-image --file=./sql/init.sql --remote
```

或在 Cloudflare Dashboard 的 D1 控制台手动执行 `sql/init.sql`。

### 4. 配置 `wrangler.jsonc`

确保 `d1_databases` 中的 `database_id` 是你的 D1 数据库 UUID：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "telegraph-image",
      "database_id": "<your-database-id>"
    }
  ]
}
```

### 5. 本地开发

```bash
pnpm dev
# 访问 http://localhost:3200
```

### 6. 构建与预览

```bash
pnpm build:cf        # OpenNext 构建
pnpm preview:cf      # 本地模拟 Cloudflare Worker
```

> Windows 下 OpenNext 预览偶有不稳定，推荐在 WSL 或类 Unix 环境验证。

### 7. 部署

```bash
pnpm deploy
```

---

## 项目结构

```
telegraph-image/
├── .github/workflows/     # CI & CD 工作流
├── sql/init.sql           # D1 初始化脚本
├── src/
│   ├── pages/             # Next.js 页面与 API 路由
│   │   ├── api/
│   │   │   ├── auth/login.ts       # 登录认证
│   │   │   ├── upload/image.ts     # 图片上传
│   │   │   ├── images/             # 图片管理 CRUD
│   │   │   └── cfile/[id].ts       # 图片代理分发
│   │   ├── index.tsx               # 首页（上传）
│   │   ├── admin.tsx               # 管理后台
│   │   └── login.tsx               # 登录页
│   ├── services/telegram.ts  # Telegram 上传与文件读取
│   ├── utils/db.ts            # D1 数据访问层
│   ├── components/            # UI 组件
│   └── types/                 # TypeScript 类型
├── open-next.config.ts    # OpenNext Cloudflare 适配
├── wrangler.jsonc         # Cloudflare Worker 配置
├── next.config.js         # Next.js 配置
└── .env.example           # 环境变量示例
```

---

## API 端点

### 登录

```
POST /api/auth/login
Content-Type: application/json

{ "username": "admin", "password": "password" }
```

成功：`{ "success": true }`
失败：`{ "success": false, "message": "用户名或密码错误" }`

### 上传图片

```
POST /api/upload/image
Content-Type: multipart/form-data

file: <图片文件>
```

成功：

```json
{
  "success": true,
  "urls": ["https://your-domain.example/api/cfile/<file-id>"]
}
```

### 图片访问

```
GET /api/cfile/<file-id>
```

直接返回图片二进制内容，可用于 `<img>` 标签或浏览器直接访问。

### 图片管理

```
GET    /api/images          # 分页查询图片列表
GET    /api/images/:id      # 查询单张图片
DELETE /api/images/:id      # 删除图片（软删除）
```

---

## 环境变量说明

无论使用哪种部署方式，都需要配置以下环境变量：

| 变量 | 必填 | 说明 | 获取方式 |
|---|:---:|---|---|
| `TG_BOT_TOKEN` | ✅ | Telegram Bot Token | 在 Telegram 搜索 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 创建 |
| `TG_CHAT_ID` | ✅ | 目标聊天的 chat_id | 将 Bot 加入聊天后，访问 `https://api.telegram.org/bot<TOKEN>/getUpdates` |
| `CF_ACCOUNT_ID` | ✅ | Cloudflare 账户 ID | [Cloudflare Dashboard](https://dash.cloudflare.com/) 右侧栏 |
| `CF_API_TOKEN` | ✅ | Cloudflare API Token | Dashboard → My Profile → API Tokens，需 D1 读写权限 |
| `CF_DATABASE_ID` | ✅ | D1 数据库 UUID | 创建 D1 数据库后在详情页获取 |
| `USER_NAME` | ✅ | 管理后台登录用户名 | 自定义 |
| `PASSWORD` | ✅ | 管理后台登录密码 | 自定义 |

> **D1 数据库初始化**：创建 D1 数据库后，需要在 D1 控制台的 Console 里执行 [`sql/init.sql`](./sql/init.sql) 初始化表结构，否则应用会报错。

---

## 故障排查

| 问题 | 排查方向 |
|---|---|
| 预览时 `Internal Server Error` | 检查 `wrangler.jsonc` 是否配了 `d1_databases`；`.env` 变量是否齐全；D1 是否已执行 init.sql |
| `pnpm build:cf` 失败 | 先 `pnpm install`；确认依赖版本与 `@opennextjs/cloudflare` 兼容；Windows 下优先用 WSL |
| 上传失败 / 文件回源 404 | 检查 Bot 是否已加入目标聊天；`TG_CHAT_ID` 是否正确；Bot 是否有发消息权限 |
| GitHub Actions 部署失败 | 确认所有 Secrets 已正确添加；`wrangler.jsonc` 中 `database_id` 已更新 |
| Vercel 部署后 500 错误 | 检查环境变量是否填写完整；D1 数据库是否已执行 init.sql；API Token 是否有 D1 权限 |

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nieSugar/telegraph-image&type=Date)](https://www.star-history.com/#nieSugar/telegraph-image&Date)

---

<div align="center">

如果觉得有用，请点个 ⭐ Star 支持一下！

</div>
