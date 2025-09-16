import { CloudflareD1Client } from '../utils/db';

let client: CloudflareD1Client | null = null;

function getClient(): CloudflareD1Client {
  if (client) return client;

  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const databaseId = process.env.CF_DATABASE_ID;

  if (!accountId || !apiToken || !databaseId) {
    throw new Error(
      'Missing Cloudflare credentials. Please set CF_ACCOUNT_ID, CF_API_TOKEN, and CF_DATABASE_ID.'
    );
  }

  client = new CloudflareD1Client(accountId, apiToken, databaseId);
  return client;
}

export async function queryAll<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const cf = getClient();
  const { results } = await cf.prepare(sql).bind(...params).all<T>();
  return results || [];
}

export async function queryOne<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<{
  success: boolean;
  lastInsertId: number;
  error?: string;
}> {
  const cf = getClient();
  const result = await cf.prepare(sql).bind(...params).run();
  return {
    success: result.success,
    lastInsertId: result.meta?.last_row_id || 0,
    error: result.error || undefined,
  };
}

export default {
  queryAll,
  queryOne,
  execute,
};


