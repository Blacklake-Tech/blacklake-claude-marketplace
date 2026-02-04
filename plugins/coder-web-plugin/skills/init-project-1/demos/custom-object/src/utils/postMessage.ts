/**
 * PostMessage 通信工具
 * 用于嵌入页面和父系统之间的消息传递
 * 兼容 bf-main-3 的消息格式
 */

export interface PostMessageData {
  type: string;
  payload?: any;
  timestamp?: number;
  // bf-main-3 的登出消息格式
  isLogOut?: boolean;
  message?: string;
}

export interface PostMessageHandler {
  (data: PostMessageData, event: MessageEvent): void;
}

// 登出回调函数
let logoutHandler: ((message?: string) => void) | null = null;

/**
 * PostMessage 管理器
 */
class PostMessageManager {
  private handlers: Map<string, PostMessageHandler[]> = new Map();
  private targetOrigin: string = '*'; // 默认允许所有源，生产环境应该设置具体域名

  constructor() {
    this.init();
  }

  /**
   * 初始化消息监听
   */
  private init() {
    window.addEventListener('message', (event: MessageEvent) => {
      // 验证消息来源（可选）
      // if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
      //   return;
      // }

      try {
        const data: PostMessageData = typeof event.data === 'string' 
          ? JSON.parse(event.data) 
          : event.data;

        if (data && data.type) {
          this.handleMessage(data, event);
        }
      } catch (error) {
        console.error('PostMessage 解析失败:', error);
      }
    });
  }

  /**
   * 处理接收到的消息
   * 兼容 bf-main-3 的消息格式
   */
  private handleMessage(data: PostMessageData, event: MessageEvent) {
    // 处理 bf-main-3 的登出消息（格式：{ isLogOut: true, message: 'xxx' }）
    if (data.isLogOut && logoutHandler) {
      try {
        logoutHandler(data.message);
      } catch (error) {
        console.error('处理登出消息失败:', error);
      }
      return;
    }

    // 处理标准格式的消息
    if (data && data.type) {
      const handlers = this.handlers.get(data.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(data, event);
          } catch (error) {
            console.error(`PostMessage 处理器执行失败 [${data.type}]:`, error);
          }
        });
      }
    }
  }

  /**
   * 发送消息到父窗口
   */
  send(type: string, payload?: any, targetOrigin?: string) {
    if (window.parent === window) {
      console.warn('当前页面不在 iframe 中，无法发送消息到父窗口');
      return;
    }

    const message: PostMessageData = {
      type,
      payload,
      timestamp: Date.now(),
    };

    window.parent.postMessage(
      message,
      targetOrigin || this.targetOrigin
    );
  }

  /**
   * 注册消息处理器
   */
  on(type: string, handler: PostMessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    // 返回取消注册函数
    return () => {
      this.off(type, handler);
    };
  }

  /**
   * 取消注册消息处理器
   */
  off(type: string, handler: PostMessageHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 设置目标源
   */
  setTargetOrigin(origin: string) {
    this.targetOrigin = origin;
  }

  /**
   * 发送页面加载完成消息
   */
  sendReady() {
    this.send('page:ready', {
      url: window.location.href,
      title: document.title,
    });
  }

  /**
   * 发送页面错误消息
   */
  sendError(error: Error | string) {
    this.send('page:error', {
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
    });
  }

  /**
   * 发送页面数据变化消息
   */
  sendDataChange(data: any) {
    this.send('page:dataChange', data);
  }

  /**
   * 发送页面路由变化消息
   */
  sendRouteChange(path: string) {
    this.send('page:routeChange', { path });
  }

  /**
   * 设置登出回调函数（用于处理 bf-main-3 的登出消息）
   */
  setLogoutHandler(handler: (message?: string) => void) {
    logoutHandler = handler;
  }
}

// 创建单例
export const postMessageManager = new PostMessageManager();

// 导出便捷方法
export const sendMessage = (type: string, payload?: any) => {
  postMessageManager.send(type, payload);
};

export const onMessage = (type: string, handler: PostMessageHandler) => {
  return postMessageManager.on(type, handler);
};

