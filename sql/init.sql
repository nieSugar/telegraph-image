-- 创建图片表
CREATE TABLE IF NOT EXISTS img (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- 文件名（存储时的名称）
    originalName TEXT NOT NULL,            -- 原始文件名
    url TEXT NOT NULL,                     -- 图片访问URL
    filePath TEXT NOT NULL,                -- 文件路径
    fileFormat TEXT NOT NULL,              -- 文件格式（jpg, png, gif等）
    fileSize INTEGER NOT NULL,             -- 文件大小（字节）
    uploadTime DATETIME DEFAULT CURRENT_TIMESTAMP, -- 上传时间
    isDeleted BOOLEAN DEFAULT FALSE,       -- 是否已删除（软删除）
    deletedAt DATETIME,                    -- 删除时间
    tags TEXT,                             -- 标签（JSON字符串或逗号分隔）
    description TEXT,                      -- 图片描述
    isPublic BOOLEAN DEFAULT TRUE,         -- 是否公开
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Telegram 相关字段
    tgMessageId INTEGER,                   -- Telegram 消息ID
    tgFileId TEXT,                         -- Telegram 文件ID（可用于 getFile）
    tgFilePath TEXT,                       -- Telegram 文件路径（getFile 返回）
    tgEndpoint TEXT,                       -- 使用的发送接口（sendPhoto/sendDocument/...）
    tgFieldName TEXT,                      -- 字段名（photo/video/audio/document）
    tgFileName TEXT                        -- Telegram 返回的文件名（如有）
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_img_isPublic ON img(isPublic);
CREATE INDEX IF NOT EXISTS idx_img_isDeleted ON img(isDeleted);
CREATE INDEX IF NOT EXISTS idx_img_createdAt ON img(createdAt);
CREATE INDEX IF NOT EXISTS idx_img_uploadTime ON img(uploadTime);
CREATE INDEX IF NOT EXISTS idx_img_tgFileId ON img(tgFileId);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_img_public_not_deleted ON img(isPublic, isDeleted);
CREATE INDEX IF NOT EXISTS idx_img_search ON img(name, tags, description);
