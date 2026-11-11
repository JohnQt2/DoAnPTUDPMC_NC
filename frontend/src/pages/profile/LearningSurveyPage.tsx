import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    Clock,
    Loader2,
    Save,
    Sparkles,
    Target,
} from 'lucide-react';

import { api } from '../../lib/api';

type CurrentLevel =
    | 'ZERO'
    | 'HSK1'
    | 'HSK2'
    | 'HSK3'
    | 'HSK4'
    | 'HSK5'
    | 'HSK6';

type TargetGoal =
    | 'HSK1'
    | 'HSK2'
    | 'HSK3'
    | 'HSK4'
    | 'HSK5'
    | 'HSK6'
    | 'COMMUNICATION'
    | 'HOBBY';

type LearningPurpose =
    | 'EXAM'
    | 'COMMUNICATION'
    | 'WORK'
    | 'TRAVEL'
    | 'STUDY_ABROAD'
    | 'HOBBY';

type PreferredSkill =
    | 'LISTENING'
    | 'SPEAKING'
    | 'READING'
    | 'WRITING'
    | 'PINYIN'
    | 'HANZI';

interface LearningSurveyResponse {
    surveyId: number;
    currentLevel: CurrentLevel;
    targetGoal: TargetGoal;
    expectedDurationMonths: number;
    dailyAvailableMinutes: number;
    learningPurposes: LearningPurpose[];
    preferredSkills: PreferredSkill[];
    createdAt?: string;
    updatedAt?: string;
}

interface SaveLearningSurveyResponse {
    message?: string;
    survey?: LearningSurveyResponse;
}

const currentLevelOptions: Array<{
    value: CurrentLevel;
    label: string;
}> = [
        {
            value: 'ZERO',
            label: 'Mới bắt đầu',
        },
        {
            value: 'HSK1',
            label: 'HSK 1',
        },
        {
            value: 'HSK2',
            label: 'HSK 2',
        },
        {
            value: 'HSK3',
            label: 'HSK 3',
        },
        {
            value: 'HSK4',
            label: 'HSK 4',
        },
        {
            value: 'HSK5',
            label: 'HSK 5',
        },
        {
            value: 'HSK6',
            label: 'HSK 6',
        },
    ];

const targetGoalOptions: Array<{
    value: TargetGoal;
    label: string;
}> = [
        {
            value: 'HSK1',
            label: 'Đạt HSK 1',
        },
        {
            value: 'HSK2',
            label: 'Đạt HSK 2',
        },
        {
            value: 'HSK3',
            label: 'Đạt HSK 3',
        },
        {
            value: 'HSK4',
            label: 'Đạt HSK 4',
        },
        {
            value: 'HSK5',
            label: 'Đạt HSK 5',
        },
        {
            value: 'HSK6',
            label: 'Đạt HSK 6',
        },
        {
            value: 'COMMUNICATION',
            label: 'Giao tiếp đời sống',
        },
        {
            value: 'HOBBY',
            label: 'Học theo sở thích',
        },
    ];

const learningPurposeOptions: Array<{
    value: LearningPurpose;
    label: string;
    description: string;
}> = [
        {
            value: 'EXAM',
            label: 'Thi chứng chỉ HSK',
            description:
                'Chuẩn bị cho kỳ thi năng lực tiếng Trung.',
        },
        {
            value: 'COMMUNICATION',
            label: 'Giao tiếp',
            description:
                'Sử dụng tiếng Trung trong đời sống.',
        },
        {
            value: 'WORK',
            label: 'Công việc',
            description:
                'Phục vụ nghề nghiệp và môi trường làm việc.',
        },
        {
            value: 'TRAVEL',
            label: 'Du lịch',
            description:
                'Giao tiếp cơ bản khi đi du lịch.',
        },
        {
            value: 'STUDY_ABROAD',
            label: 'Du học',
            description:
                'Chuẩn bị ngôn ngữ để học tập ở nước ngoài.',
        },
        {
            value: 'HOBBY',
            label: 'Sở thích',
            description:
                'Học tiếng Trung vì yêu thích.',
        },
    ];

