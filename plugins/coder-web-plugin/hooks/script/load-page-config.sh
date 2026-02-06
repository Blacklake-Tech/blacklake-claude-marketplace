#!/bin/bash
# load-page-config.sh
# 新会话加载页面配置

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

METADATA_FILE="$CLAUDE_PROJECT_DIR/src/Metadata.ts"
PAGES_DIR="$CLAUDE_PROJECT_DIR/src/pages"

echo "[Config] 加载项目信息..."

if [ -f "$METADATA_FILE" ]; then
    obj_code=$(grep -oE 'DEFAULT_OBJECT_CODE.*=.*["'"'"'][^"'"'"']+["'"'"']' "$METADATA_FILE" 2>/dev/null | head -1)
    field_count=$(grep -c '"fieldCode"' "$METADATA_FILE" 2>/dev/null || echo "0")
    echo "[Config] 对象: ${obj_code#*=}, 字段: $field_count"
fi

if [ -d "$PAGES_DIR" ]; then
    page_count=$(find "$PAGES_DIR" -name "*.tsx" 2>/dev/null | wc -l)
    echo "[Config] 页面: $page_count"
fi

echo "[Config] 准备就绪"
exit 0
