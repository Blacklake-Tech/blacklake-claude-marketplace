---
name: quick-commit
description: 智能生成符合 Conventional Commits 规范的提交信息并提交。自动推断 type、scope 和 subject，或使用自定义消息（带格式验证）。支持版本号自动升级、Maven Spotless 代码格式化、自动推送到远程。使用时机：(1) 需要快速提交代码，(2) 需要符合规范的提交消息，(3) 需要同时升级版本号并提交，(4) 需要格式化后提交，(5) 需要提交后推送或合并到 feature 分支。触发词：quick-commit、快速提交、升级版本后提交、格式化后提交。
argument-hint: [optional custom message]
allowed-tools: Bash(git *), AskQuestion, Edit
model: haiku
color: green
---

## Context

- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat`
- Staged diff details: !`git diff --cached`
- Unstaged changes: !`git diff --stat`
- Untracked files: !`git ls-files --others --exclude-standard | head -10`
- Current branch: !`git branch --show-current`
- Feature branch exists: !`git branch --list feature | grep -q feature && echo "YES" || echo "NO"`
- Maven Spotless available: !`if [ -f "pom.xml" ] && grep -q "spotless-maven-plugin" pom.xml 2>/dev/null && command -v mvn &> /dev/null; then echo "YES"; else echo "NO"; fi`
- Remote repositories: !`git remote -v`
- Remote count: !`git remote | wc -l | tr -d ' '`
- Current branch upstream: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "未设置"`
- Version files: !`find . -maxdepth 3 \( -name "package.json" -o -name "pom.xml" -o -name "pyproject.toml" -o -name "plugin.json" -o -name "Cargo.toml" -o -name "VERSION" \) 2>/dev/null | head -5`

## Your task

智能处理工作区和暂存区的所有变更，生成符合 Conventional Commits 规范的提交信息并提交。

## 【核心原则】

1. **全面感知**：默认处理工作区和暂存区的所有未提交内容
2. **自动暂存**：如果有任何未暂存的变更，自动执行 `git add .`
3. **主动推送**：提交成功后主动询问是否推送到远程
4. **可选合并**：支持提交后合并到 feature 分支（需明确指定）

## 【进度通知规范】

在执行操作时，**必须**主动输出进度文本，让用户了解当前执行状态。

### 检查阶段进度提示

- 🔍 检查暂存区：`正在检查暂存区变更...`
- 📂 检查工作区：`暂存区为空，检查工作区变更...`
- 📊 分析完成：`已分析 {文件数} 个文件的变更`

### 暂存阶段进度提示

- 📦 自动暂存：`正在暂存变更...`
- ✅ 暂存完成：`已暂存 {文件数} 个文件`

### 生成阶段进度提示

- 🤖 生成消息：`正在生成提交消息...`
- ✅ 生成完成：`已生成提交消息：{消息}`

### 提交阶段进度提示

- 💾 执行提交：`正在提交更改...`
- ✅ 提交成功：`提交成功：{commit_hash}`

### 重要原则

1. **及时反馈**：每个步骤开始前输出进度文本
2. **清晰明了**：使用表情符号和简短文字说明当前状态
3. **结果确认**：操作完成后必须输出明确的成功/失败提示

### 参数支持

命令支持可选的自定义提交消息参数：`$ARGUMENTS`

### 执行流程

1. **检查参数**：
   - 如果提供了 `$ARGUMENTS`（自定义消息）：
     - 验证格式是否符合 Conventional Commits：`^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+`
     - 符合则跳到步骤 2 使用自定义消息
     - 不符合则提示用户修正并退出
   - 如果未提供参数：继续自动生成流程

1.5. **版本号升级（条件执行）**：

   **触发条件**：用户明确要求更新版本号，包含以下关键词：
   - "升级版本" / "更新版本" / "版本升级"
   - "bump version" / "update version"
   - "发版" / "release"

   **执行流程**：

   1. **检测版本文件**：
      - 从 Context 的 `Version files` 获取文件列表
      - 如果没有检测到任何版本文件，提示用户并跳过此步骤

   2. **读取并升级版本号**：
      - 读取文件内容，提取当前版本号（格式：x.y.z）
      - **默认升级规则**：升级最低位 z，即 `x.y.z → x.y.(z+1)`
      - 使用 `Edit` 工具更新文件中的版本号
      - 输出提示：`📦 版本升级：{old_version} → {new_version}`

   3. **暂存版本文件**：
      - 执行 `git add <version_file>`
      - 继续正常的提交流程

   **支持的文件格式**：
   - `package.json` / `plugin.json`：`"version": "x.y.z"`
   - `pom.xml`：`<version>x.y.z</version>`（仅修改第一个 version 标签）
   - `pyproject.toml` / `Cargo.toml`：`version = "x.y.z"`
   - `VERSION`：纯文本 `x.y.z`

   **注意事项**：
   - 如果检测到多个版本文件，优先处理 `package.json` 或 `plugin.json`
   - 版本号必须是标准的三位格式 `x.y.z`
   - 升级后自动暂存，无需用户手动 `git add`

