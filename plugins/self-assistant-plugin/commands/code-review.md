---
allowed-tools: Bash(gh issue view:*), Bash(gh search:*), Bash(gh issue list:*), Bash(gh pr comment:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr list:*), mcp__github_inline_comment__create_inline_comment
description: 代码审查 Pull Request
---

对给定的 Pull Request 进行代码审查。

请严格按照以下步骤执行：

1. 启动 haiku agent 检查以下任一条件是否为真：
   - Pull Request 已关闭
   - Pull Request 是草稿
   - Pull Request 不需要代码审查（如自动化 PR、明显正确的微小更改）
   - Claude 已经评论过此 PR（检查 `gh pr view <PR> --comments` 中 Claude 的评论）

   如果任一条件为真，停止执行，不继续。

注意：仍需审查 Claude 生成的 PR。

2. 启动 haiku agent 返回所有相关 CLAUDE.md 文件的路径列表（不包含内容）：
   - 根目录的 CLAUDE.md 文件（如果存在）
   - Pull Request 修改的文件所在目录中的任何 CLAUDE.md 文件

3. 启动 sonnet agent 查看 Pull Request 并返回更改摘要

4. 并行启动 4 个 agent 独立审查更改。每个 agent 应返回问题列表，每个问题包括描述和标记原因（如"CLAUDE.md 遵循"、"bug"）。Agent 应执行以下操作：

   Agent 1 + 2：CLAUDE.md 合规性 sonnet agent
   并行审查 CLAUDE.md 合规性。注意：评估文件的 CLAUDE.md 合规性时，只考虑与该文件共享路径或父路径的 CLAUDE.md 文件。

   Agent 3：Opus bug agent（与 agent 4 并行）
   扫描明显的 bug。仅关注 diff 本身，不读取额外上下文。仅标记重大 bug；忽略琐碎问题和可能的误报。不标记无法在 git diff 之外验证的问题。

   Agent 4：Opus bug agent（与 agent 3 并行）
   查找引入代码中存在的问题。可能是安全问题、错误逻辑等。仅查找更改代码范围内的问题。

   **关键：我们只要高信号问题。** 这意味着：
   - 会导致运行时错误行为的客观 bug
   - 清晰、明确的 CLAUDE.md 违规，可以引用被违反的确切规则

   我们不要：
   - 主观关注或"建议"
   - CLAUDE.md 未明确要求的样式偏好
   - "可能"是问题的潜在问题
   - 需要解释或判断的任何内容

   如果不确定问题是否真实，不要标记。误报会侵蚀信任并浪费审查时间。

   此外，应告知每个 subagent PR 标题和描述。这将帮助提供关于作者意图的上下文。

5. 对于 agent 3 和 4 在上一步中发现的每个问题，启动并行 subagent 验证问题。这些 subagent 应获取 PR 标题、描述以及问题描述。Agent 的工作是审查问题以高置信度验证所述问题确实是问题。例如，如果标记了"变量未定义"等问题，subagent 的工作是验证代码中确实如此。另一个例子是 CLAUDE.md 问题。Agent 应验证违反的 CLAUDE.md 规则是否适用于此文件且确实被违反。对 bug 和逻辑问题使用 Opus subagent，对 CLAUDE.md 违规使用 sonnet agent。

6. 过滤掉步骤 5 中未验证的任何问题。此步骤将为我们提供审查的高信号问题列表。

7. 如果发现问题，跳到步骤 8 直接发布内联评论。

   如果未发现问题，使用 `gh pr comment` 发布摘要评论（如果提供了 `--comment` 参数）：
   "未发现问题。已检查 bug 和 CLAUDE.md 合规性。"

8. 使用 `mcp__github_inline_comment__create_inline_comment` 为每个问题发布内联评论：
   - `path`: 文件路径
   - `line`（范围使用 `startLine`）：选择有问题的行，以便用户看到
   - `body`: 问题简要描述（无"Bug:"前缀）。对于小修复（最多 5 行更改），包含可提交的建议：
     ```suggestion
     修正后的代码
     ```

     **建议必须完整。** 如果修复需要其他地方的额外更改（如重命名变量需要更新所有用法），不要使用建议块。作者应该能够点击"提交建议"并获得有效修复 - 无需后续工作。

     对于较大的修复（6+ 行、结构更改或跨多个位置的更改），不要使用建议块。而是：
     1. 描述问题是什么
     2. 高层次解释建议的修复
     3. 包含用户可用于修复问题的 Claude Code 可复制提示，格式为：
        ```
        修复 [file:line]: [问题和建议修复的简要描述]
        ```

   **重要：每个唯一问题只发布一条评论。不要发布重复评论。**

评估步骤 4 和 5 中的问题时使用此列表（这些是误报，不要标记）：

- 预先存在的问题
- 看起来像 bug 但实际正确的内容
- 资深工程师不会标记的迂腐琐事
- linter 会捕获的问题（不要运行 linter 验证）
- 一般代码质量问题（如缺乏测试覆盖、一般安全问题），除非 CLAUDE.md 明确要求
- CLAUDE.md 中提到但代码中明确忽略的问题（如通过 lint ignore 注释）

注意：

- 使用 gh CLI 与 GitHub 交互（如获取 pull request、创建评论）。不要使用 web fetch。
- 开始前创建 todo list。
- 必须在内联评论中引用和链接每个问题（如引用 CLAUDE.md，包含链接）。
- 如果未发现问题，发布以下格式的评论：

---

## 代码审查

未发现问题。已检查 bug 和 CLAUDE.md 合规性。

---

- 在内联评论中链接代码时，严格遵循以下格式，否则 Markdown 预览无法正确渲染：https://github.com/anthropics/claude-code/blob/c21d3c10bc8e898b7ac1a2d745bdc9bc4e423afe/package.json#L10-L15
  - 需要完整 git sha
  - 必须提供完整 sha。像 `https://github.com/owner/repo/blob/$(git rev-parse HEAD)/foo/bar` 这样的命令不起作用，因为评论将直接在 Markdown 中渲染。
  - 仓库名必须与正在审查的仓库匹配
  - 文件名后的 # 符号
  - 行范围格式为 L[start]-L[end]
  - 至少提供 1 行前后上下文，以注释行为中心（如注释第 5-6 行，应链接到 `L4-7`）
