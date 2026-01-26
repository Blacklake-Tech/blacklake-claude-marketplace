---
name: object-metadata
aliases: [object, metadata]
description: 根据对象 code/名称/id 查询对象元数据。使用 MCP 工具 exec_sql 执行（zones 默认 ["feature"]）。
---

# 对象元数据查询技能

## 通用规范

参考：[通用规范](./COMMON.md)

## 功能说明

提供结构化的对象元数据查询能力，返回与接口一致的平铺字段配置数组格式：
1. 根据对象 code、对象名称、对象 id 查询对象基本信息
2. 查询对象的所有字段元数据，返回完整的字段配置数组
3. 自动查询并包含所有从对象（sonObjects）的元数据
4. 输出格式与接口返回完全一致，减少前端改造成本

## 查询工作流程

### 0. 获取 orgId（如需要）

如果用户提供的是租户名称或 code，**推荐使用 db-user skill** 查询租户信息获取 orgId。

也可参考 [通用规范](./COMMON.md#获取-orgid) 查看详细 SQL。

### 1. 确定查询目标

根据用户提供的查询条件（对象 code、对象名称或对象 id）确定要查询的对象：
- 如果提供的是对象名称，需要先查询 `standard_business_object` 表匹配对象
- 如果提供的是对象 code 或 id，直接使用该值查询

### 2. 查询对象基本信息

使用查询模板 1 查询对象的基本信息（`standard_business_object` 表）

### 3. 查询对象字段元数据

使用查询模板 2 查询该对象的所有字段定义（`custom_field` 表）

### 4. 查询字段枚举值

对于查询到的字段，如果 `field_type = 4`（单选）或 `field_type = 5`（多选），使用查询模板 3 查询该字段的枚举选项值（`choice_value` 表）

### 5. 查询从对象列表

使用查询模板 4 根据父对象的 object_code 查询所有从对象 ID

### 6. 查询从对象元数据

对每个从对象：
- 使用查询模板 1 查询从对象基本信息
- 使用查询模板 2 查询从对象的字段元数据
- 对于从对象中的单选/多选字段，使用查询模板 3 查询枚举值

### 7. 构建输出结构

将查询结果转换为以下格式：

```json
{
  "object": {
    "id": 1761632155862281,
    "orgId": 10162960,
    "objectCode": "CustomObject__c",
    "objectName": "自定义对象",
    "objectDesc": "描述信息",
    "objectCategory": 1,
    "isSubObject": 0,
    "isUsed": 1,
    "createdAt": 1761651457000,
    "updatedAt": 1769053948000
  },
  "fields": [
    {
      "id": 1761632155862282,
      "orgId": 10162960,
      "relatedObjectId": 1761632155862281,
      "fieldCode": "main_field",
      "fieldName": "主属性",
      "fieldCategory": 1,
      "fieldType": 1,
      "fieldRemind": "",
      "fieldPermission": 6,
      "isRequired": 1,
      "isUnique": 1,
      "isReferred": 0,
      "isRefer": 0,
      "isUsed": 1,
      "isName": 1,
      "isNumberRuleConfig": 1,
      "defaultValue": "",
      "maxLength": 255,
      "maxValue": 0,
      "decimalNumber": 0,
      "datetimeFormat": "",
      "reference": "",
      "childNecessary": 0,
      "referenceChain": null,
      "targetType": 0,
      "referType": null,
      "hasSupportNumberRuleVariable": 1,
      "choiceValues": null
    }
  ],
  "sonObjects": [
    {
      "object": {
        "id": 1761632155862999,
        "objectCode": "SonObject__c",
        "objectName": "从对象"
      },
      "fields": [
        /* 从对象的字段数组 */
      ]
    }
  ]
}
```

## 执行方式

使用 **MCP 工具 `exec_sql`**：

```
exec_sql(zones=["feature"], sql="完整SQL")
```

**参数**：
- `zones`：环境数组，默认 `["feature"]`
- `sql`：只读查询

**流程**：
1. 打印 SQL：【SELECT * FROM ...】
2. 调用 exec_sql
3. JSON 输出

## 查询模板

### 1. 查询对象元数据（standard_business_object）

根据对象 id、对象 code 或对象名称查询对象基本信息：

```sql
SELECT 
    id,
    org_id as orgId,
    object_code as objectCode,
    object_name as objectName,
    object_desc as objectDesc,
    object_category as objectCategory,
    is_sub_object as isSubObject,
    is_used as isUsed,
    created_at as createdAt,
    updated_at as updatedAt
FROM v3_metadata.standard_business_object
WHERE (id = {search} OR object_code = '{search}' OR object_name LIKE '%{search}%')
  AND deleted_at = 0
  AND (org_id = -1 OR org_id = {orgId})
LIMIT 1;
```

**参数说明**：
- `{search}`：查询条件，可以是对象 id、object_code 或 object_name
- `{orgId}`：租户ID（工厂ID），-1 表示预置对象

**返回字段**：
- `id`：对象业务ID
- `orgId`：租户ID（-1=预置对象）
- `objectCode`：对象编码
- `objectName`：对象名称
- `objectDesc`：对象描述
- `objectCategory`：对象类别（1=自定义对象，2=预设对象）
- `isSubObject`：是否从对象（0=否，1=是）
- `isUsed`：是否启用（0=停用，1=启用）

### 2. 查询对象字段元数据（custom_field）

查询指定对象的所有字段定义，**只查询核心字段**：

```sql
SELECT 
    c.id,
    c.org_id as orgId,
    c.related_object_id as relatedObjectId,
    c.field_code as fieldCode,
    c.field_name as fieldName,
    c.field_category as fieldCategory,
    c.field_type as fieldType,
    c.field_remind as fieldRemind,
    c.field_permission as fieldPermission,
    c.is_required as isRequired,
    c.is_unique as isUnique,
    c.is_referred as isReferred,
    c.is_refer as isRefer,
    c.is_used as isUsed,
    c.is_name as isName,
    c.is_number_rule_config as isNumberRuleConfig,
    c.default_value as defaultValue,
    c.max_length as maxLength,
    c.max_value as maxValue,
    c.decimal_number as decimalNumber,
    c.datetime_format as datetimeFormat,
    c.reference,
    c.child_necessary as childNecessary,
    c.reference_chain as referenceChain,
    c.target_type as targetType,
    c.refer_type as referType,
    c.has_support_number_rule_variable as hasSupportNumberRuleVariable
FROM v3_metadata.custom_field c
WHERE (c.org_id = -1 OR c.org_id = {orgId})
  AND c.related_object_id = {objectId}
  AND c.deleted_at = 0
ORDER BY c.id ASC;
```

**参数说明**：
- `{orgId}`：租户ID（工厂ID）
- `{objectId}`：对象业务ID（来自查询1的结果）

**重要说明**：
- 查询结果直接作为 `fields` 数组返回，保持所有字段原样
- 数值字段（如 `isRequired`, `isUnique`）保持 0/1 值，**不转换为 boolean**
- `null` 值保留为 `null`
- 按 `id` 排序，保证字段顺序
- 只查询核心字段，省略了扩展字段（如 formula、extInfo、sortSeq 等）

**返回字段说明**：参考 [字段配置通用说明](./reference/field-config-reference.md)

### 3. 查询字段枚举值（choice_value）

对于单选（field_type=4）和多选（field_type=5）字段，需要查询其枚举选项值：

```sql
SELECT 
    cv.id,
    cv.org_id as orgId,
    cv.related_field_id as relatedFieldId,
    cv.choice_value as choiceValue,
    cv.choice_code as choiceCode,
    cv.sequence,
    cv.is_used as isUsed,
    cv.is_default as isDefault
FROM v3_metadata.choice_value cv
WHERE cv.related_field_id = {fieldId}
  AND (cv.org_id = -1 OR cv.org_id = {orgId})
  AND cv.deleted_at = 0
ORDER BY cv.sequence ASC, cv.id ASC;
```

**参数说明**：
- `{fieldId}`：字段业务ID（来自查询2的结果中的 `id` 字段）
- `{orgId}`：租户ID（工厂ID）

**返回字段**：
- `id`：选项业务ID
- `orgId`：租户ID
- `relatedFieldId`：关联字段ID
- `choiceValue`：选项值（显示文本）
- `choiceCode`：选项编号
- `sequence`：顺序值
- `isUsed`：是否启用（0=未启用，1=启用）
- `isDefault`：是否为默认值（0=否，1=是）

**重要**：
- 只对 `field_type = 4`（单选）和 `field_type = 5`（多选）字段查询枚举值
- 查询结果作为数组赋值给对应字段的 `choiceValues` 属性
- 如果字段不是单选/多选类型，`choiceValues` 设置为 `null`

### 4. 查询从对象列表

根据父对象的 object_code 查询所有从对象：

```sql
SELECT DISTINCT
    cf.related_object_id as sonObjectId
FROM v3_metadata.custom_field cf
INNER JOIN v3_metadata.standard_business_object sbo 
    ON cf.related_object_id = sbo.id
WHERE cf.field_type = 13
  AND cf.reference = '{parentObjectCode}'
  AND (cf.org_id = -1 OR cf.org_id = {orgId})
  AND (sbo.org_id = -1 OR sbo.org_id = {orgId})
  AND cf.deleted_at = 0
  AND sbo.deleted_at = 0;
```

**参数说明**：
- `{parentObjectCode}`：父对象的 object_code
- `{orgId}`：租户ID（工厂ID）

**注意**：`field_type = 13` 表示主从关系字段（MainObject）

**返回字段**：
- `sonObjectId`：从对象的业务ID

### 5. 查询从对象元数据

对每个从对象，重复执行查询模板 1、2 和 3：
- 使用查询模板 1，将 `{search}` 替换为从对象的 `sonObjectId`
- 使用查询模板 2，将 `{objectId}` 替换为从对象的 `sonObjectId`
- 对于从对象中的单选/多选字段，使用查询模板 3 查询枚举值

## 字段类型映射

参考文档：[字段配置通用说明](./reference/field-config-reference.md)

### field_type 到业务类型映射

| field_type | 业务类型名称 | 基础类型 | 说明 |
|-----------|------------|---------|------|
| 1 | SingleLineText | STRING | 单行文本 |
| 2 | Number | NUMBER | 数值（支持小数） |
| 3 | MultipleLineText | STRING | 多行文本 |
| 4 | SingleChoice | STRING | 单选 |
| 5 | MultipleChoice | ARRAY | 多选 |
| 6 | Boolean | BOOLEAN | 布尔值 |
| 7 | Integer | NUMBER | 整数 |
| 8 | DateTime | NUMBER | 日期时间（时间戳） |
| 9 | Website | STRING | 链接/网址 |
| 10 | Reference | STRING | 引用字段 |
| 11 | RelatedToOne | ARRAY | 关联关系 |
| 12 | SubObject | ARRAY | 从对象字段 |
| 13 | MainObject | NUMBER | 主从关系 |
| 14 | Attachment | ARRAY | 附件 |
| 15 | Calculation | STRING/NUMBER | 计算类型 |
| 16 | Image | ARRAY | 图片 |

**说明**：
- `field_type` 值来自 `custom_field.field_type` 字段
- 在输出中保持原始的 `field_type` 数值，不需要转换为业务类型名称
- Calculation 类型的基础类型根据 `formula_type` 确定：1=数字型→NUMBER，2=文本型→STRING

## 输出格式说明

### 完整对象元数据输出结构

```json
{
  "object": {
    "id": 1761632155862281,
    "orgId": 10162960,
    "objectCode": "CustomObject__c",
    "objectName": "自定义对象",
    "objectDesc": "描述信息",
    "objectCategory": 1,
    "isSubObject": 0,
    "isUsed": 1,
    "createdAt": 1761651457000,
    "updatedAt": 1769053948000
  },
  "fields": [
    {
      "id": 1761632155862282,
      "orgId": 10162960,
      "relatedObjectId": 1761632155862281,
      "fieldCode": "main_field",
      "fieldName": "主属性",
      "fieldCategory": 1,
      "fieldType": 1,
      "fieldRemind": "",
      "fieldPermission": 6,
      "isRequired": 1,
      "isUnique": 1,
      "isReferred": 0,
      "isRefer": 0,
      "isUsed": 1,
      "isName": 1,
      "isNumberRuleConfig": 1,
      "defaultValue": "",
      "maxLength": 255,
      "maxValue": 0,
      "decimalNumber": 0,
      "datetimeFormat": "",
      "reference": "",
      "childNecessary": 0,
      "referenceChain": null,
      "targetType": 0,
      "referType": null,
      "hasSupportNumberRuleVariable": 1,
      "choiceValues": null
    },
    {
      "id": 1761632155862392,
      "orgId": 10162960,
      "relatedObjectId": 1761632155862281,
      "fieldCode": "cust_field4__c",
      "fieldName": "日期",
      "fieldCategory": 1,
      "fieldType": 8,
      "fieldRemind": "",
      "fieldPermission": 6,
      "isRequired": 0,
      "isUnique": 0,
      "isReferred": 0,
      "isRefer": 0,
      "isUsed": 1,
      "isName": 0,
      "isNumberRuleConfig": 0,
      "defaultValue": "",
      "maxLength": 0,
      "maxValue": 0,
      "decimalNumber": 0,
      "datetimeFormat": "YYYY/MM/DD HH:mm:ss",
      "reference": "",
      "childNecessary": 0,
      "referenceChain": null,
      "targetType": 0,
      "referType": 0,
      "hasSupportNumberRuleVariable": 0,
      "choiceValues": null
    }
  ],
  "sonObjects": [
    {
      "object": {
        "id": 1761632155862999,
        "orgId": 10162960,
        "objectCode": "SonObject__c",
        "objectName": "从对象",
        "objectDesc": "从对象描述",
        "objectCategory": 1,
        "isSubObject": 1,
        "isUsed": 1,
        "createdAt": 1761651457000,
        "updatedAt": 1769053948000
      },
      "fields": [
        {
          "id": 1761632155863001,
          "orgId": 10162960,
          "relatedObjectId": 1761632155862999,
          "fieldCode": "son_field",
          "fieldName": "从对象字段",
          "fieldType": 1
          /* ... 其他核心字段 */
        }
      ]
    }
  ]
}
```

### 字段数据类型处理规则

**重要**：为了与接口返回格式完全一致，请遵循以下规则：

1. **数值类型字段保持原样**：
   - `isRequired`, `isUnique`, `isUsed` 等字段保持 0/1 值
   - **不转换为 boolean 类型**

2. **null 值处理**：
   - 数据库中的 `null` 值保留为 `null`
   - 空字符串保留为 `""`

3. **字段命名规范**：
   - 数据库字段名使用下划线（snake_case）
   - 输出使用驼峰命名（camelCase）
   - 例如：`org_id` → `orgId`

4. **时间戳**：
   - `createdAt`, `updatedAt` 保持数值格式（毫秒时间戳）

5. **枚举值处理**：
   - 单选/多选字段的 `choiceValues` 为数组
   - 其他类型字段的 `choiceValues` 为 `null`

### 枚举值字段示例

对于单选/多选字段，`choiceValues` 嵌套在字段配置中：

```json
{
  "id": 1748293727716725,
  "fieldCode": "status",
  "fieldName": "状态",
  "fieldType": 4,
  "choiceValues": [
    {
      "id": 1762998146733294,
      "orgId": 10162960,
      "relatedFieldId": 1748293727716725,
      "choiceValue": "待执行",
      "choiceCode": "1762998146733294",
      "sequence": 0,
      "isUsed": 1,
      "isDefault": 0
    },
    {
      "id": 1762998146733295,
      "orgId": 10162960,
      "relatedFieldId": 1748293727716725,
      "choiceValue": "执行中",
      "choiceCode": "1762998146733295",
      "sequence": 1,
      "isUsed": 1,
      "isDefault": 0
    }
  ]
}
```

## 输出示例

### 示例1：查询用户对象

**输入**：查询对象 code 为 "User" 的元数据

**输出**：
```json
{
  "object": {
    "id": 1234567890123456,
    "orgId": 10162960,
    "objectCode": "User",
    "objectName": "用户",
    "objectDesc": "用户对象描述",
    "objectCategory": 2,
    "isSubObject": 0,
    "isUsed": 1,
    "createdAt": 1761651457000,
    "updatedAt": 1769053948000
  },
  "fields": [
    {
      "id": 1234567890123457,
      "orgId": 10162960,
      "relatedObjectId": 1234567890123456,
      "fieldCode": "name",
      "fieldName": "用户名",
      "fieldCategory": 2,
      "fieldType": 1,
      "fieldRemind": "请输入用户名",
      "fieldPermission": 6,
      "isRequired": 1,
      "isUnique": 1,
      "isReferred": 0,
      "isRefer": 0,
      "isUsed": 1,
      "isName": 1,
      "isNumberRuleConfig": 0,
      "defaultValue": "",
      "maxLength": 50,
      "maxValue": 0,
      "decimalNumber": 0,
      "datetimeFormat": "",
      "reference": "",
      "childNecessary": 0,
      "referenceChain": null,
      "targetType": 0,
      "referType": null,
      "hasSupportNumberRuleVariable": 0,
      "choiceValues": null
    }
  ],
  "sonObjects": []
}
```

### 示例2：查询包含从对象的订单对象

**输入**：查询对象 code 为 "Order" 的元数据

**输出**：
```json
{
  "object": {
    "id": 1234567890123460,
    "orgId": 10162960,
    "objectCode": "Order",
    "objectName": "订单",
    "objectDesc": "订单对象",
    "objectCategory": 1,
    "isSubObject": 0,
    "isUsed": 1,
    "createdAt": 1761651457000,
    "updatedAt": 1769053948000
  },
  "fields": [
    {
      "id": 1234567890123461,
      "orgId": 10162960,
      "relatedObjectId": 1234567890123460,
      "fieldCode": "order_no",
      "fieldName": "订单号",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 1
      /* ... 其他核心字段 */
    }
  ],
  "sonObjects": [
    {
      "object": {
        "id": 1234567890123470,
        "orgId": 10162960,
        "objectCode": "OrderItem",
        "objectName": "订单明细",
        "objectDesc": "订单明细对象",
        "objectCategory": 1,
        "isSubObject": 1,
        "isUsed": 1,
        "createdAt": 1761651457000,
        "updatedAt": 1769053948000
      },
      "fields": [
        {
          "id": 1234567890123471,
          "orgId": 10162960,
          "relatedObjectId": 1234567890123470,
          "fieldCode": "product_name",
          "fieldName": "产品名称",
          "fieldType": 1
          /* ... 其他核心字段 */
        }
      ]
    }
  ]
}
```

## 注意事项

**工具调用**：
1. exec_sql 是 MCP 工具，zones 默认 `["feature"]`
2. 如用户给的是租户名称/code，可用 db-user skill 获取 orgId
3. 执行前打印 SQL（用【】）

**SQL**：
4. `{参数}` 必须替换实际值
5. 必含 `deleted_at = 0`
6. org_id：`(org_id = -1 OR org_id = {orgId})`

**输出**：
7. JSON 格式，snake_case → camelCase
8. 0/1 不转 boolean

**业务**：
9. 从对象递归查询（模板 4-5）
10. 单选/多选（type=4/5）查枚举值（模板 3）
11. 字段按 id 排序

## 参考文档

- [字段配置通用说明](./reference/field-config-reference.md) - 完整的 custom_field 字段说明和类型映射表