const preferredSkillOptions: Array<{
    value: PreferredSkill;
    label: string;
}> = [
        {
            value: 'LISTENING',
            label: 'Nghe',
        },
        {
            value: 'SPEAKING',
            label: 'Nói',
        },
        {
            value: 'READING',
            label: 'Đọc',
        },
        {
            value: 'WRITING',
            label: 'Viết',
        },
        {
            value: 'PINYIN',
            label: 'Pinyin và thanh điệu',
        },
        {
            value: 'HANZI',
            label: 'Chữ Hán',
        },
    ];

const dailyMinuteOptions = [
    10,
    15,
    20,
    30,
    45,
    60,
];

function getErrorMessage(
    error: unknown
): string {
    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
    ) {
        return error.message;
    }

    return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export const LearningSurveyPage:
    React.FC = () => {
        const [
            currentLevel,
            setCurrentLevel,
        ] = useState<CurrentLevel>('ZERO');

        const [
            targetGoal,
            setTargetGoal,
        ] = useState<TargetGoal>('HSK1');

        const [
            expectedDurationMonths,
            setExpectedDurationMonths,
        ] = useState<number>(6);

        const [
            dailyAvailableMinutes,
            setDailyAvailableMinutes,
        ] = useState<number>(30);

        const [
            learningPurposes,
            setLearningPurposes,
        ] = useState<LearningPurpose[]>([]);

        const [
            preferredSkills,
            setPreferredSkills,
        ] = useState<PreferredSkill[]>([]);

        const [
            surveyId,
            setSurveyId,
        ] = useState<number | null>(null);

        const [
            isLoading,
            setIsLoading,
        ] = useState(true);

        const [
            isSaving,
            setIsSaving,
        ] = useState(false);

        /*
         * Khóa đồng bộ dùng để chặn nhiều lần submit
         * trước khi React kịp cập nhật state isSaving.
         */
        const isSavingRef = useRef(false);

        const [
            errorMessage,
            setErrorMessage,
        ] = useState<string | null>(null);

        const [
            successMessage,
            setSuccessMessage,
        ] = useState<string | null>(null);

        const loadSurvey = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const data =
                    await api.get<
                        LearningSurveyResponse | null
                    >('/users/me/learning-survey');

                if (!data) {
                    setSurveyId(null);
                    return;
                }

                setSurveyId(data.surveyId);

                setCurrentLevel(
                    data.currentLevel ?? 'ZERO'
                );

                setTargetGoal(
                    data.targetGoal ?? 'HSK1'
                );

                setExpectedDurationMonths(
                    data.expectedDurationMonths ?? 6
                );

                setDailyAvailableMinutes(
                    data.dailyAvailableMinutes ?? 30
                );

                setLearningPurposes(
                    data.learningPurposes ?? []
                );

                setPreferredSkills(
                    data.preferredSkills ?? []
                );
            } catch (error) {
                setErrorMessage(
                    getErrorMessage(error)
                );
            } finally {
                setIsLoading(false);
            }
        };

        useEffect(() => {
            void loadSurvey();
        }, []);

        const toggleLearningPurpose = (
            purpose: LearningPurpose
        ) => {
            setSuccessMessage(null);

            setLearningPurposes((current) =>
                current.includes(purpose)
                    ? current.filter(
                        (item) => item !== purpose
                    )
                    : [...current, purpose]
            );
        };

        const togglePreferredSkill = (
            skill: PreferredSkill
        ) => {
            setSuccessMessage(null);

            setPreferredSkills((current) =>
                current.includes(skill)
                    ? current.filter(
                        (item) => item !== skill
                    )
                    : [...current, skill]
            );
        };

        const validateForm =
            (): string | null => {
                if (
                    !Number.isInteger(
                        expectedDurationMonths
                    ) ||
                    expectedDurationMonths < 1 ||
                    expectedDurationMonths > 36
                ) {
                    return 'Thời gian dự kiến phải là số nguyên từ 1 đến 36 tháng.';
                }

                if (
                    !Number.isInteger(
                        dailyAvailableMinutes
                    ) ||
                    dailyAvailableMinutes < 5 ||
                    dailyAvailableMinutes > 240
                ) {
                    return 'Thời gian học phải là số nguyên từ 5 đến 240 phút mỗi ngày.';
                }

                if (
                    learningPurposes.length === 0
                ) {
                    return 'Vui lòng chọn ít nhất một mục đích học.';
                }

                if (
                    currentLevel !== 'ZERO' &&
                    targetGoal.startsWith('HSK')
                ) {
                    const currentNumber = Number(
                        currentLevel.replace(
                            'HSK',
                            ''
                        )
                    );

                    const targetNumber = Number(
                        targetGoal.replace(
                            'HSK',
                            ''
                        )
                    );

                    if (
                        targetNumber <= currentNumber
                    ) {
                        return 'Mục tiêu HSK phải cao hơn trình độ hiện tại.';
                    }
                }

                return null;
            };

        const handleSubmit = async (
            event:
                React.FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (isSavingRef.current) {
                return;
            }

            setErrorMessage(null);
            setSuccessMessage(null);

            const validationMessage =
                validateForm();

            if (validationMessage) {
                setErrorMessage(
                    validationMessage
                );
                return;
            }

            isSavingRef.current = true;
            setIsSaving(true);

            try {
                const result =
                    await api.put<
                        SaveLearningSurveyResponse
                    >('/users/me/learning-survey', {
                        current_level:
                            currentLevel,

                        target_goal:
                            targetGoal,

                        expected_duration_months:
                            expectedDurationMonths,

                        daily_available_minutes:
                            dailyAvailableMinutes,

                        learning_purposes:
                            learningPurposes,

                        preferred_skills:
                            preferredSkills,
                    });

                if (result.survey) {
                    setSurveyId(
                        result.survey.surveyId
                    );
                }

                setSuccessMessage(
                    result.message ??
                    'Đã lưu khảo sát nhu cầu học thành công.'
                );
            } catch (error) {
                setErrorMessage(
                    getErrorMessage(error)
                );
            } finally {
                isSavingRef.current = false;
                setIsSaving(false);
            }
        };

        if (isLoading) {
            return (
                <div className="min-h-[70vh] flex items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />

                        <p className="text-sm font-medium">
                            Đang tải khảo sát học tập...
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Tiêu đề */}
                <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-500 p-6 sm:p-8 text-white shadow-lg shadow-primary-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                            <Sparkles className="w-7 h-7" />
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Khảo sát nhu cầu học tập
                            </h1>

                            <p className="mt-2 text-sm text-white/80 max-w-2xl">
                                Cung cấp mục tiêu và quỹ
                                thời gian để hệ thống xây
                                dựng lộ trình học tiếng
                                Trung phù hợp.
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    id="learning-survey-form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-6"
                >
                    {/* Trình độ và mục tiêu */}
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <Target className="w-5 h-5 text-primary-600" />

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Trình độ và mục tiêu
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Cho biết điểm xuất phát
                                    và kết quả bạn muốn đạt
                                    được.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label
                                    htmlFor="current-level"
                                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                                >
                                    Trình độ hiện tại
                                </label>

                                <select
                                    id="current-level"
                                    value={currentLevel}
                                    onChange={(event) => {
                                        setCurrentLevel(
                                            event.target
                                                .value as CurrentLevel
                                        );

                                        setSuccessMessage(null);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {currentLevelOptions.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="target-goal"
                                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                                >
                                    Mục tiêu học tập
                                </label>

                                <select
                                    id="target-goal"
                                    value={targetGoal}
                                    onChange={(event) => {
                                        setTargetGoal(
                                            event.target
                                                .value as TargetGoal
                                        );

                                        setSuccessMessage(null);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {targetGoalOptions.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Thời gian học */}
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <Clock className="w-5 h-5 text-primary-600" />

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Thời gian học
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Xác định thời hạn và thời
                                    lượng có thể học mỗi ngày.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label
                                    htmlFor="duration-months"
                                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                                >
                                    Thời gian dự kiến
                                </label>

                                <div className="relative">
                                    <input
                                        id="duration-months"
                                        type="number"
                                        min={1}
                                        max={36}
                                        step={1}
                                        value={
                                            expectedDurationMonths
                                        }
                                        onChange={(event) => {
                                            setExpectedDurationMonths(
                                                Number(
                                                    event.target.value
                                                )
                                            );

                                            setSuccessMessage(null);
                                        }}
                                        className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />

                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                        tháng
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mt-2">
                                    Giá trị hợp lệ từ 1 đến
                                    36 tháng.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="daily-minutes"
                                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                                >
                                    Thời gian mỗi ngày
                                </label>

                                <select
                                    id="daily-minutes"
                                    value={
                                        dailyAvailableMinutes
                                    }
                                    onChange={(event) => {
                                        setDailyAvailableMinutes(
                                            Number(
                                                event.target.value
                                            )
                                        );

                                        setSuccessMessage(null);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {dailyMinuteOptions.map(
                                        (minutes) => (
                                            <option
                                                key={minutes}
                                                value={minutes}
                                            >
                                                {minutes} phút mỗi
                                                ngày
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Mục đích học */}
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <BookOpen className="w-5 h-5 text-primary-600" />

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Mục đích học
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Chọn ít nhất một mục đích
                                    phù hợp với nhu cầu của
                                    bạn.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {learningPurposeOptions.map(
                                (option) => {
                                    const isSelected =
                                        learningPurposes.includes(
                                            option.value
                                        );

                                    return (
                                        <label
                                            key={option.value}
                                            className={[
                                                'flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all',
                                                isSelected
                                                    ? 'border-primary-400 bg-primary-50'
                                                    : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50',
                                            ].join(' ')}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    toggleLearningPurpose(
                                                        option.value
                                                    )
                                                }
                                                className="mt-1 w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                                            />

                                            <span>
                                                <span className="block text-sm font-bold text-gray-900">
                                                    {option.label}
                                                </span>

                                                <span className="block text-xs text-gray-500 mt-1">
                                                    {
                                                        option.description
                                                    }
                                                </span>
                                            </span>
                                        </label>
                                    );
                                }
                            )}
                        </div>
                    </section>

                    {/* Kỹ năng ưu tiên */}
                    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Kỹ năng muốn ưu tiên
                            </h2>

                            <p className="text-xs text-gray-500 mt-1">
                                Có thể chọn nhiều kỹ năng
                                hoặc để trống nếu muốn học
                                cân bằng.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {preferredSkillOptions.map(
                                (option) => {
                                    const isSelected =
                                        preferredSkills.includes(
                                            option.value
                                        );

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            aria-pressed={
                                                isSelected
                                            }
                                            onClick={() =>
                                                togglePreferredSkill(
                                                    option.value
                                                )
                                            }
                                            className={[
                                                'px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:text-primary-700',
                                            ].join(' ')}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </section>

                    {/* Thông báo kết quả */}
                    <div
                        aria-live="polite"
                        className="space-y-3"
                    >
                        {errorMessage && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700"
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />

                                <span className="text-sm font-semibold">
                                    {errorMessage}
                                </span>
                            </div>
                        )}

                        {successMessage && (
                            <div
                                role="status"
                                className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />

                                <span className="text-sm font-semibold">
                                    {successMessage}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Nút lưu */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-xs text-gray-500">
                            {surveyId
                                ? `Đang chỉnh sửa khảo sát số ${surveyId}.`
                                : 'Bạn chưa lưu khảo sát trên tài khoản này.'}
                        </p>

                        <button
                            type="submit"
                            form="learning-survey-form"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-md shadow-primary-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />

                                    {surveyId
                                        ? 'Cập nhật khảo sát'
                                        : 'Lưu khảo sát'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };