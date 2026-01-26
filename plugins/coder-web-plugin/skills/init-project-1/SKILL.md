---
name: init-project-1
aliases: [scaffold, create-app]
description: 前端项目初始化技能,根据模板和对象元数据生成新项目。支持自定义对象、工单、物料等类型。
---

# 前端项目初始化

## 功能说明

本 skill 用于根据 Blacklake 对象元数据快速生成前端项目。

**支持的项目类型**:
- ✅ `custom-object` - 自定义对象管理系统 (当前支持)
- 🚧 `work-order` - 工单管理系统 (规划中)
- 🚧 `material` - 物料管理系统 (规划中)
- 🚧 `warehouse` - 仓储管理系统 (规划中)

**主要功能**:
- 自动获取租户和对象元数据
- 生成完整的 React + TypeScript + Vite 项目
- 转换元数据为 Mock 数据
- 遵循最佳实践的项目结构

## 通用规范

参考: [通用规范](./COMMON.md)

**依赖的 skills**:
- `db-user` - 查询租户信息
- `object-metadata` - 获取对象元数据

**MCP 工具**:
- `query_org_info` - 查询租户信息
- `query_meta_detail` - 查询对象元数据

## 演示项目

**完整参考实现**:
- `demos/custom-object/` - 自定义对象管理系统

参考使用指南: [模板使用指南](./reference/template-guide.md)

## 主流程: 初始化自定义对象项目

### 阶段 1: 收集参数

询问用户以下参数:

**必需参数**:
- 项目类型 (默认: `custom-object`)
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
项目类型: custom-object
目标目录: ~/projects/purchase-order
租户信息: 黑湖智造
对象信息: purchase_order
环境: ["feature"]
```

**验证**:
- 检查目标目录是否存在
- 如果存在,询问是否覆盖
- 默认不覆盖

### 阶段 2: 获取 orgId

**目的**: 如果用户提供的是工厂名称或编号,需要查询获取 orgId

**步骤**:
1. 判断用户提供的租户信息类型
2. 如果不是 orgId,调用 db-user skill 查询
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
1. 确定对象 code (优先使用 code,否则通过名称查询)
2. 调用 object-metadata skill 获取元数据
3. 验证元数据完整性

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

### 阶段 4: 参考模板创建项目

**重要**: 不要直接复制模板,而是参考模板生成新项目

**步骤**:

#### 4.1 理解模板结构
1. 读取 `demos/custom-object/` 目录结构
2. 识别关键文件和目录
3. 理解各文件的作用

参考: [模板使用指南](./reference/template-guide.md)

#### 4.2 生成项目目录
```
<target-dir>/
├── src/
│   ├── index.tsx
│   ├── Metadata.ts          # 将在阶段 5 生成
│   ├── types/
│   │   ├── common.ts
│   │   ├── customObject.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── CustomObjectForm.tsx
│   │   ├── CustomObjectList.tsx
│   │   └── SubObjectTable.tsx
│   ├── services/
│   │   └── customObjectService.ts
│   └── utils/
│       ├── mockMode.ts
│       ├── auth.ts
│       ├── openapiAuth.ts
│       └── index.ts
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

#### 4.3 生成基础文件

**package.json**:
- 项目名称使用 kebab-case
- 依赖版本与模板保持一致

**tsconfig.json**:
- 从模板复制,不修改

**vite.config.ts**:
- 从模板复制,根据需要调整端口

**README.md**:
- 项目名称和对象名称
- 启动说明
- 功能说明

#### 4.4 生成类型定义

参考模板的 `src/types/` 目录:
- `common.ts` - 通用类型
- `customObject.ts` - 对象类型 (根据元数据调整)
- `api.ts` - API 类型
- `index.ts` - 类型导出

#### 4.5 生成组件

参考模板的 `src/components/` 目录:
- `CustomObjectForm.tsx` - 表单组件 (根据字段类型调整)
- `CustomObjectList.tsx` - 列表组件
- `SubObjectTable.tsx` - 从对象表格 (如果有从对象)

**关键模式**:
- 字段类型到表单控件的映射
- 必填验证
- 从对象处理

