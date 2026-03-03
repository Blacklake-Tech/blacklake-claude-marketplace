# 模板注册表

本文档说明如何添加新的项目模板到 init-project-3 skill。

## 模板系统设计

### 核心思想

- **配置化**: 通过 `templates.json` 配置模板，无需修改脚本
- **可扩展**: 支持自定义对象、工单、物料等多种业务类型
- **统一接口**: 所有模板共享相同的克隆和生成逻辑

### 模板类型

| 模板 ID | 名称 | 状态 | GitLab 仓库 |
|---------|------|------|-------------|
| custom-object | 自定义对象 | ✅ 可用 | [aicoder-fe](https://gitlab.blacklake.tech/frontend/aicoder-fe) |
| work-order | 工单 | 🚧 即将推出 | [aicoder-fe](https://gitlab.blacklake.tech/frontend/aicoder-fe) |
| material | 物料 | 🚧 即将推出 | [aicoder-fe](https://gitlab.blacklake.tech/frontend/aicoder-fe) |

## 添加新模板

### 步骤 1: 准备 GitLab 仓库

创建新的模板仓库，确保符合以下要求：

#### 必需文件
- `package.json` - npm 依赖配置
- `tsconfig.json` - TypeScript 配置
- `src/Metadata.ts` - 对象元数据文件
- `src/types/` - 类型定义目录
- `README.md` - 项目说明

#### 项目结构

```
coder-<template-name>/
├── src/
│   ├── index.tsx          # 入口文件
│   ├── Metadata.ts        # 元数据（将被替换）
│   ├── types/             # 类型定义
│   │   ├── common.ts
│   │   ├── <业务类型>.ts  # 如 customObject.ts, workOrder.ts
│   │   └── index.ts
│   ├── components/        # React 组件
│   ├── services/          # API 服务
│   └── utils/             # 工具函数
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

#### Metadata.ts 格式要求

**必需导出**:
- `DEFAULT_OBJECT_CODE`: 对象 code 常量
- `normalizeField`: 字段转换函数（如果需要）
- `mockFields`: 字段数组
- `mockSubObjects`: 从对象数组（可选）

**示例**:
```typescript
import type { FieldDTO, SubObjectDTO } from './types/customObject';

export const DEFAULT_OBJECT_CODE = 'placeholder__c';

const normalizeField = (field: any): FieldDTO => {
  // ... 转换逻辑
};

export let mockFields: FieldDTO[] = [
  // ... 占位数据
].map(normalizeField);

export let mockSubObjects: SubObjectDTO[] = [];
```

### 步骤 2: 更新 templates.json

在 `scripts/templates.json` 中添加新模板配置：

```json
{
  "templates": {
    "custom-object": { ... },
    "work-order": {
      "name": "工单",
      "description": "工单管理的前端页面",
      "gitlab_url": "https://gitlab.blacklake.tech/frontend/aicoder-fe.git",
      "metadata_path": "src/Metadata.ts",
      "project_type": "react-vite",
      "supported_zones": ["feature", "test", "pre", "prod-ali", "prod-hw", "prod-gt"]
    }
  }
}
```

### 步骤 3: 扩展 generate-metadata.js（如果需要）

如果新模板的元数据格式与自定义对象不同，需要在 `generate-metadata.js` 中添加模板特定的转换逻辑。

#### 判断是否需要扩展

| 场景 | 是否需要扩展 |
|------|--------------|
| 字段格式与自定义对象相同 | ❌ 不需要 |
| 字段格式不同（如工单的状态流转） | ✅ 需要 |
| 有额外的元数据类型（如物料的 BOM 结构） | ✅ 需要 |

#### 扩展示例

```javascript
/**
 * 生成工单的 Metadata.ts
 */
function generateWorkOrderMetadata(metadata, objectCode) {
  const fields = metadata.fields || [];
  const statusFlow = metadata.statusFlow || [];  // 工单特有

  // ... 生成逻辑

  return `/**
 * 工单 Mock 数据
 */
import type { FieldDTO, StatusFlowDTO } from './types/workOrder';

export const DEFAULT_OBJECT_CODE = '${objectCode}';

// 字段定义
export let mockFields: FieldDTO[] = ${generateMockFields(fields)};

// 状态流转定义（工单特有）
export let mockStatusFlow: StatusFlowDTO[] = ${JSON.stringify(statusFlow, null, 2)};
`;
}

/**
 * 根据模板类型生成 Metadata.ts
 */
function generateMetadata(template, metadata, objectCode) {
  switch (template) {
    case 'custom-object':
      return generateCustomObjectMetadata(metadata, objectCode);
    case 'work-order':
      return generateWorkOrderMetadata(metadata, objectCode);  // 新增
    case 'material':
      return generateMaterialMetadata(metadata, objectCode);    // 新增
    default:
      throw new Error(`未知模板类型: ${template}`);
  }
}
```

### 步骤 4: 测试新模板

```bash
# 1. 测试克隆
bash scripts/init-from-gitlab.sh \
  --template work-order \
  --target-dir /tmp/test-work-order \
  --object-name "测试工单"

# 2. 准备测试元数据
cat > /tmp/work-order-metadata.json << 'EOF'
{
  "fields": [...],
  "statusFlow": [...]  // 如果有特殊字段
}
EOF

# 3. 测试生成 Metadata.ts
node scripts/generate-metadata.js \
  --metadata-json /tmp/work-order-metadata.json \
  --object-code test_work_order__c \
  --output /tmp/test-work-order/src/Metadata.ts \
  --template work-order

# 4. 验证项目
bash scripts/validate-project.sh /tmp/test-work-order

# 5. 检查生成的 Metadata.ts
cat /tmp/test-work-order/src/Metadata.ts

# 6. 清理
rm -rf /tmp/test-work-order /tmp/work-order-metadata.json
```

### 步骤 5: 更新文档

1. 在 `SKILL.md` 的"支持的模板"部分添加新模板
2. 更新本文档的"模板类型"表格
3. 添加新模板的特殊说明（如果有）

## 模板兼容性要求

### 必需符合的规范

1. **项目类型**: 必须是 React + TypeScript + Vite
2. **目录结构**: 遵循标准结构（src/, public/, package.json 等）
3. **Metadata.ts**: 位于 `src/Metadata.ts`
4. **类型定义**: 必须有 `src/types/` 目录
5. **可独立运行**: 克隆后执行 `npm install && npm run dev` 可以启动

### 推荐符合的规范

1. **代码风格**: 使用 ESLint + Prettier
2. **组件库**: 使用 Ant Design
3. **状态管理**: 根据需要选择（Context API、Zustand 等）
4. **API 服务**: 统一在 `src/services/` 目录
5. **工具函数**: 统一在 `src/utils/` 目录

## 模板版本管理

### 版本策略

- **模板版本**: 由 GitLab 仓库管理（通过 Git tags）
- **Skill 版本**: 不依赖特定模板版本，始终使用最新

### 如何固定模板版本

如果需要使用特定版本的模板，修改 `templates.json`:

```json
{
  "templates": {
    "custom-object": {
      "gitlab_url": "https://gitlab.blacklake.tech/frontend/aicoder-fe.git",
      "git_ref": "v1.0.0"  // 添加此字段
    }
  }
}
```

然后修改 `init-from-gitlab.sh`:

```bash
# 读取 git_ref（如果有）
GIT_REF=$(echo "$TEMPLATE_CONFIG" | node -e "
  const tpl = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  console.log(tpl.git_ref || 'main');
")

# 克隆指定分支或标签
git clone --depth 1 --branch "$GIT_REF" "$GITLAB_URL" "$TEMP_DIR"
```

## 常见问题

### Q1: 如何支持 Gitee 镜像？

A: 在 `templates.json` 中为每个模板添加 `gitee_mirror` 字段：

```json
{
  "templates": {
    "custom-object": {
      "gitlab_url": "https://gitlab.blacklake.tech/frontend/aicoder-fe.git",
      "gitee_mirror": "https://gitee.com/blacklake/aicoder-fe.git"
    }
  }
}
```

然后修改 `init-from-gitlab.sh`，添加重试逻辑：

```bash
# 尝试 GitLab，失败则尝试 Gitee
if ! git clone --depth 1 "$GITLAB_URL" "$TEMP_DIR" 2>&1; then
  echo "⚠️  GitLab 克隆失败，尝试 Gitee 镜像..."
  git clone --depth 1 "$GITEE_MIRROR" "$TEMP_DIR"
fi
```

### Q2: 如何支持私有仓库？

A: 需要配置 SSH 密钥或 Personal Access Token：

**SSH 方式**:
```json
{
  "gitlab_url": "git@gitlab.blacklake.tech:frontend/aicoder-fe.git"
}
```

**HTTPS + Token 方式**:
```bash
# 设置环境变量
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxx"

# 在克隆时使用 Token
git clone https://${GITLAB_TOKEN}@gitlab.blacklake.tech/frontend/aicoder-fe.git
```

### Q3: 如何添加非 React 的模板？

A: 目前 `generate-metadata.js` 假设是 React + TypeScript 项目。如果需要支持其他框架：

1. 在 `templates.json` 中添加 `project_type` 字段
2. 在 `generate-metadata.js` 中根据 `project_type` 使用不同的生成逻辑
3. 确保新框架的项目结构符合基本要求

### Q4: 模板仓库需要特殊的文件吗？

A: 不需要。模板仓库就是一个标准的 React 项目，唯一特殊的是 `src/Metadata.ts` 会被替换。

## 最佳实践

### 模板命名

- 使用 kebab-case: `custom-object`, `work-order`, `material-tracking`
- 使用描述性名称: 避免 `template-1`, `app-2` 等无意义名称
- 仓库名称与模板 ID 一致: `coder-custom-object` 对应 `custom-object`

### 模板文档

每个模板仓库应包含：
- `README.md`: 项目说明、启动方式、功能特性
- `CHANGELOG.md`: 版本更新记录
- `docs/`: 详细文档（可选）

### 模板维护

- 定期更新依赖版本
- 及时修复安全漏洞
- 保持与最新 React/TypeScript 版本兼容
- 添加单元测试和集成测试

### 模板发布

1. 在 GitLab 创建 Release
2. 使用语义化版本号（如 v1.0.0）
3. 在 Release Notes 中说明变更内容
4. 更新模板文档

## 模板清单

在创建新模板前，确认以下清单：

- [ ] GitLab 仓库已创建
- [ ] 项目可以独立运行（npm install && npm run dev）
- [ ] 包含必需文件（package.json, tsconfig.json, src/Metadata.ts）
- [ ] Metadata.ts 格式符合要求
- [ ] README.md 文档完整
- [ ] 已添加到 templates.json
- [ ] 已测试克隆和生成流程
- [ ] 已更新 SKILL.md 和本文档
