---
name: curd-development
description: 
    当用户提出以下类型的需求时，触发此 SKILL：
    - "帮我创建一个新业务的 CRUD"
    - "生成 XXX 功能的增删改查"
    - "新建一个 XXX 模块"
    - "实现 XXX 的基础接口"
    - 包含 "新建"、"创建"、"生成" CRUD 相关关键词
---

# CRUD开发规范

## 第一步：收集信息

在开始生成代码前，必须向用户收集以下信息：

### 必填信息

1. 表名（英文，小写下划线格式，如：produce_task）
2. 表中文名称（如：生产任务）
3. 字段列表（字段名、类型、说明）
请用户直接提供表结构信息，或要求用户提供数据库表设计。
4. 文件生成目录地址
请用户直接提供CRUD文件要生成的文件根目录 然后自己判断对应的文件需要创建在哪个目录下 可读取项目的CLAUDE.md协助理解目录结构
默认文件位置，在项目下找到/{服务名}/modules/{模块名}/service/src/main/kotlin/tech
服务名类似于mfg-domain med-domain
模块名类似 produce-define work-order

### 可选信息

1. 接口类型（app/api/web，默认：web）
2. 特殊业务逻辑（如：需要关联查询其他表）

### 信息收集提示词模板

我需要收集一些信息来生成 CRUD 代码：

1. 请提供数据库表名（英文，小写下划线格式，如：work_order_process）
2. 请提供表中文名称（如：工单工序）
3. 请提供表字段列表，格式如下：
   - 字段名（英文） | 类型 | 说明 | 是否必填
   例如：
   - work_order_id | Long | 工单ID | 是
   - process_id | Long | 工序ID | 是
   - quantity | BigDecimal | 数量 | 是
   - remark | String | 备注 | 否
   或者直接提供表的DDL
4. 请提供文件生成目录  如/mfg-domain/modules/produce-task/service/src/main/kotlin/tech
请提供以上信息，我将为你生成完整的 CRUD 代码。

## 第二步：确定命名规则

根据收集的信息，按照以下规则生成所有类名和文件名：

### 命名转换规则

表名（下划线）→ 类名前缀（驼峰）

produce_task        → ProduceTask
work_order_process  → WorkOrderProcess
feed_record         → FeedRecord
task_trace_relationship → TaskTraceRelationship

### 生成所有类名

假设表名为：{table_name}（如：produce_task）
类名前缀为：{ClassName}（如：ProduceTask）

1. PO:      {ClassName}PO        (如：ProduceTaskPO)
2. DO:      {ClassName}DO        (如：ProduceTaskDO)
3. VO:      {ClassName}VO        (如：ProduceTaskVO)
4. CO:      {ClassName}QueryCO   (查询)
            {ClassName}CreateCO  (创建)
            {ClassName}UpdateCO  (更新)
            {ClassName}DeleteCO  (删除)
5. Mapper:  {ClassName}Mapper    (如：ProduceTaskMapper)
6. Repository: {ClassName}Repository (如：ProduceTaskRepository)
7. Service:     {ClassName}Service    (如：ProduceTaskService)
8. ServiceImpl: {ClassName}ServiceImpl (如：ProduceTaskServiceImpl)
9. Controller:  {ClassName}{api_type}Controller (需要区分客户端是web还是app如：ProduceTaskWebController或者ProduceTaskAppController)

### 确定 URL 路径

接口类型：{api_type} (app/api/web)
基础路径：/{api_type}/v1/{table_name}

例如：
app 类型，produce_task 表 → /app/v1/produce_task

---

## 第三步：确定文件路径

### 目录结构

读取项目的CLAUDE.md获取，如果没有，探索项目结构
基于用户给到的目录地址，结合项目目录结构，自行判断每个类型的文件需要创建的位置，然后创建文件。

### 基本要素

- controller类在controller目录下，controller目录下有app、web、api文件夹，分别存放app、web、api的controller类
- CO类和VO类放在  controller.app.co/vo 或者 controller.web.co/vo下
- DO类放在 dao.dataobject下
- service类放在service目录下，其实现类放在service.impl下
- PO类放在 dao.po目录下
- mapper类放在 dao.mapper下
- repository放在 dao.repository下
- converter放在converter下

## 第四步：生成代码（按顺序）

### 4.1 生成 PO（持久化对象）

**文件路径**：`dao/po/{module}/{ClassName}PO.kt`

**生成规则**：

参考code-reference.md中的PO创建代码片段

**字段类型映射表**：
参考code-reference.md中的字段类型完整映射表

### 4.2 生成 DO（领域对象）

