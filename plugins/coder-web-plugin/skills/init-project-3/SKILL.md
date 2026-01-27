---
name: init-project-3
aliases: [clone-template, github-init]
description: 从 GitHub 克隆项目模板并自动配置，支持自定义对象、工单、物料等多种模板
---

# 前端项目初始化（从 GitHub 克隆）

## 功能说明

本 skill 从 GitHub 克隆项目模板并自动配置元数据，适合需要使用最新模板的场景。

**与其他 skills 的区别**:
- `init-project-1`: 参考模板重新生成，灵活度高
- `init-project-2`: 复制本地模板，速度快，离线可用
- `init-project-3`: 克隆 GitHub 模板，始终最新，自动化程度高（本 skill）

**支持的模板**:
- ✅ `custom-object` - 自定义对象管理系统（当前可用）
- 🚧 `work-order` - 工单管理系统（即将推出）
- 🚧 `material` - 物料管理系统（即将推出）

**主要特性**:
- 自动从 GitHub 克隆最新模板
- 自动安装项目依赖（npm install）
- 自动生成 Metadata.ts
- 清理 Git 历史并重新初始化
- 支持多种模板类型（通过配置扩展）

## 通用规范

参考: [通用规范](./COMMON.md)

**依赖的 skills**:
- `db-user` - 查询租户信息
- `object-metadata` - 获取对象元数据

**MCP 工具**:
- `query_org_info` - 查询租户信息
- `query_meta_detail` - 查询对象元数据

## 主流程

### 阶段 1: 收集参数

询问用户以下参数:

**必需参数**:
- 模板类型 (默认: `custom-object`)
- 目标目录路径
- 租户信息 (以下三选一):
  - 工厂名称 (如 "黑湖智造")
  - 工厂编号 (如 "BLK001")
  - orgId (数字 ID)
- 对象信息 (以下三选一):
  - 对象 code (如 "cust_object344__c")
  - 对象名称 (如 "自定义对象344")
  - 对象 id (数字 ID)

**可选参数**:
- 环境 zones (默认: `["feature"]`)

**参数示例**:
```
模板类型: custom-object
目标目录: ~/projects/purchase-order
租户信息: 黑湖智造
对象信息: purchase_order
环境: ["feature"]
```

**验证**:
- 检查目标目录是否存在且不为空
- 如果存在且不为空，终止执行并提示用户

### 阶段 2: 获取 orgId

**目的**: 如果用户提供的是工厂名称或编号，需要查询获取 orgId

**步骤**:
1. 判断用户提供的租户信息类型
2. 如果不是 orgId，调用 db-user skill 查询
3. 记录返回的 `id` 字段作为 orgId

**db-user skill 调用**:
```
使用 db-user skill
参数:
  - zones: ["feature"]
  - organization_name: "黑湖智造"  (如果用户提供名称)
  - code: "BLK001"               (如果用户提供编号)
```

**处理结果**:
- 成功: 提取 `id` 字段作为 orgId
- 失败: 尝试另一种查询方式 (名称→编号→orgId)
- 都失败: 提示用户检查租户信息

**示例输出**:
```
✅ 找到租户信息
工厂名称: 黑湖智造
工厂编号: BLK001
orgId: 10162960
zone_id: 7 (feature)
```

### 阶段 3: 获取对象元数据

**目的**: 获取对象的完整字段定义和从对象信息

**步骤**:
1. 确定对象 code (优先使用 code，否则通过名称查询)
2. 调用 object-metadata skill 获取元数据
3. 验证元数据完整性
4. **保存元数据到临时 JSON 文件**（供后续脚本使用）

**object-metadata skill 调用**:
```
使用 object-metadata skill
参数:
  - object_code: "cust_object344__c"
  - org_id: 10162960
  - zones: ["feature"]
```

**返回数据结构**:
```json
{
  "fields": [...],      // 字段定义数组
  "sonObjects": [...]   // 从对象定义数组
}
```

**保存元数据**:
```bash
# 创建临时文件
TEMP_METADATA="/tmp/metadata-$(date +%s).json"
echo '<元数据 JSON>' > "$TEMP_METADATA"
```

**验证**:
- fields 数组不为空
- 至少有一个字段的 isName=1 (主属性)
- relatedObjectCode 一致

**示例输出**:
```
✅ 获取对象元数据成功
对象名称: 自定义对象344
对象 code: cust_object344__c
字段数量: 35
从对象数量: 1
```

### 阶段 4: 克隆 GitHub 项目

**执行脚本**:
```bash
bash scripts/init-from-github.sh \
  --template custom-object \
  --target-dir <目标目录的绝对路径> \
  --object-name <对象名称>
```

