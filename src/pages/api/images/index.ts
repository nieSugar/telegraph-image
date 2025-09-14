import type { NextApiRequest, NextApiResponse } from 'next';
import { D1ImageDB, ImageRecord, createD1Connection } from '../../../utils/db';

// 获取D1数据库实例的辅助函数
async function getDB(): Promise<D1ImageDB> {
  return await createD1Connection();
}

type ApiResponse = {
  success: boolean;
  images?: ImageRecord[];
  stats?: {
    total: number;
    public: number;
    deleted: number;
    totalSize: number;
  };
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  let db: D1ImageDB;
  
  try {
    db = await getDB();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }

  try {
    const { 
      page = '1', 
      limit = '20', 
      search,
      stats,
      all
    } = req.query;

    const pageNum = parseInt(Array.isArray(page) ? page[0] : page);
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit);
    const searchQuery = Array.isArray(search) ? search[0] : search;
    const includeStats = stats === 'true';

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page or limit parameters'
      });
    }

    let images: ImageRecord[];
    
    if (searchQuery) {
      // 搜索图片
      images = await db.searchImages(searchQuery, pageNum, limitNum);
    } else if (all === 'true') {
      // 获取所有图片（包含非公开/已删除）
      images = await db.getAllImages(pageNum, limitNum);
    } else {
      // 获取公开图片列表
      images = await db.getPublicImages(pageNum, limitNum);
    }

    const response: ApiResponse = {
      success: true,
      images,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: images.length === limitNum
      }
    };

    // 如果需要统计信息
    if (includeStats) {
      response.stats = await db.getImageStats();
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Get images error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      message
    });
  }
}
