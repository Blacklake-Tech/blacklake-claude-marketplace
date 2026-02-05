#!/bin/bash
#
# 解析 Jaeger URL 并提取关键信息
# 用法: ./parse_jaeger_url.sh <jaeger_url>
#

set -e

INPUT_URL="$1"

if [ -z "$INPUT_URL" ]; then
    echo "错误: 请提供 Jaeger URL" >&2
    echo "用法: $0 <jaeger_url>" >&2
    exit 1
fi

# 提取 traceID - 支持多种格式
# 格式1: /trace/<trace_id>
# 格式2: trace/<trace_id>
TRACE_ID=$(echo "$INPUT_URL" | grep -oE 'trace/[a-f0-9]{32}' | cut -d'/' -f2)

if [ -z "$TRACE_ID" ]; then
    # 尝试从 URL 路径中提取 32 位十六进制字符串
    TRACE_ID=$(echo "$INPUT_URL" | grep -oE '[a-f0-9]{32}' | head -n 1)
fi

# 提取 uiFind 参数
UI_FIND=$(echo "$INPUT_URL" | grep -oE 'uiFind=[a-f0-9]{32}' | cut -d'=' -f2)

if [ -z "$UI_FIND" ]; then
    UI_FIND="$TRACE_ID"
fi

# 确定环境
JAEGER_BASE_URL=""
ENV_NAME=""

if [[ "$INPUT_URL" == *"ali-prod"* ]] || [[ "$INPUT_URL" == *"jaeger.ali-prod"* ]]; then
    JAEGER_BASE_URL="http://jaeger.ali-prod.blacklake.tech"
    ENV_NAME="ali-prod"
elif [[ "$INPUT_URL" == *"hwyx-prod"* ]] || [[ "$INPUT_URL" == *"hw"* ]]; then
    JAEGER_BASE_URL="http://jaeger.hwyx-prod.blacklake.tech"
    ENV_NAME="hwyx-prod"
elif [[ "$INPUT_URL" == *"guotai"* ]] || [[ "$INPUT_URL" == *"gt"* ]]; then
    JAEGER_BASE_URL="http://jaeger.guotai.blacklake.tech"
    ENV_NAME="guotai"
elif [[ "$INPUT_URL" == *"ali-test"* ]] || [[ "$INPUT_URL" == *"test"* ]]; then
    JAEGER_BASE_URL="http://jaeger.ali-test.blacklake.tech"
    ENV_NAME="ali-test"
else
    # 尝试从 URL 中提取基础地址
    JAEGER_BASE_URL=$(echo "$INPUT_URL" | sed -E 's|(https?://[^/]+).*|&|')
    ENV_NAME="unknown"
fi

# 输出 JSON 格式结果
cat << EOF
{
  "input_url": "$INPUT_URL",
  "trace_id": "$TRACE_ID",
  "ui_find": "$UI_FIND",
  "jaeger_base_url": "$JAEGER_BASE_URL",
  "env_name": "$ENV_NAME"
}
EOF
