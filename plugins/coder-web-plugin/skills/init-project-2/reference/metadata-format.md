# 元数据格式转换参考文档

本文档详细说明如何将 `object-metadata` skill 返回的元数据格式转换为 `Metadata.ts` 文件格式。

## 数据源格式（object-metadata 输出）

### 对象基本信息

```json
{
  "object": {
    "id": 1761632155862281,
    "orgId": 10162960,
    "objectCode": "cust_object344__c",
    "objectName": "自定义对象",
    "objectDesc": "描述信息",
    "objectCategory": 1,
    "isSubObject": 0,
    "isUsed": 1,
    "createdAt": 1761651457000,
    "updatedAt": 1769053948000
  }
}
```

### 字段定义格式

```json
{
  "fields": [
    {
      "id": 1748293727716595,
      "orgId": 10162960,
      "relatedObjectId": 1748293727716594,
      "fieldCode": "main_field",
      "fieldName": "编号1",
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
  ]
}
```

### 从对象格式

```json
{
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
          "fieldType": 1,
          "isRequired": 0,
          "isUnique": 0,
          "choiceValues": null
        }
      ]
    }
  ]
}
```

### 单选/多选字段的 choiceValues 格式

```json
{
  "id": 1748293727716725,
  "fieldCode": "cust_field8__c",
  "fieldName": "单选1-实体类型",
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

## 目标格式（Metadata.ts）

### 文件结构

```typescript
/**
 * 自定义对象 Mock 数据
 * mockFields 和 mockSubObjects 的静态数据定义
 */
import type { FieldDTO, SubObjectDTO } from './types/customObject';

// 默认对象配置
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';

