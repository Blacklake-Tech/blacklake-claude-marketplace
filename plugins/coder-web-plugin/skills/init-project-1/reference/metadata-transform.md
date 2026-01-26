# 元数据转换规则

本文档定义如何将 object-metadata skill 返回的 JSON 元数据转换为 Metadata.ts 的 TypeScript 代码。

## 转换概览

**输入**: object-metadata skill 返回的 JSON 对象
**输出**: Metadata.ts TypeScript 代码文件

**核心原则**:
1. mockFields 保持原始数据格式,不做转换
2. normalizeField 函数是唯一的转换点
3. mockSubObjects 简化字段,直接使用 boolean
4. 保持与 API 返回格式一致

## 输入格式

### object-metadata 返回的 JSON 结构

```json
{
  "fields": [
    {
      "id": 1748293727716595,
      "orgId": 10162960,
      "relatedObjectCode": "cust_object344__c",
      "fieldCode": "main_field",
      "fieldName": "编号1",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 1,
      "isUsed": 1,
      "isName": 1,
      "isRefer": 0,
      "referType": null,
      "referenceChain": null,
      "choiceValues": null,
      ...其他字段
    }
  ],
  "sonObjects": [
    {
      "objectCode": "cust_object123__c__c",
      "objectName": "从对象",
      "referName": "自定义对象从对象",
      "referCode": "sub_object",
      "childNecessary": 0,
      "fieldList": [...]
    }
  ]
}
```

## 输出格式

### Metadata.ts 文件结构

```typescript
/**
 * 自定义对象 Mock 数据
 * mockFields 和 mockSubObjects 的静态数据定义
 */
import type { FieldDTO, SubObjectDTO } from './types/customObject';

// 默认对象配置
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';

/**
 * 转换字段数据,将数字类型的布尔值转换为 boolean,将 null 转换为 undefined
 */
const normalizeField = (field: any): FieldDTO => {
  return {
    ...field,
    isRequired: field.isRequired === 1 ? true : field.isRequired === 0 ? false : field.isRequired,
    isUnique: field.isUnique === 1 ? true : field.isUnique === 0 ? false : field.isUnique,
    isUsed: field.isUsed === 1 ? true : field.isUsed === 0 ? false : field.isUsed,
    isName: field.isName === 1 ? true : field.isName === 0 ? false : field.isName,
    isRefer: field.isRefer === 1 ? true : field.isRefer === 0 ? false : field.isRefer,
    targetType: field.targetType === null ? undefined : field.targetType,
    reference: field.reference === null ? undefined : field.reference,
    referCode: field.referCode === null ? undefined : field.referCode,
    referName: field.referName === null ? undefined : field.referName,
    referType: field.referType === null ? undefined : field.referType,
    referenceChain: field.referenceChain === null ? undefined : field.referenceChain,
  };
};

// 字段定义
export let mockFields: FieldDTO[] = [
  {
    // 原始 JSON 数据,保持 0/1 数值格式
    "id": 1748293727716595,
    "isRequired": 1,
    "isUnique": 1,
    ...
  }
].map(normalizeField);

// 从对象定义
export let mockSubObjects: SubObjectDTO[] = [
  {
    objectCode: 'cust_object123__c__c',
    objectName: '从对象',
    referName: '自定义对象从对象',
    referCode: 'sub_object',
    childNecessary: false,  // 直接使用 boolean
    fieldList: [
      {
        id: 101,
        fieldCode: 'sub_code',
        fieldName: '从对象编号',
        fieldType: 1,
        isRequired: true,   // 直接使用 boolean
        isName: true,
        isRefer: false,
        ...
      }
    ],
  }
];
```

## 转换规则

### 规则 1: DEFAULT_OBJECT_CODE

**作用**: 设置当前对象的 code,用于 API 调用的默认参数

**转换逻辑**:
```typescript
// 从元数据中获取第一个字段的 relatedObjectCode
export const DEFAULT_OBJECT_CODE = '<从元数据 fields[0].relatedObjectCode 获取>';
```

**示例**:
```typescript
// 输入: fields[0].relatedObjectCode = "cust_object344__c"
// 输出:
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';
```

### 规则 2: normalizeField 函数

**作用**: 运行时将数值型布尔字段转换为 boolean,将 null 转换为 undefined

**函数定义**: (从模板直接复制,不修改)

