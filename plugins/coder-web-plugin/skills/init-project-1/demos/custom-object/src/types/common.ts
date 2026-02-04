/**
 * 通用类型定义
 */

/**
 * 基础数据项接口
 */
export interface BaseDataItem {
  id: string;
  [key: string]: any;
}

/**
 * 选项接口（用于 Select、Radio 等组件）
 */
export interface OptionItem {
  label: string;
  value: string | number;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * 键值对接口
 */
export interface KeyValuePair {
  key: string;
  value: any;
}

/**
 * 文件节点接口（用于文件树等场景）
 */
export interface FileNode {
  title: string;
  key: string;
  children?: FileNode[];
  isLeaf?: boolean;
  content?: string;
  path?: string;
}

/**
 * 菜单项接口
 */
export interface MenuItem {
  title: string;
  key: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  popconfirm?: boolean;
  auth?: string;
  [key: string]: any;
}

/**
 * 表格列配置接口（扩展 Ant Design Table Column）
 */
export interface TableColumn<T = any> {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  sorter?: boolean | ((a: T, b: T) => number);
  filterConfig?: FilterConfig;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  [key: string]: any;
}

/**
 * 筛选配置接口
 */
export interface FilterConfig {
  type: FilterFieldTypeValue;
  label?: string;
  name?: string;
  rules?: Array<{ required?: boolean; message?: string; [key: string]: any }>;
  customProps?: Record<string, any>;
}

/**
 * 筛选字段类型（与 components/layout/constants.ts 保持一致）
 */
export const FilterFieldType = {
  text: 1, // 单行文本
  number: 2, // 数值
  textArea: 3, // 多行文本
  select: 4, // 单选
  multiSelect: 5, // 多选
  boolean: 6, // 布尔值
  integer: 7, // 整数
  date: 8, // 日期时间
  url: 9, // 链接
  reference: 10, // 引用字段
} as const;

export type FilterFieldTypeValue = typeof FilterFieldType[keyof typeof FilterFieldType];

