---
description: 清理 git 历史中的重复和无意义提交（相同提交、仅数字不同、无意义如123等）
allowed-tools: ["Bash(git *)", "TodoWrite"]
---

## Context

- Recent commits: !`git log --oneline -30 --format="%h|%s|%ad" --date=format:'%Y-%m-%d'`
- Current branch: !`git branch --show-current`
- Existing backup branches: !`git branch | grep 'back/rebase-'`

## Your Task

分析最近 30 个提交，识别并合并以下类型的重复提交：

### 识别模式

1. **完全相同的提交信息**
   - 示例：多个"更新"、"Update submodule"、"清理"

2. **仅数字不同的提交**
   - 示例："修改1"、"修改2"、"修改3"
   - 示例："update 1"、"update 2"

3. **无意义的提交信息**
   - 单字符或纯数字："1"、"2"、"3"
   - 临时标记："test"、"wip"、"tmp"

### 执行流程

#### 1. 创建 TodoList

使用 TodoWrite 创建任务清单：
- 检查是否已有 back/rebase-YYYYMMDD 备份
- 为每组重复提交创建合并任务
- 添加验证任务

#### 2. 分析并分组

分析提交历史，将重复提交分组：
- 按提交信息完全匹配分组
- 按提交信息相似度分组（去除数字后相同）
- 识别无意义提交

输出示例：
```
发现 4 组重复提交：

组1: "更新" (3个提交)
- abc123 更新 (2025-12-12)
- def456 update (2025-12-11)
- ghi789 补充更新 (2025-12-08)

组2: "清理" (2个提交)
- jkl012 清理 (2025-11-07)
- mno345 清理 (2025-11-07)

组3: "Update submodule" (2个提交)
- pqr678 Update submodule (2025-12-03)
- stu901 Update submodule (2025-12-03)

组4: "submodule 改造" (2个提交)
- vwx234 submodule 改造 (2025-11-07)
- yza567 submodule 改造 (2025-11-07)
```

#### 3. 创建备份

检查今天日期的备份分支：
```bash
git branch | grep "back/rebase-$(date +%Y%m%d)"
```

如果不存在，创建备份：
```bash
git branch "back/rebase-$(date +%Y%m%d)"
```

#### 4. 依次合并

从最老的提交组开始，依次执行合并：

**对于每一组**：
1. 标记 TodoList 任务为 in_progress
2. 找到该组最老的提交
3. 执行 interactive rebase：
```bash
# 准备提交信息
cat > /tmp/commit-msg.txt << 'EOF'
[合并后的提交信息]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF

# 执行 rebase（N为组内提交数）
GIT_SEQUENCE_EDITOR="sed -i '' '2,Ns/^pick/squash/'" \
GIT_EDITOR="cat /tmp/commit-msg.txt >" \
git rebase -i <最老提交>^
```
4. 标记任务为 completed
5. 继续下一组

#### 5. 验证结果

执行验证：
```bash
# 查看提交历史
git log --oneline -20

# 检查是否还有重复（应该为空）
git log --oneline -30 | sort | uniq -d

# 统计减少的提交数
echo "合并前: $(git rev-list --count back/rebase-$(date +%Y%m%d))"
echo "合并后: $(git rev-list --count HEAD)"
```

标记验证任务为 completed

#### 6. 输出总结

提供完整的执行报告：

```
✅ Git 提交历史清理完成！

执行结果：
- 合并前提交数：51
- 合并后提交数：42
- 减少提交数：9

合并详情：
1. 组1 "更新" (3→1)
2. 组2 "清理" (2→1)
3. 组3 "Update submodule" (2→1)
4. 组4 "submodule 改造" (2→1)

备份分支：back/rebase-20260108

下一步操作：
由于重写了 Git 历史，推送时需要使用：
  git push --force-with-lease

或者（如果确定没有其他人的提交）：
  git push --force

如需回滚，可以使用：
  git reset --hard back/rebase-20260108
```

## 重要说明

### 合并策略
- 总是从最老的提交组开始合并
- 保持时间顺序不变
- 添加 Co-Authored-By 标记

### 安全措施
- 始终创建备份分支
- 验证每次合并结果
- 提供清晰的回滚指令
