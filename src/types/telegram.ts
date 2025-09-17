// Telegram相关类型定义

// Telegram文件类型
export type TelegramFileKind = 'photo' | 'video' | 'audio' | 'document';

// Telegram端点解析类型
export interface EndpointResolution {
  endpoint: 'sendPhoto' | 'sendVideo' | 'sendAudio' | 'sendDocument';
  fieldName: TelegramFileKind;
}

// Telegram API响应类型
export interface TelegramResponse {
  ok: boolean;
  result?: {
    photo?: Array<{ 
      file_id: string; 
      file_size: number; 
      file_name?: string; 
      file_unique_id: string;
    }>;
    video?: { 
      file_id: string; 
      file_name?: string; 
      file_unique_id: string;
    };
    document?: { 
      file_id: string; 
      file_name?: string; 
      file_unique_id: string;
    };
    audio?: { 
      file_id: string; 
      file_name?: string; 
      file_unique_id: string;
    };
  };
}

// Telegram上传结果类型
export interface TelegramUploadResult {
  ok: boolean;
  chatId?: string;
  messageId?: number;
  endpoint: EndpointResolution['endpoint'];
  fieldName: TelegramFileKind;
  file?: TelegramFileInfo | null;
  filePath?: string | null;
  // 可直接落表保存的字段集合（无需 chat_id）
  persistable?: PersistableTelegramInfo | null;
  raw: TelegramResponse;
  error?: string;
}

// 需要在 img 表上持久化的 Telegram 字段（不包含 chat_id）
export interface PersistableTelegramInfo {
  tgMessageId: number | null;
  tgFileId: string | null;
  tgFilePath: string | null;
  tgEndpoint: EndpointResolution['endpoint'] | null;
  tgFieldName: TelegramFileKind | null;
  tgFileName: string | null;
}

// Telegram文件信息类型
export interface TelegramFileInfo {
  file_id: string;
  file_name?: string;
}

// Telegram getFile API响应类型
export interface TelegramGetFileResponse {
  ok: boolean;
  result?: {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
  };
}
