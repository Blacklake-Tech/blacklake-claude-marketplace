import React from 'react';
import ReactDOM from 'react-dom';
import { Modal } from 'antd';
import 'antd/dist/antd.less';
import './index.css';
import App from './pages/App';
import { initAuth, updateAuthFromMessage, clearAuth } from './utils/auth';
import { postMessageManager } from './utils/postMessage';
import ErrorBoundary from './ErrorBoundary';

// 初始化认证信息（从 URL 参数或 localStorage 获取）
initAuth();

// 监听来自 bf-main-3 的认证信息和登出消息
if (window.parent !== window) {
  // 监听 postMessage 中的认证信息（如果 bf-main-3 将来通过 postMessage 传递 token）
  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      // 如果消息中包含 token 或认证信息，更新认证信息
      if (data && (data.token || data.authToken || data.accessToken)) {
        const authInfo = {
          token: data.token || data.authToken || data.accessToken,
          userId: data.userId,
          userName: data.userName || data.username,
        };
        updateAuthFromMessage(authInfo);
      }
    } catch (error) {
      // 忽略解析错误（可能不是 JSON 格式）
    }
  });

  // 设置登出处理函数（处理 bf-main-3 的登出消息）
  postMessageManager.setLogoutHandler((message) => {
    Modal.confirm({
      title: '登录已过期',
      content: message || '您的登录已过期，请重新登录',
      okText: '确定',
      cancelText: null,
      okCancel: false,
      onOk: () => {
        // 清除认证信息
        clearAuth();
        // 如果需要重定向到登录页，可以在这里添加
        // window.location.href = '/login';
      },
    });
  });
}

// 监听全局错误（这些错误不会被 ErrorBoundary 捕获）
window.addEventListener('error', (event) => {
  postMessageManager.sendError(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  postMessageManager.sendError(event.reason);
});

const container = document.getElementById('mainapp');
if (!container) {
  throw new Error('Failed to find the root element');
}

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
  container,
  () => {
    // 页面渲染完成后发送 ready 消息
    postMessageManager.sendReady();
  }
);
