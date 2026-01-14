# 附录：常用代码片段

## 获取当前用户信息

```kotlin
val orgId = BlackBootContext.getOrgId()
val userId = BlackBootContext.getUserId()
```

## 生成全局ID

```kotlin
@Autowired
private lateinit var gidService: BlackBootGidService

val id = gidService.nextId()
```

## 记录日志

```kotlin
private val logger = LoggerFactory.getLogger({ClassName}ServiceImpl::class.java)

logger.info("日志信息")
logger.error("错误信息", e)
```

## 抛出业务异常

```kotlin
import tech.blacklake.dev.core.boot.common.exception.BusinessException

throw BusinessException("错误信息")
```

## QueryWrapper 条件构造

```kotlin
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper

val wrapper = QueryWrapper<{ClassName}PO>()
    .eq("org_id", orgId)
    .eq("deleted_at", 0)
    .eq(status != null, "status", status)
    .like(keyword.isNotBlank(), "name", keyword)
    .orderByDesc("created_at")
```

## 字段类型完整映射表

| SQL 类型 | Kotlin 类型 | 默认值 | QueryWrapper 类型 |
|----------|------------|--------|------------------|
| varchar | String | "" | eq("field", value) |
| char | String | "" | eq("field", value) |
| text | String | "" | eq("field", value) |
| bigint | Long | 0L | eq("field", value) |
| int | Int | 0 | eq("field", value) |
| tinyint | Int | 0 | eq("field", value) |
| decimal | BigDecimal | BigDecimal.ZERO | eq("field", value) |
| double | Double | 0.0 | eq("field", value) |
| float | Float | 0f | eq("field", value) |
| datetime | LocalDateTime | null | eq("field", value) |
| date | LocalDate | null | eq("field", value) |
| timestamp | LocalDateTime | null | eq("field", value) |
| boolean | Boolean | false | eq("field", value) |

## PO创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.dao.db.model.{module}

import tech.blacklake.dev.core.boot.common.annotation.PO
import com.baomidou.mybatisplus.annotation.TableName
import tech.blacklake.dev.mfg.domain.core.service.dao.db.model.base.KtBasePO
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * {表中文名称}PO
 */
@PO
@TableName(value = "{table_name}", schema = "v3_mfg")
data class {ClassName}PO(
    // 主键
    @com.baomidou.mybatisplus.annotation.TableId(type = com.baomidou.mybatisplus.annotation.IdType.ASSIGN_ID)
    override var id: Long = 0L,

    // 租户ID
    var orgId: Long = 0L,

    // 循环用户提供的每个字段，生成以下格式
    // var {fieldCamel}: {fieldType} = {defaultValue},

    // 基础字段（KtBasePO）
    override var creatorId: Long = 0L,
    override var operatorId: Long = 0L,
    override var createdAt: LocalDateTime? = null,
    override var updatedAt: LocalDateTime? = null,
    override var deletedAt: Long = 0,
) : KtBasePO

// 字段类型映射规则：
// String     → String = ""
// Long       → Long = 0L
// Integer    → Int = 0
// BigDecimal → BigDecimal = BigDecimal.ZERO
// Boolean    → Boolean = false
// LocalDateTime → LocalDateTime? = null

// 字段命名转换：
// field_name  → fieldName (下划线转驼峰)
```

## DO创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.dao.dataobject.{module}

import tech.blacklake.dev.core.boot.common.annotation.DO

/**
 * {表中文名称}DO
 */
@DO
data class {ClassName}DO(
    val id: Long,
    val orgId: Long,

    // 循环用户提供的每个业务字段
    // val {fieldCamel}: {fieldType},

    // 可选：关联对象
    // val {relatedObject}: {RelatedObject}DO,
)
```

## Mapper创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.dao.db.mapper

import tech.blacklake.dev.mfg.domain.core.service.dao.db.model.{module}.{ClassName}PO
import org.apache.ibatis.annotations.Mapper
import com.baomidou.mybatisplus.core.mapper.BaseMapper

/**
 * {表中文名称} Mapper
 */
