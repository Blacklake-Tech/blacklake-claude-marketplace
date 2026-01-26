import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { getAuthToken } from '../utils/auth';
import { getOpenApiAccessToken } from '../utils/openapiAuth';

// 获取 API 基础 URL
const getBaseURL = (): string => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 根据环境自动判断
  if (import.meta.env.PROD) {
    // 生产环境
    return 'https://v3-feature.blacklake.cn/api';
  }

  // 开发环境使用代理，直接使用 /api
  return '/api';
};

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 检查是否是 openapi 路径
// openapi 路径特征：
// 1. 包含 /openapi/ 的路径
// 2. 包含 /api/v1/ 的路径（openapi 标准路径）
// 3. 包含 /open/v1/ 或 /open/v2/ 的路径（自定义对象 openapi 路径）
// 4. 或者通过配置明确标记为 openapi 路径
// 注意：/custom-object/domain/ 和 /metadata-domain/ 不是 openapi 路径，使用用户 token
const isOpenApiPath = (url: string): boolean => {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    // 检查路径是否包含 openapi 相关标识
    return (
      path.includes('/openapi/') ||
      path.includes('/api/v1/') ||
      path.includes('/open/v1/') ||
      path.includes('/open/v2/') ||
      path.includes('openapi-domain')
    );
  } catch (error) {
    // 如果 URL 解析失败，使用简单字符串匹配
    return (
      url.includes('/openapi/') ||
      url.includes('/api/v1/') ||
      url.includes('/open/v1/') ||
      url.includes('/open/v2/')
    );
  }
};

// 请求拦截器
instance.interceptors.request.use(
  async (config) => {
    let url = config.url || '';
    
    // 检查是否是包含 /open/v1/ 或 /open/v2/ 的 openapi 路径
    // 这类路径需要特殊处理：在前面加上 /openapi/domain/web/v1/route
    if (url.includes('/open/v1/') || url.includes('/open/v2/')) {
      // 如果路径还没有 /openapi/domain/web/v1/route 前缀，则添加
      if (!url.includes('/openapi/domain/web/v1/route')) {
        url = `/openapi/domain/web/v1/route${url.startsWith('/') ? '' : '/'}${url}`;
        config.url = url;
      }
    }
    
    const fullUrl = config.baseURL ? `${config.baseURL}${url}` : url;

    // 检查是否是 openapi 路径
    const isOpenApi = isOpenApiPath(fullUrl);

    if (isOpenApi) {
      // openapi 路径使用 appAccessToken（免登录）
      try {
        const appAccessToken = await getOpenApiAccessToken();
        if (appAccessToken) {
          config.headers['X-AUTH'] = appAccessToken;
        }
      } catch (error) {
        // 如果获取失败，不设置 token，让请求继续（后端会返回错误）
      }
    } else {
      // 普通路径使用用户 token
      // 兼容 bf-main-3：优先使用 X-AUTH 头（与 bf-main-3 一致）
      const token = getAuthToken();
      if (token && token !== 'expired') {
        config.headers['X-AUTH'] = token;
        // 如果需要同时支持标准 Authorization 头，可以取消注释下面这行
        // config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    // 根据后端返回的数据结构处理
    if (data.code === 200 || data.success) {
      return data.data || data;
    }
    // 业务错误处理
    message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    // HTTP 错误处理
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('未授权，请重新登录');
          // 可以跳转到登录页
          break;
        case 403:
          message.error('拒绝访问');
          break;
        case 404:
          message.error('请求地址不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default instance;

