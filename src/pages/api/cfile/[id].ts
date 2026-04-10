import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { buildTelegramFileUrl, getTelegramFilePath } from '../../../services/telegram';
import { createD1Connection } from '../../../utils/db';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml', '.avif': 'image/avif', '.heic': 'image/heic',
  '.tiff': 'image/tiff', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
  '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.pdf': 'application/pdf',
};

function inferContentType(...sources: (string | null | undefined)[]): string | null {
  for (const src of sources) {
    if (!src) continue;
    const ext = path.extname(src).toLowerCase();
    if (MIME_MAP[ext]) return MIME_MAP[ext];
  }
  return null;
}

function isInlinePreviewable(mime: string): boolean {
  return mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || mime === 'application/pdf';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file id' });
  }

  const fileId = String(id);

  // 优先从数据库获取 tgFilePath（若已缓存），失败则调用 Telegram API 获取
  let filePath: string | null = null;
  let imageIdToUpdate: number | null = null;
  let imageRecord: { originalName?: string; name?: string; tgFileName?: string | null } | null = null; // 存储完整的图片记录，用于获取原始文件名

  try {
    const db = await createD1Connection();
    const rec = await db.getImageByTelegramFileId(fileId);
    imageRecord = rec; // 保存完整记录
    const fetched = await getTelegramFilePath(fileId);
    filePath = fetched;
    if (rec && fetched) {
      imageIdToUpdate = rec.id || null;
    }

    if (imageIdToUpdate && filePath) {
      db.updateImageTelegramInfo(imageIdToUpdate, {
        tgFileId: fileId,
      }).catch(() => void 0);
    }
  } catch {
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

    const tgContentType = fileResponse.headers.get('content-type') || '';
    const contentType =
      inferContentType(imageRecord?.originalName, imageRecord?.name, imageRecord?.tgFileName, filePath)
      || (tgContentType && tgContentType !== 'application/octet-stream' ? tgContentType : null)
      || 'application/octet-stream';

    // 检查请求头，决定返回格式
    const acceptHeader = req.headers.accept || '';
    const wantsJson = acceptHeader.includes('application/json') || req.query.format === 'json';

    if (wantsJson) {
      const base64Data = Buffer.from(fileBuffer).toString('base64');
      const response: {
        success: boolean;
        data: string;
        contentType: string;
        size: number;
        originalName?: string;
        name?: string;
        tgFileName?: string;
      } = {
        success: true,
        data: base64Data,
        contentType: contentType,
        size: fileBuffer.byteLength
      };

      if (imageRecord) {
        response.originalName = imageRecord.originalName;
        response.name = imageRecord.name;
        if (imageRecord.tgFileName) {
          response.tgFileName = imageRecord.tgFileName;
        }
      }

      return res.status(200).json(response);
    } else {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileBuffer.byteLength.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      const displayName = imageRecord?.originalName || imageRecord?.name || path.basename(filePath);
      const disposition = isInlinePreviewable(contentType) ? 'inline' : 'attachment';
      const encodedFilename = encodeURIComponent(displayName);
      res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodedFilename}`);

      return res.status(200).send(Buffer.from(fileBuffer));
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch file' });
  }
}