@Mapper
interface {ClassName}Mapper : BaseMapper<{ClassName}PO> {
    // BaseMapper 已提供基础 CRUD 方法：
    // - insert(po)
    // - deleteById(id)
    // - updateById(po)
    // - selectById(id)
    // - selectList(wrapper)
    // - selectCount(wrapper)
}
```

## Repository创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.dao.respository.{module}

import tech.blacklake.dev.mfg.domain.core.service.dao.db.mapper.{ClassName}Mapper
import tech.blacklake.dev.mfg.domain.core.service.dao.db.model.{module}.{ClassName}PO
import org.springframework.stereotype.Repository
import org.springframework.beans.factory.annotation.Autowired
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper
import tech.blacklake.dev.core.boot.common.exception.BusinessException

/**
 * {表中文名称} Repository
 */
@Repository
class {ClassName}Repository {

    @Autowired
    private lateinit var mapper: {ClassName}Mapper

    /**
     * 根据ID查询
     */
    fun getById(id: Long): {ClassName}PO {
        return mapper.selectById(id)
            ?: throw BusinessException("{表中文名称}不存在: $id")
    }

    /**
     * 查询列表
     */
    fun list(orgId: Long): List<{ClassName}PO> {
        return mapper.selectList(
            QueryWrapper<{ClassName}PO>()
                .eq("org_id", orgId)
                .eq("deleted_at", 0)
        )
    }

    /**
     * 保存
     */
    fun save(po: {ClassName}PO): Long {
        mapper.insert(po)
        return po.id
    }

    /**
     * 更新
     */
    fun update(po: {ClassName}PO) {
        mapper.updateById(po)
    }

    /**
     * 删除
     */
    fun delete(id: Long) {
        mapper.deleteById(id)
    }
}
```

## CO创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}

import tech.blacklake.dev.core.boot.common.annotation.CO
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * {表中文名称}查询CO
 */
@CO
@ApiModel(value = "{表中文名称}查询CO")
data class {ClassName}QueryCO(
    @ApiModelProperty("{表中文名称}ID", name = "id", required = true)
    val id: Long,
)
```

**同时生成其他 CO**：

```kotlin
// {ClassName}CreateCO.kt
@CO
@ApiModel(value = "{表中文名称}创建CO")
data class {ClassName}CreateCO(
    @ApiModelProperty("字段1", name = "field1", required = true)
    val field1: {fieldType},
    // ... 其他必填字段
)

// {ClassName}UpdateCO.kt
@CO
@ApiModel(value = "{表中文名称}更新CO")
data class {ClassName}UpdateCO(
    @ApiModelProperty("ID", name = "id", required = true)
    val id: Long,
    @ApiModelProperty("字段1", name = "field1")
    val field1: {fieldType}?,
    // ... 其他可更新字段
)

// {ClassName}DeleteCO.kt
@CO
@ApiModel(value = "{表中文名称}删除CO")
data class {ClassName}DeleteCO(
    @ApiModelProperty("ID", name = "id", required = true)
    val id: Long,
)
```

## VO创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.vo.{module}

import tech.blacklake.dev.core.boot.common.annotation.VO
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * {表中文名称}VO
 */
@VO
@ApiModel(value = "{表中文名称}VO")
data class {ClassName}VO(
    @ApiModelProperty("ID", name = "id")
    val id: Long,

    @ApiModelProperty("字段1", name = "field1")
    val field1: {fieldType},

    @ApiModelProperty("字段2", name = "field2")
    val field2: {fieldType},

    // ... 其他字段
)
```

---

## Service创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.service.{module}

import tech.blacklake.dev.mfg.domain.core.service.dao.dataobject.{module}.{ClassName}DO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}CreateCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}UpdateCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.vo.{module}.{ClassName}VO

/**
 * {表中文名称} Service
 */
interface {ClassName}Service {

    /**
     * 查询详情
     * @param id ID
     * @return {表中文名称}DO
     */
    fun getDetail(id: Long): {ClassName}DO

    /**
     * 创建
     * @param request 创建请求
     * @return {表中文名称}VO
     */
    fun create(request: {ClassName}CreateCO): {ClassName}VO

    /**
     * 更新
     * @param request 更新请求
     */
    fun update(request: {ClassName}UpdateCO)

    /**
     * 删除
     * @param id ID
     */
    fun delete(id: Long)
}
```

## ServiceImpl创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.service.{module}.impl

import tech.blacklake.dev.mfg.domain.core.service.service.{module}.{ClassName}Service
import tech.blacklake.dev.mfg.domain.core.service.dao.respository.{module}.{ClassName}Repository
import tech.blacklake.dev.mfg.domain.core.service.dao.dataobject.{module}.{ClassName}DO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}CreateCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}UpdateCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.vo.{module}.{ClassName}VO
import tech.blacklake.dev.core.boot.common.data.Result
import org.springframework.stereotype.Service
import org.springframework.beans.factory.annotation.Autowired
import tech.blacklake.dev.core.boot.id.BlackBootGidService
import tech.blacklake.dev.core.boot.context.BlackBootContext
import org.slf4j.LoggerFactory
import java.time.LocalDateTime

/**
 * {表中文名称} Service 实现
 */
@Service
class {ClassName}ServiceImpl : {ClassName}Service {

    private val logger = LoggerFactory.getLogger({ClassName}ServiceImpl::class.java)

    @Autowired
    private lateinit var repository: {ClassName}Repository

    @Autowired
    private lateinit var gidService: BlackBootGidService

    override fun getDetail(id: Long): {ClassName}DO {
        // 1. 查询 PO
        val po = repository.getById(id)

        // 2. PO 转 DO
        return {ClassName}PO2DOConverter.toDO(po)
    }

    override fun create(request: {ClassName}CreateCO): {ClassName}VO {
        // 1. 生成 ID
        val id = gidService.nextId()

        // 2. CO 转 PO
        val po = {ClassName}CO2POConverter.toCreatePO(request, id)

        // 3. 保存
        repository.save(po)

        // 4. 查询详情
        val do = getDetail(id)

        // 5. DO 转 VO
        return {ClassName}DO2VOConverter.toVO(do)
    }

    override fun update(request: {ClassName}UpdateCO) {
        // 1. 查询现有数据
        val po = repository.getById(request.id)

        // 2. 更新字段
        val updatedPO = po.copy(
            // 根据请求字段更新
            updatedAt = LocalDateTime.now(),
        )

        // 3. 保存更新
        repository.update(updatedPO)
    }

    override fun delete(id: Long) {
        repository.delete(id)
    }
}
```

