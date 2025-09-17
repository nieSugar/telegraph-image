import type { NextApiRequest, NextApiResponse } from 'next';
import { formidable, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import { D1ImageDB, createD1Connection } from '../../../utils/db';
import { uploadFileToTelegram } from '../../../services/telegram';
import { ImageRecord, UploadResponseData } from '@/types';

// 禁用Next.js的默认body解析，以支持form-data
export const config = {
  api: {
    bodyParser: false,
  },
};



// 获取D1数据库实例的辅助函数
async function getDB(): Promise<D1ImageDB> {
  return await createD1Connection();
}

// 生成唯一文件名
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  return `${timestamp}_${random}_${baseName}${ext}`;
}

// 构造文件访问URL的函数
function buildFileUrl(req: NextApiRequest, fileId: string): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}/api/cfile/${fileId}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponseData>
) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // 检查 Content-Type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be multipart/form-data'
    });
  }

  let db: D1ImageDB;

  try {
    // 初始化数据库连接
    db = await getDB();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: '数据库连接失败，请稍后重试'
    });
  }

  try {
    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'tmp');

    // 确保上传目录存在
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      return res.status(500).json({
        success: false,
        message: '服务器配置错误，无法创建上传目录'
      });
    }

    // 使用formidable解析上传的文件，并配置选项
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 限制10MB
      maxFiles: 1, // 限制单次只能上传一个文件
      allowEmptyFiles: false,
      filter: (part) => {
        // 只允许图片文件
        if (!part.mimetype?.includes('image/')) {
          console.log('Rejected file due to invalid MIME type:', part.mimetype);
          return false;
        }

        // 验证文件扩展名
        const originalFilename = part.originalFilename || '';
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        const hasAllowedExtension = allowedExtensions.some(ext =>
          originalFilename.toLowerCase().endsWith(ext)
        );

        if (!hasAllowedExtension) {
          console.log('Rejected file due to invalid extension:', originalFilename);
        }

        return hasAllowedExtension;
      },
    });

    // 解析表单数据
    let fields: Fields, files: Files;
    try {
      [fields, files] = await form.parse(req);
    } catch (error: unknown) {
      console.error('Form parsing error:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: '文件大小超过限制（最大10MB）'
        });
      }

      if (error && typeof error === 'object' && 'code' in error && error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: '一次只能上传一个文件'
        });
      }

      return res.status(400).json({
        success: false,
        message: '文件解析失败，请检查文件格式'
      });
    }

    const fileArray = files.file || [];

    if (fileArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片文件'
      });
    }

    const uploadedUrls: string[] = [];
    const uploadedImages: UploadResponseData['images'] = [];

    // 如果提供 base64 字段（data URL 或纯 base64），优先使用
    const base64Field = Array.isArray(fields.base64) ? fields.base64[0] : fields.base64;
    if (base64Field && typeof base64Field === 'string') {
      const match = base64Field.match(/^data:(.*?);base64,(.*)$/);
      const base64Data = match ? match[2] : base64Field;
      const mime = match ? match[1] : 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : mime.includes('gif') ? '.gif' : '.jpg';
      const originalFilename = `base64${ext}`;
      const uniqueFileName = generateUniqueFileName(originalFilename);
      const fileSize = buffer.byteLength;
      const fileFormat = ext.replace('.', '');

      const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags || null;
      const descriptionField = Array.isArray(fields.description) ? fields.description[0] : fields.description || null;
      const isPublic = Array.isArray(fields.isPublic) ? fields.isPublic[0] !== 'false' : fields.isPublic !== 'false';
      const caption = descriptionField || uniqueFileName;

      // 直传 Telegram，获取 message 信息
      const tgRes = await uploadFileToTelegram(buffer, mime, uniqueFileName, caption || undefined);

      // 检查 Telegram 上传是否成功
      if (!tgRes.ok || !tgRes.file?.file_id) {
        throw new Error('Failed to upload to Telegram');
      }

      // 构造可引用 URL
      const uploadUrl = buildFileUrl(req, tgRes.file.file_id);

      const imageRecord: Omit<ImageRecord, 'id' | 'uploadTime' | 'createdAt' | 'updatedAt'> = {
        name: uniqueFileName,
        originalName: originalFilename,
        url: uploadUrl,
        filePath: `/uploads/${uniqueFileName}`,
        fileFormat: fileFormat,
        fileSize: fileSize,
        isDeleted: false,
        tags: tags || null,
        description: descriptionField || null,
        isPublic: isPublic
      };

      const imageId = await db.insertImage(imageRecord);

      let telegramInfo: { chat_id: string; message_id: number } | undefined;
      try {
        // 将 Telegram 字段直接落入 img 表
        await db.updateImageTelegramInfo(imageId, {
          tgMessageId: tgRes.messageId ?? null,
          tgFileId: tgRes.file?.file_id ?? null,
          tgFilePath: tgRes.filePath ?? null,
          tgEndpoint: tgRes.endpoint ?? null,
          tgFieldName: tgRes.fieldName ?? null,
          tgFileName: tgRes.file?.file_name ?? null,
        });
        if (tgRes.chatId && tgRes.messageId) {
          telegramInfo = { chat_id: tgRes.chatId, message_id: tgRes.messageId };
        }
      } catch (tgErr) {
        console.error('Telegram send/store error:', tgErr);
      }

      uploadedUrls.push(uploadUrl);
      uploadedImages?.push({
        id: imageId,
        url: uploadUrl,
        name: uniqueFileName,
        fileSize: fileSize,
        fileFormat: fileFormat,
        telegram: telegramInfo || undefined
      });
    } else {
      // 处理每个上传的文件
      console.log('Processing file uploads, fileArray:', fileArray);
      for (const file of fileArray) {
        if (!file) {
          console.log('Skipping null/undefined file');
          continue;
        }

        console.log('Processing file:', {
          originalFilename: file.originalFilename,
          mimetype: file.mimetype,
          size: file.size,
          filepath: file.filepath
        });

      try {
        // 读取文件
        const filePath = file.filepath;
        const fileData = fs.readFileSync(filePath);
        
        // 获取文件信息
        const originalFilename = file.originalFilename || 'image.jpg';
        const uniqueFileName = generateUniqueFileName(originalFilename);
        const fileSize = file.size || 0;
        const fileFormat = path.extname(originalFilename).toLowerCase().substring(1);

        // 直传 Telegram，获取 message 信息
        const mime = file.mimetype || 'image/jpeg';
        const descriptionField = Array.isArray(fields.description) ? fields.description[0] : fields.description || null;
        const caption = descriptionField || uniqueFileName;
        const tgRes = await uploadFileToTelegram(fileData, mime, uniqueFileName, caption || undefined);

        // 检查 Telegram 上传是否成功
        if (!tgRes.ok || !tgRes.file?.file_id) {
          throw new Error('Failed to upload to Telegram');
        }

        // 构造可引用 URL
        const uploadUrl = buildFileUrl(req, tgRes.file.file_id);
        
        // 从表单字段获取额外信息
        const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags || null;
        const description = descriptionField;
        const isPublic = Array.isArray(fields.isPublic) 
          ? fields.isPublic[0] !== 'false' 
          : fields.isPublic !== 'false';

        // 准备数据库记录
        const imageRecord: Omit<ImageRecord, 'id' | 'uploadTime' | 'createdAt' | 'updatedAt'> = {
          name: uniqueFileName,
          originalName: originalFilename,
          url: uploadUrl,
          filePath: `/uploads/${uniqueFileName}`, // 本地路径，可选
          fileFormat: fileFormat,
          fileSize: fileSize,
          isDeleted: false,
          tags: tags || null,
          description: description || null,
          isPublic: isPublic
        };

        // 插入到数据库
        const imageId = await db.insertImage(imageRecord);

        // 发送到 Telegram 频道（忽略失败，不影响主流程）
        let telegramInfo: { chat_id: string; message_id: number } | undefined;
        try {
          // 将 Telegram 字段直接落入 img 表
          await db.updateImageTelegramInfo(imageId, {
            tgMessageId: tgRes.messageId ?? null,
            tgFileId: tgRes.file?.file_id ?? null,
            tgFilePath: tgRes.filePath ?? null,
            tgEndpoint: tgRes.endpoint ?? null,
            tgFieldName: tgRes.fieldName ?? null,
            tgFileName: tgRes.file?.file_name ?? null,
          });
          if (tgRes.chatId && tgRes.messageId) {
            telegramInfo = { chat_id: tgRes.chatId, message_id: tgRes.messageId };
          }
        } catch (tgErr) {
          console.error('Telegram send/store error:', tgErr);
        }

        // 添加到返回结果
        uploadedUrls.push(uploadUrl);
        uploadedImages?.push({
          id: imageId,
          url: uploadUrl,
          name: uniqueFileName,
          fileSize: fileSize,
          fileFormat: fileFormat,
          telegram: telegramInfo || undefined
        });

        console.log(`Successfully uploaded image: ${uniqueFileName} (ID: ${imageId})`);

      } catch (uploadError) {
        console.error(`Failed to process file ${file.originalFilename}:`, uploadError);
        // 继续处理其他文件
      } finally {
        // 清理临时文件
        try {
          fs.unlinkSync(file.filepath);
        } catch (cleanupError) {
          console.error('Failed to cleanup temp file:', cleanupError);
        }
        }
      }
    }

    if (uploadedUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有文件上传成功，请检查文件格式和大小'
      });
    }

    // 返回上传成功的结果
    return res.status(200).json({
      success: true,
      urls: uploadedUrls,
      images: uploadedImages,
      message: `成功上传 ${uploadedUrls.length} 张图片`
    });

  } catch (error: unknown) {
    console.error('Upload error:', error);

    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes('Telegram')) {
        return res.status(502).json({
          success: false,
          message: '图片上传到存储服务失败，请稍后重试'
        });
      }

      if (error.message.includes('Database') || error.message.includes('database')) {
        return res.status(500).json({
          success: false,
          message: '数据库操作失败，请稍后重试'
        });
      }

      if (error.message.includes('ENOENT') || error.message.includes('file')) {
        return res.status(500).json({
          success: false,
          message: '文件处理失败，请重新上传'
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: '上传失败，服务器内部错误'
    });
  }
}
