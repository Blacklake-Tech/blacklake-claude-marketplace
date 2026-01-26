# 模板使用指南

本文档指导如何正确使用 demos/custom-object 模板来生成新项目。

## 模板的作用和定位

### 什么是模板?

`demos/custom-object/` 是一个完整的、可运行的参考实现,展示了如何构建一个自定义对象管理系统。

**模板的特点**:
- ✅ 完整可运行
- ✅ 包含所有最佳实践
- ✅ 代码结构清晰
- ✅ 注释完善
- ✅ 类型定义完整

### 模板不是什么?

**❌ 不是脚手架**: 不直接复制粘贴
**❌ 不是代码片段**: 不是简单的拼接
**❌ 不是静态样板**: 需要根据元数据调整

### 正确的使用方式

**参考而非复制**:
1. 理解模板的设计模式
2. 学习关键实现技巧
3. 根据元数据生成新代码
4. 保持一致的代码风格

**类比**:
- ❌ 错误: 复印模板,改几个变量名
- ✅ 正确: 理解模板,重新生成符合元数据的代码

## 模板结构理解

### 目录组织

```
demos/custom-object/
├── src/
│   ├── index.tsx              # 应用入口
│   ├── Metadata.ts            # 对象元数据 (重点)
│   │
│   ├── types/                 # 类型定义 (关键)
│   │   ├── common.ts          # 通用类型
│   │   ├── customObject.ts    # 对象类型 (根据元数据调整)
│   │   ├── api.ts             # API 类型
│   │   └── index.ts           # 类型导出
│   │
│   ├── components/            # 组件 (参考实现)
│   │   ├── operationIcon.tsx  # 操作图标
│   │   ├── utils.ts           # 组件工具
│   │   └── styles/            # 组件样式
│   │
│   ├── pages/                 # 页面 (参考模式)
│   │   └── customObject/
│   │       ├── list.tsx       # 列表页 (参考字段渲染)
│   │       ├── detail.tsx     # 详情页
│   │       ├── create.tsx     # 创建页
│   │       ├── edit.tsx       # 编辑页
│   │       └── utils.ts       # 页面工具
│   │
│   ├── api/                   # API 层 (参考封装)
│   │   ├── customObject.ts    # API 定义
│   │   └── request.ts         # 请求封装
│   │
│   └── utils/                 # 工具层 (通用,可复用)
│       ├── mockMode.ts        # Mock 模式
│       ├── auth.ts            # 认证
│       └── postMessage.ts     # 通信
│
├── package.json               # 依赖配置 (参考版本)
├── tsconfig.json              # TS 配置 (直接复用)
├── vite.config.ts             # Vite 配置 (参考调整)
└── README.md                  # 文档模板
```

### 文件分类

**🟢 可直接复用**:
- `tsconfig.json` - TypeScript 配置
- `src/utils/*` - 工具函数 (通用逻辑)
- `src/components/operationIcon.tsx` - 通用组件
- `.gitignore`, `.eslintrc.js` 等配置文件

**🟡 需要调整**:
- `package.json` - 项目名称、描述
- `vite.config.ts` - 端口、代理配置
- `src/types/customObject.ts` - 根据元数据调整类型
- `README.md` - 项目说明

**🔴 需要重新生成**:
- `src/Metadata.ts` - 根据元数据生成
- `src/pages/customObject/*` - 根据字段类型调整表单
- `src/api/customObject.ts` - 根据对象调整 API

## 关键文件详解

### 1. Metadata.ts (核心文件)

**作用**: 定义对象的字段和从对象 Mock 数据

**结构**:
```typescript
// 1. 导入类型
import type { FieldDTO, SubObjectDTO } from './types/customObject';

// 2. 设置对象 code
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';

// 3. normalizeField 函数
const normalizeField = (field: any): FieldDTO => {
  // 转换 0/1 → boolean, null → undefined
};

// 4. mockFields (主对象字段)
export let mockFields: FieldDTO[] = [...].map(normalizeField);

// 5. mockSubObjects (从对象定义)
export let mockSubObjects: SubObjectDTO[] = [...];
```

**生成规则**: 严格按照 [元数据转换规则](./metadata-transform.md)

**关键点**:
- DEFAULT_OBJECT_CODE 必须与元数据一致
- mockFields 保持原始 0/1 格式
- mockSubObjects 使用 boolean
- normalizeField 函数完整复制

### 2. types/customObject.ts (类型定义)

**作用**: 定义对象和字段的 TypeScript 类型

