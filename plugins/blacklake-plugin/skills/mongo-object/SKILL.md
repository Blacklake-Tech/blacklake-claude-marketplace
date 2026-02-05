---
name: mongo-object
description: 查询 MongoDB 数据库的业务对象数据。目前仅支持 Feature 环境（object_project_feature）。必须先确定租户和对象信息后再进行查询。
---

# MongoDB 业务对象数据查询

> **⚠️ 环境说明**：目前仅维护 **Feature 环境**，数据库为 `object_project_feature`。其他环境暂不支持。

> **⚠️ 使用场景限制**：
> - ✅ **适用场景**：查询业务对象的**实例数据**（如具体的生产工单、物料记录等）
> - ❌ **不适用场景**：
>   - 工作流排查（使用 `exec_sql` 查询 `v3_workflow` 数据库）
>   - 元数据查询（使用 `db-metadata` skill）
>   - 租户信息查询（使用 `db-user` skill）
>   - 连接器配置查询（使用 `db-openapi` skill）
>   - 日志分析（使用 `es-log` skill）
>
> **判断依据**：如果需要查询的是**业务单据的具体数据**（如"查询工单编号为 xxx 的详细信息"），使用本 skill；否则使用对应的 SQL 查询 skill。

## 【前置条件检查】

**执行 MongoDB 查询前，必须按顺序完成以下步骤：**

### TODO 1：获取租户信息（可选）

**判断**：用户是否已提供 org_id？
- ✅ **已提供**：直接使用，记录 org_id = ______
- ❌ **未提供**：主动询问用户
  - [ ] 是否需要指定租户？
  - [ ] 选项：a) 指定租户（需要工厂名称或 org_id）  b) 不指定，查询所有租户数据
  - [ ] 如果选择指定租户：
    - 确认工厂名称或工厂编号
    - 使用 db-user skill 查询租户信息
    - 记录租户ID (org_id): ______
  - [ ] 如果选择不指定：跳过此步骤，查询后使用 db-user skill 查询租户信息展示

### TODO 2：获取对象编码

**判断**：用户是否已提供 object_code？
- ✅ **已提供**：直接使用，记录 object_code = ______
- ❌ **未提供**：
  - [ ] 确认对象名称（如"生产工单"、"物料"等）
  - [ ] 使用 `db-metadata` skill 查询（参考 object-mapping-supplement.md）
  - [ ] 记录 object_code: ______
  - [ ] 记录对象类型：□ 预制对象 (org_id=-1) / □ 自定义对象 (org_id≠-1)

### TODO 3：确定集合名和过滤条件

- [ ] 根据对象类型确定集合名
  - 预制对象：集合名 = `{object_code}`，查询时必须添加 `orgId` 过滤
  - 自定义对象：集合名 = `{object_code}#{org_id}`
- [ ] 记录集合名: ______
- [ ] 记录基础过滤条件: ______

### TODO 4：查看样本数据确认字段

**如果需要使用业务字段（如工单编号、物料名称等）进行查询，必须先完成此步骤：**

- [ ] 使用 `find` 查询 1 条样本数据（`limit: 1`）查看字段结构
- [ ] 确认业务字段的实际字段名
- [ ] 记录字段映射: ______

**示例**：
```javascript
// 先查看样本数据
collection: "{object_code}"
database: "object_project_feature"
filter: {"orgId": {org_id}}
limit: 1

// 从结果中确认字段名，例如：工单编号字段是 "code" 而不是 "orderNo"
```

**重要**：不同对象的字段名可能不同，禁止猜测字段名。

### TODO 5：执行正式查询

- [ ] 使用确认的字段名构建查询条件
- [ ] 执行 MongoDB 查询

---

## 【常见错误】

### 错误1：数据库名称错误
- ❌ 错误：`database: "object_project"`（生产环境，暂不支持）
- ❌ 错误：`database: "object_project_test"`（Test 环境，暂不支持）
- ✅ 正确：`database: "object_project_feature"`（Feature 环境，唯一支持）

### 错误2：集合名称错误
- ❌ 错误：直接猜测集合名，如 `production_order`、`work_order`、`production`
- ✅ 正确：使用 `{object_code}#{org_id}` 或 `{object_code}` 格式