**脚本功能**:
1. 读取 `templates.json` 获取模板配置
2. 验证模板可用性（检查 status 是否为 coming-soon）
3. 从 GitHub 克隆项目（浅克隆 `--depth 1`）
4. 清理 Git 历史并重新初始化
5. 移动文件到目标目录
6. 自动执行 `npm install`（失败不中断）

**脚本输出示例**:
```
📦 克隆模板: custom-object
   仓库: https://github.com/Blacklake-Tech/coder-custom-object.git
   目标: /Users/siting/projects/purchase-order

🔄 开始克隆...
✅ 克隆成功

🧹 清理 Git 历史...
✅ Git 仓库重新初始化

📁 移动文件到目标目录...
✅ 文件移动完成

📦 安装依赖...
✅ 依赖安装成功

✅ 项目克隆完成: /Users/siting/projects/purchase-order
```

**错误处理**:
- Git 未安装 → 终止执行，提示安装 Git
- 网络失败 → 终止执行，提示检查网络
- 目标目录已存在且不为空 → 终止执行，提示清空目录
- npm 未安装 → 警告但继续
- 依赖安装失败 → 警告但继续

### 阶段 5: 生成 Metadata.ts

**执行脚本**:
```bash
node scripts/generate-metadata.js \
  --metadata-json <临时元数据 JSON 文件路径> \
  --object-code <对象 code> \
  --output <目标目录>/src/Metadata.ts \
  --template custom-object
```

**脚本功能**:
1. 读取对象元数据 JSON
2. 应用 init-project-1 的转换规则
3. 生成完整的 Metadata.ts TypeScript 代码
4. 写入到指定路径

**转换规则**（详见 reference/metadata-transform.md）:
- `DEFAULT_OBJECT_CODE`: 从 fields[0].relatedObjectCode 获取
- `normalizeField`: 从模板复制，不修改
- `mockFields`: 保持 0/1 格式，使用 `.map(normalizeField)` 转换
- `mockSubObjects`: 简化格式，直接转换 0/1 为 boolean
- `choiceValues`: 只保留 `choiceCode` 和 `choiceValue`

**脚本输出示例**:
```
✅ Metadata.ts 已生成: /Users/siting/projects/purchase-order/src/Metadata.ts
   对象 code: cust_object344__c
   字段数量: 35
   从对象数量: 1
```

**清理临时文件**:
```bash
rm -f "$TEMP_METADATA"
```

### 阶段 6: 验证项目

**执行脚本**:
```bash
bash scripts/validate-project.sh <目标目录>
```

**验证项**:
1. 检查关键文件是否存在
   - package.json
   - tsconfig.json
   - src/Metadata.ts
2. 检查依赖安装状态（node_modules 是否存在）
3. TypeScript 编译检查（可选，失败不中断）

**脚本输出示例**:
```
🔍 验证项目: /Users/siting/projects/purchase-order
✅ 关键文件完整
✅ 依赖已安装
✅ TypeScript 类型验证通过

✅ 项目验证完成
```

### 阶段 7: 输出成功信息

整合各脚本的输出，生成友好的成功提示：

```
✅ 项目初始化成功！

📁 项目目录: /Users/siting/projects/purchase-order
📦 模板类型: custom-object (自定义对象)
🎯 对象代码: cust_object344__c
📊 字段数量: 35 个主字段
📎 从对象: 1 个

🚀 下一步操作:
1. cd /Users/siting/projects/purchase-order
2. npm run dev         # 启动开发服务器
3. npm run build       # 构建生产版本

📖 项目说明:
- Metadata.ts 已自动生成
- 所有依赖已安装完成
- 项目已可以直接运行

💡 提示:
- 查看可用模板: 参考 scripts/templates.json
- 项目从 GitHub 克隆，包含最新特性
```

## 决策点

### DP1: 如何处理网络失败？

**问题**: GitHub 克隆失败时如何处理？

**决策**:
- **不使用 Gitee 镜像**：保持简单，网络失败时直接提示用户
- **不提供离线模式**：建议用户使用 init-project-2（本地模板）

**理由**:
- 保持 skill 简单，专注核心功能
- Gitee 镜像需要额外维护
- init-project-2 已提供离线方案

**错误提示**:
```
❌ 克隆失败，请检查网络连接或仓库地址

建议:
  1. 检查网络连接
  2. 确认可以访问 GitHub
  3. 如果网络受限，使用 init-project-2（本地模板）
```

### DP2: 依赖安装失败如何处理？

**问题**: `npm install` 失败时是否中断流程？

**决策**:
- **不中断流程**：允许继续生成 Metadata.ts
- **给出警告**：提示用户稍后手动安装

