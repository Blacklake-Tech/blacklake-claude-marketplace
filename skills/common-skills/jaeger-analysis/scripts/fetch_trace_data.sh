#!/bin/bash
#
# 获取 Jaeger 追踪数据（支持大数据量优化）
# 用法: ./fetch_trace_data.sh <jaeger_base_url> <trace_id> [ui_find] [options]
#
# 选项:
#   --sparse       使用稀疏模式，只获取关键字段（推荐用于大数据量）
#   --limit-spans  限制 span 数量
#   --max-size MB  设置最大允许大小（默认 50MB）
#

set -e

JAEGER_BASE_URL="$1"
TRACE_ID="$2"
UI_FIND="${3:-$TRACE_ID}"
SPARSE_MODE=false
LIMIT_SPANS=""
MAX_SIZE_MB=50

# 解析可选参数
shift 3
while [[ $# -gt 0 ]]; do
    case $1 in
        --sparse)
            SPARSE_MODE=true
            shift
            ;;
        --limit-spans)
            LIMIT_SPANS="$2"
            shift 2
            ;;
        --max-size)
            MAX_SIZE_MB="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

if [ -z "$JAEGER_BASE_URL" ] || [ -z "$TRACE_ID" ]; then
    echo "错误: 参数不足" >&2
    echo "用法: $0 <jaeger_base_url> <trace_id> [ui_find] [--sparse] [--limit-spans N] [--max-size MB]" >&2
    exit 1
fi

# 检查依赖命令
for cmd in curl jq; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "错误: 未找到命令 '$cmd'，请先安装" >&2
        exit 1
    fi
done

# 构建 API URL
API_URL="${JAEGER_BASE_URL}/api/traces/${TRACE_ID}"
if [ -n "$UI_FIND" ]; then
    API_URL="${API_URL}?uiFind=${UI_FIND}"
fi

echo "正在获取追踪数据: $API_URL" >&2
if [ "$SPARSE_MODE" = true ]; then
    echo "使用稀疏模式（只获取关键字段）..." >&2
fi

# 创建临时文件
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# 获取数据（带进度和大小检查）
echo "下载中..." >&2
curl -s -o "$TEMP_FILE" -w "\nHTTP_CODE: %{http_code}\nSIZE_DOWNLOAD: %{size_download}\n" "$API_URL" > "${TEMP_FILE}.meta"

# 解析响应信息
HTTP_CODE=$(grep "HTTP_CODE:" "${TEMP_FILE}.meta" | cut -d' ' -f2)
SIZE_DOWNLOAD=$(grep "SIZE_DOWNLOAD:" "${TEMP_FILE}.meta" | cut -d' ' -f2)

# 检查 HTTP 状态
if [ "$HTTP_CODE" != "200" ]; then
    echo "错误: HTTP 请求失败 (状态码: $HTTP_CODE)" >&2
    exit 1
fi

# 检查文件大小
SIZE_MB=$(echo "scale=2; $SIZE_DOWNLOAD / 1024 / 1024" | bc 2>/dev/null || echo "$((SIZE_DOWNLOAD / 1024 / 1024))")
echo "下载完成，数据大小: ${SIZE_MB}MB" >&2

if (( $(echo "$SIZE_MB > $MAX_SIZE_MB" | bc -l 2>/dev/null || echo "0") )); then
    echo "警告: 数据大小超过 ${MAX_SIZE_MB}MB 限制" >&2
    echo "建议使用 --sparse 模式或减少数据量" >&2
fi

# 验证 JSON 格式
if ! jq -e '.' "$TEMP_FILE" > /dev/null 2>&1; then
    echo "错误: 返回数据不是有效的 JSON" >&2
    exit 1
fi

# 检查是否有数据
if [ "$(jq '.data | length' "$TEMP_FILE")" -eq 0 ]; then
    echo "警告: 未找到追踪数据" >&2
fi

# 根据模式处理数据
if [ "$SPARSE_MODE" = true ]; then
    # 稀疏模式：只提取关键字段
    jq '{
        traceID: .data[0].traceID,
        spanCount: (.data[0].spans | length),
        spans: [.data[0].spans[] | {
            spanID,
            operationName,
            duration,
            startTime,
            tags: [.tags[]? | select(.key == "error" or .key == "http.status_code" or .key == "exception" or .key == "otel.status_code")],
            logs: [.logs[]? | select(.fields[]? | .key == "event" or .key == "exception")]
        }]
    }' "$TEMP_FILE"
elif [ -n "$LIMIT_SPANS" ]; then
    # 限制 span 数量
    jq --arg limit "$LIMIT_SPANS" '{
        traceID: .data[0].traceID,
        spanCount: (.data[0].spans | length),
        note: "只显示前 \($limit) 个 spans，共 \( (.data[0].spans | length) ) 个",
        spans: (.data[0].spans[:($limit | tonumber)])
    } + if (.data[0].spans | length) > ($limit | tonumber) then { hasMore: true } else {} end' "$TEMP_FILE"
else
    # 完整模式
    cat "$TEMP_FILE"
fi
