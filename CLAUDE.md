# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是 Claude Code 插件市场项目（blacklake-claude-marketplace），提供 Blacklake 平台运维、代码开发和个人效率工具的专业插件集合。

**核心架构**：插件市场 → 多个专业插件 → Agents/Skills/Commands → MCP 服务

**统一版本管理**：所有插件版本与 marketplace 主版本同步（当前 1.1.0）

## 常用命令

### 版本管理

```bash
# 查看当前版本（marketplace.json 和所有 plugin.json）
grep -r '"version"' .claude-plugin/marketplace.json plugins/*/.claude-plugin/plugin.json

# 升级版本（使用 quick-commit 自动升级版本号）
/quick-commit --upgrade-version
```

### 测试和验证

```bash
# 验证插件配置
cat .claude-plugin/marketplace.json | jq '.plugins[].name'

# 列出所有 agents
find plugins -name "*.md" -path "*/agents/*" | grep -v COMMON

# 列出所有 skills
find plugins -name "SKILL.md"
```

### Git 工作流（推荐使用 self-assistant-plugin）

```bash
# 智能提交（自动分析变更，生成规范的 Conventional Commits）
/quick-commit

# 规范化提交历史（合并重复提交 + 改写不规范提交）
/normalize-commits

# 代码审查
/code-review
```

## 架构设计

### 插件分层架构

```
Marketplace (blacklake-claude-marketplace)
├── Plugins（7个核心插件）
│   ├── blacklake-plugin（Blacklake 运维助手）
│   │   ├── Agents（7个）：业务逻辑编排层
│   │   ├── Skills（8个）：程序性知识层
│   │   └── MCP Servers：数据访问层（op, mongo-feature）
│   ├── self-assistant-plugin（个人效率助手）
│   │   ├── Commands（3个）：quick-commit, normalize-commits, code-review
│   │   ├── Skills（2个）：git-workflow, continuous-learning-v2
│   │   └── Hooks（6个）：安全防护 + 通知 + 持续学习
│   └── 其他插件（coder-beta, coder-flow, coder-web, op, mcp）
```

### 设计原则

1. **Agent → Skills → MCP 分层**：Agent 编排任务流程，Skills 提供程序性知识，MCP 提供数据访问
2. **自包含性**：每个 Skill 自包含，通过符号链接（COMMON.md）共享通用规范
3. **版本统一**：所有插件版本号与 marketplace 主版本同步
4. **职责分离**：Agent 负责 "做什么"，Skill 负责 "怎么做"

### 关键文件映射

- `.claude-plugin/marketplace.json` - 市场配置（主版本号 + 所有插件列表）
- `plugins/*/. claude-plugin/plugin.json` - 各插件配置（版本号、MCP 服务器）
- `plugins/*/agents/*.md` - Agent 定义（业务逻辑编排）
- `plugins/*/skills/*/SKILL.md` - Skill 定义（程序性知识）
- `plugins/*/commands/*.md` - 命令定义（用户可调用）
- `CHANGELOG.md` - 变更历史（Keep a Changelog 格式）
- `VERSION_MANAGEMENT.md` - 版本管理策略

## 核心插件详解

### blacklake-plugin（最重要）

**用途**：Blacklake 内部运维、工作流排查、连接器配置、平台数据分析

**核心 Agents**：
- `workflow-troubleshooter` - 工作流问题排查（Jaeger 追踪、节点诊断）
- `platform-analyst` - 平台数据统计分析（多维度查询）
- `connector-registrar` - 连接器配置生成（自动 SQL 生成）
- `log-analyst` - ES 日志分析（查询、写入、删除）

**MCP 服务**：
- `op`（https://op-mcp-test.blacklake.tech/mcp）- 工作流、租户、API 查询
- `mongo-feature` - MongoDB 业务对象数据查询（仅 Feature 环境）

