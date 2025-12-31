---
name: es-log
description: ES 日志查询和写入能力，支持接口日志、外部接口日志、事件日志、中间表SQL日志的查询和写入。支持从线上查询数据后写入 feature/test 环境进行造数据。使用 curl 命令执行查询和写入操作。
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

> **注意**：Feature 和 Test 共用同一个 Kibana 地址，通过索引后缀区分

> **⚠️ 严令禁止**：生产环境（阿里生产、华为生产、国泰生产）**绝对禁止**任何写入操作，仅支持查询！

### 索引命名规则

#### 支持写入的索引（feature/test 造数据）

| 类型 | 索引模式（精确匹配） | 说明 |
|------|------------------|------|
| 接口日志 | `http-access-log-{env}-openapi-domain-*` | 一定包含 `openapi-domain` |
| 外部接口日志 | `external-access-log-{env}-integration-*` | 一定包含 `integration` |
| 事件日志 | `event-retry-log-{env}-openapi-domain-*` | 一定包含 `openapi-domain` |
| 中间表SQL日志 | `mybatis-sql-log-{env}-integration-*` | 一定包含 `integration` |

**索引命名规则**：
- `{env}` 为环境后缀：`v3master`、`hwv3master`、`v3feature`、`v3test`
- 日期格式：`YYYY-MM-DD`，使用 `*` 或 `202*` 匹配

**实际索引格式示例**：
- 接口日志：`http-access-log-v3master-openapi-domain-v3master-2025-12-31`
- 外部接口日志：`external-access-log-v3master-integration-2025-12-05`
- 事件日志：`event-retry-log-v3master-openapi-domain-v3master-2025-11-22`
- 中间表SQL日志：`mybatis-sql-log-v3master-integration-2025-12-28`

**注意**：
- 接口日志和事件日志一定包含 `openapi-domain`
- 中间表SQL日志和外部接口日志一定包含 `integration`

## 【查询模板】

### 基础查询

```bash
# 查询模板（使用通配符）
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 10,
  "query": { "match_all": {} },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**参数说明**：
- `{kibana_host}`：从环境配置表中选择对应的 Kibana 地址
- `{index_pattern}`：使用通配符模式，如 `http-access-log-v3master-openapi-domain-*`

### 常用字段查询

#### 字段说明

| 字段 | 说明 |
|------|------|
| `uuid.keyword` | 文档唯一标识（接口/外部接口/事件日志） |
| `x-org-id` | 组织 ID - 小写（接口/外部接口/事件日志） |
| 文档 ID | ES 文档 ID（中间表SQL日志） |
| `X-Org-Id` | 组织 ID - 大写（中间表SQL日志） |

**重要：不同日志类型的查询字段差异**：
- **中间表SQL日志**：使用文档 ID 和大写 `X-Org-Id`
  ```json
  {
    "query": {
      "bool": {
        "filter": [
          {
            "ids": {
              "values": ["test-doc-id-12345"]
            }
          },
          {
            "term": {
              "X-Org-Id": 20096428
            }
          }
        ]
      }
    }
  }
  ```
- **其他日志类型**（接口日志、外部接口日志、事件日志）：使用 `uuid.keyword` 和小写 `x-org-id`
  ```json
  {
    "query": {
      "bool": {
        "filter": [
          {
            "term": {
              "uuid.keyword": "test-uuid-12345"
            }
          },
          {
            "term": {
              "x-org-id": 10162960
            }
          }
        ]
      }
    }
  }
  ```

**查询类型说明**：
- `term`：精确匹配，用于 keyword、数字等类型字段
- `match`：全文搜索，用于 text 类型字段，支持分词匹配

#### 根据 uuid 查询数据

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

**其他字段查询片段**（可替换到 query 部分使用）：
- `x-org-id`: `"term": { "x-org-id": 10162960 }`

## 【写入模板】

**⚠️ 严令禁止**：**绝对禁止**对生产环境（阿里生产、华为生产、国泰生产）进行任何写入操作！

- ✅ **允许写入**：仅限 Feature 和 Test 环境
- ❌ **禁止写入**：所有生产环境（包含 `v3master`、`hwv3master` 的索引）

```bash
# 写入单条数据（保留原 ID）
curl --location 'http://{kibana_host}/api/console/proxy?path={index}/_doc/{id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{...从查询结果 _source 复制的数据，需要修改 orgId 相关字段为目标 orgId，其他字段保持不变...}'
```

**参数说明**：
- `{kibana_host}`：**仅限** `kibana.ali-test.blacklake.tech`（测试环境）
  - **禁止使用**：`kibana.ali-prod.blacklake.tech`、`kibana.hwyx-prod.blacklake.tech`、`kibana-ops.guotai.blacklake.tech`（生产环境）
- `{index}`：完整索引名（包含日期），如 `http-access-log-v3feature-openapi-domain-2025-12-30`
- `{id}`：文档的 `_id`，从查询结果中获取
- **文档内容**：从查询结果的 `_source` 字段复制数据，需要修改 orgId 相关字段（`orgId`、`x-org-id`、`X-Org-Id` 等）为目标 orgId。其他所有字段（时间戳、env、业务数据等）保持不变，不要修改

## 【造数据工作流程】

**⚠️ 强制执行规则**：在执行任何写入操作前，**必须**按顺序完成以下所有步骤，**不得跳过任何步骤**。

### 步骤 1：从线上查询目标数据

使用查询模板从生产环境获取数据（参考"根据 uuid 查询数据"示例）。

记录查询结果中的：
- `_id`：文档 ID
- `_source`：文档内容
- `_index`：原始索引名

### 步骤 2：**获取目标 orgId**

**⚠️ 重要：写入前需要获取目标 orgId**

在写入数据前，必须：
1. 从查询结果的 `_source` 中提取原 orgId（可能是 `orgId`、`x-org-id`、`X-Org-Id` 等字段）
2. **获取目标 orgId**：
   - 如果用户已明确指定目标 orgId，直接使用
   - 如果用户未指定，询问用户目标 orgId 是多少
3. **明确告知用户**：即将修改的 orgId 字段和值
4. 等待用户确认后，继续执行写入操作

**重要**：默认会修改 `_source` 中的 orgId 相关字段（`orgId`、`x-org-id`、`X-Org-Id` 等）为目标 orgId，其他字段保持不变。

**示例对话**：
```
查询到的数据信息：
- 原 orgId: 123456
- 索引: http-access-log-v3master-openapi-domain-2025-12-30
- 文档ID: test-doc-id-12345

