import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ConfirmRequest, NoticePayload } from '../../lib/dialog';

/**
 * Global Liquid Glass Dialog & Notice Overlay — eliminates 100% of native browser alert()/confirm()
 */
export const DialogOverlay: React.FC = () => {
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const [notice, setNotice] = useState<NoticePayload | null>(null);

  useEffect(() => {
    let noticeTimer: any;

    const onConfirm = (e: Event) => {
      const detail = (e as CustomEvent<ConfirmRequest>).detail;
      if (detail) setConfirmReq(detail);
    };

    const onNotice = (e: Event) => {
      const detail = (e as CustomEvent<NoticePayload>).detail;
      if (!detail) return;
      setNotice(detail);
      if (noticeTimer) clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => setNotice(null), 3800);
    };

    window.addEventListener('hanzi-confirm', onConfirm);
    window.addEventListener('hanzi-notice', onNotice);
    return () => {
      window.removeEventListener('hanzi-confirm', onConfirm);
      window.removeEventListener('hanzi-notice', onNotice);
      if (noticeTimer) clearTimeout(noticeTimer);
    };
  }, []);

  const handleResolve = (accepted: boolean) => {
    if (!confirmReq) return;
    const resolver = confirmReq.resolve;
    setConfirmReq(null);
    resolver(accepted);
  };

  return (
    <>
      {/* Liquid Glass Notice Toast (replaces browser alert) */}
      <div className="pointer-events-none fixed bottom-6 right-5 z-[110] max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {notice && (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto liquid-toast rounded-2xl p-4 flex items-start gap-3 shadow-2xl"
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  notice.variant === 'error'
                    ? 'bg-rose-500/15 text-rose-600'
                    : notice.variant === 'success'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-sky-500/15 text-sky-600'
                }`}
              >
                {notice.variant === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : notice.variant === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </span>
              <p className="text-xs font-semibold text-gray-800 leading-relaxed flex-1 pt-0.5">
                {notice.message}
              </p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Đóng thông báo"
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liquid Glass Confirm Modal (replaces browser confirm) */}
      <AnimatePresence>
        {confirmReq && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => handleResolve(false)}
              className="fixed inset-0 bg-gray-950/35 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-md rounded-[28px] liquid-modal p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmReq.danger
                      ? 'bg-rose-500/15 text-rose-600'
                      : 'bg-primary-500/15 text-primary-600'
                  }`}
                >
                  {confirmReq.danger ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-display font-extrabold text-gray-900">
                    {confirmReq.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{confirmReq.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleResolve(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  {confirmReq.cancelLabel || 'Quay lại'}
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(true)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-opacity hover:opacity-95 cursor-pointer ${
                    confirmReq.danger
                      ? 'bg-gradient-to-r from-rose-600 to-red-500'
                      : 'bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500'
                  }`}
                >
                  {confirmReq.confirmLabel || 'Xác nhận'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
