#!/bin/bash
# generate-page-metadata.sh
# 修改 customObject 页面后检查元数据配置

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

METADATA_FILE="$CLAUDE_PROJECT_DIR/src/Metadata.ts"

if [ -f "$METADATA_FILE" ]; then
    field_count=$(grep -c '"fieldCode"' "$METADATA_FILE" 2>/dev/null || echo "0")
    echo "[Config] Metadata.ts 定义了 $field_count 个字段"
else
    echo "[Config] WARNING: Metadata.ts 不存在"
fi

exit 0
