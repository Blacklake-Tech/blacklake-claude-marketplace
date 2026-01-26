# 通用规范

本文档定义 init-project skill 的通用规范和约定。

## 依赖的 Skills

### db-user
- **用途**: 查询租户信息,获取 orgId
- **调用时机**: 当用户提供工厂名称或编号而非 orgId 时
- **返回字段**:
  - `code`: 工厂编号
  - `id`: 租户ID (orgId)
  - `organization_name`: 工厂名称
  - `zone_id`: 云平台标识

### object-metadata
- **用途**: 获取对象的完整元数据
- **调用时机**: 获取 orgId 后,用于生成 Metadata.ts
- **返回格式**: JSON 对象,包含 fields 和 sonObjects 数组

## MCP 工具使用约定

### 查询租户信息
- **工具**: `mcp__plugin_coder-web-plugin_op__query_org_info`
- **参数**:
  - `zones`: 必填,平台区域数组
  - `organization_name`: 可选,工厂名称(模糊匹配)
  - `code`: 可选,工厂编号(模糊匹配)
  - `org_id`: 可选,租户ID(精确匹配)

### 查询对象元数据
- **工具**: `mcp__plugin_coder-web-plugin_op__query_meta_detail`
- **参数**:
  - `type`: 1 (自定义对象)
  - `meta_key`: 对象 code

## 参数格式约定

### zones 参数
平台区域标识,必须是以下值之一:
- `["feature"]` - 开发环境
- `["test"]` - 测试环境
- `["pre"]` - 预发布环境
- `["prod-ali"]` - 阿里云生产环境
- `["prod-hw"]` - 华为云生产环境
- `["prod-gt"]` - 国泰云生产环境

**默认值**: `["feature"]`

### 对象信息格式
用户可以提供以下任一形式:
- **对象 code**: 如 `cust_object344__c`
- **对象名称**: 如 "自定义对象344"
- **对象 id**: 数字 ID

优先使用 code,因为它是唯一标识。

### 租户信息格式
用户可以提供以下任一形式:
- **工厂编号**: 如 `BLK001`
- **工厂名称**: 如 "黑湖智造"
- **orgId**: 数字 ID

优先使用 orgId,查询失败时尝试其他方式。

## 输出规范

### 命名约定

#### 项目目录名
- **规则**: kebab-case,基于对象名称
- **示例**:
  - "采购订单" → `purchase-order`
  - "生产工单" → `production-order`
  - "自定义对象344" → `custom-object-344`

#### 文件命名
- **React 组件**: PascalCase,如 `CustomObjectForm.tsx`
- **工具函数**: camelCase,如 `mockMode.ts`
- **类型定义**: camelCase,如 `customObject.ts`

### 代码风格

#### TypeScript
- 使用 2 空格缩进
- 使用单引号
- 导出类型使用 `export type` 或 `export interface`
- 优先使用函数式组件和 Hooks

#### 注释
- 文件头部添加用途说明
- 复杂逻辑添加行内注释
- 类型定义添加 JSDoc 注释

### 项目结构约定

```
<project-name>/
├── src/
│   ├── index.tsx          # 入口文件
│   ├── Metadata.ts        # 对象元数据
│   ├── types/             # 类型定义
│   ├── components/        # React 组件
│   ├── services/          # API 服务
│   └── utils/             # 工具函数
├── public/
│   └── index.html         # HTML 模板
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── README.md              # 项目说明
```

## 错误处理约定

### 查询失败
- 记录详细错误信息
- 提供用户友好的错误提示
- 建议用户检查参数

### 参数缺失
- 明确指出缺失的参数
- 提供示例值
- 不猜测用户意图

### 目录冲突
- 检测目标目录是否存在
- 询问用户是否覆盖
- 默认不覆盖

## 验证约定

### 必需验证项
1. 租户信息有效性
2. 对象元数据完整性
3. 目标目录可写性
4. 生成文件的语法正确性

### 可选验证项
1. TypeScript 类型检查
2. ESLint 代码规范
3. 依赖安装成功

## 输出格式约定

### 成功输出
```
✅ 项目初始化完成!

项目路径: /path/to/project
项目类型: custom-object
对象名称: 采购订单 (purchase_order)
字段数量: 15
从对象数量: 2

下一步:
  cd /path/to/project
  npm install
  npm run dev
```

### 错误输出
```
❌ 初始化失败

错误原因: 无法找到租户信息
提供的参数: 工厂名称="不存在的工厂"
建议: 请检查工厂名称是否正确,或提供 orgId
```

### 警告输出
```
⚠️  警告

目标目录已存在: /path/to/project
是否覆盖? (y/n)
```

## 依赖版本约定

### 核心依赖
- React: ^18.2.0
- TypeScript: ^5.0.0
- Vite: ^5.0.0
- Ant Design: ^5.10.0

### 工具依赖
- ESLint: ^8.50.0
- Prettier: ^3.0.0

所有依赖版本应与 demos/custom-object 保持一致。
