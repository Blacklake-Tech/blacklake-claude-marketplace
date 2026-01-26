---
name: object-metadata
aliases: [object, metadata]
description: 查询对象元数据及从对象元数据（字段配置、枚举值），输出 JSON Schema 格式。用于对象结构分析、API 设计时使用。使用 exec_sql 工具执行查询。
---

# 对象元数据查询技能

## 功能说明

提供结构化的对象元数据查询能力，包括：
1. 根据对象 code、对象名称、对象 id 查询对象基本信息
2. 查询对象的所有字段元数据
3. 自动查询并包含所有从对象的元数据
4. 输出标准的 JSON Schema 格式，便于 AI 模型理解和使用

## 查询工作流程

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

### 7. 构建 JSON Schema 输出

将查询结果转换为标准的 JSON Schema 格式：
- 对象基本信息作为顶层属性
- 字段转换为 JSON Schema properties
- 每个字段包含 `biz.bizFieldType` 和 `biz.config` 配置
- 从对象作为 `subObjects` 数组

## 执行方式

所有查询使用 `exec_sql` 工具执行，参数替换为实际值。

**重要**：在执行 SQL 前，必须先打印出完整的目标 SQL 语句（用【】包起来），然后再使用 `exec_sql` 工具执行。

**重要**：执行 SQL 后，必须对查询结果进行结构化展示，输出标准的 JSON Schema 格式，不要使用表格格式。

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
WHERE (id = {search} OR object_code = {search} OR object_name LIKE '%{search}%')
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

查询指定对象的所有字段定义：

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

**注意**：
- 只对 `field_type = 4`（单选）和 `field_type = 5`（多选）字段查询枚举值
- 查询结果按 `sequence` 排序

### 4. 查询从对象列表

根据父对象的 object_code 查询所有从对象：

