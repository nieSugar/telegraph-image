<img src="https://github.com/nieSugar/telegraph-image/actions/workflows/ci.yml/badge.svg" alt="Workflow status badge" loading="lazy" height="20">

## 项目简介

Telegraph Image 是一个用于图片上传与管理的网络应用。用户可以轻松上传图片到Telegraph服务并获取永久链接，方便在各种平台分享和使用。

## 功能特点

- 简洁的用户界面
- 支持拖放上传图片
- 快速获取图片链接
- 一键复制图片链接
- 支持图片预览
- API接口支持第三方调用

## 技术栈

- **前端框架**: React 18
- **服务端框架**: Next.js 14
- **类型检查**: TypeScript
- **UI组件库**: Grommet
- **样式解决方案**: Styled Components
- **HTTP请求**: Axios
- **代码检查**: ESLint
- **表单处理**: Formidable

## 开始使用

### 前提条件

- Node.js 18.x 或更高版本
- npm 或 Yarn 包管理器

### 安装

```bash
# 克隆仓库
git clone https://github.com/nieSugar/telegraph-image.git

# 进入项目目录
cd telegraph-image

# 安装依赖
npm install
# 或
yarn install
```

### 开发

```bash
# 启动开发服务器
npm run dev
# 或
yarn dev
```

### 构建

```bash
# 生产环境构建
npm run build
# 或
yarn build

# 启动生产服务器
npm run start
# 或
yarn start
```

### 代码检查

```bash
# 运行 ESLint 检查
npm run lint
# 或
yarn lint
```

## 项目结构

```
telegraph-image/
├── public/               # 静态资源
├── src/                  # 源代码
│   ├── components/       # 可复用组件
│   │   └── ProtectedRoute.tsx  # 路由保护组件
│   ├── contexts/         # React上下文
│   │   ├── AuthContext.tsx  # 认证上下文提供者
│   │   ├── AuthContextType.ts # 认证上下文类型定义
│   │   └── useAuth.ts    # 认证钩子
│   ├── pages/            # Next.js页面组件
│   │   ├── _app.tsx      # 应用入口
│   │   ├── index.tsx     # 首页路由
│   │   ├── login.tsx     # 登录页路由
│   │   ├── admin.tsx     # 管理页路由(受保护)
│   │   ├── HomePage.tsx  # 首页组件
│   │   ├── LoginPage.tsx # 登录页组件
│   │   ├── AdminPage.tsx # 管理页组件
│   │   └── api/          # API端点
│   │       ├── auth/     # 认证相关API
│   │       │   └── login.ts # 登录API
│   │       └── upload/   # 上传相关API
│   │           └── image.ts # 图片上传API
│   └── utils/            # 工具函数
│       └── authUtils.ts  # 认证相关工具函数
├── next.config.js        # Next.js配置
├── package.json          # 项目依赖
└── tsconfig.json         # TypeScript配置
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

**上传图片到Telegraph**
- 路径: `/api/upload/image`
- 方法: `POST`
- 请求格式: `multipart/form-data`
- 字段:
  - `file`: 图片文件
- 响应:
  ```json
  {
    "success": true,
    "urls": ["https://telegra.ph/file/xxxx.jpg"]
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "上传失败，服务器错误"
  }
  ```

## 第三方 API 调用

该应用使用Telegraph API来上传图片:

- Telegraph图片上传API: `https://telegra.ph/upload`

## 自定义和扩展

### 添加新的API端点

在`src/pages/api`目录下创建新的文件或目录来添加更多API端点。例如，添加获取上传历史的API:

```typescript
// src/pages/api/history/uploads.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 实现获取上传历史的逻辑
}
```

### 调用其他第三方API

要添加对其他第三方API的调用，可以在API端点中使用axios:

```typescript
import axios from 'axios';

// 在API处理函数中
const response = await axios.get('https://api.example.com/data');
```

## 贡献指南

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nieSugar/telegraph-image&type=Date)](https://www.star-history.com/#nieSugar/telegraph-image&Date)
