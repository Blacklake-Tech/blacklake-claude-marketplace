#!/bin/bash
# 验证项目结构和完整性

set -e

PROJECT_DIR="$1"

if [[ -z "$PROJECT_DIR" ]]; then
  echo "错误: 缺少项目目录参数"
  exit 1
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "错误: 项目目录不存在: $PROJECT_DIR"
  exit 1
fi

echo "🔍 验证项目: $PROJECT_DIR"

# 验证关键文件
REQUIRED_FILES=(
  "package.json"
  "tsconfig.json"
  "src/Metadata.ts"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$PROJECT_DIR/$file" ]]; then
    MISSING_FILES+=("$file")
  fi
done

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
  echo "❌ 缺少必需文件:"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  exit 1
fi

echo "✅ 关键文件完整"

# 检查 node_modules
if [[ -d "$PROJECT_DIR/node_modules" ]]; then
  echo "✅ 依赖已安装"
else
  echo "⚠️  依赖未安装，请运行: npm install"
fi

# TypeScript 编译检查（可选）
cd "$PROJECT_DIR"

if command -v npx &> /dev/null; then
  if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo "⚠️  TypeScript 编译检查发现问题（非致命）"
  else
    echo "✅ TypeScript 类型验证通过"
  fi
else
  echo "⚠️  未安装 npx，跳过 TypeScript 验证"
fi

echo ""
echo "✅ 项目验证完成"
