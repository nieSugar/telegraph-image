import type { NextApiRequest, NextApiResponse } from 'next';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
import { D1ImageDB, ImageRecord, createD1Connection } from '../../../utils/db';

// 禁用Next.js的默认body解析，以支持form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadResponseData = {
  success: boolean;
  urls?: string[];
  images?: {
    id: number;
    url: string;
    name: string;
    file_size: number;
    file_format: string;
  }[];
  message?: string;
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

// 上传到Telegraph的函数（模拟，你可以替换为实际的上传逻辑）
async function uploadToTelegraph(fileData: Buffer, fileName: string): Promise<string> {
  // 这里是示例，实际需要调用Telegraph API
  // 返回上传后的URL
  const baseUrl = process.env.TELEGRAPH_BASE_URL || 'https://telegra.ph/file/';
  const fileId = Math.random().toString(36).substring(2, 15);
  return `${baseUrl}${fileId}.${path.extname(fileName).substring(1)}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let db: D1ImageDB;
  
  try {
    // 初始化数据库连接
    db = await getDB();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection failed' 
    });
  }

  try {
    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'tmp');
    
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 使用formidable解析上传的文件，并配置选项
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 限制10MB
      filter: (part) => {
        // 只允许图片文件
        if (!part.mimetype?.includes('image/')) {
          return false;
        }
        
        // 验证文件扩展名
        const originalFilename = part.originalFilename || '';
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasAllowedExtension = allowedExtensions.some(ext => 
          originalFilename.toLowerCase().endsWith(ext)
        );
        
        return hasAllowedExtension;
      },
    });

    // 解析表单数据
    const [fields, files] = await form.parse(req);
    
    const fileArray = files.file || [];
    const uploadedUrls: string[] = [];
    const uploadedImages: UploadResponseData['images'] = [];

    // 处理每个上传的文件
    for (const file of fileArray) {
      if (!file) continue;

      try {
        // 读取文件
        const filePath = file.filepath;
        const fileData = fs.readFileSync(filePath);
        
        // 获取文件信息
        const originalFilename = file.originalFilename || 'image.jpg';
        const uniqueFileName = generateUniqueFileName(originalFilename);
        const fileSize = file.size || 0;
        const fileFormat = path.extname(originalFilename).toLowerCase().substring(1);

        // 上传到Telegraph（或其他图床）
        const uploadUrl = await uploadToTelegraph(fileData, uniqueFileName);
        
        // 从表单字段获取额外信息
        const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags || null;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || null;
        const isPublic = Array.isArray(fields.isPublic) 
          ? fields.isPublic[0] !== 'false' 
          : fields.isPublic !== 'false';

        // 准备数据库记录
        const imageRecord: Omit<ImageRecord, 'id' | 'upload_time' | 'created_at' | 'updated_at'> = {
          name: uniqueFileName,
          original_name: originalFilename,
          url: uploadUrl,
          file_path: `/uploads/${uniqueFileName}`, // 本地路径，可选
          file_format: fileFormat,
          file_size: fileSize,
          is_deleted: false,
          access_count: 0,
          tags: tags || null,
          description: description || null,
          is_public: isPublic
        };

        // 插入到数据库
        const imageId = await db.insertImage(imageRecord);

        // 添加到返回结果
        uploadedUrls.push(uploadUrl);
        uploadedImages?.push({
          id: imageId,
          url: uploadUrl,
          name: uniqueFileName,
          file_size: fileSize,
          file_format: fileFormat
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

    if (uploadedUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files were successfully uploaded' 
      });
    }

    // 返回上传成功的结果
    return res.status(200).json({ 
      success: true, 
      urls: uploadedUrls,
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedUrls.length} image(s)`
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '上传失败，服务器错误';
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
