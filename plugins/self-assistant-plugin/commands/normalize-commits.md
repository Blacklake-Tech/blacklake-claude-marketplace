---
description: 规范化 Git 提交历史，分析并清理最近的提交，合并重复提交并改写不规范提交为 Conventional Commits 格式。使用场景：(1) 提交历史混乱需要整理，(2) 存在大量重复或无意义提交，(3) 提交消息不符合规范，(4) PR 前需要清理提交历史。支持自定义分析范围（5-200 个提交）。
argument-hint: [optional commit count, default: 30]
allowed-tools: Bash(git *), TodoWrite, AskQuestion
model: sonnet
color: blue
---

## Context

- Commit count parameter: $ARGUMENTS (default: 30 if empty)
- Recent commits: !`COMMIT_COUNT="${ARGUMENTS:-30}"; if [ "$COMMIT_COUNT" -lt 5 ]; then COMMIT_COUNT=5; elif [ "$COMMIT_COUNT" -gt 200 ]; then COMMIT_COUNT=200; fi; git log --oneline -$COMMIT_COUNT --format="%h|%s|%ad" --date=format:'%Y-%m-%d'`
- Current branch: !`git branch --show-current`
- Remote status: !`git status -sb`
- Existing backup: !`git branch | grep 'back/normalize-'`

## Your task

分析指定数量的最近提交（默认 30 个），识别并处理重复提交和不规范提交。

## 【任务清单管理】

在执行规范化前，**必须**先列出任务清单，让用户了解执行计划。

### 任务清单格式

使用 TodoWrite 工具创建任务清单：

```
📋 规范化任务清单：

1. [ ] 分析识别：扫描最近 {N} 个提交
2. [ ] 输出报告：展示重复提交和不规范提交
3. [ ] 等待确认：用户确认是否执行规范化
4. [ ] 创建备份：back/normalize-{date}
5. [ ] 执行处理：合并重复 + 改写不规范
6. [ ] 验证结果：确认所有提交符合规范
```

### 执行过程中的状态更新

使用 TodoWrite 工具实时更新任务状态：
- [✅] 已完成
- [🔄] 进行中
- [ ] 待执行

### 任务完成总结

所有任务完成后，输出完成总结：

```
✅ 任务完成总结

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [✅] 分析识别：扫描最近 30 个提交
2. [✅] 输出报告：发现 7 个重复、15 个不规范
3. [✅] 等待确认：用户已确认执行
4. [✅] 创建备份：back/normalize-20260112
5. [✅] 执行处理：合并重复 + 改写不规范
6. [✅] 验证结果：所有提交符合规范

所有步骤已完成！
```

## 【进度通知规范】

在执行耗时操作时，**必须**主动输出进度文本，让用户了解当前执行状态。

### 分析阶段进度提示

- 🔍 开始分析前：`正在分析最近 {N} 个提交...`
- 📊 分析完成后：`已识别 {重复数} 个重复提交、{不规范数} 个不规范提交`

### 执行阶段进度提示

- 💾 创建备份时：`正在创建备份分支 back/normalize-{date}...`
- 🔄 执行 rebase 时：`正在合并重复提交...`
- ✍️ 改写提交时：`正在改写不规范提交 ({当前}/{总数})...`
- ✅ 操作完成：`规范化完成！{原数量} → {新数量} 个提交`

### 重要原则

1. **及时反馈**：每个耗时步骤（>2秒）开始前输出进度文本
2. **清晰明了**：使用表情符号和简短文字说明当前状态
3. **结果确认**：操作完成后必须输出明确的成功/失败提示
4. **避免冗余**：不要输出工具内部的详细日志，只输出对用户有意义的状态信息

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

**输出分析报告格式**：

