---
name: es-log
description: ES 日志查询、写入和删除能力，支持接口日志、外部接口日志、事件日志、中间表接口日志的查询、写入和删除。支持从线上查询数据后写入 feature/test 环境进行造数据。仅允许删除 feature/test 环境的数据，删除前必须获得用户明确确认。使用 curl 命令执行查询、写入和删除操作。
---

# ES 日志查询和写入

## 【查询工作流程】

### 1. 确定查询目标和环境

**选择日志类型**：
- 接口日志：查询 API 调用记录
- 外部接口日志：查询第三方接口调用记录
- 事件日志：查询业务事件触发记录
- 中间表接口日志：查询中间表SQL执行记录

**选择查询环境**：
- 生产环境（prod-ali/prod-hw/prod-gt）：仅支持查询
- 测试环境（feature/test）：支持查询、写入、删除

**注意**：不同日志类型使用不同的查询字段（见下文【字段映射】）

### 2. 构建索引和查询条件

1. **转换索引名**：根据环境和日志类型构建索引模式（见下文【索引命名规则】）
2. **构建查询条件**：
   - 使用 `uuid.keyword` 或文档ID精确查询
   - 使用 `x-org-id` 或 `X-Org-Id` 过滤租户
   - 使用时间范围过滤（`send_at` 或 `@timestamp`）
3. **构建 curl 命令**：拼接完整的查询URL和JSON请求体

### 3. 执行查询和展示结果

1. **执行查询**：使用 bash 工具执行 curl 命令
2. **结果展示**：
   - 说明查询到的记录数量
   - 提取关键字段：`uuid`、`org_id`、执行时间、状态
   - 展示日志内容的关键信息（请求/响应、错误信息等）

### 4. 造数据工作流程（仅测试环境）

**强制4步流程**（不可跳过）：

**Step 1**: 从生产环境查询数据
- 使用查询模板从生产环境获取源数据
- 记录源数据的 `uuid`、`org_id`、执行时间等关键信息

**Step 2**: 确认写入参数
- 询问用户：目标 `org_id`（必填）
- 询问用户：执行时间处理方式
  - 选项A：保持原时间
  - 选项B：改为当前时间
  - 选项C：指定时间
- 等待用户明确确认

**Step 3**: 检查 ID 冲突（强制步骤）
- 在目标索引中查询是否存在相同文档ID
- 如果冲突，询问用户是否覆盖
- 等待用户明确确认

**Step 4**: 写入数据
- 转换索引名（生产→测试）
- 替换 `org_id` 和执行时间
- 使用 `_doc` API 写入数据
- 展示写入结果

**更多详细参考**：
- 查询示例：[查询接口日志示例](./examples/query-interface-log.md)
- 造数据示例：[从生产写入测试环境](./examples/write-test-data.md)

## 【环境配置】

### Kibana 地址映射

| 环境 | Kibana 地址 | 环境标识 | 权限 |
|------|------------|---------|------|
| 阿里生产 | `kibana.ali-prod.blacklake.tech` | `v3master` | 仅查询 |
| 华为生产 | `kibana.hwyx-prod.blacklake.tech` | `hwv3master` | 仅查询 |
| 国泰生产 | `kibana-ops.guotai.blacklake.tech` | `v3master` | 仅查询 |
| Feature | `kibana.ali-test.blacklake.tech` | `v3feature` | 查询+写入+删除 |
| Test | `kibana.ali-test.blacklake.tech` | `v3test` | 查询+写入+删除 |

> **⚠️ 严令禁止**：生产环境（阿里生产、华为生产、国泰生产）**绝对禁止**任何写入和删除操作，仅支持查询！

### 索引命名规则

| 类型 | 索引模式 | env 出现次数 | 说明 |
|------|---------|-------------|------|
| 接口日志 | `http-access-log-{env}-openapi-domain-{env}-*` | 2次 | 包含 `openapi-domain`，env 出现两次 |
| 事件日志 | `event-retry-log-{env}-openapi-domain-{env}-*` | 2次 | 包含 `openapi-domain`，env 出现两次 |
| 外部接口日志 | `external-access-log-{env}-*` | 1次 | env 只出现一次 |
| 中间表接口日志 | `mybatis-sql-log-{env}-integration-*` | 1次 | 包含 `integration`，env 只出现一次 |

