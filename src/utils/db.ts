// 兼容本地（Next.js）运行的 D1Database 类型定义
interface D1Database {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<{ success: boolean; meta: { last_row_id: number }; error?: string }>;
    };
  };
}

// D1 数据库操作工具类
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

export class D1ImageDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // 插入新图片记录
  async insertImage(imageData: Omit<ImageRecord, 'id' | 'uploadTime' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO img (
        name, originalName, url, filePath, fileFormat, fileSize,
        isDeleted, tags, description, isPublic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.bind(
      imageData.name,
      imageData.originalName,
      imageData.url,
      imageData.filePath,
      imageData.fileFormat,
      imageData.fileSize,
      imageData.isDeleted ? 1 : 0,
      imageData.tags || null,
      imageData.description || null,
      imageData.isPublic !== undefined ? (imageData.isPublic ? 1 : 0) : 1
    ).run();

    if (!result.success) {
      throw new Error(`Failed to insert image: ${result.error}`);
    }

    return result.meta.last_row_id;
  }

  // 根据ID获取图片
  async getImageById(id: number): Promise<ImageRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM img WHERE id = ? AND (isDeleted IS NULL OR isDeleted = 0)`);
    const result = await stmt.bind(id).first<ImageRecord>();
    return result || null;
  }

  // 根据URL获取图片
  async getImageByUrl(url: string): Promise<ImageRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM img WHERE url = ? AND (isDeleted IS NULL OR isDeleted = 0)`);
    const result = await stmt.bind(url).first<ImageRecord>();
    return result || null;
  }

  // 获取所有公开图片（分页）
  async getPublicImages(page: number = 1, limit: number = 20): Promise<ImageRecord[]> {
    const offset = (page - 1) * limit;
    const stmt = this.db.prepare(`
      SELECT * FROM img
      WHERE (isPublic IS NULL OR isPublic = 1)
        AND (isDeleted IS NULL OR isDeleted = 0)
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(limit, offset).all<ImageRecord>();
    return result.results || [];
  }

  // 获取所有图片（分页，过滤已删除的图片）
  async getAllImages(page: number = 1, limit: number = 20): Promise<ImageRecord[]> {
    const offset = (page - 1) * limit;
    const stmt = this.db.prepare(`
      SELECT * FROM img
      WHERE (isDeleted IS NULL OR isDeleted = 0)
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(limit, offset).all<ImageRecord>();
    return result.results || [];
  }

  // 软删除图片
  async deleteImage(id: number): Promise<void> {
    // 首先检查图片是否存在
    const existingImage = await this.getImageById(id);
    if (!existingImage) {
      throw new Error(`Image with id ${id} not found`);
    }

    const stmt = this.db.prepare(`
      UPDATE img
      SET isDeleted = 1,
          deletedAt = datetime('now'),
          updatedAt = datetime('now')
      WHERE id = ?
    `);

    const result = await stmt.bind(id).run();
    if (!result.success) {
      throw new Error(`Failed to delete image with id ${id}: ${result.error || 'Unknown error'}`);
    }

    // 验证删除是否成功（可选验证）
    if (result.meta && 'changes' in result.meta && (result.meta as { changes?: number }).changes === 0) {
      throw new Error(`No rows were updated when deleting image with id ${id}`);
    }
  }

  // 更新图片信息
  async updateImage(id: number, updates: Partial<Pick<ImageRecord, 'name' | 'tags' | 'description' | 'isPublic'>>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(updates.tags);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.isPublic !== undefined) {
      fields.push('isPublic = ?');
      values.push(updates.isPublic ? 1 : 0);
    }

    if (fields.length === 0) return;

    fields.push('updatedAt = datetime(\'now\')');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE img
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = await stmt.bind(...values).run();
    if (!result.success) {
      throw new Error(`Failed to update image: ${result.error}`);
    }
  }

  // 搜索图片（根据名称、标签、描述）
  async searchImages(query: string, page: number = 1, limit: number = 20, publicOnly: boolean = true): Promise<ImageRecord[]> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;

    const publicCondition = publicOnly
      ? `AND (isPublic IS NULL OR isPublic = 1)`
      : '';

    const stmt = this.db.prepare(`
      SELECT * FROM img
      WHERE (name LIKE ? OR tags LIKE ? OR description LIKE ?)
        ${publicCondition}
        AND (isDeleted IS NULL OR isDeleted = 0)
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `);

    const result = await stmt.bind(searchPattern, searchPattern, searchPattern, limit, offset).all<ImageRecord>();
    return result.results || [];
  }

  // 获取图片统计信息
  async getImageStats(): Promise<{
    total: number;
    public: number;
    deleted: number;
    totalSize: number;
  }> {
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM img
      WHERE (isDeleted IS NULL OR isDeleted = 0)
    `);
    const publicStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM img
      WHERE (isPublic IS NULL OR isPublic = 1)
        AND (isDeleted IS NULL OR isDeleted = 0)
    `);
    const deletedStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM img
      WHERE isDeleted = 1
    `);
    const sizeStmt = this.db.prepare(`
      SELECT SUM(fileSize) as totalSize FROM img
      WHERE (isDeleted IS NULL OR isDeleted = 0)
    `);

    const [totalResult, publicResult, deletedResult, sizeResult] = await Promise.all([
      totalStmt.bind().first<{ count: number }>(),
      publicStmt.bind().first<{ count: number }>(),
      deletedStmt.bind().first<{ count: number }>(),
      sizeStmt.bind().first<{ totalSize: number }>()
    ]);

    return {
      total: totalResult?.count || 0,
      public: publicResult?.count || 0,
      deleted: deletedResult?.count || 0,
      totalSize: sizeResult?.totalSize || 0
    };
  }

  // 直接在 img 表上更新 Telegram 字段
  async updateImageTelegramInfo(
    id: number,
    info: Partial<Pick<ImageRecord, 'tgMessageId' | 'tgFileId' | 'tgFilePath' | 'tgEndpoint' | 'tgFieldName' | 'tgFileName'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (info.tgMessageId !== undefined) { fields.push('tgMessageId = ?'); values.push(info.tgMessageId); }
    if (info.tgFileId !== undefined) { fields.push('tgFileId = ?'); values.push(info.tgFileId); }
    if (info.tgFilePath !== undefined) { fields.push('tgFilePath = ?'); values.push(info.tgFilePath); }
    if (info.tgEndpoint !== undefined) { fields.push('tgEndpoint = ?'); values.push(info.tgEndpoint); }
    if (info.tgFieldName !== undefined) { fields.push('tgFieldName = ?'); values.push(info.tgFieldName); }
    if (info.tgFileName !== undefined) { fields.push('tgFileName = ?'); values.push(info.tgFileName); }

    if (fields.length === 0) return;

    fields.push('updatedAt = datetime(\'now\')');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE img
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    const result = await stmt.bind(...values).run();
    if (!result.success) {
      throw new Error(`Failed to update telegram info: ${result.error}`);
    }
  }

  // 通过 tgFileId 获取图片
  async getImageByTelegramFileId(fileId: string): Promise<ImageRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM img WHERE tgFileId = ? AND (isDeleted IS NULL OR isDeleted = 0)`);
    const result = await stmt.bind(fileId).first<ImageRecord>();
    return result || null;
  }
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
    }
  }
  // Cloudflare Workers 本地绑定（仅在 Workers 环境存在）
  // eslint-disable-next-line no-var
  var DB: D1Database | undefined;
}

