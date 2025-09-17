import type { NextApiRequest, NextApiResponse } from 'next';
import { D1ImageDB, createD1Connection } from '../../../utils/db';
import { ImageDetailResponse } from '@/types';

// 获取D1数据库实例的辅助函数
async function getDB(): Promise<D1ImageDB> {
  return await createD1Connection();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImageDetailResponse>
) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid image ID'
    });
  }

  const imageId = parseInt(id);
  if (isNaN(imageId)) {
    return res.status(400).json({
      success: false,
      message: 'Image ID must be a number'
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

  switch (req.method) {
    case 'GET':
      try {
        const image = await db.getImageById(imageId);
        
        if (!image) {
          return res.status(404).json({
            success: false,
            message: 'Image not found'
          });
        }

        // 按需移除访问计数统计

        return res.status(200).json({
          success: true,
          image
        });
      } catch (error) {
        console.error('Get image error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve image'
        });
      }

    case 'PUT':
      try {
        const { name, tags, description, isPublic } = req.body;

        const updates: Parameters<typeof db.updateImage>[1] = {};
        if (name !== undefined) updates.name = name;
        if (tags !== undefined) updates.tags = tags;
        if (description !== undefined) updates.description = description;
        if (isPublic !== undefined) updates.isPublic = isPublic;

        await db.updateImage(imageId, updates);

        const updatedImage = await db.getImageById(imageId);
        
        return res.status(200).json({
          success: true,
          image: updatedImage!,
          message: 'Image updated successfully'
        });
      } catch (error) {
        console.error('Update image error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update image'
        });
      }

    case 'DELETE':
      try {
        await db.deleteImage(imageId);
        
        return res.status(200).json({
          success: true,
          message: 'Image deleted successfully'
        });
      } catch (error) {
        console.error('Delete image error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete image'
        });
      }

    default:
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  }
}
