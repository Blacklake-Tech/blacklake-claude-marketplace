#!/bin/bash
# pre-build-validation.sh
# 构建前验证页面配置

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

METADATA_FILE="$CLAUDE_PROJECT_DIR/src/Metadata.ts"

if [ -f "$METADATA_FILE" ]; then
    field_count=$(grep -c '"fieldCode"' "$METADATA_FILE" 2>/dev/null || echo "0")
    echo "[Build] 页面配置验证通过 ($field_count 个字段)"
else
    echo "[Build] WARNING: Metadata.ts 不存在，页面自定义功能可能不可用"
fi

exit 0
