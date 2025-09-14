-- 创建图片表
CREATE TABLE IF NOT EXISTS img (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- 文件名（存储时的名称）
    original_name TEXT NOT NULL,           -- 原始文件名
    url TEXT NOT NULL UNIQUE,              -- 图片访问URL
    file_path TEXT NOT NULL,               -- 文件路径
    file_format TEXT NOT NULL,             -- 文件格式（jpg, png, gif等）
    file_size INTEGER NOT NULL,            -- 文件大小（字节）
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 上传时间
    is_deleted BOOLEAN DEFAULT FALSE,      -- 是否已删除（软删除）
    deleted_at DATETIME,                   -- 删除时间
    tags TEXT,                             -- 标签（JSON字符串或逗号分隔）
    description TEXT,                      -- 图片描述
    is_public BOOLEAN DEFAULT TRUE,        -- 是否公开
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Telegram 相关字段
    tg_message_id INTEGER,                 -- Telegram 消息ID
    tg_file_id TEXT UNIQUE,                -- Telegram 文件ID（可用于 getFile）
    tg_file_path TEXT,                     -- Telegram 文件路径（getFile 返回）
    tg_endpoint TEXT,                      -- 使用的发送接口（sendPhoto/sendDocument/...）
    tg_field_name TEXT,                    -- 字段名（photo/video/audio/document）
    tg_file_name TEXT                      -- Telegram 返回的文件名（如有）
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_img_url ON img(url);
CREATE INDEX IF NOT EXISTS idx_img_is_public ON img(is_public);
CREATE INDEX IF NOT EXISTS idx_img_is_deleted ON img(is_deleted);
CREATE INDEX IF NOT EXISTS idx_img_created_at ON img(created_at);
CREATE INDEX IF NOT EXISTS idx_img_upload_time ON img(upload_time);
CREATE INDEX IF NOT EXISTS idx_img_tg_file_id ON img(tg_file_id);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_img_public_not_deleted ON img(is_public, is_deleted);
CREATE INDEX IF NOT EXISTS idx_img_search ON img(name, tags, description);

-- 插入一些示例数据（可选）
-- INSERT INTO img (name, original_name, url, file_path, file_format, file_size, tags, description) 
-- VALUES 
--   ('sample1.jpg', 'my-photo.jpg', 'https://telegra.ph/file/sample1.jpg', '/uploads/sample1.jpg', 'jpg', 1024000, 'photo,nature', 'A beautiful landscape photo'),
--   ('sample2.png', 'screenshot.png', 'https://telegra.ph/file/sample2.png', '/uploads/sample2.png', 'png', 512000, 'screenshot,tech', 'Application screenshot');
