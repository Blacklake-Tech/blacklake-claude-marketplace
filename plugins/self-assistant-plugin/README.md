# Self Assistant Plugin

个人效率助手插件，提供 Git 提交规范化、智能快速提交、持续学习系统等功能。

## 🎯 核心特性

- ✅ **任务清单管理**：使用 TodoWrite 跟踪执行进度
- ✅ **进度实时通知**：每个操作都有清晰的状态提示
- ✅ **强制用户确认**：重要操作前必须等待确认
- ✅ **结构化输出**：使用 emoji 和分隔线提升可读性
- ✅ **完善错误处理**：详细的错误提示和解决方案
- ✅ **安全第一**：自动备份、完整回滚指令
- 🧠 **持续学习系统**：continuous-learning-v2 实时学习会话模式
- 📋 **CHANGELOG 自动化**：Keep a Changelog 格式 + Conventional Commits
- ☕ **Java 项目支持**：Maven Spotless 智能格式化（先检查后格式化）

## 功能概览

### 命令 (Commands)

#### 1. `/quick-commit` - 智能快速提交

智能分析暂存区变更，自动生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交信息。

**功能特点**：
- 🤖 自动推断提交类型（feat/fix/refactor/docs/chore 等）
- 📁 从文件路径智能提取 scope（模块名）
- ✍️ 生成规范的 subject（祈使语气、不超过 50 字符）
- ⚡ 简洁高效的提交流程
- 📝 支持自定义提交消息（带格式验证）
- 🔧 完整 Git 工作流支持
- ☕ **Maven Spotless 智能格式化（Java 项目）** - 先检查后格式化
- 📋 **CHANGELOG.md 自动更新** - Keep a Changelog 格式 + Conventional Commits
- 📊 进度实时通知
- ❌ 完善的错误处理

**使用示例**：
```bash
# 1. 暂存要提交的文件
git add src/api/user.ts

# 2. 自动生成提交消息
/quick-commit
# 自动生成类似：feat(api): 添加用户管理接口
# 如果存在 CHANGELOG.md，会自动添加条目到 [Unreleased] 部分

# 3. 使用自定义消息（会验证格式）
/quick-commit "feat(auth): 添加用户登录功能"
/quick-commit "fix(api): 修复空指针异常"
```

**Maven Spotless 支持**：
- 检测到 Java 项目（pom.xml + spotless-maven-plugin）自动启用
- 先执行 `mvn spotless:check` 检查格式
- 仅在有格式问题时执行 `mvn spotless:apply` 格式化
- 格式化失败可选择跳过或取消提交

**CHANGELOG 自动更新**：
- 检测到 CHANGELOG.md 自动启用
- 从提交消息提取 type、scope 和 subject
- 根据 type 分类到对应章节（Added/Fixed/Changed）
- 自动在 `## [Unreleased]` 下添加条目
- 格式：`- {emoji} {subject} ({scope})`
- 示例：`- ✅ 添加用户登录功能 (auth)`

**Type 推断规则**：
| 文件类型 | 推断类型 | 示例 |
|---------|---------|------|
| 新增功能代码 | `feat` | `feat(auth): 添加登录功能` |
| 修复相关（包含 fix/bug 关键词） | `fix` | `fix(api): 修复空指针异常` |
| 文档文件（.md/README） | `docs` | `docs: 更新安装说明` |
| 测试文件 | `test` | `test(user): 添加用户测试` |
| 依赖文件（package.json） | `build` | `build(deps): 升级 vue 到 3.4` |
| CI 配置 | `ci` | `ci: 添加自动部署` |
| 子模块 | `chore(submodule)` | `chore(submodule): 更新 ai-coder` |
| 配置文件 | `chore` | `chore(config): 调整环境变量` |
| 重构代码 | `refactor` | `refactor(db): 优化查询逻辑` |

#### 2. `/normalize-commits` - 规范化提交历史

分析并清理最近的提交历史，合并重复提交并将不规范提交改写为标准格式。

**功能特点**：
- 🔄 合并重复提交（相同消息、无意义提交）
- ✨ 改写不规范提交为 Conventional Commits 格式
- 📊 通过 git show 分析 diff 智能推断正确的 type 和 scope
- 💾 自动创建备份分支（`back/normalize-YYYYMMDD`）
- 📈 提供结构化的分析报告和统计信息
- 🔒 安全第一：完整的回滚指令和验证
- 🎯 支持自定义分析范围（默认 30 个提交，可指定 5-200）
- ✅ 任务清单跟踪执行进度
- ⚠️ 强制用户确认机制
- 📊 进度实时通知
- ❌ 完善的错误处理