**Skills 知识库**：
- `db-common` - 通用数据库查询工作流
- `db-metadata` - v3_metadata（对象编码、事件、按钮配置）
- `db-openapi` - v3_openapi（连接器、API 配置）
- `db-user` - v3_user（租户、组织信息）
- `db-e-report` - v3_e-report（数据分析告警）
- `es-log` - ES 日志操作（查询、写入、删除、造数据）
- `es-access-log` - HTTP 访问日志只读查询（Trace 链路追踪）
- `mongo-object` - MongoDB 业务对象查询（仅 Feature 环境）

**设计特点**：
- Agent 不直接调用 MCP 工具，而是通过 Skills 提供的程序性知识
- 所有 Skills 通过符号链接共享 `common/COMMON.md`
- 严格的环境隔离（Feature/Test/Prod）

### self-assistant-plugin（效率工具）

**用途**：Git 工作流优化、代码审查、安全防护、持续学习

**核心 Commands**：
- `/quick-commit` - 智能快速提交（Maven Spotless + CHANGELOG 自动更新）
- `/normalize-commits` - 规范化提交历史（合并 + 改写）
- `/code-review` - PR 代码审查（多 Agent 并行）

**核心 Skills**：
- `git-workflow` - Conventional Commits 规范、Type/Scope 推断、Rebase 指南
- `continuous-learning-v2` - 持续学习系统（基于本能 Instinct 的学习架构）

**Hooks 系统**（6个）：
- `PreToolUse` - 安全防护（危险命令阻止 + 敏感文件保护）+ 持续学习观察
- `PostToolUse` - 持续学习记录
- `Notification` - Mac 通知 + Ping 音效
- `Stop` - quick-commit 完成通知

**关键特性**：
- 自动安全防护（阻止 `rm -rf`、保护 `.env`、`credentials.json`）
- 智能通知（需要输入时 Mac 通知 + 音效）
- 持续学习（自动观察工具使用模式，创建可复用经验）
- Maven Spotless 集成（Java 项目自动格式化）
- CHANGELOG 自动更新（Keep a Changelog 格式）

## 开发规范

### 版本升级流程

#### 版本管理策略

**本项目采用统一版本号管理**：

- **版本格式**：`x.y.z`（主版本号.次版本号.修订号）
- **升级规则**：
  - 修改任何 plugin 的代码 → 升级该 plugin 的版本号（`z+1`）
  - 同时升级 marketplace 主版本号（保持所有版本同步）
- **默认升级**：最低位版本号（`z`），如 `1.0.11 → 1.0.12`
- **版本同步**：所有 plugin 版本号与 marketplace 主版本保持一致

**需要更新的文件**：

1. `.claude-plugin/marketplace.json`（顶层 `version` + 所有插件的 `version`）
2. `plugins/*/.claude-plugin/plugin.json`（每个插件的 `version`）
3. `CHANGELOG.md`（添加变更记录）

#### 升级方式

**方式1：提交时主动说明（推荐）**

```bash
# 在提交时明确说明需要升级版本
/quick-commit 升级版本后提交

# 或者在对话中说明
"帮我提交代码，需要先升级版本号"
```

Claude 会：
1. 自动检测所有版本文件（`.claude-plugin/plugin.json`、`package.json`、`pom.xml` 等）
2. 升级最低位版本号（如 `1.0.11 → 1.0.12`）
3. 自动暂存版本文件
4. 生成规范的提交消息并提交

**方式2：手动升级后提交**

```bash
# 1. 手动编辑版本文件
# 2. 使用 quick-commit 提交
/quick-commit
```

**说明**：
- quick-commit 默认不再自动检测版本文件，提交流程更快
- 需要升级版本时，用户主动说明即可
- 对于本项目（需要统一升级多个文件），推荐方式1

### Git 提交规范

**必须遵循 Conventional Commits 规范**：

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Type 类型**：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `chore` - 构建/工具/配置变更
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关

**推荐方式**：使用 `/quick-commit` 自动生成规范提交消息

### Skill 开发规范

**必须包含的文件**：
- `SKILL.md` - Skill 主文档（包含完整说明）
- `COMMON.md` - 通用规范（符号链接到 `common/COMMON.md`）

**Frontmatter 要求**：
```yaml
---
name: skill-name
description: 简短描述（包含使用时机和触发词）
model: sonnet  # 或 haiku（简单任务）
color: blue    # 或 green, purple
---
```

