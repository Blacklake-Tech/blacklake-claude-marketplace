---
name: jaeger-analysis
description: 
    当用户提问包含一下内容时，触发此 SKILL：
    - "jaeger分析"
    - "帮我分析一下这个jaeger"

    触发词：jaeger分析，jaeger
---

# Jaeger 分布式追踪异常分析模板

请分析这个jaeger $ARGUMENTS.

## 0. 基本环境信息

- 阿里环境：<http://jaeger.ali-prod.blacklake.tech>
- 华为环境：<http://jaeger.hwyx-prod.blacklake.tech>
- 国泰环境：<http://jaeger.guotai.blacklake.tech>
- 测试环境：<http://jaeger.ali-test.blacklake.tech>

## 1. 环境准备与连接验证

首先确认网络连接和Jaeger服务的可访问性，根据输入URL自动匹配对应环境。

```bash
# 解析输入URL并确定环境
INPUT_URL="$ARGUMENTS"

# 提取traceID和uiFind参数
TRACE_ID=$(echo "$INPUT_URL" | grep -o 'trace/[a-f0-9]\{32\}' | cut -d'/' -f2)
UI_FIND=$(echo "$INPUT_URL" | grep -o 'uiFind=[a-f0-9]\{32\}' | cut -d'=' -f2)

# 根据域名确定环境
if [[ "$INPUT_URL" == *"ali-prod"* ]]; then
    JAEGER_BASE_URL="http://jaeger.ali-prod.blacklake.tech"
elif [[ "$INPUT_URL" == *"hwyx-prod"* ]]; then
    JAEGER_BASE_URL="http://jaeger.hwyx-prod.blacklake.tech"
elif [[ "$INPUT_URL" == *"guotai"* ]]; then
    JAEGER_BASE_URL="http://jaeger.guotai.blacklake.tech"
else
    echo "无法识别环境，请检查URL"
    exit 1
fi

# 测试基本连接
curl -v "$JAEGER_BASE_URL/"

# 使用引号包裹URL测试连接（防止shell解析问题）
curl -v "$JAEGER_BASE_URL/trace/$TRACE_ID?uiFind=$UI_FIND"
```

## 2. 获取完整追踪数据

通过Jaeger API获取完整的追踪信息：

```bash
# 获取完整的追踪数据
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.'
```

## 3. 定位错误信息

系统性查找调用链中的错误和异常，采用多层次检测策略：

```bash
# 1. 查找所有标记为error的span
echo "\n=== 错误标记的Span ==="
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.. | objects | select(has("tags")) | .tags[]? | select(.key == "error" and .value == true)'

# 2. 深度遍历查找异常堆栈信息
echo "\n=== 异常堆栈信息 ==="
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.. | .value? | select(. and (. as $str | tostring | test("(?i)(exception|error|failed|timeout)")))'

# 3. 查找otel.status_code为ERROR的span
echo "\n=== OpenTelemetry错误状态 ==="
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.. | objects | select(has("tags")) | .tags[]? | select(.key == "otel.status_code" and .value == "ERROR")'

# 4. 查找包含特定错误模式的日志
echo "\n=== 特定错误模式 ==="
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.. | objects | select(has("logs")) | .logs[].fields[]? | select(.key == "event" or .key == "message") | select(.value | test("(?i)(timeout|connection refused|circuit breaker|rate limit|unauthorized|forbidden)"))'

# 5. 分析调用链路拓扑和依赖关系
echo "\n=== 调用链路拓扑 ==="
curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.data[0].spans[] | {spanID, operationName, duration, startTime}' | sort_by(.startTime)
```

## 4. 精确定位错误行

在堆栈跟踪中精确定位到具体的代码行：

```bash
# 提取完整的异常堆栈
STACKTRACE=$(curl -s "$JAEGER_BASE_URL/api/traces/$TRACE_ID?uiFind=$UI_FIND" | jq '.. | .value? | select(. and (. as $str | tostring | startswith("java.lang.")))' | head -n 1)

if [ -n "$STACKTRACE" ]; then
    echo "\n=== 异常堆栈分析 ==="
    echo "$STACKTRACE" | sed 's/\\n/\n/g' | grep -E "\bat\b" | head -5

    # 尝试提取类名和方法名
    CLASS_METHOD=$(echo "$STACKTRACE" | grep -oE '[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.[^ ]+\.[^ (]+' | head -1)
    if [ -n "$CLASS_METHOD" ]; then
        echo "\n可能的问题位置: $CLASS_METHOD"
    fi
fi
```

## 5. 错误分析框架

### 5.1 常见错误模式识别

| 错误类型 | 特征 | 根本原因 | 解决方案 |
|---------|------|----------|----------|
| `Communications link failure` | 数据库连接超时 | 网络不稳定、查询性能差、连接池配置不当 | 优化SQL、调整连接池、添加索引 |
| `NullPointerException` | 空指针异常 | 对象未初始化、方法返回null | 添加空值检查、改进初始化逻辑 |
| `IllegalArgumentException` | 非法参数异常 | 参数值超出范围、格式不正确 | 加强参数验证、提供默认值 |
| `TimeoutException` | 超时异常 | 服务响应慢、网络延迟 | 优化性能、调整超时设置 |
| `ResourceExhaustedException` | 资源耗尽异常 | 内存不足、连接池耗尽 | 增加资源、优化资源使用 |
| `CircuitBreakerOpenException` | 熔断器打开 | 服务故障率过高 | 排查下游服务、调整熔断策略 |
| `RateLimitExceededException` | 限流触发 | 请求频率过高 | 实现重试机制、调整请求速率 |

### 5.2 分析步骤清单

- [ ] 解析输入URL并确定对应环境
- [ ] 验证Jaeger服务连接性
- [ ] 获取完整追踪数据
- [ ] 系统性扫描所有span的错误标记
- [ ] 深度遍历logs字段查找异常信息
- [ ] 分析调用链路拓扑和依赖关系
- [ ] 综合分析根本原因并提供解决方案建议

## 6. 最佳实践

1. **系统性分析**: 按照从外到内、从整体到局部的顺序进行分析
2. **全面检测**: 不仅查找显式错误标记，还要分析潜在问题指标
3. **上下文理解**: 结合业务场景理解错误的影响范围
4. **快速定位**: 优先检查关键错误指标，提高分析效率
5. **模式识别**: 利用常见错误模式加速诊断过程

## 7. 常见陷阱与规避

- **陷阱1**: 过于关注性能问题而忽略关键错误
  - **规避**: 优先检查error=true标签和otel.status_code为ERROR的span
- **陷阱2**: 忽略环境差异导致分析偏差
  - **规避**: 准确识别并匹配对应环境
- **陷阱3**: 过度依赖表面现象而未深入根本原因
  - **规避**: 结合日志、指标和追踪进行综合分析
- **陷阱4**: 缺乏标准化流程导致分析不一致
  - **规避**: 严格遵循本模板提供的分析流程

## 8. 分析准则

1. 必须系统性遍历整个追踪数据结构，确保不遗漏任何潜在问题
2. 优先检查error=true标签和otel.status_code为ERROR的span
3. 结合业务上下文理解错误的实际影响
4. 提供具体、可操作的解决方案建议
5. 区分表面现象和根本原因，避免治标不治本
6. 对复杂错误提供多层次的分析视角
7. 如果经过全面分析仍未找到明确原因，如实告知用户而非猜测
