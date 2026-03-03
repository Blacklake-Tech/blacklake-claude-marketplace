---
name: init-project-3
aliases: [clone-template, gitlab-init]
description: 从 GitLab 克隆项目模板并自动配置，支持自定义对象、工单、物料等多种模板
---

# 前端项目初始化（从 GitLab 克隆）

## 功能说明

从 GitLab 克隆项目模板，AI 自动替换 Metadata.ts。

**支持的模板**:
- ✅ `custom-object` - 自定义对象管理系统
- 🚧 `work-order` - 工单管理系统（即将推出）
- 🚧 `material` - 物料管理系统（即将推出）

## 依赖的 Skills

- `db-user` - 查询租户信息
- `object-metadata` - 获取对象元数据

## 主流程

### 阶段 1: 收集参数

询问用户:
- 模板类型 (默认: `custom-object`)
- 目标目录路径
- 租户信息（工厂名称/编号/orgId）
- 对象信息（对象 code/名称/id）
- 环境 zones (默认: `["feature"]`)

### 阶段 2: 获取数据

1. 调用 `db-user` skill 获取 orgId
2. 调用 `object-metadata` skill 获取完整元数据

### 阶段 3: 克隆项目

**执行脚本**:
```bash
bash scripts/init-from-gitlab.sh \
  --template custom-object \
  --target-dir <绝对路径>
```

**脚本功能**:
- 从 GitLab 克隆项目（浅克隆）
- 移动到目标目录
- 清理 Git 历史并重新初始化

**错误处理**:
- 目标目录已存在 → 终止
- 网络失败 → 终止并提示

### 阶段 4: 替换 Metadata.ts

**由 AI 完成**（不使用脚本）:

1. **读取模板**:
   ```bash
   # 使用 Read 工具
   读取 <target-dir>/src/Metadata.ts
   ```

2. **生成新内容**:
   - 参考 [元数据转换规则](./reference/metadata-transform.md)
   - `DEFAULT_OBJECT_CODE`: 设置为对象 code
   - `mockFields`: 从元数据生成，保持 0/1 格式，添加 `.map(normalizeField)`
   - `mockSubObjects`: 从元数据生成，使用 boolean

3. **替换文件**:
   ```bash
   # 使用 Write 工具
   写入 <target-dir>/src/Metadata.ts
   ```

### 阶段 5: 安装依赖并启动

```bash
cd <target-dir>
npm install --legacy-peer-deps
npm run dev
```

### 阶段 6: 输出成功信息

```
✅ 项目初始化成功！

📁 项目目录: <target-dir>
📦 模板类型: custom-object
🎯 对象代码: <object-code>
📊 字段数量: <count>
📄 生成页面: list、createOrEdit、detail
🔗 访问地址: http://localhost:3000/<object-code>
```

## 关键点

### 简化设计

- **脚本只负责克隆** - `init-from-gitlab.sh` 只做克隆和移动文件
- **AI 负责替换** - 使用 Read + Write 工具直接替换 Metadata.ts
- **AI 负责验证** - 可选执行 `npx tsc --noEmit` 检查类型

### 为什么简化？

1. **灵活性** - AI 可以根据实际情况调整转换逻辑
2. **可维护性** - 减少脚本数量，降低维护成本
3. **可理解性** - 流程更清晰，更容易理解

## 脚本说明

### scripts/templates.json

模板配置文件。

**格式**:
```json
{
  "templates": {
    "custom-object": {
      "name": "自定义对象",
      "description": "自定义业务对象的前端页面",
      "gitlab_url": "git@gitlab.blacklake.tech:frontend/coder-custom-object.git",
      "metadata_path": "src/Metadata.ts"
    }
  }
}
```

### scripts/init-from-gitlab.sh

克隆 GitLab 项目。

**参数**:
- `--template`: 模板类型
- `--target-dir`: 目标目录（绝对路径）

**功能**:
1. 读取 templates.json
2. 克隆 GitLab 仓库
3. 移动文件到目标目录
4. 清理 Git 历史

## 错误处理

| 错误 | 处理方式 |
|------|----------|
| 目标目录已存在 | 终止并提示 |
| 网络失败 | 终止并提示检查网络 |
| 模板不存在 | 显示可用模板列表 |

## 相关文档

- [COMMON.md](./COMMON.md) - 通用规范
- [metadata-transform.md](./reference/metadata-transform.md) - 转换规则
- [template-registry.md](./reference/template-registry.md) - 如何添加新模板

## 适用场景

✅ 正常网络环境，可访问 GitLab
✅ 希望使用最新的模板特性