**设计模式**：
- 渐进式披露（Progressive Disclosure）
- 决策树工作流（Decision Tree）
- 强制性表达（Mandatory Expression）

### Agent 开发规范

**必须包含的内容**：
- Agent 角色定义
- 核心工作流程
- 输入输出格式
- 错误处理
- 使用场景示例

**不应该**：
- Agent 不直接调用 MCP 工具（应通过 Skills）
- 不硬编码环境配置（使用参数化）
- 不缺少错误处理（至少 3-5 种错误场景）

## MCP 服务器

### op 服务（Blacklake 运维）

**URL**：https://op-mcp-test.blacklake.tech/mcp

**核心工具**：
- `exec_sql` - 执行 SQL 查询（仅只读）
- `query_org_info` - 查询租户信息
- `query_workflow_*` - 工作流相关查询
- `query_meta_detail` - 查询业务逻辑元数据
- `generate_ids` - 批量生成全局唯一 ID
- `data_sync` - 对象库主数据同步（需用户确认）

**环境支持**：Feature, Test, Pre, Prod-Ali, Prod-HW, Prod-GT

### mongo-feature 服务

**仅用于**：查询 Feature 环境的业务对象实例数据

**禁止用于**：工作流排查、元数据查询、租户查询（这些场景使用 `exec_sql`）

## 常见任务模式

### 查询租户信息

```
使用 platform-analyst agent:
"查询工厂 BLK001 的信息"
→ 自动调用 query_org_info
→ 返回租户 ID、云平台、状态等
```

### 工作流问题排查

```
使用 workflow-troubleshooter agent:
"工作流实例 12345 执行失败了，帮我排查"
→ 查询实例日志
→ 分析节点执行树
→ 定位失败节点和错误原因
→ 生成 Jaeger 追踪链接
→ 提供修复建议
```

### 连接器配置

```
使用 connector-registrar agent:
"配置一个连接器，调用 ERP 订单查询接口"
→ 询问接口信息（Base URL、路径、方法、参数）
→ 生成唯一 ID
→ 生成配置 SQL（连接器 + 接口）
```

### Git 提交

```
直接使用 quick-commit:
"/quick-commit"
→ 分析变更（git status + git diff）
→ 推断 type 和 scope
→ 生成规范的提交消息
→ 执行提交
→ 询问是否推送
```

## 注意事项

### 安全防护

- `.env`、`credentials.json`、`id_rsa` 等敏感文件会被 PreToolUse Hook 自动保护
- 危险命令（`rm -rf`、fork bomb）会被自动阻止
- 所有 SQL 查询都是只读的（禁止 INSERT/UPDATE/DELETE）

### 持续学习系统

- 通过 Hooks 自动观察工具使用模式（100% 可靠）
- 观察记录存储在 `~/.claude/homunculus/observations.jsonl`
- 本能存储在 `~/.claude/homunculus/instincts/`
- 可使用 `/evolve` 命令将本能演化为 Skills/Commands/Agents

### 日志位置

```
<project>/.claude/logs/YYYY-MM-DD/
├── events.jsonl              # 所有事件详细日志
├── user_prompt_submit.json   # 用户输入记录
├── pre_tool_use.json         # 安全检查记录
├── post_tool_use.json        # 操作记录
└── notification.json         # 通知记录
```

### 符号链接

macOS/Linux 创建符号链接：
```bash
cd plugins/blacklake-plugin/skills/db-common
ln -s ../../common/COMMON.md COMMON.md
```

Windows 需要管理员权限：
```powershell
New-Item -ItemType SymbolicLink -Path COMMON.md -Target ..\..\common\COMMON.md
```

## 参考资源

- **项目文档**：README.md（完整使用说明）、CHANGELOG.md（变更历史）、VERSION_MANAGEMENT.md（版本管理）
- **插件文档**：plugins/blacklake-plugin/README.md、plugins/self-assistant-plugin/README.md
- **官方文档**：https://claude.com/blog/skills-explained（Claude Code Skills 说明）
- **在线体验**：https://ai-coder-test.blacklake.tech/（无需安装，打开即用）
