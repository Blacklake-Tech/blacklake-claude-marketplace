---
name: es-access-log
description: HTTP 访问日志只读查询，支持 Trace 链路追踪、关键信息搜索、服务/时间过滤等场景。仅支持查询操作，不包含写入和删除功能。使用 curl 命令执行查询操作。
---

# HTTP 访问日志查询

## 【使用场景说明】

**这是查询 ES 日志的默认选择**。当用户需要：
- 查询日志、排查问题
- 通过 Jaeger Trace URL 追踪调用链路
- 根据服务名、接口路径、时间范围查找日志
- 搜索请求/响应内容中的关键字

都应该使用本 skill（`es-access-log`）。

**只有当用户明确指定以下 4 种业务日志时，才使用 `es-log` skill**：
- 接口日志（openapi-domain 的 http-access-log）
- 外部接口日志（external-access-log）
- 事件日志（event-retry-log）
- 中间表接口日志（mybatis-sql-log）

**常见场景对应**：

| 用户需求 | 使用的 Skill |
|---------|-------------|
| "查一下日志" / "帮我看下这个接口的日志" | es-access-log（本 skill） |
| "根据 Jaeger URL 查链路" / "追踪这个 trace" | es-access-log（本 skill） |
| "查一下这个服务最近的报错" | es-access-log（本 skill） |
| "帮我造一条接口日志到 feature" | es-log |
| "查一下事件日志" / "查外部接口日志" | es-log |
| "造中间表接口日志数据" | es-log |

## 【查询工作流程】

### 1. 确定查询场景和环境

**选择查询场景**：
- Trace 链路追踪：根据 Jaeger Trace URL 查询整个调用链路
- 关键信息搜索：根据请求/响应内容关键字查找日志
- 服务/时间过滤：按服务名、接口路径、状态码、时间范围查询
- 精确查询：根据 uuid 或文档 ID 精确查找

**选择查询环境**：
- 阿里生产/预发（prod-ali/pre）：查询阿里云线上和预发环境日志
- 华为生产（prod-hw）：查询华为云线上日志
- 国泰生产（prod-gt）：查询国泰线上日志
- 测试环境（feature/test）：查询测试环境访问日志

**注意**：HTTP 访问日志**仅支持查询操作**，不支持写入和删除。

### 2. 构建索引和查询条件

1. **转换索引名**：根据环境构建索引模式（见下文【索引命名规则】）
2. **构建查询条件**：
   - 使用 `uuid.keyword` 精确查询
   - 使用 `response_header.X-Jaeger-Trace-Url` 提取 trace ID 查询链路
   - 使用 `request_body` 或 `response_body` 模糊搜索关键字
   - 使用 `appid`、`uri`、`status` 过滤服务和接口
   - 使用 `@timestamp` 过滤时间范围
   - 使用 `x-org-id`、`x-user-id` 过滤租户和用户
3. **构建 curl 命令**：拼接完整的查询URL和JSON请求体

### 3. 执行查询和展示结果

1. **执行查询**：使用 bash 工具执行 curl 命令
2. **结果展示**：
   - 说明查询到的记录数量
   - 提取关键字段：`uuid`、`appid`、`uri`、`method`、`status`、`timestamp`
   - 展示 Trace URL（如果有）
   - 展示请求/响应关键信息

### 默认查询参数

**所有查询默认使用以下参数**（除非用户明确指定）：

1. **时间范围**：最近 12 小时（`now-12h` 到 `now`）
2. **返回条数**：20 条（Trace 链路追踪除外，保持 100 条以覆盖完整链路）

**默认时间范围过滤**：
```json
{
  "range": {
    "@timestamp": {
      "gte": "now-12h",
      "lte": "now"
    }
  }
}
```

> **注意**：生产环境索引较大时，建议进一步缩小时间范围以提升查询性能。

## 【环境配置】

### Kibana 地址和索引映射

| 环境 | Kibana 地址 | 索引模式 |
|------|------------|---------|
| Feature | `kibana.ali-test.blacklake.tech` | `http-access-log-v3feature-*` |
| Test | `kibana.ali-test.blacklake.tech` | `http-access-log-v3test-*` |
| 阿里生产 | `kibana.ali-prod.blacklake.tech` | `http-access-log-v3master-*` |
| 阿里预发 | `kibana.ali-prod.blacklake.tech` | `http-access-log-v3pre-*` |
| 华为生产 | `kibana.hwyx-prod.blacklake.tech` | `http-access-log-hwv3master-*` |
| 国泰生产 | `kibana-ops.guotai.blacklake.tech` | `http-access-log-v3master-*` |

> **⚠️ 重要**：HTTP 访问日志**仅支持查询操作**，所有环境都不支持写入和删除！