```typescript
const normalizeField = (field: any): FieldDTO => {
  return {
    ...field,
    isRequired: field.isRequired === 1 ? true : field.isRequired === 0 ? false : field.isRequired,
    isUnique: field.isUnique === 1 ? true : field.isUnique === 0 ? false : field.isUnique,
    isUsed: field.isUsed === 1 ? true : field.isUsed === 0 ? false : field.isUsed,
    isName: field.isName === 1 ? true : field.isName === 0 ? false : field.isName,
    isRefer: field.isRefer === 1 ? true : field.isRefer === 0 ? false : field.isRefer,
    targetType: field.targetType === null ? undefined : field.targetType,
    reference: field.reference === null ? undefined : field.reference,
    referCode: field.referCode === null ? undefined : field.referCode,
    referName: field.referName === null ? undefined : field.referName,
    referType: field.referType === null ? undefined : field.referType,
    referenceChain: field.referenceChain === null ? undefined : field.referenceChain,
  };
};
```

**处理的字段**:
- `isRequired`: 0/1 → boolean
- `isUnique`: 0/1 → boolean
- `isUsed`: 0/1 → boolean
- `isName`: 0/1 → boolean
- `isRefer`: 0/1 → boolean
- `targetType`: null → undefined
- `reference`: null → undefined (但保留空字符串 "")
- `referCode`: null → undefined
- `referName`: null → undefined
- `referType`: null → undefined
- `referenceChain`: null → undefined

### 规则 3: mockFields 生成

**转换逻辑**:
1. 从元数据 JSON 中提取 `fields` 数组
2. 保持每个字段的所有原始字段(包括 0/1 数值)
3. 生成 TypeScript 数组字面量
4. 末尾添加 `.map(normalizeField)`

**示例**:

输入 JSON:
```json
{
  "fields": [
    {
      "id": 1748293727716595,
      "fieldCode": "main_field",
      "fieldName": "编号1",
      "isRequired": 1,
      "isUnique": 1,
      "isName": 1,
      "referType": null
    }
  ]
}
```

输出 TypeScript:
```typescript
export let mockFields: FieldDTO[] = [
  {
    "id": 1748293727716595,
    "fieldCode": "main_field",
    "fieldName": "编号1",
    "isRequired": 1,        // 保持数值
    "isUnique": 1,          // 保持数值
    "isName": 1,            // 保持数值
    "referType": null       // 保持 null
  }
].map(normalizeField);      // 运行时转换
```

**注意事项**:
- 保留所有字段,即使某些字段在 UI 中不使用
- 数值型布尔字段保持 0/1
- null 值保持 null (不转换为 undefined)
- 字符串值保持原样,包括空字符串 ""

### 规则 4: choiceValues 处理

**作用**: 简化单选/多选字段的选项列表

**转换逻辑**: 只保留 `choiceCode` 和 `choiceValue`,去掉其他辅助字段

**示例**:

输入 JSON:
```json
{
  "choiceValues": [
    {
      "id": 1001,
      "choiceCode": "1748293727716726",
      "choiceValue": "A",
      "sequence": 1,
      "isActive": 1
    }
  ]
}
```

输出 TypeScript:
```typescript
"choiceValues": [
  {
    "choiceCode": "1748293727716726",
    "choiceValue": "A"
  }
]
```

**保留字段**:
- `choiceCode`: 选项编码
- `choiceValue`: 选项显示值

**去掉字段**:
- `id`: 数据库主键
- `sequence`: 排序序号
- `isActive`: 是否启用
- 其他辅助字段

### 规则 5: mockSubObjects 生成

**转换逻辑**:
1. 从元数据 JSON 中提取 `sonObjects` 数组
2. 简化从对象字段,只保留核心字段
3. 直接使用 boolean 值(不使用 0/1)
4. 不应用 normalizeField

**从对象保留的字段**:
- `objectCode`: 从对象 code
- `objectName`: 从对象名称
- `referName`: 引用名称
- `referCode`: 引用 code
- `childNecessary`: 是否必填 (boolean)
- `fieldList`: 字段列表

**从对象字段保留的字段**:
- `id`: 字段 ID
- `fieldCode`: 字段 code
- `fieldName`: 字段名称
- `fieldType`: 字段类型
- `isRequired`: 是否必填 (boolean)
- `isName`: 是否主属性 (boolean)
- `isRefer`: 是否引用字段 (boolean)
- `fieldRemind`: 字段提示 (可选)
- `choiceValues`: 选项值 (单选/多选字段)
- `datetimeFormat`: 日期格式 (日期字段)

