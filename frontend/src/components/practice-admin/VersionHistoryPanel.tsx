import React from 'react';
import { History, Eye, Edit3, Plus, ArrowUpRight } from 'lucide-react';
import { PracticeAdminVersionSummary } from '../../pages/admin/practice/practice-admin.types';
import { PracticeStatusBadge } from './PracticeStatusBadge';
import { formatDateTime } from '../../pages/admin/practice/practice-admin.utils';

interface VersionHistoryPanelProps {
  versions: PracticeAdminVersionSummary[];
  currentVersionId?: number | null;
  userRole: 'ADMIN' | 'CONTENT_EDITOR' | 'STUDENT';
  onCreateRevision?: (sourceVersionId: number) => void;
  onPreviewVersion?: (versionId: number) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  versions,
  currentVersionId,
  userRole,
  onCreateRevision,
  onPreviewVersion,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-rose-500" />
          <span>Lịch sử các phiên bản ({versions.length})</span>
        </h3>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Người tạo</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3">Phát hành</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {versions.map((v) => {
              const isCurrent = v.id === currentVersionId;
              const isEditable = v.status === 'DRAFT' || v.status === 'REVISION_REQUIRED';

              return (
                <tr
                  key={v.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                    isCurrent ? 'bg-emerald-500/[0.04]' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                      <span>Phiên bản {v.versionNumber}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    {v.changeSummary && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{v.changeSummary}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PracticeStatusBadge status={v.status} type="version" size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{v.creatorName}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(v.updatedAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(v.publishedAt)}</td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    {onPreviewVersion && (
                      <button
                        type="button"
                        onClick={() => onPreviewVersion(v.id)}
                        title="Xem trước"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {isEditable ? (
                      <a
                        href={`#/admin/practice/versions/${v.id}/edit`}
                        title="Chỉnh sửa bản nháp"
                        className="inline-flex p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </a>
                    ) : (
                      onCreateRevision && (
                        <button
                          type="button"
                          onClick={() => onCreateRevision(v.id)}
                          title="Tạo revision mới từ phiên bản này"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tạo Revision</span>
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
