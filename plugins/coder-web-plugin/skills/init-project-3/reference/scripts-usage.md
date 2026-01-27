# 脚本使用说明

本文档详细说明 init-project-3 skill 使用的各个脚本的参数、返回值和独立测试方法。

## 脚本概览

| 脚本 | 语言 | 用途 | 依赖 |
|------|------|------|------|
| init-from-github.sh | Bash | 克隆 GitHub 项目 | git, node |
| generate-metadata.js | Node.js | 生成 Metadata.ts | node |
| validate-project.sh | Bash | 验证项目完整性 | bash, npx (可选) |
| templates.json | JSON | 模板配置 | - |

## init-from-github.sh

### 功能
从 GitHub 克隆项目模板，清理 Git 历史，重新初始化仓库，并安装依赖。

### 参数

| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| --template | string | 是 | 模板类型 | custom-object |
| --target-dir | string | 是 | 目标目录（绝对路径） | /Users/siting/projects/test-app |
| --object-name | string | 是 | 对象名称（用于 Git 提交） | 采购订单 |

### 返回值

- **成功**: 退出码 0
- **失败**: 退出码 1

### 输出示例

成功:
```
📦 克隆模板: custom-object
   仓库: https://github.com/Blacklake-Tech/coder-custom-object.git
   目标: /Users/siting/projects/test-app

🔄 开始克隆...
✅ 克隆成功

🧹 清理 Git 历史...
✅ Git 仓库重新初始化

📁 移动文件到目标目录...
✅ 文件移动完成

📦 安装依赖...
✅ 依赖安装成功

✅ 项目克隆完成: /Users/siting/projects/test-app
```

失败:
```
错误: 缺少 --template 参数
```

```
错误: 未安装 Git，请先安装 Git
```

```
⚠️  目标目录已存在且不为空: /Users/siting/projects/test-app
   请先清空目录或选择其他目录
```

### 独立测试

```bash
# 测试克隆自定义对象模板
bash plugins/coder-web-plugin/skills/init-project-3/scripts/init-from-github.sh \
  --template custom-object \
  --target-dir /tmp/test-custom-object \
  --object-name "测试对象"

# 验证输出
ls -la /tmp/test-custom-object
cat /tmp/test-custom-object/package.json

# 清理测试目录
rm -rf /tmp/test-custom-object
```

### 错误处理

| 错误场景 | 检测方法 | 处理方式 |
|----------|----------|----------|
| Git 未安装 | `command -v git` | 终止，提示安装 |
| Node.js 未安装 | `command -v node` | 终止，提示安装 |
| 网络失败 | `git clone` 退出码 | 终止，提示检查网络 |
| 目标目录冲突 | 检查目录是否为空 | 终止，提示清空目录 |
| npm 未安装 | `command -v npm` | 警告，继续 |
| 依赖安装失败 | `npm install` 退出码 | 警告，继续 |

## generate-metadata.js

### 功能
读取对象元数据 JSON，生成 Metadata.ts TypeScript 代码。

### 参数

| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| --metadata-json | string | 是 | 元数据 JSON 文件路径 | /tmp/metadata.json |
| --object-code | string | 是 | 对象 code | cust_object344__c |
| --output | string | 是 | 输出文件路径 | /tmp/test-app/src/Metadata.ts |
| --template | string | 否 | 模板类型（默认 custom-object） | custom-object |

### 返回值

- **成功**: 退出码 0
- **失败**: 退出码 1

### 输出示例

成功:
```
✅ Metadata.ts 已生成: /tmp/test-app/src/Metadata.ts
   对象 code: cust_object344__c
   字段数量: 35
   从对象数量: 1
```

失败:
```
错误: 缺少 --metadata-json 参数
```

```
错误: 无法读取元数据文件: ENOENT: no such file or directory
```

```
错误: 字段数组为空
```

### 独立测试

