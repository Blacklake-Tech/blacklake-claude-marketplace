---
name: db-e-report
description: 提供v3_e-report数据库的SQL查询模板，包括数据分析告警配置等表的查询。查询分析告警配置时使用。使用 exec_sql 工具执行查询。
---

# v3_e-report 数据库查询

## 【查询工作流程】

### 1. 确定查询目标

根据用户需求，明确要查询的告警配置信息：
- 查询特定租户的告警配置：使用 `org_id` 精确查询
- 统计告警配置数量：使用聚合查询（`COUNT` 函数）
- 查询已发布的告警：添加 `status = 1` 条件

### 2. 构建并执行查询

1. **选择合适的查询模板**（见下文【查询模板】章节）
2. **替换参数**：将模板中的 `{参数名}` 替换为实际值
3. **注意删除标记**：确保包含 `deleted_at = 0` 条件
4. **打印SQL**：在执行前先打印完整的 SQL 语句
5. **执行查询**：使用 `exec_sql` 工具执行 SQL

### 3. 结果展示

- 说明查询到的记录数量或统计结果
- 提取关键字段：告警配置ID (`id`)、租户ID (`org_id`)、名称 (`name`)、状态 (`status`)
- 统计查询展示：租户数量、告警规则数量
- 多条记录使用表格展示

## 【通用规范】

参考：[通用规范](./COMMON.md)

## 执行方式

所有查询使用 `exec_sql` 工具执行，参数替换为实际值。

**重要**：在执行 SQL 前，必须先打印出完整的目标 SQL 语句，然后再使用 `exec_sql` 工具执行。

**重要**：执行 SQL 后，必须对查询结果进行结构化展示：
- 明确说明查询到的记录数量
- 提取并展示关键字段的值（如告警配置ID、名称等）
- 多条记录时使用表格或列表形式展示，避免直接输出原始 JSON 数据

## 查询模板

### analysis_config

**用途**：查询数据分析告警配置信息。用于统计配置了数据分析告警的租户数和告警规则数量。

**字段**：
- `id` - 告警配置ID
- `org_id` - 租户ID（工厂id）
- `code` - 编号
- `name` - 名称
- `status` - 状态（0=未启用，1=启用，表示是否发布）
- `data_set_id` - 数据集ID
- `conditions` - 条件（JSON格式）
- `action` - 触发动作

**查询示例**：
```sql
-- 按租户查询告警配置
SELECT * FROM v3_e-report.analysis_config WHERE org_id = {org_id} AND deleted_at = 0;

-- 统计已发布的告警配置
SELECT 
    COUNT(DISTINCT org_id) as tenant_count,
    COUNT(*) as rule_count
FROM v3_e-report.analysis_config
WHERE status = 1 AND deleted_at = 0;
```

**注意**：完整表结构通过 `DESC v3_e-report.analysis_config` 或 `SHOW COLUMNS FROM v3_e-report.analysis_config` 查询。

## 注意事项

1. 参数替换：所有模板中的`{参数名}`都需要替换为实际值
2. 删除标记：所有查询都包含`deleted_at = 0`条件
3. 执行方式：必须通过 MCP 工具 `exec_sql` 执行
4. 表结构查询：使用 `DESC table_name` 或 `SHOW COLUMNS FROM table_name` 查询

