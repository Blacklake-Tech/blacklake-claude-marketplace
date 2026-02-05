#!/bin/bash
#
# 智能 Jaeger 分析脚本（自适应大小 - 非SDK版本）
# 用法: ./analyze_jaeger.sh <jaeger_url>
#
# 策略:
#   1. 先用 HEAD/Range 请求探测数据大小
#   2. 根据预估大小选择最佳分析策略
#   3. 执行分析
#

set -e

JAEGER_URL="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPARSE_THRESHOLD=500000      # > 500KB 使用稀疏模式
STREAM_THRESHOLD=10000000    # > 10MB 使用流式处理

if [ -z "$JAEGER_URL" ]; then
    echo "错误: 请提供 Jaeger URL"
    echo "用法: $0 <jaeger_url>"
    exit 1
fi

echo "=== Jaeger 智能分析 ==="
echo "URL: $JAEGER_URL"
echo ""

# 检查依赖
for cmd in curl jq; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "错误: 未找到命令 '$cmd'"
        exit 1
    fi
done

# 步骤1: 解析 URL
echo "【步骤1】解析 URL..."
PARSE_RESULT=$($SCRIPT_DIR/parse_jaeger_url.sh "$JAEGER_URL" 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$PARSE_RESULT" ]; then
    echo "错误: 无法解析 Jaeger URL"
    exit 1
fi

TRACE_ID=$(echo "$PARSE_RESULT" | jq -r '.trace_id')
JAEGER_BASE_URL=$(echo "$PARSE_RESULT" | jq -r '.jaeger_base_url')
UI_FIND=$(echo "$PARSE_RESULT" | jq -r '.ui_find // empty')

echo "  Trace ID: $TRACE_ID"
echo "  Jaeger地址: $JAEGER_BASE_URL"
[ -n "$UI_FIND" ] && echo "  UI Find: $UI_FIND"
echo ""

# 步骤2: 探测数据大小
echo "【步骤2】探测数据大小..."

API_URL="${JAEGER_BASE_URL}/api/traces/${TRACE_ID}"
[ -n "$UI_FIND" ] && API_URL="${API_URL}?uiFind=${UI_FIND}"

# 创建临时文件
SAMPLE_FILE=$(mktemp)
FULL_DATA_FILE=$(mktemp)
trap "rm -f $SAMPLE_FILE $FULL_DATA_FILE" EXIT

# 先下载数据（限制最大 10MB，防止超大文件）
echo "  正在下载数据..."
curl -s --max-time 60 --max-filesize 10000000 "$API_URL" -o "$SAMPLE_FILE" 2>/dev/null || true

if [ ! -s "$SAMPLE_FILE" ]; then
    echo "  尝试无限制下载..."
    curl -s --max-time 60 "$API_URL" -o "$SAMPLE_FILE" 2>/dev/null
fi

if [ ! -s "$SAMPLE_FILE" ]; then
    echo "错误: 无法获取数据"
    exit 1
fi

# 从样本估算总大小
SAMPLE_SIZE=$(stat -f%z "$SAMPLE_FILE" 2>/dev/null || stat -c%s "$SAMPLE_FILE" 2>/dev/null || echo "0")
SAMPLE_SPANS=$(grep -o '"spanID"' "$SAMPLE_FILE" | wc -l | tr -d ' ')

echo "  样本大小: $((SAMPLE_SIZE / 1024))KB"
echo "  样本包含 Spans: $SAMPLE_SPANS"

# 尝试获取完整数据大小（通过 Content-Length 或 JSON 结构）
echo "  正在估算完整数据大小..."
FULL_SIZE=$(curl -sI "$API_URL" 2>/dev/null | grep -i content-length | awk '{print $2}' | tr -d '\r')

if [ -n "$FULL_SIZE" ] && [ "$FULL_SIZE" -gt 0 ]; then
    ESTIMATED_SIZE=$FULL_SIZE
    echo "  完整数据大小: $((ESTIMATED_SIZE / 1024))KB (来自 Content-Length)"
else
    # 通过样本估算：如果样本被截断，按比例估算
    if [ "$SAMPLE_SIZE" -ge 500000 ]; then
        # 样本达到上限，可能数据更大
        # 尝试从样本中的 span 数量估算
        if [ "$SAMPLE_SPANS" -gt 0 ]; then
            # 假设平均每个 span 约 5KB，估算总数
            ESTIMATED_SIZE=$((SAMPLE_SPANS * 5120))
            echo "  估算数据大小: > $((ESTIMATED_SIZE / 1024))KB (基于 span 数量估算)"
        else
            ESTIMATED_SIZE=1000000  # 默认假设 1MB
            echo "  估算数据大小: 未知 (假设 > 1MB)"
        fi
    else
        # 样本就是完整数据
        ESTIMATED_SIZE=$SAMPLE_SIZE
        echo "  完整数据大小: $((ESTIMATED_SIZE / 1024))KB (样本即完整数据)"
    fi
fi

echo ""

# 步骤3: 根据大小选择策略并执行分析
echo "【步骤3】选择分析策略..."

if [ "$ESTIMATED_SIZE" -gt "$STREAM_THRESHOLD" ]; then
    # 策略A: 超大文件 (> 10MB) - 流式分析
    echo "  策略: 流式分析 (数据 > 10MB)"
    echo "  原因: 数据量很大，使用流式处理节省内存"
    echo ""

    curl -s "$API_URL" | $SCRIPT_DIR/analyze_errors_stream.sh

elif [ "$ESTIMATED_SIZE" -gt "$SPARSE_THRESHOLD" ]; then
    # 策略B: 大文件 (500KB - 10MB) - 稀疏模式
    echo "  策略: 稀疏模式 (数据 $((SPARSE_THRESHOLD/1024))KB - $((STREAM_THRESHOLD/1024))KB)"
    echo "  原因: 数据较大，只保留关键字段"
    echo ""

    $SCRIPT_DIR/fetch_trace_data.sh "$JAEGER_BASE_URL" "$TRACE_ID" --sparse | \
        $SCRIPT_DIR/analyze_errors.sh

else
    # 策略C: 小文件 (< 500KB) - 完整分析
    echo "  策略: 完整分析 (数据 < $((SPARSE_THRESHOLD/1024))KB)"
    echo "  原因: 数据量小，可以完整分析"
    echo ""

    # 如果样本就是完整数据，直接用样本
    if [ "$SAMPLE_SIZE" -lt 500000 ]; then
        cat "$SAMPLE_FILE" | $SCRIPT_DIR/analyze_errors.sh
    else
        # 否则重新获取完整数据
        $SCRIPT_DIR/fetch_trace_data.sh "$JAEGER_BASE_URL" "$TRACE_ID" | \
            $SCRIPT_DIR/analyze_errors.sh
    fi
fi

echo ""
echo "=== 分析完成 ==="