### 错误3：跳过前置步骤
- ❌ 错误：直接使用 MongoDB MCP 工具查询
- ✅ 正确：先完成 TODO 1-3，再执行 MongoDB 查询

### 错误4：预制对象缺少 orgId 过滤
- **预制对象**：查询时必须添加 `orgId` 过滤条件
  - ❌ 错误：`filter: {"code": "xxx"}`
  - ✅ 正确：`filter: {"code": "xxx", "orgId": {org_id}}`
- **自定义对象**：集合名已包含 org_id（`{object_code}#{org_id}`），无需额外过滤

---

## 【完整查询示例】

**需求**：查询 feature 环境中，生产工单编号为 xxx 的数据

### TODO 1：确定租户信息 ✅
- 使用 `db-user` skill 查询租户信息
- 结果：org_id = {org_id}

### TODO 2：确定对象信息 ✅
- 使用 `db-metadata` skill 查询"生产工单"的对象编码
- 结果：object_code = ProductionOrder（预制对象）

### TODO 3：确定集合名 ✅
- 集合名：`ProductionOrder`
- 基础过滤：`{"orgId": {org_id}}`

### TODO 4：查看样本数据确认字段 ✅
- 查看 1 条样本数据，确认工单编号字段为 `code`

### TODO 5：执行正式查询 ✅
```javascript
collection: "ProductionOrder"
database: "object_project_feature"
filter: {"code": "xxx", "orgId": {org_id}}
```

---

## 【查询租户和对象信息】

- **查询租户信息**：使用 db-user skill
- **查询对象编码**：使用 db-metadata skill
- **租户信息展示**：查询后默认使用 db-user skill 查询租户信息展示给用户

---

## MCP Server 配置

| 环境 | 服务器名称 | 数据库 | 状态 |
|------|-----------|--------|------|
| Feature | `mongo-feature` | `object_project_feature` | ✅ 已配置 |
| Test | - | `object_project_test` | ❌ 暂不支持 |
| 生产 | - | `object_project` | ❌ 暂不支持 |

**当前可用**：仅 Feature 环境  
**模式**：只读（--readOnly）

## 数据结构

### 集合命名规则

| 对象类型 | 集合名格式 | 示例 |
|---------|-----------|------|
| 自定义对象 | `{object_code}#{org_id}` | `CustomObject#{org_id}` |
| 预制对象 | `{object_code}` | `ProductionOrder` |
| 关联表 | `{xxx}_Rel` | 暂不关注 |

### 关键字段

- `object_code` - 对象编码
- `org_id` - 租户ID（用于拼接集合名）
- `orgId` - 预制对象集合中的租户字段

### 区分规则

- **预制对象**：集合名为 `{object_code}`，查询时必须添加 `{"orgId": xxx}` 过滤
- **自定义对象**：集合名为 `{object_code}#{org_id}`

## 可用 MCP 工具

- `list-collections` - 列出所有集合
- `collection-schema` - 查看集合结构
- `find` - 查询文档
- `count` - 统计数量
- `aggregate` - 聚合查询

## 【MongoDB 通用字段】

以下是预制对象在 MongoDB 中的**通用字段**（所有预制对象都包含）：

| 字段名 | 数据类型 | 说明 |
|--------|---------|------|
| `orgId` | Number | 租户ID，预制对象查询时必须过滤此字段 |
| `createdAt` | Date | 记录创建时间 |
| `updatedAt` | Date | 记录更新时间 |

**业务字段**：不同对象有不同的业务字段（如编号、名称、状态等），使用前必须通过 TODO 4 查看样本数据确认。

---

## 注意事项

1. **必须先完成前置 TODO 步骤**，确定租户和对象信息后再查询
2. **org_id 为可选参数**：
   - 如果用户未提供，主动询问是否需要指定
   - 查询后默认使用 db-user skill 查询租户信息展示
3. **目前仅支持 Feature 环境**，数据库名固定为 `object_project_feature`
4. 预制对象查询必须添加 `orgId` 过滤条件
5. 只读模式，无法修改数据
6. MongoDB ObjectId 格式：`{"_id": {"$oid": "xxx"}}`
7. 如需查询其他环境，请联系管理员配置对应的 MCP Server
