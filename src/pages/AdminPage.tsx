import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, TableHeader, TableRow, TableCell, TableBody, Button, Text, Layer } from 'grommet';
import { Trash, Logout } from 'grommet-icons';
import { useNavigate } from 'react-router-dom';

// 定义图片项的类型
interface ImageItem {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  size: string;
}

// 模拟数据
const mockImages: ImageItem[] = [
  {
    id: '1',
    name: 'nature.jpg',
    url: 'https://example.com/images/1',
    uploadDate: '2025-09-01',
    size: '1.2 MB'
  },
  {
    id: '2',
    name: 'profile.png',
    url: 'https://example.com/images/2',
    uploadDate: '2025-09-02',
    size: '0.8 MB'
  },
  {
    id: '3',
    name: 'document.jpg',
    url: 'https://example.com/images/3',
    uploadDate: '2025-09-03',
    size: '2.1 MB'
  }
];

const AdminPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>(mockImages);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const navigate = useNavigate();

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const handleDeleteClick = (id: string) => {
    setSelectedImageId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedImageId) {
      setImages(images.filter(img => img.id !== selectedImageId));
    }
    setShowConfirm(false);
  };

  return (
    <Box fill pad="medium">
      <Box direction="row" justify="between" align="center" margin={{ bottom: 'medium' }}>
        <Heading level={2}>图片管理</Heading>
        <Button 
          icon={<Logout />} 
          label="退出登录" 
          onClick={handleLogout}
        />
      </Box>

      {images.length === 0 ? (
        <Box align="center" margin={{ top: 'large' }}>
          <Text>没有上传的图片</Text>
        </Box>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell scope="col" border="bottom">
                ID
              </TableCell>
              <TableCell scope="col" border="bottom">
                文件名
              </TableCell>
              <TableCell scope="col" border="bottom">
                URL
              </TableCell>
              <TableCell scope="col" border="bottom">
                上传日期
              </TableCell>
              <TableCell scope="col" border="bottom">
                大小
              </TableCell>
              <TableCell scope="col" border="bottom">
                操作
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {images.map(image => (
              <TableRow key={image.id}>
                <TableCell>{image.id}</TableCell>
                <TableCell>{image.name}</TableCell>
                <TableCell>
                  <a href={image.url} target="_blank" rel="noopener noreferrer">
                    {image.url}
                  </a>
                </TableCell>
                <TableCell>{image.uploadDate}</TableCell>
                <TableCell>{image.size}</TableCell>
                <TableCell>
                  <Button
                    icon={<Trash color="status-critical" />}
                    onClick={() => handleDeleteClick(image.id)}
                    plain
                    hoverIndicator
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showConfirm && (
        <Layer
          position="center"
          onClickOutside={() => setShowConfirm(false)}
          onEsc={() => setShowConfirm(false)}
        >
          <Box pad="medium" gap="medium" width="medium">
            <Heading level={3} margin="none">
              确认删除
            </Heading>
            <Text>确定要删除这张图片吗？此操作无法撤销。</Text>
            <Box
              direction="row"
              gap="medium"
              justify="end"
            >
              <Button label="取消" onClick={() => setShowConfirm(false)} />
              <Button
                label="删除"
                primary
                color="status-critical"
                onClick={confirmDelete}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default AdminPage;