参考: [模板使用指南](./reference/template-guide.md#关键模式)

#### 4.6 生成服务和工具

参考模板的 `src/services/` 和 `src/utils/` 目录:
- 服务层: API 调用逻辑
- 工具层: Mock 模式、认证、通用工具

### 阶段 5: 生成 Metadata.ts

**最关键的步骤**: 按照精确的转换规则生成 Metadata.ts

**转换规则**: 参考 [元数据转换规则](./reference/metadata-transform.md)

**步骤**:

#### 5.1 设置 DEFAULT_OBJECT_CODE
```typescript
// 从元数据 fields[0].relatedObjectCode 获取
export const DEFAULT_OBJECT_CODE = 'cust_object344__c';
```

#### 5.2 复制 normalizeField 函数
从模板 `demos/custom-object/src/Metadata.ts` 完整复制,不修改:

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

#### 5.3 生成 mockFields 数组

**核心原则**: 保持原始数据格式,不做转换

1. 从元数据中提取 `fields` 数组
2. 对于每个字段,保留所有原始字段
3. **保持数值型布尔字段为 0/1** (不转换为 true/false)
4. **保持 null 值为 null** (不转换为 undefined)
5. 简化 choiceValues (只保留 choiceCode 和 choiceValue)
6. 生成 TypeScript 数组字面量
7. 末尾添加 `.map(normalizeField)`

**示例**:
```typescript
export let mockFields: FieldDTO[] = [
  {
    "id": 1748293727716595,
    "orgId": 10162960,
    "relatedObjectCode": "cust_object344__c",
    "fieldCode": "main_field",
    "fieldName": "编号1",
    "fieldType": 1,
    "isRequired": 1,        // 保持数值
    "isUnique": 1,          // 保持数值
    "isUsed": 1,            // 保持数值
    "isName": 1,            // 保持数值
    "isRefer": 0,           // 保持数值
    "referType": null,      // 保持 null
    "choiceValues": null,
    ...其他所有字段
  },
  // ...更多字段
].map(normalizeField);      // 运行时转换
```

**choiceValues 处理**:
```typescript
// 原始数据
"choiceValues": [
  {
    "id": 1001,
    "choiceCode": "1748293727716726",
    "choiceValue": "A",
    "sequence": 1,
    "isActive": 1
  }
]

// 转换后
"choiceValues": [
  {
    "choiceCode": "1748293727716726",
    "choiceValue": "A"
  }
]
```

#### 5.4 生成 mockSubObjects 数组

**核心原则**: 简化字段,直接使用 boolean

1. 从元数据中提取 `sonObjects` 数组
2. 如果为空,生成空数组: `export let mockSubObjects: SubObjectDTO[] = [];`
3. 简化从对象字段,只保留核心字段
4. **直接转换 0/1 为 boolean** (true/false)
5. 不应用 normalizeField

**从对象保留的字段**:
- `objectCode`, `objectName`, `referName`, `referCode`
- `childNecessary` (boolean)
- `fieldList` (简化后的字段数组)

**从对象字段保留的字段**:
- `id`, `fieldCode`, `fieldName`, `fieldType`
- `isRequired` (boolean), `isName` (boolean), `isRefer` (boolean)
- `fieldRemind`, `choiceValues`, `datetimeFormat`

**示例**:
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
        isRequired: true,   // 1 → true
        isName: true,       // 1 → true
        isRefer: false,     // 0 → false
        fieldRemind: '请输入从对象编号',
      },
      // ...更多字段
    ],
  },
];
```

**详细转换规则**: [元数据转换规则](./reference/metadata-transform.md)

### 阶段 6: 验证和输出

#### 6.1 验证文件完整性
- [ ] 所有必需文件已生成
- [ ] package.json 依赖完整
- [ ] tsconfig.json 配置正确
- [ ] Metadata.ts 格式正确

#### 6.2 验证 Metadata.ts
参考: [元数据转换规则 - 验证清单](./reference/metadata-transform.md#验证清单)

- [ ] DEFAULT_OBJECT_CODE 设置正确
- [ ] normalizeField 函数完整
- [ ] mockFields 保持原始 0/1 格式
- [ ] mockFields 末尾有 `.map(normalizeField)`
- [ ] choiceValues 只包含 choiceCode 和 choiceValue
- [ ] mockSubObjects 使用 boolean
- [ ] mockSubObjects 字段简化

#### 6.3 验证 TypeScript 类型
```bash
cd <target-dir>
npx tsc --noEmit
```

#### 6.4 输出成功信息

```
✅ 项目初始化完成!

项目路径: /Users/siting/projects/purchase-order
项目类型: custom-object
对象名称: 采购订单 (purchase_order)
字段数量: 35
从对象数量: 1

下一步:
  cd /Users/siting/projects/purchase-order
  npm install
  npm run dev

项目将在 http://localhost:5173 启动
```

## 决策点

### DP1: 如何处理从对象?

**问题**: 元数据中包含 sonObjects,如何生成 mockSubObjects?

**决策**:
1. 如果 sonObjects 为空或不存在:
   - 生成空数组: `export let mockSubObjects: SubObjectDTO[] = [];`

2. 如果 sonObjects 不为空:
   - 为每个从对象生成简化的定义
   - 字段只保留核心字段(id, fieldCode, fieldName, fieldType, isRequired, isName, isRefer)
   - 0/1 直接转换为 boolean
   - choiceValues 简化,只保留 choiceCode 和 choiceValue

**理由**:
- UI 展示不需要所有字段
- boolean 更直观易懂
- 减小数据量

### DP2: 如何处理单选/多选字段?

**问题**: choiceValues 包含很多辅助字段(id, sequence, isActive等),是否需要全部保留?

**决策**:
- 只保留 `choiceCode` 和 `choiceValue`
- 去掉 id, sequence, isActive 等辅助字段

**理由**:
- UI 只需要 code 和 value
- 简化数据结构
- 减小文件大小

**示例**:
```typescript
// 原始
"choiceValues": [
  {
    "id": 1001,
    "choiceCode": "xxx",
    "choiceValue": "A",
    "sequence": 1,
    "isActive": 1
  }
]

