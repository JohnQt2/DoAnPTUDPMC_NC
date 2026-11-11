import React from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  SkipForward,
} from 'lucide-react';
import {
  StartingLevel,
  TargetGoal,
  HSK_LEVEL_COLORS,
  STARTING_LEVEL_OPTIONS,
  TARGET_GOAL_OPTIONS,
  TARGET_TIMELINE_OPTIONS,
  DAILY_COMMITMENT_OPTIONS,
} from './onboarding.constants';

interface OnboardingSurveyFormProps {
  surveyStep: 1 | 2 | 3 | 4;
  setSurveyStep: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>;
  startingLevel: StartingLevel;
  setStartingLevel: (level: StartingLevel) => void;
  targetGoal: TargetGoal;
  setTargetGoal: (goal: TargetGoal) => void;
  targetWeeks: number;
  setTargetWeeks: (weeks: number) => void;
  dailyCommitmentMins: number;
  setDailyCommitmentMins: (mins: number) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
  isGeneratingPreview: boolean;
  isConfirming: boolean;
  onGeneratePreview: () => void;
  onSkipSurvey: () => void;
}

const STEP_TITLES: Record<number, { label: string; question: string }> = {
  1: { label: 'Bước 1/4', question: 'Trình độ hiện tại của bạn?' },
  2: { label: 'Bước 2/4', question: 'Mục tiêu học tập của bạn?' },
  3: { label: 'Bước 3/4', question: 'Thời gian dự kiến hoàn thành?' },
  4: { label: 'Bước 4/4', question: 'Thời gian học mỗi ngày?' },
};

export const OnboardingSurveyForm: React.FC<OnboardingSurveyFormProps> = ({
  surveyStep,
  setSurveyStep,
  startingLevel,
  setStartingLevel,
  targetGoal,
  setTargetGoal,
  targetWeeks,
  setTargetWeeks,
  dailyCommitmentMins,
  setDailyCommitmentMins,
  reminderTime,
  setReminderTime,
  isGeneratingPreview,
  isConfirming,
  onGeneratePreview,
  onSkipSurvey,
}) => {
  const stepInfo = STEP_TITLES[surveyStep];

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
              {stepInfo.label}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5">
              {stepInfo.question}
            </h2>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {Math.round((surveyStep / 4) * 100)}%
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSurveyStep(s as 1 | 2 | 3 | 4)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                s <= surveyStep ? 'bg-primary-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label={`Bước ${s}`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Current Level (HSK 1 - 6) */}
      {surveyStep === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STARTING_LEVEL_OPTIONS.map((item) => {
            const isSelected = startingLevel === item.id;
            const style = HSK_LEVEL_COLORS[item.id] || HSK_LEVEL_COLORS.HSK1;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStartingLevel(item.id)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-primary-50/50 border-primary-600 ring-2 ring-primary-600/15'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.badgeBg} ${style.badgeText} ${style.border}`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">{item.vocabCount}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.subtitle}</p>
                </div>

                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 2: Target Goal (HSK 1 - 6 / Communication / Hobby) */}
      {surveyStep === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TARGET_GOAL_OPTIONS.map((goal) => {
            const isSelected = targetGoal === goal.id;
            const style = HSK_LEVEL_COLORS[goal.id] || HSK_LEVEL_COLORS.HSK1;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => {
                  setTargetGoal(goal.id);
                  setTargetWeeks(goal.recommendedWeeks);
                }}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-primary-50/50 border-primary-600 ring-2 ring-primary-600/15'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.badgeBg} ${style.badgeText} ${style.border}`}
                    >
                      {goal.badge}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      ~{goal.recommendedWeeks} tuần
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{goal.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{goal.description}</p>
                </div>

                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 3: Expected Timeline */}
      {surveyStep === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TARGET_TIMELINE_OPTIONS.map((option) => {
            const isSelected = targetWeeks === option.weeks;
            return (
              <button
                key={option.weeks}
                type="button"
                onClick={() => setTargetWeeks(option.weeks)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-primary-50/50 border-primary-600 ring-2 ring-primary-600/15'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{option.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{option.subtitle}</p>
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 4: Daily Study Time & Reminder */}
      {surveyStep === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DAILY_COMMITMENT_OPTIONS.map((item) => {
              const isSelected = dailyCommitmentMins === item.mins;
              return (
                <button
                  key={item.mins}
                  type="button"
                  onClick={() => setDailyCommitmentMins(item.mins)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-primary-50/50 border-primary-600 ring-2 ring-primary-600/15'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                      {item.tag}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">{item.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.pace}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Giờ nhắc học hằng ngày</h4>
                <p className="text-xs text-gray-500">Gửi thông báo nhắc học đúng giờ</p>
              </div>
            </div>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              aria-label="Giờ nhắc học hằng ngày"
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {surveyStep > 1 ? (
          <button
            type="button"
            onClick={() => setSurveyStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isConfirming}
            onClick={onSkipSurvey}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Bỏ qua khảo sát</span>
          </button>
        )}

        {surveyStep < 4 ? (
          <button
            type="button"
            onClick={() => setSurveyStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isGeneratingPreview}
            onClick={onGeneratePreview}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isGeneratingPreview ? 'Đang tạo lộ trình...' : 'Xem lộ trình đề xuất'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