2. **检查并自动暂存变更**：
   - 检查是否有任何未提交的变更（暂存区 + 工作区）
   - 如果暂存区和工作区都为空：提示"无变更需要提交"并退出
   - 如果有任何未暂存的变更（工作区有变更或未跟踪文件）：
     - 输出进度提示：`📦 正在暂存所有变更...`
     - 自动执行 `git add .`（暂存所有变更，包括新文件）
     - 输出完成提示：`✅ 已暂存 {文件数} 个文件`
   - 继续步骤 2.5

2.5. **Maven Spotless 代码格式化（条件执行）**：

   **仅在满足以下所有条件时执行**：
   - Context 中 `Maven Spotless available` 为 `YES`
   - 即：项目根目录存在 `pom.xml`
   - 且 `pom.xml` 配置了 `spotless-maven-plugin`
   - 且系统中 `mvn` 命令可用

   **执行操作**：

   1. 通知用户开始格式化：
      ```
      🔧 代码格式化：检测到 Maven Spotless，正在格式化代码...
      ```

   2. 执行格式化命令：
      ```bash
      mvn spotless:apply
      ```

   3. 检查执行结果：
      - 如果成功：重新暂存修改的文件 `git add -u`
      - 如果失败：使用 `AskQuestion` 询问用户是否继续提交

   4. 通知完成：
      ```
      ✅ 格式化完成：代码已格式化并重新暂存
      ```

   **注意事项**：
   - 格式化可能修改暂存的文件，会自动重新 `git add -u`
   - 如果格式化耗时较长，会显示进度提示
   - 如果项目未配置 Spotless，此步骤自动跳过

3. **如果是自动生成模式，分析变更推断 type**：
   - 新增文件/功能 → `feat`
   - 关键词（fix/bug/修复）→ `fix`
   - 重构/重命名 → `refactor`
   - 文档/测试/依赖/CI → 对应 type
   - 详细规则见 [references/commit-types.md](references/commit-types.md)

4. **如果是自动生成模式，推断 scope**：从文件路径提取模块名（api/ui/plugin/config 等）

5. **如果是自动生成模式，生成 subject**：
   - 祈使语气、不超过 50 字符、首字母小写（英文）、无句号
   - 中文优先（如果项目使用中文）

6. **格式**：`<type>(<scope>): <subject>`
   - 更多示例见 [references/examples.md](references/examples.md)

7. **提交并输出结果**

8. **询问是否推送到远程**：
   - 提交成功后,使用 AskQuestion 主动询问用户是否推送到远程
   - 根据 Context 中的 Remote count 智能处理:
     - 0 个远程: 提示未配置远程仓库
     - 1 个远程: 直接推送到该远程
     - 多个远程: 让用户选择推送目标

9. **合并到 feature 分支（可选）**：
   - **触发条件**：仅在用户明确提到以下关键词时执行
     - "合并到 feature"
     - "merge to feature"
     - "合并 feature"
     - "merge feature"
   - **执行流程**：
     1. 检查 feature 分支是否存在（从 Context 的 Feature branch exists）
     2. 如果不存在，跳到【错误处理】的"错误6"
     3. 保存当前分支名：`current_branch=$(git branch --show-current)`
     4. 输出进度：`🔀 正在合并到 feature 分支...`
     5. 切换到 feature：`git checkout feature`
     6. 合并当前分支：`git merge $current_branch --no-ff -m "merge: 合并 $current_branch 到 feature"`
     7. 使用 AskQuestion 询问是否推送 feature 分支
     8. 切回原分支：`git checkout $current_branch`
     9. 输出完成提示：`✅ 已合并到 feature 分支`

### 推送流程

提交成功后,使用 AskQuestion 询问用户是否推送:

**询问界面**:
```
✅ 提交成功

提交信息: {commit_message}
提交哈希: {commit_hash}

是否推送到远程仓库?
```

**选项**:
- `推送到远程` - 立即推送提交
- `稍后手动推送` - 跳过推送,手动执行

**处理逻辑**:

**选择"推送到远程"时**:

