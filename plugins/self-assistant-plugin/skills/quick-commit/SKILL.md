---
name: quick-commit
description: 智能生成符合 Conventional Commits 规范的提交信息并提交。根据暂存区变更自动推断 type、scope 和 subject，或使用自定义消息（带格式验证）。使用场景：(1) 快速提交符合规范的代码，(2) 自动生成提交消息节省时间，(3) 确保提交格式一致性，(4) 学习项目提交风格。
argument-hint: [optional custom message]
allowed-tools: Bash(git *), AskQuestion
model: haiku
color: green
hooks:
  UserPromptSubmit:
    - matcher: "*"
      hooks:
        - type: command
          command: "./check-spotless.sh"
          timeout: 120
          statusMessage: "检测并执行 Spotless 格式化..."
  Stop:
    - matcher: "*"
      hooks:
        - type: command
          command: "./quick-commit-done.sh"
          statusMessage: "测试相对路径方式1..."
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/skills/quick-commit/quick-commit-done2.sh"
          statusMessage: "测试环境变量路径方式..."
        - type: command
          command: "./quick-commit-done2.sh"
          statusMessage: "测试相对路径方式2..."
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
# 自动生成提交消息（处理所有未提交变更）
/quick-commit

# 使用自定义消息
/quick-commit "feat(auth): 添加用户登录功能"
/quick-commit "fix(api): 修复空指针异常"

# 提交后合并到 feature 分支
/quick-commit "feat(ui): 添加新组件" 合并到 feature
/quick-commit 合并到 feature
```

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

### 错误1：无变更需要提交

当暂存区和工作区都为空时：

```
ℹ️ 无变更需要提交

当前状态：
- 工作区：干净
- 暂存区：空

所有文件都已提交，无需操作。
```

### 错误2：自定义消息格式错误

```
❌ 提交消息格式不符合 Conventional Commits 规范

输入消息：{用户输入}

正确格式：<type>(<scope>): <subject>

有效的 type：
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- perf: 性能优化
- test: 测试相关
- build: 构建系统或依赖
- ci: CI 配置
- chore: 其他更改

示例：
- feat(auth): 添加用户登录功能
- fix(api): 修复空指针异常
- docs: 更新 README
```

### 错误3：提交失败

```
❌ 提交失败

错误信息：{git 错误信息}

可能原因：
- Git 配置问题（用户名/邮箱未设置）
- 文件权限问题
- Git hooks 失败
- 仓库状态异常

建议操作：
1. 检查 Git 配置：git config --list
2. 查看详细错误：git status
3. 如果是 hook 失败，检查 .git/hooks/
```

### 错误3.5：Spotless 格式化失败

当 `mvn spotless:apply` 执行失败时，使用 `AskQuestion` 工具询问用户：

```
⚠️ Spotless 格式化失败

错误信息：{maven 错误信息}

可能原因：
- Maven 配置错误
- Spotless 插件配置问题
- 代码存在无法自动修复的格式问题
- 网络问题（下载插件失败）

是否继续提交？
```

**选项**：
- `[1] 跳过格式化，继续提交` - 忽略格式化错误，直接提交当前暂存的代码
- `[2] 取消提交，手动修复` - 终止提交流程，让用户手动修复格式问题

**处理逻辑**：
- 选择 [1]：继续执行步骤 3（推断 type）
- 选择 [2]：退出命令，输出建议操作：
  ```
  💡 建议操作：
  1. 查看 Spotless 错误详情：mvn spotless:check
  2. 手动修复格式问题
  3. 或更新 Spotless 配置（pom.xml）
  4. 修复后重新执行：/quick-commit
  ```

### 错误4：无法推断提交类型

```
⚠️ 无法自动推断提交类型

变更文件：
- {文件列表}

建议操作：
1. 使用自定义消息：/quick-commit "type(scope): subject"
2. 或手动提交：git commit -m "消息"

提示：
- 新增功能用 feat
- 修复问题用 fix
- 文档更新用 docs
- 其他更改用 chore
```

### 错误5：推送失败

当 `git push` 执行失败时：

```
❌ 推送失败

错误信息：{git 错误信息}

可能原因：
- 远程分支有新提交（需要先 pull）
- 没有推送权限（检查 SSH 密钥或访问令牌）
- 网络连接问题
- 分支保护规则限制
- 远程仓库不存在或 URL 错误

建议操作：
1. 检查远程状态：git fetch
2. 合并远程更改：git pull --rebase
3. 再次推送：git push
4. 检查权限：git remote -v
5. 查看详细错误：git push -v
```

**常见场景处理**：

- **需要 pull**: 执行 `git pull --rebase` 后重新推送
- **权限问题**: 检查 SSH 密钥或 HTTPS 凭据配置
- **强制推送**: ⚠️ 仅在确认安全时使用 `git push --force-with-lease`

### 错误6：feature 分支不存在

当执行合并到 feature 时，如果 feature 分支不存在（从 Context 的 Feature branch exists 为 NO）：

```
❌ feature 分支不存在

当前仓库没有 feature 分支。

建议操作：
1. 创建 feature 分支：git checkout -b feature
2. 或从远程拉取：git fetch origin feature:feature
3. 或取消合并操作
```

使用 AskQuestion 工具提供选项：
- `创建 feature 分支` - 执行 `git checkout -b feature`，然后继续合并流程
- `从远程拉取` - 执行 `git fetch origin feature:feature`，然后继续合并流程
- `取消操作` - 跳过合并，保持当前状态

**处理逻辑**：
- 选择"创建"或"拉取"后，重新检查 feature 分支是否存在
- 如果仍不存在，提示错误并退出
- 如果存在，继续执行合并流程

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
