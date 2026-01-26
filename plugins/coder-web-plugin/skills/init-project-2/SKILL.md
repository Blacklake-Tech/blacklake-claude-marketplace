---
name: init-project
aliases: [scaffold, create-app]
description: 根据模板初始化前端项目。支持自定义对象页面，后续扩展支持工单、物料、仓储等。用户提供租户信息和对象信息，自动生成完整的 CRUD 应用。
disable-model-invocation: true
argument-hint: [project-type] [tenant-info] [object-info]
---

# 项目初始化技能

根据模板快速生成前端项目，自动获取元数据并生成完整的 CRUD 应用。

## 功能说明

1. **支持的项目类型**：
   - `custom-object`：自定义对象页面（已支持）
   - `work-order`：工单页面（规划中）
   - `material`：物料页面（规划中）
   - `warehouse`：仓储页面（规划中）

2. **自动化流程**：
   - 根据用户输入的租户信息获取 orgId
   - 根据对象信息获取完整的对象元数据
   - 复制模板到目标目录
   - 自动替换 Metadata.ts 中的元数据

## 依赖技能

本技能依赖以下技能，请确保它们可用：

- **db-user**：查询租户和组织信息，获取 orgId
- **object-metadata**：查询对象元数据，获取字段配置和从对象信息

## 执行流程

### 步骤 1：解析用户输入

用户可以通过以下方式调用：

```bash
# 方式1：直接提供所有参数
/init-project custom-object 租户名称 对象code

# 方式2：交互式调用（推荐）
/init-project
# Claude 会引导用户逐步输入信息
```

**参数说明**：
- `project-type`：项目类型，目前支持 `custom-object`
- `tenant-info`：租户信息（可以是租户名称、code 或 id）
- `object-info`：对象信息（可以是对象 code、名称或 id）

### 步骤 2：获取租户信息（orgId）

如果用户提供的是租户名称或 code，使用 **db-user skill** 查询租户信息：

1. 调用 db-user skill，传入租户信息
2. 从返回结果中提取 `id` 字段作为 `orgId`
3. 如果查询失败，提示用户检查租户信息

**示例**：
```
用户输入：租户名称 "测试工厂"
调用：db-user skill 查询
返回：{ id: 10162960, code: "TEST001", organization_name: "测试工厂" }
提取：orgId = 10162960
```

### 步骤 3：获取对象元数据

使用 **object-metadata skill** 查询对象元数据：

1. 调用 object-metadata skill，传入 orgId 和对象信息
2. 获取完整的对象元数据，包括：
   - 对象基本信息（objectCode, objectName 等）
   - 字段列表（fields）
   - 从对象列表（sonObjects，如果有）

**示例**：
```
用户输入：对象 code "cust_object344__c"
调用：object-metadata skill，传入 orgId=10162960, objectCode="cust_object344__c"
返回：完整的对象元数据 JSON
```

### 步骤 4：选择模板并复制

根据项目类型选择对应的模板：

| 项目类型 | 模板路径 |
|---------|---------|
| `custom-object` | `demos/custom-object/` |

**复制操作**：
1. 确定目标目录（通常是当前工作目录或用户指定的目录）
2. 使用 `cp -r` 命令复制整个模板目录
3. 保持模板的目录结构不变

**示例命令**：
```bash
cp -r skills/init-project/demos/custom-object/* ./target-directory/
```

### 步骤 5：转换并替换 Metadata.ts

将 object-metadata 返回的元数据转换为 Metadata.ts 格式：

#### 5.1 转换规则

**输入格式**（object-metadata 输出）：
```json
{
  "object": {
    "id": 1761632155862281,
    "orgId": 10162960,
    "objectCode": "cust_object344__c",
    "objectName": "自定义对象",
    ...
  },
  "fields": [
    {
      "id": 1748293727716595,
      "fieldCode": "main_field",
      "fieldName": "编号1",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 1,
      "choiceValues": null,
      ...
    }
  ],
  "sonObjects": [
    {
      "object": {
        "objectCode": "SonObject__c",
        "objectName": "从对象"
      },
      "fields": [...]
    }
  ]
}
```

**输出格式**（Metadata.ts）：
```typescript
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';

export let mockFields: FieldDTO[] = [
  {
    id: 1748293727716595,
    orgId: 10162960,
    relatedObjectId: 1761632155862281,
    relatedObjectCode: 'cust_object344__c',
    fieldCode: 'main_field',
    fieldName: '编号1',
    fieldType: 1,
    isRequired: 1,  // 保持 0/1，normalizeField 会转换
    isUnique: 1,
    choiceValues: null,
    ...
  }
].map(normalizeField);

export let mockSubObjects: SubObjectDTO[] = [
  {
    objectCode: 'SonObject__c',
    objectName: '从对象',
    referName: '从对象',
    referCode: 'sub_object',
    childNecessary: false,
    fieldList: [...]
  }
];
```

#### 5.2 字段映射规则

1. **对象信息**：
   - `object.objectCode` → `DEFAULT_OBJECT_CODE`
   - `object.id` → 字段的 `relatedObjectId`
   - `object.objectCode` → 字段的 `relatedObjectCode`

2. **字段信息**：
   - 保持所有字段原样，但需要：
     - 添加 `relatedObjectId`（从 object.id）
     - 添加 `relatedObjectCode`（从 object.objectCode）
     - 保持 `isRequired`, `isUnique` 等为 0/1（normalizeField 会转换）
     - 单选/多选字段的 `choiceValues` 需要转换格式

