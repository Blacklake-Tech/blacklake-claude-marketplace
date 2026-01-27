# init-project-3 Skill

从 GitHub 克隆项目模板，AI 自动替换 Metadata.ts。

## 核心特性

- ✅ 从 GitHub 克隆最新模板
- ✅ AI 自动替换 Metadata.ts（灵活）
- ✅ 简单的脚本设计（只负责克隆）

## 设计理念

### 简化架构

**脚本只做克隆**:
- `init-from-github.sh` - 克隆 GitHub 项目
- `templates.json` - 模板配置

**AI 负责核心逻辑**:
- 调用 skills 获取数据
- 读取和替换 Metadata.ts
- 验证项目完整性

### 为什么这样设计？

1. **灵活性** - AI 可以根据实际情况调整
2. **可维护性** - 脚本数量少，易于理解
3. **扩展性** - 通过 templates.json 添加新模板

## 与其他 skills 的区别

| 特性 | init-project-1 | init-project-2 | init-project-3 |
|------|----------------|----------------|----------------|
| 模板来源 | 本地 demos | 本地 demos | GitHub 远程 |
| 实现方式 | AI 参考模板生成 | 复制+替换 | 克隆+AI 替换 |
| 依赖安装 | 手动 | 手动 | 可选自动 |
| 适用场景 | 深度定制 | 离线/快速 | 最新模板 |

## 快速开始

### 使用 Skill

```
使用 init-project-3 初始化项目:
- 模板: custom-object
- 目标目录: ~/projects/my-app
- 租户: 黑湖智造
- 对象: purchase_order
```

### 测试脚本

```bash
# 测试克隆
bash scripts/init-from-github.sh \
  --template custom-object \
  --target-dir /tmp/test-app

# 验证结果
ls -la /tmp/test-app
```

## 支持的模板

| 模板 | 状态 | GitHub 仓库 |
|------|------|-------------|
| custom-object | ✅ 可用 | [coder-custom-object](https://github.com/Blacklake-Tech/coder-custom-object) |
| work-order | 🚧 即将推出 | coder-work-order |
| material | 🚧 即将推出 | coder-material |

## 添加新模板

只需更新 `templates.json`:

```json
{
  "templates": {
    "your-template": {
      "name": "模板名称",
      "description": "模板描述",
      "github_url": "https://github.com/Blacklake-Tech/coder-your-template.git",
      "metadata_path": "src/Metadata.ts"
    }
  }
}
```

详见: [template-registry.md](./reference/template-registry.md)

## 文档

- [SKILL.md](./SKILL.md) - Skill 使用说明
- [COMMON.md](./COMMON.md) - 通用规范
- [metadata-transform.md](./reference/metadata-transform.md) - 元数据转换规则
- [template-registry.md](./reference/template-registry.md) - 模板注册表

## 系统要求

- Git
- Node.js
- 网络连接（访问 GitHub）

## 常见问题

**Q: 为什么不用脚本生成 Metadata.ts？**

A: AI 更灵活，可以根据实际情况调整转换逻辑。

**Q: 网络受限怎么办？**

A: 使用 `init-project-2`（本地模板）。

**Q: 如何添加新模板？**

A: 更新 `templates.json`，无需修改代码。
