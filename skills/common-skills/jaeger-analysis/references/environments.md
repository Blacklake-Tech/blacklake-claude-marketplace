# Jaeger 环境配置参考

本文档列出了 BlackLake 平台各环境的 Jaeger 访问地址和配置信息。

## 生产环境

### 阿里环境 (ali-prod)

- **Jaeger UI**: http://jaeger.ali-prod.blacklake.tech
- **API 地址**: http://jaeger.ali-prod.blacklake.tech/api
- **用途**: 主力生产环境
- **识别关键字**: `ali-prod`, `jaeger.ali-prod`

### 华为环境 (hwyx-prod)

- **Jaeger UI**: http://jaeger.hwyx-prod.blacklake.tech
- **API 地址**: http://jaeger.hwyx-prod.blacklake.tech/api
- **用途**: 华为云生产环境
- **识别关键字**: `hwyx-prod`, `hw`

### 国泰环境 (guotai)

- **Jaeger UI**: http://jaeger.guotai.blacklake.tech
- **API 地址**: http://jaeger.guotai.blacklake.tech/api
- **用途**: 国泰专属环境
- **识别关键字**: `guotai`, `gt`

## 测试环境

### 阿里测试环境 (ali-test)

- **Jaeger UI**: http://jaeger.ali-test.blacklake.tech
- **API 地址**: http://jaeger.ali-test.blacklake.tech/api
- **用途**: 集成测试环境
- **识别关键字**: `ali-test`, `test`

## URL 格式说明

### 标准 Trace URL 格式

```
http://{jaeger-host}/trace/{32位traceID}?uiFind={32位traceID}
```

示例：
```
http://jaeger.ali-prod.blacklake.tech/trace/abc123def45678901234567890abcdef?uiFind=abc123def45678901234567890abcdef
```

### Trace ID 格式

- 长度: 32 位十六进制字符串
- 字符范围: `a-f`, `0-9`
- 示例: `abc123def45678901234567890abcdef`

### 支持的 URL 变体

脚本支持解析以下格式的 URL：

1. 完整 URL: `http://jaeger.ali-prod.blacklake.tech/trace/abc...`
2. 包含端口的 URL: `http://jaeger.ali-prod.blacklake.tech:16686/trace/abc...`
3. HTTPS URL: `https://jaeger.ali-prod.blacklake.tech/trace/abc...`
4. 仅 Trace ID: `abc123def45678901234567890abcdef`

## 环境识别优先级

当 URL 匹配多个环境时，按以下优先级识别：

1. 精确匹配完整域名
2. 匹配环境关键字（ali-prod > hwyx-prod > guotai > ali-test）
3. 从 URL 提取基础地址作为回退

## 连接测试

测试 Jaeger 服务连接：

```bash
# 测试 UI 服务
curl -s http://jaeger.ali-prod.blacklake.tech/

# 测试 API 服务
curl -s http://jaeger.ali-prod.blacklake.tech/api/services
```

## 注意事项

1. **网络访问**: 部分环境可能需要 VPN 或内网访问
2. **数据保留**: 生产环境数据保留期通常为 7 天
3. **访问权限**: 某些环境可能需要身份认证
4. **并发限制**: API 调用可能有频率限制，避免高频请求
