/**
 * 核心服务
 * 包含API服务和认证服务
 */

// ==================== API服务 ====================

/**
 * API服务基础类
 * 封装HTTP请求，自动处理认证和错误
 */
class ApiService {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * 获取API基础URL
     * @returns {string}
     */
    getBaseURL() {
        // 根据环境自动判断API地址
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // 开发环境，使用黑湖API服务器
            return 'https://v3-feature.blacklake.cn/api';
        } else {
            // 生产环境，使用黑湖API服务器
            return 'https://v3-feature.blacklake.cn/api';
        }
    }

    /**
     * 构建完整的请求URL
     * @param {string} endpoint - API端点
     * @returns {string}
     */
    buildURL(endpoint) {
        // 如果endpoint已经是完整URL，直接返回
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        
        // 确保endpoint以/开头
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        return this.baseURL + endpoint;
    }

    /**
     * 获取请求头
     * @param {Object} customHeaders - 自定义请求头
     * @returns {Object}
     */
    getHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        
        // 添加认证头
        if (authService && authService.isAuthenticated()) {
            Object.assign(headers, authService.getAuthHeaders());
        }
        
        return headers;
    }

    /**
     * 处理响应
     * @param {Response} response - fetch响应对象
     * @returns {Promise<any>}
     */
    async handleResponse(response) {
        // 解析响应数据
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // 处理HTTP状态码错误
        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status}`;
            
            if (typeof data === 'object' && data.message) {
                errorMessage = data.message;
            } else if (typeof data === 'string') {
                errorMessage = data;
            }
            
            // 处理认证错误
            if (response.status === 401 || response.status === 403) {
                if (authService) {
                    const canRetry = await authService.handleAuthError(response);
                    if (canRetry) {
                        throw new Error('AUTH_RETRY'); // 特殊错误，表示可以重试
                    }
                }
            }
            
            throw new Error(errorMessage);
        }

        // 检查业务错误码（即使HTTP状态码是200，业务也可能返回错误）
        if (typeof data === 'object' && data.code !== undefined) {
            // 业务错误码：非200且非0表示错误
            if (data.code !== 200 && data.code !== 0) {
                // 处理认证相关的业务错误
                if (data.subCode && (
                    data.subCode.includes('TOKEN') || 
                    data.subCode.includes('AUTH') ||
                    data.subCode.includes('APP_KEY') ||
                    data.subCode.includes('NOT_EXIST')
                )) {
                    console.warn('业务认证错误:', data.subCode, data.message);
                    if (authService) {
                        const canRetry = await authService.handleAuthError(response);
                        if (canRetry) {
                            throw new Error('AUTH_RETRY');
                        }
                    }
                }
                
                throw new Error(data.message || `业务错误 (code: ${data.code}, subCode: ${data.subCode})`);
            }
        }

        return data;
    }

    /**
     * 发送HTTP请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise<any>}
     */
    async request(endpoint, options = {}) {
        const url = this.buildURL(endpoint);
        const config = {
            method: 'GET',
            headers: this.getHeaders(options.headers),
            ...options
        };

        // 如果有body且不是FormData，转换为JSON字符串
        if (config.body && !(config.body instanceof FormData)) {
            if (typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }
        }

        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                console.log(`API请求: ${config.method} ${url}`, config.body ? JSON.parse(config.body) : '');
                
                const response = await fetch(url, config);
                const result = await this.handleResponse(response);
                
                console.log(`API响应: ${config.method} ${url}`, result);
                return result;
                
            } catch (error) {
                console.error(`API错误: ${config.method} ${url}`, error);
                
                // 如果是认证错误且可以重试
                if (error.message === 'AUTH_RETRY' && retryCount < maxRetries) {
                    retryCount++;
                    // 更新请求头中的认证信息
                    config.headers = this.getHeaders(options.headers);
                    continue;
                }
                
                // 网络错误重试
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch') && retryCount < maxRetries) {
                    retryCount++;
                    await this.delay(1000 * retryCount); // 延迟重试
                    continue;
                }
                
                throw error;
            }
        }
    }

    /**
     * GET请求
     * @param {string} endpoint - API端点
     * @param {Object} params - 查询参数
     * @param {Object} options - 请求选项
     * @returns {Promise<any>}
     */
    async get(endpoint, params = {}, options = {}) {
        // 构建查询字符串
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET',
            ...options
        });
    }

    /**
     * POST请求
     * @param {string} endpoint - API端点
     * @param {any} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<any>}
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
            ...options
        });
    }

    /**
     * PUT请求
     * @param {string} endpoint - API端点
     * @param {any} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise<any>}
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
            ...options
        });
    }

    /**
     * DELETE请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise<any>}
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    /**
     * 上传文件
     * @param {string} endpoint - API端点
     * @param {File|FileList} files - 文件对象
     * @param {Object} additionalData - 额外数据
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<any>}
     */
    async upload(endpoint, files, additionalData = {}, onProgress = null) {
        const formData = new FormData();
        
        // 添加文件
        if (files instanceof FileList) {
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
        } else if (files instanceof File) {
            formData.append('file', files);
        }
        
        // 添加额外数据
        for (const key in additionalData) {
            formData.append(key, additionalData[key]);
        }

        const options = {
            method: 'POST',
            body: formData,
            headers: {} // 不设置Content-Type，让浏览器自动设置
        };

        // 如果需要进度回调，使用XMLHttpRequest
        if (onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve(result);
                        } catch (e) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(new Error(`上传失败: ${xhr.status}`));
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('上传失败'));
                });
                
                xhr.open('POST', this.buildURL(endpoint));
                
                // 添加认证头
                const headers = this.getHeaders();
                for (const key in headers) {
                    if (key !== 'Content-Type') { // 不设置Content-Type
                        xhr.setRequestHeader(key, headers[key]);
                    }
                }
                
                xhr.send(formData);
            });
        }
        
        return this.request(endpoint, options);
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 批量请求
     * @param {Array} requests - 请求数组，每个元素包含 {method, endpoint, data}
     * @returns {Promise<Array>}
     */
    async batch(requests) {
        const promises = requests.map(req => {
            const { method = 'GET', endpoint, data, options = {} } = req;
            
            switch (method.toUpperCase()) {
                case 'GET':
                    return this.get(endpoint, data, options);
                case 'POST':
                    return this.post(endpoint, data, options);
                case 'PUT':
                    return this.put(endpoint, data, options);
                case 'DELETE':
                    return this.delete(endpoint, options);
                default:
                    return Promise.reject(new Error(`不支持的请求方法: ${method}`));
            }
        });

        return Promise.allSettled(promises);
    }

    /**
     * 设置基础URL
     * @param {string} baseURL - 新的基础URL
     */
    setBaseURL(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * 设置默认请求头
     * @param {Object} headers - 请求头对象
     */
    setDefaultHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }
}

// 创建全局API服务实例
const apiService = new ApiService();

// ==================== 认证服务 ====================

/**
 * 默认配置
 * 修改登录账号时，需要同时更新 appKey
 */
const AUTH_CONFIG = {
    // 登录信息
    login: {
        type: 1,
        username: "cyy",
        code: "67768820",
        password: "794db7135639d5b59cd7e53b325f36a8f24fb906e95e403c49e89b99046654fae36a940c1e8496b75b9e69d4f79022c9123aa0d8cd665e2ea9cf584242a702664e77fdd2399c452bd03a174a3edbb41b86a406851b4da8b11b8faa7044925e3e9bffd4fd5afb14c70f592a2114ce5f45cf567e2e1f0d8688ef345ca28c2687c5"
    },
     // AppKey（用于获取user-access token）
     appKey: "cli_1764100796489835"
};

/**
 * 认证服务
 * 处理token获取、存储和管理
 */
class AuthService {
    constructor() {
        this.token = null; // 最终用于业务接口的user-access token
        this.tokenKey = 'work_report_user_access_token';
        this.init();
    }

    /**
     * 初始化认证服务
     */
    async init() {
        try {
            // 1. 先查看URL里是否存在code
            const code = getUrlParameter('code');
            
            if (code) {
                // 如果存在code，直接使用code获取user-access token
                console.log('从URL参数获取到code:', code);
                await this.getUserAccessTokenByCode(code);
            } else {
                // 如果不存在code，走登录流程
                console.log('URL参数中没有code，走登录流程...');
                
                // 2.1 先登录获取token
                console.log('开始登录...');
                const loginResult = await this.loginAndGetToken();
                
                if (!loginResult || !loginResult.token) {
                    throw new Error('登录失败，未获取到token');
                }
                
                console.log('登录成功，获取到登录token');
                
                // 2.2 使用登录token获取code
                console.log('使用登录token获取code...');
                const codeFromApi = await this.getCodeByLoginToken(loginResult.token);
                
                if (!codeFromApi) {
                    throw new Error('获取code失败');
                }
                
                console.log('成功获取code:', codeFromApi);
                
                // 2.3 使用code获取user-access token
                await this.getUserAccessTokenByCode(codeFromApi);
            }
            
            console.log('认证初始化完成，user-access token已获取');
            
        } catch (error) {
            console.error('认证初始化失败:', error);
            showToast('认证初始化失败，请刷新页面重试', 'error');
            throw error; // 抛出错误，让调用方知道初始化失败
        }
    }

    /**
     * 使用code获取user-access token
     * @param {string} code - code参数
     */
    async getUserAccessTokenByCode(code) {
        try {
            if (!code) {
                throw new Error('code参数不能为空');
            }

            console.log('使用code获取user-access token...');
            
            const requestBody = {
                code: code,
                appKey: AUTH_CONFIG.appKey
            };

            const response = await fetch('https://v3-feature.blacklake.cn/api/openapi/domain/api/v1/access_token/_get_user_token_for_customized', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`获取user-access token失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('获取user-access token响应:', data);
            
            // 根据实际响应格式提取token
            if (data.code === 200 || data.code === 0) {
                const tokenData = data.data || data.result || data;
                const userAccessToken = tokenData.token || 
                                      tokenData.userAccessToken || 
                                      tokenData.accessToken ||
                                      data.token ||
                                      data.userAccessToken ||
                                      data.accessToken;
                
                if (userAccessToken) {
                    this.token = userAccessToken;
                    this.saveToken(userAccessToken);
                    console.log('成功获取user-access token');
                } else {
                    throw new Error('响应中没有找到user-access token');
                }
            } else {
                throw new Error(data.message || `获取user-access token失败 (code: ${data.code})`);
            }
            
        } catch (error) {
            console.error('获取user-access token失败:', error);
            throw error;
        }
    }

    /**
     * 使用登录token获取code
     * @param {string} loginToken - 登录获取的token
     * @returns {Promise<string>} 返回code
     */
    async getCodeByLoginToken(loginToken) {
        try {
            if (!loginToken) {
                throw new Error('登录token不能为空');
            }

            console.log('使用登录token获取code...');
            
            const response = await fetch('https://v3-feature.blacklake.cn/api/openapiadmin/domain/web/v1/access_token/_code', {
                method: 'POST',
                headers: {
                    'X-AUTH': loginToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`获取code失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('获取code响应:', data);
            
            // 根据实际响应格式提取code
            if (data.code === 200 || data.code === 0) {
                const codeData = data.data || data.result || data;
                const code = codeData.code || 
                           codeData.accessToken || 
                           data.code ||
                           data.accessToken;
                
                if (code) {
                    console.log('成功获取code');
                    return code;
                } else {
                    throw new Error('响应中没有找到code');
                }
            } else {
                throw new Error(data.message || `获取code失败 (code: ${data.code})`);
            }
            
        } catch (error) {
            console.error('获取code失败:', error);
            throw error;
        }
    }


    /**
     * 登录并获取token
     */
    async loginAndGetToken() {
        try {
            const loginData = {
                type: AUTH_CONFIG.login.type,
                username: AUTH_CONFIG.login.username,
                code: AUTH_CONFIG.login.code,
                password: AUTH_CONFIG.login.password
            };

            console.log('尝试登录获取token...');
            const response = await fetch('https://v3-feature.blacklake.cn/api/user/domain/web/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                throw new Error(`登录失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('登录响应完整数据:', JSON.stringify(data, null, 2));
            console.log('登录响应状态码:', response.status);
            console.log('登录响应headers:', Object.fromEntries(response.headers.entries()));
            
            // 检查响应是否成功（支持多种响应格式）
            const isSuccess = data.success === true || 
                            data.code === 0 || 
                            data.code === 200 || 
                            (data.code === undefined && response.ok);
            
            console.log('登录响应是否成功:', isSuccess, 'code:', data.code, 'success:', data.success);
            
            if (isSuccess) {
                // 尝试从不同位置提取token（这是登录token，用于后续获取code）
                const tokenData = data.data || data.result || data;
                const loginToken = tokenData?.token || 
                                 tokenData?.access_token || 
                                 tokenData?.accessToken ||
                                 data.token ||
                                 data.access_token ||
                                 data.accessToken;
                
                if (loginToken) {
                    console.log('登录成功，获取到登录token');
                    return { token: loginToken };
                } else {
                    const errorMsg = '登录响应中没有找到token';
                    console.error(errorMsg, data);
                    throw new Error(errorMsg);
                }
            } else {
                // 登录失败，抛出错误
                const errorMsg = data.message || data.msg || `登录失败 (code: ${data.code})`;
                console.error('登录失败:', errorMsg, data);
                throw new Error(errorMsg);
            }
            
        } catch (error) {
            console.error('登录接口调用失败:', error);
            throw error; // 重新抛出错误
        }
    }


    /**
     * 获取当前token
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    }

    /**
     * 检查是否已认证
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * 保存token到本地存储
     * @param {string} token - 要保存的token
     */
    saveToken(token) {
        try {
            const tokenData = {
                token: token,
                timestamp: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时后过期
            };
            localStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
        } catch (error) {
            console.error('保存token失败:', error);
        }
    }

    /**
     * 从本地存储获取token
     * @returns {string|null}
     */
    getStoredToken() {
        try {
            const stored = localStorage.getItem(this.tokenKey);
            if (!stored) {
                return null;
            }

            const tokenData = JSON.parse(stored);
            
            // 检查是否过期
            if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
                console.log('存储的token已过期');
                this.clearToken();
                return null;
            }

            return tokenData.token;
            
        } catch (error) {
            console.error('获取存储token失败:', error);
            return null;
        }
    }

    /**
     * 清除token
     */
    clearToken() {
        this.token = null;
        try {
            localStorage.removeItem(this.tokenKey);
        } catch (error) {
            console.error('清除token失败:', error);
        }
    }


    /**
     * 刷新token（重新执行完整的认证流程）
     */
    async refreshToken() {
        console.log('刷新token，重新执行认证流程...');
        this.clearToken();
        await this.init();
    }

    /**
     * 获取认证头部
     * 根据接口文档，所有业务接口都需要使用 X-AUTH 头部，值为 user-access token
     * @returns {Object}
     */
    getAuthHeaders() {
        const headers = {};
        if (this.token) {
            // 使用最终的user-access token
            headers['X-AUTH'] = this.token;
        }
        return headers;
    }

    /**
     * 处理认证错误
     * @param {Response} response - HTTP响应对象
     */
    async handleAuthError(response) {
        if (response.status === 401 || response.status === 403) {
            console.log('认证失败，尝试刷新token');
            showToast('认证已过期，正在重新获取...', 'info');
            
            try {
                await this.refreshToken();
                return true; // 表示可以重试请求
            } catch (error) {
                console.error('刷新token失败:', error);
                showToast('认证失败，请刷新页面', 'error');
                return false;
            }
        }
        return false;
    }

    /**
     * 登出
     */
    logout() {
        this.clearToken();
        showToast('已退出登录', 'info');
        // 可以重定向到登录页面或刷新页面
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// 创建全局认证服务实例
const authService = new AuthService();