### 索引使用规则

**默认使用通配符 `*`**：
- 查询时索引模式直接使用 `http-access-log-{env}-*`，不要指定具体日期
- 这样可以避免遗漏跨天的日志

**仅在以下场景指定日期**：
- 用户明确要求查询某一天的日志
- 需要缩小查询范围提升性能时
- 示例：`http-access-log-v3feature-2026-02-05`

**环境标识值**：
- `v3feature`：Feature 测试环境
- `v3test`：Test 测试环境
- `v3master`：阿里生产 / 国泰生产
- `v3pre`：阿里预发环境
- `hwv3master`：华为生产

## 【字段映射】

### 核心字段说明

| 字段 | 类型 | 说明 | 用途 |
|------|------|------|------|
| `_id` | keyword | ES 文档 ID | 精确查询 |
| `uuid` | keyword | 请求唯一标识 | 精确查询 |
| `appid` | keyword | 服务名称 | 按服务过滤 |
| `uri` | keyword | 接口路径 | 按接口过滤 |
| `method` | keyword | HTTP 方法 | 过滤请求方式 |
| `status` | integer | HTTP 状态码 | 错误日志筛选 |
| `response_code` | integer | 响应状态码 | 错误日志筛选 |
| `request_body` | text | 请求体 | 关键字搜索 |
| `response_body` | text | 响应体 | 关键字搜索 |
| `x-org-id` | keyword | 租户 ID | 按租户过滤 |
| `x-user-id` | keyword | 用户 ID | 按用户过滤 |
| `@timestamp` | date | 时间戳(毫秒) | 时间范围过滤 |
| `timestamp` | date | 时间戳(毫秒) | 时间范围过滤 |
| `response_header.X-Jaeger-Trace-Url` | keyword | Jaeger Trace URL | 提取 trace ID |
| `k8s_pod_name` | keyword | Pod 名称 | 按实例过滤 |
| `k8s_node_name` | keyword | Node 名称 | 按节点过滤 |
| `app_env` | keyword | 应用环境 | 环境标识 |

### Trace 链路追踪字段

**核心字段**：`response_header.X-Jaeger-Trace-Url`

**字段格式**：
```
http://jaeger.ali-test.blacklake.tech/trace/{trace_id}?uiFind={span_id}
```

**提取 Trace ID**：
- 从 URL 中提取 `/trace/` 后面的部分
- 示例：`http://jaeger.ali-test.blacklake.tech/trace/ca291137e5047565c274db074511ccfc?uiFind=184006ac9abf7add`
- Trace ID：`ca291137e5047565c274db074511ccfc`

## 【查询操作】

**URL格式**：`http://{kibana_host}/api/console/proxy?path={path}&method={method}`

### 场景1：Trace 链路追踪（最常用）

**步骤1：提取 Trace ID**

从 `response_header.X-Jaeger-Trace-Url` 中提取 trace ID：
```
http://jaeger.ali-test.blacklake.tech/trace/ca291137e5047565c274db074511ccfc?uiFind=xxx
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                    这是 trace ID
```

**步骤2：根据 Trace ID 查询整个链路**

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 100,
  "query": {
    "wildcard": {
      "response_header.X-Jaeger-Trace-Url": {
        "value": "*{trace_id}*"
      }
    }
  },
  "sort": [{"@timestamp": {"order": "asc"}}]
}'
```

**参数说明**：
- `{kibana_host}`：Kibana 地址，参考【环境配置】
- `{index_pattern}`：索引模式，如 `http-access-log-v3feature-*`
- `{trace_id}`：从 Jaeger URL 提取的 trace ID
- `size`：返回记录数，建议设置为 100 以覆盖整个调用链
- `sort`：按时间升序排序，展示调用顺序

**返回结果**：
- 同一 trace ID 下的所有 HTTP 请求
- 可以看到完整的调用链路和时序关系

### Trace 链路分析（默认展示）

查询 Trace 链路后，**默认进行以下分析**：

1. **服务调用链路**：按时间顺序列出所有服务的调用关系
2. **关键字段展示**（表格形式）：
   - 序号
   - 时间戳（`@timestamp`，格式化为北京时间）
   - 服务名（`appid`，去掉环境后缀如 `-v3master`）
   - 接口路径（`uri`）
   - HTTP 方法（`method`）
   - 状态码（`status`，200 显示 ✅，非 200 显示 ❌）
   - UUID

3. **异常接口详情**（对于状态码非 200 的请求）：
   - 接口信息：服务名 → 接口路径
   - 状态码
   - 入参（`request_body`）：展示关键入参，JSON 格式化
   - 出参/错误信息（`response_body`）：展示响应体或错误信息

4. **Jaeger Trace URL**：提供可点击的链接

**展示格式示例**：

```
Trace 链路查询结果

