# Jaeger 错误模式参考指南

本文档收录了在 BlackLake 平台 Jaeger 分布式追踪中常见的错误模式及其分析解决方案。

## 目录

1. [数据库相关错误](#数据库相关错误)
2. [网络与连接错误](#网络与连接错误)
3. [服务治理错误](#服务治理错误)
4. [资源耗尽错误](#资源耗尽错误)
5. [业务逻辑错误](#业务逻辑错误)

---

## 数据库相关错误

### Communications link failure

**特征**
- 错误消息包含 "Communications link failure"
- 通常发生在数据库操作 span 中
- 可能伴随连接超时

**根本原因**
- 网络不稳定导致数据库连接中断
- SQL 查询性能差，执行时间过长
- 数据库连接池配置不当
- 数据库服务器负载过高

**解决方案**
1. 优化慢查询 SQL，添加合适的索引
2. 调整连接池配置（最大连接数、超时时间）
3. 检查数据库服务器状态和负载
4. 考虑实施读写分离或分库分表

**Jaeger 中识别**
```json
{
  "key": "error",
  "value": true
}
{
  "key": "exception",
  "value": "Communications link failure"
}
```

---

### 连接池耗尽

**特征**
- 错误消息包含 "Connection pool exhausted" 或 "Timeout waiting for connection"
- 大量 span 同时处于等待状态

**根本原因**
- 并发量突增超出连接池容量
- 连接泄露（未正确释放）
- 连接池配置过小

**解决方案**
1. 增加连接池最大连接数
2. 检查连接泄露，确保 finally 块中释放连接
3. 使用连接池监控，及时发现异常
4. 考虑使用 HikariCP 等高性能连接池

---

## 网络与连接错误

### Connection Refused / Connection Timeout

**特征**
- 目标服务 span 显示连接错误
- 调用方服务正常，被调用方无响应

**根本原因**
- 目标服务未启动或已崩溃
- 网络防火墙限制
- DNS 解析失败
- 服务实例被摘除但调用方未及时更新

**解决方案**
1. 检查目标服务健康状态
2. 检查网络连通性和防火墙规则
3. 检查服务注册中心（Nacos/Eureka）状态
4. 确认负载均衡配置正确

---

### TimeoutException

**特征**
- Span 持续时间接近或等于超时阈值
- 错误标签包含 timeout 相关信息

**根本原因**
- 服务处理时间过长
- 下游服务链路过长
- 网络延迟高
- 超时配置不合理

**解决方案**
1. 优化服务处理逻辑
2. 使用异步调用减少阻塞
3. 调整合理的超时时间（建议逐级递减）
4. 实施熔断降级策略

**Jaeger 中识别**
```json
{
  "key": "error.kind",
  "value": "TimeoutException"
}
```

---

## 服务治理错误

### CircuitBreakerOpenException

**特征**
- 错误消息包含 "CircuitBreaker" 或 "熔断"
- 短时间内大量请求失败
- 随后快速失败（未到达下游）

**根本原因**
- 下游服务故障率过高
- 熔断器阈值设置过低
- 服务雪崩效应

**解决方案**
1. 优先恢复下游服务
2. 调整熔断器阈值（失败率、时间窗口）
3. 实施降级策略（返回默认值/缓存数据）
4. 增加服务监控告警

**Jaeger 中识别**
```json
{
  "key": "exception",
  "value": "CircuitBreakerOpenException"
}
```

---

### RateLimitExceededException

**特征**
- 错误消息包含 "RateLimit" 或 "限流"
- 请求被拒绝，未到达业务逻辑

**根本原因**
- 请求频率超过阈值
- 突发流量冲击
- 限流规则配置不合理

**解决方案**
1. 实施客户端限流（令牌桶/漏桶算法）
2. 使用消息队列削峰填谷
3. 调整限流阈值
4. 考虑服务扩容

---

## 资源耗尽错误

### ResourceExhaustedException / OOM

**特征**
- 错误消息包含 "ResourceExhausted" 或 "OutOfMemory"
- 服务响应时间逐渐变长后崩溃
- 可能伴随 GC 频繁

**根本原因**
- 内存泄露
- 请求处理占用内存过大
- 并发量超出服务能力
- JVM 内存配置不足

**解决方案**
1. 分析 heap dump 找出内存泄露点
2. 优化大对象创建和缓存策略
3. 增加 JVM 内存配置（-Xmx）
4. 实施服务限流和扩容

**Jaeger 中识别**
```json
{
  "key": "exception",
  "value": "java.lang.OutOfMemoryError"
}
```

---

## 业务逻辑错误

### NullPointerException

**特征**
- 错误消息包含 "NullPointerException"
- 发生在具体业务代码位置

**根本原因**
- 对象未初始化
- 方法返回 null 未做判空处理
- 并发情况下对象被置空

**解决方案**
1. 使用 Optional 包装可能为 null 的返回值
2. 添加前置条件检查（Guava Preconditions）
3. 使用 @NonNull / @Nullable 注解
4. 完善单元测试覆盖边界情况

---

### IllegalArgumentException

**特征**
- 参数校验失败
- 通常发生在方法入口处

**根本原因**
- 参数值超出允许范围
- 参数格式不正确
- 缺少必要参数

**解决方案**
1. 加强参数校验（JSR-303 Bean Validation）
2. 提供清晰的错误消息
3. 使用默认值处理可选参数
4. API 文档中明确参数约束

---

## 分析技巧

### 1. 识别错误传播路径

在 Jaeger 中观察错误如何从下游服务传播到上游：

```
Service A (error) → Service B (error) → Service C (success)
                     ↑
                     错误源头通常在最下游的成功服务之后
```

### 2. 关联日志分析

将 Jaeger trace 与日志关联：
- 找到错误 span 的 traceID
- 在日志系统中搜索相同 traceID 的日志
- 结合日志中的详细错误信息

### 3. 时间线分析

关注时间线视图：
- 哪个 span 最先出错
- 错误传播的时间间隔
- 是否有并发调用同时失败

### 4. 标签分析

关键标签：
- `error`: true - 标记错误 span
- `http.status_code`: 非 2xx HTTP 状态码
- `exception`: 异常类型和消息
- `otel.status_code`: ERROR - OpenTelemetry 错误标记

---

## 常见解决方案速查表

| 问题 | 快速解决方案 |
|------|-------------|
| 数据库连接超时 | 检查连接池配置，优化 SQL |
| 服务调用超时 | 调整超时时间，实施熔断 |
| 内存溢出 | 分析 heap dump，增加内存 |
| 熔断触发 | 恢复下游服务，调整阈值 |
| 限流触发 | 限流扩容，削峰填谷 |
| 空指针异常 | 添加判空，使用 Optional |
