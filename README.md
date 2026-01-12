# Claude Marketplace

Claude Code 插件市场项目，提供代码开发和 OP 平台相关的插件集合。

## 项目简介

`blacklake-claude-marketplace` 是一个 Claude Code 插件市场，包含多个核心插件：

- **self-assistant-plugin**：个人效率助手插件（Git 提交规范化、智能快速提交、代码审查）
- **blacklake-plugin**：Blacklake 内部运维助手插件（工作流排查、连接器配置、平台分析、数据库操作）
- **op-plugin**：OP 平台插件（工作流、连接器、事件和数据库相关的 agents 和 skills）
- **coder-flow-plugin**：流程开发插件（designer、developer agents）
- **coder-web-plugin**：Web 开发插件（frontend-html、frontend-react agents）
- **coder-beta-plugin**：Beta 开发插件（frontend agents）
- **mcp-plugin**：MCP 服务器配置插件

## 项目结构

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # 市场文件
└── plugins/
    ├── coder-flow/                # 流程开发插件
    ├── coder-web/                 # Web 开发插件
    ├── coder-explore/             # 探索插件
    └── op-plugin/                 # OP 平台插件
```

## Claude Code CLI 配置

### 方式一：插件市场安装（官方推荐）

通过插件市场统一管理和分发插件，这是官方推荐的方式：

```bash
# 添加市场
/plugin marketplace add Blacklake-Tech/blacklake-claude-marketplace

# 安装插件
/plugin install op-plugin@blacklake-claude-marketplace
/plugin install coder-flow@blacklake-claude-marketplace
/plugin install coder-web@blacklake-claude-marketplace
/plugin install coder-explore@blacklake-claude-marketplace

# 或交互式浏览并安装
/plugin
```

**优势**：
- 统一管理多个插件
- 版本控制和自动更新
- 团队分发更方便
- 支持插件发现和浏览

### 方式二：GitHub 直接安装

直接从 GitHub 存储库安装插件：

```bash
# 直接从 GitHub 安装插件
/plugin install op-plugin@github:Blacklake-Tech/blacklake-claude-marketplace
/plugin install coder-flow@github:Blacklake-Tech/blacklake-claude-marketplace
/plugin install coder-web@github:Blacklake-Tech/blacklake-claude-marketplace
/plugin install coder-explore@github:Blacklake-Tech/blacklake-claude-marketplace
```

### 方式三：项目内自动识别

将市场项目克隆到项目目录中，Claude Code 会自动扫描并加载：

```bash
# 克隆到项目目录
git clone git@github.com:Blacklake-Tech/blacklake-claude-marketplace.git plugins/claude-marketplace

# 或使用 submodule
git submodule add git@github.com:Blacklake-Tech/blacklake-claude-marketplace.git plugins/claude-marketplace

# 启动 Claude Code，插件会自动加载
claude
```

### 方式四：作为依赖项加载特定插件

在项目代码中直接指定插件路径（适用于 SDK 集成）：

```python
from claude_agent_sdk import ClaudeAgentOptions

# 只加载 op-plugin
options = ClaudeAgentOptions(
    plugins=[
        {
            "type": "local",
            "path": "./plugins/claude-marketplace/plugins/op-plugin"
        }
    ]
)

# 只加载 coder-flow（流程开发）
options = ClaudeAgentOptions(
    plugins=[
        {
            "type": "local",
            "path": "./plugins/claude-marketplace/plugins/coder-flow"
        }
    ]
)

# 只加载 coder-web（Web 开发）
options = ClaudeAgentOptions(
    plugins=[
        {
            "type": "local",
            "path": "./plugins/claude-marketplace/plugins/coder-web"
        }
    ]
)

# 只加载 coder-explore（探索）
options = ClaudeAgentOptions(
    plugins=[
        {
            "type": "local",
            "path": "./plugins/claude-marketplace/plugins/coder-explore"
        }
    ]
)
```

### 验证配置

```bash
# 使用调试模式查看插件加载情况
claude --debug

# 列出已安装的插件
/plugin list

# 列出已添加的市场
/plugin marketplace list

