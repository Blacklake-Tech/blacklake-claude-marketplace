---
name: mongo-object
description: 查询 object_project MongoDB 数据库的业务对象数据。使用 MongoDB 官方 MCP Server，支持 Feature 环境。
---

# object_project MongoDB 数据库查询

## MCP Server 配置

**服务器名称**：`mongo-feature`  
**数据库**：`object_project_feature`  
**模式**：只读（--readOnly）

## 数据结构

### 集合命名规则

| 对象类型 | 集合名格式 | 示例 |
|---------|-----------|------|
| 自定义对象 | `{object_code}#{org_id}` | `material#10677487` |
| 预制对象 | `{object_code}` | `AQL` |
| 关联表 | `{xxx}_Rel` | 暂不关注 |

### 关键字段

- `object_code` - 对象编码
- `org_id` - 租户ID（用于拼接集合名）
- `orgId` - 预制对象集合中的租户字段

### 区分规则

- **预制对象**：集合名为 `{object_code}`，查询时必须添加 `{"orgId": xxx}` 过滤
- **自定义对象**：集合名为 `{object_code}#{org_id}`

## 查询流程

1. 使用 `db-metadata` skill 获取 `object_code`
   - `org_id = -1` 表示预制对象
   - `org_id != -1` 表示自定义对象

2. 使用 `db-user` skill 获取租户的 `org_id`

3. 确定集合名：
   - 自定义对象：`{object_code}#{org_id}`
   - 预制对象：`{object_code}`（查询时添加 orgId 过滤）

4. 使用 MongoDB MCP 工具查询（find、count、aggregate 等）

## 可用 MCP 工具

- `list-collections` - 列出所有集合
- `collection-schema` - 查看集合结构
- `find` - 查询文档
- `count` - 统计数量
- `aggregate` - 聚合查询

## 注意事项

1. 预制对象查询必须添加 `orgId` 过滤条件
2. 只读模式，无法修改数据
3. MongoDB ObjectId 格式：`{"_id": {"$oid": "xxx"}}`
