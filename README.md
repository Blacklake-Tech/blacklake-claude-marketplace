# Blacklake Claude Marketplace

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/Blacklake-Tech/blacklake-claude-marketplace)
[![Online Demo](https://img.shields.io/badge/demo-online-success.svg)](https://ai-coder-test.blacklake.tech/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Claude Code 插件市场项目，提供 Blacklake 平台运维、代码开发和个人效率工具的专业插件集合。

> 🌐 **在线体验**: [https://ai-coder-test.blacklake.tech/](https://ai-coder-test.blacklake.tech/) - 无需安装，打开即用！

## 目录

- [亮点特性](#亮点特性-)
- [快速开始](#快速开始-)
- [使用场景](#使用场景-)
- [插件生态](#插件生态-)
- [更多示例](#更多示例-)
- [完整文档](#完整文档-)
- [常见问题](#常见问题-)
- [团队协作](#团队协作-)
- [贡献指南](#贡献指南-)
- [更新日志](#更新日志-)
- [许可证](#许可证-)

---

## 亮点特性 ✨

- 🎯 **专业化**: 7 个核心插件覆盖平台运维、代码开发、效率工具等多个领域，每个插件专注特定功能
- 🚀 **开箱即用**: 预配置 MCP 服务，统一版本管理，安装后立即可用
- 🌐 **双模式**: 支持在线平台和本地 Claude Code 两种使用方式，灵活适配不同场景
- 🤖 **智能化**: 20+ 专业 Agents 自动处理复杂任务，6+ Skills 提供深度领域知识
- 🔄 **版本同步**: 统一版本管理确保所有插件兼容性，自动更新始终最新

---

## 快速开始 🚀

### 方式一：使用在线版本（推荐新手）

最简单的方式，无需任何安装配置：

1. 访问 [https://ai-coder-test.blacklake.tech/](https://ai-coder-test.blacklake.tech/)
2. 登录后即可使用，所有 Blacklake 插件已预配置
3. 开始对话，直接使用各种功能

**优势**:
- ✅ 无需安装，打开即用
- ✅ 自动更新，始终最新版本
- ✅ 团队协作，数据云端同步
- ✅ 移动办公，随时随地访问

### 方式二：在 Claude Code 上安装

适合本地开发和企业内网使用：

```bash
# 1. 添加插件市场
/plugin marketplace add Blacklake-Tech/blacklake-claude-marketplace

# 2. 安装所需插件
/plugin install blacklake-plugin@blacklake-claude-marketplace
/plugin install self-assistant-plugin@blacklake-claude-marketplace

# 3. 验证安装
/plugin list

# 4. 开始使用
# 直接对话即可，Claude 会自动调用相应的 agent
```

更多安装方式请参考 [完整文档 - 安装配置](#完整文档-)。

---

## 使用场景 💡

安装完成后，就可以直接对话使用了！下面是几个实用示例：

### 示例 1: 查询工厂信息

```
用户: "查询一下 BLK001 工厂的信息"

Claude 自动执行:
1. 🤖 调用 platform-analyst agent
2. 🔍 使用 MCP 工具 query_org_info 查询租户信息
3. 📊 返回结构化结果

输出:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 工厂信息

工厂编号: BLK001
工厂名称: 黑湖智造（示例工厂）
租户ID: 12345
云平台: prod-ali (阿里云)
状态: ✅ 启用中
到期时间: 2026-12-31
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 示例 2: 配置第三方接口连接器

```
用户: "帮我配置一个连接器，调用 ERP 系统的订单查询接口"

Claude 自动执行:
1. 🤖 调用 connector-registrar agent
2. ❓ 询问接口详细信息:
   - 接口名称
   - Base URL
   - 接口路径
   - 请求方法
   - 参数定义
3. 🔧 使用 MCP 工具 generate_ids 生成唯一ID
4. 📝 生成完整的配置 SQL

输出:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 连接器配置 SQL

-- 连接器配置
INSERT INTO integrated_connector (id, name, base_url, ...)
VALUES (1234567890, 'ERP订单查询', 'https://erp.example.com', ...);

-- 接口配置
INSERT INTO integrated_connector_action (id, connector_id, path, method, ...)
VALUES (1234567891, 1234567890, '/api/orders/{orderId}', 'GET', ...);

✅ 配置已生成，可在对应环境数据库执行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 示例 3: 查询对象自定义字段

```
用户: "查询一下 prod-ali 环境，BLK001 工厂，采购订单对象的自定义字段"

Claude 自动执行:
1. 🤖 调用 platform-analyst agent + db-metadata skill
2. 🔍 先查询工厂信息获取 org_id
3. 📊 使用 MCP 工具 exec_sql 查询自定义字段
4. 📋 整理并返回结果

输出:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 采购订单 - 自定义字段列表

工厂: BLK001 (黑湖智造)
对象: purchase_order (采购订单)
环境: prod-ali

自定义字段 (5个):
┌────────────────┬──────────┬─────────┐
│ 字段编码       │ 字段名称 │ 字段类型│
├────────────────┼──────────┼─────────┤
│ supplier_level │ 供应商等级│ 下拉选择│
│ payment_method │ 付款方式  │ 单选    │
│ delivery_date  │ 期望交付日│ 日期    │
│ remark         │ 备注     │ 多行文本│
│ attachment     │ 附件     │ 附件    │
└────────────────┴──────────┴─────────┘

✅ 查询完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 插件生态 📦

`blacklake-claude-marketplace` 包含 **7 个核心插件**，覆盖平台运维、代码开发、效率工具等多个领域。

### 核心插件一览

| 插件 | 版本 | 功能概述 |
|------|------|----------|
| **blacklake-plugin** | v1.0.10 | Blacklake 内部运维助手 - 工作流排查、连接器配置、平台数据分析 |
| **self-assistant-plugin** | v1.0.0 | 个人效率助手 - Git 工作流优化和代码审查 |
| **coder-beta-plugin** | v1.0.4 | Beta 开发插件 - 多种前端框架开发支持 |
| **coder-flow-plugin** | v1.0.4 | 流程开发插件 - 系统集成架构设计与 Java 开发 |
| **coder-web-plugin** | v1.0.4 | Web 开发插件 - React 应用开发专家 |
| **op-plugin** | v1.0.4 | OP 平台插件 - 工作流、连接器、事件和数据库操作 |
| **mcp-plugin** | v1.0.4 | MCP 服务配置插件 - 为其他插件提供统一的 MCP 服务 |

<details>
<summary><b>📦 blacklake-plugin (v1.0.9) - Blacklake 内部运维助手</b></summary>

**专注于工作流问题排查、连接器配置、平台数据分析和数据库操作**

**MCP 服务**: op (https://op-mcp-test.blacklake.tech/mcp)

**Agents (7个)**:

| Agent | 功能描述 |
|-------|----------|
| `workflow-troubleshooter` | 🔍 工作流排查专家 - 快速定位和分析工作流执行问题 |
| `connector-registrar` | 🔌 连接器配置专家 - 根据接口信息生成准确的连接器配置 SQL |
| `platform-analyst` | 📊 平台数据分析专家 - 支持多维度数据统计查询 |
| `button-configurator` | 🔘 按钮配置专家 - 根据业务需求生成按钮配置 SQL |
| `event-configurator` | ⚡事件配置专家 - 生成业务事件配置 JSON 和 SQL |
| `log-analyst` | 📝 ES 日志分析专家 - 日志查询、生产数据造数和时间修改 |
| `op-connector` | 🔌 连接器配置专家 (备用) - 同 connector-registrar 功能 |

**Skills (6个)**:

| Skill | 功能描述 |
|-------|----------|
| `db-common` | 🗄️ 通用数据库查询 - 提供标准查询工作流程、SQL 模板和结果分析 |
| `db-metadata` | 📋 元数据库查询 (v3_metadata) - 对象编码、事件、按钮配置、自定义字段等 |
| `db-openapi` | 🔗 OpenAPI 库查询 (v3_openapi) - 集成连接器和 API 配置查询 |
| `db-user` | 👤 用户库查询 (v3_user) - 租户和组织信息查询 |
| `db-e-report` | 📈 报表库查询 (v3_e-report) - 数据分析告警配置查询 |
| `es-log` | 📊 ES 日志操作 - 支持日志查询、写入、删除，支持线上数据造数到测试环境 |
| `es-access-log` | 🔍 HTTP 访问日志只读查询 - Trace 链路追踪、关键字搜索、服务/时间过滤 |
| `mongo-object` | 🗄️ MongoDB 数据库查询 - object_project_feature 只读查询支持 |

**核心 MCP 工具**:
- `exec_sql` - 执行 SQL 查询
- `query_org_info` - 查询租户信息
- `query_workflow_*` - 工作流相关查询
- `query_meta_detail` - 查询业务逻辑元数据
- `generate_ids` - 批量生成全局唯一 ID
- `data_sync` - 对象库主数据同步

**适用场景**:
- ✅ 工作流执行失败排查
- ✅ 连接器快速配置
- ✅ 平台数据统计分析
- ✅ 测试环境数据准备
- ✅ 数据库配置查询

</details>

<details>
<summary><b>📦 self-assistant-plugin (v1.1.0) - 个人效率助手</b></summary>

**提供 Git 工作流优化、代码审查、安全防护和持续学习功能**

**作者**: Siting

**Commands (3个)**:

| Command | 功能描述 |
|---------|----------|
| `/quick-commit` | 🚀 智能快速提交 - 自动分析变更，生成符合 Conventional Commits 规范的提交消息。支持 Maven Spotless 智能格式化、CHANGELOG 自动更新 |
| `/normalize-commits` | 🔧 规范化提交历史 - 合并重复提交 + 改写不规范提交为标准格式 |
| `/code-review` | 👀 PR 代码审查 - 多 Agent 并行审查，提供专业的代码质量反馈 |

**Skills (2个)**:

| Skill | 功能描述 |
|-------|----------|
| `git-workflow` | 📚 Git 工作流知识库 - Conventional Commits 规范、Type/Scope 推断规则、Rebase 操作指南 |
| `continuous-learning-v2` | 🧠 **持续学习系统（中文版）** - 基于本能(Instinct)的自我学习架构，实时观察会话并自动创建可复用的经验 |

**Hooks (6个)** - 自动安全防护、智能提醒和持续学习:

| Hook | 功能描述 |
|------|----------|
| `UserPromptSubmit` | 📝 记录所有用户输入，用于审计和分析 |
| `PreToolUse` | 🛡️ 安全防护 - 阻止危险命令（rm -rf, fork bomb）和敏感文件访问（.env, credentials, SSH keys）<br/>🧠 **持续学习** - 自动观察工具使用前的状态 |
| `PostToolUse` | 📊 记录所有工具执行结果<br/>🧠 **持续学习** - 自动观察工具使用后的结果 |
| `Notification` | 📱 Claude 需要输入时发送 Mac 通知 + Ping 音效 |
| `PermissionRequest` | 🔐 记录权限请求 |
| `Stop` | ✅ quick-commit 执行完成通知 |

**核心特性**:
- ✅ 任务清单管理 (TodoWrite)
- ✅ 进度实时通知 (emoji + 状态文本)
- ✅ 强制用户确认 (AskQuestion)
- ✅ 结构化输出 (分隔线 + 表格)
- ✅ 完善错误处理
- ✅ 安全第一 (自动备份 + 回滚指令)
- ✅ 智能安全防护（危险命令 + 敏感文件保护）
- ✅ 智能通知提醒（Ping 音效 + Mac 通知）
- ✅ 完整日志记录（按日期组织）
- ✅ 🆕 **持续学习系统** - 自动学习使用模式并创建可复用经验
- ✅ 🆕 **Maven Spotless 集成** - Java 项目自动格式化（先检查后格式化）
- ✅ 🆕 **CHANGELOG 自动更新** - Keep a Changelog 格式 + Conventional Commits

**持续学习系统（continuous-learning-v2）**:
- 🧠 **自动观察** - 通过 hooks 实时捕获工具使用模式（100% 可靠）
- 📊 **置信度评分** - 0.3-0.9 加权，随使用自动调整
- 🎯 **原子化本能** - 小型学习单元，可演化为技能/命令
- 🌐 **完整中文支持** - 所有文档已翻译，支持中文本能
- 📤 **团队分享** - 导出/导入本能，团队协作

**quick-commit 增强功能**:
- ☕ **Maven Spotless 支持** - 检测到 Java 项目自动格式化
- 📋 **CHANGELOG 自动更新** - 提交时自动更新 CHANGELOG.md
- 🔧 **智能策略** - 先检查后格式化，仅在需要时执行

**日志位置**:
```
<project>/.claude/logs/
├── 2026-02-05/
│   ├── events.jsonl              # 所有事件详细日志
│   ├── user_prompt_submit.json   # 用户输入记录
│   ├── pre_tool_use.json         # 安全检查记录
│   ├── post_tool_use.json        # 操作记录
│   └── notification.json         # 通知记录
└── 2026-02-06/
    └── ...
```

**安全防护示例**:
```bash
# 危险命令自动阻止
"删除所有文件"                    → 🚨 BLOCKED
"执行 rm -rf /"                   → 🚨 BLOCKED

# 敏感文件自动保护
"读取 .env 文件"                  → 🔐 BLOCKED
"读取 credentials.json"           → 🔐 BLOCKED
"读取 .env.example"               → ✅ 允许（模板文件）
```

**通知提醒**:
- 📱 Claude 需要输入时自动发送 Mac 通知
- 🔊 Ping 音效（清脆的 AI 提示音）
- 📝 所有通知事件自动记录

</details>

<details>
<summary><b>📦 coder-beta-plugin (v1.0.4) - Beta 开发插件</b></summary>

**提供多种前端框架的开发支持**

**Agents (4个)**:

| Agent | 功能描述 |
|-------|----------|
| `frontend-ant` | 🐜 Ant Design Pro 专家 - 企业级应用开发 (React 18 + Ant Design Pro + UmiJS 4.x) |
| `frontend-html` | 📄 纯 HTML/CSS/JS 专家 - 原生 Web 开发 |
| `frontend-react` | ⚛️ React 专家 - React 18+ Hooks 应用开发 |
| `frontend-vue` | 💚 Vue.js 专家 - Vue.js 应用开发 |

**Skills (1个)**:

| Skill | 功能描述 |
|-------|----------|
| `web-build` | 🏗️ 通用 Web 构建工具 - 自动检测项目类型，执行构建并生成预览链接 |

**包含模板**:
- mes-dashboard - MES 看板模板
- report-app - 报表应用模板
- report-h5 - H5 移动端报表模板

**适用场景**:
- ✅ 企业级管理系统开发
- ✅ 数据可视化看板
- ✅ 移动端 H5 应用
- ✅ 原型快速搭建

</details>

<details>
<summary><b>📦 coder-flow-plugin (v1.0.4) - 流程开发插件</b></summary>

**系统集成架构设计与 Java 开发**

**Agents (2个)**:

| Agent | 功能描述 |
|-------|----------|
| `designer` | 🎨 系统集成方案设计专家 - 需求分析和架构设计，输出 design.md 和 plan.md |
| `developer` | 👨‍💻 资深 Java 开发工程师 - 将设计文档转化为高质量的可执行代码 |

**工作流程**:
1. `designer` 负责需求分析和方案设计（不生成代码）
2. `developer` 根据设计文档实现代码（仅编辑 Flow.java）
3. 清晰的职责分离，确保代码质量

</details>

<details>
<summary><b>📦 coder-web-plugin (v1.0.4) - Web 开发插件</b></summary>

**React 应用开发专家**

**Agents (1个)**:

| Agent | 功能描述 |
|-------|----------|
| `frontend-react` | ⚛️ React 应用开发专家 - React 18+ (Hooks)、ES Modules、内联样式/CSS Modules |

**Skills (1个)**:

| Skill | 功能描述 |
|-------|----------|
| `web-build` | 🏗️ 通用 Web 构建工具 - 自动检测项目类型并执行构建 |

**包含模板**:
- mes-dashboard
- report-h5
- report-app

</details>

<details>
<summary><b>📦 op-plugin (v1.0.4) - OP 平台插件</b></summary>

**提供工作流、连接器、事件和数据库操作**

**MCP 服务**: op (https://op-mcp-test.blacklake.tech/mcp)

**Agents (4个)**:

| Agent | 功能描述 |
|-------|----------|
| `op-workflow` | 🔄 工作流排查专家 - 快速定位工作流执行问题 |
| `op-button` | 🔘 按钮配置专家 - 生成按钮配置 SQL |
| `op-event` | ⚡ 事件配置专家 - 生成事件配置 JSON |
| `op-statistics` | 📊 平台数据统计专家 - 多维度数据分析 |

**Skills (5个)**:

| Skill | 功能描述 |
|-------|----------|
| `op-db` | 🗄️ 基础数据库操作 - 通用查询工作流程 |
| `op-db-metadata` | 📋 v3_metadata 查询模板 |
| `op-db-openapi` | 🔗 v3_openapi 查询模板 |
| `op-db-user` | 👤 v3_user 查询模板 |
| `op-db-e-report` | 📈 v3_e-report 查询模板 |

</details>

<details>
<summary><b>📦 mcp-plugin (v1.0.4) - MCP 服务配置插件</b></summary>

**为 OP 平台提供共享的 MCP 服务配置**

**功能**: 作为基础设施层，为其他插件提供统一的 MCP 服务连接配置

**MCP 服务**: op (https://op-mcp-test.blacklake.tech/mcp)

</details>

---

## 更多示例 📚

以下是一些常见的业务场景示例，展示 Blacklake Plugin 的实际应用。

<details>
<summary><b>💼 场景 1: 工作流问题排查</b></summary>

当工作流执行失败时，快速定位问题原因：

```
用户: "工作流实例 12345 执行失败了，帮我排查一下"

Claude 自动执行:
1. 🤖 调用 workflow-troubleshooter agent
2. 📊 查询工作流实例日志 (query_workflow_instance_log_detail)
3. 🌳 分析节点执行树 (query_node_instance_log_tree)
4. 🔍 定位失败节点和错误原因
5. 💡 提供修复建议

输出示例:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 工作流排查报告

工作流信息:
- 工作流名称: 订单审批流程
- 实例ID: 12345
- 执行状态: ❌ 失败

失败节点:
- 节点名称: API调用节点_3
- 节点类型: HTTP请求
- 错误信息: Connection timeout (30s)
- 失败时间: 2026-01-12 14:30:25

根因分析:
❌ 第三方接口响应超时
   - 目标URL: https://api.partner.com/order/create
   - 超时设置: 30秒
   - 实际耗时: >30秒

解决方案:
1. ⚙️ 增加超时时间至 60秒
2. 🔄 配置重试机制 (最多3次，间隔5秒)
3. 📋 添加降级策略 (超时后记录日志并继续)
4. 📞 联系第三方确认接口性能问题
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

<details>
<summary><b>📊 场景 2: 平台数据统计分析</b></summary>

查询和分析平台使用数据：

```
用户: "统计一下 test 环境，最近 7 天各个租户的工作流执行情况"

Claude 自动执行:
1. 🤖 调用 platform-analyst agent
2. 📊 使用 MCP 工具查询工作流执行数据
3. 📈 按租户维度聚合统计
4. 📋 生成可视化报表

输出示例:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 工作流执行统计报告

统计周期: 2026-01-05 ~ 2026-01-12
环境: test
租户数量: 15

执行情况汇总:
┌─────────────┬────────┬────────┬────────┬──────────┐
│ 租户        │ 总执行 │ 成功   │ 失败   │ 成功率   │
├─────────────┼────────┼────────┼────────┼──────────┤
│ BLK001      │  1,234 │  1,180 │     54 │   95.6%  │
│ BLK002      │    856 │    842 │     14 │   98.4%  │
│ BLK003      │    623 │    599 │     24 │   96.1%  │
│ ...         │    ... │    ... │    ... │   ...    │
└─────────────┴────────┴────────┴────────┴──────────┘

失败原因 TOP3:
1. 超时错误: 45 次 (48.9%)
2. 参数错误: 28 次 (30.4%)
3. 权限错误: 19 次 (20.7%)

✅ 统计完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

<details>
<summary><b>🧪 场景 3: 测试环境数据准备</b></summary>

从生产环境复制日志数据到测试环境：

```
用户: "从 prod-ali 环境复制昨天的接口调用失败日志到 test 环境，用于问题复现"

Claude 自动执行:
1. 🤖 调用 log-analyst agent + es-log skill
2. 🔍 从 prod-ali 查询失败日志
3. 🔧 清洗敏感数据（脱敏处理）
4. 💾 写入 test 环境的 ES 索引

输出示例:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 日志数据复制报告

源环境: prod-ali
目标环境: test
时间范围: 2026-01-11 00:00:00 ~ 23:59:59

查询结果:
✅ 找到 23 条失败日志

失败类型分布:
- 超时错误: 15 条 (65.2%)
- 参数错误: 5 条 (21.7%)
- 权限错误: 3 条 (13.1%)

数据处理:
🔒 已脱敏字段: token, password, phone, idCard
🔧 已调整字段: requestTime (偏移至当前时间)

写入结果:
✅ 成功写入 test 环境
   索引: interface_log_test_2026-01-12
   文档数: 23

💡 提示: 可使用 Kibana 查看写入的日志数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

<details>
<summary><b>🔧 场景 4: 批量配置管理</b></summary>

批量生成按钮配置或事件配置：

```
用户: "为采购订单对象批量生成 3 个按钮配置：提交审批、撤回、关闭"

Claude 自动执行:
1. 🤖 调用 button-configurator agent
2. 🔍 查询对象信息和现有按钮
3. 🔧 生成批量配置 SQL
4. ✅ 验证配置完整性

输出示例:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 批量按钮配置 SQL

对象: purchase_order (采购订单)
按钮数量: 3

-- 1. 提交审批按钮
INSERT INTO button_config (id, object_code, name, display_name, ...)
VALUES (1234567890, 'purchase_order', 'submit_approval', '提交审批', ...);

-- 2. 撤回按钮
INSERT INTO button_config (id, object_code, name, display_name, ...)
VALUES (1234567891, 'purchase_order', 'withdraw', '撤回', ...);

-- 3. 关闭按钮
INSERT INTO button_config (id, object_code, name, display_name, ...)
VALUES (1234567892, 'purchase_order', 'close', '关闭', ...);

✅ 配置已生成，共 3 个按钮
💡 提示: 请在对应环境数据库执行以上 SQL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

<details>
<summary><b>🔎 场景 5: 多维度数据查询</b></summary>

复杂的跨表查询和数据关联：

```
用户: "查询 prod-ali 环境，工厂 BLK001 下，最近 30 天创建的所有工作流，
      以及这些工作流关联的连接器和事件配置"

Claude 自动执行:
1. 🤖 调用 platform-analyst agent
2. 🔍 先查询工厂信息获取 org_id
3. 📊 查询工作流定义列表
4. 🔗 关联查询连接器配置
5. ⚡ 关联查询事件配置
6. 📋 整理并返回综合结果

输出示例:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 工作流及关联配置查询结果

工厂: BLK001 (黑湖智造)
环境: prod-ali
时间范围: 2025-12-13 ~ 2026-01-12

工作流统计:
- 总数: 15 个
- 已发布: 12 个
- 草稿: 3 个

详细列表:
┌───────┬──────────────┬──────┬────────┬────────┐
│ ID    │ 工作流名称   │ 版本 │ 连接器 │ 事件   │
├───────┼──────────────┼──────┼────────┼────────┤
│ 10001 │ 订单同步流程 │ v2.0 │   3    │   2    │
│ 10002 │ 库存更新流程 │ v1.5 │   2    │   1    │
│ 10003 │ 质检通知流程 │ v1.0 │   1    │   3    │
│ ...   │ ...          │ ...  │  ...   │  ...   │
└───────┴──────────────┴──────┴────────┴────────┘

关联配置汇总:
- 使用的连接器: 8 个
- 触发的事件: 12 个
- 调用的API: 25 个

✅ 查询完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

---

## 完整文档 📖

<details>
<summary><b>安装配置</b></summary>

### 方式一：插件市场安装（推荐）

通过插件市场统一管理和分发插件：

```bash
# 1. 添加市场
/plugin marketplace add Blacklake-Tech/blacklake-claude-marketplace

# 2. 安装所需插件
/plugin install blacklake-plugin@blacklake-claude-marketplace
/plugin install self-assistant-plugin@blacklake-claude-marketplace
/plugin install coder-beta-plugin@blacklake-claude-marketplace

# 3. 或交互式浏览并安装
/plugin
```

**优势**:
- ✅ 统一管理多个插件
- ✅ 版本控制和自动更新
- ✅ 团队分发更方便
- ✅ 支持插件发现和浏览

### 方式二：GitHub 直接安装

直接从 GitHub 存储库安装：

```bash
/plugin install blacklake-plugin@github:Blacklake-Tech/blacklake-claude-marketplace
/plugin install self-assistant-plugin@github:Blacklake-Tech/blacklake-claude-marketplace
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

# 只加载 blacklake-plugin
options = ClaudeAgentOptions(
    plugins=[
        {
            "type": "local",
            "path": "./plugins/claude-marketplace/plugins/blacklake-plugin"
        }
    ]
)
```

### 验证配置

```bash
# 列出已安装的插件
/plugin list

# 列出已添加的市场
/plugin marketplace list

# 查看可用 agents
/agents

# 使用调试模式查看插件加载情况
claude --debug
```

### 删除配置

```bash
# 删除市场（不会删除已安装的插件）
/plugin marketplace remove Blacklake-Tech/blacklake-claude-marketplace

# 删除插件（需单独删除）
/plugin uninstall blacklake-plugin@blacklake-claude-marketplace
/plugin uninstall self-assistant-plugin@blacklake-claude-marketplace
```

**注意**: 删除市场不会自动删除已安装的插件，需要单独执行删除插件命令。

</details>

<details>
<summary><b>项目结构</b></summary>

```
blacklake-claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json              # 市场配置文件
├── plugins/
│   ├── blacklake-plugin/             # Blacklake 运维助手 ⭐
│   │   ├── agents/                   # 7 个专业 agents
│   │   └── skills/                   # 6 个核心 skills
│   ├── self-assistant-plugin/        # 个人效率助手
│   │   ├── commands/                 # 3 个 Git 命令
│   │   ├── hooks/
│   │   │   └── hooks.json           # Hooks 配置
│   │   ├── scripts/
│   │   │   └── hooks/               # 🆕 Hooks 脚本（安全防护 + 通知）
│   │   └── skills/                  # Git 工作流知识库
│   ├── coder-beta-plugin/            # Beta 开发插件
│   │   ├── agents/                   # 4 个前端 agents
│   │   └── skills/                   # Web 构建工具
│   ├── coder-flow-plugin/            # 流程开发插件
│   │   └── agents/                   # 设计 + 开发
│   ├── coder-web-plugin/             # Web 开发插件
│   │   ├── agents/                   # React 专家
│   │   └── skills/                   # Web 构建工具
│   ├── op-plugin/                    # OP 平台插件
│   │   ├── agents/                   # 4 个平台 agents
│   │   └── skills/                   # 5 个数据库 skills
│   └── mcp-plugin/                   # MCP 服务配置
├── CHANGELOG.md                      # 变更历史
├── VERSION_MANAGEMENT.md             # 版本管理策略
└── README.md                         # 本文档
```

</details>

<details>
<summary><b>版本管理</b></summary>

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：`主版本号.次版本号.修订号`

**当前版本**: `1.1.0`

**更新策略**:
- 🔴 重大功能更新或 API 变更：升级主版本号（如 `1.0.1` → `2.0.0`）
- 🟡 新增功能：升级次版本号（如 `1.0.1` → `1.1.0`）
- 🟢 文档优化、bug 修复等小更新：升级修订号（如 `1.0.1` → `1.0.2`）

**详细信息**:
- 📋 版本管理策略：[VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md)
- 📝 变更历史：[CHANGELOG.md](./CHANGELOG.md)

</details>

---

## 常见问题 ❓

<details>
<summary><b>Q: Blacklake Plugin 和 OP Plugin 有什么区别？</b></summary>

**A**:
- `blacklake-plugin` 是最新版本，功能更完善，推荐使用
- `op-plugin` 是早期版本，已被 blacklake-plugin 替代
- 两者功能类似，但 blacklake-plugin 有更多 agents 和优化

</details>

<details>
<summary><b>Q: 如何选择合适的前端开发插件？</b></summary>

**A**:
- **快速原型**: 使用 `coder-beta-plugin` 的 `frontend-html`
- **React 项目**: 使用 `coder-web-plugin` 或 `coder-beta-plugin` 的 `frontend-react`
- **企业级管理系统**: 使用 `coder-beta-plugin` 的 `frontend-ant`
- **Vue 项目**: 使用 `coder-beta-plugin` 的 `frontend-vue`

</details>

<details>
<summary><b>Q: MCP 工具无法使用怎么办？</b></summary>

**A**:
1. 确认插件已正确安装：`/plugin list`
2. 检查 MCP 服务连接：确保能访问 https://op-mcp-test.blacklake.tech/mcp
3. 查看调试日志：`claude --debug`
4. 如果在内网，确认网络可达性

</details>

<details>
<summary><b>Q: 在线平台和本地 Claude Code 有什么区别？</b></summary>

**A**:
- **功能**: 完全相同，都包含所有插件
- **使用体验**: 一致的对话交互体验
- **数据安全**: 在线平台数据存储在云端
- **网络要求**: 在线平台需要稳定的网络连接
- **推荐场景**:
  - 在线平台：快速体验、移动办公、团队协作
  - 本地 Claude Code：企业内网、离线使用、数据敏感场景

</details>

---

## 团队协作 👥

### 内部分享建议

**新员工培训**:
1. 先体验在线版本 [https://ai-coder-test.blacklake.tech/](https://ai-coder-test.blacklake.tech/)
2. 了解核心插件功能（blacklake-plugin、self-assistant-plugin）
3. 实际场景练习（查询工厂、配置连接器、排查工作流）

**技术分享**:
- 展示具体业务场景（使用 [使用场景](#使用场景-) 中的示例）
- 介绍常用 agents 和使用场景（workflow-troubleshooter、platform-analyst 等）
- 分享团队最佳实践和经验

**问题排查**:
- 使用 `workflow-troubleshooter` agent 排查工作流问题
- 使用 `log-analyst` agent 分析日志
- 使用 `platform-analyst` agent 统计和分析数据

### 最佳实践

**使用场景文档化**:
- 记录团队常用的查询模板和 SQL 语句
- 整理典型业务场景的处理流程
- 维护内部知识库和 FAQ

**常见问题收集**:
- 收集团队遇到的问题和解决方案
- 更新补充 [常见问题](#常见问题-) 章节
- 建立内部技术支持渠道

**经验分享**:
- 定期分享使用技巧和新功能
- 鼓励团队成员贡献插件和改进
- 建立最佳实践和代码规范

**团队协作工具**:
- 使用 `/code-review` 命令进行代码审查
- 使用 `/quick-commit` 命令保持提交规范
- 使用 `/normalize-commits` 命令清理提交历史

---

## 贡献指南 🤝

欢迎贡献新的插件或改进现有功能！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交变更：`git commit -m 'feat: add some feature'`（遵循 Conventional Commits）
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

**提交规范**: 使用 `self-assistant-plugin` 的 `/quick-commit` 命令自动生成规范的提交消息！

---

## 更新日志 📝

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## 许可证 📄

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

<p align="center">
  Made with ❤️ by Blacklake Tech Team
  <br>
  <a href="https://ai-coder-test.blacklake.tech/">在线体验</a> ·
  <a href="https://github.com/Blacklake-Tech/blacklake-claude-marketplace/issues">问题反馈</a> ·
  <a href="CHANGELOG.md">更新日志</a>
</p>
