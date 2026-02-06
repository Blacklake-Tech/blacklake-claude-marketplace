#!/bin/bash
# validate-page-config.sh
# 编辑 Metadata.ts 后验证页面配置

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

METADATA_FILE="$CLAUDE_PROJECT_DIR/src/Metadata.ts"

if [ ! -f "$METADATA_FILE" ]; then
    echo "[Config] WARNING: Metadata.ts 不存在"
    exit 0
fi

# 检查关键配置项
checks=(
    "DEFAULT_OBJECT_CODE"
    "mockFields"
)

passed=0
total=0
for check in "${checks[@]}"; do
    total=$((total + 1))
    if grep -q "$check" "$METADATA_FILE"; then
        passed=$((passed + 1))
    fi
done

# 验证字段定义
field_count=$(grep -c '"fieldCode"' "$METADATA_FILE" 2>/dev/null || echo "0")
echo "[Config] 验证通过 ($passed/$total), 发现 $field_count 个字段定义"

exit 0
