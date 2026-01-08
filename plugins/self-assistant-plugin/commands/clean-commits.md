---
description: 清理 git 历史中的重复和无意义提交
allowed-tools: Bash(git *), TodoWrite
---

## Context

- Recent commits: !`git log --oneline -30 --format="%h|%s|%ad" --date=format:'%Y-%m-%d'`
- Current branch: !`git branch --show-current`
- Existing backup branches: !`git branch | grep 'back/rebase-'`

## Your task

分析最近 30 个提交，识别并合并重复提交。创建 TodoList 跟踪进度。

### 识别以下模式的重复提交

1. **完全相同的提交信息** - 如多个"更新"、"清理"、"Update submodule"
2. **仅数字不同** - 如"修改1"、"修改2"、"修改3"
3. **无意义提交** - 如"1"、"2"、"3"、"test"、"wip"、"tmp"

### 执行要求

1. 分析并分组重复提交，输出每组的提交列表
2. 如不存在 `back/rebase-$(date +%Y%m%d)` 备份分支则创建
3. 从最老的提交组开始依次合并（使用 `git rebase -i`）
4. 每组合并时添加 `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
5. 验证结果并输出完整统计报告

### 输出格式

合并完成后提供：
```
✅ Git 提交历史清理完成！

执行结果：
- 合并前提交数：X
- 合并后提交数：Y
- 减少提交数：Z

合并详情：
1. 组1 "提交信息" (N→1)
2. 组2 "提交信息" (N→1)

备份分支：back/rebase-YYYYMMDD

下一步操作：
推送时使用：git push --force-with-lease
回滚使用：git reset --hard back/rebase-YYYYMMDD
```

**注意**：保持时间顺序不变，始终创建备份，验证每次合并结果。