Trace ID: c81c7a6629b3a225e89f2c70b047351d
环境: 阿里生产环境 (v3master)
时间: 2026-02-05 07:50:23
记录数: 11 条

调用链路详情:

| # | 时间 | 服务 | 接口 | 方法 | 状态 |
|---|------|------|------|------|------|
| 1 | 07:50:23 | user-domain | /api/v1/verify_token | POST | 200 ✅ |
| 2 | 07:50:23 | metadata-domain | /api/v1/plugin_center/_list | POST | 200 ✅ |
| 3 | 07:50:23 | workflow-domain | /api/v1/workflow/exec/process | POST | 200 ✅ |
| 4 | 07:50:23 | mfg-domain | /app/v1/progress_report/_progress_report | POST | 500 ❌ |

异常接口详情:

接口: mfg-domain → /app/v1/progress_report/_progress_report
状态码: 500

入参:
{
  "taskId": 1669412625694911,
  "reportType": 2,
  "processId": 1645604306213192,
  ...
}

出参/错误信息:
Internal Server Error

Jaeger Trace URL:
http://jaeger.ali-prod.blacklake.tech/trace/c81c7a6629b3a225e89f2c70b047351d
```

### 场景2：按 UUID 精确查询

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "term": { "uuid.keyword": "{uuid}" }
  }
}'
```

**参数说明**：
- `{uuid}`：请求的唯一标识，如 `b9f35db1-0442-48ed-a793-5f7b881afdd6`

### 场景3：按关键信息搜索

**在请求体中搜索关键字**：

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-12h", "lte": "now" } } }
      ],
      "should": [
        { "match": { "request_body": "{keyword}" } },
        { "match": { "response_body": "{keyword}" } }
      ],
      "minimum_should_match": 1
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- `{keyword}`：要搜索的关键字（支持中文、英文、数字等）
- `should`：满足任一条件即可（request_body 或 response_body 包含关键字）
- `minimum_should_match: 1`：至少满足一个条件

**模糊搜索示例**：

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-12h", "lte": "now" } } }
      ],
      "must": [
        {
          "query_string": {
            "query": "*{keyword}*",
            "fields": ["request_body", "response_body"]
          }
        }
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

### 场景4：按服务+时间范围查询

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "term": { "appid.keyword": "{appid}" } },
        {
          "range": {
            "@timestamp": {
              "gte": "now-12h",
              "lte": "now"
            }
          }
        }
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- `{appid}`：服务名称，如 `mfg-domain-v3feature`
- 时间范围默认为最近 12 小时，可根据需要调整为具体时间戳

### 场景5：按接口路径+状态码查询

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "term": { "uri.keyword": "{uri}" } },
        { "term": { "status": {status_code} } },
        { "range": { "@timestamp": { "gte": "now-12h", "lte": "now" } } }
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- `{uri}`：接口路径，如 `/api/v1/users`
- `{status_code}`：HTTP 状态码，如 `200`、`500`

**常用状态码**：
- `200`：成功
- `400`：客户端错误
- `500`：服务器错误

### 场景6：按租户+用户过滤

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "term": { "x-org-id": "{org_id}" } },
        { "term": { "x-user-id": "{user_id}" } },
        { "range": { "@timestamp": { "gte": "now-12h", "lte": "now" } } }
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- `{org_id}`：租户 ID
- `{user_id}`：用户 ID（可选）

