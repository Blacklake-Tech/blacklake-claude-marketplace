---
name: git-fetch
description: |
  通过 GitLab API 获取项目源码，用于问题排查时补充代码上下文。
  触发场景：
  1. question-solve-flow 流程中需要查看报错对应的源码
  2. 需要从 GitLab 获取文件内容而不想 clone 整个仓库
  3. 需要查看远程仓库的分支、文件列表或特定文件内容
  4. 根据异常堆栈定位到具体代码位置时需要读取源码
---

# GitLab 源码获取工具

通过 GitLab API 读取项目源码，无需 clone 整个仓库。

## 认证配置

**固定参数：**

- `GITLAB_TOKEN`: `glpat-o_1wDpUr1rvZVYcVsorx`
- `GITLAB_URL`: `https://gitlab.blacklake.tech`

## 工作流程

### 场景：根据堆栈信息获取源码

当 `question-solve-flow` 流程中解析出异常堆栈后，按以下步骤获取源码：

**Step 1: 识别项目信息**

- 从堆栈信息中提取：项目名称、包路径、文件名、行号
- 例如：`com.blacklake.v3.mfg.domain.service.impl.WorkOrderServiceImpl` → 项目可能是 `mfg-domain`

**Step 2: 获取项目 ID**

```bash
# 通过项目路径获取项目信息
# 注意：项目路径需要 URL 编码，/ → %2F
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/v3%2Fmfg-domain"
```

**Step 3: 获取文件内容**

```bash
# 根据包路径和文件名构建文件路径
# 例如：com.blacklake.v3.mfg.domain.service.impl.WorkOrderServiceImpl
# 文件路径：src/main/java/com/blacklake/v3/mfg/domain/service/impl/WorkOrderServiceImpl.java

# 获取文件内容
# 注意：文件路径需要 URL 编码
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/项目ID/repository/files/src%2Fmain%2Fjava%2Fcom%2Fblacklake%2Fv3%2Fmfg%2Fdomain%2Fservice%2Fimpl%2FWorkOrderServiceImpl.java/raw?ref=master"
```

**Step 4: 分析代码**

- 定位到具体的报错行号
- 理解代码逻辑和业务意图
- 标记可能的问题点

---

## 常用操作速查

### 获取项目信息

```bash
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/项目路径URL编码"
# 示例: v3/mfg-domain → v3%2Fmfg-domain
```

### 获取文件列表

```bash
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/项目ID/repository/tree?ref=分支名&path=目录路径"
```

### 获取文件内容（原始文本）

```bash
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/项目ID/repository/files/文件路径URL编码/raw?ref=分支名"
```

### 搜索文件

```bash
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/项目ID/search?scope=blobs&search=关键字"
```

### 获取分支列表

```bash
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/项目ID/repository/branches"
```

---

## URL 编码规则

| 字符 | 编码 |
|------|------|
| / | %2F |
| : | %3A |
| 空格 | %20 |
| . | %2E |
| - | %2D |
| _ | %5F |

---

## 完整示例

### 示例：获取 mfg-domain 项目中 WorkOrderServiceImpl.java 的内容

```bash
# 1. 获取项目信息，得到项目 ID
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/v3%2Fmfg-domain"
# 返回中包含 "id": 658

# 2. 获取文件内容
PROJECT_ID=658
curl -H "PRIVATE-TOKEN: glpat-o_1wDpUr1rvZVYcVsorx" \
  "https://gitlab.blacklake.tech/api/v4/projects/$PROJECT_ID/repository/files/src%2Fmain%2Fjava%2Fcom%2Fblacklake%2Fv3%2Fmfg%2Fdomain%2Fservice%2Fimpl%2FWorkOrderServiceImpl.java/raw?ref=master"
```

---

## 注意事项

1. **项目路径编码**：`v3/mfg-domain` → `v3%2Fmfg-domain`
2. **文件路径编码**：`src/main/java/App.java` → `src%2Fmain%2Fjava%2FApp.java`
3. **包名转路径**：`com.blacklake.v3.mfg.domain.service` → `com/blacklake/v3/mfg/domain/service`
4. **默认分支**：可通过项目信息的 `default_branch` 字段获取
5. **代码分析**：获取源码后，结合堆栈中的行号定位具体问题代码