**使用示例**：
```bash
# 分析最近 30 个提交（默认）
/normalize-commits

# 分析最近 50 个提交
/normalize-commits 50

# 分析最近 100 个提交
/normalize-commits 100
```

**处理流程**：
```
1. 分析识别
   ├─ 识别重复提交：相同消息、"1"/"2"/"test"/"wip" 等
   ├─ 识别不规范提交：不符合 Conventional Commits 格式
   └─ 分析每个不规范提交的 diff 推断正确格式

2. 输出分析报告
   ├─ 需要合并的提交分组
   ├─ 需要改写的不规范提交列表
   └─ 统计信息（合并前后提交数、改写数量）

3. 执行处理
   ├─ 创建备份分支
   ├─ 合并重复提交（使用 git rebase -i squash）
   ├─ 改写不规范提交（使用 git rebase -i reword）
   └─ 验证所有提交符合规范

4. 输出简洁报告
   ├─ 统计摘要
   ├─ 备份分支
   └─ 推送/回滚命令
```

**识别模式**：

| 模式 | 示例 | 处理方式 |
|-----|------|---------|
| 完全相同 | "更新"、"更新"、"更新" | 合并为 1 个 |
| 仅数字不同 | "修改1"、"修改2"、"修改3" | 合并为 1 个 |
| 无意义 | "1"、"2"、"test"、"wip" | 合并或删除 |
| 不规范 | "添加功能"、"修改bug" | 改写为规范格式 |

**改写示例**：
```
原提交                        → 规范化后
─────────────────────────────────────────────────
"添加 skills submodule"      → chore(submodule): 添加 skills 子模块
"修改 blacklake plugin 名称" → refactor(plugin): 重命名 blacklake plugin
"修复模板问题"                → fix(template): 修复工作流模板格式问题
"Update submodule"           → chore(submodule): 更新子模块版本
"更新配置"                    → chore(config): 更新配置文件
```

#### 3. Continuous Learning v2 - 持续学习系统（中文版）

**基于"本能(Instinct)"的自我学习架构**，通过 hooks 实时观察会话，创建带置信度评分的原子化学习单元，并演化为技能/命令/代理。

**✨ 已全部翻译为中文**：
- ✅ SKILL.md（混合风格：关键术语保留英文，说明用中文）
- ✅ observer.md（完整中文）
- ✅ observe.sh（注释中文化）
- ✅ config.json（添加中文注释）

**核心特性**：
- 🧠 **原子化本能学习** - 每个本能是一个小的学习单元（trigger + action + 置信度）
- 📊 **置信度系统** - 0.3-0.9 加权，随使用自动调整
- 🔄 **100% 可靠观察** - 使用 PreToolUse/PostToolUse hooks（非概率性）
- 🤖 **后台 Observer Agent** - 使用 Haiku 模型分析（节省成本）
- 🧩 **可演化** - 本能可聚类为技能/命令/代理
- 📤 **可分享** - 导出/导入本能用于团队协作

**工作流程**：
```
会话活动
    ↓
Hooks 捕获（100% 可靠）
    ↓
observations.jsonl
    ↓
Observer Agent 分析
    ↓
创建/更新本能
    ↓
演化为技能
```

**本能示例**：
```yaml
---
id: prefer-grep-before-edit
trigger: "当需要搜索代码进行修改时"
confidence: 0.65
domain: "workflow"
source: "session-observation"
---

# 编辑前先使用 Grep

## Action（行动）
在使用 Edit 之前，总是先使用 Grep 找到精确位置。

## Evidence（证据）
- 在会话 abc123 中观察到 8 次
- 模式：Grep → Read → Edit 序列
```

**检测模式**：
- **用户纠正** - "不，应该用 X 而不是 Y"
- **错误解决** - 错误 → 修复的重复模式
- **重复工作流** - 相同的工具序列
- **工具偏好** - 一致性地优先使用某个工具

**配置说明**：
已在 `hooks/hooks.json` 中配置方案 A（激进派）：
- PreToolUse hook: 观察工具使用前的状态
- PostToolUse hook: 记录工具执行结果
- 数据存储: `~/.claude/homunculus/observations.jsonl`
- 本能存储: `~/.claude/homunculus/instincts/personal/`