### 场景7：按 Pod 实例过滤

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "bool": {
      "filter": [
        { "term": { "k8s_pod_name.keyword": "{pod_name}" } },
        { "range": { "@timestamp": { "gte": "now-12h", "lte": "now" } } }
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- `{pod_name}`：Pod 名称，如 `mfg-domain-5d8cc9bdb-p5dcs`

### 场景8：基础查询（按时间排序）

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 20,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-12h",
        "lte": "now"
      }
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- 默认查询最近 12 小时的日志
- `sort`：按时间降序排序（最新的在前）
- `size`：默认返回 20 条记录

## 【查询技巧】

### 时间范围过滤

**使用相对时间**：
```json
{
  "range": {
    "@timestamp": {
      "gte": "now-1h",  // 最近1小时
      "lte": "now"
    }
  }
}
```

**常用相对时间**：
- `now-1h`：1小时前
- `now-1d`：1天前
- `now-7d`：7天前
- `now-30d`：30天前

**使用绝对时间**：
```json
{
  "range": {
    "@timestamp": {
      "gte": 1770271333000,  // 13位时间戳
      "lte": 1770357733000
    }
  }
}
```

### 组合查询

**多条件 AND 查询**（所有条件都必须满足）：
```json
{
  "bool": {
    "filter": [
      { "term": { "appid.keyword": "mfg-domain-v3feature" } },
      { "term": { "status": 500 } },
      { "range": { "@timestamp": { "gte": "now-1h" } } }
    ]
  }
}
```

**多条件 OR 查询**（满足任一条件即可）：
```json
{
  "bool": {
    "should": [
      { "term": { "status": 500 } },
      { "term": { "status": 502 } },
      { "term": { "status": 503 } }
    ],
    "minimum_should_match": 1
  }
}
```

**排除条件查询**（NOT）：
```json
{
  "bool": {
    "filter": [
      { "term": { "appid.keyword": "mfg-domain-v3feature" } }
    ],
    "must_not": [
      { "term": { "uri.keyword": "/actuator/health" } }
    ]
  }
}
```

### 聚合统计

**按服务统计请求数**：
```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 0,
  "aggs": {
    "by_service": {
      "terms": {
        "field": "appid.keyword",
        "size": 10
      }
    }
  }
}'
```

**按状态码统计**：
```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 0,
  "aggs": {
    "by_status": {
      "terms": {
        "field": "status",
        "size": 10
      }
    }
  }
}'
```

## 【结果展示】

### 展示关键信息

查询结果应包含以下关键信息：

1. **基础信息**：
   - 查询到的记录数量
   - 时间范围

2. **请求信息**：
   - `uuid`：请求唯一标识
   - `appid`：服务名称
   - `uri`：接口路径
   - `method`：HTTP 方法
   - `status`：状态码
   - `@timestamp`：请求时间

3. **Trace 信息**（如果有）：
   - `response_header.X-Jaeger-Trace-Url`：Jaeger Trace URL
   - 提取的 Trace ID

4. **租户/用户信息**（如果有）：
   - `x-org-id`：租户 ID
   - `x-user-id`：用户 ID

5. **实例信息**（如果需要）：
   - `k8s_pod_name`：Pod 名称
   - `k8s_node_name`：Node 名称

### 结果示例

```
查询到 15 条记录：

1. uuid: b9f35db1-0442-48ed-a793-5f7b881afdd6
   服务: mfg-domain-v3feature
   接口: /api/v1/users
   方法: GET
   状态: 200
   时间: 2026-02-05 14:02:13
   Trace: http://jaeger.ali-test.blacklake.tech/trace/ca291137e5047565c274db074511ccfc
   租户: 123456

2. uuid: ...
   ...
```

## 【技术约束】

### 环境限制

| 环境 | Kibana 地址 | 支持的HTTP方法 |
|------|------------|---------------|
| 阿里生产 | `kibana.ali-prod.blacklake.tech` | GET |
| 华为生产 | `kibana.hwyx-prod.blacklake.tech` | GET |
| 国泰生产 | `kibana-ops.guotai.blacklake.tech` | GET |
| Feature | `kibana.ali-test.blacklake.tech` | GET |
| Test | `kibana.ali-test.blacklake.tech` | GET |

> **⚠️ 重要**：HTTP 访问日志**仅支持查询操作（GET）**，所有环境都不支持写入（PUT/POST）和删除（DELETE）！

### API 操作要求

**查询操作（GET）**：
- 所有环境都支持
- 可以使用通配符索引模式
- 支持各种查询条件组合

**写入/删除操作**：
- **不支持**：HTTP 访问日志是只读的
- 如需造数据，请使用其他日志类型（见 es-log skill）

## 【注意事项】

1. **只读限制**：
   - HTTP 访问日志**仅支持查询操作**
   - 不支持写入、更新、删除操作
   - 如需造数据，请使用 es-log skill 的其他日志类型

2. **Trace 链路追踪**：
   - Trace ID 从 `response_header.X-Jaeger-Trace-Url` 提取
   - 查询时使用 `wildcard` 查询，支持部分匹配
   - 建议设置 `size: 100` 以覆盖整个调用链

3. **关键字搜索**：
   - `request_body` 和 `response_body` 是 text 类型，支持全文搜索
   - 使用 `match` 查询进行分词匹配
   - 使用 `query_string` 查询进行通配符匹配

4. **字段类型**：
   - `keyword` 类型字段：使用 `term` 查询（精确匹配）
   - `text` 类型字段：使用 `match` 查询（分词匹配）
   - `integer` 类型字段：使用 `term` 或 `range` 查询

5. **时间字段**：
   - 主要使用 `@timestamp` 字段
   - 时间格式：13位毫秒级时间戳
   - 支持相对时间（如 `now-1h`）和绝对时间

6. **性能优化**：
   - 尽量缩小时间范围
   - 使用精确匹配（`term`）优于模糊匹配（`match`）
   - 合理设置 `size` 参数，避免返回过多数据
