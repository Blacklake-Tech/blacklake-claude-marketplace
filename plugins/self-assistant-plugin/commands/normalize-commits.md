---
description: 规范化 Git 提交历史（合并重复 + 改写不规范）
argument-hint: [optional commit count, default: 30]
allowed-tools: Bash(git *), TodoWrite
---

## Context

- Commit count parameter: $ARGUMENTS (default: 30 if empty)
- Recent commits: !`COMMIT_COUNT="${ARGUMENTS:-30}"; if [ "$COMMIT_COUNT" -lt 5 ]; then COMMIT_COUNT=5; elif [ "$COMMIT_COUNT" -gt 200 ]; then COMMIT_COUNT=200; fi; git log --oneline -$COMMIT_COUNT --format="%h|%s|%ad" --date=format:'%Y-%m-%d'`
- Current branch: !`git branch --show-current`
- Remote status: !`git status -sb`
- Existing backup: !`git branch | grep 'back/normalize-'`

## Your task

分析指定数量的最近提交（默认 30 个），识别并处理重复提交和不规范提交。创建 TodoList 跟踪进度。

### 参数支持

命令支持可选的提交数量参数：`$ARGUMENTS`
- 无参数：分析最近 30 个提交（默认）
- 有参数：分析指定数量的提交
- 范围限制：5-200（自动调整超出范围的值）

### 使用示例

```bash
# 分析最近 30 个提交（默认）
/normalize-commits

# 分析最近 50 个提交
/normalize-commits 50

# 分析最近 100 个提交
/normalize-commits 100
```

### 第一阶段：分析识别

**识别重复提交**：
- 完全相同的消息
- 仅数字不同（"修改1"、"修改2"）
- 无意义消息（"1"、"test"、"wip"、"tmp"）

**识别不规范提交**：
不符合 Conventional Commits 格式的提交。

检测规则：`^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+`

**分析提交内容**：
对不规范提交执行 `git show <hash> --stat --format="%h|%s"` 获取 diff，推断：
- Type（从变更性质和关键词）
- Scope（从文件路径）
- Subject（从原消息优化）

**输出分析报告示例**：
```
📊 分析：30 个提交
├─ 合并：7 → 2
├─ 改写：15
└─ 已规范：8

重复提交：
- "更新" x3 → chore: 批量更新
- "update submodule" x4 → chore(submodule): 更新子模块

不规范提交：
- "添加 skills" → chore(submodule): 添加 skills 子模块
- "修改名称" → refactor(plugin): 重命名 blacklake plugin
```

### 第二阶段：执行处理

1. **创建备份**：`back/normalize-$(date +%Y%m%d)`

2. **合并重复提交**：使用 `git rebase -i` 将重复提交 squash，生成规范的合并消息

3. **改写不规范提交**：使用 `git rebase -i` 将不规范提交 reword 为规范格式

4. **验证结果**：检查所有提交是否符合规范

5. **输出报告**：
```
✅ 规范化完成：30 → 18 个提交

合并：
- "更新" (3→1)
- "update submodule" (4→1)

改写：15 个提交

备份：back/normalize-20260108
推送：git push --force-with-lease
回滚：git reset --hard back/normalize-20260108
```

### Type 推断规则

从 git show 的 diff 分析：
- 新增文件/功能 → `feat`
- 关键词（fix/bug/修复/issue）→ `fix`
- 重构/重命名 → `refactor`
- 文档（.md/README）→ `docs`
- 测试文件 → `test`
- 依赖（package.json）→ `build`
- CI 配置（.github/.gitlab-ci）→ `ci`
- 子模块（.gitmodules）→ `chore(submodule)`
- 配置/工具 → `chore`
- 性能相关 → `perf`

### Scope 推断规则

从文件路径提取：
- `src/api/*` → `api`
- `src/ui/*|components/*` → `ui`
- `plugins/*` → `plugin`
- `*.gitmodules|submodule` → `submodule`
- `config/*` → `config`
- 根目录配置 → 省略 scope

### 注意事项

- **始终创建备份**：包含时间戳避免冲突
- **保持时间顺序**：不改变提交的原始顺序
- **保留作者信息**：只修改消息，不改作者和时间
- **保持简洁**：生成的提交消息简洁明了
- **检测远程状态**：如已推送，警告 force push 风险
- **验证彻底**：确保所有提交符合 Conventional Commits

### 安全措施

- 备份分支命名：`back/normalize-YYYYMMDD`
- 每次 rebase 后验证结果
- 提供完整的回滚指令
- 重要操作前等待用户确认
