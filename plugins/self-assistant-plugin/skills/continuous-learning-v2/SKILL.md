---
name: continuous-learning-v2
description: 基于本能(Instinct)的学习系统，通过 hooks 观察会话，创建带置信度评分的原子化本能，并将其演化为技能/命令/代理。
version: 2.0.0
---

# Continuous Learning v2 - 基于本能的架构

一个先进的学习系统，通过原子化"本能(Instincts)"（带置信度评分的小型学习行为）将你的 Claude Code 会话转化为可重用的知识。

## v2 的新特性

| 特性 | v1 | v2 |
|------|----|----|
| 观察机制 | Stop hook（会话结束） | PreToolUse/PostToolUse（100% 可靠） |
| 分析方式 | 主上下文 | 后台 Agent（Haiku）|
| 学习粒度 | 完整技能 | 原子化"本能" |
| 置信度 | 无 | 0.3-0.9 加权 |
| 演化路径 | 直接到技能 | 本能 → 聚类 → 技能/命令/代理 |
| 分享能力 | 无 | 导出/导入本能 |

## Instinct（本能）模型

一个本能是一个小型的学习行为：

```yaml
---
id: prefer-functional-style
trigger: "当编写新函数时"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---

# 优先使用函数式风格

## Action（行动）
在适当的时候使用函数式模式而不是类。

## Evidence（证据）
- 观察到 5 次函数式模式偏好
- 用户在 2025-01-15 将基于类的方法纠正为函数式
```

**属性**：
- **Atomic（原子化）** — 一个触发器，一个行动
- **Confidence-weighted（置信度加权）** — 0.3 = 试探性，0.9 = 几乎确定
- **Domain-tagged（领域标签）** — code-style、testing、git、debugging、workflow 等
- **Evidence-backed（证据支持）** — 跟踪创建它的观察记录

## 工作原理

```
会话活动
      │
      │ Hooks 捕获提示词 + 工具使用（100% 可靠）
      ▼
┌─────────────────────────────────────────┐
│         observations.jsonl              │
│   （提示词、工具调用、结果）              │
└─────────────────────────────────────────┘
      │
      │ Observer Agent 读取（后台，Haiku）
      ▼
┌─────────────────────────────────────────┐
│          模式检测 (PATTERN DETECTION)    │
│   • 用户纠正 → 本能                      │
│   • 错误解决 → 本能                      │
│   • 重复工作流 → 本能                    │
└─────────────────────────────────────────┘
      │
      │ 创建/更新
      ▼
┌─────────────────────────────────────────┐
│         instincts/personal/             │
│   • prefer-functional.md (0.7)          │
│   • always-test-first.md (0.9)          │
│   • use-zod-validation.md (0.6)         │
└─────────────────────────────────────────┘
      │
      │ /evolve 聚类
      ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • commands/new-feature.md             │
│   • skills/testing-workflow.md          │
│   • agents/refactor-specialist.md       │
└─────────────────────────────────────────┘
```

## 快速开始

### 1. 启用观察 Hooks

添加到你的 `~/.claude/settings.json`。

**如果作为插件安装**（推荐）：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

**如果手动安装** 到 `~/.claude/skills`：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

### 2. 初始化目录结构

Python CLI 会自动创建这些目录，你也可以手动创建：

```bash
mkdir -p ~/.claude/homunculus/{instincts/{personal,inherited},evolved/{agents,skills,commands}}
touch ~/.claude/homunculus/observations.jsonl
```

### 3. 使用 Instinct 命令

```bash
/instinct-status     # 显示学习的本能及置信度分数
/evolve              # 将相关本能聚类为技能/命令
/instinct-export     # 导出本能用于分享
/instinct-import     # 从他人导入本能
```

## 命令列表

| 命令 | 说明 |
|------|------|
| `/instinct-status` | 显示所有学习的本能及置信度 |
| `/evolve` | 将相关本能聚类为技能/命令 |
| `/instinct-export` | 导出本能用于分享 |
| `/instinct-import <file>` | 从他人导入本能 |

## 配置

编辑 `config.json`：

```json
{
  "version": "2.0",
  "observation": {
    "enabled": true,
    "store_path": "~/.claude/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7
  },
  "instincts": {
    "personal_path": "~/.claude/homunculus/instincts/personal/",
    "inherited_path": "~/.claude/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.05
  },
  "observer": {
    "enabled": true,
    "model": "haiku",
    "run_interval_minutes": 5,
    "patterns_to_detect": [
      "user_corrections",
      "error_resolutions",
      "repeated_workflows",
      "tool_preferences"
    ]
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.claude/homunculus/evolved/"
  }
}
```

## 文件结构

```
~/.claude/homunculus/
├── identity.json           # 你的个人配置、技术水平
├── observations.jsonl      # 当前会话观察记录
├── observations.archive/   # 已处理的观察记录
├── instincts/
│   ├── personal/           # 自动学习的本能
│   └── inherited/          # 从他人导入的本能
└── evolved/
    ├── agents/             # 生成的专家代理
    ├── skills/             # 生成的技能
    └── commands/           # 生成的命令
```

## 与 Skill Creator 集成

当你使用 [Skill Creator GitHub App](https://skill-creator.app) 时，它现在会生成**两种格式**：
- 传统的 SKILL.md 文件（向后兼容）
- Instinct 集合（用于 v2 学习系统）

从代码仓库分析得到的本能会有 `source: "repo-analysis"` 标记，并包含源仓库 URL。

## Confidence（置信度）评分

置信度会随时间演化：

| 分数 | 含义 | 行为 |
|------|------|------|
| 0.3 | 试探性 | 建议但不强制执行 |
| 0.5 | 中等 | 相关时应用 |
| 0.7 | 强烈 | 自动批准应用 |
| 0.9 | 几乎确定 | 核心行为 |

**置信度提升**的情况：
- 模式被重复观察到
- 用户没有纠正建议的行为
- 来自其他来源的类似本能相互印证

**置信度降低**的情况：
- 用户明确纠正了该行为
- 长时间未观察到该模式
- 出现矛盾的证据

## 为什么用 Hooks 而不是 Skills 来观察？

> "v1 依赖 Skills 来观察。Skills 是概率性的——根据 Claude 的判断，触发率约 50-80%。"

Hooks 是 **100% 确定性触发** 的。这意味着：
- 每个工具调用都会被观察到
- 不会遗漏任何模式
- 学习是全面的

## 向后兼容性

v2 与 v1 完全兼容：
- 现有的 `~/.claude/skills/learned/` 技能仍然有效
- Stop hook 仍然运行（但现在也会输入到 v2）
- 渐进迁移路径：可以同时运行 v1 和 v2

## 隐私保护

- 观察记录**保存在本地**机器上
- 只有**本能**（模式）可以被导出
- 不会分享实际的代码或对话内容
- 你控制导出的内容

## 相关资源

- [Skill Creator](https://skill-creator.app) - 从仓库历史生成本能
- [Homunculus](https://github.com/humanplane/homunculus) - v2 架构的灵感来源
- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - 持续学习章节

---

*基于本能的学习：一次一个观察，教会 Claude 你的模式。*