## Converter创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.converter.{module}

import tech.blacklake.dev.mfg.domain.core.service.dao.db.model.{module}.{ClassName}PO
import tech.blacklake.dev.mfg.domain.core.service.dao.dataobject.{module}.{ClassName}DO

/**
 * {ClassName} PO 转 DO 转换器
 */
object {ClassName}PO2DOConverter {

    fun toDO(po: {ClassName}PO): {ClassName}DO {
        return {ClassName}DO(
            id = po.id,
            orgId = po.orgId,
            // 映射其他字段
            // field1 = po.field1,
            // field2 = po.field2,
        )
    }

    fun toDOList(poList: List<{ClassName}PO>): List<{ClassName}DO> {
        return poList.map { toDO(it) }
    }
}
```

**同时生成其他 Converter**：

```kotlin
// {ClassName}CO2POConverter.kt
object {ClassName}CO2POConverter {
    fun toCreatePO(co: {ClassName}CreateCO, id: Long): {ClassName}PO {
        val now = LocalDateTime.now()
        return {ClassName}PO(
            id = id,
            orgId = BlackBootContext.getOrgId(),
            // 映射字段
            // field1 = co.field1,
            creatorId = BlackBootContext.getUserId(),
            operatorId = BlackBootContext.getUserId(),
            createdAt = now,
            updatedAt = now,
            deletedAt = 0,
        )
    }
}

// {ClassName}DO2VOConverter.kt
object {ClassName}DO2VOConverter {
    fun toVO(do: {ClassName}DO): {ClassName}VO {
        return {ClassName}VO(
            id = do.id,
            // 映射字段
            // field1 = do.field1,
        )
    }

    fun toVOList(doList: List<{ClassName}DO): List<{ClassName}VO> {
        return doList.map { toVO(it) }
    }
}
```

## Controller创建代码片段

```kotlin
package tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.{module}

import tech.blacklake.dev.mfg.domain.core.service.service.{module}.{ClassName}Service
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}QueryCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}CreateCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}UpdateCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.co.{module}.{ClassName}DeleteCO
import tech.blacklake.dev.mfg.domain.core.service.controller.{api_type}.vo.{module}.{ClassName}VO
import tech.blacklake.dev.core.boot.common.data.Result
import org.springframework.web.bind.annotation.*
import org.springframework.beans.factory.annotation.Autowired
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.slf4j.LoggerFactory

/**
 * {表中文名称} Controller
 */
@RestController
@RequestMapping("/{api_type}/v1/{table_name}")
@Api(value = "{ClassName}", tags = ["{表中文名称}"], description = "{表中文名称}管理")
class {ClassName}Controller {

    private val logger = LoggerFactory.getLogger({ClassName}Controller::class.java)

    @Autowired
    private lateinit var service: {ClassName}Service

    /**
     * 查询详情
     */
    @ApiOperation("查询{表中文名称}详情")
    @PostMapping("/_detail")
    fun getDetail(@RequestBody request: {ClassName}QueryCO): Result<{ClassName}VO> {
        val vo = service.getDetail(request.id)
        return Result(vo)
    }

    /**
     * 创建
     */
    @ApiOperation("创建{表中文名称}")
    @PostMapping("/_create")
    fun create(@RequestBody request: {ClassName}CreateCO): Result<{ClassName}VO> {
        val vo = service.create(request)
        return Result(vo)
    }

    /**
     * 更新
     */
    @ApiOperation("更新{表中文名称}")
    @PostMapping("/_update")
    fun update(@RequestBody request: {ClassName}UpdateCO): Result<String> {
        service.update(request)
        return Result("更新成功")
    }

    /**
     * 删除
     */
    @ApiOperation("删除{表中文名称}")
    @PostMapping("/_delete")
    fun delete(@RequestBody request: {ClassName}DeleteCO): Result<String> {
        service.delete(request.id)
        return Result("删除成功")
    }
}
```