**可用命令**：
- `/instinct-status` - 查看所有学习的本能及置信度
- `/evolve` - 将相关本能聚类为技能
- `/instinct-export` - 导出本能用于分享
- `/instinct-import <file>` - 导入他人的本能

**CLAUDE.md 项目规范管理**（v2.1 新增）：
- `instinct-cli.py claude-md add` - 添加项目规范到 CLAUDE.md
- `instinct-cli.py claude-md list` - 列出当前项目所有规范
- `instinct-cli.py claude-md show` - 显示 CLAUDE.md 完整内容
- `instinct-cli.py claude-md init` - 初始化 CLAUDE.md 文件

**置信度等级**：
| 分数 | 含义 | 行为 |
|------|------|------|
| 0.3 | 试探性 | 建议但不强制 |
| 0.5 | 中等 | 相关时应用 |
| 0.7 | 强烈 | 自动批准应用 |
| 0.9 | 几乎确定 | 核心行为 |

**翻译说明**：
- 采用**混合风格**：技术术语保留英文（如 Instinct、Confidence、Observer），说明使用中文
- Claude 对中文文档理解效果**与英文相同**，不影响功能
- 本能文件支持中文 trigger 和 action，可以更贴近中文使用习惯

#### CLAUDE.md 项目规范功能（v2.1 新增）

**与 Instincts 的分工**：
- **Instincts（全局）**：学习通用的工具使用偏好，存储在 `~/.claude/homunculus/`
- **CLAUDE.md（项目级）**：记录项目特定的规范约定，存储在项目根目录 `./CLAUDE.md`

**功能特点**：
- 📝 **项目级存储** - CLAUDE.md 在项目根目录，天然实现项目隔离
- ⚡ **实时写入** - 用户确认后立即生效，不需要等待分析
- 🔄 **不依赖 observations** - 直接写入，不走 observations.jsonl 流程

**典型场景**：
```
用户: "我们项目的 API 返回必须用 { data, code, msg } 格式"
Claude: "好的，我记住了。要把这个规范记录到 CLAUDE.md 中吗？"
用户: "好的"
Claude: [调用 instinct-cli.py claude-md add ...]
        "已记录到 CLAUDE.md 的「API 规范」部分 ✓"
```

**使用示例**：
```bash
# 添加规范
python instinct-cli.py claude-md add --section "API 规范" --content "返回格式必须是 {data, code, msg}"

# 查看规范
python instinct-cli.py claude-md list

# 显示完整内容
python instinct-cli.py claude-md show

# 初始化 CLAUDE.md
python instinct-cli.py claude-md init
```

#### 4. `/code-review` - 代码审查

对给定的 Pull Request 进行全面的代码审查。

**功能特点**：
- 👥 多 Agent 并行审查（4 个专业 agent）
- 📋 CLAUDE.md 合规性检查
- 🐛 Bug 检测和验证
- ✅ 高信号问题过滤（减少误报）
- 💬 内联评论和修复建议

**使用示例**：
```bash
# 在 PR 分支或指定 PR 编号
/code-review
/code-review 123
```

## 📁 项目结构

```
self-assistant-plugin/
├── .claude-plugin/
│   └── plugin.json           # 插件配置
├── hooks/                    # Plugin 级别 hooks
│   ├── hooks.json
│   └── plugin-test-hook.sh
└── skills/                   # Skills 定义
    ├── quick-commit/         # 智能快速提交
    │   ├── SKILL.md
    │   ├── references/       # 详细文档（按需加载）
    │   └── scripts/          # Hook 脚本
    └── normalize-commits/    # 规范化提交历史
        ├── SKILL.md
        └── references/       # 详细文档（按需加载）
```

**架构说明**：
- 所有命令已迁移为 skills，符合 Claude Code 最新规范
- 使用 Progressive Disclosure 模式，详细内容在 references/ 中按需加载
- Hook 脚本放在各 skill 的 scripts/ 目录，实现 skill 级别的生命周期管理

## 🚀 安装

### 方法 1：通过 Claude Code 安装

```bash
# 添加插件目录到 Claude Code 配置
claude config plugins.add /path/to/blacklake-claude-marketplace/plugins/self-assistant-plugin
```

### 方法 2：手动复制

```bash
# 复制到 Claude Code 插件目录
cp -r self-assistant-plugin ~/.claude/plugins/
```

## Git 提交规范参考

