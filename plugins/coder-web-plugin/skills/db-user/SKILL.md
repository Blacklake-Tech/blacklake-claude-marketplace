---
name: db-user
description: 查询租户和组织信息（v3_user数据库）。使用 MCP 工具 exec_sql 执行（zones 默认 ["feature"]）。
---

# v3_user 数据库查询

## 通用规范

参考：[通用规范](./COMMON.md)

## 【查询工作流程】

### 1. 确定查询目标

根据用户需求，明确要查询的租户信息：
- 已知租户ID：直接使用ID查询
- 已知工厂编号：使用code字段模糊匹配
- 已知工厂名称：使用organization_name或display_name模糊匹配

### 2. 构建并执行查询

1. **选择合适的查询模板**（见下文【查询模板】章节）
2. **替换参数**：将模板中的 `{参数名}` 替换为实际值
3. **打印SQL**：在执行前先打印完整的 SQL 语句（用【】包起来）
4. **执行查询**：使用 `exec_sql` 工具执行 SQL

### 3. 结果展示

- 说明查询到的记录数量
- 提取关键字段：租户ID (`id`)、工厂编号 (`code`)、工厂名称 (`organization_name`)、显示名称 (`display_name`)
- 多条记录使用表格展示

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
3. 结构化展示结果

## 查询模板

### organization

**用途**：查询租户/组织信息，获取 orgId

**参数**：
- `{org_id}` - 租户ID
- `{code}` - 工厂编号
- `{organization_name}` - 工厂名称

```sql
-- 按租户ID查询
SELECT * FROM v3_user.organization WHERE id = {org_id};

-- 按工厂编号查询
SELECT * FROM v3_user.organization WHERE code LIKE '%{code}%';

-- 按工厂名称查询
SELECT * FROM v3_user.organization WHERE (organization_name LIKE '%{organization_name}%' OR display_name LIKE '%{organization_name}%');
```

**返回关键字段**：
- `id` - 租户ID（即 orgId）
- `code` - 工厂编号
- `organization_name` - 组织名称
- `display_name` - 显示名称

## 注意事项

**工具调用**：
1. exec_sql 是 MCP 工具，zones 默认 `["feature"]`
2. 执行前打印 SQL（用【】）

**SQL**：
3. `{参数}` 必须替换实际值
4. 模糊查询使用 LIKE '%{value}%'

**输出**：
5. 表格展示多条记录
6. 明确标注 `id` 字段即为 `orgId`（供其他 skill 使用）
