/**
 * ErrorBoundary - 错误边界组件（简化版）
 * 用于捕获子组件的错误并显示降级 UI
 */
import React from 'react';
import { Result, Button, Collapse } from 'antd';
import { useHistory } from 'react-router-dom';
import { postMessageManager } from './utils/postMessage';
import _ from 'lodash';

const { Panel } = Collapse;

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onGoBack?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  href: string;
}

/**
 * 处理 ChunkLoadError（代码块加载错误）
 * 当发生 ChunkLoadError 时，尝试自动刷新页面
 */
const handleChunkLoadError = (href: string) => {
  const storageKey = `${href}_chunkErrorReloadTimes`;
  const reloadTimes = Number(sessionStorage.getItem(storageKey) || '0');

  // 最多自动刷新 5 次
  if (reloadTimes < 5) {
    sessionStorage.setItem(storageKey, String(reloadTimes + 1));
    location.reload();
  }
};

/**
 * 发送错误日志（节流处理）
 */
const sendErrorLog = _.throttle((error: Error, errorInfo: React.ErrorInfo) => {
  // 通过 postMessage 发送错误到父系统
  postMessageManager.sendError(error);

  // 也可以在这里添加其他错误上报逻辑
  console.error('ErrorBoundary 捕获到错误:', error, errorInfo);
}, 2000);

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      href: window.location.href,
    };
  }

  /**
   * 当子组件抛出错误时调用
   * 用于更新 state，使下一次渲染能够显示降级后的 UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 处理 ChunkLoadError（代码块加载错误）
    if (error.name && error.name.includes('ChunkLoadError')) {
      const currentHref = window.location.href;
      handleChunkLoadError(currentHref);
      // 不显示错误 UI，直接刷新
      return {};
    }

    return {
      hasError: true,
      error,
    };
  }

  /**
   * 当 props 或 state 变化时调用
   * 用于在路由变化时重置错误状态
   */
  static getDerivedStateFromProps(
    nextProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    const currentHref = window.location.href;

    // 如果路由变化了，重置错误状态
    if (currentHref !== prevState.href && prevState.hasError) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        href: currentHref,
      };
    }

    return {
      href: currentHref,
    };
  }

  /**
   * 捕获错误信息
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ChunkLoadError 不发送错误日志
    if (error.name && error.name.includes('ChunkLoadError')) {
      return;
    }

    // 保存错误信息，参考参考文件的做法，将错误转换为字符串保存
    this.setState({
      errorInfo,
      error, // 同时保存完整的 error 对象以便展示详细信息
    });

    // 发送错误日志
    sendErrorLog(error, errorInfo);

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * 刷新页面
   */
  handleRefresh = () => {
    location.reload();
  };

  /**
   * 返回上一页
   */
  handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    } else {
      // 默认降级方案
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  /**
   * 渲染错误 UI
   */
  renderErrorUI() {
    const { error, errorInfo } = this.state;

    if (this.props.fallback) {
      return this.props.fallback;
    }

    // 获取错误信息字符串，参考参考文件的做法
    const errorText = error ? error.toString() : (errorInfo ? _.toString(errorInfo) : '未知错误');

    return (
      <Result
        status="error"
        title="页面出现错误"
        subTitle="抱歉，页面遇到了一个错误。您可以尝试刷新页面或返回上一页。"
        extra={[
          <Button key="refresh" onClick={this.handleRefresh}>
            刷新页面
          </Button>,
          <Button key="goBack" type="primary" onClick={this.handleGoBack}>
            返回上一页
          </Button>,
        ]}
      >
        <Collapse defaultActiveKey={['1']} ghost>
          <Panel header="错误信息" key="1">
            <div className="desc">{errorText}</div>
          </Panel>
        </Collapse>
      </Result>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

/**
 * 带路由功能的 ErrorBoundary 包装组件
 * 用于在函数组件中使用 ErrorBoundary，支持路由返回功能
 */
export const ErrorBoundaryWithRouter: React.FC<Omit<ErrorBoundaryProps, 'onError' | 'onGoBack'>> = ({
  children,
  fallback,
}) => {
  const history = useHistory();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      history.goBack();
    } else {
      history.push('/');
    }
  };

  return (
    <ErrorBoundary fallback={fallback} onGoBack={handleGoBack}>
      {children}
    </ErrorBoundary>
  );
};

