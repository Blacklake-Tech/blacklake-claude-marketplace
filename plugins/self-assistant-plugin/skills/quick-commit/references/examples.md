# 提交消息示例

本文档提供各种场景下的提交消息示例，帮助理解如何生成符合规范的提交信息。

## 基础示例

### 新增功能

```bash
# 添加新的用户认证功能
feat(auth): 添加用户登录功能

# 实现新的 API 接口
feat(api): 实现文件上传接口

# 新增 UI 组件
feat(ui): 新增数据可视化图表组件
```

### Bug 修复

```bash
# 修复空指针异常
fix(api): 修复空指针异常

# 解决登录问题
fix(auth): 解决登录超时问题

# 修正 UI 问题
fix(ui): 修正按钮点击无响应
```

### 文档更新

```bash
# 更新 README
docs: 更新 API 使用说明

# 添加文档
docs(readme): 添加安装步骤

# 完善注释
docs(api): 完善接口文档
```

## 高级示例

### 带 Scope 的提交

```bash
# 插件相关
feat(plugin): 添加 Git 智能提交命令
fix(plugin): 修复插件加载失败

# API 相关
feat(api): 实现用户管理接口
fix(api): 修复查询参数错误

# UI 相关
feat(ui): 添加暗色主题
fix(ui): 修复响应式布局问题
```

### 多文件变更

```bash
# 重构多个模块
refactor(auth): 重构登录和注册逻辑

# 更新多个配置
chore: 更新项目配置文件

# 修复多个问题
fix(api): 修复多个接口错误
```

### 版本发布

```bash
# 发布新版本
feat(release): 发布 v1.2.0 版本

# 升级版本号
chore(version): 升级版本号到 1.2.0

# 准备发布
chore(release): 准备 v1.2.0 发布
```

## 场景化示例

### 场景 1：添加新功能

**变更内容**：
- 新增 `src/auth/login.ts` 文件
- 修改 `src/router.ts` 添加路由
- 更新 `package.json` 添加依赖

**推荐提交消息**：
```bash
feat(auth): 添加用户登录功能
```

**原因**：主要变更是新增功能，优先使用 `feat`

### 场景 2：修复 Bug

**变更内容**：
- 修改 `src/api/user.ts` 修复空指针
- 添加 `src/api/user.test.ts` 测试用例

**推荐提交消息**：
```bash
fix(api): 修复用户查询空指针异常
```

**原因**：主要目的是修复 Bug，测试是辅助性的

### 场景 3：重构代码

**变更内容**：
- 重命名 `utils/helper.ts` 为 `utils/common.ts`
- 调整目录结构
- 更新所有引用

**推荐提交消息**：
```bash
refactor(utils): 重构工具函数模块
```

**原因**：代码重构，功能不变

### 场景 4：更新依赖

**变更内容**：
- 修改 `package.json` 升级 React 版本
- 更新 `package-lock.json`

**推荐提交消息**：
```bash
build(deps): 升级 React 到 18.0
```

**原因**：依赖更新属于构建相关

### 场景 5：配置 CI

**变更内容**：
- 添加 `.github/workflows/ci.yml`
- 配置自动化测试流程

**推荐提交消息**：
```bash
ci: 添加自动化测试流程
```

**原因**：CI/CD 配置

### 场景 6：格式化代码

**变更内容**：
- 运行 Prettier 格式化所有文件
- 仅有空格、缩进变化

**推荐提交消息**：
```bash
style: 格式化代码
```

**原因**：纯格式调整，不影响功能

### 场景 7：更新子模块

**变更内容**：
- 更新 `.gitmodules`
- 更新子模块指向

**推荐提交消息**：
```bash
chore(submodule): 更新 xxx 子模块
```

**原因**：子模块维护

### 场景 8：性能优化

**变更内容**：
- 优化数据库查询
- 添加缓存机制

**推荐提交消息**：
```bash
perf(api): 优化查询性能
```

**原因**：性能改进

## 中文 vs 英文

### 中文项目示例

```bash
feat(认证): 添加用户登录功能
fix(接口): 修复空指针异常
docs: 更新使用文档
```

### 英文项目示例

```bash
feat(auth): add user login feature
fix(api): fix null pointer exception
docs: update usage documentation
```

### 混合项目示例

```bash
# Type 和 scope 用英文，subject 用中文
feat(auth): 添加用户登录功能

# 全英文
feat(auth): add user login feature
```

**建议**：根据项目历史提交风格选择语言，保持一致性。

## 特殊格式

### Breaking Change

```bash
feat(api)!: 重构用户接口

BREAKING CHANGE: 用户接口参数格式已变更
```

### 关联 Issue

```bash
fix(api): 修复查询错误

Closes #123
```

### 多行描述

```bash
feat(auth): 添加用户登录功能

- 实现用户名密码登录
- 添加 JWT token 认证
- 支持记住登录状态
```

## 常见错误示例

### ❌ 错误示例

```bash
# 缺少 type
添加登录功能

# 缺少 subject
feat(auth):

# subject 首字母大写（英文）
feat(auth): Add user login

# subject 有句号
feat(auth): 添加用户登录功能。

# type 错误
add(auth): 添加用户登录功能

# 过于简略
fix: bug

# 过于冗长
feat(auth): 添加用户登录功能，包括用户名密码验证、JWT token 生成、记住登录状态、自动登录等完整的用户认证体系
```

