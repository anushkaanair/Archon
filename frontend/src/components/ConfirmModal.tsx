import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog for irreversible actions.
 *
 * @example
 * <ConfirmModal
 *   open={showConfirm}
 *   title="Revoke API key"
 *   message="This cannot be undone."
 *   confirmLabel="Revoke"
 *   danger
 *   onConfirm={handleRevoke}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            style={{ border: '1.5px solid rgba(91,0,232,0.12)' }}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            {danger && (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            )}

            {/* Content */}
            <h3 className="text-[16px] font-bold text-[#0D0D0D] mb-2 pr-6">{title}</h3>
            <p className="text-[13px] text-[#6B7280] mb-6 leading-relaxed">{message}</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F4F2FF]"
                style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                style={{
                  background: danger
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'linear-gradient(135deg, #5B00E8, #7C3AED)',
                  boxShadow: danger
                    ? '0 2px 12px rgba(239,68,68,0.3)'
                    : '0 2px 12px rgba(91,0,232,0.3)',
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
