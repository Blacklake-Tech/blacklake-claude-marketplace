#!/bin/bash
#
# 流式分析 Jaeger 追踪数据中的错误（适合大数据量）
# 用法: cat trace_data.json | ./analyze_errors_stream.sh
#
# 特点:
#   - 使用 jq 流式处理，内存占用低
#   - 支持超大文件
#   - 只处理关键字段
#

set -e

# 检查 jq
if ! command -v jq &> /dev/null; then
    echo "错误: 未找到命令 'jq'，请先安装" >&2
    exit 1
fi

echo "=== Jaeger 追踪错误分析报告（流式处理模式） ==="
echo ""

# 统计信息
echo "【0. 基本信息】"
echo '{"stream": true}' | jq -r '
    "处理模式: 流式处理"
'

# 1. 统计 span 数量
echo ""
echo "【1. Span 统计】"
jq -r '
    if .data then
        "总 Span 数量: \(.data[0].spans | length)"
    else
        "Span 数量: \(.spans | length)"
    end
' 2>/dev/null || echo "  无法统计"

# 2. 查找错误标记的 span（流式处理）
echo ""
echo "【2. 错误标记的 Span】"
jq --stream -r '
    select(length > 1) |
    . as [$path, $value] |
    select($path[-2] == "tags" and $value.key == "error" and $value.value == true) |
    "  - 发现错误标记: \($value.value)"
' 2>/dev/null | head -20 || echo "  无错误标记或处理失败"

# 3. 查找 OpenTelemetry 错误状态
echo ""
echo "【3. OpenTelemetry 错误状态】"
jq -r '
    .. | objects |
    select(has("tags")) |
    .tags[]? |
    select(.key == "otel.status_code" and .value == "ERROR") |
    "  - Span \(.key): \(.value)"
' 2>/dev/null | head -10 || echo "  未检测到 OpenTelemetry 错误状态"

# 4. 查找异常堆栈信息
echo ""
echo "【4. 异常堆栈信息（最多显示5条）】"
jq -r '
    .. | .value? |
    select(. and (. as $str | tostring | test("(?i)(exception|error|stacktrace|stack trace|at\\s+[a-zA-Z0-9_.]+\\.[a-zA-Z0-9_]+)"))) |
    tostring
' 2>/dev/null |
head -5 |
while IFS= read -r line; do
    # 截断长行
    if [ ${#line} -gt 300 ]; then
        echo "  - ${line:0:300}..."
    else
        echo "  - $line"
    fi
done

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "  未找到异常堆栈信息"
fi

# 5. 查找特定错误模式
echo ""
echo "【5. 特定错误模式检测】"
ERROR_PATTERNS="timeout|connection refused|circuit breaker|rate limit|unauthorized|forbidden|OOM|out of memory|communications link failure|deadlock"

# 使用 grep 进行模式匹配（更高效）
if grep -iE "$ERROR_PATTERNS" > /dev/null 2>&1; then
    grep -oiE "$ERROR_PATTERNS" | sort | uniq -c | sort -rn | head -10 | while read -r count pattern; do
        echo "  - 检测到 '$pattern': $count 次"
    done
else
    echo "  未检测到特定错误模式"
fi < /dev/stdin

# 6. 分析耗时最长的 spans
echo ""
echo "【6. 耗时最长的 Spans（Top 10）】"
jq -r '
    if .data then
        .data[0].spans
    else
        .spans
    end |
    sort_by(.duration) | reverse | .[:10] |
    .[] |
    "  Span: \(.spanID[:8])... | 操作: \(.operationName[:50]) | 耗时: \(.duration)µs (\(.duration/1000)ms)"
' 2>/dev/null || echo "  无法分析耗时"

# 7. 提取可能的错误位置
echo ""
echo "【7. 错误位置分析】"
STACK_INFO=$(jq -r '
    .. | .value? |
    select(. and (. as $str | tostring | test("^java\\.[a-z]+\\."))) |
    tostring
' 2>/dev/null | head -1)

if [ -n "$STACK_INFO" ]; then
    echo "  发现异常堆栈:"
    # 提取类名和方法名
    CLASS_METHOD=$(echo "$STACK_INFO" | grep -oE '[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+' | head -1)
    if [ -n "$CLASS_METHOD" ]; then
        echo "    可能的问题位置: $CLASS_METHOD"
    fi

    # 提取 SQL 相关信息
    if echo "$STACK_INFO" | grep -qi "sql\|select\|insert\|update\|delete"; then
        echo "    类型: 数据库相关错误"
    fi

    # 提取特定错误类型
    if echo "$STACK_INFO" | grep -qi "communications.*failure\|connection.*refused"; then
        echo "    类型: 连接失败 (Communications link failure)"
    fi
else
    echo "  未找到明确的错误堆栈"
fi

echo ""
echo "=== 分析完成 ==="
echo "提示: 如需更详细的分析，可以针对特定的 spanID 进一步查询"