### ✅ 正确示例

```bash
feat(auth): 添加用户登录功能
fix(api): 修复空指针异常
docs: 更新 README
refactor(utils): 重构工具函数
```

## 提交消息模板

### 标准模板

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 简化模板（推荐）

```
<type>(<scope>): <subject>
```

### 示例应用

```bash
# 标准模板
feat(auth): 添加用户登录功能

实现了用户名密码登录，支持 JWT token 认证。

Closes #123

# 简化模板
feat(auth): 添加用户登录功能
```

**建议**：大多数情况使用简化模板即可，复杂变更可使用标准模板。

## 版本管理场景

### 场景 9：单体项目版本升级

**项目结构**：
```
project/
├── package.json (v1.0.0)
├── src/
│   └── index.ts
└── CHANGELOG.md
```

**变更内容**：
- 修改 `src/index.ts` 添加新功能

**使用命令**：
```bash
/quick-commit 升级版本
```

**执行流程**：
1. 检测到 `package.json` (v1.0.0)
2. 询问用户是否升级版本
3. 升级到 v1.0.1
4. 生成提交消息：`feat(core): 添加新功能`
5. 更新 CHANGELOG.md：
   ```markdown
   ## [Unreleased]
   
   ### Added
   - ✅ 添加新功能 (core)
   ```

### 场景 10：Monorepo 多模块版本升级

**项目结构**：
```
monorepo/
├── packages/
│   ├── core/
│   │   ├── package.json (v2.0.0)
│   │   └── src/index.ts
│   └── utils/
│       ├── package.json (v1.5.0)
│       └── src/helper.ts
└── CHANGELOG.md
```

**变更内容**：
- 修改 `packages/core/src/index.ts`
- 修改 `packages/utils/src/helper.ts`

**使用命令**：
```bash
/quick-commit 升级版本
```

**执行流程**：
1. 检测到 2 个 package.json：
   - `packages/core/package.json` (v2.0.0)
   - `packages/utils/package.json` (v1.5.0)
2. 询问用户是否升级版本
3. 批量升级：
   - core: v2.0.0 → v2.0.1
   - utils: v1.5.0 → v1.5.1
4. 生成提交消息：`feat: 优化核心模块和工具函数`
5. 更新 CHANGELOG.md（项目级别）：
   ```markdown
   ## [Unreleased]
   
   ### Added
   - ✅ 优化核心模块和工具函数
   ```

### 场景 11：插件市场版本升级

**项目结构**：
```
marketplace/
├── plugins/
│   ├── plugin-a/
│   │   ├── .claude-plugin/plugin.json (v1.0.11)
│   │   └── skills/db.md
│   └── plugin-b/
│       ├── .claude-plugin/plugin.json (v1.0.13)
│       └── skills/api.md
├── CHANGELOG.md
└── README.md
```

**变更内容**：
- 修改 `plugins/plugin-a/skills/db.md`
- 修改 `plugins/plugin-b/skills/api.md`

**使用命令**：
```bash
/quick-commit 升级版本
```

**执行流程**：
1. 检测到 2 个 plugin.json：
   - `plugins/plugin-a/.claude-plugin/plugin.json` (v1.0.11)
   - `plugins/plugin-b/.claude-plugin/plugin.json` (v1.0.13)
2. 询问用户是否升级版本
3. 批量升级：
   - plugin-a: v1.0.11 → v1.0.12
   - plugin-b: v1.0.13 → v1.0.14
4. 生成提交消息：`feat(skills): 优化数据库和接口技能`
5. 更新 CHANGELOG.md（项目级别）：
   ```markdown
   ## [Unreleased]
   
   ### Added
   - ✅ 优化数据库和接口技能 (skills)
   ```
6. 询问是否更新 README.md
7. 如果选择"是"，更新 README 中的版本表格：
   ```markdown
   | **plugin-a** | v1.0.12 | 数据库操作插件 |
   | **plugin-b** | v1.0.14 | 接口管理插件 |
   ```

### 场景 12：CHANGELOG 项目级别更新

**当前 CHANGELOG 格式**（旧版，带插件后缀）：
```markdown
## [Unreleased]

### Added - plugin-a
- ✅ 新增数据库查询功能 (db)

### Changed - plugin-b
- ♻️ 优化接口性能 (api)
```

**新版格式**（项目级别，无插件后缀）：
```markdown
## [Unreleased]

### Added
- ✅ 新增数据库查询功能 (db)
- ✅ 新增用户认证功能 (auth)

### Changed
- ♻️ 优化接口性能 (api)
```

**关键变化**：
- ❌ 移除插件后缀（`- plugin-a`）
- ✅ 统一项目级别记录
- ✅ Scope 仅从提交消息提取（`feat(db): xxx`）
- ✅ 不从文件路径推断 scope

**示例提交**：
```bash
# 提交消息
feat(auth): 新增用户认证功能

# CHANGELOG 更新
## [Unreleased]

### Added
- ✅ 新增用户认证功能 (auth)
```
