import React, { useState } from 'react';
import { Send, CheckCircle, RefreshCcw, Eye, ShieldAlert } from 'lucide-react';
import { PracticeVersionStatus } from '../../pages/admin/practice/practice-admin.types';
import { appConfirm, appNotice } from '../../lib/dialog';

interface ReviewActionsProps {
  versionId: number;
  collectionId: number;
  versionStatus: PracticeVersionStatus;
  userRole: 'ADMIN' | 'CONTENT_EDITOR' | 'STUDENT';
  hasValidationErrors: boolean;
  onSubmitReview: () => Promise<void>;
  onRequestChanges: (note: string) => Promise<void>;
  onPublish: () => Promise<void>;
  onRetire: () => Promise<void>;
}

export const ReviewActions: React.FC<ReviewActionsProps> = ({
  versionId,
  collectionId,
  versionStatus,
  userRole,
  hasValidationErrors,
  onSubmitReview,
  onRequestChanges,
  onPublish,
  onRetire,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNote, setChangesNote] = useState('');

  const isAdmin = userRole === 'ADMIN';

  // Content Editor hoặc Admin gửi duyệt
  const handleSubmitReviewClick = async () => {
    if (hasValidationErrors) {
      appNotice('Vui lòng sửa tất cả lỗi được liệt kê trước khi gửi duyệt.', 'warning');
      return;
    }
    const confirmed = await appConfirm({
      title: 'Xác nhận gửi duyệt',
      message: 'Bạn có chắc chắn muốn gửi phiên bản này cho Quản trị viên duyệt không?',
      confirmLabel: 'Gửi duyệt',
    });
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await onSubmitReview();
      appNotice('Đã gửi phiên bản cho Quản trị viên kiểm duyệt thành công!', 'success');
    } catch (err: any) {
      appNotice(err.message || 'Gửi duyệt thất bại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin yêu cầu chỉnh sửa
  const handleRequestChangesSubmit = async () => {
    if (!changesNote.trim() || changesNote.trim().length < 5) {
      appNotice('Lý do yêu cầu chỉnh sửa tối thiểu phải từ 5 ký tự.', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      await onRequestChanges(changesNote.trim());
      setShowChangesModal(false);
      appNotice('Đã gửi yêu cầu chỉnh sửa cho Biên tập viên.', 'success');
    } catch (err: any) {
      appNotice(err.message || 'Yêu cầu sửa đổi thất bại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin xuất bản
  const handlePublishClick = async () => {
    if (hasValidationErrors) {
      appNotice('Phiên bản còn lỗi không đạt chuẩn. Không thể xuất bản.', 'error');
      return;
    }
    const confirmed = await appConfirm({
      title: 'Xuất bản phiên bản',
      message:
        'Bạn có chắc chắn muốn xuất bản phiên bản này? Khi xuất bản, phiên bản này sẽ hiển thị cho học viên và trở thành phiên bản bất biến.',
      confirmLabel: 'Xuất bản ngay',
    });
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await onPublish();
      appNotice('Đã xuất bản thành công bài luyện tập!', 'success');
    } catch (err: any) {
      appNotice(err.message || 'Xuất bản thất bại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. Nút Gửi duyệt: Dành cho DRAFT hoặc REVISION_REQUIRED */}
      {(versionStatus === 'DRAFT' || versionStatus === 'REVISION_REQUIRED') && (
        <button
          type="button"
          disabled={submitting || hasValidationErrors}
          onClick={handleSubmitReviewClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Gửi duyệt (In Review)
        </button>
      )}

      {/* 2. Admin Review Actions: Chỉ khi status là IN_REVIEW */}
      {versionStatus === 'IN_REVIEW' && isAdmin && (
        <>
          <button
            type="button"
            disabled={submitting}
            onClick={() => setShowChangesModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Yêu cầu chỉnh sửa
          </button>

          <button
            type="button"
            disabled={submitting || hasValidationErrors}
            onClick={handlePublishClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Duyệt & Xuất bản (Publish)
          </button>
        </>
      )}

      {/* 3. Modal Request Changes */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Yêu cầu chỉnh sửa nội dung
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhập chi tiết các điểm cần sửa để Biên tập viên nắm rõ và chỉnh sửa lại:
            </p>
            <textarea
              rows={4}
              value={changesNote}
              onChange={(e) => setChangesNote(e.target.value)}
              placeholder="Ví dụ: Vui lòng bổ sung thêm phần giải thích chi tiết cho câu hỏi số 3..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting || changesNote.trim().length < 5}
                onClick={handleRequestChangesSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