即将写入到 Feature 环境：
- 目标索引: http-access-log-v3feature-openapi-domain-2025-12-30（日期保持不变）
- 目标 orgId: [询问用户或使用用户指定的 orgId，如 10162960]

请确认目标 orgId 后，继续执行步骤 3。
```

### 步骤 3：检查 ID 冲突（必须执行，不得跳过）

**⚠️ 这是强制步骤**：在执行任何写入操作前，**必须**先检查目标索引模式中是否已存在相同文档ID的数据。

**重要**：使用通配符索引模式查询，因为相同文档ID可能存在于不同日期的索引中。即使写入的是某个具体日期的索引，也要检查所有日期的索引。

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
- 参考上方【索引命名规则】章节中的"支持写入的索引"表格
- 将 `{env}` 替换为目标环境（如 `v3feature`、`v3test`）
- 确保使用通配符 `*` 匹配所有日期

**检查结果处理**：

1. **如果文档不存在**：
   - 继续执行步骤 4（写入数据）

2. **如果文档已存在**：
   - **直接展示完整的原始 JSON 数据**（现有数据的完整 `_source` 和即将写入的完整 `_source`）
   - **明确提醒用户**：目标索引模式中已存在相同文档ID的数据（可能在不同日期的索引中）
   - **询问用户**：是否覆盖现有数据？
   - **等待用户明确确认**（"确认覆盖"）后才能继续执行步骤 4
   - **如果用户取消**：停止执行，不执行写入操作

**示例提醒**（直接展示完整 JSON）：

```
⚠️ 警告：目标索引模式中已存在相同文档ID的数据

索引模式：mybatis-sql-log-v3feature-integration-*
文档ID：kM3LY5sBKd1LskW_dyaG
现有数据所在索引：mybatis-sql-log-v3feature-integration-2025-12-27

现有数据（完整 _source）：
{...完整 JSON...}

即将写入的新数据（完整 _source）：
{...完整 JSON...}

请确认是否覆盖（回复"确认覆盖"或"取消"）
```

**⚠️ 禁止跳过此步骤**：如果未执行步骤 3 的检查就直接写入，视为严重错误。

### 步骤 4：转化成对应的目标索引并写入数据

**前置条件检查**（必须完成以下所有检查才能继续）：
- [ ] 已确认目标索引不包含生产环境标识（`v3master`、`hwv3master`）
- [ ] 已完成步骤 3 的 ID 冲突检查
- [ ] 如果存在冲突，已获得用户明确确认覆盖

**如果未完成上述检查，停止执行，返回步骤 3**。

**⚠️ 严令禁止写入生产环境**：确认目标索引不包含生产环境标识（`v3master`、`hwv3master`）！

将生产环境索引名转换为目标环境索引名，然后写入数据：

**索引转换规则**：
- **只修改 env 部分，日期保持不变**
- 阿里生产 → Feature：`v3master` → `v3feature`
- 阿里生产 → Test：`v3master` → `v3test`
- 华为生产 → Feature：`hwv3master` → `v3feature`
- 华为生产 → Test：`hwv3master` → `v3test`

**转换示例**：
```
原始索引：mybatis-sql-log-v3master-integration-2025-12-28
目标索引（Feature）：mybatis-sql-log-v3feature-integration-2025-12-28（日期保持不变）

