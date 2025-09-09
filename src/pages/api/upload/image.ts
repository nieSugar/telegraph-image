import type { NextApiRequest, NextApiResponse } from 'next';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';

// 禁用Next.js的默认body解析，以支持form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadResponseData = {
  success: boolean;
  urls?: string[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
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
    const [, files] = await form.parse(req);
    
    const fileArray = files.file || [];
    const uploadedUrls: string[] = [];

    // 处理每个上传的文件
    for (const file of fileArray) {
      if (!file) continue;

      // 读取文件
      const filePath = file.filepath;
      const fileData = fs.readFileSync(filePath);
      
      // 获取文件名
      const originalFilename = file.originalFilename || 'image.jpg';

      // 创建form-data进行上传
      const formData = new FormData();
      formData.append('file', new Blob([fileData]), originalFilename);

      // 调用Telegraph API上传图片

      // 清理临时文件
      fs.unlinkSync(filePath);
    }

    // 返回上传成功的URL
    return res.status(200).json({ success: true, urls: uploadedUrls });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '上传失败，服务器错误';
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
