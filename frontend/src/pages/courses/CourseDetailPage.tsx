import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { GlassCard, ShimmerButton, NumberTicker } from '../../components/ui';
import {
  BookOpen,
  CheckCircle2,
  Play,
  FileQuestion,
  Clock,
  ArrowLeft,
  Award,
  Volume2,
  Search,
  Target,
  FileText,
  Route,
  ChevronRight,
} from 'lucide-react';

interface LessonProgressItem {
  lessonId: number;
  title: string;
  orderIndex: number;
  estimatedDurationMins: number;
  vocabulariesCount?: number;
  testsCount?: number;
  isUnlocked?: boolean;
  isCompleted?: boolean;
  highestScore?: number;
}

interface ChapterItem {
  chapterId: number;
  title: string;
  orderIndex: number;
  lessons: LessonProgressItem[];
}

interface CourseDetailData {
  courseId: number;
  title: string;
  code: string;
  description: string | null;
  level: string;
  chapters: ChapterItem[];
}

interface VocabEntry {
  vocabularyId: string;
  word: string;
  pinyin: string;
  meaning: string;
  wordType: string | null;
  notes?: { sinoVietnamese?: string } | null;
}

interface ExamSummary {
  testId: number;
  title: string;
  testType: string;
  level: string;
  questionsCount: number;
  timeLimitMins: number;
  passingScore: number;
  userBestScore: number | null;
}

const HSK_OUTCOMES: Record<string, { targetVocab: string; outcomes: string[] }> = {
  HSK1: {
    targetVocab: '150 từ cốt lõi',
    outcomes: [
      'Nắm vững 21 thanh mẫu, 24 vận mẫu và phát âm chuẩn 4 thanh điệu tiếng Trung.',
      'Chào hỏi, giới thiệu bản thân, hỏi tên, quốc tịch, thời gian và mua sắm cơ bản.',
      'Nhận mặt và tập viết các bộ thủ, chữ Hán nền tảng đúng thứ tự nét.',
    ],
  },
  HSK2: {
    targetVocab: '300 từ giao tiếp',
    outcomes: [
      'Giao tiếp trôi chảy các tình huống đời sống: ăn uống, hỏi đường, du lịch, đặt lịch hẹn.',
      'Sử dụng thành thạo bổ ngữ trạng thái, câu so sánh 比 và các từ nối phổ biến.',
      'Nghe hiểu hội thoại ngắn tốc độ tự nhiên và hoàn thành đề HSK 2.',
    ],
  },
  HSK3: {
    targetVocab: '600 từ trung cấp',
    outcomes: [
      'Diễn đạt quan điểm, kế hoạch học tập, công việc và thói quen hằng ngày.',
      'Làm chủ cấu trúc câu chữ 把, câu bị động 被 và bổ ngữ kết quả, xu hướng.',
      'Đọc hiểu đoạn văn 200–300 chữ và tự tin giải quyết tình huống khi đi du lịch/công tác.',
    ],
  },
  HSK4: {
    targetVocab: '1.200 từ nâng cao',
    outcomes: [
      'Thảo luận tự tin về văn hóa, công việc văn phòng, phỏng vấn và các chủ đề xã hội.',
      'Phân biệt sắc thái từ gần nghĩa và viết đoạn văn ngắn mạch lạc.',
      'Đủ năng lực nền tảng để dự thi chứng chỉ HSK 4 phục vụ học bổng và tuyển dụng.',
    ],
  },
  HSK5: {
    targetVocab: '2.500 từ học thuật',
    outcomes: [
      'Đọc hiểu báo chí, bài phân tích văn hóa – kinh tế và xem phim không phụ đề.',
      'Sử dụng linh hoạt liên từ học thuật, thành ngữ thông dụng và lập luận nhiều chiều.',
      'Đáp ứng tiêu chuẩn đầu vào đại học, cao học và môi trường làm việc chuyên sâu.',
    ],
  },
  HSK6: {
    targetVocab: '5.000+ từ thành thạo',
    outcomes: [
      'Hiểu trọn vẹn nội dung nghe nói, tài liệu chuyên ngành và hàm ý văn hóa Trung Hoa.',
      'Tóm tắt văn bản dài và diễn đạt trôi chảy, giàu sắc thái như người bản xứ.',
      'Chinh phục cấp độ cao nhất trong khung năng lực HSK 6 cấp.',
    ],
  },
};

