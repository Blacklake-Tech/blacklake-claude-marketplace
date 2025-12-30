---
name: es-log
description: ES 日志查询和写入能力，支持从线上查询数据后写入 feature/test 环境进行造数据。使用 curl 命令执行查询和写入操作。
---

# ES 日志查询和写入

## 【通用规范】

参考：[通用规范](./COMMON.md)

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

### 索引命名规则

#### 支持写入的索引（feature/test 造数据）

| 类型 | 索引基础名 | 通配符模式 |
|------|-----------|-----------|
| 接口日志 | `http-access-log` | `http-access-log-{env}-*` |
| 外部接口日志 | `external-access-log` | `external-access-log-{env}-*` |
| 事件日志 | `event-retry-log` | `event-retry-log-{env}-*` |
| 中间表SQL日志 | `mybatis-sql-log` | `mybatis-sql-log-{env}-*` |

**说明**：
- `{env}` 为环境后缀：`v3master`、`hwv3master`、`v3feature`、`v3test`
- 使用通配符 `*` 匹配日期部分，避免硬编码具体日期
- 接口日志索引包含 domain 信息，如：`http-access-log-v3feature-openapi-domain-*`

#### 仅供查询的索引（排查场景）

- 阿里：`http-access-log-v3master-*`
- 华为：`http-access-log-hwv3master-*`
- 国泰：`http-access-log-v3master-*`

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
- `{index_pattern}`：使用通配符模式，如 `http-access-log-v3master-*`

### 条件查询示例

