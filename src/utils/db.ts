// 兼容本地（Next.js）运行的 D1Database 类型定义
interface D1Database {
  prepare(sql: string): {
    bind(...params: any[]): {
      first<T = any>(): Promise<T | null>;
      all<T = any>(): Promise<{ results: T[] }>;
      run(): Promise<{ success: boolean; meta: { last_row_id: number }; error?: string }>;
    };
  };
}

// D1 数据库操作工具类
export interface ImageRecord {
  id?: number;
  name: string;
  original_name: string;
  url: string;
  file_path: string;
  file_format: string;
  file_size: number;
  upload_time?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  access_count?: number;
  last_access_time?: string | null;
  tags?: string | null;
  description?: string | null;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class D1ImageDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // 插入新图片记录
  async insertImage(imageData: Omit<ImageRecord, 'id' | 'upload_time' | 'created_at' | 'updated_at'>): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO img (
        name, original_name, url, file_path, file_format, file_size,
        is_deleted, access_count, tags, description, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      imageData.name,
      imageData.original_name,
      imageData.url,
      imageData.file_path,
      imageData.file_format,
      imageData.file_size,
      imageData.is_deleted || false,
      imageData.access_count || 0,
      imageData.tags || null,
      imageData.description || null,
      imageData.is_public !== undefined ? imageData.is_public : true
    ).run();

    if (!result.success) {
      throw new Error(`Failed to insert image: ${result.error}`);
    }

    return result.meta.last_row_id;
  }

  // 根据ID获取图片
  async getImageById(id: number): Promise<ImageRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM img WHERE id = ? AND is_deleted = FALSE');
    const result = await stmt.bind(id).first<ImageRecord>();
    return result || null;
  }

  // 根据URL获取图片
  async getImageByUrl(url: string): Promise<ImageRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM img WHERE url = ? AND is_deleted = FALSE');
    const result = await stmt.bind(url).first<ImageRecord>();
    return result || null;
  }

  // 获取所有公开图片（分页）
  async getPublicImages(page: number = 1, limit: number = 20): Promise<ImageRecord[]> {
    const offset = (page - 1) * limit;
    const stmt = this.db.prepare(`
      SELECT * FROM img 
      WHERE is_public = TRUE AND is_deleted = FALSE 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(limit, offset).all<ImageRecord>();
    return result.results || [];
  }

  // 更新访问计数
  async updateAccessCount(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE img 
      SET access_count = access_count + 1, 
          last_access_time = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = await stmt.bind(id).run();
    if (!result.success) {
      throw new Error(`Failed to update access count: ${result.error}`);
    }
  }

  // 软删除图片
  async deleteImage(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE img 
      SET is_deleted = TRUE, 
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = await stmt.bind(id).run();
    if (!result.success) {
      throw new Error(`Failed to delete image: ${result.error}`);
    }
  }

  // 更新图片信息
  async updateImage(id: number, updates: Partial<Pick<ImageRecord, 'name' | 'tags' | 'description' | 'is_public'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

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
    if (updates.is_public !== undefined) {
      fields.push('is_public = ?');
      values.push(updates.is_public);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
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
  async searchImages(query: string, page: number = 1, limit: number = 20): Promise<ImageRecord[]> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;
    
    const stmt = this.db.prepare(`
      SELECT * FROM img 
      WHERE (name LIKE ? OR tags LIKE ? OR description LIKE ?) 
        AND is_public = TRUE 
        AND is_deleted = FALSE 
      ORDER BY created_at DESC 
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
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM img');
    const publicStmt = this.db.prepare('SELECT COUNT(*) as count FROM img WHERE is_public = TRUE AND is_deleted = FALSE');
    const deletedStmt = this.db.prepare('SELECT COUNT(*) as count FROM img WHERE is_deleted = TRUE');
    const sizeStmt = this.db.prepare('SELECT SUM(file_size) as total_size FROM img WHERE is_deleted = FALSE');

    const [totalResult, publicResult, deletedResult, sizeResult] = await Promise.all([
      totalStmt.bind().first<{ count: number }>(),
      publicStmt.bind().first<{ count: number }>(),
      deletedStmt.bind().first<{ count: number }>(),
      sizeStmt.bind().first<{ total_size: number }>()
    ]);

    return {
      total: totalResult?.count || 0,
      public: publicResult?.count || 0,
      deleted: deletedResult?.count || 0,
      totalSize: sizeResult?.total_size || 0
    };
  }
}

// 用于 Next.js API 的环境变量类型扩展
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CF_ACCOUNT_ID: string;
      CF_API_TOKEN: string;
      CF_DATABASE_ID: string;
    }
  }
}

// 使用 Cloudflare API 直接操作 D1 数据库的类
import Cloudflare from 'cloudflare';

export class CloudflareD1Client {
  private accountId: string;
  private apiToken: string;
  private databaseId: string;
  private cf: Cloudflare;

  constructor(accountId: string, apiToken: string, databaseId: string) {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.databaseId = databaseId;
    this.cf = new Cloudflare({ apiToken });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      const page = await this.cf.d1.database.query(this.databaseId, {
        account_id: this.accountId,
        sql,
        params,
      });
      // SDK returns a SinglePage<QueryResult> with `result` array
      const first = page.result?.[0];
      if (!first) throw new Error('Empty D1 response');
      return first;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`D1 query failed: ${message}`);
    }
  }

  // 模拟 D1Database 接口
  prepare(sql: string) {
    return {
      bind: (...params: any[]) => ({
        first: async <T = any>(): Promise<T | null> => {
          const result = await this.query(sql, params);
          return result.results?.[0] || null;
        },
        all: async <T = any>(): Promise<{ results: T[] }> => {
          const result = await this.query(sql, params);
          return { results: result.results || [] };
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
  return new D1ImageDB(d1Client as any);
}
