---
description: 智能生成符合 Conventional Commits 规范的提交
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*)
---

## Context

- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat`
- Staged diff details: !`git diff --cached`
- Recent commits style: !`git log --oneline -5 --format="%s"`
- Current branch: !`git branch --show-current`

## Your task

根据暂存区的变更智能生成符合 Conventional Commits 规范的提交信息并提交。

### 执行流程

1. **检查暂存区**：确认有暂存的变更，否则提示先 `git add`

2. **分析变更推断 type**：
   - 新增文件/功能 → `feat`
   - 关键词（fix/bug/修复）→ `fix`
   - 重构/重命名 → `refactor`
   - 文档文件（.md/README）→ `docs`
   - 测试文件 → `test`
   - 依赖文件（package.json）→ `build`
   - CI 配置 → `ci`
   - 子模块/.gitmodules → `chore(submodule)`
   - 配置文件 → `chore`

3. **推断 scope**：从文件路径提取模块名（api/ui/plugin/config 等）

4. **生成 subject**：
   - 祈使语气、不超过 50 字符
   - 首字母小写（英文）
   - 无句号
   - 中文优先（如果项目使用中文）

5. **格式**：`<type>(<scope>): <subject>`

6. **添加 Co-Authored-By**：
   ```
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```

7. **提交并输出结果**

### 示例输出

```
✅ 提交成功！

提交信息：feat(plugin): 添加 Git 智能提交命令
提交哈希：abc1234
变更文件：2 files changed, 150 insertions(+)
```
