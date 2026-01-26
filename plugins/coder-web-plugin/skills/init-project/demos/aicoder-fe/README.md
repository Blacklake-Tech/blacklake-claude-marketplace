# AICoder-FE

基于 React + TypeScript + Vite 的前端项目，用于自定义对象（CustomObject）的管理。

## 项目简介

本项目是一个现代化的前端应用，采用 React 17 + TypeScript + Vite 构建，集成了 Ant Design 组件库和 React Redux 状态管理，适用于快速开发企业级前端应用。

## 技术栈

- **框架**: React 17
- **构建工具**: Vite 4
- **语言**: TypeScript
- **UI 组件库**: Ant Design 4
- **状态管理**: React Redux
- **路由**: React Router 5
- **样式**: Less / SCSS
- **HTTP 客户端**: Axios
- **国际化**: react-intl-universal

## 项目目录结构

```
aicoder-fe/
├── build.sh                    # 构建脚本
├── index.html                  # 入口 HTML 文件
├── package.json                # 项目依赖配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.base.json          # TypeScript 基础配置
├── vite.config.ts              # Vite 构建配置
├── README.md                   # 项目说明文档
│
├── public/                     # 静态资源目录
│   └── index.html              # 公共 HTML 文件
│
├── scripts/                    # 脚本目录
│   ├── build.sh                # 构建脚本
│   └── git/                    # Git 相关脚本
│       ├── env.js              # 环境变量脚本
│       ├── release-tag.js      # 发布标签脚本
│       ├── release-version.js  # 发布版本脚本
│       ├── utils.js            # 工具函数
│       └── work-start.js       # 工作开始脚本
│
└── src/                        # 源代码目录
    ├── index.tsx               # 应用入口文件
    ├── index.css               # 全局样式
    ├── ErrorBoundary.tsx       # 错误边界组件
    │
    ├── api/                    # API 接口目录
    │   ├── index.ts            # API 入口
    │   ├── request.ts           # 请求封装
    │   ├── customObject.ts     # 自定义对象 API
    │   └── customObjectMock.ts # 自定义对象 Mock 数据
    │
    ├── components/              # 公共组件目录
    │   ├── index.ts            # 组件导出
    │   ├── operationIcon.tsx   # 操作图标组件
    │   ├── utils.ts            # 组件工具函数
    │   └── styles/             # 组件样式
    │       ├── DataFormLayout.less
    │       ├── DetailLayout.less
    │       ├── DetailLayoutContent.less
    │       └── styles.less
    │
    ├── pages/                   # 页面目录
    │   ├── App.tsx             # 应用主组件
    │   ├── App.css             # 应用样式
    │   └── customObject/       # 自定义对象页面
    │       ├── index.tsx       # 页面入口
    │       ├── constants.ts    # 常量定义
    │       ├── utils.ts        # 工具函数
    │       ├── mockData.ts     # Mock 数据
    │       ├── list.tsx        # 列表页面
    │       ├── detail.tsx      # 详情页面
    │       ├── create.tsx      # 创建页面
    │       ├── edit.tsx        # 编辑页面
    │       └── copy.tsx        # 复制页面
    │
    ├── types/                   # TypeScript 类型定义
    │   ├── index.ts            # 类型导出
    │   ├── api.ts              # API 类型
    │   ├── common.ts           # 通用类型
    │   └── customObject.ts     # 自定义对象类型
    │
    └── utils/                   # 工具函数目录
        ├── index.ts            # 工具函数导出
        ├── auth.ts             # 认证工具
        ├── mockMode.ts         # Mock 模式工具
        ├── openapiAuth.ts      # OpenAPI 认证工具
        └── postMessage.ts      # PostMessage 工具
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建并检查类型
npm run build:check

# 预览构建结果
npm run preview

# Git 工作流相关
npm run work:start          # 工作开始
npm run release:tag         # 发布标签
npm run release:version     # 发布版本
npm run env                 # 环境变量
```

## 主要功能

### 自定义对象管理

项目提供了完整的自定义对象（CustomObject）管理功能：

- **列表页面**: 展示自定义对象列表，支持搜索、筛选和分页
- **详情页面**: 查看自定义对象的详细信息
- **创建页面**: 创建新的自定义对象
- **编辑页面**: 编辑现有自定义对象
- **复制页面**: 复制现有自定义对象

### 核心特性

- ✅ 基于 React Router 的路由管理
- ✅ 错误边界处理（ErrorBoundary）
- ✅ PostMessage 通信机制
- ✅ Mock 数据支持
- ✅ API 请求封装
- ✅ TypeScript 类型安全
- ✅ Less 样式支持
- ✅ 响应式布局

## 开发说明

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动，并自动打开浏览器。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `build` 目录。

## 配置说明

### Vite 配置

- **开发服务器端口**: 3000
- **API 代理**: `/api` 代理到 `https://v3-feature.blacklake.cn`
- **构建输出目录**: `build`
- **CDN 支持**: 生产环境支持部分依赖通过 CDN 加载

### Less 主题定制

项目使用 Less 进行样式定制，主题色配置在 `vite.config.ts` 中：

- 主色: `#02B980`
- 成功色: `#52c41a`
- 警告色: `#faad14`
- 错误色: `#f5222d`

## 注意事项

1. 项目使用 TypeScript，请确保类型定义正确
2. API 请求统一通过 `src/api/request.ts` 封装
3. 组件样式使用 Less，支持主题定制
4. 开发环境支持 Mock 数据，可通过 `src/utils/mockMode.ts` 配置
5. 生产构建会自动注入版本信息和 Git 提交信息

## License

Private