**示例**:

输入 JSON:
```json
{
  "sonObjects": [
    {
      "objectCode": "cust_object123__c__c",
      "objectName": "从对象",
      "referName": "自定义对象从对象",
      "referCode": "sub_object",
      "childNecessary": 0,
      "fieldList": [
        {
          "id": 101,
          "fieldCode": "sub_code",
          "fieldName": "从对象编号",
          "fieldType": 1,
          "isRequired": 1,
          "isUnique": 1,
          "isName": 1,
          "isRefer": 0,
          "fieldPermission": 6,
          "maxLength": 255,
          ...其他辅助字段
        }
      ]
    }
  ]
}
```

输出 TypeScript:
```typescript
export let mockSubObjects: SubObjectDTO[] = [
  {
    objectCode: 'cust_object123__c__c',
    objectName: '从对象',
    referName: '自定义对象从对象',
    referCode: 'sub_object',
    childNecessary: false,  // 0 → false
    fieldList: [
      {
        id: 101,
        fieldCode: 'sub_code',
        fieldName: '从对象编号',
        fieldType: 1,
        isRequired: true,     // 1 → true
        isName: true,         // 1 → true
        isRefer: false,       // 0 → false
      }
    ],
  }
];
```

**0/1 → boolean 转换时机**:
- **mockFields**: 保持 0/1,由 normalizeField 运行时转换
- **mockSubObjects**: 直接转换为 boolean

**原因**:
- mockFields 与 API 格式一致,便于调试和数据比对
- mockSubObjects 用于 UI 展示,boolean 更直观
- 从对象通常较小,不需要运行时转换的灵活性

## 特殊情况处理

### 情况 1: 没有从对象

如果元数据中没有 `sonObjects` 或 `sonObjects` 为空:

```typescript
// 生成空数组
export let mockSubObjects: SubObjectDTO[] = [];
```

### 情况 2: 空字符串 vs null

**规则**:
- 空字符串 `""` 保持原样
- `null` 值在 mockFields 中保持 null
- `null` 值在 mockSubObjects 中转换为 undefined

**示例**:

```typescript
// mockFields
{
  "reference": "",        // 保持空字符串
  "referType": null,      // 保持 null,由 normalizeField 转换
}

// mockSubObjects
{
  fieldRemind: '',        // 空字符串保持原样
  choiceValues: undefined,  // null → undefined
}
```

### 情况 3: 引用字段

引用字段(fieldType=11)特殊处理:

**保留字段**:
- `reference`: 引用对象类型 (如 "Material", "User")
- `targetType`: 引用类型 (0=对一, 1=对多)
- `isRefer`: 是否引用字段 (通常为 0)
- `referType`: 引用类型标识
- `referenceChain`: 引用链
- `referCode`: 引用字段 code
- `referName`: 引用字段名称
- `referenceTargetFieldId`: 目标字段 ID

**示例**:

```typescript
{
  "fieldType": 11,
  "reference": "Material",
  "targetType": 0,          // 0=对一
  "isDisplayOnRelated": 1,  // 是否在关联列表显示
}
```

### 情况 4: 单选/多选字段

单选(fieldType=4)和多选(fieldType=5)字段的 choiceValues 处理:

**输入**:
```json
{
  "choiceValues": [
    {
      "id": 1001,
      "choiceCode": "1748293727716726",
      "choiceValue": "A",
      "sequence": 1,
      "isActive": 1,
      "fieldId": 1748293727716725
    }
  ]
}
```

**输出 (mockFields)**:
```typescript
"choiceValues": [
  {
    "choiceCode": "1748293727716726",
    "choiceValue": "A"
  }
]
```

**输出 (mockSubObjects)**:
```typescript
choiceValues: [
  { choiceCode: '1748293727716726', choiceValue: 'A' }
]
```

## 代码生成模板

### 完整的 Metadata.ts 模板

