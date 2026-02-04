# custom_field 字段配置通用说明

本文档提供 `v3_metadata.custom_field` 表核心字段的详细说明，供多个 skill 参考使用。

## 表结构字段说明

### 基础字段

| 字段名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `id` | bigint | 业务ID（非主键） | 1761632155862281 |
| `org_id` | bigint | 工厂ID（租户ID），-1表示预置字段 | -1 或 123456 |
| `related_object_id` | bigint | 关联对象ID（该字段所属的对象） | 1761632155862281 |
| `field_code` | varchar(64) | 字段编号（用于API和数据库列名） | "name", "age" |
| `field_name` | varchar(255) | 字段名称（用于展示） | "用户名", "年龄" |
| `field_category` | tinyint | 字段类别：1=自定义字段，2=预设字段 | 1 |
| `field_type` | int | 字段类型（1-16），见下方类型映射表 | 1 |
| `field_remind` | varchar(1000) | 字段提示（帮助文本） | "请输入用户名" |
| `field_permission` | int | 字段权限：0=不可见，4=只可见，6=可编辑 | 6 |
| `is_required` | tinyint | 字段值是否必填：0=否，1=是 | 1 |
| `is_unique` | tinyint | 字段值是否唯一：0=否，1=是 | 0 |
| `is_referred` | tinyint | 字段是否被引用：0=否，1=是 | 0 |
| `is_refer` | tinyint | 是否是引用字段：0=否，1=是 | 0 |
| `is_used` | tinyint | 字段是否启用：0=未启用，1=启用 | 1 |
| `is_name` | tinyint | 是否显示属性（用于关联对象展示） | 0 或 1 |

### 数值和文本配置

| 字段名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `is_number_rule_config` | tinyint | 字段是否支持编码规则：0=不支持，1=支持 | 0 |
| `default_value` | varchar(1000) | 默认值，不同类型字段存储方式不同（针对引用字段该值存储引用字段id） | "admin" 或 "0" |
| `max_length` | int | 字段最大长度，针对单行、多行、网址类型字段 | 255 |
| `max_value` | int | 字段最大值，针对整数和数值类型字段 | 1000000000 |
| `decimal_number` | int | 小数位数，针对数值类型字段 | 2 |
| `datetime_format` | varchar(255) | 日期格式，针对日期类型字段（注意：DD 不符合标准，应该是小写 dd，需要兼容） | "YYYY-MM-DD HH:mm:ss" |

### 关联和引用配置

| 字段名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `reference` | varchar(255) | 关联对象 code（field_type=11/13时使用） | "User", "Department" |
| `child_necessary` | tinyint | 从对象是否必填：0=否，1=是 | 0 |
| `reference_chain` | varchar(255) | 引用链（#分割） | "User#Department" |
| `target_type` | int | 对一/对多：0=对一，1=对多 | 0 |
| `refer_type` | tinyint | 引用字段类型：0=显示，1=存储 | 0 |

### 其他配置

| 字段名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `has_support_number_rule_variable` | tinyint(1) | 是否支持编码规则变量 | 1 |

## choice_value 表说明

`choice_value` 表用于存储单选和多选字段的枚举选项值。

### 表结构字段说明

| 字段名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `id` | bigint | 选项业务ID | 1762998146733294 |
| `org_id` | bigint | 工厂ID（租户ID），-1表示预置选项 | -1 或 123456 |
| `related_field_id` | bigint | 关联自定义字段业务ID | 1748293727716725 |
| `choice_value` | varchar(255) | 选项值（显示文本） | "待执行", "执行中" |
| `choice_code` | varchar(64) | 选项编号 | "1762998146733294" |
| `sequence` | int | 顺序值（标记选项值顺序） | 0, 1, 2 |
| `is_used` | tinyint | 是否启用：0=未启用，1=启用 | 1 |
| `is_default` | tinyint | 是否为默认值：0=否，1=是 | 0 |
| `deleted_at` | bigint | 删除时间戳，0=未删除 | 0 |

### 查询枚举值

对于 `field_type = 4`（单选）或 `field_type = 5`（多选）的字段，需要查询 `choice_value` 表获取枚举选项：

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
- `{fieldId}`：字段业务ID（`custom_field.id`）
- `{orgId}`：租户ID（工厂ID）

**注意**：
- 只查询 `is_used = 1` 的选项（如果需要在结果中包含未启用的选项，可以移除该条件）
- 查询结果按 `sequence` 排序，确保选项顺序正确

## 字段类型映射表

### field_type 到业务类型映射

以数据库 `field_type` 字段值为主键的映射表：

