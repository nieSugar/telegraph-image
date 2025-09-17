import axios from 'axios';
import {
  Box,
  Button,
  Card,
  FileInput,
  Heading,
  Layer,
  Notification,
  ResponsiveContext,
  Spinner,
  Text,
  Image,
} from 'grommet';
import { CloudUpload, Copy, StatusGood, Upload, View } from 'grommet-icons';
import React, { useCallback, useRef, useState } from 'react';

interface UploadResponse {
  success: boolean;
  urls?: string[];
  message?: string;
}

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [copyVisible, setCopyVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toAbsoluteUrl = useCallback((url: string): string =>
    url.startsWith('http') ? url : `${window.location.origin}${url}`, []);

  const resetUpload = useCallback(() => {
    setFile(null);
    setUploadedUrls([]);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];

      // 验证文件类型
      if (!selectedFile.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }

      // 验证文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过 10MB');
        return;
      }

      setFile(selectedFile);
      setUploadedUrls([]);
      setError(null);

      // 创建预览URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      resetUpload();
    }
  }, [resetUpload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];

      if (!selectedFile.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过 10MB');
        return;
      }

      setFile(selectedFile);
      setUploadedUrls([]);
      setError(null);

      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<UploadResponse>('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30秒超时
      });

      if (response.data.success && response.data.urls) {
        setUploadedUrls(response.data.urls.map((u: string) => toAbsoluteUrl(u)));
        // 清理预览URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        setError('上传失败：' + (response.data.message || '未知错误'));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError('上传超时，请检查网络连接后重试');
        } else if (error.response?.status === 413) {
          setError('文件过大，请选择较小的图片');
        } else {
          setError('上传失败：' + (error.response?.data?.message || '网络错误'));
        }
      } else {
        setError('上传失败，请稍后再试');
      }
    } finally {
      setIsUploading(false);
    }
  }, [file, previewUrl, toAbsoluteUrl]);

  const handleCopyClick = useCallback(async (url: string) => {
    try {
      const fullUrl = toAbsoluteUrl(url);
      await navigator.clipboard.writeText(fullUrl);
      setCopyVisible(true);
    } catch (error) {
      console.error('Copy failed:', error);
      // 降级方案：创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = toAbsoluteUrl(url);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyVisible(true);
    }
  }, [toAbsoluteUrl]);

  return (
    <ResponsiveContext.Consumer>
      {size => (
        <Box
          fill
          align="center"
          justify="center"
          pad={size === 'small' ? 'medium' : 'large'}
          background={{
            image: "url(https://rand-img.kidwen.top?rand=true)",
            size: "cover",
            position: "center"
          }}
          style={{
            minHeight: '100vh',
            position: 'relative'
          }}
        >
          {/* 背景遮罩 */}
          <Box
            fill
            background="rgba(0, 0, 0, 0.6)"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 0
            }}
          />

          {/* 主内容 */}
          <Box
            width={size === 'small' ? '100%' : 'large'}
            style={{ zIndex: 1, position: 'relative' }}
          >
            <Card
              className="custom-card"
              pad={size === 'small' ? 'medium' : 'large'}
              elevation="large"
              round="large"
            >
              <Box align="center" gap="medium">
                {/* 标题和描述 */}
                <Box align="center" gap="small">
                  <Heading level={1} margin="none" textAlign="center">
                    <CloudUpload size="large" color="brand" />
                  </Heading>
                  <Heading level={2} margin="none" textAlign="center">
                    Telegraph Image
                  </Heading>
                </Box>

                {/* 文件上传区域 */}
                <Box
                  width="100%"
                  className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <FileInput
                    ref={fileInputRef}
                    multiple={false}
                    messages={{
                      dropPromptMultiple: dragOver ? '释放文件开始上传' : '拖放图片到这里或点击选择',
                      browse: '选择图片'
                    }}
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </Box>

                {/* 文件预览 */}
                {file && previewUrl && (
                  <Box align="center" gap="small" width="100%">
                    <Text weight="bold">预览:</Text>
                    <Box
                      width="100%"
                      height="200px"
                      background="rgba(255, 255, 255, 0.05)"
                      round="medium"
                      align="center"
                      justify="center"
                      overflow="hidden"
                    >
                      <Image
                        src={previewUrl}
                        alt="预览"
                        className="image-preview"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    </Box>
                    <Text size="small" color="neutral-4">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  </Box>
                )}

                {/* 操作按钮 */}
                {file && (
                  <Box direction="row" gap="medium" align="center" wrap>
                    <Button
                      icon={isUploading ? <Spinner size="small" /> : <Upload />}
                      label={isUploading ? "上传中..." : "上传图片"}
                      primary
                      disabled={isUploading}
                      onClick={handleUpload}
                      className="custom-button"
                    />
                    <Button
                      label="重新选择"
                      onClick={resetUpload}
                      disabled={isUploading}
                      className="custom-button"
                    />
                  </Box>
                )}

                {/* 错误信息 */}
                {error && (
                  <Box
                    align="center"
                    pad="small"
                    background="status-critical"
                    round="small"
                    width="100%"
                  >
                    <Text color="white" textAlign="center">{error}</Text>
                  </Box>
                )}

                {/* 上传成功结果 */}
                {uploadedUrls.length > 0 && (
                  <Box align="center" gap="medium" width="100%">
                    <Box direction="row" align="center" gap="small">
                      <StatusGood color="status-ok" />
                      <Text weight="bold" color="status-ok">上传成功!</Text>
                    </Box>

                    {uploadedUrls.map((url, index) => (
                      <Box
                        key={`url-${index}`}
                        width="100%"
                        background="rgba(255, 255, 255, 0.05)"
                        pad="medium"
                        round="medium"
                        gap="small"
                      >
                        {/* 图片预览 */}
                        <Box align="center">
                          <Image
                            src={url}
                            alt={`上传的图片 ${index + 1}`}
                            className="image-preview"
                            style={{ maxHeight: '150px', cursor: 'pointer' }}
                            onClick={() => setShowPreview(true)}
                          />
                        </Box>

                        {/* URL 和操作 */}
                        <Box direction="row" gap="small" align="center" wrap>
                          <Box flex>
                            <Text
                              size="small"
                              style={{
                                wordBreak: 'break-all',
                                fontFamily: 'monospace'
                              }}
                            >
                              {url}
                            </Text>
                          </Box>
                          <Button
                            icon={<Copy />}
                            onClick={() => handleCopyClick(url)}
                            size="small"
                            tip="复制链接"
                            className="custom-button"
                          />
                          <Button
                            icon={<View />}
                            onClick={() => window.open(url, '_blank')}
                            size="small"
                            tip="在新窗口查看"
                            className="custom-button"
                          />
                        </Box>
                      </Box>
                    ))}

                    <Button
                      label="上传更多图片"
                      onClick={resetUpload}
                      className="custom-button"
                    />
                  </Box>
                )}
              </Box>
            </Card>
          </Box>

          {/* 复制成功通知 */}
          {copyVisible && (
            <Notification
              toast
              status='normal'
              time={2000}
              title="链接已复制到剪贴板"
              onClose={() => setCopyVisible(false)}
            />
          )}

          {/* 图片预览弹窗 */}
          {showPreview && uploadedUrls.length > 0 && (
            <Layer
              onEsc={() => setShowPreview(false)}
              onClickOutside={() => setShowPreview(false)}
            >
              <Box pad="medium" align="center" gap="medium">
                <Image
                  src={uploadedUrls[0]}
                  alt="图片预览"
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    objectFit: 'contain'
                  }}
                />
                <Button
                  label="关闭"
                  onClick={() => setShowPreview(false)}
                />
              </Box>
            </Layer>
          )}
        </Box>
      )}
    </ResponsiveContext.Consumer>
  );
};

export default HomePage;
