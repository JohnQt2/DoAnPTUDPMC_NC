import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { GlassCard, ShimmerButton } from '../../components/ui';
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
  1: { label: 'Bước 1 / 4', question: 'Trình độ hiện tại của bạn?' },
  2: { label: 'Bước 2 / 4', question: 'Mục tiêu học tập của bạn?' },
  3: { label: 'Bước 3 / 4', question: 'Thời gian dự kiến hoàn thành?' },
  4: { label: 'Bước 4 / 4', question: 'Thời gian học mỗi ngày?' },
};

/** Fixed-slot check indicator — ALWAYS occupies exact 22x22px so clicking NEVER shifts card size or rewraps text! */
const FixedRadioCheck: React.FC<{ selected: boolean }> = ({ selected }) => (
  <span
    aria-hidden="true"
    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200 ${
      selected
        ? 'bg-gradient-to-tr from-primary-600 via-rose-500 to-amber-500 text-white shadow-sm'
        : 'border-2 border-gray-300/80 bg-white/60'
    }`}
  >
    {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
  </span>
);

const OPTION_CARD_BASE =
  'w-full text-left p-4 sm:p-5 rounded-[22px] border-2 transition-[background,border-color,box-shadow] duration-200 cursor-pointer flex items-start justify-between gap-3.5';

const optionCardStyle = (selected: boolean) =>
  selected
    ? 'bg-gradient-to-br from-rose-50/85 via-white/90 to-amber-50/75 border-primary-500 shadow-[0_8px_24px_-6px_rgba(225,29,72,0.18),inset_0_1.5px_1px_rgba(255,255,255,0.95)]'
    : 'bg-white/62 hover:bg-white/85 border-white/85 hover:border-rose-200/80 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.92)]';

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
    <GlassCard className="p-6 sm:p-8 space-y-6 rounded-[28px]">
      {/* Progress Indicator */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {stepInfo.label}
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-gray-900 mt-1">
              {stepInfo.question}
            </h2>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-white/75 border border-white text-xs font-mono font-extrabold text-primary-700 shadow-sm shrink-0">
            {Math.round((surveyStep / 4) * 100)}%
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSurveyStep(s as 1 | 2 | 3 | 4)}
              className="h-2 rounded-full bg-white/65 border border-white/80 overflow-hidden cursor-pointer"
              aria-label={`Bước ${s}`}
            >
              <motion.div
                initial={false}
                animate={{ width: s <= surveyStep ? '100%' : '0%' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Step Content — Smooth Fade Only (Zero Jitter, Fixed Card Heights!) */}
      <motion.div
        key={`survey-step-${surveyStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        {/* STEP 1: Current Level (HSK 1 - 6) */}
        {surveyStep === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {STARTING_LEVEL_OPTIONS.map((item) => {
              const isSelected = startingLevel === item.id;
              const style = HSK_LEVEL_COLORS[item.id] || HSK_LEVEL_COLORS.HSK1;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStartingLevel(item.id)}
                  className={`${OPTION_CARD_BASE} min-h-[112px] ${optionCardStyle(isSelected)}`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.badgeBg} ${style.badgeText} ${style.border}`}
                      >
                        {item.badge}
                      </span>
                      <span className="text-[11px] text-gray-400 font-semibold font-mono">
                        {item.vocabCount}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-display font-bold text-gray-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>
                  <FixedRadioCheck selected={isSelected} />
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2: Target Goal */}
        {surveyStep === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  className={`${OPTION_CARD_BASE} min-h-[114px] ${optionCardStyle(isSelected)}`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.badgeBg} ${style.badgeText} ${style.border}`}
                      >
                        {goal.badge}
                      </span>
                      <span className="text-[11px] text-gray-400 font-semibold font-mono">
                        ~{goal.recommendedWeeks} tuần
                      </span>
                    </div>
                    <h3 className="text-[15px] font-display font-bold text-gray-900 leading-snug">
                      {goal.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {goal.description}
                    </p>
                  </div>
                  <FixedRadioCheck selected={isSelected} />
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 3: Expected Timeline */}
        {surveyStep === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TARGET_TIMELINE_OPTIONS.map((option) => {
              const isSelected = targetWeeks === option.weeks;
              return (
                <button
                  key={option.weeks}
                  type="button"
                  onClick={() => setTargetWeeks(option.weeks)}
                  className={`${OPTION_CARD_BASE} items-center min-h-[88px] ${optionCardStyle(isSelected)}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50/90 text-primary-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-display font-bold text-gray-900">
                        {option.label}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{option.subtitle}</p>
                    </div>
                  </div>
                  <FixedRadioCheck selected={isSelected} />
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 4: Daily Study Time & Reminder */}
        {surveyStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {DAILY_COMMITMENT_OPTIONS.map((item) => {
                const isSelected = dailyCommitmentMins === item.mins;
                return (
                  <button
                    key={item.mins}
                    type="button"
                    onClick={() => setDailyCommitmentMins(item.mins)}
                    className={`text-left p-4 rounded-[22px] border-2 transition-[background,border-color,box-shadow] duration-200 cursor-pointer flex flex-col justify-between gap-3 min-h-[112px] ${optionCardStyle(isSelected)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                      <FixedRadioCheck selected={isSelected} />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-extrabold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.pace}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-white/65 border border-white/85 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
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
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-white/75 flex flex-col sm:flex-row items-center justify-between gap-3">
        {surveyStep > 1 ? (
          <button
            type="button"
            onClick={() => setSurveyStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/70 border border-white/90 hover:bg-white text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isConfirming}
            onClick={onSkipSurvey}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/60 border border-white/85 hover:bg-white text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Bỏ qua khảo sát</span>
          </button>
        )}

        {surveyStep < 4 ? (
          <ShimmerButton
            type="button"
            size="sm"
            onClick={() => setSurveyStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl"
          >
            <span>Tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </ShimmerButton>
        ) : (
          <ShimmerButton
            type="button"
            disabled={isGeneratingPreview}
            onClick={onGeneratePreview}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl"
          >
            <span>{isGeneratingPreview ? 'Đang lưu lộ trình...' : 'Hoàn tất & Vào học'}</span>
            <ArrowRight className="w-4 h-4" />
          </ShimmerButton>
        )}
      </div>
    </GlassCard>
  );
};
