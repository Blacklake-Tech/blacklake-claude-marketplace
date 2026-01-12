---
name: git-workflow
description: Git 工作流程序性知识，提供 Conventional Commits 规范、提交分析模板、Rebase 操作指南和 Type/Scope 推断规则。当需要分析提交历史、生成规范提交消息、执行 Git 操作时使用。
---

# Git 工作流程序性知识

## 【通用规范】

参考：[通用规范](./COMMON.md)

## 【Conventional Commits 规范】

### 格式定义

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type 类型完整列表

| Type | 说明 | 使用场景 | 示例 |
|------|------|---------|------|
| `feat` | 新功能 | 添加新特性、新模块 | `feat(auth): 添加 OAuth2 登录` |
| `fix` | Bug 修复 | 修复缺陷、错误 | `fix(api): 修复用户查询接口` |
| `docs` | 文档 | 文档变更 | `docs(readme): 更新安装说明` |
| `style` | 代码格式 | 不影响功能的格式调整 | `style: 统一使用单引号` |
| `refactor` | 重构 | 既不是新功能也不是修复 | `refactor(db): 优化查询逻辑` |
| `perf` | 性能优化 | 提升性能的代码更改 | `perf(render): 减少重渲染` |
| `test` | 测试 | 添加或修改测试 | `test(user): 添加单元测试` |
| `build` | 构建 | 构建系统或依赖变更 | `build(deps): 升级 vue 到 3.4` |
| `ci` | CI/CD | CI 配置文件和脚本 | `ci(github): 添加自动部署` |
| `chore` | 其他 | 不修改源码的其他更改 | `chore(release): 发布 v1.0.0` |
| `revert` | 回滚 | 回滚之前的提交 | `revert: 回滚 feat(auth)` |

### Type 推断决策树

```
变更内容
├─ 新增文件/功能？
│  └─ feat
├─ 包含关键词（fix/bug/修复/issue）？
│  └─ fix
├─ 重构/重命名？
│  └─ refactor
├─ 文档文件（.md/README）？
│  └─ docs
├─ 测试文件（*test*/*spec*）？
│  └─ test
├─ 依赖文件（package.json/pom.xml）？
│  └─ build
├─ CI 配置（.github/.gitlab-ci）？
│  └─ ci
├─ 子模块（.gitmodules）？
│  └─ chore(submodule)
├─ 性能相关（关键词：performance/optimize）？
│  └─ perf
└─ 其他配置/工具？
   └─ chore
```

### Scope 推断规则

从文件路径提取模块名：

**通用规则**：
- 使用文件路径的第一层或第二层目录
- 保持简短（通常 1-2 个单词）
- 使用项目约定的模块名

**常见模式**：

| 文件路径 | Scope | 说明 |
|---------|-------|------|
| `src/api/*` | `api` | API 相关 |
| `src/ui/*` | `ui` | UI 组件 |
| `src/components/*` | `ui` | UI 组件 |
| `plugins/*` | `plugin` | 插件相关 |
| `*.gitmodules` | `submodule` | 子模块 |
| `config/*` | `config` | 配置文件 |
| `docs/*` | `docs` | 文档 |
| `tests/*` | `test` | 测试 |
| 根目录配置 | 省略 | 全局配置 |

**特殊情况**：
- 多个模块：选择主要模块或省略 scope
- 全局影响：省略 scope
- 子模块：固定使用 `submodule`

### Subject 编写指南

**基本规则**：
- 使用祈使语气（添加、修复、更新）
- 英文首字母小写
- 不超过 50 字符
- 结尾不加句号
- 简明扼要，直接描述变更

**语言选择**：
- 中文项目：优先使用中文
- 英文项目：使用英文
- 保持项目内一致性

**好的示例**：
```
✅ feat(auth): 添加 OAuth2 登录支持
✅ fix(api): 修复用户查询接口空指针异常
✅ docs: 更新 API 文档
✅ refactor(db): 优化数据库连接池
```

