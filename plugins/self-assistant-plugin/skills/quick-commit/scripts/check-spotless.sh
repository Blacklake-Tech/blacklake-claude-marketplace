#!/bin/bash
# check-spotless.sh - 检测并执行 Maven Spotless 格式化
# 此脚本在 quick-commit skill 执行前触发（UserPromptSubmit hook）

# 检测 spotless 插件是否可用
if [ -f "pom.xml" ] && grep -q "spotless-maven-plugin" pom.xml 2>/dev/null && command -v mvn &> /dev/null; then
  echo "🔧 检测到 Maven Spotless，正在格式化代码..." >&2
  
  # 执行格式化，将输出重定向到 stderr
  if mvn spotless:apply 2>&1 >&2; then
    echo "✅ Spotless 格式化完成" >&2
    exit 0
  else
    echo "⚠️ Spotless 格式化失败，继续执行" >&2
    exit 0  # 不阻止 skill 执行
  fi
else
  # 未检测到 spotless，静默跳过
  exit 0
fi
