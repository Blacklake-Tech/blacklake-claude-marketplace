---
name: db-user
description: 查询租户和组织信息（v3_user数据库）。使用 exec_sql 工具执行查询。
---

# v3_user 数据库查询

## 【查询工作流程】

### 1. 确定查询目标

根据用户需求，明确要查询的租户信息：
- 已知租户ID：直接使用ID查询
- 已知工厂编号：使用code字段模糊匹配
- 已知工厂名称：使用organization_name或display_name模糊匹配

### 2. 构建并执行查询

1. **选择合适的查询模板**（见下文【查询模板】章节）
2. **替换参数**：将模板中的 `{参数名}` 替换为实际值
3. **打印SQL**：在执行前先打印完整的 SQL 语句
4. **执行查询**：使用 `exec_sql` 工具执行 SQL

### 3. 结果展示

- 说明查询到的记录数量
- 提取关键字段：租户ID (`id`)、工厂编号 (`code`)、工厂名称 (`organization_name`)、显示名称 (`display_name`)
- 多条记录使用表格展示

## 【通用规范】

参考：[通用规范](./COMMON.md)

## 执行方式

所有查询使用 `exec_sql` 工具执行，参数替换为实际值。

**重要**：在执行 SQL 前，必须先打印出完整的目标 SQL 语句，然后再使用 `exec_sql` 工具执行。

**重要**：执行 SQL 后，必须对查询结果进行结构化展示：
- 明确说明查询到的记录数量
- 提取并展示关键字段的值（如租户ID、工厂编号、工厂名称等）
- 多条记录时使用表格或列表形式展示，避免直接输出原始 JSON 数据

## 查询模板

### organization

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

## 注意事项

1. 参数替换：所有模板中的`{参数名}`都需要替换为实际值
2. 执行方式：必须通过 MCP 工具 `exec_sql` 执行
3. 表结构查询：使用 `DESC v3_user.organization` 或 `SHOW COLUMNS FROM v3_user.organization` 查询
