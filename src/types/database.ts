// 数据库相关类型定义

// 兼容本地（Next.js）运行的 D1Database 类型定义
export interface D1Database {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<{ success: boolean; meta: { last_row_id: number }; error?: string }>;
    };
  };
}

// 图片记录接口
export interface ImageRecord {
  id?: number;
  name: string;
  originalName: string;
  url: string;
  filePath: string;
  fileFormat: string;
  fileSize: number;
  uploadTime?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  tags?: string | null;
  description?: string | null;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Telegram fields in img table
  tgMessageId?: number | null;
  tgFileId?: string | null;
  tgFilePath?: string | null;
  tgEndpoint?: string | null;
  tgFieldName?: string | null;
  tgFileName?: string | null;
}

// 图片统计信息类型
export interface ImageStats {
  total: number;
  public: number;
  deleted: number;
  totalSize: number;
}

// 数据库查询结果类型
export interface QueryResult<T = unknown> {
  results?: T[];
  success?: boolean;
  meta?: {
    last_row_id?: number;
    changes?: number;
  };
}

// 用于 Next.js API 的环境变量类型扩展
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      CF_ACCOUNT_ID: string;
      CF_API_TOKEN: string;
      CF_DATABASE_ID: string;
      TELEGRAM_BOT_TOKEN: string;
      TELEGRAM_CHAT_ID: string;
      TG_BOT_TOKEN: string;
      TG_CHAT_ID: string;
      USER_NAME?: string;
      PASSWORD?: string;
    }
  }
  // Cloudflare Workers 本地绑定（仅在 Workers 环境存在）
  // eslint-disable-next-line no-var
  var DB: D1Database | undefined;
}
