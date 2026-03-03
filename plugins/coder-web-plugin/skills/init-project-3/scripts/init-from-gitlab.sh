#!/bin/bash
# 从 GitLab 克隆项目模板（简化版）

set -e

# 参数解析
TEMPLATE=""
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --template) TEMPLATE="$2"; shift 2 ;;
    --target-dir) TARGET_DIR="$2"; shift 2 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

# 验证参数
if [[ -z "$TEMPLATE" ]] || [[ -z "$TARGET_DIR" ]]; then
  echo "用法: $0 --template <模板> --target-dir <目录>"
  exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 读取模板配置
GITLAB_URL=$(node -e "
  const config = require('$SCRIPT_DIR/templates.json');
  const tpl = config.templates['$TEMPLATE'];
  if (!tpl) {
    console.error('模板不存在: $TEMPLATE');
    console.error('可用模板:', Object.keys(config.templates).join(', '));
    process.exit(1);
  }
  if (tpl.status === 'coming-soon') {
    console.error('模板 $TEMPLATE 即将推出，暂不可用');
    process.exit(1);
  }
  console.log(tpl.gitlab_url);
" 2>&1)

if [[ $? -ne 0 ]]; then
  echo "$GITLAB_URL"
  exit 1
fi

echo "📦 克隆模板: $TEMPLATE"
echo "   仓库: $GITLAB_URL"

# 检查目标目录
if [[ -d "$TARGET_DIR" && "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
  echo "⚠️  目标目录已存在且不为空: $TARGET_DIR"
  exit 1
fi

# 克隆项目（浅克隆）
TEMP_DIR="temp-$(date +%s)"
echo "🔄 正在克隆..."

if ! git clone --depth 1 "$GITLAB_URL" "$TEMP_DIR" 2>&1; then
  echo "❌ 克隆失败"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# 移动到目标目录
mkdir -p "$TARGET_DIR"
mv "$TEMP_DIR"/* "$TEMP_DIR"/.[!.]* "$TARGET_DIR"/ 2>/dev/null || true
rm -rf "$TEMP_DIR"

# 清理 Git 历史
cd "$TARGET_DIR"
rm -rf .git
git init --quiet
git add .
git commit -m "feat: 初始化项目" --quiet

echo "✅ 克隆完成: $TARGET_DIR"
