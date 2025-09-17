// API相关类型定义

import { ImageRecord } from './database';

// 基础API响应类型
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

// 登录API响应类型
export type LoginResponseData = BaseApiResponse;

// 上传API响应类型
export interface UploadResponseData extends BaseApiResponse {
  urls?: string[];
  images?: {
    id: number;
    url: string;
    name: string;
    fileSize: number;
    fileFormat: string;
    telegram?: {
      chat_id: string;
      message_id: number;
    };
  }[];
}

// 图片列表API响应类型
export interface ImagesListResponse extends BaseApiResponse {
  images: ImageRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// 图片详情API响应类型
export interface ImageDetailResponse extends BaseApiResponse {
  image?: ImageRecord;
}

// 图片更新请求类型
export interface ImageUpdateRequest {
  name?: string;
  tags?: string;
  description?: string;
  isPublic?: boolean;
}

// 图片搜索请求类型
export interface ImageSearchRequest {
  query: string;
  page?: number;
  limit?: number;
  publicOnly?: boolean;
}

// 文件上传请求类型
export interface FileUploadRequest {
  files: File[];
  tags?: string;
  description?: string;
  isPublic?: boolean;
}

// 错误响应类型
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error?: {
    code: string;
    details?: unknown;
  };
}
