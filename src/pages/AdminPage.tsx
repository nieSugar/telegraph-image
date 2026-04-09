import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/useAuth';
import Toast, { createToast } from '../components/Toast';
import type { ToastItem } from '../components/Toast';
import Modal from '../components/Modal';
import {
  IconCopy, IconTrash, IconHome, IconLogOut, IconRefresh,
  IconChevronLeft, IconChevronRight, IconImage, IconX,
} from '../components/Icons';

interface ApiImageItem {
  id: number;
  name: string;
  originalName: string;
  url: string;
  createdAt?: string;
  uploadTime?: string;
}

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
  stats?: { total: number; public: number; deleted: number; totalSize: number };
  pagination?: { page: number; limit: number; hasMore: boolean };
  message?: string;
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

const AdminPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<ImagesApiResponse['stats'] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const itemsPerPage = 20;

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const { logout } = useAuth();
  const isMobile = useIsMobile();

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    setToasts((prev) => [...prev, createToast(message, type)]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const formatDate = useCallback((input?: string) => {
    if (!input) return '';
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return input;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return input; }
  }, []);

  const fetchImages = useCallback(async (page: number) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/images?page=${page}&limit=${itemsPerPage}&stats=true`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ImagesApiResponse = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');

      setImages((data.images || []).map((img) => ({
        id: img.id,
        name: img.name,
        originalName: img.originalName,
        url: img.url,
        uploadDate: formatDate(img.createdAt || img.uploadTime),
      })));
      setTotalItems(data.stats?.total ?? (data.images?.length || 0));
      setStats(data.stats || null);
    } catch (e) {
      setImages([]);
      setTotalItems(0);
      setStats(null);
      setFetchError(e instanceof Error ? e.message : '获取图片列表失败');
    } finally {
      setLoading(false);
    }
  }, [formatDate]);

  useEffect(() => { fetchImages(currentPage); }, [currentPage, fetchImages]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchImages(currentPage);
    setRefreshing(false);
  }, [currentPage, fetchImages]);

  const handleDeleteClick = useCallback((id: number) => {
    setSelectedId(id);
    setDeleteError(null);
    setShowConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedId) { setShowConfirm(false); return; }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/images/${selectedId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchImages(currentPage);
        setShowConfirm(false);
        setSelectedId(null);
        addToast('图片已删除', 'success');
      } else {
        setDeleteError(data.message || '删除失败');
      }
    } catch {
      setDeleteError('删除请求失败，请稍后再试');
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedId, currentPage, fetchImages, addToast]);

  const handleCopy = useCallback(async (url: string) => {
    const full = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    try {
      await navigator.clipboard.writeText(full);
      addToast('链接已复制', 'success');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = full;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      addToast('链接已复制', 'success');
    }
  }, [addToast]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginationPages = useMemo(() => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('dots');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const indexFirst = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const indexLast = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      <Head>
        <title>图片管理 — Telegraph Image</title>
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: isMobile ? 12 : 24 }}>
        <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div className="card" style={{ padding: isMobile ? '16px' : '20px 28px', marginBottom: isMobile ? 12 : 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                <h1 className="text-display" style={{ fontSize: isMobile ? 22 : 26, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  图片管理
                </h1>
                {stats && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {stats.total} 张图片
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  title="刷新"
                >
                  {refreshing ? <span className="spinner spinner-sm" /> : <IconRefresh size={18} />}
                </button>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <button className="btn btn-ghost btn-icon" title="首页">
                    <IconHome size={18} />
                  </button>
                </Link>
                <button className="btn btn-danger btn-icon" onClick={logout} title="退出">
                  <IconLogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {fetchError && !showConfirm && (
            <div className="error-box" style={{ marginBottom: 16 }}>
              <IconX size={16} />
              {fetchError}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="card" style={{ padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <span className="spinner spinner-lg" />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>加载中...</p>
            </div>
          ) : images.length === 0 && !fetchError ? (
            <div className="card" style={{ padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <IconImage size={48} className="text-muted" />
              <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>暂无图片</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>去首页上传第一张图片吧</p>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary">去上传</button>
              </Link>
            </div>
          ) : isMobile ? (
            /* ── Mobile Cards ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {images.map((img, idx) => (
                <div key={img.id} className="card card-hover stagger-item" style={{ padding: 14, animationDelay: `${idx * 0.03}s` }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img
                      src={img.url}
                      alt={img.name}
                      className="table-thumb"
                      onClick={() => setPreviewImage(img.url)}
                    />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{img.originalName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        #{img.id} · {img.uploadDate}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleCopy(img.url)} title="复制">
                        <IconCopy size={15} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDeleteClick(img.id)} title="删除">
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop Table ── */
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>ID</th>
                    <th>文件名</th>
                    <th style={{ width: 80 }}>预览</th>
                    <th style={{ width: 150 }}>上传时间</th>
                    <th style={{ width: 100 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((img, idx) => (
                    <tr key={img.id} className="stagger-item" style={{ animationDelay: `${idx * 0.03}s` }}>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {img.id}
                        </span>
                      </td>
                      <td>
                        <span className="truncate" style={{ display: 'block', maxWidth: 260, fontSize: 14 }}>
                          {img.originalName}
                        </span>
                      </td>
                      <td>
                        <img
                          src={img.url}
                          alt={img.name}
                          className="table-thumb"
                          onClick={() => setPreviewImage(img.url)}
                        />
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {img.uploadDate}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleCopy(img.url)} title="复制链接">
                            <IconCopy size={15} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDeleteClick(img.id)} title="删除">
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card" style={{ padding: '16px 20px', marginTop: isMobile ? 12 : 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <IconChevronLeft size={16} />
                </button>

                {paginationPages.map((p, i) =>
                  p === 'dots' ? (
                    <span key={`dots-${i}`} className="pagination-dots">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <IconChevronRight size={16} />
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                显示 {indexFirst} - {indexLast} 条，共 {totalItems} 条
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal open={showConfirm} onClose={() => !deleteLoading && setShowConfirm(false)} width="380px">
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="text-display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>确认删除</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              确定要删除这张图片吗？此操作无法撤销。
            </p>
            {deleteError && <div className="error-box">{deleteError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)} disabled={deleteLoading}>
                取消
              </button>
              <button className="btn btn-danger-solid" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="spinner spinner-sm" /> : <IconTrash size={16} />}
                {deleteLoading ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Image Preview Modal */}
        <Modal open={!!previewImage} onClose={() => setPreviewImage(null)}>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewImage && (
              <img src={previewImage} alt="预览" className="preview-image-lg" />
            )}
          </div>
        </Modal>

        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    </>
  );
};

export default AdminPage;
