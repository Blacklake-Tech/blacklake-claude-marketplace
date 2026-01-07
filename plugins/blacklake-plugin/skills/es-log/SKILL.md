---
name: es-log
description: ES 日志查询和写入能力，支持接口日志、外部接口日志、事件日志、中间表接口日志的查询和写入。支持从线上查询数据后写入 feature/test 环境进行造数据。使用 curl 命令执行查询和写入操作。
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

**⚠️ 严令禁止**：**绝对禁止**对生产环境进行任何写入操作！

- ✅ **允许写入**：仅限 Feature 和 Test 环境
- ❌ **禁止写入**：所有生产环境（包含 `v3master`、`hwv3master` 的索引）

### 写入模板

```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={index}/_doc/{id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{...从查询结果 _source 复制的数据...}'
```

**参数说明**：
- `{kibana_host}`：**仅限** `kibana.ali-test.blacklake.tech`
- `{index}`：完整索引名（包含日期），如 `http-access-log-v3feature-openapi-domain-2025-12-30`
- `{id}`：文档的 `_id`，从查询结果中获取

## 【造数据工作流程】

**⚠️ 强制执行规则**：必须按顺序完成所有步骤，不得跳过。

### 步骤 1：从线上查询目标数据

使用查询模板从生产环境获取数据，记录：
- `_id`：文档 ID
- `_source`：文档内容
- `_index`：原始索引名

### 步骤 2：确认写入参数

**⚠️ 必须询问用户两个问题**：

1. **目标 orgId**：
   - 如果用户已指定，直接使用
   - 如果未指定，询问用户目标 orgId 是多少

2. **执行时间处理方式**（必须询问）：
   - **保持原时间**：索引日期和执行时间字段都保持原值
   - **改为当前时间**：索引日期改为当前日期，执行时间字段改为当前13位时间戳
   - **指定时间**：用户提供时间（支持多种格式），AI自动转换为13位时间戳，索引日期从时间戳提取

**时间修改联动规则**：
- **如果修改时间**（当前或指定）：
  - 索引日期改为对应日期（从时间戳提取，格式：`YYYY-MM-DD`）
  - 执行时间字段改为对应的13位时间戳
    - 接口/事件/外部接口日志：`send_at`
    - 中间表接口日志：`@timestamp`
- **如果不修改时间**（保持原时间）：
  - 索引日期保持原值
  - 执行时间字段保持原值

**示例对话**：
```
查询到的数据：
- 原 orgId: 123456
- 原执行时间: 1735552200000 (2025-12-30 10:30:00)
- 原索引: http-access-log-v3master-openapi-domain-2025-12-30

请确认：
1. 目标 orgId？
2. 执行时间？
   a) 保持原时间 (2025-12-30 10:30:00)
   b) 改为当前时间
   c) 指定时间（可提供时间戳、ISO格式、北京时间等）
```

### 步骤 3：检查 ID 冲突

**⚠️ 强制步骤**：写入前必须检查目标索引模式中是否已存在相同文档ID的数据。

**检查命令**（使用通配符索引模式）：
```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={索引模式}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "query": {
    "ids": {
      "values": ["{文档ID}"]
    }
  }
}'
```

**索引模式构建**：
- 参考【索引命名规则】表格
- 将 `{env}` 替换为目标环境（`v3feature`、`v3test`）
- 使用通配符 `*` 匹配所有日期

**检查结果处理**：
- **如果文档不存在**：继续执行步骤 4
- **如果文档已存在**：
  - 展示完整 JSON 数据（现有数据和即将写入的数据）
  - 询问用户是否覆盖
  - 等待用户明确确认（"确认覆盖"）后才能继续
  - 如果用户取消：停止执行

### 步骤 4：写入数据

**前置条件检查**：
- [ ] 已确认目标索引不包含生产环境标识（`v3master`、`hwv3master`）
- [ ] 已完成步骤 3 的 ID 冲突检查
- [ ] 如果存在冲突，已获得用户明确确认覆盖

**索引转换规则**：
- 根据步骤 2 的时间处理方式决定索引日期：
  - **保持原时间**：索引日期保持原值，只修改 env 部分
  - **修改时间**：索引日期改为对应日期（从时间戳提取），修改 env 部分
- 环境转换：
  - 阿里生产 → Feature：`v3master` → `v3feature`
  - 阿里生产 → Test：`v3master` → `v3test`
  - 华为生产 → Feature：`hwv3master` → `v3feature`
  - 华为生产 → Test：`hwv3master` → `v3test`

**数据修改规则**：
- ✅ **必须修改**：orgId 相关字段（`orgId`、`x-org-id`、`X-Org-Id` 等）为目标 orgId
- ✅ **根据步骤2的决策修改**：
  - **如果修改时间**：执行时间字段改为对应的13位时间戳
    - 接口/事件/外部接口日志：`send_at`
    - 中间表接口日志：`@timestamp`
  - **如果不修改时间**：执行时间字段保持原值
- ❌ **不修改**：env 相关字段、其他业务数据

**写入命令**：
```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={目标索引}/_doc/{原始_id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{...从步骤1查询结果的 _source 字段复制，根据步骤2的决策修改 orgId 和执行时间字段...}'
```

## 【修改已写入数据的执行时间】

用户可能在数据写入后，需要修改执行时间以触发 1 分钟内的轮询通知。

使用 `POST _update` API 进行部分更新：
- 接口/事件/外部接口日志：修改 `send_at` 字段
- 中间表接口日志：修改 `@timestamp` 字段
- 支持多种时间格式输入（时间戳、ISO格式、北京时间等），AI自动转换为13位时间戳
- 获取当前时间戳：`echo $(($(date +%s) * 1000))`

**注意**：修改执行时间时，索引名也需要相应更新（索引日期从新的时间戳提取）。

## 【注意事项】

1. **权限控制**：
   - 生产环境（阿里、华为、国泰）**仅支持查询**，**绝对禁止写入**
   - 允许写入的环境：仅限 Feature（`v3feature`）和 Test（`v3test`）

2. **工作流程**：
   - 必须按顺序执行步骤 1 → 步骤 2 → 步骤 3 → 步骤 4，不得跳过
   - 步骤 3（ID 冲突检查）是强制步骤，未执行视为严重错误

3. **时间处理**：
   - 步骤 2 必须询问用户执行时间处理方式
   - 修改时间时，索引日期和执行时间字段同步修改
   - 不修改时间时，索引日期和执行时间字段都保持原值

4. **索引命名**：
   - 查询时使用通配符 `*` 匹配日期
   - 写入时必须使用完整索引名（包含具体日期）
   - 索引日期根据时间处理方式决定（保持原值或从时间戳提取）

5. **数据完整性**：
   - 写入时确保包含所有必要字段
   - 只修改 orgId 和执行时间字段（根据步骤2决策），其他字段保持不变
   - 保留原始 `_id` 以便追溯数据来源
