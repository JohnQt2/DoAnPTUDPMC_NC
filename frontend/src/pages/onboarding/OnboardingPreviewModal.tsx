import React from 'react';
import {
  CheckCircle2,
  Calendar,
  BookOpen,
  Play,
  Edit3,
} from 'lucide-react';
import {
  RoadmapPreviewData,
  HSK_LEVEL_COLORS,
  STARTING_LEVEL_OPTIONS,
} from './onboarding.constants';

interface OnboardingPreviewModalProps {
  previewData: RoadmapPreviewData;
  startingLevel: string;
  targetGoal: string;
  targetWeeks: number;
  dailyCommitmentMins: number;
  isConfirming: boolean;
  onEditSurvey: () => void;
  onConfirmRoadmap: () => void;
}

export const OnboardingPreviewModal: React.FC<OnboardingPreviewModalProps> = ({
  previewData,
  startingLevel,
  targetGoal,
  targetWeeks,
  dailyCommitmentMins,
  isConfirming,
  onEditSurvey,
  onConfirmRoadmap,
}) => {
  const levelStyle =
    HSK_LEVEL_COLORS[previewData.recommendedCourse.level] || HSK_LEVEL_COLORS.HSK1;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelStyle.badgeBg} ${levelStyle.badgeText} ${levelStyle.border}`}
              >
                {previewData.recommendedCourse.level}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                Lộ trình đề xuất
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {previewData.recommendedCourse.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {previewData.summaryMessage}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-[11px] font-semibold text-gray-500">Dự kiến</span>
              <p className="text-lg font-extrabold text-gray-900 mt-0.5">
                {previewData.estimatedWeeks} tuần
              </p>
              <span className="text-[10px] text-gray-400">~{previewData.estimatedDays} ngày</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-[11px] font-semibold text-gray-500">Mỗi ngày</span>
              <p className="text-lg font-extrabold text-primary-600 mt-0.5">
                {previewData.dailyCommitmentMins} phút
              </p>
              <span className="text-[10px] text-gray-400">{previewData.studyPace}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-[11px] font-semibold text-gray-500">Tổng số bài</span>
              <p className="text-lg font-extrabold text-gray-900 mt-0.5">
                {previewData.recommendedCourse.totalLessons} bài
              </p>
              <span className="text-[10px] text-gray-400">
                {previewData.recommendedCourse.totalEstimatedMinutes} phút
              </span>
            </div>
          </div>
        </div>

        {/* Selected Survey Tags */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200">
            Đầu vào:{' '}
            <strong className="text-gray-900">
              {STARTING_LEVEL_OPTIONS.find((o) => o.id === startingLevel)?.title || startingLevel}
            </strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200">
            Mục tiêu: <strong className="text-gray-900">{targetGoal}</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200">
            Thời gian: <strong className="text-gray-900">{targetWeeks} tuần</strong> ({dailyCommitmentMins} phút/ngày)
          </span>
        </div>
      </div>

      {/* Weekly Milestones */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Kế hoạch học theo tuần ({previewData.weeklyMilestones.length} tuần)
          </h3>
          <span className="text-xs text-gray-400">Đạt ≥ 80% bài kiểm tra để mở bài tiếp theo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewData.weeklyMilestones.map((milestone) => (
            <div
              key={milestone.week}
              className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                  {milestone.title}
                </span>
                <span className="text-xs text-gray-500">
                  {milestone.totalLessons} bài • {milestone.estimatedMinutes} phút
                </span>
              </div>

              <div className="space-y-1.5">
                {milestone.lessons.map((ls) => {
                  const isRecommendedFirst = previewData.recommendedFirstLessonId === ls.lessonId;
                  return (
                    <div
                      key={ls.lessonId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isRecommendedFirst
                          ? 'bg-primary-50/60 border-primary-200 text-gray-900 font-semibold'
                          : 'bg-white border-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 text-primary-600" />
                        <span className="truncate">{ls.title}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {isRecommendedFirst ? 'Bài đầu tiên' : `${ls.estimatedDurationMins}p`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <button
          type="button"
          onClick={onEditSurvey}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-gray-500" />
          <span>Chỉnh sửa mục tiêu</span>
        </button>

        <button
          type="button"
          disabled={isConfirming}
          onClick={onConfirmRoadmap}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isConfirming ? 'Đang lưu lộ trình...' : 'Đồng ý & Mở bài học đầu tiên'}
          </span>
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
