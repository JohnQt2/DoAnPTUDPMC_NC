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
              className={[
                'pointer-events-auto rounded-2xl border-[1.5px] p-4 flex items-start gap-3 shadow-2xl backdrop-blur-[24px] backdrop-saturate-[190%]',
                notice.variant === 'error'
                  ? 'bg-white/95 border-red-200 dark:bg-slate-900/95 dark:border-red-900/70'
                  : notice.variant === 'success'
                    ? 'bg-white/95 border-emerald-200 dark:bg-slate-900/95 dark:border-emerald-900/70'
                    : notice.variant === 'warning'
                      ? 'bg-white/95 border-amber-200 dark:bg-slate-900/95 dark:border-amber-900/70'
                      : 'bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-700',
              ].join(' ')}
            >
              <span
                className={[
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  notice.variant === 'error'
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300'
                    : notice.variant === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : notice.variant === 'warning'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                ].join(' ')}
              >
                {notice.variant === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : notice.variant === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </span>
              <p
                className={[
                  'flex-1 pt-0.5 text-sm font-semibold leading-5 opacity-100',
                  notice.variant === 'error'
                    ? 'text-red-700 dark:text-red-200'
                    : notice.variant === 'success'
                      ? 'text-emerald-700 dark:text-emerald-200'
                      : notice.variant === 'warning'
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-slate-700 dark:text-slate-100',
                ].join(' ')}
              >
                {notice.message}
              </p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Đóng thông báo"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
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
              className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-[28px] liquid-modal p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmReq.danger
                        ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'bg-primary-500/15 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300'
                  }`}
                >
                  {confirmReq.danger ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-display font-extrabold text-gray-900 dark:text-slate-100">
                    {confirmReq.title}
                  </h3>
                  <p className="whitespace-pre-line break-words text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{confirmReq.message}</p>
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
                      ? 'bg-gradient-to-r from-rose-700 to-red-700'
                      : 'bg-gradient-to-r from-primary-700 via-rose-700 to-amber-700'
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