function readInitialTab(): 'overview' | 'vocab' | 'exams' {
  if (typeof window === 'undefined') return 'overview';
  const raw = window.location.hash || '';
  if (!raw.includes('?')) return 'overview';
  const t = new URLSearchParams(raw.split('?')[1]).get('tab');
  if (t === 'vocab' || t === 'exams') return t;
  return 'overview';
}

function readTargetChapterId(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash || '';
  if (!raw.includes('?')) return null;
  const rawId = new URLSearchParams(raw.split('?')[1]).get('chapter');
  if (!rawId) return null;
  const parsed = parseInt(rawId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export const CourseDetailPage: React.FC<{ courseId: number }> = ({ courseId }) => {
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [vocabList, setVocabList] = useState<VocabEntry[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'vocab' | 'exams'>(readInitialTab);
  const [highlightedChapterId, setHighlightedChapterId] = useState<number | null>(readTargetChapterId);
  const [vocabSearch, setVocabSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(readInitialTab());
    setHighlightedChapterId(readTargetChapterId());
    loadCourseHub();
  }, [courseId]);

  useEffect(() => {
    if (!course || !highlightedChapterId || activeTab !== 'overview') return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`chapter-${highlightedChapterId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [course, highlightedChapterId, activeTab]);

  const loadCourseHub = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any>(`/curriculum/courses/${courseId}`);
      if (!data) {
        setCourse(null);
        return;
      }

      const level = (data.level || 'HSK1').toUpperCase();
      const normalizedChapters: ChapterItem[] = (data.chapters || []).map((ch: any) => ({
        chapterId: ch.chapterId || ch.chapter_id,
        title: ch.title,
        orderIndex: ch.orderIndex || ch.order_index || 1,
        lessons: (ch.lessons || []).map((l: any) => ({
          lessonId: l.lessonId || l.lesson_id,
          title: l.title,
          orderIndex: l.orderIndex || l.order_index || 1,
          estimatedDurationMins: l.estimatedDurationMins || l.estimated_duration_mins || 15,
          vocabulariesCount: l.vocabulariesCount ?? l._count?.vocabularies ?? 0,
          testsCount: l.testsCount ?? l._count?.tests ?? 0,
          isUnlocked: l.isUnlocked ?? l.is_unlocked ?? true,
          isCompleted: l.isCompleted ?? l.is_completed ?? false,
          highestScore: l.highestScore ?? l.highest_score ?? 0,
        })),
      }));

      setCourse({
        courseId: data.courseId || data.course_id || courseId,
        title: data.title,
        code: data.code,
        description: data.description,
        level,
        chapters: normalizedChapters,
      });

      // Load course-specific vocabulary & exams in parallel so this page offers real distinct value
      const [vocabs, allTests] = await Promise.all([
        api.get<VocabEntry[]>('/curriculum/vocabularies', { params: { level, limit: 100 } }).catch(() => []),
        api.get<ExamSummary[]>('/assessment/tests').catch(() => []),
      ]);
      setVocabList(Array.isArray(vocabs) ? vocabs : []);
      setExams(
        (Array.isArray(allTests) ? allTests : []).filter(
          (t) => (t.level || '').toUpperCase() === level
        )
      );
    } catch (err) {
      console.error('Failed to load course detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const speakWord = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
        <div className="h-36 rounded-3xl glass-card-grid animate-pulse" />
        <div className="h-64 rounded-3xl glass-card-grid animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-gray-600">Không tìm thấy thông tin khóa học này.</p>
        <a href="#/courses" className="text-primary-600 font-bold underline">
          Quay lại lộ trình học
        </a>
      </div>
    );
  }

  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const totalMinutes = allLessons.reduce((sum, l) => sum + (l.estimatedDurationMins || 15), 0);
  const nextLesson = allLessons.find((l) => l.isUnlocked && !l.isCompleted) || allLessons[0];
  const levelLabel = course.level.replace('HSK', 'HSK ');
  const outcomeInfo = HSK_OUTCOMES[course.level] || HSK_OUTCOMES.HSK1;

  const filteredVocab = vocabSearch.trim()
    ? vocabList.filter((v) => {
        const q = vocabSearch.trim().toLowerCase();
        return (
          v.word.toLowerCase().includes(q) ||
          v.pinyin.toLowerCase().includes(q) ||
          v.meaning.toLowerCase().includes(q)
        );
      })
    : vocabList;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Fully Clickable Multi-Level Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <a
          href={`#/courses?level=${course.level}`}
          title={`Quay lại lộ trình ${levelLabel}`}
          aria-label={`Quay lại lộ trình ${levelLabel}`}
          className="w-9 h-9 rounded-full glass-light flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-white transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>

        <nav
          aria-label="Điều hướng khóa học"
          className="min-w-0 px-3.5 py-2 rounded-full glass-light text-xs font-medium text-gray-600"
        >
          <ol className="flex flex-wrap items-center gap-1 min-w-0">
            <li className="inline-flex items-center shrink-0">
              <a
                href="#/courses"
                className="px-1.5 py-0.5 rounded-md hover:bg-white/80 hover:text-primary-600 transition-colors cursor-pointer"
              >
                Lộ trình
              </a>
            </li>
            <li aria-hidden="true" className="text-gray-400 shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="inline-flex items-center shrink-0">
              <a
                href={`#/courses?level=${course.level}`}
                className="px-1.5 py-0.5 rounded-md hover:bg-white/80 hover:text-primary-600 text-gray-700 font-semibold transition-colors cursor-pointer"
              >
                {levelLabel}
              </a>
            </li>
            <li aria-hidden="true" className="text-gray-400 shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="inline-flex items-center min-w-0">
              <span
                aria-current="page"
                title={course.title}
                className="px-1.5 py-0.5 font-bold text-gray-900 truncate max-w-[200px] sm:max-w-sm"
              >
                {course.title}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Course Syllabus Header (Distinct from CourseListPage Learning Path) */}
      <GlassCard className="rounded-[28px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-500/12 text-primary-700 border border-primary-200/70 text-xs font-extrabold">
                Giáo trình {levelLabel}
              </span>
              <span className="text-xs text-gray-600 bg-white/65 px-2.5 py-1 rounded-full border border-white/85 font-semibold">
                {outcomeInfo.targetVocab}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900">
              {course.title}
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              {course.description ||
                'Tổng hợp mục tiêu chuẩn đầu ra, danh sách từ vựng trọng tâm và bộ đề kiểm tra đi kèm khóa học.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={`#/courses?level=${course.level}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              <Route className="w-4 h-4 text-primary-600" />
              <span>Xem sơ đồ lộ trình</span>
            </a>
            {nextLesson && (
              <ShimmerButton href={`#/lessons/${nextLesson.lessonId}`} size="sm" className="rounded-2xl">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{nextLesson.isCompleted ? 'Ôn lại bài' : 'Vào học ngay'}</span>
              </ShimmerButton>
            )}
          </div>
        </div>

        {/* 4 Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/75">
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/80">
            <span className="text-[11px] font-semibold text-gray-500">Số chương & bài</span>
            <p className="text-lg font-display font-extrabold text-gray-900 mt-0.5">
              {course.chapters.length} Unit • {allLessons.length} bài
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/80">
            <span className="text-[11px] font-semibold text-gray-500">Thời lượng dự kiến</span>
            <p className="text-lg font-display font-extrabold text-gray-900 mt-0.5">
              <NumberTicker value={totalMinutes} suffix=" phút" />
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/80">
            <span className="text-[11px] font-semibold text-gray-500">Từ vựng cấp độ</span>
            <p className="text-lg font-display font-extrabold text-primary-600 mt-0.5">
              <NumberTicker value={vocabList.length} suffix=" từ" />
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/80">
            <span className="text-[11px] font-semibold text-gray-500">Đã hoàn thành</span>
            <p className="text-lg font-display font-extrabold text-emerald-600 mt-0.5">
              {completedLessons} / {allLessons.length} bài
            </p>
          </div>
        </div>

        {/* 3 Distinct Resource Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'overview' as const, label: 'Mục tiêu & Đề cương', icon: Target },
            { id: 'vocab' as const, label: `Từ vựng ${levelLabel} (${vocabList.length})`, icon: BookOpen },
            { id: 'exams' as const, label: `Đề thi & Bài tập (${exams.length})`, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-primary-700 via-rose-700 to-amber-700 text-white shadow-sm'
                    : 'bg-white/60 hover:bg-white text-gray-700 border border-white/85'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* TAB 1: LEARNING OUTCOMES & COMPACT SYLLABUS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <GlassCard className="lg:col-span-5 rounded-[26px] p-6 space-y-4">
            <h2 className="text-base font-display font-extrabold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Chuẩn đầu ra sau khi học xong</span>
            </h2>
            <ul className="space-y-3">
              {outcomeInfo.outcomes.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/55 border border-white/80 text-xs sm:text-sm text-gray-700 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="lg:col-span-7 rounded-[26px] p-6 space-y-4">
            <h2 className="text-base font-display font-extrabold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <span>Đề cương các chương ({course.chapters.length} Unit)</span>
            </h2>

            <div className="space-y-3">
              {course.chapters.map((ch, idx) => {
                const isTargetChapter = highlightedChapterId === ch.chapterId;
                return (
                  <div
                    key={ch.chapterId}
                    id={`chapter-${ch.chapterId}`}
                    className={`p-4 rounded-2xl border space-y-2.5 transition-all scroll-mt-24 ${
                      isTargetChapter
                        ? 'bg-rose-50/75 dark:bg-rose-950/25 border-[#C41E3A]/45 ring-2 ring-[#C41E3A]/15 shadow-sm'
                        : 'bg-white/55 border-white/85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-display font-bold text-gray-900">
                        Unit {idx + 1}: {ch.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-gray-500 shrink-0">
                        {ch.lessons.length} bài
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ch.lessons.map((ls) => (
                        <a
                          key={ls.lessonId}
                          href={`#/lessons/${ls.lessonId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/75 hover:bg-primary-50 border border-white text-xs font-semibold text-gray-700 hover:text-primary-700 transition-colors"
                        >
                          {ls.isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Play className="w-3 h-3 text-primary-500 fill-current" />
                          )}
                          <span className="truncate max-w-[220px]">{ls.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: COURSE VOCABULARY QUICK REFERENCE */}
      {activeTab === 'vocab' && (
        <GlassCard className="rounded-[26px] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-extrabold text-gray-900">
                Bảng từ vựng trọng tâm {levelLabel}
              </h2>
              <p className="text-xs text-gray-500">
                Bấm biểu tượng loa để nghe phát âm chuẩn và ôn nhanh toàn bộ từ vựng của khóa học
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={vocabSearch}
                onChange={(e) => setVocabSearch(e.target.value)}
                placeholder="Lọc chữ Hán, pinyin, nghĩa..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white/70 focus:bg-white border border-white/85 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1 no-scrollbar">
            {filteredVocab.map((v) => (
              <div
                key={v.vocabularyId}
                className="p-3.5 rounded-2xl bg-white/55 border border-white/85 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-hanzi-serif font-bold text-xl text-gray-900">{v.word}</span>
                    <span className="text-xs font-mono font-bold text-primary-600">{v.pinyin}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{v.meaning}</p>
                </div>
                <button
                  type="button"
                  onClick={() => speakWord(v.word)}
                  aria-label={`Nghe ${v.word}`}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-primary-600 text-primary-600 hover:text-white border border-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 3: MATCHING HSK EXAMS & WORKBOOKS */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.length === 0 ? (
            <GlassCard className="sm:col-span-2 p-10 text-center text-sm text-gray-500">
              Chưa có đề kiểm tra riêng cho {levelLabel}.
            </GlassCard>
          ) : (
            exams.map((exam) => (
              <GlassCard
                key={exam.testId}
                hoverable
                className="rounded-[24px] p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase text-primary-600">
                    {exam.testType === 'WORKBOOK' ? 'Sách bài tập' : 'Đề thi mẫu'} • {levelLabel}
                  </span>
                  <h3 className="text-sm font-display font-bold text-gray-900 truncate">
                    {exam.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.timeLimitMins} phút
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileQuestion className="w-3.5 h-3.5" />
                      {exam.questionsCount} câu
                    </span>
                  </div>
                </div>
                <ShimmerButton href={`#/test/${exam.testId}`} size="sm" className="rounded-xl shrink-0">
                  <span>Làm bài</span>
                </ShimmerButton>
              </GlassCard>
            ))
          )}
        </div>
      )}
    </div>
  );
};