**核心类型**:
```typescript
// 字段类型枚举
export enum FieldType {
  TEXT = 1,           // 单行文本
  NUMBER = 2,         // 数值
  TEXT_AREA = 3,      // 多行文本
  SELECT = 4,         // 单选
  MULTI_SELECT = 5,   // 多选
  BOOLEAN = 6,        // 布尔
  INTEGER = 7,        // 整数
  DATE = 8,           // 日期时间
  URL = 9,            // 链接
  REFERENCE = 11,     // 关联
  ATTACHMENT = 14,    // 附件
  IMAGE = 16,         // 图片
}

// 字段 DTO
export interface FieldDTO {
  id: number;
  fieldCode: string;
  fieldName: string;
  fieldType: number;
  isRequired: boolean;    // 注意: normalizeField 后是 boolean
  isName: boolean;
  isRefer: boolean;
  // ...其他字段
}

// 从对象 DTO
export interface SubObjectDTO {
  objectCode: string;
  objectName: string;
  referCode: string;
  childNecessary: boolean;
  fieldList: SubFieldDTO[];
}
```

**调整原则**:
- 基本类型不变
- 根据元数据添加/删除字段
- 保持与 FieldDTO 一致

### 3. pages/customObject/list.tsx (列表页)

**作用**: 展示对象列表,根据字段类型渲染不同的列

**关键模式 1: 字段类型映射**

```typescript
// 字段类型常量
const FilterFieldType = {
  text: 1,
  number: 2,
  textArea: 3,
  select: 4,
  multiSelect: 5,
  boolean: 6,
  integer: 7,
  date: 8,
  url: 9,
  reference: 11,
};

// 根据字段类型渲染列
const buildColumnsFromFields = () => {
  return fields.map((field: FieldDTO) => {
    switch (field.fieldType) {
      case FilterFieldType.date:
        return {
          title: field.fieldName,
          dataIndex: field.fieldCode,
          render: (value: any) => formatValue(value, 'time'),
        };

      case FilterFieldType.reference:
        return {
          title: field.fieldName,
          dataIndex: field.fieldCode,
          render: (value: any) => formatValue(value),
        };

      case FilterFieldType.select:
      case FilterFieldType.multiSelect:
        return {
          title: field.fieldName,
          dataIndex: field.fieldCode,
          render: (value: any) => {
            // 从 choiceValues 查找显示值
            const choice = field.choiceValues?.find(
              (c) => c.choiceCode === value
            );
            return choice?.choiceValue || '-';
          },
        };

      default:
        return {
          title: field.fieldName,
          dataIndex: field.fieldCode,
        };
    }
  });
};
```

**关键模式 2: 值格式化**

```typescript
// 格式化显示值
const formatValue = (value: any, type?: 'time' | 'user'): string => {
  // 时间格式化
  if (type === 'time') {
    if (!value) return '-';
    const date = new Date(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  // 用户格式化
  if (type === 'user') {
    return value?.name || value?.username || '-';
  }

  // 关联对象格式化
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.mainProperty || value.$primaryValue || value.objectName || '-';
  }

  // 数组格式化
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === 'object'
        ? item.mainProperty || item.name
        : item
    ).join(', ');
  }

  return value || '-';
};
```

**关键模式 3: 筛选器生成**

```typescript
// 根据字段类型生成筛选器
const buildFiltersFromFields = () => {
  return fields.map((field: FieldDTO) => {
    switch (field.fieldType) {
      case FilterFieldType.text:
        return (
          <Form.Item label={field.fieldName} name={field.fieldCode}>
            <Input placeholder={`请输入${field.fieldName}`} />
          </Form.Item>
        );

      case FilterFieldType.select:
        return (
          <Form.Item label={field.fieldName} name={field.fieldCode}>
            <Select placeholder={`请选择${field.fieldName}`}>
              {field.choiceValues?.map((choice) => (
                <Select.Option key={choice.choiceCode} value={choice.choiceCode}>
                  {choice.choiceValue}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );

      case FilterFieldType.date:
        return (
          <Form.Item label={field.fieldName} name={field.fieldCode}>
            <DatePicker.RangePicker />
          </Form.Item>
        );

      // ...其他类型
    }
  });
};
```

### 4. pages/customObject/create.tsx (创建页)

**作用**: 创建对象,根据字段类型渲染表单控件

**关键模式 1: 表单控件映射**

```typescript
// 根据字段类型渲染表单项
const renderFormItem = (field: FieldDTO) => {
  switch (field.fieldType) {
    case FieldType.TEXT:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          rules={[{ required: field.isRequired, message: `请输入${field.fieldName}` }]}
        >
          <Input
            placeholder={field.fieldRemind || `请输入${field.fieldName}`}
            maxLength={field.maxLength}
          />
        </Form.Item>
      );

    case FieldType.NUMBER:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          rules={[{ required: field.isRequired, message: `请输入${field.fieldName}` }]}
        >
          <InputNumber
            placeholder={field.fieldRemind}
            precision={field.decimalNumber}
            max={field.maxValue}
          />
        </Form.Item>
      );

    case FieldType.TEXT_AREA:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          rules={[{ required: field.isRequired }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={field.maxLength}
            placeholder={field.fieldRemind}
          />
        </Form.Item>
      );

    case FieldType.SELECT:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          rules={[{ required: field.isRequired }]}
        >
          <Select placeholder={`请选择${field.fieldName}`}>
            {field.choiceValues?.map((choice) => (
              <Select.Option key={choice.choiceCode} value={choice.choiceCode}>
                {choice.choiceValue}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      );

    case FieldType.DATE:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          rules={[{ required: field.isRequired }]}
        >
          <DatePicker
            showTime
            format={field.datetimeFormat || 'YYYY-MM-DD HH:mm:ss'}
          />
        </Form.Item>
      );

    case FieldType.BOOLEAN:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      );

    case FieldType.REFERENCE:
      return (
        <Form.Item
          label={field.fieldName}
          name={field.fieldCode}
          rules={[{ required: field.isRequired }]}
        >
          <Select
            placeholder={`请选择${field.fieldName}`}
            mode={field.targetType === 1 ? 'multiple' : undefined}
          >
            {/* 关联对象选项 */}
          </Select>
        </Form.Item>
      );

    default:
      return null;
  }
};
```

**关键模式 2: 必填验证**

```typescript
// 必填字段验证规则
const getValidationRules = (field: FieldDTO) => {
  const rules: any[] = [];

  // 必填验证
  if (field.isRequired) {
    rules.push({
      required: true,
      message: `请输入${field.fieldName}`,
    });
  }

  // 唯一性验证
  if (field.isUnique) {
    rules.push({
      validator: async (_, value) => {
        if (!value) return;
        // 调用 API 检查唯一性
        const exists = await checkUniqueness(field.fieldCode, value);
        if (exists) {
          throw new Error(`${field.fieldName}已存在`);
        }
      },
    });
  }

  // 长度验证
  if (field.maxLength) {
    rules.push({
      max: field.maxLength,
      message: `${field.fieldName}最多${field.maxLength}个字符`,
    });
  }

  return rules;
};
```

**关键模式 3: 从对象处理**

```typescript
// 渲染从对象表格
const renderSubObjectTable = (subObject: SubObjectDTO) => {
  return (
    <Form.Item label={subObject.referName}>
      <Table
        dataSource={subObjectData[subObject.referCode] || []}
        columns={buildSubObjectColumns(subObject)}
        rowKey="id"
      />
      <Button onClick={() => addSubObjectRow(subObject.referCode)}>
        添加{subObject.objectName}
      </Button>
    </Form.Item>
  );
};

// 从对象列定义
const buildSubObjectColumns = (subObject: SubObjectDTO) => {
  return subObject.fieldList.map((field) => ({
    title: field.fieldName,
    dataIndex: field.fieldCode,
    render: (_, record, index) => renderSubObjectFormItem(field, subObject.referCode, index),
  }));
};

// 从对象表单项
const renderSubObjectFormItem = (field: SubFieldDTO, referCode: string, index: number) => {
  const fieldName = [referCode, index, field.fieldCode];

  switch (field.fieldType) {
    case FieldType.TEXT:
      return (
        <Form.Item
          name={fieldName}
          rules={[{ required: field.isRequired }]}
          noStyle
        >
          <Input placeholder={field.fieldRemind} />
        </Form.Item>
      );
    // ...其他类型
  }
};
```

## 关键模式总结

### 模式 1: 字段驱动 UI

**核心思想**: 根据元数据字段动态生成 UI

```typescript
// ✅ 正确: 字段驱动
fields.map((field) => {
  switch (field.fieldType) {
    case FieldType.TEXT:
      return <Input />;
    case FieldType.SELECT:
      return <Select options={field.choiceValues} />;
    // ...
  }
});

// ❌ 错误: 硬编码
<Form>
  <Input name="field1" />
  <Select name="field2" />
</Form>
```

### 模式 2: 类型安全

**核心思想**: 充分利用 TypeScript 类型系统

```typescript
// ✅ 正确: 类型定义完整
interface FieldDTO {
  id: number;
  fieldCode: string;
  fieldType: number;
  isRequired: boolean;
}

const renderField = (field: FieldDTO) => {
  // TypeScript 会检查类型
};

// ❌ 错误: 使用 any
const renderField = (field: any) => {
  // 失去类型检查
};
```

### 模式 3: 数据规范化

**核心思想**: 统一数据格式,简化处理逻辑

