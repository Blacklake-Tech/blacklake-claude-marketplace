# 通用规范

## exec_sql 工具（MCP）

**调用格式**：
```
exec_sql(zones=["feature"], sql="SELECT ...")
```

**参数说明**：
- `zones`：环境数组（必填）
  - 默认推荐：`["feature"]`
  - 可选值：`["test", "pre", "prod-ali", "prod-hw", "prod-gt"]`
- `sql`：只读查询（SELECT/SHOW/DESC）

**执行流程**：
1. 打印 SQL（用【】包起来）
2. 调用 exec_sql
3. JSON 格式输出结果

## 获取 orgId

查询对象元数据需要 orgId，如果用户提供的是租户名称或 code：

**推荐使用 db-user skill** 查询租户信息（更简洁专业）。

**或手动查询** `v3_user.organization` 表，从返回结果的 `id` 字段获取 orgId：

```sql
-- 按租户名称查询
SELECT id, code, organization_name
FROM v3_user.organization
WHERE organization_name LIKE '%{租户名称}%'
   OR display_name LIKE '%{租户名称}%';

-- 按工厂编号查询
SELECT id, code, organization_name
FROM v3_user.organization
WHERE code LIKE '%{工厂编号}%';
```

## SQL 规范

- 必含：`deleted_at = 0`
- 租户：`(org_id = -1 OR org_id = {orgId})`
- 参数：`{paramName}`

## 输出规范

- 命名：snake_case → camelCase
- 数值：保持 0/1，不转 boolean
- null/空串：保持原样