本插件遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加用户登录功能` |
| `fix` | Bug 修复 | `fix(api): 修复用户信息接口返回错误` |
| `docs` | 文档更新 | `docs(readme): 更新安装说明` |
| `style` | 代码格式（不影响功能） | `style: 统一缩进为2空格` |
| `refactor` | 重构 | `refactor(utils): 优化日期处理函数` |
| `perf` | 性能优化 | `perf(image): 启用图片懒加载` |
| `test` | 测试相关 | `test(user): 添加用户模块单元测试` |
| `build` | 构建系统或依赖 | `build(npm): 升级 webpack 到 5.0` |
| `ci` | CI 配置 | `ci(github): 添加自动部署流程` |
| `chore` | 其他更改 | `chore(deps): 更新依赖版本` |
| `revert` | 回滚提交 | `revert: 回滚 feat(auth) 登录功能` |

### 示例

```bash
# 新功能
feat(user): 添加用户头像上传功能

# Bug 修复
fix(payment): 修复支付金额计算精度丢失

# 文档更新
docs: 更新 API 文档

# 重构
refactor(db): 重构数据库连接池

# 子模块更新
chore(submodule): 更新 ai-coder 子模块到最新版本

# 带 breaking change
feat(api): 重构用户认证接口

BREAKING CHANGE: 原 /api/login 接口已废弃，请使用 /api/v2/auth/login
```

## 开发指南

### 添加新命令

1. 在 `commands/` 目录创建新的 `.md` 文件
2. 按照以下格式编写：

```markdown
---
description: 命令简短描述
allowed-tools: Bash(git *), TodoWrite
---

## Context

- 动态上下文注入：!`git status`

## Your task

任务描述...
```

### 命令开发最佳实践

1. **Frontmatter 配置**
   - `description`: 简明描述（<60 字符）
   - `allowed-tools`: 严格限制工具权限
   - `model`: 可选，根据复杂度选择（haiku/sonnet/opus）

2. **动态上下文**
   - 使用 `!` 命令获取实时 Git 状态
   - 示例：`!`git log --oneline -10``

3. **任务描述**
   - 清晰明确的目标
   - 具体的执行步骤
   - 预期的输出格式

## 📚 参考文档

各 skill 的 `references/` 目录包含详细的参考文档：

**quick-commit/references/**：
- `commit-types.md`：Conventional Commits 类型详解
- `examples.md`：各种场景的提交消息示例
- `error-handling.md`：错误处理详解

**normalize-commits/references/**：
- `rebase-guide.md`：Git Rebase 操作指南
- `error-handling.md`：错误处理详解（待添加）

这些文档采用 Progressive Disclosure 模式，仅在需要时加载，减少 context 占用。

## 🎨 输出格式示例

### 分析报告

```
📊 提交分析报告

总计：30 个提交
├─ 重复提交：7 个（将合并为 2 个）
├─ 不规范提交：15 个（需改写）
└─ 已规范提交：8 个（无需处理）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

重复提交分组：
...
```

### 完成报告

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
```

## 📋 版本历史

### v1.1.0 (2026-01-12) - 重大优化

**新增功能**：
- ✅ 任务清单管理（使用 TodoWrite）
- ✅ 进度实时通知（emoji + 状态文本）
- ✅ 强制用户确认机制（使用 AskQuestion）
- ✅ 结构化输出格式（分隔线 + 表格）
- ✅ 完善的错误处理章节
- ✅ Git 工作流技能（`skills/git-workflow/`）
- ✅ 通用规范文档（`common/COMMON.md`）

**优化改进**：
- 📝 优化 description 字段（包含完整触发场景）
- 🎨 更新 frontmatter（添加 model、color）
- 📊 改进输出格式（使用 emoji 和分隔线）
- ❌ 增强错误处理（5种常见错误场景）
- 📚 完善文档说明

**参考来源**：
- 基于 17 个官方 Skills 最佳实践
- 参考 log-analyst、es-log、mcp-builder 等优秀示例
- 遵循 Skill Creator 核心原则

### v1.0.0 (2026-01-08)

- ✨ 新增 `quick-commit` 命令：智能生成规范提交
- ✨ 新增 `normalize-commits` 命令：规范化提交历史
- ✨ 新增 `code-review` 命令：PR 代码审查
- 📝 完善插件文档和使用说明

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 相关链接

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Git Best Practices](https://git-scm.com/book/en/v2)
