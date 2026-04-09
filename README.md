<img src="https://github.com/nieSugar/telegraph-image/actions/workflows/ci.yml/badge.svg" alt="Workflow status badge" loading="lazy" height="20">

## 项目简介

Telegraph Image 是一个基于 `Next.js` 和 `Cloudflare Workers` 的图床应用。图片上传后会转存到 Telegram，并把元数据记录到 Cloudflare D1，最终通过站点自己的 `/api/cfile/:id` 链接对外分发。

## 部署到 Cloudflare

### 1. 前置条件

- Cloudflare 账号
- Telegram Bot Token 和目标 Chat ID
- 一个已经创建好的 Cloudflare D1 数据库
- Node.js 20+ 和 `pnpm`

### 2. 安装依赖

```bash
git clone https://github.com/nieSugar/telegraph-image.git
cd telegraph-image
pnpm install
```

### 3. 配置环境变量

复制 `./.env.example` 为 `./.env`，至少补齐下面这些值：

- `TG_BOT_TOKEN`
- `TG_CHAT_ID`
- `CF_ACCOUNT_ID`
- `CF_API_TOKEN`
- `CF_DATABASE_ID`
- `USER_NAME`
- `PASSWORD`

说明：

- `TG_BOT_TOKEN`：从 `@BotFather` 获取
- `TG_CHAT_ID`：目标私聊、群组或频道的 `chat_id`
- `CF_ACCOUNT_ID`：Cloudflare 账号 ID
- `CF_API_TOKEN`：至少具备 D1 读写权限的 API Token
- `CF_DATABASE_ID`：D1 数据库 ID

### 4. 初始化 D1 数据库

先在 Cloudflare 控制台创建 D1 数据库，然后执行 `sql/init.sql` 初始化表结构。

如果你已经在 `wrangler.jsonc` 中配置好了 D1 binding，可以直接用 `wrangler` 执行：

```bash
pnpm wrangler d1 execute <your-database-name> --file=./sql/init.sql --remote
```

如果还没配 binding，也可以先在 Cloudflare Dashboard 的 D1 控制台手动执行 `sql/init.sql`。

### 5. 配置 `wrangler.jsonc`

当前仓库里的 `wrangler.jsonc` 只包含基础 Worker 和静态资源配置。要让 Cloudflare 预览和部署环境能访问 D1，你还需要补上 `d1_databases` binding。

参考配置如下：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "telegraph-image",
  "compatibility_date": "2025-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "<your-database-name>",
      "database_id": "<your-database-id>"
    }
  ]
}
```

注意：

- `binding` 名称需要和代码里使用的数据库 binding 保持一致
- `database_id` 必须是 D1 的真实 UUID
- 本地 `next dev` 主要依赖 `.env` 里的 `CF_*` 变量；Cloudflare 预览和线上环境还需要正确配置 D1 binding

### 6. 本地开发

```bash
pnpm dev
```

默认访问地址：

- `http://localhost:3200`

### 7. Cloudflare 构建与预览

```bash
pnpm build:cf
pnpm preview:cf
```

说明：

- `pnpm build:cf` 会通过 `@opennextjs/cloudflare` 生成 `.open-next/worker.js`
- `pnpm preview:cf` 用于本地模拟 Cloudflare Worker 运行时
- Windows 下 `OpenNext` 预览偶尔会出现不稳定行为，优先推荐在 `WSL` 或类 Unix 环境下验证

### 8. 部署到 Cloudflare

```bash
pnpm deploy
```

部署前建议先确认：

- `pnpm build:cf` 已通过
- D1 binding 已配置
- `.env` 中的 Telegram 与管理后台变量完整
- D1 表结构已初始化

## 功能特点

- 简洁的用户界面
- 支持拖放上传图片
- 快速获取图片链接
- 一键复制图片链接
- 支持图片预览
- API接口支持第三方调用

## 技术栈

- **前端/服务端框架**: Next.js 15
- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1
- **对象存储方案**: Telegram Bot API
- **类型检查**: TypeScript
- **HTTP 请求**: Axios / Fetch
- **文件上传解析**: Formidable
- **代码检查**: ESLint

## 开始使用

### 前提条件

- Node.js 20.x 或更高版本
- pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/nieSugar/telegraph-image.git

# 进入项目目录
cd telegraph-image

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动开发服务器
pnpm dev
```

### 构建

```bash
# Next.js 构建
pnpm build

# OpenNext Cloudflare 构建
pnpm build:cf

# 本地预览 Cloudflare Worker
pnpm preview:cf
```

### 代码检查

```bash
# 运行 ESLint 检查
pnpm lint
```

## 项目结构

```
telegraph-image/
├── sql/init.sql              # D1 初始化脚本
├── src/
│   ├── pages/                # Next.js 页面与 API 路由
│   ├── services/telegram.ts  # Telegram 上传与文件读取
│   ├── utils/db.ts           # D1 与 Cloudflare 数据访问
│   ├── components/           # UI 组件
│   └── types/                # 类型定义
├── open-next.config.ts       # OpenNext Cloudflare 配置
├── wrangler.jsonc            # Cloudflare Worker 配置
├── next.config.js            # Next.js 配置
└── .env.example              # 环境变量示例
```

## API 端点

### 认证 API

**登录**
- 路径: `/api/auth/login`
- 方法: `POST`
- 请求体:
  ```json
  {
    "username": "admin",
    "password": "password"
  }
  ```
- 响应:
  ```json
  {
    "success": true
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "用户名或密码错误"
  }
  ```

### 图片上传 API

**上传图片并返回站内可访问链接**
- 路径: `/api/upload/image`
- 方法: `POST`
- 请求格式: `multipart/form-data`
- 字段:
  - `file`: 图片文件
- 响应:
  ```json
  {
    "success": true,
    "urls": ["https://your-domain.example/api/cfile/<telegram-file-id>"]
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "上传失败，服务器错误"
  }
  ```

## 第三方服务

该项目依赖以下外部服务：

- Telegram Bot API：用于图片上传和文件回源
- Cloudflare D1：用于保存图片元数据
- Cloudflare Workers：用于运行 API 和静态站点

## 故障排查

### 访问预览地址时出现 `Internal Server Error`

- 检查 `wrangler.jsonc` 是否配置了 `d1_databases`
- 检查 `.env` 中的 `TG_BOT_TOKEN`、`TG_CHAT_ID`、`CF_ACCOUNT_ID`、`CF_API_TOKEN`、`CF_DATABASE_ID`
- 确认 D1 已执行 `sql/init.sql`
- 先执行一次 `pnpm build:cf`，再执行 `pnpm preview:cf`

### `pnpm build:cf` 构建失败

- 先执行 `pnpm install`
- 确认依赖版本与 `@opennextjs/cloudflare` 兼容
- 如果是在 Windows 下构建，优先用 `WSL` 复现和排查

### 上传失败或文件回源失败

- 检查 Telegram Bot 是否已被加入目标聊天
- 检查 `TG_CHAT_ID` 是否填写正确
- 检查 Bot 是否有向目标聊天发消息的权限

## 贡献指南

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nieSugar/telegraph-image&type=Date)](https://www.star-history.com/#nieSugar/telegraph-image&Date)
