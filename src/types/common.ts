// 通用类型定义

// 分页参数类型
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页信息类型
export interface PaginationInfo extends PaginationParams {
  total: number;
  hasMore: boolean;
  totalPages: number;
}

// 排序参数类型
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 过滤参数类型
export interface FilterParams {
  [key: string]: unknown;
}

// 搜索参数类型
export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: FilterParams;
  sort?: SortParams;
}

// 文件信息类型
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// 上传进度类型
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// 通用状态类型
export type Status = 'idle' | 'loading' | 'success' | 'error';

// 通用操作结果类型
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 时间戳类型
export type Timestamp = string | number | Date;

// ID类型
export type ID = string | number;
