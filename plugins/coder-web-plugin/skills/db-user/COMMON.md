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
3. 结构化展示结果

## SQL 规范

- 参数：`{paramName}`
- 模糊查询：LIKE '%{value}%'

## 输出规范

- 多条记录：表格展示
- 提取关键字段
- 明确说明记录数量
