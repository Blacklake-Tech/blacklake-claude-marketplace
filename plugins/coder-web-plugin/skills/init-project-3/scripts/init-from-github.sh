#!/bin/bash
# 从 GitHub 克隆项目模板

set -e

# 参数解析
TEMPLATE=""
TARGET_DIR=""
OBJECT_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --template) TEMPLATE="$2"; shift 2 ;;
    --target-dir) TARGET_DIR="$2"; shift 2 ;;
    --object-name) OBJECT_NAME="$2"; shift 2 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

# 验证必需参数
if [[ -z "$TEMPLATE" ]]; then
  echo "错误: 缺少 --template 参数"
  exit 1
fi

if [[ -z "$TARGET_DIR" ]]; then
  echo "错误: 缺少 --target-dir 参数"
  exit 1
fi

if [[ -z "$OBJECT_NAME" ]]; then
  echo "错误: 缺少 --object-name 参数"
  exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 读取模板配置
if [[ ! -f "$SCRIPT_DIR/templates.json" ]]; then
  echo "错误: 找不到模板配置文件 templates.json"
  exit 1
fi

# 检查 Git 是否安装
if ! command -v git &> /dev/null; then
  echo "错误: 未安装 Git，请先安装 Git"
  exit 1
fi

# 检查 Node.js 是否安装（用于解析 JSON）
if ! command -v node &> /dev/null; then
  echo "错误: 未安装 Node.js，请先安装 Node.js"
  exit 1
fi

# 读取模板配置
TEMPLATE_CONFIG=$(node -e "
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('$SCRIPT_DIR/templates.json', 'utf-8'));
  const tpl = config.templates['$TEMPLATE'];
  if (!tpl) {
    console.error('模板不存在: $TEMPLATE');
    console.error('可用模板:', Object.keys(config.templates).join(', '));
    process.exit(1);
  }
  if (tpl.status === 'coming-soon') {
    console.error('模板 $TEMPLATE 即将推出，当前暂不可用');
    process.exit(1);
  }
  console.log(JSON.stringify(tpl));
" 2>&1)

if [[ $? -ne 0 ]]; then
  echo "$TEMPLATE_CONFIG"
  exit 1
fi

GITHUB_URL=$(echo "$TEMPLATE_CONFIG" | node -e "
  const tpl = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  console.log(tpl.github_url);
")

echo "📦 克隆模板: $TEMPLATE"
echo "   仓库: $GITHUB_URL"
echo "   目标: $TARGET_DIR"

# 检查目标目录是否存在且不为空
if [[ -d "$TARGET_DIR" ]]; then
  if [[ "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
    echo "⚠️  目标目录已存在且不为空: $TARGET_DIR"
    echo "   请先清空目录或选择其他目录"
    exit 1
  fi
fi

# 创建临时目录
TEMP_DIR="temp-project-$(date +%s)"

echo "🔄 开始克隆..."
# 克隆到临时目录（浅克隆，减少下载量）
if ! git clone --depth 1 "$GITHUB_URL" "$TEMP_DIR" 2>&1; then
  echo "❌ 克隆失败，请检查网络连接或仓库地址"
  rm -rf "$TEMP_DIR"
  exit 1
fi

echo "🧹 清理 Git 历史..."
# 清理 Git 历史
cd "$TEMP_DIR"
rm -rf .git

# 重新初始化 Git 仓库
git init --quiet
git add .
git commit -m "feat: 初始化项目基于 $OBJECT_NAME" --quiet

cd ..

echo "📁 移动文件到目标目录..."
# 移动到目标目录
mkdir -p "$TARGET_DIR"

# 移动所有文件（包括隐藏文件）
if ! mv "$TEMP_DIR"/* "$TARGET_DIR"/ 2>/dev/null; then
  echo "⚠️  移动普通文件时出现警告（可能目录为空）"
fi

if ! mv "$TEMP_DIR"/.[!.]* "$TARGET_DIR"/ 2>/dev/null; then
  echo "⚠️  移动隐藏文件时出现警告（可能没有隐藏文件）"
fi

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "📦 安装依赖..."
# 安装依赖（失败不退出）
cd "$TARGET_DIR"

if command -v npm &> /dev/null; then
  if [[ -f "package.json" ]]; then
    if npm install 2>&1; then
      echo "✅ 依赖安装成功"
    else
      echo "⚠️  依赖安装失败，请稍后手动执行: cd $TARGET_DIR && npm install"
    fi
  else
    echo "⚠️  未找到 package.json，跳过依赖安装"
  fi
else
  echo "⚠️  未安装 npm，请稍后手动安装依赖: cd $TARGET_DIR && npm install"
fi

echo ""
echo "✅ 项目克隆完成: $TARGET_DIR"