1. **检查远程仓库数量** (从 Context 的 Remote count):

   **情况 A: 0 个远程**
   ```
   ⚠️ 未配置远程仓库

   当前仓库没有配置远程仓库。

   添加远程仓库:
   git remote add origin <url>

   然后执行推送:
   git push -u origin {branch}
   ```
   退出流程

   **情况 B: 1 个远程**
   - 获取远程名称: `git remote`
   - 获取当前分支: `git branch --show-current`
   - 检查是否已设置上游分支 (从 Context 的 Current branch upstream)
   - 如果上游为"未设置": 执行 `git push -u {remote} {branch}`
   - 如果已设置上游: 执行 `git push`
   - 输出推送结果:
     ```
     🚀 推送成功

     远程仓库: {remote}
     分支: {branch}
     提交哈希: {commit_hash}
     ```

   **情况 C: 多个远程**
   - 列出所有远程 (从 Context 的 Remote repositories)
   - 使用 AskQuestion 让用户选择推送目标
   - 询问界面:
     ```
     检测到多个远程仓库:

     {列出远程名称和 URL}

     请选择推送目标:
     ```
   - 选项: 为每个远程生成一个选项,如:
     - `origin (https://github.com/user/repo.git)`
     - `upstream (https://github.com/org/repo.git)`
   - 用户选择后:
     - 检查是否已设置上游分支
     - 如果上游为"未设置": 执行 `git push -u {选择的remote} {branch}`
     - 如果已设置上游: 执行 `git push {选择的remote} {branch}`
   - 输出推送结果

**选择"稍后手动推送"时**:
```
💡 提示: 提交已保存到本地仓库

手动推送命令:
git push
```
退出流程

### 使用示例

```bash
# 自动生成提交消息
/quick-commit

# 使用自定义消息
/quick-commit "feat(auth): 添加用户登录功能"

# 升级版本后提交
/quick-commit 升级版本

# 提交后合并到 feature
/quick-commit 合并到 feature
```

更多示例见 [references/examples.md](references/examples.md)

### 输出格式

**成功提交**：

```
✅ 提交成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

提交信息：
feat(plugin): 添加 Git 智能提交命令

提交哈希：abc1234
分支：main
文件数：3 个文件变更

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 提示: 提交已保存到本地仓库
```

**注意**: 提交完成后会自动询问是否推送到远程,详见"推送流程"章节。

## 【错误处理】

常见错误的快速参考，完整说明见 [references/error-handling.md](references/error-handling.md)

### 错误1：无变更需要提交

提示用户并退出：

```
ℹ️ 无变更需要提交
所有文件都已提交，无需操作。
```

### 错误2：自定义消息格式错误

验证格式：`^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+`

提示用户修正格式并退出。详见 [references/error-handling.md](references/error-handling.md)

### 错误3：提交失败

可能原因：Git 配置、文件权限、hooks 失败、仓库状态异常

提供诊断命令和解决方案。详见 [references/error-handling.md](references/error-handling.md)

### 错误3.5：Spotless 格式化失败

使用 `AskQuestion` 询问用户：
- `[1] 跳过格式化，继续提交`
- `[2] 取消提交，手动修复`

详细处理逻辑见 [references/error-handling.md](references/error-handling.md)

### 错误4：无法推断提交类型

提示使用自定义消息或手动提交。详见 [references/error-handling.md](references/error-handling.md)

### 错误5：推送失败

常见场景：需要 pull、权限问题、分支保护、网络问题

提供详细的诊断和解决步骤。详见 [references/error-handling.md](references/error-handling.md)

### 错误6：feature 分支不存在

使用 AskQuestion 提供选项：创建分支、从远程拉取、取消操作

详见 [references/error-handling.md](references/error-handling.md)

## 【高级功能】

### 交互式确认（可选）

对于重要提交，可以在生成消息后展示并等待确认：

```
🤖 生成的提交消息：

feat(api): 添加用户管理接口

变更文件：
- src/api/user.ts (新增)
- src/types/user.ts (新增)
- package.json (修改)

是否使用此消息提交？
```

使用 AskQuestion 工具提供选项：
- 确认提交
- 修改消息
- 取消操作

### 标准化原则

**重要**：始终使用标准的 Conventional Commits 规范，不依赖项目历史风格：

- ✅ 使用标准 type（feat/fix/docs/refactor/chore等）
- ✅ 使用清晰的 scope（从文件路径推断）
- ✅ 使用祈使语气的 subject
- ✅ 保持简洁明了（不超过50字符）
- ❌ 不学习项目中不规范的提交风格
- ❌ 不模仿历史提交的格式错误

**语言选择**：
- 优先使用中文（清晰易懂）
- 保持专业术语的准确性
- 避免口语化表达