# 在 Claude Code 中验证
# 使用 /agents 命令查看可用 agents
```

### 删除配置

```bash
# 删除市场（不会删除已安装的插件）
/plugin marketplace remove Blacklake-Tech/blacklake-claude-marketplace

# 删除插件（需单独删除）
/plugin uninstall op-plugin@blacklake-claude-marketplace
/plugin uninstall coder-flow@blacklake-claude-marketplace
/plugin uninstall coder-web@blacklake-claude-marketplace
/plugin uninstall coder-explore@blacklake-claude-marketplace

# 删除 MCP
/mcp remove <mcp-name>
```

**注意**：删除市场不会自动删除已安装的插件，需要单独执行删除插件命令。

## 插件说明

### self-assistant-plugin ⭐ (v2.0.0)

**个人效率助手插件**，提供 Git 工作流优化和代码审查功能。

**Commands**：
- `/quick-commit` - 智能快速提交（自动生成 Conventional Commits 格式）
- `/normalize-commits` - 规范化提交历史（合并重复 + 改写不规范）
- `/code-review` - PR 代码审查（多 Agent 并行审查）

**Skills**：
- `git-workflow` - Git 工作流程序性知识（Conventional Commits 规范、Type/Scope 推断、Rebase 操作指南）

**核心特性**：
- ✅ 任务清单管理（TodoWrite）
- ✅ 进度实时通知（emoji + 状态文本）
- ✅ 强制用户确认（AskQuestion）
- ✅ 结构化输出（分隔线 + 表格）
- ✅ 完善错误处理（5种错误场景）
- ✅ 安全第一（自动备份 + 回滚指令）

**参考来源**：基于17个官方 Skills 最佳实践（pdf, docx, pptx, xlsx, mcp-builder, algorithmic-art, canvas-design, frontend-design, internal-comms 等）

### blacklake-plugin (v1.0.4)

**Blacklake 内部运维助手插件**，专注于工作流问题排查和平台数据分析。

**Agents**：
- `workflow-troubleshooter` - 工作流排查和诊断
- `connector-registrar` - 连接器配置 SQL 生成
- `platform-analyst` - 平台数据统计分析
- `button-configurator` - 按钮配置 SQL 生成
- `event-configurator` - 事件配置 JSON/SQL 生成
- `log-analyst` - ES 日志分析专家

**Skills**：
- `db-common` - 通用数据库查询工作流程
- `db-metadata` - v3_metadata 数据库查询
- `db-openapi` - v3_openapi 数据库查询
- `db-user` - v3_user 数据库查询
- `db-e-report` - v3_e-report 数据库查询
- `es-log` - ES 日志查询和写入

### op-plugin (v1.0.4)

**OP 平台插件**，提供工作流、连接器、事件和数据库操作。

**Agents**：`op-button`、`op-connector`、`op-event`、`op-workflow`、`op-statistics`

**Skills**：`op-db`、`op-db-metadata`、`op-db-openapi`、`op-db-user`、`op-db-e-report`

### coder-flow-plugin (v1.0.4)

**流程开发插件**，包含：
- `designer` - 系统集成方案设计专家
- `developer` - 资深 Java 开发工程师

### coder-web-plugin (v1.0.4)

**Web 开发插件**，包含：
- `frontend-html` - 通用 Web 页面生成专家
- `frontend-react` - 专业 React 应用开发专家

### coder-beta-plugin (v1.0.4)

**Beta 开发插件**，包含前端开发 agents。

### mcp-plugin (v1.0.4)

**MCP 服务器配置插件**，用于 OP 平台集成。

## 版本管理

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：`主版本号.次版本号.修订号`

**当前版本**：`2.0.0`

**更新策略**：
- 重大功能更新或 API 变更：升级主版本号（如 `1.0.1` → `2.0.0`）
- 新增功能：升级次版本号（如 `1.0.1` → `1.1.0`）
- 文档优化、bug 修复等小更新：升级修订号（如 `1.0.1` → `1.0.2`）

**详细信息**：
- 版本管理策略：[VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md)
- 变更历史：[CHANGELOG.md](./CHANGELOG.md)