// 使用 Cloudflare API 直接操作 D1 数据库的类
import Cloudflare from 'cloudflare';

export class CloudflareD1Client {
  private accountId: string;
  private databaseId: string;
  private cf: Cloudflare;

  constructor(accountId: string, apiToken: string, databaseId: string) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.cf = new Cloudflare({ apiToken });
  }

  async query(sql: string, params: unknown[] = []): Promise<{ results?: unknown[]; success?: boolean; meta?: { last_row_id?: number } }> {
    try {
      const page = await this.cf.d1.database.query(this.databaseId, {
        account_id: this.accountId,
        sql,
        params: params as string[],
      });
      // SDK returns a SinglePage<QueryResult> with `result` array
      // Gracefully handle empty result sets
      const first = page.result?.[0];
      if (!first) {
        return { results: [], success: true, meta: {} };
      }
      return first;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`D1 query failed: ${message}`);
    }
  }

  // 模拟 D1Database 接口
  prepare(sql: string) {
    return {
      bind: (...params: unknown[]) => ({
        first: async <T = unknown>(): Promise<T | null> => {
          const result = await this.query(sql, params);
          return (result.results?.[0] as T) || null;
        },
        all: async <T = unknown>(): Promise<{ results: T[] }> => {
          const result = await this.query(sql, params);
          return { results: (result.results as T[]) || [] };
        },
        run: async (): Promise<{ success: boolean; meta: { last_row_id: number }; error?: string }> => {
          try {
            const result = await this.query(sql, params);
            return {
              success: true,
              meta: { last_row_id: result.meta?.last_row_id || 0 }
            };
          } catch (error) {
            return {
              success: false,
              meta: { last_row_id: 0 },
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      })
    };
  }
}

// 创建数据库连接
export async function createD1Connection(): Promise<D1ImageDB> {
  // 在 Cloudflare Workers 环境中，D1 数据库会自动注入到 env.DB
  if (typeof globalThis.DB !== 'undefined') {
    return new D1ImageDB(globalThis.DB);
  }
  
  // 在 Next.js 环境中，使用 Cloudflare API 直接操作
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const databaseId = process.env.CF_DATABASE_ID;

  if (!accountId || !apiToken || !databaseId) {
    throw new Error('Missing Cloudflare credentials. Please set CF_ACCOUNT_ID, CF_API_TOKEN, and CF_DATABASE_ID environment variables.');
  }

  const d1Client = new CloudflareD1Client(accountId, apiToken, databaseId);
  return new D1ImageDB(d1Client as D1Database);
}
