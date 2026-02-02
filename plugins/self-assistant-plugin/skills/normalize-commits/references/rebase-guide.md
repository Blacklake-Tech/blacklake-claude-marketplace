# Git Rebase 操作指南

本文档提供 Git Rebase 的详细操作指南，用于合并重复提交和改写不规范提交。

## 交互式 Rebase 基础

### 启动 Rebase

```bash
# 从最近 N 个提交开始
git rebase -i HEAD~N

# 或指定起始提交
git rebase -i <commit_hash>
```

### Rebase 命令

| 命令 | 简写 | 说明 | 使用场景 |
|------|------|------|---------|
| `pick` | `p` | 保留提交 | 默认，不修改 |
| `reword` | `r` | 修改提交消息 | 改写不规范提交 |
| `edit` | `e` | 修改提交内容 | 修改提交内容 |
| `squash` | `s` | 合并到上一个提交 | 合并重复提交 |
| `fixup` | `f` | 合并但丢弃消息 | 合并临时提交 |
| `drop` | `d` | 删除提交 | 删除无用提交 |

## 合并重复提交

### 场景：多个相同消息的提交

**原提交历史**：
```
pick abc1234 更新
pick def5678 更新
pick ghi9012 更新
```

**修改为**：
```
pick abc1234 更新
squash def5678 更新
squash ghi9012 更新
```

**保存后编辑合并消息**：
```
chore: 批量更新配置文件
```

### 场景：无意义提交

**原提交历史**：
```
pick abc1234 1
pick def5678 2
pick ghi9012 test
pick jkl3456 wip
```

**修改为**：
```
pick abc1234 1
fixup def5678 2
fixup ghi9012 test
fixup jkl3456 wip
```

**编辑第一个提交消息**：
```
chore: 临时提交整理
```

## 改写不规范提交

### 场景：缺少 type

**原提交历史**：
```
pick abc1234 添加登录功能
```

**修改为**：
```
reword abc1234 添加登录功能
```

**保存后编辑新消息**：
```
feat(auth): 添加用户登录功能
```

### 场景：格式错误

**原提交历史**：
```
pick abc1234 Fix bug in api
pick def5678 Update README
```

**修改为**：
```
reword abc1234 Fix bug in api
reword def5678 Update README
```

**编辑新消息**：
```
fix(api): 修复接口错误
docs: 更新 README
```

## Rebase 冲突处理

### 检测冲突

```bash
# 查看冲突状态
git status

# 查看冲突文件
git diff
```

### 解决冲突

```bash
# 1. 手动编辑冲突文件
vim <conflicted_file>

# 2. 标记为已解决
git add <resolved_files>

# 3. 继续 rebase
git rebase --continue
```

### 放弃 Rebase

```bash
# 完全放弃 rebase，恢复到 rebase 前状态
git rebase --abort
```

### 跳过提交

```bash
# 跳过当前提交，继续 rebase
git rebase --skip
```

## Rebase 安全措施

### 1. 创建备份分支

**在 rebase 前**：
```bash
git branch back/normalize-$(date +%Y%m%d)
```

### 2. 验证结果

**Rebase 后检查**：
```bash
# 查看提交历史
git log --oneline -20

# 验证所有提交符合规范
git log --oneline -20 | grep -v -E '^[0-9a-f]+ (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+'
```

### 3. 回滚方案

**如果 rebase 出错**：
```bash
# 方法 1：使用备份分支
git reset --hard back/normalize-20260202

# 方法 2：使用 reflog
git reflog
git reset --hard HEAD@{N}
```

## 高级技巧

### 批量操作

**合并多组重复提交**：
```bash
# 原历史
pick a1 更新
pick a2 更新
pick a3 更新
pick b1 修复
pick b2 修复
pick c1 test
pick c2 test

# 修改为
pick a1 更新
squash a2 更新
squash a3 更新
pick b1 修复
squash b2 修复
pick c1 test
fixup c2 test
```

### 保持提交顺序

**重要**：Rebase 时保持提交的时间顺序，不要随意调整提交位置。

### 处理已推送的提交

**警告**：如果提交已推送到远程，rebase 后需要 force push。

```bash
# 更安全的强制推送
git push --force-with-lease

# 普通强制推送（危险）
git push --force
```

**风险提示**：
- ⚠️ 会覆盖远程历史
- ⚠️ 可能影响其他协作者
- ⚠️ 仅在确认安全时使用

## 常见错误

### 错误 1：Rebase 中断

**症状**：
```
error: could not apply abc1234... commit message
```

**解决**：
1. 查看 `git status` 了解问题
2. 解决冲突或跳过提交
3. 继续 rebase

### 错误 2：丢失提交

**症状**：Rebase 后某些提交消失

**解决**：
```bash
# 查看 reflog
git reflog

# 找到丢失的提交
git cherry-pick <commit_hash>
```

### 错误 3：重复应用补丁

**症状**：
```
The previous cherry-pick is now empty
```

**解决**：
```bash
# 跳过空提交
git rebase --skip
```

## 最佳实践

1. **小步快跑**：每次 rebase 处理少量提交，降低风险
2. **频繁验证**：每次操作后验证结果
3. **保留备份**：至少保留一个备份分支
4. **避免公共分支**：不要 rebase 已推送的公共分支
5. **沟通协作**：团队协作时提前沟通 rebase 计划

## 自动化脚本示例

### 批量改写脚本

```bash
#!/bin/bash
# rewrite-commits.sh - 批量改写不规范提交

COMMIT_COUNT=$1
BACKUP_BRANCH="back/normalize-$(date +%Y%m%d)"

# 创建备份
git branch "$BACKUP_BRANCH"

# 获取需要改写的提交
git log --oneline -"$COMMIT_COUNT" --format="%h %s" | \
  grep -v -E '^[0-9a-f]+ (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)' | \
  while IFS=' ' read -r hash message; do
    echo "需要改写: $hash $message"
  done
```

### 验证脚本

```bash
#!/bin/bash
# validate-commits.sh - 验证提交格式

COMMIT_COUNT=$1

# 检查不规范的提交
INVALID=$(git log --oneline -"$COMMIT_COUNT" --format="%h %s" | \
  grep -v -E '^[0-9a-f]+ (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+')

if [ -n "$INVALID" ]; then
  echo "发现不规范提交："
  echo "$INVALID"
  exit 1
else
  echo "所有提交符合规范"
  exit 0
fi
```
