---
name: es-log
description: ES 日志查询和写入的技术规范和操作模板，包含环境配置、字段映射、查询/写入/更新模板、数据转换规则。使用 curl 命令执行操作。
---

# ES 日志查询和写入

## 【环境配置】

### Kibana 地址映射

| 环境 | Kibana 地址 | 索引后缀 | 权限 |
|------|------------|---------|------|
| 阿里生产 | `kibana.ali-prod.blacklake.tech` | `-v3master` | 仅查询 |
| 华为生产 | `kibana.hwyx-prod.blacklake.tech` | `-hwv3master` | 仅查询 |
| 国泰生产 | `kibana-ops.guotai.blacklake.tech` | `-v3master` | 仅查询 |
| Feature | `kibana.ali-test.blacklake.tech` | `-v3feature` | 查询+写入 |
| Test | `kibana.ali-test.blacklake.tech` | `-v3test` | 查询+写入 |

> **⚠️ 严令禁止**：生产环境（阿里生产、华为生产、国泰生产）**绝对禁止**任何写入操作，仅支持查询！

### 索引命名规则

| 类型 | 索引模式 | 说明 |
|------|---------|------|
| 接口日志 | `http-access-log-{env}-openapi-domain-*` | 包含 `openapi-domain` |
| 外部接口日志 | `external-access-log-{env}-integration-*` | 包含 `integration` |
| 事件日志 | `event-retry-log-{env}-openapi-domain-*` | 包含 `openapi-domain` |
| 中间表接口日志 | `mybatis-sql-log-{env}-integration-*` | 包含 `integration` |

**规则**：
- `{env}` 为环境后缀：`v3master`、`hwv3master`、`v3feature`、`v3test`
- 日期格式：`YYYY-MM-DD`，查询时使用 `*` 匹配

## 【字段映射】

### 查询字段

| 字段 | 说明 |
|------|------|
| `uuid.keyword` | 文档唯一标识（接口/外部接口/事件日志） |
| `x-org-id` | 组织 ID - 小写（接口/外部接口/事件日志） |
| 文档 ID | ES 文档 ID（中间表接口日志） |
| `X-Org-Id` | 组织 ID - 大写（中间表接口日志） |

**查询字段差异**：
- **中间表接口日志**：使用文档 ID 和大写 `X-Org-Id`
  ```json
  {
    "query": {
      "bool": {
        "filter": [
          { "ids": { "values": ["test-doc-id-12345"] } },
          { "term": { "X-Org-Id": 11111111 } }
        ]
      }
    }
  }
  ```
- **其他日志类型**（接口/外部接口/事件日志）：使用 `uuid.keyword` 和小写 `x-org-id`
  ```json
  {
    "query": {
      "bool": {
        "filter": [
          { "term": { "uuid.keyword": "test-uuid-12345" } },
          { "term": { "x-org-id": 22222222 } }
        ]
      }
    }
  }
  ```

### 执行时间字段

| 日志类型 | 执行时间字段 | 格式 |
|---------|-------------|------|
| 接口日志 | `send_at` | 13位时间戳 |
| 事件日志 | `send_at` | 13位时间戳 |
| 外部接口日志 | `send_at` | 13位时间戳 |
| 中间表接口日志 | `@timestamp` | 13位时间戳 |

**时间格式说明**：
- 存储格式：13 位毫秒级 Unix 时间戳（如 `1735992600000`）
- 获取当前时间戳：`echo $(($(date +%s) * 1000))`
- 时间格式转换：支持多种输入格式自动转换为13位时间戳
  - 13位时间戳：直接使用
  - ISO格式（如 `2026-01-04T12:30:00+08:00`）：转换为时间戳
  - 北京时间（如 `2026-01-04 12:30:00`）：转换为时间戳（东八区）
  - 其他常见格式：自动识别并转换
- 从时间戳提取日期：转换为北京时间后提取 `YYYY-MM-DD` 格式用于索引名

## 【查询操作】

### 基础查询模板

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 10,
  "query": { "match_all": {} },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

### 根据 uuid 查询

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 10,
  "query": {
    "term": { "uuid.keyword": "test-uuid-12345" }
  }
}'
```

**参数说明**：
- `{kibana_host}`：Kibana 地址，参考【环境配置】
- `{index_pattern}`：索引模式，参考【索引命名规则】
- `size`：返回记录数

**查询类型**：
- `term`：精确匹配，用于 keyword、数字等类型字段
- `match`：全文搜索，用于 text 类型字段

## 【写入操作】

### 写入数据模板

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index}/_doc/{id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{...完整文档数据...}'
```

**参数说明**：
- `{kibana_host}`: Kibana 地址
- `{index}`: 完整索引名（包含具体日期），如 `http-access-log-v3feature-openapi-domain-2025-12-30`
- `{id}`: 文档 ID
- 数据内容：JSON 格式的完整文档数据

