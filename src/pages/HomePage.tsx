import React, { useState } from 'react';
import { Box, Heading, Text, FileInput, Button, Card, Notification } from 'grommet';
import { Copy, Upload } from 'grommet-icons';

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrl] = useState<string[]>([]);
  const [copyVisible, setCopyVisible] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setUploadedUrl([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const mockUrl = URL.createObjectURL(file);
      setUploadedUrl([mockUrl]);
    } catch (error) {
      console.error('Upload failed:', error);
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
              <Button 
                icon={<Upload />} 
                label="上传图片" 
                primary 
                disabled={isUploading}
                onClick={handleUpload}
              />
            </Box>
          )}

          {uploadedUrls.length > 0 && (
            <Box align="center" gap="small">
              <Text weight="bold" color={"rgb(111, 255, 176)"}>上传成功!</Text>
              <Box direction="row" gap="small">
                {uploadedUrls.map((url, index) => (
                  <Box key={index} direction="row" gap="small">
                    <Text alignSelf="center">{url}</Text>
                    <Button
                      icon={<Copy />}
                      onClick={() => handleCopyClick(url)}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
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
