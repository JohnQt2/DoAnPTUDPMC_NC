import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Edit3,
  Plus,
  RefreshCw,
  FolderOpen,
  Calendar,
  User,
  Shield,
  Layers,
  Archive,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { practiceAdminApi } from './practice-admin.api';
import { PracticeAdminCollectionDetail } from './practice-admin.types';
import { PracticeStatusBadge } from '../../../components/practice-admin/PracticeStatusBadge';
import { PracticeCategoryBadge } from '../../../components/practice-admin/PracticeCategoryBadge';
import { VersionHistoryPanel } from '../../../components/practice-admin/VersionHistoryPanel';
import { CollectionForm } from '../../../components/practice-admin/CollectionForm';
import { GlassCard, ShimmerButton } from '../../../components/ui';
import { formatDateTime, extractErrorMessage } from './practice-admin.utils';
import { appConfirm, appNotice } from '../../../lib/dialog';

export const PracticeCollectionDetailPage: React.FC<{ collectionId: number }> = ({ collectionId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [collection, setCollection] = useState<PracticeAdminCollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await practiceAdminApi.getCollection(collectionId);
      setCollection(data);
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Tạo Revision mới
  const handleCreateRevision = async (sourceVersionId?: number) => {
    const confirmed = await appConfirm({
      title: 'Tạo Revision mới (Phiên bản nháp mới)',
      message:
        'Hệ thống sẽ tạo một phiên bản DRAFT mới và sao chép toàn bộ phần thi, câu hỏi từ phiên bản đã chọn để bạn chỉnh sửa mà không ảnh hưởng đến phiên bản đang phát hành.',
      confirmLabel: 'Tạo Revision ngay',
    });
    if (!confirmed) return;

    try {
      const newVersion = await practiceAdminApi.createVersion(collectionId, {
        sourceVersionId,
        changeSummary: 'Khởi tạo phiên bản nháp mới',
      });
      appNotice('Tạo Revision mới thành công!', 'success');
      window.location.hash = `#/admin/practice/versions/${newVersion.id}/edit`;
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  // Cập nhật Metadata (Optimistic Concurrency)
  const handleUpdateMetadata = async (values: any) => {
    if (!collection) return;
    try {
      setIsUpdating(true);
      await practiceAdminApi.updateCollection(collection.id, {
        titleZh: values.titleZh,
        titlePinyin: values.titlePinyin,
        titleVi: values.titleVi,
        description: values.description,
        orderIndex: values.orderIndex,
        expectedUpdatedAt: collection.updatedAt,
      });
      appNotice('Cập nhật thông tin bộ đề thành công!', 'success');
      setIsEditingMetadata(false);
      fetchDetail();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      if (error.code === 'EDIT_CONFLICT') {
        appNotice('Nội dung đã được người khác cập nhật trước đó. Vui lòng tải lại trang.', 'error');
      } else {
        appNotice(error.message, 'error');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
        Đang tải thông tin bộ đề...
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <a
          href="#/admin/practice"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về danh sách bài luyện tập</span>
        </a>

        <div className="flex items-center gap-3">
          {collection.status === 'PUBLISHED' && (
            <ShimmerButton
              onClick={() => handleCreateRevision(collection.currentVersionId || undefined)}
              className="inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Chỉnh sửa (Tạo Revision)</span>
            </ShimmerButton>
          )}

          {collection.currentVersion && (
            <a
              href={`#/admin/practice/versions/${collection.currentVersion.id}/preview`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>Xem trước học viên</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {colCodeLabel(collection.code, collection.levelCode)}
              </span>
              <PracticeCategoryBadge category={collection.category} />
              <PracticeStatusBadge status={collection.status} type="collection" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {collection.titleVi}
            </h1>
            <div className="text-lg font-chinese font-bold text-slate-600 dark:text-slate-400">
              {collection.titleZh}{' '}
              {collection.titlePinyin && (
                <span className="text-sm font-sans font-normal text-rose-500">({collection.titlePinyin})</span>
              )}
            </div>
            {collection.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsEditingMetadata(!isEditingMetadata)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer self-start"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingMetadata ? 'Đóng biểu mẫu' : 'Sửa thông tin'}</span>
          </button>
        </div>

        {/* Metadata Edit Form Drawer */}
        {isEditingMetadata && (
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <CollectionForm
              initialValues={{
                levelCode: collection.levelCode,
                code: collection.code,
                category: collection.category,
                titleZh: collection.titleZh,
                titlePinyin: collection.titlePinyin,
                titleVi: collection.titleVi,
                description: collection.description,
                orderIndex: collection.orderIndex,
              }}
              isEdit={true}
              isSubmitting={isUpdating}
              onSubmit={handleUpdateMetadata}
              onCancel={() => setIsEditingMetadata(false)}
            />
          </div>
        )}

        {/* Creator & Reviewer Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400">Người tạo:</div>
            <div className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{collection.creatorName}</div>
          </div>
          <div>
            <div className="text-slate-400">Cập nhật lần cuối:</div>
            <div className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
              {formatDateTime(collection.updatedAt)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Người duyệt (Admin):</div>
            <div className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
              {collection.reviewerName || '—'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Thời gian phát hành:</div>
            <div className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
              {formatDateTime(collection.publishedAt)}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Version History Table */}
      <GlassCard className="p-6 sm:p-8">
        <VersionHistoryPanel
          versions={collection.versions}
          currentVersionId={collection.currentVersionId}
          userRole={user?.role || 'STUDENT'}
          onCreateRevision={(sourceVerId) => handleCreateRevision(sourceVerId)}
          onPreviewVersion={(verId) => {
            window.location.hash = `#/admin/practice/versions/${verId}/preview`;
          }}
        />
      </GlassCard>
    </div>
  );
};

function colCodeLabel(code: string, levelCode: string) {
  return `${levelCode} • ${code}`;
}
