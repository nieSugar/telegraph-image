// 导入类型定义
import {
  TelegramFileKind,
  EndpointResolution,
  TelegramResponse,
  TelegramUploadResult,
  TelegramFileInfo
} from '@/types/telegram';

function resolveEndpointByMime(contentType: string | undefined | null): EndpointResolution {
  const ct = (contentType || '').toLowerCase();
  const map: Array<{ prefix: string; endpoint: EndpointResolution['endpoint']; fieldName: TelegramFileKind }> = [
    { prefix: 'image/', endpoint: 'sendPhoto', fieldName: 'photo' },
    { prefix: 'video/', endpoint: 'sendVideo', fieldName: 'video' },
    { prefix: 'audio/', endpoint: 'sendAudio', fieldName: 'audio' },
    { prefix: 'application/pdf', endpoint: 'sendDocument', fieldName: 'document' },
  ];
  const found = map.find((m) => ct.startsWith(m.prefix));
  return found || { endpoint: 'sendDocument', fieldName: 'document' };
}



function extractFileFromTelegramMessage(response: TelegramResponse): TelegramFileInfo | null {
  try {
    if (!response?.ok) return null;
    const result = response.result;
    if (result?.photo) {
      const largest = result.photo.reduce((prev, curr) => (prev.file_size > curr.file_size ? prev : curr));
      return { file_id: largest.file_id, file_name: largest.file_name || largest.file_unique_id };
    }
    if (result?.video) {
      return { file_id: result.video.file_id, file_name: result.video.file_name || result.video.file_unique_id };
    }
    if (result?.document) {
      return { file_id: result.document.file_id, file_name: result.document.file_name || result.document.file_unique_id };
    }
    if (result?.audio) {
      return { file_id: result.audio.file_id, file_name: result.audio.file_name || result.audio.file_unique_id };
    }
    return null;
  } catch {
    return null;
  }
}



// 参考边缘函数的直传实现：使用 FormData + fetch 将文件直传至 Telegram Bot API
export async function uploadFileToTelegram(
  file: Buffer | Uint8Array | ArrayBuffer | Blob,
  contentType: string,
  filename = 'file',
  caption?: string
): Promise<TelegramUploadResult> {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token) throw new Error('TG_BOT_TOKEN is not set');
  if (!chatId) throw new Error('TG_CHAT_ID is not set');

  const { endpoint, fieldName } = resolveEndpointByMime(contentType);
  const url = `https://api.telegram.org/bot${token}/${endpoint}`;

  const blob = file instanceof Blob ? file : new Blob([new Uint8Array(file as ArrayBuffer)], { type: contentType || 'application/octet-stream' });
  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', caption);
  form.append(fieldName, blob, filename);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
    body: form,
  });

  const data = await res.json();
  const fileInfo = extractFileFromTelegramMessage(data);
  const filePath = fileInfo?.file_id ? await getTelegramFilePath(fileInfo.file_id) : null;

  return {
    ok: Boolean(data?.ok),
    chatId: data?.result?.chat?.id ? String(data.result.chat.id) : '',
    messageId: data?.result?.message_id,
    endpoint,
    fieldName,
    file: fileInfo,
    filePath,
    persistable: {
      tgMessageId: typeof data?.result?.message_id === 'number' ? data.result.message_id : null,
      tgFileId: fileInfo?.file_id || null,
      tgFilePath: filePath || null,
      tgEndpoint: endpoint || null,
      tgFieldName: fieldName || null,
      tgFileName: fileInfo?.file_name || null,
    },
    raw: data,
  };
}

export async function getTelegramFilePath(fileId: string): Promise<string | null> {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) throw new Error('TG_BOT_TOKEN is not set');
  const url = `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
  });
  const json = await res.json();
  if (json?.ok && json?.result?.file_path) return String(json.result.file_path);
  return null;
}

export function buildTelegramFileUrl(filePath: string, token?: string): string {
  const t = token || process.env.TG_BOT_TOKEN;
  if (!t) throw new Error('TG_BOT_TOKEN is not set');
  return `https://api.telegram.org/file/bot${t}/${filePath}`;
}
