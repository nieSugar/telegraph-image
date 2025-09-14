import type { NextApiRequest, NextApiResponse } from 'next';
import { D1ImageDB, createD1Connection, ImageRecord } from '../../../utils/db';

type ApiResponse = {
  success: boolean;
  inserted?: Array<{ id: number; url: string; name: string }>;
  message?: string;
};

async function getDB(): Promise<D1ImageDB> {
  return await createD1Connection();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const db = await getDB();

    const samples: Array<Omit<ImageRecord, 'id' | 'upload_time' | 'created_at' | 'updated_at'>> = [
      {
        name: 'sample1.jpg',
        original_name: 'sample1.jpg',
        url: 'https://telegra.ph/file/sample1.jpg',
        file_path: '/uploads/sample1.jpg',
        file_format: 'jpg',
        file_size: 123456,
        is_deleted: false,
        tags: 'seed,example',
        description: 'Seed data 1',
        is_public: true,
      },
      {
        name: 'sample2.png',
        original_name: 'sample2.png',
        url: 'https://telegra.ph/file/sample2.png',
        file_path: '/uploads/sample2.png',
        file_format: 'png',
        file_size: 234567,
        is_deleted: false,
        tags: 'seed,example',
        description: 'Seed data 2',
        is_public: true,
      },
    ];

    const inserted: Array<{ id: number; url: string; name: string }> = [];
    for (const rec of samples) {
      const id = await db.insertImage(rec);
      inserted.push({ id, url: rec.url, name: rec.name });
    }

    return res.status(200).json({ success: true, inserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, message });
  }
}


