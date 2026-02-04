---
name: database_query
description: |
  数据库查询工具，执行查询操作（仅SELECT）。
  触发词：查询数据库、sql查询、执行sql、v3feature、v3test
---

# 数据库查询工具

## 环境映射规则（自动匹配）

当用户提及以下关键词时，**必须**自动匹配对应的数据库连接信息，**不要询问用户**地址：

| 用户提到的环境 | 数据库地址 | 端口 | 用户名 | 密码 |
|-------------|-----------|------|--------|------|
| v3feature / feature / 测试环境-feature | 10.83.10.34 | 3306 | v3_claude_user | X6JyJnb6ECxVi |
| v3test / test / 测试环境-test | 10.83.10.44 | 3306 | v3_claude_user | X6JyJnb6ECxVi |
| ali / 阿里 / 阿里云 / prod-ali | 10.81.10.11 | 3306 | v3_claude_user | X6JyJnb6ECxVi |
| hw / 华为 / 华为云 / prod-hw | 10.81.10.34 | 3306 | v3_claude_user | X6JyJnb6ECxVi |

## 执行流程

### 1. 识别环境（必须）

从用户输入中自动提取环境标识：

- 听到 "v3feature" 或 "feature" → 使用 10.83.10.34
- 听到 "v3test" 或 "test" → 使用 10.83.10.44
- 听到 "ali" 或 "阿里" → 使用 10.81.10.11
- 听到 "hw" 或 "华为" → 使用 10.81.10.34

**重要**：环境信息已在上方表格中明确定义，**严禁**向用户询问数据库地址。

### 2. 确定查询内容

#### 2.1 关键词匹配表（优先）

当用户使用业务关键词（如"生产任务"、"工单"、"物料"等）时：

1. **立即查阅** `./references/object-table-mapping.md`（本 skill 同级目录下的 references 文件夹中）
2. **搜索关键词**，找到对应的 `库名.表名`
3. 根据映射结果直接构建SQL

**映射格式说明**：

```
关键词 库名 表名
例如：生产任务 v3_mfg produce_task → 查询表 v3_mfg.produce_task
```

**常见关键词示例**：

- 听到"工厂信息" → 查 `v3_user.organization`
- 听到"生产任务" → 查 `v3_mfg.produce_task`
- 听到"生产工单" → 查 `v3_med.work_order`
- 听到"物料" → 查 `v3_material.material_sku_base_info`

#### 2.2 确定查询方式

- 如果用户提供了具体SQL → 直接执行
- 如果用户提供关键词 → 先查映射文件匹配表，再构建SQL
- 如果关键词无匹配 → 先查表结构，再构建SQL
- 使用pymysql链接数据库

### 3. 构建SQL规则

- **必须**包含 `WHERE` 条件
- **必须**包含 `org_id = xxx`（除非查全局配置表或者查询租户信息）
- **必须**包含 `deleted_at = 0`（除非查历史数据）
- 自主构建的SQL**仅限单表**，禁止JOIN
- 有具体ID时必须用ID作为条件

### 4. 执行前检查

**必须**打印完整SQL，用【】包裹：

```
【SELECT * FROM v3_workflow.workflow_instance WHERE id = 123 AND org_id = 69466138 AND deleted_at = 0;】
```

## 常用查询语句

### 查表结构

```sql
DESC database_name.table_name;
SHOW CREATE TABLE database_name.table_name;
```

### 查所有库/表

```sql
SHOW DATABASES;
SHOW TABLES FROM database_name;
```

### 基础查询

```sql
SELECT * FROM table_name WHERE org_id = 69466138 AND deleted_at = 0 LIMIT 10;
SELECT COUNT(*) FROM table_name WHERE org_id = 69466138 AND deleted_at = 0;
```

## 表映射参考

完整的 **关键词 → 库表** 映射关系请参考：
`./references/object-table-mapping.md`（本 skill 同级目录下的 references 文件夹中）

该文件包含 400+ 业务关键词与数据库表的对应关系，查询时优先从此文件匹配。
