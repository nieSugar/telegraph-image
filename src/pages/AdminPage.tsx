import React, { useEffect, useState } from 'react';
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

// API 返回的图片类型（对齐后端 ImageRecord 的关键字段）
interface ApiImageItem {
  id: number;
  name: string;
  url: string;
  created_at?: string;
  upload_time?: string;
}

// 前端展示用类型
interface ImageItem {
  id: number;
  name: string;
  url: string;
  uploadDate: string;
}

interface ImagesApiResponse {
  success: boolean;
  images?: ApiImageItem[];
  stats?: {
    total: number;
    public: number;
    deleted: number;
    totalSize: number;
  };
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message?: string;
}

const AdminPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const { logout } = useAuth();
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 计算当前页面展示的区间
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirstItem = Math.min(indexOfLastItem - itemsPerPage + 1, indexOfLastItem);
  
  // 处理页面变化
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedImageId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedImageId) {
      // 仅本地删除占位；如需真实删除可调用 /api/images/[id] 再刷新列表
      const newImages = images.filter(img => img.id !== selectedImageId);
      setImages(newImages);
      setTotalItems(prev => Math.max(prev - 1, 0));
    }
    setShowConfirm(false);
  };

  const handleCopyClick = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyVisible(true);
  };

  function formatDate(input?: string) {
    if (!input) return '';
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return input;
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      const hh = `${d.getHours()}`.padStart(2, '0');
      const mm = `${d.getMinutes()}`.padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    } catch {
      return input;
    }
  }

  async function fetchImages(page: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/images?all=true&page=${page}&limit=${itemsPerPage}&stats=true`);
      const data: ImagesApiResponse = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      const list = (data.images || []).map((img) => ({
        id: img.id,
        name: img.name,
        url: img.url,
        uploadDate: formatDate(img.created_at || img.upload_time)
      }));
      setImages(list);
      setTotalItems(data.stats?.total ?? list.length);
    } catch (e) {
      // 简单回退：清空数据
      setImages([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchImages(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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

      {loading ? (
        <Box align="center" margin={{ top: 'large' }}>
          <Text>加载中...</Text>
        </Box>
      ) : images.length === 0 ? (
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
              {images.map(image => (
                <TableRow key={image.id}>
                  <TableCell>{image.id}</TableCell>
                  <TableCell>{image.name}</TableCell>
                  <TableCell>
                    <Text size="small" truncate>{image.url}</Text>
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
              numberItems={totalItems}
              step={itemsPerPage}
              page={currentPage}
              onChange={({ page }) => handlePageChange(page)}
            />
            <Text size="small" margin={{ top: 'small' }}>
              显示 {totalItems === 0 ? 0 : indexOfFirstItem} - {indexOfLastItem} 条，共 {totalItems} 条
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
