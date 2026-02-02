# React 前端项目指南

## 项目概述
本项目是一个基于 React 的企业级应用,包含复杂的数据表格、表单系统和工作流管理。

## 可用的 Claude Skills

本项目启用了以下自定义 skills,Claude 应在合适时自动使用:

### 1. React 页面字段修改专家 `/fe_page_field_modifier`
自动定位并修改现有页面的字段配置

**自动触发条件**:
- 用户要求修改列表显示列
- 用户要求更新表单字段配置
- 用户要求调整详情页面展示字段
- 用户要求修改筛选器字段

**使用示例**:
```
用户: "把用户列表的'电话'列隐藏,把'部门'字段改成必填"
Claude: /fe_page_field_modifier
```

### 2. Git 提交工作流

#### 快速提交 `/self-assistant-plugin:quick-commit`
智能生成符合 Conventional Commits 规范的提交信息

**使用场景**:
- 用户说"提交我的改动"
- 用户完成 `git add` 后要求提交
- 需要快速规范化提交消息

**工作流**:
1. 检查暂存区变更 (`git status`)
2. 自动推断 type、scope、subject
3. 生成或使用自定义提交消息
4. 确认格式后提交

#### 提交历史规范化 `/self-assistant-plugin:normalize-commits`
规范化 Git 提交历史

**使用场景**:
- PR 前需要清理提交历史
- 提交消息混乱不规范
- 存在大量重复提交

### 3. 代码审查 `/self-assistant-plugin:code-review`
自动审查 Pull Request

**自动触发条件**:
- 用户要求审查 PR
- 用户要求检查代码质量

### 4. 前端项目初始化 `/coder-web-plugin:init-project-*`
根据模板快速生成前端项目

**三个变体**:
- `/coder-web-plugin:init-project-1`: 基础初始化
- `/coder-web-plugin:init-project-2`: 带自定义对象页面 (常用)
- `/coder-web-plugin:init-project-3`: 从 GitHub 克隆模板

### 5. 对象元数据查询 `/coder-web-plugin:object-metadata`
查询对象的元数据(字段定义、验证规则等)

**使用**:
```
用户: "查看'用户'对象的所有字段定义"
Claude: 自动调用此 skill 查询数据库
```

### 6. 数据库用户信息查询 `/coder-web-plugin:db-user`
查询租户和组织信息

## Claude 的通用行为指示

### 优先级原则
1. 当用户请求 skills 覆盖的功能时,**自动优先使用对应 skill**
2. 如果多个 skill 适用,选择最细粒度的 skill
3. 如果不确定,询问用户

### Skill 调用方式
- 使用 `/skill-name` 格式调用
- 在调用前说明为什么选择这个 skill
- 等待 skill 执行完成后进行后续操作
- 总结结果给用户

### MCP 工具处理
- 某些 skills 依赖 MCP 工具 (exec_sql 等)
- 如果 MCP 工具不可用,提示用户
- MCP 服务器已在配置中启用: `plugin:coder-web-plugin:op`

## 构建机制

### ⚠️ 重要：手动构建要求

**Claude 必须在修改源代码后主动执行构建**

#### 何时需要构建:

修改以下内容后**必须立即执行** `npm run build`:

1. **修改源文件** (Edit/Write 工具)
   - 修改 `src/*` 目录下的任何文件
   - 修改 `public/*` 目录下的资源文件
   - 修改 `index.html` 入口文件

2. **创建新文件**
   - 在 `src/*` 目录下创建新组件/模块
   - 在 `public/*` 目录下添加新资源

3. **执行页面修改 Skills 后**
   - `/fe_page_field_modifier` - 页面字段修改
   - `/coder-web-plugin:init-project-*` - 项目初始化

#### Claude 行为规范:

**✅ 必须做的:**
- 修改 `src/*`、`public/*` 或 `index.html` 后,**立即**执行 `npm run build`
- 在构建完成后告知用户构建结果
- 如果构建失败,分析错误并修复

#### 构建命令:

- `npm run build` - 标准构建 (默认使用这个)
- `npm run build:check` - 带 TypeScript 检查的构建
- `npm run preview` - 预览构建结果


**说明**: 由于 Claude Code hooks 功能当前不可用,必须手动触发构建。这确保代码修改后立即验证构建正确性。

## 代码风格和约定

### React 组件
- 使用函数式组件和 Hooks
- Props 类型定义使用 TypeScript
- 组件文件名使用 PascalCase

### Git 提交规范
遵循 Conventional Commits:
- `feat:` 新功能
- `fix:` 缺陷修复
- `refactor:` 代码重构
- `test:` 测试相关
- `docs:` 文档更新
- `chore:` 构建或工具链更新

## 常用命令

- 构建项目: `npm run build`
- 启动开发服务器: `npm run dev`
- 运行测试: `npm test`
- 代码格式化: `npm run format`
- 检查代码质量: `npm run lint`
