/**
 * Mock 模式状态管理工具
 * 使用 localStorage 持久化存储，支持全局切换
 */

const MOCK_MODE_KEY = 'custom_object_use_mock';

/**
 * 获取当前是否使用 Mock 模式
 */
export const getMockMode = (): boolean => {
  try {
    const stored = localStorage.getItem(MOCK_MODE_KEY);
    return stored === 'true';
  } catch (error) {
    console.warn('读取 Mock 模式状态失败:', error);
    return false;
  }
};

/**
 * 设置 Mock 模式
 */
export const setMockMode = (enabled: boolean): void => {
  try {
    localStorage.setItem(MOCK_MODE_KEY, String(enabled));
    // 触发自定义事件，通知其他模块更新
    window.dispatchEvent(new CustomEvent('mockModeChanged', { detail: { enabled } }));
  } catch (error) {
    console.warn('保存 Mock 模式状态失败:', error);
  }
};

/**
 * 切换 Mock 模式
 */
export const toggleMockMode = (): boolean => {
  const current = getMockMode();
  const newValue = !current;
  setMockMode(newValue);
  return newValue;
};

