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

  try {
    // 获取文件内容
    const directUrl = buildTelegramFileUrl(filePath);
    const fileResponse = await fetch(directUrl);

    if (!fileResponse.ok) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    // 检查请求头，决定返回格式
    const acceptHeader = req.headers.accept || '';
    const wantsJson = acceptHeader.includes('application/json') || req.query.format === 'json';

    if (wantsJson) {
      // 返回JSON格式的base64数据
      const base64Data = Buffer.from(fileBuffer).toString('base64');
      return res.status(200).json({
        success: true,
        data: base64Data,
        contentType: contentType,
        size: fileBuffer.byteLength
      });
    } else {
      // 直接返回文件内容（保持向后兼容性）
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileBuffer.byteLength.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存1年
      return res.status(200).send(Buffer.from(fileBuffer));
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch file' });
  }
}