```typescript
// ✅ 正确: 使用 normalizeField 统一转换
const normalizedFields = mockFields.map(normalizeField);

// ❌ 错误: 到处进行条件判断
if (field.isRequired === 1 || field.isRequired === true) {
  // 混乱的逻辑
}
```

### 模式 4: 关注点分离

**核心思想**: 数据层、业务层、展示层分离

```typescript
// ✅ 正确: 分层清晰
// 数据层: src/api/customObject.ts
export const customObjectApi = {
  list: (params) => request.get('/api/customObject', { params }),
  create: (data) => request.post('/api/customObject', data),
};

// 业务层: src/pages/customObject/utils.ts
export const formatFieldValue = (field, value) => { /*...*/ };

// 展示层: src/pages/customObject/list.tsx
const columns = buildColumnsFromFields();

// ❌ 错误: 混在一起
const ListPage = () => {
  // API 调用、业务逻辑、UI 渲染全部混在一起
};
```

## 参考而非复制的原则

### 什么时候参考?

**场景 1: 理解设计模式**
- 如何根据字段类型渲染不同控件?
- 如何处理必填验证?
- 如何格式化显示值?

**场景 2: 学习代码风格**
- 命名约定
- 文件组织
- 注释规范

**场景 3: 复用通用逻辑**
- 工具函数 (utils/)
- 类型定义基础结构
- 请求封装

### 什么时候不能直接复制?

**场景 1: 字段相关代码**
- ❌ 不能复制固定的字段列表
- ✅ 应该根据元数据动态生成

**场景 2: 对象特定逻辑**
- ❌ 不能复制硬编码的对象 code
- ✅ 应该使用 DEFAULT_OBJECT_CODE

**场景 3: Mock 数据**
- ❌ 不能复制 Metadata.ts 的具体数据
- ✅ 应该根据元数据转换生成

### 示例: 正确的参考方式

**错误方式** ❌:
```typescript
// 直接复制 list.tsx 的列定义
const columns = [
  { title: '编号', dataIndex: 'main_field' },
  { title: '单行文本', dataIndex: 'cust_field2__c' },
  // ...固定的列
];
```

**正确方式** ✅:
```typescript
// 参考 list.tsx 的模式,根据元数据生成
const buildColumnsFromFields = (fields: FieldDTO[]) => {
  return fields
    .filter((field) => field.isUsed)  // 只显示启用的字段
    .map((field) => {
      // 参考模板的 switch 逻辑
      switch (field.fieldType) {
        case FieldType.DATE:
          return {
            title: field.fieldName,
            dataIndex: field.fieldCode,
            render: (value) => formatValue(value, 'time'),
          };
        // ...根据字段类型动态生成
      }
    });
};

const columns = buildColumnsFromFields(mockFields);
```

## 常见误区

### 误区 1: 模板即代码

**错误认知**: "我把模板复制过来,改几个变量名就行了"

**正确认知**: 模板展示的是模式和最佳实践,需要根据元数据重新生成

### 误区 2: 过度复制

**错误做法**: 把模板的所有文件都复制一遍,包括具体的字段定义

**正确做法**:
- 复制: 配置文件、工具函数、基础类型
- 参考: 字段处理逻辑、UI 渲染模式
- 重新生成: Metadata.ts、字段相关代码

### 误区 3: 忽略元数据

**错误做法**: 不看元数据,直接用模板的默认字段

**正确做法**: 严格按照元数据生成所有字段相关的代码

### 误区 4: 缺少理解

**错误做法**: 不理解代码为什么这样写,照抄就行

**正确做法**: 理解每一段代码的用途,根据需要调整

## 快速检查清单

生成新项目后,用这个清单检查是否正确使用了模板:

- [ ] Metadata.ts 是根据元数据生成的,不是复制的
- [ ] DEFAULT_OBJECT_CODE 与元数据一致
- [ ] 没有硬编码的字段 code
- [ ] 字段类型映射覆盖了所有元数据中的字段类型
- [ ] 必填验证基于 field.isRequired
- [ ] 从对象处理基于 mockSubObjects
- [ ] 工具函数可以复用模板的
- [ ] 类型定义基于元数据调整
- [ ] package.json 的项目名称已修改
- [ ] README.md 的说明已更新

## 总结

**核心原则**:
1. **理解模式**: 学习模板的设计模式和最佳实践
2. **参考实现**: 参考模板的关键实现技巧
3. **重新生成**: 根据元数据生成新代码
4. **保持一致**: 保持代码风格和结构一致

**记住**:
- 模板是**参考实现**,不是**代码库**
- 元数据是**唯一真相**,不是模板
- 理解是**前提**,复制是**手段**

**最终目标**:
生成的项目应该是针对特定对象元数据定制的,而不是模板的简单复制。
