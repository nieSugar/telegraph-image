import type { NextApiRequest, NextApiResponse } from 'next';
import { buildTelegramFileUrl, getTelegramFilePath } from '../../../services/telegram';
import { createD1Connection } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file id' });
  }

  const fileId = String(id);

  // 优先从数据库获取 tg_file_path（若已缓存），失败则调用 Telegram API 获取
  let filePath: string | null = null;
  let imageIdToUpdate: number | null = null;

  try {
    const db = await createD1Connection();
    const rec = await db.getImageByTelegramFileId(fileId);
    if (rec?.tg_file_path) {
      filePath = rec.tg_file_path;
    } else {
      const fetched = await getTelegramFilePath(fileId);
      filePath = fetched;
      if (rec && fetched) {
        imageIdToUpdate = rec.id || null;
      }
    }

    // 异步落地 tg_file_path（最佳努力，不影响响应）
    if (imageIdToUpdate && filePath) {
      db.updateImageTelegramInfo(imageIdToUpdate, {
        tg_file_id: fileId,
        tg_file_path: filePath,
      }).catch(() => void 0);
    }
  } catch (_) {
    // 数据库不可用时，直接走 Telegram API
    try {
      filePath = await getTelegramFilePath(fileId);
    } catch {}
  }

  if (!filePath) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  const directUrl = buildTelegramFileUrl(filePath);
  res.setHeader('Location', directUrl);
  res.status(302).end();
}