// 简化后
"choiceValues": [
  {
    "choiceCode": "xxx",
    "choiceValue": "A"
  }
]
```

### DP3: 项目名称如何确定?

**问题**: 如何根据对象名称生成项目名称?

**决策**:
1. 基于对象名称生成 kebab-case
2. 转换规则:
   - 中文转拼音
   - 空格/下划线转连字符
   - 全部小写
   - 移除特殊字符

**示例**:
- "采购订单" → "purchase-order"
- "生产工单" → "production-order"
- "cust_object344__c" → "custom-object-344"

**备选方案**:
如果无法确定合适的名称,询问用户:
```
对象名称: "采购订单"
建议项目名称: purchase-order
是否使用? (y/n)
或输入自定义名称:
```

## 错误处理

### 错误 1: orgId 查询失败

**错误信息**:
```
❌ 无法找到租户信息

提供的参数:
  工厂名称: "不存在的工厂"
  zones: ["feature"]

建议:
  1. 检查工厂名称是否正确
  2. 尝试使用工厂编号
  3. 直接提供 orgId
```

**处理**:
1. 尝试多种查询方式 (名称→编号→orgId)
2. 都失败后提示用户
3. 不猜测,不假设

### 错误 2: 对象元数据查询失败

**错误信息**:
```
❌ 无法获取对象元数据

提供的参数:
  对象 code: "nonexistent_object__c"
  orgId: 10162960
  zones: ["feature"]

建议:
  1. 检查对象 code 是否正确
  2. 确认对象在该租户下存在
  3. 检查 zones 参数是否正确
```

**处理**:
1. 验证对象 code 格式
2. 提供详细错误信息
3. 给出明确的排查步骤

### 错误 3: 目标目录已存在

**警告信息**:
```
⚠️  警告

目标目录已存在: /Users/siting/projects/purchase-order

是否覆盖? (y/n)
```

**处理**:
1. 检测目标目录
2. 如果存在,询问用户
3. 默认不覆盖
4. 用户确认后再执行

### 错误 4: 元数据格式异常

**错误信息**:
```
❌ 元数据格式异常

问题:
  - fields 数组为空
  或
  - 没有主属性字段 (isName=1)
  或
  - relatedObjectCode 不一致

详细信息:
  <输出元数据详情>

建议:
  1. 检查对象配置是否完整
  2. 确认至少有一个主属性字段
  3. 联系管理员检查对象定义
```

**处理**:
1. 验证 fields 数组不为空
2. 验证至少有一个 isName=1 的字段
3. 验证 relatedObjectCode 一致性
4. 输出详细错误信息

## 输出示例

### 成功输出

```
🚀 开始初始化项目...

[1/6] 收集参数
  项目类型: custom-object
  目标目录: ~/projects/purchase-order
  租户信息: 黑湖智造
  对象信息: purchase_order
  环境: ["feature"]

[2/6] 获取 orgId
  ✅ 找到租户信息
  工厂名称: 黑湖智造
  工厂编号: BLK001
  orgId: 10162960

[3/6] 获取对象元数据
  ✅ 获取对象元数据成功
  对象名称: 采购订单
  对象 code: purchase_order
  字段数量: 35
  从对象数量: 1

[4/6] 创建项目结构
  ✅ 生成目录结构
  ✅ 生成 package.json
  ✅ 生成 tsconfig.json
  ✅ 生成 vite.config.ts
  ✅ 生成类型定义
  ✅ 生成组件文件
  ✅ 生成服务和工具

[5/6] 生成 Metadata.ts
  ✅ 设置 DEFAULT_OBJECT_CODE
  ✅ 生成 mockFields (35 个字段)
  ✅ 生成 mockSubObjects (1 个从对象)

[6/6] 验证和输出
  ✅ 文件完整性验证通过
  ✅ TypeScript 类型验证通过

✅ 项目初始化完成!

项目路径: /Users/siting/projects/purchase-order
项目类型: custom-object
对象名称: 采购订单 (purchase_order)
字段数量: 35
从对象数量: 1

下一步:
  cd ~/projects/purchase-order
  npm install
  npm run dev

项目将在 http://localhost:5173 启动

📚 参考文档:
  - README.md: 项目说明
  - src/Metadata.ts: 对象元数据
  - demos/custom-object: 完整示例
```

## 相关文档

- [通用规范](./COMMON.md) - 参数格式、命名约定、错误处理
- [元数据转换规则](./reference/metadata-transform.md) - Metadata.ts 生成规则
- [模板使用指南](./reference/template-guide.md) - 如何参考模板

## 后续扩展

### 工单 (work-order)
- 状态流转
- 关联工序
- 设备绑定
- 物料追踪

### 物料 (material)
- 物料分类
- 规格管理
- 库存追踪
- BOM 结构

### 仓储 (warehouse)
- 库位管理
- 库存查询
- 出入库
- 移库调拨