**不好的示例**：
```
❌ feat(auth): 添加了 OAuth2 登录支持。（使用了完成时态，有句号）
❌ fix: 修复了一个 bug（不具体）
❌ Update README.md（首字母大写，缺少 type）
❌ feat(authentication-and-authorization): 添加功能（scope 太长）
```

## 【提交分析模板】

### 分析单个提交

```bash
# 获取提交的详细信息
git show <commit_hash> --stat --format="%h|%s|%an|%ad"

# 获取提交的 diff
git show <commit_hash> --format="" --name-status
```

**输出解析**：
- `A` - 新增文件 → 可能是 feat
- `M` - 修改文件 → 需要查看内容
- `D` - 删除文件 → 可能是 refactor 或 chore
- `R` - 重命名文件 → refactor

### 分析提交历史

```bash
# 获取最近 N 个提交
git log --oneline -N --format="%h|%s|%ad" --date=format:'%Y-%m-%d'

# 检测提交格式
echo "$message" | grep -E '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+'
```

### 识别重复提交

**模式匹配**：
1. **完全相同**：消息完全一致
2. **仅数字不同**：`修改1`、`修改2`、`修改3`
3. **无意义消息**：`1`、`2`、`test`、`wip`、`tmp`、`update`

**识别算法**：
```python
# 伪代码
def is_duplicate(commits):
    groups = {}
    for commit in commits:
        # 移除数字后缀
        base = re.sub(r'\d+$', '', commit.message)
        # 移除常见无意义词
        base = base.strip().lower()
        
        if base in meaningless_words:
            groups[base].append(commit)
        elif base in groups:
            groups[base].append(commit)
    
    return [g for g in groups.values() if len(g) > 1]
```

### 识别不规范提交

**检测规则**：
```regex
^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+
```

**常见不规范模式**：
- 缺少 type：`添加登录功能`
- 格式错误：`Feat: 添加功能`（首字母大写）
- 冒号错误：`feat(auth) 添加功能`（缺少冒号）
- Scope 格式：`feat[auth]: 添加功能`（使用方括号）

## 【Rebase 操作指南】

### 交互式 Rebase

```bash
# 开始交互式 rebase
git rebase -i HEAD~N

# 或指定起始提交
git rebase -i <commit_hash>
```

### Rebase 命令

| 命令 | 简写 | 说明 | 使用场景 |
|------|------|------|---------|
| `pick` | `p` | 保留提交 | 默认，不修改 |
| `reword` | `r` | 修改提交消息 | 改写不规范提交 |
| `edit` | `e` | 修改提交内容 | 修改提交内容 |
| `squash` | `s` | 合并到上一个提交 | 合并重复提交 |
| `fixup` | `f` | 合并但丢弃消息 | 合并临时提交 |
| `drop` | `d` | 删除提交 | 删除无用提交 |

### Rebase 工作流程

**1. 合并重复提交**：

```bash
# 原提交历史
pick abc1234 更新
pick def5678 更新
pick ghi9012 更新

# 修改为
pick abc1234 更新
squash def5678 更新
squash ghi9012 更新

# 然后编辑合并后的消息
chore: 批量更新配置文件
```

**2. 改写不规范提交**：

```bash
# 原提交历史
pick abc1234 添加功能

# 修改为
reword abc1234 添加功能

# 然后编辑新消息
feat(auth): 添加用户登录功能
```

### Rebase 冲突处理

```bash
# 查看冲突
git status

# 解决冲突后
git add <resolved_files>
git rebase --continue

# 放弃 rebase
git rebase --abort

# 跳过当前提交
git rebase --skip
```

### Rebase 安全措施

1. **创建备份分支**：
```bash
git branch back/operation-$(date +%Y%m%d)
```

2. **检查远程状态**：
```bash
git status -sb
```

3. **验证结果**：
```bash
git log --oneline -N
```

4. **回滚操作**：
```bash
git reset --hard back/operation-20260112
```

## 【提交消息生成模板】

### 自动生成流程