```typescript
/**
 * <对象名称> Mock 数据
 * mockFields 和 mockSubObjects 的静态数据定义
 */
import type { FieldDTO, SubObjectDTO } from './types/customObject';

// 默认对象配置
export const DEFAULT_OBJECT_CODE = '<从 fields[0].relatedObjectCode 获取>';

/**
 * 转换字段数据,将数字类型的布尔值转换为 boolean,将 null 转换为 undefined
 */
const normalizeField = (field: any): FieldDTO => {
  return {
    ...field,
    isRequired: field.isRequired === 1 ? true : field.isRequired === 0 ? false : field.isRequired,
    isUnique: field.isUnique === 1 ? true : field.isUnique === 0 ? false : field.isUnique,
    isUsed: field.isUsed === 1 ? true : field.isUsed === 0 ? false : field.isUsed,
    isName: field.isName === 1 ? true : field.isName === 0 ? false : field.isName,
    isRefer: field.isRefer === 1 ? true : field.isRefer === 0 ? false : field.isRefer,
    targetType: field.targetType === null ? undefined : field.targetType,
    reference: field.reference === null ? undefined : field.reference,
    referCode: field.referCode === null ? undefined : field.referCode,
    referName: field.referName === null ? undefined : field.referName,
    referType: field.referType === null ? undefined : field.referType,
    referenceChain: field.referenceChain === null ? undefined : field.referenceChain,
  };
};

// 字段定义(<对象名称>的mock数据)
export let mockFields: FieldDTO[] = [
  <从元数据 fields 数组生成,保持原始格式>
].map(normalizeField);

// 从对象定义
export let mockSubObjects: SubObjectDTO[] = [
  <从元数据 sonObjects 数组生成,简化字段,使用 boolean>
];
```

## 验证清单

生成 Metadata.ts 后,验证以下内容:

- [ ] DEFAULT_OBJECT_CODE 设置正确
- [ ] normalizeField 函数完整复制
- [ ] mockFields 保持原始 0/1 格式
- [ ] mockFields 末尾有 `.map(normalizeField)`
- [ ] choiceValues 只包含 choiceCode 和 choiceValue
- [ ] mockSubObjects 使用 boolean (true/false)
- [ ] mockSubObjects 字段简化,只保留核心字段
- [ ] TypeScript 语法正确,无编译错误

## 常见错误

### 错误 1: mockFields 中使用 boolean

**错误示例**:
```typescript
export let mockFields: FieldDTO[] = [
  {
    "isRequired": true,  // ❌ 错误
  }
].map(normalizeField);
```

**正确示例**:
```typescript
export let mockFields: FieldDTO[] = [
  {
    "isRequired": 1,     // ✅ 正确
  }
].map(normalizeField);
```

### 错误 2: mockSubObjects 中使用 0/1

**错误示例**:
```typescript
export let mockSubObjects: SubObjectDTO[] = [
  {
    childNecessary: 0,   // ❌ 错误
    fieldList: [
      {
        isRequired: 1,   // ❌ 错误
      }
    ]
  }
];
```

**正确示例**:
```typescript
export let mockSubObjects: SubObjectDTO[] = [
  {
    childNecessary: false,  // ✅ 正确
    fieldList: [
      {
        isRequired: true,   // ✅ 正确
      }
    ]
  }
];
```

### 错误 3: choiceValues 包含多余字段

**错误示例**:
```typescript
"choiceValues": [
  {
    "id": 1001,              // ❌ 多余
    "choiceCode": "xxx",
    "choiceValue": "A",
    "sequence": 1,           // ❌ 多余
    "isActive": 1            // ❌ 多余
  }
]
```

**正确示例**:
```typescript
"choiceValues": [
  {
    "choiceCode": "xxx",
    "choiceValue": "A"
  }
]
```

### 错误 4: 缺少 normalizeField 函数

**错误示例**:
```typescript
// ❌ 缺少 normalizeField 定义
export let mockFields: FieldDTO[] = [
  {...}
].map(normalizeField);  // 运行时错误
```

**正确示例**:
```typescript
// ✅ 先定义函数
const normalizeField = (field: any): FieldDTO => {
  return {...};
};

// 然后使用
export let mockFields: FieldDTO[] = [
  {...}
].map(normalizeField);
```

## 总结

**核心原则**:
1. mockFields 保持与 API 一致的原始格式
2. normalizeField 是唯一的运行时转换点
3. mockSubObjects 简化并直接使用 boolean
4. 参考而非猜测,严格按照规则转换

**为什么这样设计**:
- API 一致性: mockFields 与后端返回格式完全一致
- 调试便利: 可以直接对比 API 响应和 Mock 数据
- 转换统一: normalizeField 集中处理转换逻辑
- 易于维护: 规则清晰,不易出错