/**
 * 转换字段数据，将数字类型的布尔值转换为 boolean，将 null 转换为 undefined
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
  // ... 字段数组
].map(normalizeField);

// 从对象定义
export let mockSubObjects: SubObjectDTO[] = [
  // ... 从对象数组
];
```

## 转换规则详解

### 1. DEFAULT_OBJECT_CODE

**规则**：直接使用 `object.objectCode`

```typescript
export const DEFAULT_OBJECT_CODE = object.objectCode;
```

### 2. mockFields 转换

#### 2.1 基本字段映射

所有字段都需要保留，但需要注意：

- **保持原值**：大部分字段直接复制，包括：
  - `id`, `orgId`, `relatedObjectId`
  - `fieldCode`, `fieldName`, `fieldType`
  - `fieldCategory`, `fieldRemind`, `fieldPermission`
  - `maxLength`, `maxValue`, `decimalNumber`
  - `datetimeFormat`, `reference`
  - 等等

- **添加字段**：
  - `relatedObjectCode`：从 `object.objectCode` 获取
  - 如果字段中没有 `relatedObjectId`，从 `object.id` 获取

- **数值字段保持 0/1**：
  - `isRequired`, `isUnique`, `isUsed`, `isName`, `isRefer` 等保持为 0/1
  - `normalizeField` 函数会自动转换为 boolean

- **null 值处理**：
  - `targetType`, `reference`, `referType`, `referenceChain` 等如果是 null，保持为 null
  - `normalizeField` 函数会将 null 转换为 undefined（如果需要）

#### 2.2 choiceValues 转换

**规则**：只保留 `choiceCode` 和 `choiceValue`，其他字段丢弃

**输入**：
```json
{
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
    }
  ]
}
```

**输出**：
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

**转换代码示例**：
```typescript
const transformChoiceValues = (choiceValues: any[] | null) => {
  if (!choiceValues || choiceValues.length === 0) {
    return null;
  }
  return choiceValues.map(cv => ({
    choiceCode: cv.choiceCode,
    choiceValue: cv.choiceValue
  }));
};
```

#### 2.3 字段类型判断

- **单选字段**：`fieldType === 4`，需要转换 `choiceValues`
- **多选字段**：`fieldType === 5`，需要转换 `choiceValues`
- **其他字段**：`choiceValues` 设置为 `null`

### 3. mockSubObjects 转换

#### 3.1 基本结构

```typescript
{
  objectCode: string;        // 从 sonObjects[].object.objectCode
  objectName: string;        // 从 sonObjects[].object.objectName
  referName: string;         // 从对象关联名称（可以使用 objectName）
  referCode: string;         // 从对象关联 code（可以使用 objectCode 或生成）
  childNecessary: boolean;   // 从字段中的 childNecessary 转换（0→false, 1→true）
  fieldList: FieldDTO[];     // 从 sonObjects[].fields 转换
}
```

#### 3.2 字段列表转换

从对象的字段列表转换规则与主对象字段相同：

1. 保留所有字段属性
2. 添加 `relatedObjectCode`（从对象的 `objectCode`）
3. 保持数值字段为 0/1（normalizeField 会转换）
4. 转换 `choiceValues`（如果是单选/多选字段）

#### 3.3 referName 和 referCode

如果从对象元数据中没有提供 `referName` 和 `referCode`，可以使用以下规则：

- `referName`：使用 `object.objectName`
- `referCode`：使用 `object.objectCode` 或生成一个简化的 code

**注意**：如果从对象是通过主从关系字段关联的，可能需要从主对象的字段配置中获取这些信息。

## 完整转换示例

### 输入（object-metadata 输出）

```json
{
  "object": {
    "id": 1761632155862281,
    "orgId": 10162960,
    "objectCode": "cust_object344__c",
    "objectName": "自定义对象"
  },
  "fields": [
    {
      "id": 1748293727716595,
      "orgId": 10162960,
      "relatedObjectId": 1748293727716594,
      "fieldCode": "main_field",
      "fieldName": "编号1",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 1,
      "isName": 1,
      "choiceValues": null
    },
    {
      "id": 1748293727716725,
      "fieldCode": "status",
      "fieldName": "状态",
      "fieldType": 4,
      "isRequired": 0,
      "choiceValues": [
        {
          "choiceCode": "1762998146733294",
          "choiceValue": "待执行"
        },
        {
          "choiceCode": "1762998146733295",
          "choiceValue": "执行中"
        }
      ]
    }
  ],
  "sonObjects": [
    {
      "object": {
        "objectCode": "SonObject__c",
        "objectName": "从对象"
      },
      "fields": [
        {
          "id": 1761632155863001,
          "fieldCode": "son_field",
          "fieldName": "从对象字段",
          "fieldType": 1,
          "isRequired": 0
        }
      ]
    }
  ]
}
```

### 输出（Metadata.ts）

```typescript
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';

export let mockFields: FieldDTO[] = [
  {
    id: 1748293727716595,
    orgId: 10162960,
    relatedObjectId: 1748293727716594,
    relatedObjectCode: 'cust_object344__c',
    fieldCode: 'main_field',
    fieldName: '编号1',
    fieldType: 1,
    isRequired: 1,
    isUnique: 1,
    isName: 1,
    choiceValues: null
  },
  {
    id: 1748293727716725,
    orgId: 10162960,
    relatedObjectId: 1748293727716594,
    relatedObjectCode: 'cust_object344__c',
    fieldCode: 'status',
    fieldName: '状态',
    fieldType: 4,
    isRequired: 0,
    choiceValues: [
      {
        choiceCode: '1762998146733294',
        choiceValue: '待执行'
      },
      {
        choiceCode: '1762998146733295',
        choiceValue: '执行中'
      }
    ]
  }
].map(normalizeField);

export let mockSubObjects: SubObjectDTO[] = [
  {
    objectCode: 'SonObject__c',
    objectName: '从对象',
    referName: '从对象',
    referCode: 'SonObject__c',
    childNecessary: false,
    fieldList: [
      {
        id: 1761632155863001,
        orgId: 10162960,
        relatedObjectId: 1761632155862999,
        relatedObjectCode: 'SonObject__c',
        fieldCode: 'son_field',
        fieldName: '从对象字段',
        fieldType: 1,
        isRequired: 0,
        choiceValues: null
      }
    ]
  }
];
```

## 注意事项

1. **字段顺序**：保持字段在数组中的顺序，通常按 `id` 排序

2. **数据类型**：
   - 数值字段（isRequired, isUnique 等）保持为 0/1
   - `normalizeField` 函数会转换为 boolean
   - null 值保持为 null，`normalizeField` 会处理

3. **从对象处理**：
   - 如果对象没有从对象，`mockSubObjects` 设置为空数组 `[]`
   - 从对象的字段也需要完整转换

4. **choiceValues 处理**：
   - 只对 `fieldType === 4`（单选）和 `fieldType === 5`（多选）转换
   - 其他字段的 `choiceValues` 设置为 `null`

5. **缺失字段处理**：
   - 如果某些字段在元数据中缺失，使用默认值或 null
   - 确保所有必需字段都存在

## 验证检查清单

转换完成后，检查以下内容：

- [ ] `DEFAULT_OBJECT_CODE` 是否正确
- [ ] `mockFields` 数组长度是否匹配
- [ ] 所有字段的 `relatedObjectCode` 是否已添加
- [ ] 单选/多选字段的 `choiceValues` 是否正确转换
- [ ] 数值字段（isRequired 等）是否为 0/1
- [ ] `mockSubObjects` 是否正确转换（如果有）
- [ ] 从对象的字段列表是否正确
- [ ] 文件语法是否正确（TypeScript）
