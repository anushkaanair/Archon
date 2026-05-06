import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms, 0 = sticky
  onDismiss: (id: string) => void;
}

const META: Record<ToastVariant, { icon: React.FC<any>; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.2)'  },
  warning: { icon: AlertTriangle, color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)'  },
  error:   { icon: XCircle,       color: '#DC2626', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.18)' },
  info:    { icon: Info,          color: '#2563EB', bg: 'rgba(37,99,235,0.07)', border: 'rgba(37,99,235,0.18)' },
};

export function Toast({ id, message, variant = 'info', duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, color, bg, border } = META[variant];

  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onDismiss(id), 300); // wait for exit anim
      return () => clearTimeout(t);
    }
  }, [visible, id, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium shadow-lg"
          style={{ background: bg, border: `1.5px solid ${border}`, color, minWidth: 240, maxWidth: 380 }}
        >
          <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          <span className="flex-1 leading-snug" style={{ color: '#0D0D0D' }}>{message}</span>
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: '#374151' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Toast container ──────────────────────────────────────────────────────── */
export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/* ── useToast hook ────────────────────────────────────────────────────────── */
import { useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, variant, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
