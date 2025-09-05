import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Table, 
  TableHeader, 
  TableRow, 
  TableCell, 
  TableBody, 
  Button, 
  Text, 
  Layer, 
  Notification,
  Pagination
} from 'grommet';
import { Trash, Logout, Copy } from 'grommet-icons';
import { useAuth } from '../contexts/useAuth';

// 定义图片项的类型
interface ImageItem {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  size: string;
}

// 模拟更多数据
const generateMockImages = (): ImageItem[] => {
  const images: ImageItem[] = [];
  for (let i = 1; i <= 600; i++) {
    images.push({
      id: `${i}`,
      name: `image-${i}.jpg`,
      url: `https://example.com/images/${i}`,
      uploadDate: `2025-09-${(i % 30) + 1}`.padStart(10, '0'),
      size: `${(Math.random() * 5).toFixed(1)} MB`
    });
  }
  return images;
};

const mockImages: ImageItem[] = generateMockImages();

const AdminPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>(mockImages);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { logout } = useAuth();
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // 计算当前页面应显示的数据
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentImages = images.slice(indexOfFirstItem, indexOfLastItem);
  
  // 处理页面变化
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedImageId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedImageId) {
      const newImages = images.filter(img => img.id !== selectedImageId);
      setImages(newImages);
      
      // 检查当前页是否还有数据，如果没有且不是第一页，则返回上一页
      const totalPagesAfterDelete = Math.ceil(newImages.length / itemsPerPage);
      if (currentPage > totalPagesAfterDelete && currentPage > 1) {
        setCurrentPage(totalPagesAfterDelete);
      }
    }
    setShowConfirm(false);
  };

  const handleCopyClick = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyVisible(true);
  };

  return (
    <Box fill pad="medium">
      <Box direction="row" justify="between" align="center" margin={{ bottom: 'medium' }}>
        <Heading level={2}>图片管理</Heading>
        <Button 
          icon={<Logout />} 
          label="退出登录" 
          onClick={logout}
        />
      </Box>

      {images.length === 0 ? (
        <Box align="center" margin={{ top: 'large' }}>
          <Text>没有上传的图片</Text>
        </Box>
      ) : (
        <Box>
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
                  操作
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentImages.map(image => (
                <TableRow key={image.id}>
                  <TableCell>{image.id}</TableCell>
                  <TableCell>{image.name}</TableCell>
                  <TableCell>
                    <img src={image.url} alt={image.name} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                  </TableCell>
                  <TableCell>{image.uploadDate}</TableCell>
                  <TableCell>
                    <Button icon={<Copy />} onClick={() => handleCopyClick(image.url)} />
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
          
          {/* 分页控件 */}
          <Box align="center" margin={{ top: 'medium' }}>
            <Pagination
              numberItems={images.length}
              step={itemsPerPage}
              page={currentPage}
              onChange={({ page }) => handlePageChange(page)}
            />
            <Text size="small" margin={{ top: 'small' }}>
              显示 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, images.length)} 条，共 {images.length} 条
            </Text>
          </Box>
        </Box>
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

      {copyVisible && (
        <Notification
          toast
          status='normal'
          time={1000}
          title="Copy successful"
          onClose={() => setCopyVisible(false)}
        />
      )}
    </Box>
  );
};

export default AdminPage;
