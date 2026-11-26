import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { practiceAdminApi } from './practice-admin.api';
import { CollectionForm } from '../../../components/practice-admin/CollectionForm';
import { GlassCard } from '../../../components/ui';
import { appNotice } from '../../../lib/dialog';
import { extractErrorMessage } from './practice-admin.utils';

export const PracticeCollectionCreatePage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const res = await practiceAdminApi.createCollection(values);
      appNotice('Đã tạo bản nháp và khởi tạo Version 1. Hãy thêm phần bài tập đầu tiên.', 'success');

      // Chuyển thẳng tới trang soạn thảo phiên bản vừa tạo
      const versionId = res.initialVersion?.id;
      if (versionId) {
        window.location.hash = `#/admin/practice/versions/${versionId}/edit?start=1`;
      } else {
        window.location.hash = `#/admin/practice/${res.collection.id}`;
      }
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <a
          href="#/admin/practice"
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
            Tạo bộ đề / Bài luyện tập mới
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Khởi tạo bài học mới cho Sách bài tập hoặc bộ đề thi thử HSK
          </p>
        </div>
      </div>

      <GlassCard className="p-6 sm:p-8">
        <CollectionForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            window.location.hash = '#/admin/practice';
          }}
        />
      </GlassCard>
    </div>
  );
};
