# 报工页面模板

移动端报工 H5 页面，支持工单选择、物料信息展示和报工提交。

## 📁 文件结构

```
report-app/
├── index.html              # 主页面
├── css/custom.css          # 自定义样式
├── js/
│   ├── main.js            # 主应用逻辑（MainApp 类）
│   └── common.js          # 工具函数 + UI组件
├── services/
│   ├── core.js            # API服务 + 认证服务
│   └── business.js        # 工单服务 + 报工服务
├── api_doc/               # API 接口文档（精简版）
│   ├── 工单列表_BLACKLAKE-1686655055663532.json
│   ├── 生产任务列表_BLACKLAKE-1681109889053785.json
│   ├── 报工物料列表_BLACKLAKE-1681369551143844.json
│   ├── 批量报工_BLACKLAKE-1681109889053798.json
│   └── 报工记录列表_BLACKLAKE-1681109889053794.json
└── README.md
```

---

## 🔗 核心接口调用流程

```
1. 工单列表 → 获取 workOrderId、物料信息
        ↓
2. 生产任务列表 → 获取 taskId、executorIds
        ↓
3. 报工物料列表 → 获取 progressReportKey、reportUnitId
        ↓
4. 批量报工 → 提交报工
        ↓
5. 报工记录列表 → 查询最新报工记录
```

### 接口与代码位置对照

| 接口 | 文档 | 代码位置 | 方法 |
|------|------|---------|------|
| 工单列表 | `api_doc/工单列表_*.json` | `services/business.js:28` | `getWorkOrderList` |
| 生产任务列表 | `api_doc/生产任务列表_*.json` | `services/business.js:303` | `getReportRequiredParams` |
| 报工物料列表 | `api_doc/报工物料列表_*.json` | `services/business.js:324` | `getReportRequiredParams` |
| 批量报工 | `api_doc/批量报工_*.json` | `services/business.js:499` | `submitReport` |
| 报工记录列表 | `api_doc/报工记录列表_*.json` | `services/business.js:643` | `getReportRecordsByTask` |

---

## 🎯 关键代码位置

### index.html 关键区域

| 区域 | 元素ID | 行号 | 用途 |
|------|--------|------|------|
| 工单选择 | `#work-order-selector` | ~34 | 工单选择按钮 |
| 工单下拉 | `#work-order-dropdown` | ~69 | 工单列表弹窗 |
| 空状态 | `#empty-state` | ~111 | 未选工单时显示 |
| 物料信息 | `#material-info` | ~122 | 显示物料名称、编号 |
| 报工表单 | `#report-form` | ~167 | 数量输入等表单 |
| 提交按钮 | `#submit-btn` | ~245 | 提交报工 |

### js/main.js 关键方法

| 方法 | 行号 | 用途 |
|------|------|------|
| `onWorkOrderSelected` | ~169 | 工单选择后的处理 |
| `extractMaterialDataFromWorkOrder` | ~204 | 从工单提取物料信息 |
| `switchToMaterialView` | ~252 | 显示物料信息区域 |
| `handleSubmit` | ~323 | 提交报工处理 |
| `handleSubmitSuccess` | ~380 | 报工成功后处理 |

### services/business.js 关键方法

| 方法 | 行号 | 用途 |
|------|------|------|
| `getWorkOrderList` | ~28 | 获取工单列表 |
| `processWorkOrderListResponse` | ~85 | 处理工单响应 |
| `getReportRequiredParams` | ~287 | 获取报工必填参数 |
| `buildReportRequestParams` | ~406 | 构建报工请求 |
| `submitReport` | ~499 | 提交报工 |
| `getReportRecordsByTask` | ~643 | 查询报工记录 |

---

## 🛠️ AI 修改指南

### 常见修改场景

#### 场景 1：修改表单字段
- **位置**: `index.html` 的 `#report-form` 区域 (~167行)
- **模式**: 复制相邻的 `<div class="flex items-center justify-between">` 结构

#### 场景 2：修改物料信息显示
- **位置**: 
  - HTML: `index.html` 的 `#material-info` 区域 (~122行)
  - JS: `js/main.js` 的 `extractMaterialDataFromWorkOrder` 方法 (~204行)

#### 场景 3：修改报工提交逻辑
- **位置**: `js/main.js` 的 `handleSubmit` 方法 (~323行)
- **数据来源**: `this.state.selectedWorkOrder` 和 `this.state.materialData`

#### 场景 4：修改接口参数
- **位置**: `services/business.js` 的对应方法
- **必读**: `api_doc/` 下的接口文档

#### 场景 5：添加报工记录显示
- **步骤**:
  1. 在 `index.html` 添加显示区域
  2. 在 `js/main.js` 的 `handleSubmitSuccess` 中调用 `reportService.getReportRecordsByTask`
  3. 渲染报工记录列表

### 修改原则

1. **接口字段必须与 api_doc 一致** - 禁止凭空创造字段
2. **优先使用现有方法** - 不要重写已有逻辑
3. **保持代码风格一致** - 参考相邻代码
4. **批量修改** - 同一文件的修改一次完成

---

## 📝 关键数据结构

### 工单数据 (workOrder)

```javascript
{
  workOrderId: 12345,           // 工单ID（用于报工）
  workOrderCode: "WO-001",      // 工单编号
  materialInfo: {               // 物料信息
    baseInfo: {
      id: 100,                  // 物料ID
      name: "产品A",            // 物料名称（加工物料名称）
      code: "M001"              // 物料编码（物料编号）
    }
  },
  qualifiedHoldAmount: {        // 合格数量
    amount: 100,
    amountDisplay: "100"
  }
}
```

### 报工必填参数 (requiredParams)

```javascript
{
  taskId: 67890,                // 生产任务ID（必填）
  progressReportMaterial: {     // 报工物料（必填，不可修改结构）
    lineId: 111,
    materialId: 100,
    reportProcessId: 222
  },
  outputMaterialUnit: {
    id: 333                     // 报工单位ID（reportUnitId）
  },
  executorIds: [1, 2, 3]        // 执行人ID列表
}
```

---

## 🎨 样式配置

主题色配置在 `css/custom.css`：

```css
:root {
  --primary-color: #02b980;     /* 主色 */
  --primary-hover: #029968;     /* 悬停色 */
  --primary-light: #e6f7f1;     /* 浅色背景 */
}
```

---

## ⚡ 技术栈

- **HTML5** + **Tailwind CSS** + **原生 JavaScript (ES6+)**
- **无需构建**，直接作为静态资源访问
