# Marketplace 版本管理说明

## 版本管理策略

本 marketplace 采用**统一版本管理**策略，所有插件的版本号都依赖 marketplace 的主版本号。

## 版本结构

### Marketplace 主版本

在 `marketplace.json` 顶层定义主版本：

```json
{
  "name": "claude-marketplace",
  "version": "1.0.4",  // 主版本号
  ...
}
```

### 插件版本同步

所有插件的版本号应该与 marketplace 主版本号保持一致：

```json
{
  "plugins": [
    {
      "name": "mcp-plugin",
      "version": "1.0.4",  // 与 marketplace version 一致
      ...
    },
    {
      "name": "blacklake-plugin",
      "version": "1.0.4",  // 与 marketplace version 一致
      ...
    }
  ]
}
```

## 版本升级流程

### 1. 更新 Marketplace 版本

修改 `.claude-plugin/marketplace.json` 中的顶层 `version` 字段：

```json
{
  "version": "1.0.5"  // 升级版本号
}
```

### 2. 同步所有插件版本

需要同时更新以下文件中的 `version` 字段：

1. **marketplace.json** 中的每个插件条目
2. **每个插件的 plugin.json** 文件

**需要更新的文件**：
- `.claude-plugin/marketplace.json` - 顶层 version 和所有插件的 version
- `plugins/mcp-plugin/.claude-plugin/plugin.json`
- `plugins/coder-flow-plugin/.claude-plugin/plugin.json`
- `plugins/coder-web-plugin/.claude-plugin/plugin.json`
- `plugins/video-analyst-plugin/.claude-plugin/plugin.json`（如果存在）
- `plugins/op-plugin/.claude-plugin/plugin.json`
- `plugins/blacklake-plugin/.claude-plugin/plugin.json`

### 3. 版本号规则

遵循 [语义化版本](https://semver.org/) 规范：

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

**当前版本**：`1.0.4`

## 自动化版本同步（可选）

可以创建脚本来自动同步版本：

```bash
#!/bin/bash
# sync-versions.sh

MARKETPLACE_VERSION=$(grep -o '"version": "[^"]*"' .claude-plugin/marketplace.json | head -1 | cut -d'"' -f4)

echo "Marketplace version: $MARKETPLACE_VERSION"

# 更新所有插件的 plugin.json
find plugins -name "plugin.json" -type f | while read file; do
  sed -i '' "s/\"version\": \".*\"/\"version\": \"$MARKETPLACE_VERSION\"/" "$file"
  echo "Updated: $file"
done

echo "All plugin versions synchronized to $MARKETPLACE_VERSION"
```

## 当前版本状态

| 组件 | 版本 | 状态 |
|------|------|------|
| Marketplace | 1.0.4 | ✅ |
| mcp-plugin | 1.0.4 | ✅ |
| coder-flow-plugin | 1.0.4 | ✅ |
| coder-web-plugin | 1.0.4 | ✅ |
| op-plugin | 1.0.4 | ✅ |
| blacklake-plugin | 1.0.4 | ✅ |

## 注意事项

1. **版本一致性**：确保 marketplace.json 和所有 plugin.json 中的版本号完全一致
2. **版本升级**：每次升级版本时，需要同步更新所有相关文件
3. **Git 提交**：版本升级后，建议在提交信息中说明升级原因

## 版本历史

- **1.0.4** - 添加 blacklake-plugin，统一所有插件版本
- **1.0.3** - 初始版本