### 更新执行时间模板

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index}/_update/{id}&method=POST' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "doc": {
    "{time_field}": {timestamp}
  }
}'
```

**参数说明**：
- `{time_field}`: 执行时间字段名
  - 接口/事件/外部接口日志：`send_at`
  - 中间表日志：`@timestamp`
- `{timestamp}`: 13 位毫秒级时间戳

### ID 冲突检查模板

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "query": {
    "ids": {
      "values": ["{document_id}"]
    }
  }
}'
```

**参数说明**：
- `{index_pattern}`: 使用通配符模式，如 `http-access-log-v3feature-openapi-domain-*`
- `{document_id}`: 要检查的文档 ID

**返回结果解释**：
- `hits.total.value` 为 0：文档不存在
- `hits.total.value` > 0：文档已存在
  - `hits.hits[0]._source`：现有文档的完整数据
  - `hits.hits[0]._index`：现有文档所在的索引

## 【数据转换规则】

### 索引名转换

**环境转换**：
- 阿里生产 → Feature：`v3master` → `v3feature`
- 阿里生产 → Test：`v3master` → `v3test`
- 华为生产 → Feature：`hwv3master` → `v3feature`
- 华为生产 → Test：`hwv3master` → `v3test`

**日期转换**：
- 从时间戳提取日期：将 13 位时间戳转换为北京时间，提取 `YYYY-MM-DD` 格式
- 示例：`1735552200000` → `2025-12-30`

**完整示例**：
- 原索引：`http-access-log-v3master-openapi-domain-2025-12-30`
- 转换后（Feature，保持日期）：`http-access-log-v3feature-openapi-domain-2025-12-30`
- 转换后（Feature，改为 2026-01-05）：`http-access-log-v3feature-openapi-domain-2026-01-05`

### 字段修改规则

**org_id 字段**：
- 需要修改的字段（根据日志类型可能包含）：
  - `orgId`
  - `x-org-id`（小写，接口/外部接口/事件日志）
  - `X-Org-Id`（大写，中间表日志）
- 修改方法：全部改为目标 org_id 的值

**执行时间字段**：
- 接口/事件/外部接口日志：`send_at`
- 中间表日志：`@timestamp`
- 值类型：13 位毫秒级 Unix 时间戳

**不应修改的字段**：
- `env` 相关字段
- 业务数据字段
- 文档结构和元数据

### 时间处理规则

**时间格式转换**：
- 13 位时间戳：`1735552200000` → 直接使用
- ISO 格式：`2026-01-05T12:00:00+08:00` → 转换为时间戳
- 北京时间：`2026-01-05 12:00:00` → 转换为时间戳（东八区）
- Shell 命令获取当前：`echo $(($(date +%s) * 1000))`

**时间修改联动规则**：
- 如果保持原时间：
  - 索引日期：保持原值
  - 执行时间字段：保持原值
- 如果修改时间：
  - 索引日期：从新时间戳提取 `YYYY-MM-DD` 格式
  - 执行时间字段：改为新的 13 位时间戳

**示例**：
- 原索引：`http-access-log-v3master-openapi-domain-2025-12-30`
- 原时间：`1735552200000` (2025-12-30 10:30:00)

修改为当前时间（2026-01-05 14:20:00）：
- 新索引：`http-access-log-v3feature-openapi-domain-2026-01-05`
- 新时间：`1736061600000` (2026-01-05 14:20:00)
- 修改字段：`send_at` 或 `@timestamp`

## 【技术约束】

### 环境限制

| 环境 | Kibana 地址 | 支持的HTTP方法 |
|------|------------|---------------|
| 阿里生产 | `kibana.ali-prod.blacklake.tech` | GET |
| 华为生产 | `kibana.hwyx-prod.blacklake.tech` | GET |
| 国泰生产 | `kibana-ops.guotai.blacklake.tech` | GET |
| Feature | `kibana.ali-test.blacklake.tech` | GET, PUT, POST |
| Test | `kibana.ali-test.blacklake.tech` | GET, PUT, POST |

### 索引名识别

**生产环境索引标识**：
- 包含 `v3master`：阿里生产或国泰生产
- 包含 `hwv3master`：华为生产

**测试环境索引标识**：
- 包含 `v3feature`：Feature 环境
- 包含 `v3test`：Test 环境

### API 操作要求

**查询操作（GET）**：
- 所有环境都支持
- 可以使用通配符索引模式

**写入操作（PUT）**：
- 仅测试环境支持（Feature, Test）
- 必须使用完整索引名（包含具体日期）
- 必须提供文档 ID

**更新操作（POST _update）**：
- 仅测试环境支持（Feature, Test）
- 必须使用完整索引名
- 必须提供文档 ID