```
1. 分析暂存区变更
   ↓
2. 推断 type（根据文件类型和内容）
   ↓
3. 提取 scope（根据文件路径）
   ↓
4. 生成 subject（根据变更内容）
   ↓
5. 组合成完整消息
   ↓
6. 验证格式
```

### 生成规则

**Type 推断**：
```python
def infer_type(diff):
    if has_new_files(diff):
        return 'feat'
    elif has_fix_keywords(diff):
        return 'fix'
    elif only_docs_changed(diff):
        return 'docs'
    elif has_refactor_keywords(diff):
        return 'refactor'
    elif only_tests_changed(diff):
        return 'test'
    elif deps_changed(diff):
        return 'build'
    elif ci_changed(diff):
        return 'ci'
    else:
        return 'chore'
```

**Scope 提取**：
```python
def extract_scope(files):
    # 提取最常见的目录
    dirs = [f.split('/')[1] for f in files if '/' in f]
    if not dirs:
        return None
    
    # 返回最常见的目录
    return most_common(dirs)
```

**Subject 生成**：
```python
def generate_subject(diff, files):
    # 分析变更内容
    if is_new_feature(diff):
        return f"添加{feature_name(diff)}"
    elif is_bug_fix(diff):
        return f"修复{bug_description(diff)}"
    elif is_update(diff):
        return f"更新{updated_item(diff)}"
    else:
        return f"调整{changed_item(diff)}"
```

## 【验证和检查】

### 提交消息验证

```bash
# 验证单个消息
echo "$message" | grep -E '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+'

# 验证所有提交
git log --oneline -N --format="%s" | while read msg; do
    if ! echo "$msg" | grep -E '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?: .+'; then
        echo "不规范: $msg"
    fi
done
```

### 提交历史检查

```bash
# 检查重复提交
git log --oneline -N --format="%s" | sort | uniq -c | sort -rn

# 检查提交作者
git log --oneline -N --format="%an" | sort | uniq -c

# 检查提交日期分布
git log --oneline -N --format="%ad" --date=short | sort | uniq -c
```

## 【最佳实践】

### 提交频率

- **小步提交**：每个提交只做一件事
- **逻辑完整**：每个提交都是可工作的状态
- **及时提交**：完成一个功能点就提交

### 提交消息

- **描述变更**：说明做了什么，不是怎么做的
- **使用动词**：添加、修复、更新、删除
- **避免模糊**：具体说明变更内容
- **保持简洁**：不超过 50 字符

### 分支管理

- **主分支保护**：main/master 分支保持稳定
- **功能分支**：每个功能使用独立分支
- **定期合并**：及时合并主分支变更
- **清理分支**：合并后删除功能分支

### 历史整理

- **PR 前整理**：提交 PR 前整理提交历史
- **合并相关**：合并相关的小提交
- **改写规范**：统一提交消息格式
- **保留备份**：整理前创建备份分支

## 【常见问题】

### Q1: 如何处理已推送的提交？

**A**: 如果提交已推送到远程：
1. 确认没有其他人基于这些提交工作
2. 本地修改后使用 `git push --force-with-lease`
3. 通知团队成员更新本地仓库

### Q2: Rebase 和 Merge 的选择？

**A**: 
- **Rebase**：保持线性历史，适合整理个人分支
- **Merge**：保留分支历史，适合合并功能分支
- **建议**：个人分支用 rebase，团队协作用 merge

### Q3: 如何恢复误操作？

**A**:
1. 使用 `git reflog` 查看操作历史
2. 找到误操作前的提交哈希
3. 使用 `git reset --hard <hash>` 恢复
4. 或使用备份分支恢复

### Q4: 提交消息写错了怎么办？

**A**:
- **最后一次提交**：`git commit --amend`
- **历史提交**：`git rebase -i` 使用 reword
- **已推送**：修改后 force push（需谨慎）

## 【参考资源】

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Git 官方文档](https://git-scm.com/doc)
- [Pro Git 书籍](https://git-scm.com/book/zh/v2)
