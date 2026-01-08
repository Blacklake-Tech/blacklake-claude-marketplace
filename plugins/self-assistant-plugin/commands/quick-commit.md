---
description: 智能生成符合 Conventional Commits 规范的提交
argument-hint: [optional custom message]
allowed-tools: Bash(git *)
---

## Context

- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat`
- Staged diff details: !`git diff --cached`
- Recent commits style: !`git log --oneline -5 --format="%s"`
- Current branch: !`git branch --show-current`

## Your task

根据暂存区的变更智能生成符合 Conventional Commits 规范的提交信息并提交。

### 参数支持

命令支持可选的自定义提交消息参数：`$ARGUMENTS`

### 执行流程

1. **检查参数**：
   - 如果提供了 `$ARGUMENTS`（自定义消息）：
     - 验证格式是否符合 Conventional Commits：`^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+`
     - 符合则跳到步骤 2 使用自定义消息
     - 不符合则提示用户修正并退出
   - 如果未提供参数：继续自动生成流程

2. **检查暂存区**：确认有暂存的变更，否则提示先 `git add`

3. **如果是自动生成模式，分析变更推断 type**：
   - 新增文件/功能 → `feat`
   - 关键词（fix/bug/修复）→ `fix`
   - 重构/重命名 → `refactor`
   - 文档文件（.md/README）→ `docs`
   - 测试文件 → `test`
   - 依赖文件（package.json）→ `build`
   - CI 配置 → `ci`
   - 子模块/.gitmodules → `chore(submodule)`
   - 配置文件 → `chore`

4. **如果是自动生成模式，推断 scope**：从文件路径提取模块名（api/ui/plugin/config 等）

5. **如果是自动生成模式，生成 subject**：
   - 祈使语气、不超过 50 字符
   - 首字母小写（英文）
   - 无句号
   - 中文优先（如果项目使用中文）

6. **格式**：`<type>(<scope>): <subject>`

7. **提交并输出结果**

### 使用示例

```bash
# 自动生成提交消息
/quick-commit

# 使用自定义消息
/quick-commit "feat(auth): 添加用户登录功能"
/quick-commit "fix(api): 修复空指针异常"
```

### 示例输出

```
✅ 已提交：feat(plugin): 添加 Git 智能提交命令 [abc1234]
```
