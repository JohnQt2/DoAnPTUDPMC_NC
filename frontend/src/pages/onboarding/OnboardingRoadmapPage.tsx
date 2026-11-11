import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  CheckCircle2,
  Play,
  Unlock,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  StartingLevel,
  TargetGoal,
  RoadmapPreviewData,
} from './onboarding.constants';
import { OnboardingSurveyForm } from './OnboardingSurveyForm';
import { OnboardingPreviewModal } from './OnboardingPreviewModal';

export const OnboardingRoadmapPage: React.FC = () => {
  const [mode, setMode] = useState<'survey' | 'preview' | 'active_roadmap'>('survey');
  const [surveyStep, setSurveyStep] = useState<1 | 2 | 3 | 4>(1);

  const [startingLevel, setStartingLevel] = useState<StartingLevel>('ZERO');
  const [targetGoal, setTargetGoal] = useState<TargetGoal>('HSK1');
  const [targetWeeks, setTargetWeeks] = useState<number>(8);
  const [dailyCommitmentMins, setDailyCommitmentMins] = useState<number>(30);
  const [reminderTime, setReminderTime] = useState<string>('20:00');

  const [previewData, setPreviewData] = useState<RoadmapPreviewData | null>(null);
  const [activeRoadmapData, setActiveRoadmapData] = useState<any | null>(null);
  const [progressData, setProgressData] = useState<any | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkExistingRoadmap();
  }, []);

  const checkExistingRoadmap = async () => {
    setIsLoadingInitial(true);
    try {
      const rawHash = window.location.hash || '';
      const forceSurvey = rawHash.includes('mode=survey');

      const [roadmapRes, progressRes] = await Promise.all([
        api.get<any>('/users/roadmap').catch(() => null),
        api.get<any>('/users/me/progress').catch(() => null),
      ]);

      if (roadmapRes && roadmapRes.roadmap && !forceSurvey) {
        setActiveRoadmapData(roadmapRes);
        setProgressData(progressRes);
        setStartingLevel((roadmapRes.roadmap.starting_level as StartingLevel) || 'ZERO');
        setTargetGoal((roadmapRes.roadmap.target_goal as TargetGoal) || 'HSK1');
        setDailyCommitmentMins(roadmapRes.roadmap.daily_commitment_mins || 30);
        setMode('active_roadmap');
      } else {
        setMode('survey');
      }
    } catch {
      setMode('survey');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    setErrorMsg(null);
    try {
      const preview = await api.post<RoadmapPreviewData>('/users/onboarding/preview', {
        starting_level: startingLevel,
        target_goal: targetGoal,
        daily_commitment_mins: dailyCommitmentMins,
        target_weeks: targetWeeks,
        reminder_time: reminderTime,
      });
      setPreviewData(preview);
      setMode('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tạo lộ trình đề xuất. Vui lòng thử lại.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleConfirmRoadmap = async (openFirstLessonImmediately = true) => {
    setIsConfirming(true);
    setErrorMsg(null);
    try {
      const res = await api.post<any>('/users/onboarding', {
        starting_level: startingLevel,
        target_goal: targetGoal,
        daily_commitment_mins: dailyCommitmentMins,
        target_weeks: targetWeeks,
        reminder_time: reminderTime,
      });

      const firstLessonId =
        res?.recommendedFirstLessonId ||
        previewData?.recommendedFirstLessonId ||
        1;

      if (openFirstLessonImmediately && firstLessonId) {
        window.location.hash = `#/lessons/${firstLessonId}`;
        return;
      }

      await checkExistingRoadmap();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu lộ trình cá nhân. Vui lòng thử lại.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSkipSurvey = async () => {
    setIsConfirming(true);
    setErrorMsg(null);
    try {
      const res = await api.post<any>('/users/onboarding', {
        starting_level: 'ZERO',
        target_goal: 'HSK1',
        daily_commitment_mins: 15,
        reminder_time: '20:00',
      });
      const firstLessonId = res?.recommendedFirstLessonId || 1;
      window.location.hash = `#/lessons/${firstLessonId}`;
    } catch {
      window.location.hash = '#/courses';
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <p className="text-sm font-semibold text-gray-500">Đang tải lộ trình học...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {mode === 'survey' && 'Thiết Lập Lộ Trình Học'}
            {mode === 'preview' && 'Lộ Trình Học Đề Xuất'}
            {mode === 'active_roadmap' && 'Lộ Trình Học Của Bạn'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {mode === 'survey' && 'Chọn trình độ, mục tiêu và thời gian học phù hợp với bạn'}
            {mode === 'preview' && 'Kiểm tra lộ trình đề xuất hoặc chỉnh sửa lại mục tiêu trước khi bắt đầu'}
            {mode === 'active_roadmap' && 'Theo dõi tiến độ và học tiếp các bài trong lộ trình'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* MODE 1: SURVEY */}
      {mode === 'survey' && (
        <OnboardingSurveyForm
          surveyStep={surveyStep}
          setSurveyStep={setSurveyStep}
          startingLevel={startingLevel}
          setStartingLevel={setStartingLevel}
          targetGoal={targetGoal}
          setTargetGoal={setTargetGoal}
          targetWeeks={targetWeeks}
          setTargetWeeks={setTargetWeeks}
          dailyCommitmentMins={dailyCommitmentMins}
          setDailyCommitmentMins={setDailyCommitmentMins}
          reminderTime={reminderTime}
          setReminderTime={setReminderTime}
          isGeneratingPreview={isGeneratingPreview}
          isConfirming={isConfirming}
          onGeneratePreview={handleGeneratePreview}
          onSkipSurvey={handleSkipSurvey}
        />
      )}

      {/* MODE 2: PREVIEW */}
      {mode === 'preview' && previewData && (
        <OnboardingPreviewModal
          previewData={previewData}
          startingLevel={startingLevel}
          targetGoal={targetGoal}
          targetWeeks={targetWeeks}
          dailyCommitmentMins={dailyCommitmentMins}
          isConfirming={isConfirming}
          onEditSurvey={() => {
            setMode('survey');
            setSurveyStep(1);
          }}
          onConfirmRoadmap={() => handleConfirmRoadmap(true)}
        />
      )}

      {/* MODE 3: ACTIVE ROADMAP */}
      {mode === 'active_roadmap' && activeRoadmapData && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đang theo học
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                    Mục tiêu: {activeRoadmapData.roadmap.target_goal}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                    {activeRoadmapData.roadmap.daily_commitment_mins} phút/ngày
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {activeRoadmapData.recommendedCourse?.title || 'Khóa Học HSK Cá Nhân Hóa'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {activeRoadmapData.summaryMessage}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {progressData?.next_recommended_lesson && (
                  <a
                    href={`#/lessons/${progressData.next_recommended_lesson.lesson_id}`}
                    className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Học tiếp: {progressData.next_recommended_lesson.title}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMode('survey');
                    setSurveyStep(1);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                  <span>Đổi mục tiêu</span>
                </button>
              </div>
            </div>

            {progressData?.course_progress && (
              <div className="pt-4 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-500">
                    Tiến độ ({progressData.course_progress.completed_lessons}/
                    {progressData.course_progress.total_lessons} bài)
                  </span>
                  <span className="text-primary-600">
                    {progressData.course_progress.completion_percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, progressData.course_progress.completion_percentage || 0)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {Array.isArray(activeRoadmapData.weeklyMilestones) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRoadmapData.weeklyMilestones.map((milestone: any) => (
                <div
                  key={milestone.week}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold">
                      {milestone.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {milestone.totalLessons} bài • {milestone.estimatedMinutes} phút
                    </span>
                  </div>

                  <div className="space-y-2">
                    {milestone.lessons.map((ls: any) => {
                      const isUnlocked =
                        activeRoadmapData.initiallyUnlockedLessonIds?.includes(ls.lessonId) ||
                        ls.lessonId === 1;
                      return (
                        <a
                          key={ls.lessonId}
                          href={`#/lessons/${ls.lessonId}`}
                          className="p-3 rounded-xl bg-gray-50 hover:bg-primary-50/50 border border-gray-100 hover:border-primary-200 flex items-center justify-between gap-2 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isUnlocked ? (
                              <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-gray-800 group-hover:text-primary-700 truncate">
                              {ls.title}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-primary-600 shrink-0">
                            Học
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