```bash
# 按时间范围查询
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 100,
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

```bash
# 按 orgId 查询
curl --location 'http://{kibana_host}/api/console/proxy?path={index_pattern}/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 10,
  "query": {
    "bool": {
      "must": [
        {"term": {"orgId": {org_id}}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

## 【写入模板】

**重要**：仅支持 feature/test 环境写入

```bash
# 写入单条数据（保留原 ID）
curl --location 'http://{kibana_host}/api/console/proxy?path={index}/_doc/{id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{...文档内容...}'
```

**参数说明**：
- `{kibana_host}`：仅限 `kibana.ali-test.blacklake.tech`
- `{index}`：完整索引名（包含日期），如 `http-access-log-v3feature-openapi-domain-2025-12-30`
- `{id}`：文档的 `_id`，从查询结果中获取
- 文档内容：从查询结果的 `_source` 字段获取

## 【造数据工作流程】

### 步骤 1：从线上查询目标数据

使用查询模板从生产环境获取数据：

```bash
# 示例：从阿里生产环境查询接口日志
curl --location 'http://kibana.ali-prod.blacklake.tech/api/console/proxy?path=http-access-log-v3master-*/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 1,
  "query": {
    "bool": {
      "must": [
        {"term": {"orgId": 123456}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

记录查询结果中的：
- `_id`：文档 ID
- `_source`：文档内容
- `_index`：原始索引名

### 步骤 2：**确认 orgId（必须）**

**⚠️ 重要：写入前必须让用户手动确认 orgId**

在写入数据前，必须：
1. 从查询结果的 `_source.orgId` 中提取 orgId
2. **明确告知用户**：即将写入的数据的 orgId 是多少
3. **要求用户确认**：这个 orgId 是否正确，是否是目标环境的 orgId
4. **等待用户明确同意**后，才能继续执行写入操作

**示例确认对话**：
```
从线上查询到的数据 orgId 为：123456
请确认：
1. 这个 orgId 是否正确？
2. 目标环境（feature/test）的 orgId 是否也是 123456？
3. 是否需要修改 orgId？

请明确回复"确认写入"后，我将执行写入操作。
```

### 步骤 3：转换索引名称

将生产环境索引名转换为目标环境索引名：

**转换规则**：
- 阿里生产 → Feature：`v3master` → `v3feature`
- 阿里生产 → Test：`v3master` → `v3test`
- 华为生产 → Feature：`hwv3master` → `v3feature`
- 华为生产 → Test：`hwv3master` → `v3test`

**示例**：
```
原始索引：http-access-log-v3master-openapi-domain-2025-12-30
目标索引（Feature）：http-access-log-v3feature-openapi-domain-2025-12-30
目标索引（Test）：http-access-log-v3test-openapi-domain-2025-12-30
```

### 步骤 4：写入数据

使用 PUT 方法写入数据，保留原始 `_id`：

```bash
# 示例：写入到 Feature 环境
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path=http-access-log-v3feature-openapi-domain-2025-12-30/_doc/{原始_id}&method=PUT' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "orgId": 123456,
  "@timestamp": "2025-12-30T10:30:00.000Z",
  "request": "/api/v1/users",
  "method": "GET",
  "status": 200,
  ...其他字段...
}'
```

### 步骤 5：验证结果

查询目标环境确认数据已写入：

```bash
# 验证写入结果
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path=http-access-log-v3feature-openapi-domain-*/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 1,
  "query": {
    "bool": {
      "must": [
        {"term": {"_id": "{原始_id}"}},
        {"term": {"orgId": 123456}}
      ]
    }
  }
}'
```

## 【完整造数据示例】

### 场景：将阿里生产的接口日志复制到 Feature 环境

#### 1. 查询线上数据

```bash
curl --location 'http://kibana.ali-prod.blacklake.tech/api/console/proxy?path=http-access-log-v3master-openapi-domain-*/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 1,
  "query": {
    "bool": {
      "must": [
        {"term": {"orgId": 123456}},
        {"term": {"request": "/api/v1/users"}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}]
}'
```

**查询结果示例**：
```json
{
  "hits": {
    "hits": [
      {
        "_index": "http-access-log-v3master-openapi-domain-2025-12-30",
        "_id": "abc123xyz",
        "_source": {
          "orgId": 123456,
          "@timestamp": "2025-12-30T10:30:00.000Z",
          "request": "/api/v1/users",
          "method": "GET",
          "status": 200,
          "responseTime": 150
        }
      }
    ]
  }
}
```

#### 2. 确认 orgId（必须）

**⚠️ 向用户确认**：
```
查询到的数据信息：
- orgId: 123456
- 索引: http-access-log-v3master-openapi-domain-2025-12-30
- 文档ID: abc123xyz

即将写入到 Feature 环境：
- 目标索引: http-access-log-v3feature-openapi-domain-2025-12-30
- orgId: 123456

请确认：
1. orgId 123456 是否正确？
2. Feature 环境的 orgId 是否也是 123456？
3. 是否需要修改数据中的 orgId？

请明确回复"确认写入"后，我将执行写入操作。
```

#### 3. 写入到 Feature 环境

**用户确认后**，执行写入：

```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path=http-access-log-v3feature-openapi-domain-2025-12-30/_doc/abc123xyz&method=PUT' \
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

#### 4. 验证写入结果

```bash
curl --location 'http://kibana.ali-test.blacklake.tech/api/console/proxy?path=http-access-log-v3feature-openapi-domain-*/_search&method=GET' \
--header 'kbn-xsrf: true' \
--header 'Content-Type: application/json' \
--data '{
  "size": 1,
  "query": {
    "bool": {
      "must": [
        {"term": {"_id": "abc123xyz"}},
        {"term": {"orgId": 123456}}
      ]
    }
  }
}'
```

**预期结果**：
- 返回刚写入的文档
- `_index` 为 `http-access-log-v3feature-openapi-domain-2025-12-30`
- `_source` 内容与写入的数据一致

## 【注意事项】

1. **权限控制**：
   - 生产环境（阿里、华为、国泰）：**仅支持查询**，禁止写入操作
   - Feature/Test 环境：支持查询和写入

2. **索引命名**：
   - 使用通配符 `*` 匹配日期部分，避免硬编码具体日期
   - 写入时必须使用完整索引名（包含具体日期）

3. **数据安全**：
   - **写入前必须确认 orgId**，避免数据混乱
   - 造数据前确认目标环境，避免误操作
   - 建议先在 Test 环境测试，确认无误后再操作 Feature 环境

4. **ID 冲突**：
   - 使用 PUT 方法写入会覆盖已存在的同 ID 文档
   - 写入前可先查询目标环境，检查 ID 是否已存在

5. **索引日期**：
   - 查询时使用通配符 `*` 可以跨日期查询
   - 写入时必须指定具体日期的索引名
   - 建议使用当天日期的索引，格式：`YYYY-MM-DD`

6. **数据完整性**：
   - 写入时确保包含所有必要字段
   - 特别注意 `@timestamp` 字段格式：ISO 8601 格式
   - 保留原始 `_id` 以便追溯数据来源