3. **从对象信息**：
   - `sonObjects[].object.objectCode` → `objectCode`
   - `sonObjects[].object.objectName` → `objectName`
   - `sonObjects[].fields` → `fieldList`
   - 需要设置 `referName` 和 `referCode`（可以从对象信息中提取或使用默认值）

#### 5.3 choiceValues 转换

对于单选（fieldType=4）和多选（fieldType=5）字段，需要转换 choiceValues 格式：

**输入格式**（object-metadata）：
```json
{
  "choiceValues": [
    {
      "id": 1762998146733294,
      "choiceCode": "1762998146733294",
      "choiceValue": "待执行",
      "sequence": 0,
      "isUsed": 1,
      "isDefault": 0
    }
  ]
}
```

**输出格式**（Metadata.ts）：
```typescript
{
  choiceValues: [
    {
      choiceCode: "1762998146733294",
      choiceValue: "待执行"
    }
  ]
}
```

#### 5.4 替换 Metadata.ts

1. 读取目标目录的 `src/Metadata.ts` 文件
2. 替换以下内容：
   - `DEFAULT_OBJECT_CODE` 的值
   - `mockFields` 数组的内容
   - `mockSubObjects` 数组的内容（如果有从对象）
3. 保持文件的其他部分不变（如 `normalizeField` 函数）

### 步骤 6：验证生成的项目

生成完成后，验证以下内容：

1. **文件完整性**：
   - 检查所有模板文件是否已复制
   - 检查 `src/Metadata.ts` 是否已更新

2. **元数据正确性**：
   - 检查 `DEFAULT_OBJECT_CODE` 是否正确
   - 检查字段数量是否匹配
   - 检查从对象是否正确转换（如果有）

3. **项目可运行性**：
   - 检查 `package.json` 是否存在
   - 建议用户运行 `npm install` 安装依赖

## 输出示例

生成成功后，输出以下信息：

```markdown
✅ 项目初始化完成！

📦 项目信息：
- 项目类型：custom-object
- 对象编码：cust_object344__c
- 对象名称：自定义对象
- 字段数量：25
- 从对象数量：1

📁 项目目录：./my-custom-object-app

🚀 下一步操作：
1. 进入项目目录：cd my-custom-object-app
2. 安装依赖：npm install
3. 启动开发服务器：npm run dev
4. 构建生产版本：npm run build

💡 提示：
- Metadata.ts 已自动生成，包含完整的对象元数据
- 如需修改元数据，请编辑 src/Metadata.ts
- 项目已配置好所有必要的依赖和脚本
```

## 错误处理

### 错误 1：租户信息查询失败

```
❌ 无法获取租户信息

可能原因：
- 租户名称/code/id 不正确
- 数据库连接问题

建议操作：
1. 检查租户信息是否正确
2. 尝试使用租户 ID 直接查询
3. 检查 db-user skill 是否可用
```

### 错误 2：对象元数据查询失败

```
❌ 无法获取对象元数据

可能原因：
- 对象 code/名称/id 不正确
- orgId 与对象不匹配
- 对象不存在或已删除

建议操作：
1. 检查对象信息是否正确
2. 确认 orgId 是否正确
3. 检查 object-metadata skill 是否可用
```

### 错误 3：模板复制失败

```
❌ 模板复制失败

可能原因：
- 目标目录不存在或没有写权限
- 磁盘空间不足

建议操作：
1. 检查目标目录路径是否正确
2. 确认有足够的磁盘空间
3. 检查文件系统权限
```

### 错误 4：Metadata.ts 替换失败

```
❌ Metadata.ts 替换失败

可能原因：
- 文件格式不正确
- 元数据转换错误

建议操作：
1. 检查 object-metadata 返回的数据格式
2. 手动检查 Metadata.ts 文件
3. 参考 reference/metadata-format.md 文档
```

## 注意事项

1. **技能依赖**：
   - 确保 `db-user` 和 `object-metadata` skill 可用
   - 这些技能使用 MCP 工具 `exec_sql` 执行查询

2. **数据格式**：
   - object-metadata 返回的数值字段（如 isRequired）是 0/1
   - Metadata.ts 中的 normalizeField 函数会转换为 boolean
   - 转换时保持原格式，让 normalizeField 处理

3. **从对象处理**：
   - 如果对象有从对象，需要递归处理
   - 从对象的字段也需要完整转换

4. **文件路径**：
   - 模板路径：`skills/init-project/demos/{project-type}/`
   - 目标路径：用户指定或当前工作目录

5. **命名规范**：
   - 项目目录名建议使用对象名称的英文或拼音
   - 避免使用特殊字符和空格

## 参考文档

### 本 Skill 内部文档
- [元数据格式说明](./reference/metadata-format.md) - 详细的元数据格式转换规则

### 依赖的外部 Skill

本技能需要配合以下 skill 使用，请确保它们已安装：

1. **db-user skill**
   - 用途：查询租户和组织信息，获取 orgId
   - 调用方式：`/db-user` 或在对话中询问租户信息
   - 输入：租户名称、code 或 id
   - 输出：包含 `id`（orgId）的租户信息

2. **object-metadata skill**
   - 用途：查询对象元数据，获取字段配置和从对象信息
   - 调用方式：`/object-metadata` 或在对话中询问对象元数据
   - 输入：orgId + 对象 code/名称/id
   - 输出：完整的对象元数据 JSON（object, fields, sonObjects）
