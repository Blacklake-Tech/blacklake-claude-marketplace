# 通用规范

本文档定义 init-project-3 skill 的通用规范和约定。

## 依赖的 Skills

### db-user
- **用途**: 查询租户信息，获取 orgId
- **调用时机**: 当用户提供工厂名称或编号而非 orgId 时
- **返回字段**:
  - `code`: 工厂编号
  - `id`: 租户ID (orgId)
  - `organization_name`: 工厂名称
  - `zone_id`: 云平台标识

### object-metadata
- **用途**: 获取对象的完整元数据
- **调用时机**: 获取 orgId 后，用于生成 Metadata.ts
- **返回格式**: JSON 对象，包含 fields 和 sonObjects 数组

## MCP 工具使用约定

### 查询租户信息
- **工具**: `mcp__plugin_coder-web-plugin_op__query_org_info`
- **参数**:
  - `zones`: 必填，平台区域数组
  - `organization_name`: 可选，工厂名称（模糊匹配）
  - `code`: 可选，工厂编号（模糊匹配）
  - `org_id`: 可选，租户ID（精确匹配）

### 查询对象元数据
- **工具**: `mcp__plugin_coder-web-plugin_op__query_meta_detail`
- **参数**:
  - `type`: 1 (自定义对象)
  - `meta_key`: 对象 code

## 参数格式约定

### zones 参数
平台区域标识，必须是以下值之一:
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

优先使用 code，因为它是唯一标识。

### 租户信息格式
用户可以提供以下任一形式:
- **工厂编号**: 如 `BLK001`
- **工厂名称**: 如 "黑湖智造"
- **orgId**: 数字 ID

优先使用 orgId，查询失败时尝试其他方式。

## 脚本约定

### 脚本路径
所有脚本位于 `skills/init-project-3/scripts/` 目录：
- `init-from-github.sh` - 克隆 GitHub 项目
- `generate-metadata.js` - 生成 Metadata.ts
- `validate-project.sh` - 验证项目完整性
- `templates.json` - 模板配置文件

### 脚本调用约定
1. 使用绝对路径调用脚本
2. 所有路径参数使用绝对路径
3. 检查脚本返回码（0=成功，1=失败）
4. 捕获脚本输出并展示给用户

### 临时文件约定
- 元数据 JSON: `/tmp/metadata-<timestamp>.json`
- 使用完毕后立即删除
- 不在用户目录创建临时文件

## 输出规范

### 命名约定

#### 项目目录名
- **规则**: kebab-case，基于对象名称
- **示例**:
  - "采购订单" → `purchase-order`
  - "生产工单" → `production-order`
  - "自定义对象344" → `custom-object-344`

#### 文件命名
- **React 组件**: PascalCase，如 `CustomObjectForm.tsx`
- **工具函数**: camelCase，如 `mockMode.ts`
- **类型定义**: camelCase，如 `customObject.ts`

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
- 检测目标目录是否存在且不为空
- **不询问用户**，直接终止并提示清空目录
- 避免误操作覆盖重要文件

### 网络失败
- 提供明确的网络错误提示
- 建议用户检查网络或使用 init-project-2

### 依赖安装失败
- **不中断流程**，继续生成 Metadata.ts
- 给出警告，提示用户稍后手动安装

## 验证约定

### 必需验证项
1. 租户信息有效性
2. 对象元数据完整性
3. Git 和 Node.js 已安装
4. 目标目录为空或不存在
5. 生成文件的语法正确性

### 可选验证项
1. TypeScript 类型检查
2. 依赖安装成功
3. 项目可以正常启动

## 输出格式约定

### 成功输出
```
✅ 项目初始化成功！

📁 项目目录: /path/to/project
📦 模板类型: custom-object (自定义对象)
🎯 对象代码: cust_object344__c
📊 字段数量: 35 个主字段
📎 从对象: 1 个

🚀 下一步操作:
1. cd /path/to/project
2. npm run dev         # 启动开发服务器
3. npm run build       # 构建生产版本
```

### 错误输出
```
❌ 初始化失败

错误原因: Git 未安装
建议: 请先安装 Git
  macOS: brew install git
  Ubuntu: sudo apt install git
```

### 警告输出
```
⚠️  依赖安装失败，请稍后手动执行:
cd /path/to/project
npm install
```

## 依赖版本约定

### 核心依赖
版本由 GitHub 模板决定，不在 skill 中硬编码。

参考模板 package.json:
- React: ^18.2.0
- TypeScript: ^5.0.0
- Vite: ^5.0.0
- Ant Design: ^5.10.0

### 模板更新策略
- 模板由 GitHub 仓库维护
- 每次克隆都获取最新版本
- skill 不负责版本管理

## 与其他 init-project skills 的区别

| 特性 | init-project-1 | init-project-2 | init-project-3 |
|------|----------------|----------------|----------------|
| 模板来源 | 本地 demos | 本地 demos | GitHub 远程 |
| 模板更新 | 手动更新 skill | 手动更新 skill | 自动获取最新 |
| 依赖安装 | 手动 | 手动 | 自动执行 |
| 网络要求 | 无 | 无 | 需要访问 GitHub |
| 可扩展性 | 中 | 低 | 高（templates.json） |
