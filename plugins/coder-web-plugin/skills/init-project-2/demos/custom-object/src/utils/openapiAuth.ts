/**
 * OpenAPI 认证服务
 * 用于获取和管理 appAccessToken（免登录访问 openapi）
 */

export interface OpenApiAuthConfig {
  appKey: string;
  appSecret: string;
  openApiBaseUrl?: string;
}

// 默认配置（可以通过环境变量或配置文件覆盖）
const DEFAULT_CONFIG: OpenApiAuthConfig = {
  appKey: import.meta.env.VITE_OPENAPI_APP_KEY || 'cli_1763965045758069',
  appSecret: import.meta.env.VITE_OPENAPI_APP_SECRET || 'c4571114835b4f24beabcd380ccbe2f7',
  openApiBaseUrl: import.meta.env.VITE_OPENAPI_BASE_URL || 'https://openapi-domain-feature.test.blacklake.tech',
};

// 存储的 token 信息
interface TokenInfo {
  appAccessToken: string;
  expire: number; // 过期时间（秒）
  timestamp: number; // 获取时间戳（毫秒）
}

class OpenApiAuthService {
  private config: OpenApiAuthConfig;
  private tokenInfo: TokenInfo | null = null;
  private tokenKey = 'openapi_app_access_token';
  private fetchingPromise: Promise<string> | null = null;

  constructor(config?: Partial<OpenApiAuthConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadTokenFromStorage();
  }

  /**
   * 获取 appAccessToken
   * 如果 token 已过期或不存在，会自动获取新的 token
   */
  async getAccessToken(): Promise<string> {
    // 如果正在获取中，返回同一个 promise
    if (this.fetchingPromise) {
      return this.fetchingPromise;
    }

    // 检查当前 token 是否有效
    const isValid = this.isTokenValid();

    if (isValid) {
      return this.tokenInfo!.appAccessToken;
    }

    // 获取新 token
    this.fetchingPromise = this.fetchAccessToken();
    try {
      const token = await this.fetchingPromise;
      return token;
    } finally {
      this.fetchingPromise = null;
    }
  }

  /**
   * 检查 token 是否有效
   */
  private isTokenValid(): boolean {
    if (!this.tokenInfo) {
      return false;
    }

    // 检查是否过期（提前 5 分钟刷新）
    const now = Date.now();
    const expireTime = this.tokenInfo.timestamp + (this.tokenInfo.expire - 300) * 1000;
    return now < expireTime;
  }

  /**
   * 从服务器获取 access token
   */
  private async fetchAccessToken(): Promise<string> {
    if (!this.config.appKey || !this.config.appSecret) {
      throw new Error('appKey 或 appSecret 未配置，请设置 VITE_OPENAPI_APP_KEY 和 VITE_OPENAPI_APP_SECRET');
    }

    // 在开发环境中使用代理，生产环境使用完整 URL
    let baseUrl: string;
    if (import.meta.env.DEV) {
      // 开发环境：使用代理路径
      baseUrl = '/api';
    } else {
      // 生产环境：使用完整 URL
      baseUrl = this.config.openApiBaseUrl || 'https://v3-feature.blacklake.cn/api';
    }
    
    // 使用正确的 openapi 接口路径
    const url = `${baseUrl}/openapi/domain/api/v1/access_token/_get_access_token`;

    // 请求参数
    const requestBody = {
      appKey: this.config.appKey,
      appSecret: this.config.appSecret,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取 access token 失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 200 || data.code === 0) {
        const responseData = data.data || data;
        const appAccessToken = responseData.appAccessToken;
        const expire = responseData.expire || 7200; // 默认 2 小时

        if (!appAccessToken) {
          throw new Error('响应中没有找到 appAccessToken');
        }

        // 保存 token
        this.tokenInfo = {
          appAccessToken,
          expire,
          timestamp: Date.now(),
        };

        this.saveTokenToStorage();
        return appAccessToken;
      } else {
        throw new Error(data.message || `获取 access token 失败 (code: ${data.code})`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 从本地存储加载 token
   */
  private loadTokenFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.tokenKey);
      if (stored) {
        this.tokenInfo = JSON.parse(stored);
      }
    } catch (error) {
      // 从存储加载 token 失败，忽略错误
    }
  }

  /**
   * 保存 token 到本地存储
   */
  private saveTokenToStorage(): void {
    try {
      if (this.tokenInfo) {
        localStorage.setItem(this.tokenKey, JSON.stringify(this.tokenInfo));
      }
    } catch (error) {
      // 保存 token 到存储失败，忽略错误
    }
  }

  /**
   * 清除 token
   */
  clearToken(): void {
    this.tokenInfo = null;
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (error) {
      // 清除 token 失败，忽略错误
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OpenApiAuthConfig>): void {
    this.config = { ...this.config, ...config };
    // 如果更新了 appKey 或 appSecret，清除旧 token
    if (config.appKey || config.appSecret) {
      this.clearToken();
    }
  }
}

// 创建全局实例
export const openApiAuthService = new OpenApiAuthService();

// 导出便捷方法
export const getOpenApiAccessToken = () => openApiAuthService.getAccessToken();
export const clearOpenApiToken = () => openApiAuthService.clearToken();
export const updateOpenApiConfig = (config: Partial<OpenApiAuthConfig>) =>
  openApiAuthService.updateConfig(config);

