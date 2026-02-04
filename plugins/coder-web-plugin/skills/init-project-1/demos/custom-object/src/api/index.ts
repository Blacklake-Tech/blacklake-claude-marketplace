import request from './request';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

// 简约的 API 调用方法
const api = {
  // GET 请求
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.get<ApiResponse<T>>(url, config).then((res) => res as unknown as T);
  },

  // POST 请求
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.post<ApiResponse<T>>(url, data, config).then((res) => res as unknown as T);
  },

  // PUT 请求
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.put<ApiResponse<T>>(url, data, config).then((res) => res as unknown as T);
  },

  // DELETE 请求
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.delete<ApiResponse<T>>(url, config).then((res) => res as unknown as T);
  },

  // PATCH 请求
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.patch<ApiResponse<T>>(url, data, config).then((res) => res as unknown as T);
  },
};

export default api;
export type { ApiResponse };