```bash
# 1. 准备测试元数据 JSON
cat > /tmp/test-metadata.json << 'EOF'
{
  "fields": [
    {
      "id": 1001,
      "relatedObjectCode": "test_object__c",
      "fieldCode": "test_field",
      "fieldName": "测试字段",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 0,
      "isName": 1,
      "isRefer": 0,
      "choiceValues": null
    }
  ],
  "sonObjects": []
}
EOF

# 2. 生成 Metadata.ts
node plugins/coder-web-plugin/skills/init-project-3/scripts/generate-metadata.js \
  --metadata-json /tmp/test-metadata.json \
  --object-code test_object__c \
  --output /tmp/test-Metadata.ts \
  --template custom-object

# 3. 验证输出
cat /tmp/test-Metadata.ts

# 4. 清理测试文件
rm -f /tmp/test-metadata.json /tmp/test-Metadata.ts
```

### 转换规则

详见 [元数据转换规则](./metadata-transform.md)。

核心规则：
1. `DEFAULT_OBJECT_CODE`: 从 `--object-code` 参数获取
2. `normalizeField`: 从模板复制，不修改
3. `mockFields`: 保持 0/1 格式，使用 `.map(normalizeField)`
4. `mockSubObjects`: 简化格式，直接转换 0/1 为 boolean
5. `choiceValues`: 只保留 `choiceCode` 和 `choiceValue`

## validate-project.sh

### 功能
验证项目结构和完整性，包括关键文件检查、依赖检查和 TypeScript 编译检查。

### 参数

| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| 项目目录 | string | 是 | 项目目录路径（位置参数） | /tmp/test-app |

### 返回值

- **成功**: 退出码 0
- **失败**: 退出码 1

### 输出示例

成功:
```
🔍 验证项目: /tmp/test-app
✅ 关键文件完整
✅ 依赖已安装
✅ TypeScript 类型验证通过

✅ 项目验证完成
```

失败:
```
❌ 缺少必需文件:
   - package.json
   - src/Metadata.ts
```

### 独立测试

```bash
# 1. 准备测试项目
mkdir -p /tmp/test-validation/src
touch /tmp/test-validation/package.json
touch /tmp/test-validation/tsconfig.json
touch /tmp/test-validation/src/Metadata.ts

# 2. 验证项目
bash plugins/coder-web-plugin/skills/init-project-3/scripts/validate-project.sh \
  /tmp/test-validation

# 3. 清理测试目录
rm -rf /tmp/test-validation
```

### 验证项

| 验证项 | 必需 | 检测方法 | 失败处理 |
|--------|------|----------|----------|
| package.json | 是 | 文件是否存在 | 终止 |
| tsconfig.json | 是 | 文件是否存在 | 终止 |
| src/Metadata.ts | 是 | 文件是否存在 | 终止 |
| node_modules | 否 | 目录是否存在 | 警告 |
| TypeScript 编译 | 否 | `npx tsc --noEmit` | 警告 |

## templates.json

### 功能
定义可用的项目模板配置。

### 配置格式

```json
{
  "templates": {
    "<template-id>": {
      "name": "模板名称",
      "description": "模板描述",
      "github_url": "GitHub 仓库地址",
      "metadata_path": "Metadata.ts 文件路径（相对于项目根目录）",
      "project_type": "项目类型（如 react-vite）",
      "supported_zones": ["支持的环境列表"],
      "status": "状态（可选，coming-soon 表示即将推出）"
    }
  },
  "default_template": "默认模板 ID"
}
```

### 示例配置

```json
{
  "templates": {
    "custom-object": {
      "name": "自定义对象",
      "description": "自定义业务对象的前端页面",
      "github_url": "https://github.com/Blacklake-Tech/coder-custom-object.git",
      "metadata_path": "src/Metadata.ts",
      "project_type": "react-vite",
      "supported_zones": ["feature", "test", "pre", "prod-ali", "prod-hw", "prod-gt"]
    },
    "work-order": {
      "name": "工单",
      "description": "工单管理的前端页面",
      "github_url": "https://github.com/Blacklake-Tech/coder-work-order.git",
      "metadata_path": "src/Metadata.ts",
      "project_type": "react-vite",
      "supported_zones": ["feature", "test", "pre", "prod-ali", "prod-hw", "prod-gt"],
      "status": "coming-soon"
    }
  },
  "default_template": "custom-object"
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| name | string | 是 | 模板显示名称 |
| description | string | 是 | 模板描述 |
| github_url | string | 是 | GitHub 仓库完整 URL |
| metadata_path | string | 是 | Metadata.ts 文件路径（相对于项目根目录） |
| project_type | string | 是 | 项目类型标识 |
| supported_zones | array | 是 | 支持的环境列表 |
| status | string | 否 | 模板状态，`coming-soon` 表示即将推出 |

### 独立测试

```bash
# 验证 JSON 格式
cat plugins/coder-web-plugin/skills/init-project-3/scripts/templates.json | jq .

