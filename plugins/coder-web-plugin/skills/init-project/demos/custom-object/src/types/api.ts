/**
 * API 相关类型定义
 */

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  code?: number;
  success?: boolean;
  data: T;
  message?: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页响应
 */
export interface PaginationResponse<T = any> {
  list: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 列表查询参数（通用）
 */
export interface ListQueryParams extends PaginationParams {
  [key: string]: any;
}

/**
 * 详情查询参数
 */
export interface DetailParams {
  instanceId: string;
  objectCode: string;
}

/**
 * 删除参数
 */
export interface DeleteParams {
  ids: string[];
  objectCode: string;
}

/**
 * 创建/更新数据参数
 */
export interface CreateOrUpdateParams {
  objectCode: string;
  [key: string]: any;
}

