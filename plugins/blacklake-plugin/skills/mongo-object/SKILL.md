---
name: mongo-object
description: 查询 MongoDB 数据库的业务对象数据。目前仅支持 Feature 环境（object_project_feature）。必须先确定租户和对象信息后再进行查询。
---

# MongoDB 业务对象数据查询

> **⚠️ 环境说明**：目前仅维护 **Feature 环境**，数据库为 `object_project_feature`。其他环境暂不支持。

## 【前置条件检查】

**⚠️ 执行 MongoDB 查询前，必须先完成以下 TODO 步骤！不可跳过！**

### TODO 1：确定租户信息
- [ ] 已获取租户名称或 org_id
- [ ] 使用 `db-user` skill 查询租户的工厂号（如果只有租户名称）
- [ ] 记录 org_id 值：______

### TODO 2：确定对象信息
- [ ] 已明确要查询的对象名称（如"生产工单"、"物料"等）
- [ ] 使用 `db-metadata` skill 查询对象编码（object_code）
- [ ] 记录 object_code 值：______
- [ ] 确认对象类型：预制对象（元数据 org_id = -1）/ 自定义对象（元数据 org_id != -1）

### TODO 3：拼接集合名
- [ ] 预制对象：集合名 = `{object_code}`，查询时添加 `{"orgId": org_id}` 过滤
- [ ] 自定义对象：集合名 = `{object_code}#{org_id}`

**只有完成以上 TODO 后，才能执行 MongoDB 查询！**

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
- ❌ 错误：`filter: {"orderNo": "xxx"}`
- ✅ 正确：`filter: {"orderNo": "xxx", "orgId": 10677487}`

---

## 【完整查询示例】

**需求**：查询 feature 环境中，生产工单编号为 gm260204-001 的数据

### TODO 1：确定租户信息 ✅
使用 `db-user` skill 查询租户信息：
```sql
SELECT org_id, org_name FROM organization WHERE org_name LIKE '%xxx%' AND deleted_at = 0;
```
结果：org_id = 10677487

### TODO 2：确定对象信息 ✅
使用 `db-metadata` skill 查询"生产工单"的对象编码：
```sql
SELECT object_code, object_name, org_id FROM standard_business_object 
WHERE object_name LIKE '%生产工单%' AND deleted_at = 0;
```
结果：object_code = WorkOrder, 元数据 org_id = -1（预制对象）

### TODO 3：拼接集合名 ✅
- 对象类型：预制对象（元数据 org_id = -1）
- 集合名：`WorkOrder`
- 查询时添加 orgId 过滤

### 执行 MongoDB 查询
```
collection: "WorkOrder"
database: "object_project_feature"
filter: {"orderNo": "gm260204-001", "orgId": 10677487}
```

---

## 【常用对象编码速查】

| 对象名称 | object_code | 对象类型 | 集合名规则 |
|---------|-------------|---------|-----------|
| 生产工单 | WorkOrder | 预制对象 | `WorkOrder` + orgId 过滤 |
| 物料 | Material | 预制对象 | `Material` + orgId 过滤 |
| BOM | BOM | 预制对象 | `BOM` + orgId 过滤 |
| 工艺路线 | ProcessRoute | 预制对象 | `ProcessRoute` + orgId 过滤 |
| 生产任务 | ProduceTask | 预制对象 | `ProduceTask` + orgId 过滤 |
| 自定义对象 | {object_code} | 自定义对象 | `{object_code}#{org_id}` |

> **注意**：速查表仅供参考，实际以 `db-metadata` 查询结果为准

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
| 自定义对象 | `{object_code}#{org_id}` | `material#10677487` |
| 预制对象 | `{object_code}` | `WorkOrder` |
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

## 注意事项

1. **必须先完成前置 TODO 步骤**，确定租户和对象信息后再查询
2. **目前仅支持 Feature 环境**，数据库名固定为 `object_project_feature`
3. 预制对象查询必须添加 `orgId` 过滤条件
4. 只读模式，无法修改数据
5. MongoDB ObjectId 格式：`{"_id": {"$oid": "xxx"}}`
6. 如需查询其他环境，请联系管理员配置对应的 MCP Server