原始索引：http-access-log-v3master-openapi-domain-2025-12-30
目标索引（Feature）：http-access-log-v3feature-openapi-domain-2025-12-30（日期保持不变）
```

**数据修改规则**：
- ✅ **必须修改**：`_source` 中的 orgId 相关字段（`orgId`、`x-org-id`、`X-Org-Id` 等）为目标 orgId
- ❌ **不修改**：
  - 时间戳字段（`@timestamp`、`timestamp`、`times` 等）
  - env 相关字段（`app_env`、`appid` 等）
  - 其他所有业务数据（SQL、参数、执行时间等）

使用 PUT 方法写入数据，保留原始 `_id`：

**模板命令**：
```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={目标索引}/_doc/{原始_id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{...从步骤1查询结果的 _source 字段复制的数据，需要修改 orgId 相关字段为目标 orgId，其他字段保持不变...}'
```

**完整示例**：
```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path=http-access-log-v3feature-openapi-domain-2025-12-30/_doc/test-doc-id-12345&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "orgId": 123456,
  "@timestamp": "2025-12-30T10:30:00.000Z",
  "request": "/api/v1/users",
  "method": "GET",
  "status": 200,
  "responseTime": 150
}'
```

**重要**：`--data` 中的内容应该从步骤 1 查询结果的 `_source` 字段复制，但需要修改 orgId 相关字段（`orgId`、`x-org-id`、`X-Org-Id` 等）为目标 orgId。其他所有字段（时间戳、env、业务数据等）保持不变，不要修改。

## 【示例】

### 示例：根据 uuid 查询数据

参考"查询模板"章节中的"根据 uuid 查询数据"部分。

## 【注意事项】

1. **权限控制（⚠️ 严令禁止写入生产环境）**：
   - **生产环境（阿里、华为、国泰）**：**仅支持查询**，**绝对禁止任何写入操作**
   - **禁止写入的索引特征**：包含 `v3master`、`hwv3master` 的索引
   - **允许写入的环境**：仅限 Feature（`v3feature`）和 Test（`v3test`）环境
   - **写入前必须检查**：确认目标索引不包含生产环境标识

2. **索引命名**：
   - 使用通配符 `*` 匹配日期部分，避免硬编码具体日期
   - 写入时必须使用完整索引名（包含具体日期）

3. **数据安全**：
   - **写入前需要确认目标 orgId**，避免数据混乱
   - 造数据前确认目标环境，避免误操作
   - 建议先在 Test 环境测试，确认无误后再操作 Feature 环境

4. **工作流程强制执行**：
   - **必须按顺序执行步骤 1 → 步骤 2 → 步骤 3 → 步骤 4**，不得跳过任何步骤
   - **步骤 3（ID 冲突检查）是强制步骤**：在执行步骤 4（写入数据）前，必须先完成步骤 3
   - 使用 PUT 方法写入会覆盖已存在的同 ID 文档
   - **ID 冲突检查**：使用通配符索引模式查询目标环境是否存在相同文档ID的数据（因为相同文档ID可能存在于不同日期的索引中）
   - **如果存在冲突**：必须直接展示完整的原始 JSON 数据（现有数据和即将写入的数据），明确提醒用户，并询问是否覆盖
   - **等待用户明确确认**（"确认覆盖"）后才能执行写入操作
   - **如果未执行步骤 3 就直接写入，视为严重错误**

5. **索引日期**：
   - 查询时使用通配符 `*` 可以跨日期查询
   - 写入时必须指定具体日期的索引名
   - **索引日期保持与原数据一致**，只修改索引中的 env 部分

6. **数据完整性**：
   - 写入时确保包含所有必要字段
   - **只修改 orgId 相关字段（`orgId`、`x-org-id`、`X-Org-Id` 等）为目标 orgId，其他字段保持不变**
   - 特别注意 `@timestamp` 字段格式：ISO 8601 格式（保持原值，不修改）
   - 保留原始 `_id` 以便追溯数据来源

7. **数据验证（可选）**：
   - 写入后可以查询目标环境确认数据已写入（非必须流程）
  
