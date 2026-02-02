#!/bin/bash
# plugin-test-hook.sh - Plugin 级别的测试 hook
# 此脚本在任意 skill 执行完成后触发（Stop hook）

# 打印测试消息到 stderr（用户可见）
echo "🔌 pllllllugin hook 成功执行！" >&2

exit 0