```sql
SELECT DISTINCT
    cf.related_object_id as subObjectId
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
- `subObjectId`：从对象的业务ID

### 5. 查询从对象元数据

对每个从对象，重复执行查询模板 1、2 和 3：
- 使用查询模板 1，将 `{search}` 替换为从对象的 `subObjectId`
- 使用查询模板 2，将 `{objectId}` 替换为从对象的 `subObjectId`
- 对于从对象中的单选/多选字段，使用查询模板 3 查询枚举值

## 字段类型映射

参考文档：[字段配置通用说明](./reference/field-config-reference.md)

### field_type 到业务类型映射

| field_type | 业务类型名称 | 基础类型 | JSON Schema type |
|-----------|------------|---------|------------------|
| 1 | SingleLineText | STRING | string |
| 2 | Number | NUMBER | number |
| 3 | MultipleLineText | STRING | string |
| 4 | SingleChoice | STRING | string |
| 5 | MultipleChoice | ARRAY | array |
| 6 | Boolean | BOOLEAN | boolean |
| 7 | Integer | NUMBER | number |
| 8 | DateTime | NUMBER | number |
| 9 | Website | STRING | string |
| 10 | Reference | STRING | string |
| 11 | RelatedToOne | ARRAY | array |
| 12 | SubObject | ARRAY | array |
| 13 | MainObject | NUMBER | number |
| 14 | Attachment | ARRAY | array |
| 15 | Calculation | STRING/NUMBER | string/number |
| 16 | Image | ARRAY | array |

**说明**：
- `field_type` 值来自 `custom_field.field_type` 字段
- 需要将 `field_type` 数值映射到对应的业务类型名称（如 SingleLineText）
- Calculation 类型的基础类型根据 `formula_type` 确定：1=数字型→NUMBER，2=文本型→STRING

## JSON Schema 输出格式

### 字段 Schema 结构

每个字段按以下格式输出：

```json
{
  "fieldCode": {
    "type": "string",
    "title": "字段名称",
    "description": "字段提示信息",
    "biz": {
      "bizFieldType": "SingleLineText",
      "config": {
        "isRequired": true,
        "maxLength": 255
      }
    }
  }
}
```

### 完整对象元数据输出结构

```json
{
  "objectCode": "User",
  "objectName": "用户",
  "objectDesc": "用户对象",
  "schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "title": "用户名",
        "description": "用户的登录名称",
        "biz": {
          "bizFieldType": "SingleLineText",
          "config": {
            "isRequired": true,
            "isUnique": true,
            "maxLength": 50
          }
        }
      },
      "age": {
        "type": "number",
        "title": "年龄",
        "biz": {
          "bizFieldType": "Integer",
          "config": {
            "isRequired": false,
            "maxValue": 150
          }
        }
      },
      "department": {
        "type": "array",
        "title": "部门",
        "biz": {
          "bizFieldType": "RelatedToOne",
          "config": {
            "reference": "Department",
            "targetType": 0
          }
        }
      },
      "status": {
        "type": "string",
        "title": "状态",
        "biz": {
          "bizFieldType": "SingleChoice",
          "config": {
            "isRequired": true,
            "choiceValues": [
              {
                "id": 1762998146733294,
                "choiceValue": "待执行",
                "choiceCode": "1762998146733294",
                "sequence": 0,
                "relatedFieldId": 1748293727716725,
                "isDefault": false
              },
              {
                "id": 1762998146733295,
                "choiceValue": "执行中",
                "choiceCode": "1762998146733295",
                "sequence": 1,
                "relatedFieldId": 1748293727716725,
                "isDefault": false
              },
              {
                "id": 1762998146733297,
                "choiceValue": "已完工",
                "choiceCode": "1762998146733297",
                "sequence": 2,
                "relatedFieldId": 1748293727716725,
                "isDefault": false
              }
            ]
          }
        }
      }
    },
    "required": ["name", "status"]
  },
  "subObjects": [
    {
      "objectCode": "UserRole",
      "objectName": "用户角色",
      "schema": {
        "type": "object",
        "properties": {
          "roleName": {
            "type": "string",
            "title": "角色名称",
            "biz": {
              "bizFieldType": "SingleLineText",
              "config": {
                "isRequired": true
              }
            }
          }
        }
      }
    }
  ]
}
```

### 字段配置项（biz.config）说明

根据字段类型和数据库字段值，构建 `biz.config` 对象：

| 配置项 | 来源字段 | 类型 | 说明 |
|-------|---------|------|------|
| `isRequired` | `is_required` | boolean | 字段是否必填 |
| `isUnique` | `is_unique` | boolean | 字段值是否唯一 |
| `maxLength` | `max_length` | int | 文本字段最大长度（field_type=1,3,9时） |
| `maxValue` | `max_value` | int/float | 数值/整数类型最大值（field_type=2,7时） |
| `decimalNumber` | `decimal_number` | int | 数值类型小数位数（field_type=2时） |
| `datetimeFormat` | `datetime_format` | string | 日期时间格式（field_type=8时） |
| `reference` | `reference` | string | 关联对象 code（field_type=11,13时） |
| `targetType` | `target_type` | int | 对象关系类型，0=对一，1=对多（field_type=11时） |
| `defaultValue` | `default_value` | string/int/null | 默认值 |
| `childNecessary` | `child_necessary` | boolean | 从对象是否必填（field_type=13时） |
| `referenceChain` | `reference_chain` | string | 引用链（#分割） |
| `referType` | `refer_type` | int | 引用字段类型，0=显示，1=存储 |
| `isNumberRuleConfig` | `is_number_rule_config` | boolean | 是否支持编码规则 |
| `hasSupportNumberRuleVariable` | `has_support_number_rule_variable` | boolean | 是否支持编码规则变量 |
| `choiceValues` | `choice_value` 表查询结果 | array | 枚举选项值数组（field_type=4或5时） |

**choiceValues 数组结构**：
每个选项对象包含以下字段：
- `id`：选项业务ID
- `choiceValue`：选项值（显示文本）
- `choiceCode`：选项编号
- `sequence`：顺序值
- `relatedFieldId`：关联字段ID
- `isDefault`：是否为默认值（boolean，0→false，1→true）

**注意**：
- 只包含有值的配置项，空值或默认值可以不包含
- `isRequired`、`isUnique`、`childNecessary`、`isNumberRuleConfig`、`hasSupportNumberRuleVariable` 需要转换为 boolean 类型（0→false，1→true）
- `required` 数组包含所有 `isRequired=true` 的字段的 `fieldCode`

## 输出示例

### 示例1：查询用户对象

**输入**：查询对象 code 为 "User" 的元数据

**输出**：
```json
{
  "objectCode": "User",
  "objectName": "用户",
  "objectDesc": "用户对象描述",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "title": "ID",
        "biz": {
          "bizFieldType": "Integer",
          "config": {}
        }
      },
      "name": {
        "type": "string",
        "title": "用户名",
        "description": "用户的登录名称",
        "biz": {
          "bizFieldType": "SingleLineText",
          "config": {
            "isRequired": true,
            "isUnique": true,
            "maxLength": 50
          }
        }
      },
      "email": {
        "type": "string",
        "title": "邮箱",
        "biz": {
          "bizFieldType": "SingleLineText",
          "config": {
            "isRequired": true,
            "maxLength": 255
          }
        }
      },
      "department": {
        "type": "array",
        "title": "部门",
        "biz": {
          "bizFieldType": "RelatedToOne",
          "config": {
            "reference": "Department",
            "targetType": 0
          }
        }
      }
    },
    "required": ["name", "email"]
  },
  "subObjects": []
}
```

### 示例2：查询包含从对象的订单对象

**输入**：查询对象 code 为 "Order" 的元数据

**输出**：
```json
{
  "objectCode": "Order",
  "objectName": "订单",
  "objectDesc": "订单对象",
  "schema": {
    "type": "object",
    "properties": {
      "orderNo": {
        "type": "string",
        "title": "订单号",
        "biz": {
          "bizFieldType": "SingleLineText",
          "config": {
            "isRequired": true,
            "isUnique": true
          }
        }
      },
      "totalAmount": {
        "type": "number",
        "title": "订单总额",
        "biz": {
          "bizFieldType": "Number",
          "config": {
            "isRequired": true,
            "decimalNumber": 2,
            "maxValue": 999999999
          }
        }
      }
    },
    "required": ["orderNo", "totalAmount"]
  },
  "subObjects": [
    {
      "objectCode": "OrderItem",
      "objectName": "订单明细",
      "schema": {
        "type": "object",
        "properties": {
          "productName": {
            "type": "string",
            "title": "产品名称",
            "biz": {
              "bizFieldType": "SingleLineText",
              "config": {
                "isRequired": true
              }
            }
          },
          "quantity": {
            "type": "number",
            "title": "数量",
            "biz": {
              "bizFieldType": "Integer",
              "config": {
                "isRequired": true,
                "maxValue": 10000
              }
            }
          }
        },
        "required": ["productName", "quantity"]
      }
    }
  ]
}
```

## 注意事项

1. **参数替换**：所有模板中的 `{参数名}` 都需要替换为实际值
2. **删除标记**：所有查询都包含 `deleted_at = 0` 条件
3. **执行方式**：必须通过 MCP 工具 `exec_sql` 执行
4. **输出格式**：必须输出标准的 JSON Schema 格式，不要使用表格
5. **字段类型映射**：必须将 `field_type` 数值映射到对应的业务类型名称
6. **从对象查询**：如果对象有从对象，必须递归查询所有从对象的元数据
7. **枚举值查询**：对于单选（field_type=4）和多选（field_type=5）字段，必须查询 `choice_value` 表获取枚举选项
8. **配置项构建**：`biz.config` 只包含有意义的配置项，空值可以不包含
9. **required 数组**：根据字段的 `isRequired` 值构建 `schema.required` 数组
10. **org_id 处理**：查询时需要考虑预置对象（org_id=-1）和自定义对象（org_id=具体值）
11. **choiceValues 排序**：枚举选项按 `sequence` 字段排序

## 参考文档

- [字段配置通用说明](./reference/field-config-reference.md) - 完整的 custom_field 字段说明和类型映射表
