# 错误处理详解

本文档详细说明 quick-commit 可能遇到的各种错误及其处理方法。

## 错误 1：无变更需要提交

**触发条件**：暂存区和工作区都为空

**错误消息**：
```
ℹ️ 无变更需要提交

当前状态：
- 工作区：干净
- 暂存区：空

所有文件都已提交，无需操作。
```

**处理方式**：
- 提示用户并退出
- 无需任何操作

---

## 错误 2：自定义消息格式错误

**触发条件**：用户提供的自定义消息不符合 Conventional Commits 规范

**错误消息**：
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

**处理方式**：
- 提示用户修正格式
- 退出命令
- 用户可重新执行并提供正确格式

**格式验证规则**：
```regex
^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+
```

---

## 错误 3：提交失败

**触发条件**：`git commit` 命令执行失败

**错误消息**：
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

**常见原因及解决方法**：

### 3.1 Git 用户信息未配置

**症状**：
```
*** Please tell me who you are.
```

**解决方法**：
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3.2 Pre-commit Hook 失败

**症状**：
```
pre-commit hook failed
```

**解决方法**：
1. 检查 `.git/hooks/pre-commit` 脚本
2. 修复 hook 检查的问题（如 linter 错误）
3. 或临时跳过 hook：`git commit --no-verify`

### 3.3 文件权限问题

**症状**：
```
error: insufficient permission
```

**解决方法**：
```bash
# 检查文件权限
ls -la

# 修复权限
chmod 644 <file>
```

---

## 错误 3.5：Spotless 格式化失败

**触发条件**：`mvn spotless:apply` 执行失败

**错误消息**：
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

**交互选项**：
- `[1] 跳过格式化，继续提交` - 忽略格式化错误，直接提交
- `[2] 取消提交，手动修复` - 终止流程，手动修复

**处理逻辑**：

### 选择 [1]：跳过格式化
- 继续执行正常的提交流程
- 使用当前暂存的代码提交

### 选择 [2]：取消提交
- 退出命令
- 输出建议操作：
  ```
  💡 建议操作：
  1. 查看 Spotless 错误详情：mvn spotless:check
  2. 手动修复格式问题
  3. 或更新 Spotless 配置（pom.xml）
  4. 修复后重新执行：/quick-commit
  ```

**常见 Spotless 错误**：

### 3.5.1 插件配置错误

**症状**：
```
Plugin not found: spotless-maven-plugin
```

**解决方法**：
1. 检查 `pom.xml` 中的插件配置
2. 确认插件版本正确
3. 运行 `mvn clean install` 下载依赖

### 3.5.2 格式规则冲突

**症状**：
```
Unable to format file: conflicting rules
```

**解决方法**：
1. 检查 Spotless 配置的格式规则
2. 手动调整代码格式
3. 或修改 Spotless 配置以放宽规则

---

## 错误 4：无法推断提交类型

**触发条件**：无法从变更文件自动推断合适的 commit type

**错误消息**：
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

**处理方式**：
- 提示用户使用自定义消息
- 或让用户手动执行 git commit

**何时会触发**：
- 变更文件类型混杂，无明显主次
- 变更文件类型不在已知规则中
- 仅有二进制文件变更

---

## 错误 5：推送失败

**触发条件**：`git push` 执行失败

**错误消息**：
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

**常见场景及解决方法**：

### 5.1 远程有新提交

**症状**：
```
! [rejected] main -> main (fetch first)
```

**解决方法**：
```bash
# 拉取远程更改
git pull --rebase

# 解决冲突（如果有）
# 然后继续 rebase
git rebase --continue

# 重新推送
git push
```

### 5.2 权限问题

**症状**：
```
Permission denied (publickey)
```

**解决方法**：

**SSH 方式**：
```bash
# 检查 SSH 密钥
ssh -T git@github.com

# 生成新密钥
ssh-keygen -t ed25519 -C "your.email@example.com"

# 添加到 GitHub/GitLab
```

**HTTPS 方式**：
```bash
# 配置凭据
git config --global credential.helper store

# 或使用 Personal Access Token
```

### 5.3 分支保护

**症状**：
```
protected branch hook declined
```

**解决方法**：
1. 检查仓库的分支保护规则
2. 创建 Pull Request 而不是直接推送
3. 或联系管理员调整保护规则

### 5.4 网络问题

**症状**：
```
Connection timed out
```

**解决方法**：
1. 检查网络连接
2. 尝试使用代理
3. 切换 HTTPS/SSH 协议

### 5.5 强制推送（谨慎使用）

**场景**：本地历史与远程不一致

**命令**：
```bash
# 更安全的强制推送
git push --force-with-lease

# 普通强制推送（危险）
git push --force
```

**⚠️ 警告**：
- 强制推送会覆盖远程历史
- 可能导致其他人的工作丢失
- 仅在确认安全时使用

---

## 错误 6：feature 分支不存在

**触发条件**：用户请求合并到 feature 分支，但该分支不存在

**错误消息**：
```
❌ feature 分支不存在

当前分支：{current_branch}

无法执行合并操作。

建议操作：
1. 创建 feature 分支：git checkout -b feature
2. 或使用其他分支名称
3. 或跳过合并，仅提交到当前分支
```

**处理方式**：
- 提示用户创建 feature 分支
- 或让用户选择其他分支
- 退出合并流程

---

## 错误 7：合并冲突

**触发条件**：合并到 feature 分支时发生冲突

**错误消息**：
```
❌ 合并冲突

合并 {current_branch} 到 feature 时发生冲突

冲突文件：
- {file1}
- {file2}

建议操作：
1. 查看冲突：git status
2. 手动解决冲突
3. 标记已解决：git add <file>
4. 完成合并：git merge --continue
5. 或取消合并：git merge --abort
```

**处理方式**：
- 提示用户手动解决冲突
- 提供详细的解决步骤
- 退出命令

---

## 错误 8：版本文件未找到

**触发条件**：用户请求升级版本，但未检测到版本文件

**错误消息**：
```
⚠️ 未检测到版本文件

已检查的文件类型：
- package.json
- pom.xml
- pyproject.toml
- plugin.json
- Cargo.toml
- VERSION

建议操作：
1. 确认项目根目录存在版本文件
2. 或手动创建版本文件
3. 或跳过版本升级，仅提交代码
```

**处理方式**：
- 提示用户并跳过版本升级步骤
- 继续正常的提交流程

---

## 错误 9：版本号格式错误

**触发条件**：版本文件中的版本号不符合 x.y.z 格式

**错误消息**：
```
❌ 版本号格式错误

当前版本：{current_version}
文件：{version_file}

版本号必须是标准的三位格式：x.y.z

示例：
- 1.0.0
- 2.3.5
- 0.1.0

建议操作：
1. 手动修正版本号格式
2. 或跳过版本升级
```

**处理方式**：
- 提示用户修正版本号格式
- 跳过版本升级步骤
- 继续正常的提交流程

---

## 通用错误处理原则

1. **清晰的错误消息**：
   - 说明错误原因
   - 提供可能的解决方案
   - 给出具体的命令示例

2. **优雅降级**：
   - 非关键错误允许跳过
   - 提供替代方案
   - 保护用户的工作成果

3. **用户友好**：
   - 使用表情符号区分错误级别
   - 提供详细的上下文信息
   - 给出下一步操作建议

4. **安全第一**：
   - 避免数据丢失
   - 谨慎使用强制操作
   - 充分提示风险