**规则**：
- `{env}` 为环境标识占位符，代表环境标识值：`v3master`、`hwv3master`、`v3feature`、`v3test`
- 环境标识在索引名中直接使用（不带减号前缀），减号只是索引名中的连接符
- 日期格式：`YYYY-MM-DD`，查询时使用 `*` 匹配
- **重要**：包含 `openapi-domain` 的索引（接口日志、事件日志）中 env 出现两次，转换时需要替换两处

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

**URL格式**：`http://{kibana_host}/api/console/proxy?path={path}&method={method}`

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

**参数说明**：
- `{kibana_host}`：Kibana 地址，参考【环境配置】
- `{index_pattern}`：索引模式，参考【索引命名规则】
- `size`：返回记录数

### 根据 uuid 查询

```bash
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 10,
  "query": {
    "term": { "uuid.keyword": "{uuid}" }
  }
}'
```

**参数说明**：
- `{kibana_host}`：Kibana 地址，参考【环境配置】
- `{index_pattern}`：索引模式，参考【索引命名规则】
- `{uuid}`：文档的 uuid
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
--data '{data}'
```

**参数说明**：
- `{index}`：完整索引名（包含日期），如 `http-access-log-v3feature-openapi-domain-v3feature-2025-12-30`
- `{id}`：文档的 `_id`，从查询结果中获取
- `{data}`：JSON 格式的完整文档数据（从查询结果的 _source 字段复制，根据步骤2的决策修改 orgId 和执行时间字段）

**注意**：Kibana 地址固定为 `kibana.ali-test.blacklake.tech`，仅限 Feature 和 Test 环境使用。

### 更新执行时间模板

```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={index}/_update/{id}&method=POST' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "doc": {
    "{time_field}": {timestamp}
  }
}'
```

**参数说明**：
- `{time_field}`：执行时间字段名
  - 接口/事件/外部接口日志：`send_at`
  - 中间表日志：`@timestamp`
- `{timestamp}`：13 位毫秒级时间戳

**重要**：必须使用 `POST _update` API 进行部分更新，**不要使用 PUT**。使用 PUT 容易误改其他字段。

### ID 冲突检查模板

```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={index_pattern}/_search&method=GET' \
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
- `{index_pattern}`：使用通配符模式，如 `http-access-log-v3feature-openapi-domain-v3feature-*`
- `{document_id}`：要检查的文档 ID

**返回结果解释**：
- `hits.total.value` 为 0：文档不存在
- `hits.total.value` > 0：文档已存在
  - `hits.hits[0]._source`：现有文档的完整数据
  - `hits.hits[0]._index`：现有文档所在的索引

## 【删除操作】

**⚠️ 严令禁止**：**绝对禁止**对生产环境进行任何删除操作！

- ✅ **允许删除**：仅限 Feature 和 Test 环境
- ❌ **禁止删除**：所有生产环境（包含 `v3master`、`hwv3master` 的索引）

### 删除模板

```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={index}/_doc/{id}&method=DELETE' \
--header 'kbn-xsrf: true'
```

**参数说明**：
- `{index}`：完整索引名（包含日期），如 `http-access-log-v3feature-openapi-domain-v3feature-2025-12-30`
- `{id}`：文档的 `_id`，从查询结果中获取

**注意**：Kibana 地址固定为 `kibana.ali-test.blacklake.tech`，仅限 Feature 和 Test 环境使用。

### 删除工作流程

**⚠️ 强制执行规则**：必须按顺序完成所有步骤，不得跳过。

#### 步骤 1：查询目标数据

使用查询模板获取要删除的数据，展示：
- `_id`：文档 ID
- `_source`：文档内容（关键字段）
- `_index`：索引名

#### 步骤 2：确认索引环境

**⚠️ 强制检查**：删除前必须验证索引名不包含生产环境标识。

- ✅ **允许删除**：索引名包含 `v3feature` 或 `v3test`
- ❌ **禁止删除**：索引名包含 `v3master` 或 `hwv3master`

如果检测到生产环境索引，**立即停止**并提示用户。

#### 步骤 3：等待用户明确确认

**⚠️ 强制步骤**：必须等待用户明确回复确认后才能执行删除。