**文件路径**：`dao/dataobject/{module}/{ClassName}DO.kt`

**生成规则**：

参考code-reference.md中的DO创建代码片段

**DO 与 PO 的区别**：

- DO 不包含基础字段（createdAt, updatedAt 等）
- DO 可以包含关联对象（如：productInfo, userInfo 等）
- DO 用于 Service 层内部传递

---

### 4.3 生成 Mapper

**文件路径**：`dao/mapper/{ClassName}Mapper.kt`

**生成规则**：

参考code-reference.md中的Mapper创建代码片段

### 4.4 生成 Repository

**文件路径**：`dao/respository/{module}/{ClassName}Repository.kt`

**生成规则**：

参考code-reference.md中的Repository创建代码片段

### 4.5 生成 CO（请求对象）

**文件路径**：`controller/{api_type}/co/{module}/{ClassName}QueryCO.kt`

**生成规则**：

参考code-reference.md中的CO创建代码片段

### 4.6 生成 VO（返回对象）

**文件路径**：`controller/{api_type}/vo/{module}/{ClassName}VO.kt`

**生成规则**：

参考code-reference.md中的VO创建代码片段

### 4.7 生成 Service 接口

**文件路径**：`service/{module}/{ClassName}Service.kt`

**生成规则**：

参考code-reference.md中的Service创建代码片段

### 4.8 生成 ServiceImpl

**文件路径**：`service/{module}/impl/{ClassName}ServiceImpl.kt`

**生成规则**：

参考code-reference.md中的ServiceImpl创建代码片段

### 4.9 生成 Converter

**文件路径**：`converter/{module}/{ClassName}PO2DOConverter.kt`

**生成规则**：

参考code-reference.md中的Converter创建代码片段

### 4.10 生成 Controller

**文件路径**：`controller/{api_type}/{module}/{ClassName}Controller.kt`

**生成规则**：

参考code-reference.md中的Controller创建代码片段

## 第五步：验证和输出

### 验证清单

生成代码后，检查以下项目：

✓ 所有类名遵循驼峰命名规范
✓ PO 继承了 KtBasePO
✓ Mapper 继承了 BaseMapper<PO>
✓ ServiceImpl 实现了 Service 接口
✓ Controller 所有方法使用 @PostMapping
✓ Controller 所有参数使用 @RequestBody
✓ Controller 返回值使用 Result()
✓ 所有注解完整（@RestController, @Service, @Repository, @Mapper）
✓ Swagger 注解完整（@Api, @ApiOperation, @ApiModel, @ApiModelProperty）

### 输出格式

已成功生成 {表中文名称} CRUD 代码：

📁 生成的文件：

1. dao/db/model/{module}/{ClassName}PO.kt
2. dao/dataobject/{module}/{ClassName}DO.kt
3. dao/db/mapper/{ClassName}Mapper.kt
4. dao/respository/{module}/{ClassName}Repository.kt
5. controller/{api_type}/co/{module}/{ClassName}QueryCO.kt
6. controller/{api_type}/co/{module}/{ClassName}CreateCO.kt
7. controller/{api_type}/co/{module}/{ClassName}UpdateCO.kt
8. controller/{api_type}/co/{module}/{ClassName}DeleteCO.kt
9. controller/{api_type}/vo/{module}/{ClassName}VO.kt
10. service/{module}/{ClassName}Service.kt
11. service/{module}/impl/{ClassName}ServiceImpl.kt
12. converter/{module}/{ClassName}PO2DOConverter.kt
13. converter/{module}/{ClassName}CO2POConverter.kt
14. converter/{module}/{ClassName}DO2VOConverter.kt
15. controller/{api_type}/{module}/{ClassName}Controller.kt

🔗 API 接口：

- POST /{api_type}/v1/{table_name}/_detail  (查询详情)
- POST /{api_type}/v1/{table_name}/_create  (创建)
- POST /{api_type}/v1/{table_name}/_update  (更新)
- POST /{api_type}/v1/{table_name}/_delete  (删除)

✅ 所有代码已按照项目规范生成

---

## 重要提醒

1. **严格按照此 SKILL 执行**：不要自行改变代码结构
2. **所有占位符必须替换**：{ClassName}、{table_name}、{module} 等
3. **字段映射必须准确**：仔细检查每个字段的类型和命名
4. **先收集信息再生成**：不要假设字段信息，必须向用户确认
5. **保持代码一致性**：使用统一的命名和格式
6. **选择性填充TODO**：遇到service实现过程中不知道如何构建关联外部信息，可先填入TODO，并提醒用户待实现
7. **从0到90**：本SKILL的目的是从0构建到90，90-100的细节需要用户自己完善
