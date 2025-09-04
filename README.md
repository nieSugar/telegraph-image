<img src="https://github.com/nieSugar/telegraph-image/actions/workflows/ci.yml/badge.svg" alt="Workflow status badge" loading="lazy" height="20">

## 项目简介

Telegraph Image 是一个用于图片上传与管理的网络应用。用户可以轻松上传图片并获取永久链接，方便在各种平台分享和使用。

## 功能特点

- 简洁的用户界面
- 支持拖放上传图片
- 快速获取图片链接
- 一键复制图片链接
- 支持图片预览

## 技术栈

- **前端框架**: React 19
- **类型检查**: TypeScript
- **路由管理**: React Router v7
- **UI组件库**: Grommet
- **样式解决方案**: Styled Components
- **构建工具**: Vite 7
- **代码检查**: ESLint

## 开始使用

### 前提条件

- Node.js 20.x 或更高版本
- Yarn 包管理器

### 安装

```bash
# 克隆仓库
git clone https://github.com/nieSugar/telegraph-image.git

# 进入项目目录
cd telegraph-image

# 安装依赖
yarn install
```

### 开发

```bash
# 启动开发服务器
yarn dev
```

### 构建

```bash
# 生产环境构建
yarn build

# 预览构建结果
yarn preview
```

### 代码检查

```bash
# 运行 ESLint 检查
yarn lint
```

## 项目结构

```
telegraph-image/
├── public/           # 静态资源
├── src/              # 源代码
│   ├── components/   # 可复用组件
│   ├── contexts/     # React 上下文
│   ├── pages/        # 页面组件
│   ├── utils/        # 工具函数
│   ├── App.tsx       # 应用入口组件
│   └── main.tsx      # 应用入口文件
├── .github/          # GitHub相关配置
├── package.json      # 项目依赖和脚本
└── vite.config.ts    # Vite 配置文件
```

## 贡献指南

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nieSugar/telegraph-image&type=Date)](https://www.star-history.com/#nieSugar/telegraph-image&Date)