# 读取特定模板配置
cat plugins/coder-web-plugin/skills/init-project-3/scripts/templates.json | \
  jq '.templates["custom-object"]'

# 列出所有可用模板
cat plugins/coder-web-plugin/skills/init-project-3/scripts/templates.json | \
  jq -r '.templates | to_entries[] | select(.value.status != "coming-soon") | .key'
```

## 完整测试流程

### 端到端测试

```bash
# 1. 设置变量
TEMPLATE="custom-object"
TARGET_DIR="/tmp/test-e2e-project"
OBJECT_NAME="测试对象"
OBJECT_CODE="test_object__c"

# 2. 准备元数据
cat > /tmp/e2e-metadata.json << 'EOF'
{
  "fields": [
    {
      "id": 1001,
      "relatedObjectCode": "test_object__c",
      "fieldCode": "name",
      "fieldName": "名称",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 1,
      "isName": 1,
      "isRefer": 0,
      "choiceValues": null
    }
  ],
  "sonObjects": []
}
EOF

# 3. 克隆项目
bash plugins/coder-web-plugin/skills/init-project-3/scripts/init-from-github.sh \
  --template "$TEMPLATE" \
  --target-dir "$TARGET_DIR" \
  --object-name "$OBJECT_NAME"

# 4. 生成 Metadata.ts
node plugins/coder-web-plugin/skills/init-project-3/scripts/generate-metadata.js \
  --metadata-json /tmp/e2e-metadata.json \
  --object-code "$OBJECT_CODE" \
  --output "$TARGET_DIR/src/Metadata.ts" \
  --template "$TEMPLATE"

# 5. 验证项目
bash plugins/coder-web-plugin/skills/init-project-3/scripts/validate-project.sh \
  "$TARGET_DIR"

# 6. 检查结果
echo "项目结构:"
tree -L 2 "$TARGET_DIR"

echo "Metadata.ts 内容:"
head -20 "$TARGET_DIR/src/Metadata.ts"

# 7. 清理
rm -rf "$TARGET_DIR" /tmp/e2e-metadata.json
```

## 错误码参考

| 错误码 | 含义 | 可能原因 |
|--------|------|----------|
| 0 | 成功 | 操作正常完成 |
| 1 | 失败 | 参数错误、文件不存在、网络失败等 |

## 调试技巧

### 启用详细输出

在脚本开头添加 `set -x`:
```bash
#!/bin/bash
set -e
set -x  # 启用调试模式
```

### 保留临时文件

注释掉清理命令:
```bash
# rm -rf "$TEMP_DIR"  # 暂时注释，用于调试
```

### 检查脚本退出码

```bash
bash script.sh
echo "退出码: $?"
```

### 捕获脚本输出

```bash
bash script.sh > /tmp/script-output.log 2>&1
cat /tmp/script-output.log
```

## 常见问题

### Q1: 如何跳过依赖安装？

A: 修改 `init-from-github.sh`，注释掉 `npm install` 部分，或者在克隆后手动删除 node_modules。

### Q2: 如何使用自定义模板？

A: 修改 `templates.json`，添加新的模板配置，然后使用新的模板 ID。

### Q3: 如何处理 Git 克隆超时？

A: 检查网络连接，或者尝试使用 Gitee 镜像（需要修改 `templates.json`）。

### Q4: 如何验证 Metadata.ts 生成正确？

A: 使用 `npx tsc --noEmit` 检查 TypeScript 类型错误，或者手动对比生成的文件和预期格式。
