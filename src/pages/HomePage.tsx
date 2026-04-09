import axios from 'axios';
import Head from 'next/head';
import React, { useCallback, useRef, useState } from 'react';
import { IconCheck, IconCopy, IconExternalLink, IconUpload, IconUploadCloud, IconX } from '../components/Icons';
import Modal from '../components/Modal';
import type { ToastItem } from '../components/Toast';
import Toast, { createToast } from '../components/Toast';

interface UploadResponse {
  success: boolean;
  urls?: string[];
  message?: string;
}

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    setToasts((prev) => [...prev, createToast(message, type)]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toAbsoluteUrl = useCallback(
    (url: string): string => (url.startsWith('http') ? url : `${window.location.origin}${url}`),
    []
  );

  const resetUpload = useCallback(() => {
    setFile(null);
    setUploadedUrls([]);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const processFile = useCallback(
    (selectedFile: File) => {
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    },
    [previewUrl]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
      else resetUpload();
    },
    [processFile, resetUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<UploadResponse>('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data.success && response.data.urls) {
        setUploadedUrls(response.data.urls.map((u) => toAbsoluteUrl(u)));
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        addToast('上传成功', 'success');
      } else {
        setError('上传失败：' + (response.data.message || '未知错误'));
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') setError('上传超时，请检查网络后重试');
        else if (err.response?.status === 413) setError('文件过大，请选择较小的图片');
        else setError('上传失败：' + (err.response?.data?.message || '网络错误'));
      } else {
        setError('上传失败，请稍后再试');
      }
    } finally {
      setIsUploading(false);
    }
  }, [file, previewUrl, toAbsoluteUrl, addToast]);

  const handleCopy = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(toAbsoluteUrl(url));
        addToast('链接已复制到剪贴板', 'success');
      } catch {
        const ta = document.createElement('textarea');
        ta.value = toAbsoluteUrl(url);
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        addToast('链接已复制到剪贴板', 'success');
      }
    },
    [toAbsoluteUrl, addToast]
  );

  return (
    <>
      <Head>
        <title>Telegraph Image</title>
      </Head>

      <div className="ambient-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        {/* Main Card */}
        <div className="card page-enter" style={{ width: '100%', maxWidth: 520, padding: '48px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                <span className="ornament" />
                <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Image Hosting
                </span>
                <span className="ornament" />
              </div>
              <h1 className="text-display" style={{ fontSize: 36, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
                Telegraph Image
              </h1>
              <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                上传图片，获取永久链接
              </p>
            </div>

            {/* Upload Zone */}
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              style={{ width: '100%' }}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="选择图片"
              />
              <IconUploadCloud size={36} className="upload-zone-icon" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: dragOver ? 'var(--text-accent)' : 'var(--text-secondary)', fontWeight: 500, transition: 'color 0.3s' }}>
                  {dragOver ? '释放以选择文件' : '拖放图片到此处'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  或点击选择 · PNG, JPG, GIF · 最大 10MB
                </p>
              </div>
            </div>

            {/* Preview */}
            {file && previewUrl && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="preview-image"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPreviewModal(true)}
                  />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {file.name}
                  <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {file && !uploadedUrls.length && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" disabled={isUploading} onClick={handleUpload}>
                  {isUploading ? <span className="spinner spinner-sm" /> : <IconUpload size={18} />}
                  {isUploading ? '上传中...' : '上传图片'}
                </button>
                <button className="btn btn-ghost" disabled={isUploading} onClick={resetUpload}>
                  <IconX size={16} />
                  重新选择
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-box" style={{ width: '100%' }}>
                <IconX size={16} />
                {error}
              </div>
            )}

            {/* Upload Results */}
            {uploadedUrls.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="success-box">
                  <IconCheck size={16} />
                  上传成功
                </div>

                {uploadedUrls.map((url, i) => (
                  <div key={`url-${i}`} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-faint)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={url}
                        alt={`已上传 ${i + 1}`}
                        className="preview-image"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setPreviewModal(true)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code className="text-mono" style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                        {url}
                      </code>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleCopy(url)} title="复制链接">
                        <IconCopy size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => window.open(url, '_blank')} title="新窗口打开">
                        <IconExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button className="btn btn-ghost" onClick={resetUpload} style={{ alignSelf: 'center' }}>
                  继续上传
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4, transition: 'opacity 0.3s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.4'; }}
        >
        </div>

        {/* Preview Modal */}
        <Modal open={previewModal} onClose={() => setPreviewModal(false)}>
          <div style={{ padding: 16 }}>
            <img
              src={uploadedUrls[0] || previewUrl || ''}
              alt="预览"
              className="preview-image-lg"
            />
          </div>
        </Modal>

        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    </>
  );
};

export default HomePage;
