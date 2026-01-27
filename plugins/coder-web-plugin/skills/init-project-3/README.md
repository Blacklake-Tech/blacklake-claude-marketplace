# init-project-3 Skill

从 GitHub 克隆项目模板并自动配置，支持自定义对象、工单、物料等多种模板。

## 功能特性

- ✅ 从 GitHub 克隆最新模板
- ✅ 自动安装项目依赖（npm install）
- ✅ 自动生成 Metadata.ts
- ✅ 清理 Git 历史并重新初始化
- ✅ 支持多种模板类型（通过配置扩展）
- ✅ 完整的错误处理和用户友好提示

## 与其他 init-project skills 的区别

| 特性 | init-project-1 | init-project-2 | init-project-3 |
|------|----------------|----------------|----------------|
| 模板来源 | 本地 demos | 本地 demos | GitHub 远程 |
| 模板更新 | 手动更新 skill | 手动更新 skill | 自动获取最新 |
| 依赖安装 | 手动 | 手动 | **自动执行** |
| 网络要求 | 无 | 无 | 需要访问 GitHub |
| 可扩展性 | 中 | 低 | **高（templates.json）** |

## 核心架构

### scripts 驱动设计

所有核心功能通过独立脚本实现：

```
scripts/
├── templates.json           # 模板配置（关键！）
├── init-from-github.sh      # 克隆 GitHub 项目
├── generate-metadata.js     # 生成 Metadata.ts
├── validate-project.sh      # 验证项目完整性
└── test-scripts.sh          # 测试脚本
```

### 优势

1. **通用设计**: 一套脚本支持多种模板（自定义对象、工单、物料）
2. **可独立测试**: 每个脚本都可以独立运行和测试
3. **易于维护**: 复杂逻辑封装在脚本中，代码结构清晰
4. **配置化扩展**: 通过 `templates.json` 添加新模板，无需修改脚本

## 快速开始

### 使用 Skill

在 Claude Code 中调用:

```
使用 init-project-3 skill 初始化项目:
- 模板: custom-object
- 目标目录: ~/projects/my-app
- 租户: 黑湖智造
- 对象: purchase_order
- 环境: feature
```

### 独立测试脚本

```bash
# 测试所有脚本
bash plugins/coder-web-plugin/skills/init-project-3/scripts/test-scripts.sh

# 测试克隆
bash scripts/init-from-github.sh \
  --template custom-object \
  --target-dir /tmp/test-app \
  --object-name "测试对象"

# 测试生成 Metadata.ts
node scripts/generate-metadata.js \
  --metadata-json /tmp/metadata.json \
  --object-code test_object__c \
  --output /tmp/test-app/src/Metadata.ts

# 测试验证
bash scripts/validate-project.sh /tmp/test-app
```

## 支持的模板

| 模板 ID | 名称 | 状态 | GitHub 仓库 |
|---------|------|------|-------------|
| custom-object | 自定义对象 | ✅ 可用 | [coder-custom-object](https://github.com/Blacklake-Tech/coder-custom-object) |
| work-order | 工单 | 🚧 即将推出 | [coder-work-order](https://github.com/Blacklake-Tech/coder-work-order) |
| material | 物料 | 🚧 即将推出 | [coder-material](https://github.com/Blacklake-Tech/coder-material) |

## 添加新模板

### 步骤 1: 创建 GitHub 仓库

按照标准项目结构创建新的模板仓库。

### 步骤 2: 更新 templates.json

```json
{
  "templates": {
    "your-template": {
      "name": "模板名称",
      "description": "模板描述",
      "github_url": "https://github.com/Blacklake-Tech/coder-your-template.git",
      "metadata_path": "src/Metadata.ts",
      "project_type": "react-vite",
      "supported_zones": ["feature", "test", "pre", "prod-ali", "prod-hw", "prod-gt"]
    }
  }
}
```

### 步骤 3: 扩展 generate-metadata.js（可选）

如果元数据格式不同，添加模板特定的转换逻辑。

详见: [模板注册表](./reference/template-registry.md)

## 文档

- [SKILL.md](./SKILL.md) - Skill 主文档和使用说明
- [COMMON.md](./COMMON.md) - 通用规范和约定
- [脚本使用说明](./reference/scripts-usage.md) - 脚本参数和测试方法
- [模板注册表](./reference/template-registry.md) - 如何添加新模板
- [元数据转换规则](./reference/metadata-transform.md) - Metadata.ts 生成规则

## 系统要求

- Git
- Node.js (包括 npm)
- 网络连接（可访问 GitHub）

## 常见问题

### Q: 网络受限无法访问 GitHub？

A: 建议使用 `init-project-2`（本地模板）。

### Q: 依赖安装失败？

A: 不会中断流程，可以稍后手动执行 `npm install`。

### Q: 目标目录已存在？

A: 脚本会终止并提示清空目录，避免误操作。

### Q: 如何使用特定版本的模板？

A: 修改 `templates.json`，添加 `git_ref` 字段指定分支或标签。

## 测试

```bash
# 运行所有测试
bash scripts/test-scripts.sh

# 端到端测试
bash scripts/test-scripts.sh --e2e
```

## 贡献

欢迎贡献新的模板或改进现有脚本！

1. Fork 仓库
2. 创建新分支
3. 提交更改
4. 发起 Pull Request

## 许可证

与 blacklake-claude-marketplace 项目保持一致。