| field_type | 业务类型名称 | 基础类型 | JSON Schema type | 说明 |
|-----------|------------|---------|------------------|------|
| 1 | SingleLineText | STRING | string | 单行文本 |
| 2 | Number | NUMBER | number | 数值（支持小数） |
| 3 | MultipleLineText | STRING | string | 多行文本 |
| 4 | SingleChoice | STRING | string | 单选 |
| 5 | MultipleChoice | ARRAY | array | 多选 |
| 6 | Boolean | BOOLEAN | boolean | 布尔值 |
| 7 | Integer | NUMBER | number | 整数 |
| 8 | DateTime | NUMBER | number | 日期时间（时间戳） |
| 9 | Website | STRING | string | 链接/网址 |
| 10 | Reference | STRING | string | 引用字段（引用其他字段值） |
| 11 | RelatedToOne | ARRAY | array | 关联关系（对一/对多） |
| 12 | SubObject | ARRAY | array | 从对象字段 |
| 13 | MainObject | NUMBER | number | 主从关系（主对象ID） |
| 14 | Attachment | ARRAY | array | 附件 |
| 15 | Calculation | STRING/NUMBER | string/number | 计算类型（根据 formula_type 确定） |
| 16 | Image | ARRAY | array | 图片 |

**说明**：
- `field_type` 值来自 `custom_field.field_type` 字段
- 基础类型用于后端数据处理和验证
- JSON Schema type 用于生成标准的 JSON Schema 定义
- Calculation 类型的基础类型根据 `formula_type` 确定：1=数字型→NUMBER，2=文本型→STRING

## 字段配置项说明（用于 JSON Schema biz.config）

| 字段名 | 类型 | 作用/说明 | 示例 |
|-------|------|----------|------|
| `bizFieldType` | string | 业务字段类型（如 SingleLineText、Integer、RelatedToOne 等） | "RelatedToOne" |
| `reference` | string | 如果是关联字段，这里存关联对象 code | "User" |
| `targetType` | int | 对象关系类型，0=对一，1=对多 | 0 |
| `isRequired` | boolean | 字段是否必填，0=否，1=是 | true |
| `isUnique` | boolean | 字段值是否唯一，0=否，1=是 | false |
| `defaultValue` | string/int/null | 默认值，不同类型字段存储方式不同 | "admin" |
| `maxLength` | int | 文本/多行字段最大长度 | 255 |
| `maxValue` | int/float | 数值/整数类型最大值 | 1000000000 |
| `decimalNumber` | int | 数值类型小数位数 | 2 |
| `datetimeFormat` | string | 日期时间格式 | "YYYY-MM-DD HH:mm:ss" |
| `childNecessary` | boolean | 从对象是否必填，0=否，1=是 | false |
| `referenceChain` | string | 引用链（#分割） | "User#Department" |
| `referType` | int | 引用字段类型，0=显示，1=存储 | 0 |
| `isNumberRuleConfig` | boolean | 是否支持编码规则，0=否，1=是 | false |
| `hasSupportNumberRuleVariable` | boolean | 是否支持编码规则变量，0=否，1=是 | true |
| `choiceValues` | array | 枚举选项值数组（field_type=4或5时），每个选项包含 id、choiceValue、choiceCode、sequence、relatedFieldId、isDefault | [] |

## 使用说明

### 查询字段时的字段选择

查询字段元数据时，建议选择以下核心字段：

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
WHERE ...
```

### 转换为 JSON Schema 时的字段映射

将数据库字段转换为 JSON Schema 的 `biz.config` 时：

- `is_required` → `isRequired` (boolean，0→false，1→true)
- `is_unique` → `isUnique` (boolean，0→false，1→true)
- `max_length` → `maxLength` (int)
- `max_value` → `maxValue` (int/float)
- `decimal_number` → `decimalNumber` (int)
- `datetime_format` → `datetimeFormat` (string)
- `reference` → `reference` (string)
- `target_type` → `targetType` (int)
- `child_necessary` → `childNecessary` (boolean，0→false，1→true)
- `reference_chain` → `referenceChain` (string)
- `refer_type` → `referType` (int)
- `is_number_rule_config` → `isNumberRuleConfig` (boolean，0→false，1→true)
- `has_support_number_rule_variable` → `hasSupportNumberRuleVariable` (boolean，0→false，1→true)
- `default_value` → `defaultValue` (string/int/null)
- `field_type` → `bizFieldType` (string，需要映射到业务类型名称)
- `choice_value` 表查询结果 → `choiceValues` (array，仅 field_type=4 或 5 时)
  - `id` → `id` (bigint)
  - `choice_value` → `choiceValue` (string)
  - `choice_code` → `choiceCode` (string)
  - `sequence` → `sequence` (int)
  - `related_field_id` → `relatedFieldId` (bigint)
  - `is_default` → `isDefault` (boolean，0→false，1→true)
