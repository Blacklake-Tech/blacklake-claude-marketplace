#!/bin/bash
#
# 分析 Jaeger 追踪数据中的错误
# 用法: ./analyze_errors.sh <trace_data.json>
#

set -e

TRACE_DATA="$1"

if [ -z "$TRACE_DATA" ]; then
    # 从标准输入读取
    TRACE_DATA=$(cat)
fi

if [ -z "$TRACE_DATA" ]; then
    echo "错误: 未提供追踪数据" >&2
    echo "用法: $0 '<trace_data>' 或 echo '<trace_data>' | $0" >&2
    exit 1
fi

# 检查 jq
if ! command -v jq &> /dev/null; then
    echo "错误: 未找到命令 'jq'，请先安装" >&2
    exit 1
fi

echo "=== Jaeger 追踪错误分析报告 ==="
echo ""

# 1. 查找所有标记为 error 的 span
echo "【1. 错误标记的 Span】"
echo "$TRACE_DATA" | jq -r '
  .. | objects |
  select(has("tags")) |
  .tags[]? |
  select(.key == "error" and .value == true) |
  "  - 错误标记: \(.value)"
' 2>/dev/null || echo "  无错误标记的 span"

echo ""

# 2. 查找 otel.status_code 为 ERROR 的 span
echo "【2. OpenTelemetry 错误状态】"
echo "$TRACE_DATA" | jq -r '
  .. | objects |
  select(has("tags")) |
  .tags[]? |
  select(.key == "otel.status_code" and .value == "ERROR") |
  "  - 状态: \(.value)"
' 2>/dev/null || echo "  无 OpenTelemetry 错误状态"

echo ""

# 3. 查找根因错误（优先查找数据库/连接错误）
echo "【3. 根因错误分析】"

# 从 logs.fields 中提取异常信息（OpenTelemetry 格式）
EXCEPTION_INFO=$(echo "$TRACE_DATA" | jq -r '
  .data[0].spans[]? |
  select(.logs | length > 0) |
  select([
    .logs[].fields[] |
    select(.key == "exception.message" or .key == "exception.stacktrace")
  ] | length > 0) |
  {
    spanID: .spanID,
    operationName: .operationName,
    message: ([.logs[].fields[] | select(.key == "exception.message") | .value] | add // ""),
    type: ([.logs[].fields[] | select(.key == "exception.type") | .value] | add // ""),
    stacktrace: ([.logs[].fields[] | select(.key == "exception.stacktrace") | .value] | add // "")
  }
' 2>/dev/null | head -50)

# 优先查找数据库连接错误
DB_ERROR=$(echo "$EXCEPTION_INFO" | grep -i "communications link failure" | head -1)

if [ -n "$DB_ERROR" ]; then
    echo "  🔴 发现数据库连接错误（根因）："
    # 提取关键信息
    echo "$EXCEPTION_INFO" | jq -r 'select(.message | test("(?i)communications link failure")) | "    异常类型: \(.type)"' 2>/dev/null | head -1

    # 提取超时时间
    TIMEOUT_INFO=$(echo "$EXCEPTION_INFO" | jq -r '.message' 2>/dev/null | grep -oE "[0-9,]+ milliseconds?" | head -2)
    if [ -n "$TIMEOUT_INFO" ]; then
        echo "  📊 超时详情："
        echo "$TIMEOUT_INFO" | sed 's/^/    - /'
    fi

    # 提取 SQL（如果有）
    SQL=$(echo "$EXCEPTION_INFO" | jq -r '.message' 2>/dev/null | grep -oE "SQL: SELECT .+" | head -1)
    if [ -n "$SQL" ]; then
        echo "  📝 涉及 SQL："
        echo "    ${SQL:0:150}..."
    fi

    # 提取涉及的服务
    SERVICE=$(echo "$EXCEPTION_INFO" | jq -r '.message' 2>/dev/null | grep -oE "[a-z-]+-service-[0-9.]+-RELEASE" | head -1)
    if [ -n "$SERVICE" ]; then
        echo "  📦 涉及服务: $SERVICE"
    fi

    echo ""
fi

# 显示所有异常信息
echo "  异常堆栈信息："
if [ -n "$EXCEPTION_INFO" ]; then
    echo "$EXCEPTION_INFO" | jq -r '"  - [\(.spanID[:8])] \(.operationName): \(.type)"' 2>/dev/null | head -10

    # 显示第一条异常的详细信息
    FIRST_EXCEPTION=$(echo "$EXCEPTION_INFO" | jq -s '.[0]' 2>/dev/null)
    if [ -n "$FIRST_EXCEPTION" ]; then
        echo ""
        echo "  详细错误（第一条）："
        echo "$FIRST_EXCEPTION" | jq -r '.stacktrace' 2>/dev/null | head -8 | sed 's/^/    /'
    fi
else
    echo "  未发现异常堆栈信息"
fi

echo ""

# 4. 查找包含特定错误模式的日志
echo "【4. 特定错误模式检测】"
ERROR_PATTERNS="timeout|connection refused|circuit breaker|rate limit|unauthorized|forbidden|OOM|out of memory"
ERRORS=$(echo "$TRACE_DATA" | jq -r '
  .. | objects |
  select(has("logs")) |
  .logs[]?.fields[]? |
  select(.key == "event" or .key == "message" or .key == "error" or .key == "exception") |
  .value |
  select(test("'"$ERROR_PATTERNS"'"; "i"))
' 2>/dev/null | head -10)

if [ -n "$ERRORS" ]; then
    echo "$ERRORS" | while read -r line; do
        echo "  - ${line:0:200}"
    done
else
    echo "  未检测到特定错误模式"
fi

echo ""

# 5. 分析调用链路拓扑
echo "【5. 调用链路拓扑】"
echo "$TRACE_DATA" | jq -r '
  .data[0].spans? // empty |
  sort_by(.startTime) |
  .[] |
  "  Span: \(.spanID[:8])... | 操作: \(.operationName) | 耗时: \(.duration)µs"
' 2>/dev/null | head -20 || echo "  无法解析调用链路"

echo ""

# 6. 提取最可能的错误位置
echo "【6. 错误位置分析】"
STACKTRACE=$(echo "$TRACE_DATA" | jq -r '
  .. | .value? |
  select(. and (. as $str | tostring | test("^java\\.[a-z]+\\."))) |
  tostring
' 2>/dev/null | head -1)

if [ -n "$STACKTRACE" ]; then
    echo "  发现异常堆栈:"
    # 解析堆栈跟踪
    echo "$STACKTRACE" | sed 's/\\n/\n/g' | grep -E "^\s*at\s+" | head -5 | while read -r line; do
        echo "    $line"
    done

    # 提取类名和方法名
    CLASS_METHOD=$(echo "$STACKTRACE" | grep -oE '[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.[^ ]+\.[^ (]+' | head -1)
    if [ -n "$CLASS_METHOD" ]; then
        echo ""
        echo "  可能的问题位置: $CLASS_METHOD"
    fi
else
    echo "  未找到明确的错误位置"
fi

echo ""
echo "=== 分析完成 ==="
