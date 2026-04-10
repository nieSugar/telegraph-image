import React, { useEffect, useState, useCallback, useRef } from 'react';
import { IconCheck, IconAlertCircle } from './Icons';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const ToastEntry: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [onRemove, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration ?? 2500);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  const icon = toast.type === 'success' ? <IconCheck size={16} /> :
    toast.type === 'error' ? <IconAlertCircle size={16} /> :
    <IconAlertCircle size={16} />;

  const typeClass = toast.type === 'success' ? 'toast-success' :
    toast.type === 'error' ? 'toast-error' : 'toast-info';

  return (
    <div className={`toast ${typeClass} ${exiting ? 'exiting' : ''}`} onClick={dismiss}>
      {icon}
      <span>{toast.message}</span>
    </div>
  );
};

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastEntry key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default Toast;

let toastCounter = 0;
export function createToast(message: string, type: ToastItem['type'] = 'info', duration?: number): ToastItem {
  return {
    id: `toast-${++toastCounter}-${Date.now()}`,
    message,
    type,
    duration,
  };
}
