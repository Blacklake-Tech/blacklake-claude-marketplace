# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-12

### Added - self-assistant-plugin

**重大优化**：基于 17 个官方 Skills 最佳实践的全面升级

#### 新增功能
- ✅ **任务清单管理**：使用 TodoWrite 跟踪执行进度（参考 log-analyst）
- ✅ **进度实时通知**：每个操作都有清晰的状态提示（emoji + 状态文本）
- ✅ **强制用户确认**：重要操作前使用 AskQuestion 等待确认（参考 es-log）
- ✅ **结构化输出**：使用分隔线、表格和 emoji 提升可读性
- ✅ **完善错误处理**：详细的错误场景和解决方案（参考 web-build）
- ✅ **Git 工作流技能**：新增 `skills/git-workflow/` 目录
  - 完整的 Conventional Commits 规范
  - Type/Scope 推断规则和决策树
  - 提交分析模板和算法
  - Rebase 操作指南
  - 提交消息生成模板

#### 优化改进
- 📝 **优化 Description 字段**：包含完整的触发场景说明（参考 pdf/docx/mcp-builder）
- 🎨 **更新 Frontmatter**：添加 model（sonnet/haiku）、color（blue/green）
- 📊 **改进输出格式**：统一使用 emoji 和分隔线
- ❌ **增强错误处理**：normalize-commits 5种、quick-commit 4种错误场景
- 📚 **完善文档说明**：更新 README.md，添加项目结构和输出示例
- 🎯 **标准化提交风格**：弱化学习近期提交风格，完全使用标准 Conventional Commits

#### 技术改进
- 📁 **优化目录结构**：将 Git 规范移至 `skills/git-workflow/COMMON.md`
- 🔗 **符号链接管理**：规范化技能内部的文件引用
- 📖 **文档完善**：新增 800+ 行高质量文档内容

#### 参考来源
- 基于 17 个官方 Skills 分析（pdf, docx, pptx, xlsx, mcp-builder, web-artifacts-builder, algorithmic-art, canvas-design, frontend-design, internal-comms 等）
- 遵循 Skill Creator 核心原则
- 应用渐进式披露、决策树工作流、强制性表达等设计模式

### Changed
- 📦 **版本号统一**：marketplace 和所有插件版本统一为 1.1.0

## [1.0.4] - 2026-01-08

### Added
- ✨ **blacklake-plugin**：新增 Blacklake 内部运维助手插件
  - 重构自 op-plugin，采用更清晰的架构设计
  - 实现 Agent 和 Skill 分离
  - 添加完整的设计文档（DESIGN.md）

### Changed
- 📦 统一所有插件版本号为 1.0.4

## [1.0.3] - 2026-01-05

### Added
- ✨ **self-assistant-plugin**：个人效率助手插件
  - `/quick-commit`：智能生成符合 Conventional Commits 规范的提交
  - `/normalize-commits`：规范化提交历史（合并重复 + 改写不规范）
  - `/code-review`：PR 代码审查

### Changed
- 📦 统一所有插件版本号为 1.0.3

## [1.0.2] - 2025-12-20

### Added
- ✨ **op-plugin**：OP 平台插件
  - 5 个 Agents：op-button、op-connector、op-event、op-workflow、op-statistics
  - 5 个 Skills：op-db、op-db-metadata、op-db-openapi、op-db-user、op-db-e-report

## [1.0.1] - 2025-12-15

### Added
- ✨ **coder-beta-plugin**：Beta 开发插件
  - frontend-ant、frontend-html、frontend-react、frontend-vue agents
  - web-build skill

## [1.0.0] - 2025-12-10

### Added
- 🎉 初始版本发布
- ✨ **mcp-plugin**：MCP 服务器配置插件
- ✨ **coder-flow-plugin**：流程开发插件（designer、developer agents）
- ✨ **coder-web-plugin**：Web 开发插件（frontend-html、frontend-react agents）
- 📝 添加 VERSION_MANAGEMENT.md 版本管理说明
- 📝 添加 README.md 项目说明

---

## 版本号规则

遵循 [语义化版本](https://semver.org/) 规范：

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

## 链接

- [1.1.0]: https://github.com/Blacklake-Tech/blacklake-claude-marketplace/compare/v1.0.4...v1.1.0
- [1.0.4]: https://github.com/Blacklake-Tech/blacklake-claude-marketplace/compare/v1.0.3...v1.0.4
- [1.0.3]: https://github.com/Blacklake-Tech/blacklake-claude-marketplace/compare/v1.0.2...v1.0.3
- [1.0.2]: https://github.com/Blacklake-Tech/blacklake-claude-marketplace/compare/v1.0.1...v1.0.2
- [1.0.1]: https://github.com/Blacklake-Tech/blacklake-claude-marketplace/compare/v1.0.0...v1.0.1
- [1.0.0]: https://github.com/Blacklake-Tech/blacklake-claude-marketplace/releases/tag/v1.0.0
