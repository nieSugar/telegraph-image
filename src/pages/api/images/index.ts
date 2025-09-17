import type { NextApiRequest, NextApiResponse } from 'next';
import { D1ImageDB, createD1Connection } from '../../../utils/db';
import { ImageRecord } from '@/types';

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
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
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
      message: '数据库连接失败，请稍后重试'
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

    // 参数验证和转换
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page);
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit);
    const searchQuery = Array.isArray(search) ? search[0] : search;
    const includeStats = stats === 'true';
    const includeAll = all === 'true';

    // 验证分页参数
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: '页码和每页数量必须是大于0的整数'
      });
    }

    // 限制每页最大数量
    if (limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: '每页最多只能获取100条记录'
      });
    }

    // 验证搜索查询长度
    if (searchQuery && searchQuery.length > 100) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词长度不能超过100个字符'
      });
    }

    let images: ImageRecord[];

    try {
      if (searchQuery && searchQuery.trim()) {
        // 搜索图片，根据 includeAll 参数决定是否只搜索公开图片
        images = await db.searchImages(searchQuery.trim(), pageNum, limitNum, !includeAll);
      } else if (includeAll) {
        // 获取所有图片（包含非公开，但不包含已删除）
        images = await db.getAllImages(pageNum, limitNum);
      } else {
        // 获取公开图片列表
        images = await db.getPublicImages(pageNum, limitNum);
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        success: false,
        message: '数据库查询失败，请稍后重试'
      });
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
      try {
        response.stats = await db.getImageStats();
      } catch (statsError) {
        console.error('Stats query error:', statsError);
        // 统计信息失败不影响主要数据返回
        response.stats = {
          total: 0,
          public: 0,
          deleted: 0,
          totalSize: 0
        };
      }
    }
    return res.status(200).json(response);

  } catch (error) {
    console.error('Get images error:', error);

    return res.status(500).json({
      success: false,
      message: '获取图片列表失败，服务器内部错误'
    });
  }
}