**确认方式**：
- 展示要删除的数据信息（索引名、文档ID、关键字段）
- 明确提示删除操作不可恢复
- 等待用户明确回复确认（如"确认删除"、"是的，删除"、"删除"等）
- 如果用户未明确确认或取消，**停止执行**

**示例对话**：
```
要删除的数据：
- 索引：http-access-log-v3feature-openapi-domain-v3feature-2025-12-30
- 文档ID：test-doc-id-12345
- orgId: 123456
- uuid: test-uuid-12345

⚠️ 警告：删除操作不可恢复！

请确认是否删除？回复"确认删除"以继续。
```

#### 步骤 4：执行删除操作

**前置条件检查**：
- [ ] 已确认目标索引不包含生产环境标识（`v3master`、`hwv3master`）
- [ ] 已查询到目标数据
- [ ] 已获得用户明确确认删除

**执行删除**：
- 使用删除模板执行删除操作
- 检查返回结果，确认删除成功

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
- 原索引: http-access-log-v3master-openapi-domain-v3master-2025-12-30

请确认：
1. 目标 orgId？
2. 执行时间？
   a) 保持原时间 (2025-12-30 10:30:00)
   b) 改为当前时间
   c) 指定时间（可提供时间戳、ISO格式、北京时间等）
```

### 步骤 3：检查 ID 冲突

**⚠️ 强制步骤**：写入前必须检查目标索引模式中是否已存在相同文档ID的数据。

**检查命令**：
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
- 将 `{env}` 替换为目标环境标识（`v3feature`、`v3test`）
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

**索引转换和数据修改**：参考【数据转换规则】章节

**索引名转换规则**：
- 根据步骤2的时间处理方式决定索引日期
- 环境转换：
  - **包含 `openapi-domain` 的索引**（接口日志、事件日志）：需要替换两处 env
    - 例如：`http-access-log-v3master-openapi-domain-v3master-2025-12-30` → `http-access-log-v3feature-openapi-domain-v3feature-2025-12-30`
  - **包含 `integration` 的索引**（中间表接口日志）或**外部接口日志**：只需要替换一处 env
    - 例如：`mybatis-sql-log-v3master-integration-2026-01-02` → `mybatis-sql-log-v3feature-integration-2026-01-02`
    - 例如：`external-access-log-v3master-2025-12-02` → `external-access-log-v3feature-2025-12-02`

**字段修改**：
- 修改 orgId 相关字段为目标 orgId
- 根据步骤2的决策修改执行时间字段

**写入命令**：
```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={index}/_doc/{id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{data}'
```

**数据准备**：
- 从步骤1查询结果的 `_source` 字段复制完整数据
- 根据步骤2的决策修改 orgId 和执行时间字段
- 确保 JSON 格式正确

## 【修改已写入数据的执行时间】

用户可能在数据写入后，需要修改执行时间以触发 1 分钟内的轮询通知。

**重要**：必须使用 `POST _update` API 进行部分更新，**不要使用 PUT**。

**为什么使用 UPDATE 而不是 PUT**：
- ✅ **UPDATE**：只更新指定字段，其他字段保持不变，安全可靠
- ❌ **PUT**：需要提供完整文档数据，容易误改其他字段，导致数据不完整或错误

**更新命令**：
```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path={index}/_update/{id}&method=POST' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "doc": {
    "{time_field}": {timestamp}
  }
}'
```

**时间字段**：
- 接口/事件/外部接口日志：修改 `send_at` 字段
- 中间表接口日志：修改 `@timestamp` 字段

**时间格式**：
- 支持多种时间格式输入（时间戳、ISO格式、北京时间等），AI自动转换为13位时间戳
- 获取当前时间戳：`echo $(($(date +%s) * 1000))`

**注意**：修改执行时间时，索引名也需要相应更新（索引日期从新的时间戳提取）。

**索引名更新规则**：
- 根据索引类型决定 env 替换次数：
  - **包含 `openapi-domain` 的索引**（接口日志、事件日志）：索引名中 env 出现两次，日期部分需要更新
    - 例如：`http-access-log-v3feature-openapi-domain-v3feature-2025-12-30` → `http-access-log-v3feature-openapi-domain-v3feature-2026-01-05`
  - **包含 `integration` 的索引**（中间表接口日志）或**外部接口日志**：索引名中 env 只出现一次，日期部分需要更新
    - 例如：`mybatis-sql-log-v3feature-integration-2026-01-02` → `mybatis-sql-log-v3feature-integration-2026-01-05`

## 【数据转换规则】

### 索引名转换

**环境转换规则**：

对于包含 `openapi-domain` 的索引（接口日志、事件日志）：
- env 出现两次，需要替换两处
- 阿里生产 → Feature：两处 `v3master` → `v3feature`
- 阿里生产 → Test：两处 `v3master` → `v3test`
- 华为生产 → Feature：两处 `hwv3master` → `v3feature`
- 华为生产 → Test：两处 `hwv3master` → `v3test`

对于包含 `integration` 的索引（中间表接口日志）或外部接口日志：
- env 只出现一次，只需要替换一处
- 阿里生产 → Feature：`v3master` → `v3feature`
- 阿里生产 → Test：`v3master` → `v3test`
- 华为生产 → Feature：`hwv3master` → `v3feature`
- 华为生产 → Test：`hwv3master` → `v3test`

**日期转换**：
- 从时间戳提取日期：将 13 位时间戳转换为北京时间，提取 `YYYY-MM-DD` 格式
- 示例：`1735552200000` → `2025-12-30`

**完整示例**：

接口日志（env 出现两次）：
- 原索引：`http-access-log-v3master-openapi-domain-v3master-2025-12-30`
- 转换后（Feature，保持日期）：`http-access-log-v3feature-openapi-domain-v3feature-2025-12-30`
- 转换后（Feature，改为 2026-01-05）：`http-access-log-v3feature-openapi-domain-v3feature-2026-01-05`

事件日志（env 出现两次）：
- 原索引：`event-retry-log-v3master-openapi-domain-v3master-2025-12-09`
- 转换后（Feature，保持日期）：`event-retry-log-v3feature-openapi-domain-v3feature-2025-12-09`

中间表接口日志（env 只出现一次）：
- 原索引：`mybatis-sql-log-v3master-integration-2026-01-02`
- 转换后（Feature，保持日期）：`mybatis-sql-log-v3feature-integration-2026-01-02`

外部接口日志（env 只出现一次）：
- 原索引：`external-access-log-v3master-2025-12-02`
- 转换后（Feature，保持日期）：`external-access-log-v3feature-2025-12-02`

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
- 原索引：`http-access-log-v3master-openapi-domain-v3master-2025-12-30`
- 原时间：`1735552200000` (2025-12-30 10:30:00)

修改为当前时间（2026-01-05 14:20:00）：
- 新索引：`http-access-log-v3feature-openapi-domain-v3feature-2026-01-05`
- 新时间：`1736061600000` (2026-01-05 14:20:00)
- 修改字段：`send_at` 或 `@timestamp`

## 【技术约束】

### 环境限制

| 环境 | Kibana 地址 | 支持的HTTP方法 |
|------|------------|---------------|
| 阿里生产 | `kibana.ali-prod.blacklake.tech` | GET |
| 华为生产 | `kibana.hwyx-prod.blacklake.tech` | GET |
| 国泰生产 | `kibana-ops.guotai.blacklake.tech` | GET |
| Feature | `kibana.ali-test.blacklake.tech` | GET, PUT, POST, DELETE |
| Test | `kibana.ali-test.blacklake.tech` | GET, PUT, POST, DELETE |

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

**删除操作（DELETE）**：
- 仅测试环境支持（Feature, Test）
- 必须使用完整索引名
- 必须提供文档 ID
- 删除前必须获得用户明确确认

## 【注意事项】

1. **工作流程**：
   - 必须按顺序执行步骤 1 → 步骤 2 → 步骤 3 → 步骤 4，不得跳过
   - 步骤 3（ID 冲突检查）是强制步骤，未执行视为严重错误

2. **数据完整性**：
   - 写入时确保包含所有必要字段
   - 只修改 orgId 和执行时间字段（根据步骤2决策），其他字段保持不变
   - 保留原始 `_id` 以便追溯数据来源

3. **删除操作**：
   - 删除操作不可恢复，必须谨慎执行
   - 删除前必须确认索引不包含生产环境标识（`v3master`、`hwv3master`）
   - 必须等待用户明确确认（如"确认删除"）后才能执行删除
   - 删除前展示要删除的数据信息，让用户了解删除内容
