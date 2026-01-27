#!/bin/bash
# 测试 init-project-3 的所有脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧪 开始测试 init-project-3 脚本"
echo "========================================"

# 测试 1: 验证 templates.json 格式
echo ""
echo "📋 测试 1: 验证 templates.json 格式"
if command -v jq &> /dev/null; then
  if jq empty "$SCRIPT_DIR/templates.json" 2>/dev/null; then
    echo "✅ templates.json 格式正确"
  else
    echo "❌ templates.json 格式错误"
    exit 1
  fi
else
  echo "⚠️  未安装 jq，跳过 JSON 验证"
fi

# 测试 2: 测试 generate-metadata.js
echo ""
echo "📋 测试 2: 测试 generate-metadata.js"

# 创建测试元数据
TEST_METADATA="/tmp/test-metadata-$$.json"
cat > "$TEST_METADATA" << 'EOF'
{
  "fields": [
    {
      "id": 1001,
      "orgId": 10162960,
      "relatedObjectCode": "test_object__c",
      "fieldCode": "test_field",
      "fieldName": "测试字段",
      "fieldType": 1,
      "isRequired": 1,
      "isUnique": 0,
      "isUsed": 1,
      "isName": 1,
      "isRefer": 0,
      "referType": null,
      "choiceValues": null
    }
  ],
  "sonObjects": []
}
EOF

TEST_OUTPUT="/tmp/test-Metadata-$$.ts"

if node "$SCRIPT_DIR/generate-metadata.js" \
  --metadata-json "$TEST_METADATA" \
  --object-code "test_object__c" \
  --output "$TEST_OUTPUT" \
  --template custom-object; then
  echo "✅ generate-metadata.js 执行成功"

  # 验证生成的文件包含必需内容
  if grep -q "DEFAULT_OBJECT_CODE" "$TEST_OUTPUT" && \
     grep -q "normalizeField" "$TEST_OUTPUT" && \
     grep -q "mockFields" "$TEST_OUTPUT"; then
    echo "✅ Metadata.ts 内容正确"
  else
    echo "❌ Metadata.ts 内容不完整"
    exit 1
  fi
else
  echo "❌ generate-metadata.js 执行失败"
  exit 1
fi

# 清理测试文件
rm -f "$TEST_METADATA" "$TEST_OUTPUT"

# 测试 3: 测试 validate-project.sh
echo ""
echo "📋 测试 3: 测试 validate-project.sh"

# 创建测试项目结构
TEST_PROJECT="/tmp/test-project-$$"
mkdir -p "$TEST_PROJECT/src"
touch "$TEST_PROJECT/package.json"
touch "$TEST_PROJECT/tsconfig.json"
touch "$TEST_PROJECT/src/Metadata.ts"

if bash "$SCRIPT_DIR/validate-project.sh" "$TEST_PROJECT" > /dev/null 2>&1; then
  echo "✅ validate-project.sh 执行成功"
else
  echo "❌ validate-project.sh 执行失败"
  exit 1
fi

# 清理测试项目
rm -rf "$TEST_PROJECT"

# 测试 4: 验证脚本权限
echo ""
echo "📋 测试 4: 验证脚本权限"

if [[ -x "$SCRIPT_DIR/init-from-github.sh" ]]; then
  echo "✅ init-from-github.sh 可执行"
else
  echo "❌ init-from-github.sh 不可执行"
  exit 1
fi

if [[ -x "$SCRIPT_DIR/generate-metadata.js" ]]; then
  echo "✅ generate-metadata.js 可执行"
else
  echo "❌ generate-metadata.js 不可执行"
  exit 1
fi

if [[ -x "$SCRIPT_DIR/validate-project.sh" ]]; then
  echo "✅ validate-project.sh 可执行"
else
  echo "❌ validate-project.sh 不可执行"
  exit 1
fi

echo ""
echo "========================================"
echo "✅ 所有测试通过！"
