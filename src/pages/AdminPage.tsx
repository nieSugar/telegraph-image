import {
  Box,
  Button,
  Card,
  Heading,
  Image,
  Layer,
  Notification,
  Pagination,
  ResponsiveContext,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  Tip,
} from "grommet";
import { Copy, Home, Logout, Refresh, Trash } from "grommet-icons";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/useAuth";

// API 返回的图片类型（对齐后端 ImageRecord 的关键字段）
interface ApiImageItem {
  id: number;
  name: string;
  originalName: string;
  url: string;
  createdAt?: string;
  uploadTime?: string;
}

// 前端展示用类型
interface ImageItem {
  id: number;
  name: string;
  originalName: string;
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    public: number;
    deleted: number;
    totalSize: number;
  } | null>(null);
  const { logout } = useAuth();

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 计算当前页面展示的区间
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirstItem = Math.min(
    indexOfLastItem - itemsPerPage + 1,
    indexOfLastItem
  );

  // 处理页面变化
  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchImages(currentPage);
    setRefreshing(false);
  }, [currentPage]);

  const handleDeleteClick = useCallback((id: number) => {
    setSelectedImageId(id);
    setDeleteError(null);
    setShowConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedImageId) {
      setDeleteLoading(true);
      setDeleteError(null);

      try {
        const response = await fetch(`/api/images/${selectedImageId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          await fetchImages(currentPage);
          setShowConfirm(false);
          setSelectedImageId(null);
        } else {
          setDeleteError(data.message || "删除失败");
        }
      } catch (error) {
        console.error("删除请求失败:", error);
        setDeleteError("删除请求失败，请稍后再试");
      } finally {
        setDeleteLoading(false);
      }
    } else {
      setShowConfirm(false);
    }
  }, [selectedImageId, currentPage]);

  const handleCopyClick = useCallback(async (url: string) => {
    try {
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopyVisible(true);
    } catch (error) {
      console.error("Copy failed:", error);
      // 降级方案
      const textArea = document.createElement("textarea");
      textArea.value = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopyVisible(true);
      } catch (e) {
        console.error("Fallback copy failed:", e);
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const formatDate = useCallback((input?: string) => {
    if (!input) return "";
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return input;
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, "0");
      const day = `${d.getDate()}`.padStart(2, "0");
      const hh = `${d.getHours()}`.padStart(2, "0");
      const mm = `${d.getMinutes()}`.padStart(2, "0");
      return `${y}-${m}-${day} ${hh}:${mm}`;
    } catch {
      return input;
    }
  }, []);

  const fetchImages = useCallback(
    async (page: number) => {
      setLoading(true);
      setDeleteError(null);

      try {
        const res = await fetch(
          `/api/images?page=${page}&limit=${itemsPerPage}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: ImagesApiResponse = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch images");
        }

        const list = (data.images || []).map((img) => ({
          id: img.id,
          name: img.name,
          originalName: img.originalName,
          url: img.url,
          uploadDate: formatDate(img.createdAt || img.uploadTime),
        }));

        setImages(list);
        setTotalItems(data.stats?.total ?? list.length);
        setStats(data.stats || null);
      } catch (error) {
        console.error("Failed to fetch images:", error);
        setImages([]);
        setTotalItems(0);
        setStats(null);
        setDeleteError(
          error instanceof Error ? error.message : "获取图片列表失败"
        );
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, formatDate]
  );

  useEffect(() => {
    fetchImages(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  return (
    <ResponsiveContext.Consumer>
      {(size) => (
        <Box
          fill
          pad={size === "small" ? "small" : "medium"}
          background="background"
        >
          {/* 头部 */}
          <Card
            pad="medium"
            margin={{ bottom: "medium" }}
            className="custom-card"
          >
            <Box direction="row" justify="between" align="center" wrap>
              <Box direction="row" align="center" gap="medium">
                <Heading level={2} margin="none">
                  图片管理
                </Heading>
                {stats && (
                  <Box direction="row" gap="small" align="center">
                    <Text size="small" color="neutral-4">
                      共 {stats.total} 张图片
                    </Text>
                  </Box>
                )}
              </Box>

              <Box direction="row" gap="small" align="center">
                <Tip content="刷新数据">
                  <Button
                    icon={refreshing ? <Spinner size="small" /> : <Refresh />}
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="custom-button"
                  />
                </Tip>

                <Link href="/" passHref>
                  <Button
                    icon={<Home />}
                    label={size !== "small" ? "返回首页" : undefined}
                    className="custom-button"
                  />
                </Link>

                <Button
                  icon={<Logout />}
                  label={size !== "small" ? "退出登录" : undefined}
                  onClick={logout}
                  color="status-critical"
                  className="custom-button"
                />
              </Box>
            </Box>
          </Card>

          {/* 错误信息 */}
          {deleteError && !showConfirm && (
            <Box
              pad="medium"
              background="status-critical"
              round="medium"
              margin={{ bottom: "medium" }}
            >
              <Text color="white">{deleteError}</Text>
            </Box>
          )}

          {/* 主内容 */}
          {loading ? (
            <Card pad="large" align="center" className="custom-card">
              <Box align="center" gap="medium">
                <Spinner size="medium" />
                <Text>加载中...</Text>
              </Box>
            </Card>
          ) : images.length === 0 ? (
            <Card pad="large" align="center" className="custom-card">
              <Box align="center" gap="medium">
                <Text size="large" color="neutral-4">
                  暂无图片
                </Text>
                <Text size="small" color="neutral-4">
                  还没有上传任何图片，去首页上传第一张图片吧！
                </Text>
                <Link href="/" passHref>
                  <Button label="去上传" primary />
                </Link>
              </Box>
            </Card>
          ) : size === "small" ? (
            // 移动端卡片布局
            <Box gap="medium">
              {images.map((image) => (
                <Card key={image.id} pad="medium" className="custom-card">
                  <Box gap="small">
                    <Box direction="row" justify="between" align="start">
                      <Box flex>
                        <Text weight="bold" truncate>
                          {image.name}
                        </Text>
                        <Text size="small" color="neutral-4">
                          ID: {image.id}
                        </Text>
                        <Text size="small" color="neutral-4">
                          {image.uploadDate}
                        </Text>
                      </Box>
                      <Box direction="row" gap="xsmall">
                        <Tip content="复制链接">
                          <Button
                            icon={<Copy />}
                            onClick={() => handleCopyClick(image.url)}
                            size="small"
                            className="custom-button"
                          />
                        </Tip>
                        <Tip content="删除图片">
                          <Button
                            icon={<Trash />}
                            onClick={() => handleDeleteClick(image.id)}
                            size="small"
                            color="status-critical"
                            className="custom-button"
                          />
                        </Tip>
                      </Box>
                    </Box>

                    <Box
                      align="center"
                      pad="small"
                      background="rgba(255,255,255,0.05)"
                      round="small"
                    >
                      <Image
                        src={image.url}
                        alt={image.name}
                        fit="contain"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewImage(image.url)}
                      />
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          ) : (
            // 桌面端表格布局
            <Card className="custom-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold">ID</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold">文件名</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold">预览</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold">上传时间</Text>
                    </TableCell>
                    <TableCell scope="col" border="bottom" pad="small">
                      <Text weight="bold">操作</Text>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell pad="small">
                        <Text>{image.id}</Text>
                      </TableCell>
                      <TableCell pad="small">
                        <Text truncate style={{ maxWidth: "200px" }}>
                          {image.originalName}
                        </Text>
                      </TableCell>
                      <TableCell pad="small">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="table-thumbnail"
                          onClick={() => setPreviewImage(image.url)}
                        />
                      </TableCell>
                      <TableCell pad="small">
                        <Text size="small">{image.uploadDate}</Text>
                      </TableCell>
                      <TableCell pad="small">
                        <Box direction="row" gap="xsmall">
                          <Tip content="复制链接">
                            <Button
                              icon={<Copy />}
                              onClick={() => handleCopyClick(image.url)}
                              size="small"
                              className="custom-button"
                            />
                          </Tip>
                          <Tip content="删除图片">
                            <Button
                              icon={<Trash />}
                              onClick={() => handleDeleteClick(image.id)}
                              size="small"
                              color="status-critical"
                              className="custom-button"
                            />
                          </Tip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* 分页控件 */}
          {totalItems > itemsPerPage && (
            <Card
              pad="medium"
              margin={{ top: "medium" }}
              className="custom-card"
            >
              <Box align="center" gap="small">
                <Pagination
                  numberItems={totalItems}
                  step={itemsPerPage}
                  page={currentPage}
                  onChange={({ page }) => handlePageChange(page)}
                />
                <Text size="small" color="neutral-4">
                  显示 {totalItems === 0 ? 0 : indexOfFirstItem} -{" "}
                  {indexOfLastItem} 条，共 {totalItems} 条
                </Text>
              </Box>
            </Card>
          )}

          {/* 删除确认弹窗 */}
          {showConfirm && (
            <Layer
              position="center"
              onClickOutside={() => !deleteLoading && setShowConfirm(false)}
              onEsc={() => !deleteLoading && setShowConfirm(false)}
            >
              <Card pad="medium" gap="medium" width="medium">
                <Heading level={3} margin="none">
                  确认删除
                </Heading>
                <Text>确定要删除这张图片吗？此操作无法撤销。</Text>

                {deleteError && (
                  <Text color="status-critical" size="small">
                    {deleteError}
                  </Text>
                )}

                <Box direction="row" gap="medium" justify="end">
                  <Button
                    label="取消"
                    onClick={() => setShowConfirm(false)}
                    disabled={deleteLoading}
                    className="custom-button"
                  />
                  <Button
                    label={deleteLoading ? "删除中..." : "删除"}
                    primary
                    color="status-critical"
                    onClick={confirmDelete}
                    disabled={deleteLoading}
                    icon={deleteLoading ? <Spinner size="small" /> : <Trash />}
                    className="custom-button"
                  />
                </Box>
              </Card>
            </Layer>
          )}

          {/* 图片预览弹窗 */}
          {previewImage && (
            <Layer
              onEsc={() => setPreviewImage(null)}
              onClickOutside={() => setPreviewImage(null)}
            >
              <Box
                pad="medium"
                align="center"
                gap="medium"
                width="large"
                height="large"
              >
                <Box flex align="center" justify="center">
                  <img
                    src={previewImage}
                    alt="图片预览"
                    style={{
                      maxWidth: "90vw",
                      maxHeight: "80vh",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </Box>
            </Layer>
          )}

          {/* 复制成功通知 */}
          {copyVisible && (
            <Notification
              toast
              status="normal"
              time={2000}
              title="链接已复制到剪贴板"
              onClose={() => setCopyVisible(false)}
            />
          )}
        </Box>
      )}
    </ResponsiveContext.Consumer>
  );
};

export default AdminPage;