**理由**:
- Metadata.ts 生成不依赖 node_modules
- 用户可能需要修改 package.json 后再安装
- 给用户更多控制权

**警告信息**:
```
⚠️  依赖安装失败，请稍后手动执行:
cd /Users/siting/projects/purchase-order
npm install
```

### DP3: 目标目录已存在如何处理？

**问题**: 目标目录已存在且不为空时如何处理？

**决策**:
- **立即终止**：不询问用户是否覆盖
- **明确提示**：告知用户先清空目录

**理由**:
- 避免误操作覆盖重要文件
- 保持脚本简单，减少交互
- 用户可以手动清空后重试

**错误提示**:
```
⚠️  目标目录已存在且不为空: /Users/siting/projects/purchase-order
   请先清空目录或选择其他目录
```

## 错误处理

### 错误 1: Git 未安装

```
❌ 错误: 未安装 Git，请先安装 Git

安装方法:
  macOS: brew install git
  Ubuntu: sudo apt install git
  Windows: https://git-scm.com/download/win
```

### 错误 2: 模板不可用

```
❌ 模板 work-order 即将推出，当前暂不可用

可用模板:
  - custom-object: 自定义对象管理系统

即将推出:
  - work-order: 工单管理系统
  - material: 物料管理系统
```

### 错误 3: 元数据格式异常

```
❌ 元数据格式异常

问题:
  - fields 数组为空
  或
  - 没有主属性字段 (isName=1)

建议:
  1. 检查对象配置是否完整
  2. 确认至少有一个主属性字段
  3. 联系管理员检查对象定义
```

## 脚本说明

### scripts/templates.json

模板配置文件，定义可用的项目模板。

**配置格式**:
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
    }
  },
  "default_template": "custom-object"
}
```

**添加新模板**:
1. 在 `templates` 中添加新配置
2. 指定 `github_url` 和 `metadata_path`
3. 如果元数据格式不同，扩展 `generate-metadata.js`

### scripts/init-from-github.sh

从 GitHub 克隆项目模板并初始化。

**参数**:
- `--template`: 模板类型（必需）
- `--target-dir`: 目标目录（必需）
- `--object-name`: 对象名称（必需，用于 Git 提交信息）

**输出**:
- 成功: 项目已克隆并初始化
- 失败: 返回错误码 1

### scripts/generate-metadata.js

生成 Metadata.ts 文件。

**参数**:
- `--metadata-json`: 元数据 JSON 文件路径（必需）
- `--object-code`: 对象 code（必需）
- `--output`: 输出文件路径（必需）
- `--template`: 模板类型（可选，默认 custom-object）

**输出**:
- 成功: Metadata.ts 已生成
- 失败: 返回错误码 1

### scripts/validate-project.sh

验证项目结构和完整性。

**参数**:
- 项目目录路径（位置参数）

**验证项**:
- 关键文件是否存在
- 依赖是否已安装
- TypeScript 编译是否通过

**输出**:
- 成功: 项目验证通过
- 失败: 返回错误码 1

## 相关文档

- [通用规范](./COMMON.md) - 参数格式、命名约定、错误处理
- [元数据转换规则](./reference/metadata-transform.md) - Metadata.ts 生成规则
- [脚本使用说明](./reference/scripts-usage.md) - 脚本参数和独立测试方法
- [模板注册表](./reference/template-registry.md) - 如何添加新模板

## 适用场景

### 适合使用 init-project-3 的场景

- ✅ 正常网络环境，可访问 GitHub
- ✅ 希望使用最新的模板特性
- ✅ 希望自动化程度更高（自动安装依赖）
- ✅ 需要支持多种模板类型

### 不适合使用 init-project-3 的场景

- ❌ 网络受限或无法访问 GitHub
  - 推荐: 使用 init-project-2（本地模板）
- ❌ 需要深度自定义模板
  - 推荐: 使用 init-project-1（参考模板重新生成）
- ❌ 需要离线工作
  - 推荐: 使用 init-project-2（本地模板）

## 未来扩展

### V2 功能（基于用户反馈）

1. **Gitee 镜像支持**:
   - 在 `templates.json` 中为每个模板添加 `gitee_mirror` 字段
   - `init-from-github.sh` 自动尝试 Gitee 备选

2. **交互式模板选择**:
   - 如果用户没有指定模板，显示可用模板列表
   - 支持模糊搜索和描述匹配

3. **自定义模板源**:
   - 允许用户通过环境变量指定自定义 `templates.json`
   - 支持企业内部的私有模板仓库

**当前版本（V1）保持简单**:
- 固定 GitHub 仓库
- 自动清理 Git 历史
- 依赖安装失败仅警告
- 专注核心功能稳定性
