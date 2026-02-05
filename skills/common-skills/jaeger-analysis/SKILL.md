---
name: jaeger-analysis
description:
    当用户提问包含以下内容时，触发此 SKILL：
    - "jaeger分析"
    - "帮我分析一下这个jaeger"

    触发词：jaeger分析，jaeger
---

# Jaeger 分布式追踪异常分析

请分析这个jaeger $ARGUMENTS.

## 分析方法

### 1. 获取数据（智能探测）

使用脚本自动探测数据大小并选择最佳策略：

```bash
cd ~/.claude/skills/jaeger-analysis
./scripts/analyze_jaeger.sh "$JAEGER_URL"
```

**探测-决策流程：**
```
下载前 500KB 样本 → 估算完整大小 → 选择策略
    │
    ├─ > 10MB ──► 流式分析（低内存）
    ├─ 500KB-10MB ──► 稀疏模式（关键字段）
    └─ < 500KB ──► 完整分析（最详细）
```

### 2. 手动分析（如需定制）

```bash
# 解析 URL
PARSE_RESULT=$(./scripts/parse_jaeger_url.sh "$JAEGER_URL")
TRACE_ID=$(echo "$PARSE_RESULT" | jq -r '.trace_id')
JAEGER_BASE_URL=$(echo "$PARSE_RESULT" | jq -r '.jaeger_base_url')

# 获取并分析
./scripts/fetch_trace_data.sh "$JAEGER_BASE_URL" "$TRACE_ID" | ./scripts/analyze_errors.sh
```

## 环境信息

- **阿里生产**: http://jaeger.ali-prod.blacklake.tech
- **华为生产**: http://jaeger.hwyx-prod.blacklake.tech
- **国泰环境**: http://jaeger.guotai.blacklake.tech
- **阿里测试**: http://jaeger.ali-test.blacklake.tech

## 分析步骤

### 步骤 1: 定位错误信息

执行以下命令系统性地查找错误：

```bash
# 1. 查找 error=true 标记的 span
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID" | jq '.. | objects | select(has("tags")) | .tags[]? | select(.key == "error" and .value == true)'

# 2. 查找异常堆栈
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID" | jq '.. | .value? | select(. and (. as $str | tostring | test("(?i)(exception|error|stacktrace)")))'

# 3. 查找 OTEL 错误状态
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID" | jq '.. | objects | select(has("tags")) | .tags[]? | select(.key == "otel.status_code" and .value == "ERROR")'
```

### 步骤 2: 分析调用链路

```bash
# 获取调用拓扑（按时间排序）
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID" | jq '.data[0].spans[] | {spanID, operationName, duration, startTime}' | sort_by(.startTime)

# 找出最慢的 spans
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID" | jq '.data[0].spans | sort_by(.duration) | reverse | .[:10] | .[] | "\(.duration/1000)ms - \(.operationName)"'
```

### 步骤 3: 提取错误位置

```bash
# 提取堆栈中的类名和方法名
STACKTRACE=$(curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID" | jq -r '.. | .value? | select(. and (. as $str | tostring | startswith("java.lang.")))' | head -1)
echo "$STACKTRACE" | sed 's/\\n/\n/g' | grep -E "\bat\b" | head -5
```

## 常见错误模式

| 错误类型 | 特征 | 根本原因 |
|---------|------|----------|
| `Communications link failure` | 数据库连接超时 | 网络不稳定、查询性能差、连接池配置不当 |
| `NullPointerException` | 空指针异常 | 对象未初始化、方法返回 null |
| `TimeoutException` | 超时异常 | 服务响应慢、网络延迟 |
| `CircuitBreakerOpenException` | 熔断器打开 | 服务故障率过高 |

详细模式参考：[error-patterns.md](./references/error-patterns.md)

## 脚本参考

| 脚本 | 用途 | 示例 |
|------|------|------|
| `analyze_jaeger.sh` | 智能分析（推荐） | `./analyze_jaeger.sh "<url>"` |
| `fetch_trace_data.sh` | 获取数据 | `./fetch_trace_data.sh <base_url> <trace_id> [--sparse]` |
| `analyze_errors.sh` | 完整分析 | `cat data.json \| ./analyze_errors.sh` |
| `analyze_errors_stream.sh` | 流式分析 | `cat large.json \| ./analyze_errors_stream.sh` |
| `parse_jaeger_url.sh` | 解析 URL | `./parse_jaeger_url.sh "<url>"` |

## 分析准则

1. **先探测，再决策**：始终先估算数据大小，选择合适策略
2. **系统性分析**：从外到内、从整体到局部
3. **优先检查**：error=true 标签和 otel.status_code=ERROR
4. **上下文理解**：结合业务场景理解错误影响
5. **模式识别**：利用常见错误模式加速诊断
