---
description: 智能生成符合 Conventional Commits 规范的提交信息并提交。根据暂存区变更自动推断 type、scope 和 subject，或使用自定义消息（带格式验证）。使用场景：(1) 快速提交符合规范的代码，(2) 自动生成提交消息节省时间，(3) 确保提交格式一致性，(4) 学习项目提交风格。
argument-hint: [optional custom message]
allowed-tools: Bash(git *), AskQuestion
model: haiku
color: green
---

## Context

- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat`
- Staged diff details: !`git diff --cached`
- Current branch: !`git branch --show-current`
- Maven Spotless available: !`if [ -f "pom.xml" ] && grep -q "spotless-maven-plugin" pom.xml 2>/dev/null && command -v mvn &> /dev/null; then echo "YES"; else echo "NO"; fi`

## Your task

根据暂存区的变更智能生成符合 Conventional Commits 规范的提交信息并提交。

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

2. **检查暂存区**：
   - 如果暂存区有变更：继续步骤 2.5
   - 如果暂存区为空：
     - 检查工作区是否有未暂存的变更
     - 如果工作区也为空：提示"无变更需要提交"并退出
     - 如果工作区有变更：使用 `AskQuestion` 询问用户是否自动暂存
       - 选择"是"：执行 `git add -u`（暂存已跟踪文件的修改）或 `git add .`（暂存所有变更），然后继续
       - 选择"否"：提示手动 `git add` 并退出

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

### 使用示例

```bash
# 自动生成提交消息
/quick-commit

# 使用自定义消息
/quick-commit "feat(auth): 添加用户登录功能"
/quick-commit "fix(api): 修复空指针异常"
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

下一步操作：
- 推送到远程：git push
- 查看提交：git show abc1234
```

## 【错误处理】

### 错误1：暂存区为空（自动处理）

当暂存区为空时，**自动检查工作区并询问用户**：

**询问提示**：
```
⚠️ 暂存区为空

检测到以下未暂存的变更：
{列出修改的文件及简要说明}

是否自动暂存这些变更？
```

**选项**：
- `[1] 暂存已跟踪文件的修改 (git add -u)` - 仅暂存已在 Git 中的文件
- `[2] 暂存所有变更 (git add .)` - 暂存所有文件（包括新文件）
- `[3] 手动选择，稍后提交` - 取消操作，让用户手动 git add

**处理逻辑**：
- 选择 [1]：执行 `git add -u`，继续提交流程
- 选择 [2]：执行 `git add .`，继续提交流程
- 选择 [3]：退出命令，输出手动操作指引

**如果工作区也为空**：
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
