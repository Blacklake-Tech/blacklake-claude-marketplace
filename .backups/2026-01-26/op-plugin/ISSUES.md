# OP Plugin 问题分析和修正方案

## 一、概述

本文档基于 Claude Code 官方文档（[Skills explained](https://claude.com/blog/skills-explained)）对 `op-plugin` 进行问题分析，并提供修正方案。

**注意**：本插件已迁移并重构为 `blacklake-plugin`，新插件遵循官方最佳实践。建议使用新插件 `blacklake-plugin`。

**分析依据**：
- [Claude Code Skills 官方文档](https://claude.com/blog/skills-explained)
- Claude Code 最佳实践指南
- 单一职责原则和模块化设计原则

## 二、核心问题总结

### 问题分类

1. **架构问题**：Agent 和 Skills 职责不清，内容重复
2. **组织问题**：COMMON.md 重复，缺少统一管理
3. **设计问题**：Skills 缺少工作流程，只是静态模板
4. **文档问题**：Agent 缺少 Skills 使用说明
5. **命名问题**：Agent 文件名使用中文

## 三、详细问题分析

### 问题1：Agent 中重复了 Skills 的内容

#### 1.1 op-workflow.md

**问题描述**：
- **位置**：第 60-80 行
- **内容**：包含 SQL 查询模板、常用表、表关系说明
- **问题**：这些程序性知识应该在 Skills 中，而不是 Agent 中

**具体内容**：
```markdown
## 【SQL 查询能力】

支持使用 `exec_sql` 工具查询 `v3_workflow` 数据库...

**常用表**：
- `workflow` - 工作流定义主表
- `workflow_instance` - 工作流实例表
...

**表关系**：
- `workflow.id` = `workflow_version.wf_id` = ...
```

**依据**：
- [官方文档](https://claude.com/blog/skills-explained)明确指出：Skills 提供**程序性知识**（Procedural knowledge），教 Claude "如何做"
- Agent（Subagent）的职责是**任务委托**和**业务逻辑编排**，不应该包含具体的查询模板

**修正方案**：
1. 将这些查询模板移到 `db-common` skill 中
2. Agent 只保留工作流排查的业务逻辑
3. Agent 文档中说明使用了 `db-common` skill

#### 1.2 op-connector.md

**问题描述**：
- **位置**：第 54-73 行
- **内容**：MCP 工具调用规范、表结构查询指引
- **问题**：这些内容与 Skills 中的 COMMON.md 重复

**依据**：
- 单一职责原则：避免内容重复
- Skills 应该包含通用的程序性知识

**修正方案**：
1. 移除重复的【通用规范】章节
2. 引用 `db-common` skill 中的规范
3. Agent 专注于连接器配置生成逻辑

#### 1.3 op-button.md

**问题描述**：
- **位置**：第 12-46 行（【通用规范】章节）
- **内容**：MCP 工具调用规范、表结构查询指引
- **问题**：这些应该在 Skills 中

**依据**：
- Skills 提供程序性知识，Agent 专注于业务逻辑

**修正方案**：
1. 移除【通用规范】章节
2. 引用 `db-common` skill

#### 1.4 op-event.md

**问题描述**：
- **位置**：第 12-36 行（【通用规范】章节）
- **内容**：MCP 工具调用规范、表结构查询指引
- **问题**：这些应该在 Skills 中

**修正方案**：
1. 移除【通用规范】章节
2. 引用 `db-common` skill

### 问题2：缺少 Skills 的清晰说明

#### 2.1 所有 Agents 的问题

**问题描述**：
- 所有 Agent 文档都没有明确说明使用了哪些 Skills
- 没有引导 Claude 使用相关 Skills

**依据**：
- [官方文档示例](https://claude.com/blog/skills-explained)中，Agent 明确说明了相关 Skills
- Skills 是自动发现的，但 Agent 应该在文档中引导使用

**修正方案**：
在每个 Agent 文档开头添加"【相关 Skills】"章节：

```markdown
## 【相关 Skills】

执行任务时，Claude 会自动发现并使用以下 Skills：

- **db-common**: 提供数据库查询工作流程、SQL 模板和结果分析方法
- **db-metadata**: 提供元数据查询能力（如需要）

这些 Skills 包含详细的查询模板和最佳实践，请在需要时参考使用。
```

### 问题3：COMMON.md 重复

**问题描述**：
- 每个 skill 目录都有独立的 COMMON.md
- 内容完全相同，维护困难
- 容易产生不一致

**文件位置**：
```
op-plugin/skills/
├── op-db/COMMON.md
├── op-db-user/COMMON.md      # 内容相同
├── op-db-openapi/COMMON.md   # 内容相同
├── op-db-metadata/COMMON.md  # 内容相同
└── op-db-e-report/COMMON.md  # 内容相同
```

**依据**：
- [官方文档](https://claude.com/blog/skills-explained)：Skills 应该自包含，但可以通过符号链接保持一致性
- 单一数据源原则：避免重复，易于维护

**修正方案**：
1. 创建 `common/COMMON.md` 作为单一数据源
2. 每个 skill 目录的 COMMON.md 使用符号链接指向主文件
3. 保持 Skills 自包含的同时，确保一致性

### 问题4：Skills 缺少工作流程

**问题描述**：
- 当前 Skills 只包含查询模板，缺少工作流程
- 没有提供"如何做"的程序性知识
- 更像是静态文档，而不是程序性知识

**示例（op-db/SKILL.md）**：
```markdown
## 通用查询方法

### 表结构查询
```sql
DESC table_name;
```

### 基础查询技巧
...
```

**依据**：
- [官方文档](https://claude.com/blog/skills-explained)：Skills 应该提供**程序性知识**（如何做），不仅仅是模板
- 官方示例中的 Skills 包含工作流程和最佳实践

**修正方案**：
在 Skills 中添加"【查询工作流程】"章节：

```markdown
## 【查询工作流程】

### 1. 确定查询目标
- 明确要查询的数据和目的
- 选择合适的数据库和表

### 2. 选择查询方法
- **SQL 查询**：适用于快速查询、批量查询、统计分析
- **MCP 工具**：适用于需要详细执行日志的场景

### 3. 执行查询
- 使用 `exec_sql` 工具执行
- 执行前必须打印完整 SQL 语句

### 4. 结果分析
- 结构化展示查询结果
- 提取关键字段
- 多条记录使用表格展示
```

### 问题5：Agent 命名使用中文

**问题描述**：
- Agent 文件名使用中文（如 `op-workflow.md`）
- 可能在某些环境下有兼容性问题

**依据**：
- 最佳实践：文件名使用英文，提高兼容性
- Claude Code 官方示例使用英文命名

**修正方案**：
使用英文命名：
- `op-workflow.md` → `workflow-troubleshooter.md`
- `op-connector.md` → `connector-registrar.md`
- `op-statistics.md` → `platform-analyst.md`
- `op-button.md` → `button-configurator.md`
- `op-event.md` → `event-configurator.md`

### 问题6：Agent 包含大量业务规则（op-button, op-event）

#### 6.1 op-button.md

**问题描述**：
- **位置**：第 114-562 行
- **内容**：包含大量对象名称和 object_code 的对应关系映射表（448 行）
- **问题**：这是元数据知识，应该在 `db-metadata` skill 中

**依据**：
- Skills 应该包含专业领域知识
- 对象映射表是元数据知识，属于 `db-metadata` 的范畴

**修正方案**：
1. 将对象映射表移到 `db-metadata` skill
2. Agent 只保留按钮配置生成的业务逻辑
3. Agent 需要时引用 `db-metadata` skill

#### 6.2 op-event.md

**问题描述**：
- **位置**：第 141-166 行
- **内容**：包含事件相关的 SQL 查询模板
- **问题**：这些应该在 `db-metadata` skill 中

**修正方案**：
1. 将事件查询模板移到 `db-metadata` skill
2. Agent 只保留事件配置生成的业务逻辑

## 四、修正方案总结

### 4.1 架构改进

| 方面 | 当前状态 | 修正后 |
|------|---------|--------|
| Agent 职责 | 包含查询模板 | 只包含业务逻辑 |
| Skills 职责 | 只有查询模板 | 包含工作流程和模板 |
| COMMON.md | 每个目录独立 | 统一管理，符号链接 |
| Skills 说明 | 缺少 | Agent 文档中明确说明 |

### 4.2 内容重组

| 内容 | 当前位置 | 修正后位置 |
|------|---------|-----------|
| 通用规范 | 每个 Agent | common/COMMON.md |
| SQL 查询模板 | Agent 中 | db-common skill |
| 对象映射表 | op-button.md | db-metadata skill |
| 事件查询模板 | op-event.md | db-metadata skill |
| 工作流程 | 缺失 | Skills 中 |

### 4.3 文件组织

**修正前**：
```
op-plugin/
├── agents/
│   └── op-workflow.md          # 包含 SQL 模板
├── skills/
│   ├── op-db/
│   │   ├── SKILL.md           # 只有模板
│   │   └── COMMON.md          # 独立文件
│   └── op-db-user/
│       └── COMMON.md          # 重复内容
```

**修正后**：
```
blacklake_plugin/
├── common/
│   └── COMMON.md              # 单一数据源
├── agents/
│   └── workflow-troubleshooter.md  # 只包含业务逻辑
├── skills/
│   ├── db-common/
│   │   ├── SKILL.md          # 包含工作流程和模板
│   │   └── COMMON.md         # 符号链接
│   └── db-user/
│       └── COMMON.md         # 符号链接
```

## 五、实施优先级

### P0 - 高优先级（必须修正）

1. ✅ **移除 Agent 中的重复内容**
   - 将 SQL 模板移到 Skills
   - 将通用规范移到 common/COMMON.md

2. ✅ **添加 Skills 说明**
   - 在每个 Agent 文档中添加"【相关 Skills】"章节

3. ✅ **统一 COMMON.md**
   - 创建 common/COMMON.md
   - 使用符号链接

### P1 - 中优先级（建议修正）

1. ✅ **增强 Skills**
   - 添加工作流程章节
   - 提供程序性知识

2. ✅ **内容重组**
   - 将对象映射表移到 db-metadata
   - 将事件查询模板移到 db-metadata

### P2 - 低优先级（可选）

1. ✅ **命名优化**
   - 使用英文命名
   - 提高兼容性

## 六、参考资源

- [Claude Code Skills 官方文档](https://claude.com/blog/skills-explained)
- [Claude Code 最佳实践](https://claude.com/blog/building-skills-for-claude-code)
- [Skills 创建指南](https://claude.com/blog/how-to-create-skills-key-steps-limitations-and-examples)

## 七、结论

通过以上分析和修正，新的 `blacklake_plugin` 将：

1. ✅ **符合官方最佳实践**：清晰的职责划分，Skills 提供程序性知识
2. ✅ **易于维护**：统一管理通用规范，减少重复
3. ✅ **结构清晰**：分层架构，职责明确
4. ✅ **可扩展性强**：模块化设计，便于添加新功能