```
📊 提交分析报告

总计：30 个提交
├─ 重复提交：7 个（将合并为 2 个）
├─ 不规范提交：15 个（需改写）
└─ 已规范提交：8 个（无需处理）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

重复提交分组：

组 1：合并 3 个提交
- abc1234 "更新" (2026-01-10)
- def5678 "更新" (2026-01-10)
- ghi9012 "更新" (2026-01-11)
→ chore: 批量更新配置文件

组 2：合并 4 个提交
- jkl3456 "update submodule" (2026-01-09)
- mno7890 "update submodule" (2026-01-10)
- pqr1234 "update submodule" (2026-01-11)
- stu5678 "update submodule" (2026-01-12)
→ chore(submodule): 更新子模块版本

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

不规范提交改写：

1. vwx9012 "添加 skills"
   → chore(submodule): 添加 skills 子模块
   
2. yza3456 "修改名称"
   → refactor(plugin): 重命名 blacklake plugin
   
... (展示所有)
```

### 第二阶段：执行处理

**⚠️ 强制确认步骤**：执行前必须等待用户明确确认。

**确认方式**：
- 展示完整的处理计划（合并哪些、改写哪些）
- 明确提示 rebase 操作的风险
- 使用 AskQuestion 工具等待用户明确回复确认
- 如果用户未明确确认或取消，**停止执行**

**示例对话**：

```
📊 分析报告：

重复提交（将合并为 2 个）：
- "更新" x3 → chore: 批量更新
- "update submodule" x4 → chore(submodule): 更新子模块

不规范提交（将改写 15 个）：
- "添加 skills" → chore(submodule): 添加 skills 子模块
- "修改名称" → refactor(plugin): 重命名 blacklake plugin
... (展示所有)

⚠️ 警告：此操作将修改 Git 历史！已创建备份分支：back/normalize-20260112

请确认是否执行规范化？
```

使用 AskQuestion 工具提供选项：
- 确认执行
- 取消操作

1. **创建备份**：`back/normalize-$(date +%Y%m%d)`

2. **合并重复提交**：使用 `git rebase -i` 将重复提交 squash，生成规范的合并消息

3. **改写不规范提交**：使用 `git rebase -i` 将不规范提交 reword 为规范格式

4. **验证结果**：检查所有提交是否符合规范

5. **输出完成报告**：

```
✅ 规范化完成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

统计信息：
- 原提交数：30
- 新提交数：18
- 合并：7 → 2（减少 5 个）
- 改写：15 个

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

备份信息：
- 备份分支：back/normalize-20260112
- 回滚命令：git reset --hard back/normalize-20260112

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

下一步操作：
- 推送到远程：git push --force-with-lease
- 删除备份：git branch -D back/normalize-20260112
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

## 【错误处理】

### 错误1：没有提交需要处理

```
❌ 未发现需要规范化的提交

分析结果：
- 所有 30 个提交均符合 Conventional Commits 规范
- 无重复提交
- 无需执行规范化操作
```

### 错误2：Git rebase 冲突

```
❌ Rebase 过程中出现冲突

可能原因：
- 提交之间存在文件冲突
- 合并的提交修改了相同文件

建议操作：
1. 检查冲突文件：git status
2. 解决冲突后继续：git rebase --continue
3. 或放弃操作：git rebase --abort
4. 使用备份恢复：git reset --hard back/normalize-{date}
```

### 错误3：远程分支已推送

```
⚠️ 警告：当前分支已推送到远程

检测到：
- 本地分支：main
- 远程分支：origin/main
- 提交差异：本地领先 5 个提交

风险提示：
- 规范化后需要 force push
- 可能影响其他协作者
- 建议在个人分支或确认无他人使用时操作

是否继续？
```

### 错误4：备份分支已存在

```
⚠️ 备份分支已存在

发现备份：back/normalize-20260112

建议操作：
1. 删除旧备份：git branch -D back/normalize-20260112
2. 或使用新名称：back/normalize-20260112-2
3. 或取消本次操作
```

### 错误5：提交数量超出范围

```
❌ 提交数量参数错误

输入：{N}
有效范围：5-200

已自动调整为：{调整后的值}
```
