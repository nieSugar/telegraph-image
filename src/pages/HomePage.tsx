import React, { useState } from 'react';
import { Box, Heading, Text, FileInput, Button, Card } from 'grommet';
import { Upload } from 'grommet-icons';

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const mockUrl = URL.createObjectURL(file);
      setUploadedUrl(mockUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box fill align="center" justify="center" pad="large" background={"url(https://rand-img.kidwen.top?rand=true)"}>
      <Card width="large" pad="medium">
        <Box align="center" gap="medium">
          <Heading level={2}>Telegraph Image</Heading>
          <Text>上传图片获取永久链接</Text>
          
          <Box width="medium">
            <FileInput
              multiple={true}
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
              <Text>已选择: {file.name}</Text>
              <Button 
                icon={<Upload />} 
                label="上传图片" 
                primary 
                disabled={isUploading}
                onClick={handleUpload}
              />
            </Box>
          )}

          {uploadedUrl && (
            <Box align="center" gap="small">
              <Text weight="bold">上传成功!</Text>
              <Box height="small" width="small">
                <img src={uploadedUrl} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Box direction="row" gap="small">
                <Text>{uploadedUrl}</Text>
                <Button 
                  label="复制链接" 
                  onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default HomePage;
