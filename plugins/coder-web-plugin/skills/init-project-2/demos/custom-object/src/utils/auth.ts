/**
 * 认证工具
 * 兼容 bf-main-3 的认证方式
 * 支持从 URL 参数、localStorage 和 postMessage 获取认证信息
 */

export interface AuthInfo {
  token?: string;
  userId?: string;
  userName?: string;
  [key: string]: any;
}

// 当前认证信息（支持从 postMessage 动态更新）
let currentAuth: AuthInfo = {};

/**
 * 从 URL 参数获取认证信息
 */
export function getAuthFromURL(): AuthInfo {
  const params = new URLSearchParams(window.location.search);
  const auth: AuthInfo = {};

  // 常见的认证参数名称
  const authKeys = [
    'token',
    'accessToken',
    'authToken',
    'userId',
    'userName',
    'username',
  ];

  authKeys.forEach((key) => {
    const value = params.get(key);
    if (value) {
      // 将 token/accessToken/authToken 统一映射到 token
      if (key === 'accessToken' || key === 'authToken') {
        auth.token = value;
      } else {
        auth[key] = value;
      }
    }
  });

  // 支持自定义参数
  params.forEach((value, key) => {
    if (!authKeys.includes(key) && key.startsWith('auth_')) {
      auth[key.replace('auth_', '')] = value;
    }
  });

  return auth;
}

/**
 * 保存认证信息到 localStorage
 */
export function saveAuthToStorage(auth: AuthInfo) {
  try {
    Object.keys(auth).forEach((key) => {
      if (auth[key]) {
        localStorage.setItem(`auth_${key}`, String(auth[key]));
      }
    });
  } catch (error) {
    console.error('保存认证信息失败:', error);
  }
}

/**
 * 从 localStorage 获取认证信息
 * 兼容 bf-main-3 的存储方式：
 * 1. 优先从 bf-main-3 的 token 键读取（FIELDS.TOKEN_NAME = 'token'）
 * 2. 其次从 auth_* 前缀的键读取（aicoder 原有方式）
 */
export function getAuthFromStorage(): AuthInfo {
  const auth: AuthInfo = {};
  
  try {
    // 兼容 bf-main-3：尝试从 'token' 键读取（bf-main-3 使用 LocalStorage.get(FIELDS.TOKEN_NAME)）
    // bf-main-3 的 LocalStorage 会将数据存储为 JSON 格式，需要解析
    const bfTokenRaw = localStorage.getItem('token');
    if (bfTokenRaw) {
      try {
        const bfTokenData = JSON.parse(bfTokenRaw);
        // bf-main-3 的格式：{ meta: {...}, data: 'token_value' }
        if (bfTokenData && bfTokenData.data && bfTokenData.data !== 'expired') {
          auth.token = bfTokenData.data;
        }
      } catch (e) {
        // 如果不是 JSON 格式，直接使用原始值（兼容普通字符串存储）
        if (bfTokenRaw !== 'expired') {
          auth.token = bfTokenRaw;
        }
      }
    }

    // aicoder 原有方式：从 auth_* 前缀的键读取
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('auth_')) {
        const authKey = key.replace('auth_', '');
        const value = localStorage.getItem(key);
        if (value) {
          // 如果 token 还未设置，或者当前值是 auth_token，则使用它
          if (!auth.token || authKey === 'token') {
            auth[authKey] = value;
          } else if (authKey !== 'token') {
            // 其他字段正常设置
            auth[authKey] = value;
          }
        }
      }
    });
  } catch (error) {
    console.error('获取认证信息失败:', error);
  }

  return auth;
}

/**
 * 清除认证信息
 */
export function clearAuth() {
  try {
    // 清除 aicoder 的 auth_* 前缀键
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('auth_')) {
        localStorage.removeItem(key);
      }
    });
    // 清除当前认证信息
    currentAuth = {};
  } catch (error) {
    console.error('清除认证信息失败:', error);
  }
}

/**
 * 初始化认证信息
 * 优先级：1. postMessage 认证信息 > 2. URL 参数 > 3. localStorage
 */
export function initAuth(): AuthInfo {
  // 如果已经有通过 postMessage 设置的认证信息，优先使用
  if (Object.keys(currentAuth).length > 0 && currentAuth.token) {
    return currentAuth;
  }

  // 优先从 URL 获取（bf-main-3 通过 URL 参数传递 token）
  const urlAuth = getAuthFromURL();
  
  // 如果 URL 中有认证信息，保存到 localStorage
  if (Object.keys(urlAuth).length > 0 && urlAuth.token) {
    saveAuthToStorage(urlAuth);
    currentAuth = { ...currentAuth, ...urlAuth };
    return urlAuth;
  }

  // 否则从 localStorage 获取
  const storageAuth = getAuthFromStorage();
  if (Object.keys(storageAuth).length > 0) {
    currentAuth = { ...currentAuth, ...storageAuth };
    return storageAuth;
  }

  return currentAuth;
}

/**
 * 从 postMessage 更新认证信息（用于 bf-main-3 动态传递认证信息）
 */
export function updateAuthFromMessage(auth: AuthInfo) {
  if (auth && Object.keys(auth).length > 0) {
    currentAuth = { ...currentAuth, ...auth };
    // 同时保存到 localStorage（使用 aicoder 的格式）
    saveAuthToStorage(auth);
    // 如果需要兼容 bf-main-3，也可以保存到 'token' 键
    if (auth.token) {
      try {
        // bf-main-3 的格式：{ meta: {...}, data: 'token_value' }
        // 这里简化处理，直接存储 token 值（因为解析时会兼容）
        localStorage.setItem('token', auth.token);
      } catch (error) {
        console.error('保存 token 到 localStorage 失败:', error);
      }
    }
  }
}

/**
 * 获取当前认证信息
 */
export function getCurrentAuth(): AuthInfo {
  return { ...currentAuth };
}

/**
 * 获取认证 token
 * 优先级：1. postMessage 认证信息 > 2. URL 参数 > 3. localStorage
 */
export function getAuthToken(): string | undefined {
  const auth = initAuth();
  return auth.token;
}

