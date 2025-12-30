# Blacklake Plugin

Blacklake 公司内部运维辅助工具插件，提供工作流排查、连接器配置、平台数据分析等功能。

## 功能特性

### Agents（业务逻辑层）

- **workflow-troubleshooter** - 工作流排查专家
  - 快速定位工作流执行问题
  - 生成 Jaeger 追踪链接
  - 节点诊断和问题分析

- **connector-registrar** - 连接器注册专家
  - 根据接口文档生成连接器配置 SQL
  - 支持域名转换和字段映射
  - 自动生成唯一 ID

- **platform-analyst** - 平台数据分析师
  - 多维度数据统计分析
  - 支持告警配置、插件中心等统计
  - 可扩展的统计功能

- **button-configurator** - 按钮配置专家
  - 生成按钮配置 SQL 语句
  - 对象编码自动转换
  - ID 递增策略管理

- **event-configurator** - 事件配置专家
  - 生成事件配置 JSON
  - 根据 ID 查询生成 SQL
  - 字段转换和验证

### Skills（程序性知识层）

- **db-common** - 通用数据库查询
  - 查询工作流程
  - SQL 模板和最佳实践
  - 结果分析方法

- **db-user** - v3_user 数据库查询
  - 租户和组织信息查询

- **db-openapi** - v3_openapi 数据库查询
  - 连接器和 API 配置查询

- **db-metadata** - v3_metadata 数据库查询
  - 对象编码、按钮、事件配置查询
  - 对象名称映射表
  - 事件相关查询模板

- **db-e-report** - v3_e-report 数据库查询
  - 数据分析告警配置查询

- **es-log** - ES 日志查询和写入
  - 支持从线上查询数据后写入 feature/test 环境
  - 提供完整的造数据工作流程
  - 包含环境配置和索引映射

## 安装方式

### 方式一：插件市场安装（推荐）

```bash
# 添加市场
/plugin marketplace add Blacklake-Tech/claude-marketplace

# 安装插件
/plugin install blacklake_plugin@claude-marketplace
```

### 方式二：GitHub 直接安装

```bash
/plugin install blacklake_plugin@github:Blacklake-Tech/claude-marketplace
```

### 方式三：项目内自动识别

将插件目录克隆到项目目录中，Claude Code 会自动扫描并加载。

## 目录结构

```
blacklake_plugin/
├── .claude-plugin/
│   └── plugin.json              # 插件配置
├── common/
│   └── COMMON.md                # 共享通用规范
├── skills/                       # 程序性知识层
│   ├── db-common/
│   │   ├── SKILL.md
│   │   └── COMMON.md            # 符号链接 → ../../common/COMMON.md
│   ├── db-user/
│   │   ├── SKILL.md
│   │   └── COMMON.md            # 符号链接
│   ├── db-openapi/
│   ├── db-metadata/
│   ├── db-e-report/
│   └── es-log/
├── agents/                       # 业务逻辑层
│   ├── workflow-troubleshooter.md
│   ├── connector-registrar.md
│   ├── platform-analyst.md
│   ├── button-configurator.md
│   └── event-configurator.md
├── README.md
└── DESIGN.md
```

## 设置符号链接

为了保持 COMMON.md 的一致性，每个 skill 目录的 COMMON.md 应该是指向 `common/COMMON.md` 的符号链接。

### macOS/Linux

```bash
cd skills/db-common
ln -s ../../common/COMMON.md COMMON.md

cd ../db-user
ln -s ../../common/COMMON.md COMMON.md

cd ../db-openapi
ln -s ../../common/COMMON.md COMMON.md

cd ../db-metadata
ln -s ../../common/COMMON.md COMMON.md

cd ../db-e-report
ln -s ../../common/COMMON.md COMMON.md

cd ../es-log
ln -s ../../common/COMMON.md COMMON.md
```

### Windows

使用管理员权限运行 PowerShell：

```powershell
cd skills\db-common
New-Item -ItemType SymbolicLink -Path COMMON.md -Target ..\..\common\COMMON.md

cd ..\db-user
New-Item -ItemType SymbolicLink -Path COMMON.md -Target ..\..\common\COMMON.md

# ... 其他 skills 同样操作
```

## 使用说明

### 工作流排查

```bash
# 使用 workflow-troubleshooter agent
@workflow-troubleshooter 请帮我排查工作流实例 12345 的执行问题
```

### 连接器配置

```bash
# 使用 connector-registrar agent
@connector-registrar 请根据以下接口文档生成连接器配置 SQL...
```

### 数据统计

```bash
# 使用 platform-analyst agent
@platform-analyst 请统计配置了数据分析告警的租户数和规则数量
```

## 设计理念

本插件遵循 Claude Code 官方最佳实践：

- **分层架构**：Agent → Skills → MCP Tools
- **职责分离**：Agent 编排任务，Skills 提供程序性知识
- **自动发现**：Skills 自动发现，Agent 文档引导使用
- **自包含**：Skills 自包含，通过符号链接保持一致性

详细设计说明请参考 [DESIGN.md](./DESIGN.md)

## 版本历史

- **1.0.4** - 当前版本
  - 迁移自 op-plugin
  - 重构为符合官方最佳实践的结构
  - 添加工作流程和程序性知识
  - 统一版本管理，与 marketplace 版本同步

## 相关资源

- [Claude Code Skills 官方文档](https://claude.com/blog/skills-explained)
- [op-plugin 问题分析文档](../op-plugin/ISSUES.md)
- [版本管理说明](../../VERSION_MANAGEMENT.md)

