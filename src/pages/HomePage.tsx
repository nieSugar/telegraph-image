import React, { useState } from 'react';
import { Box, Heading, Text, FileInput, Button, Card, Notification } from 'grommet';
import { Copy, Upload } from 'grommet-icons';
import axios from 'axios';

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [copyVisible, setCopyVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setUploadedUrls([]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);

      // 调用我们的API端点
      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.urls) {
        setUploadedUrls(response.data.urls);
      } else {
        setError('上传失败：' + (response.data.message || '未知错误'));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError('上传失败，请稍后再试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyClick = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyVisible(true);
  };

  return (
    <Box fill align="center" justify="center" pad="large" background={"url(https://rand-img.kidwen.top?rand=true)"}>
      <Card width="large" pad="medium">
        <Box align="center" gap="medium">
          <Heading level={2}>Telegraph Image</Heading>
          
          <Box width="medium">
            <FileInput
              multiple={false}
              messages={{
                dropPromptMultiple: '拖放文件到这里或点击选择',
                browse: '选择文件'
              }}
              onChange={handleFileChange}
              accept="image/*"
            />
          </Box>
          
          {file && (
            <Box align="center" gap="small">
              <Button 
                icon={<Upload />} 
                label={isUploading ? "上传中..." : "上传图片"} 
                primary 
                disabled={isUploading}
                onClick={handleUpload}
              />
            </Box>
          )}

          {error && (
            <Box align="center">
              <Text color="status-critical">{error}</Text>
            </Box>
          )}

          {uploadedUrls.length > 0 && (
            <Box align="center" gap="small">
              <Text weight="bold" color={"rgb(111, 255, 176)"}>上传成功!</Text>
              {uploadedUrls.map((url, id) => (
                <Box key={`url-${id}`} direction="row" gap="small" align="center">
                  <Text>{url}</Text>
                  <Button
                    icon={<Copy />}
                    onClick={() => handleCopyClick(url)}
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Card>

      {copyVisible && (
        <Notification
          toast
          global={true}
          status='normal'
          time={1000}
          title="Copy successful"
          onClose={() => setCopyVisible(false)}
        />
      )}
    </Box>
  );
};

export default HomePage;
