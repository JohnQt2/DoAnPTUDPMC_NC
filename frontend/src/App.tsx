import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { saveInProgressLessonId } from './lib/resumeLesson';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HanziLogo } from './components/HanziLogo';
import { HanziLoadingScreen } from './components/landing/ArchitecturalOrnaments';
import {
  MeshBackground,
  PageTransition,
  GlassCard,
  ShimmerButton,
  CelebrationOverlay,
  CustomCursor,
  DialogOverlay,
} from './components/ui';
// Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ProgressPage } from './pages/profile/ProgressPage';
import { OnboardingRoadmapPage } from './pages/onboarding/OnboardingRoadmapPage';
import { TodayPage } from './pages/today/TodayPage';
import { CourseListPage } from './pages/courses/CourseListPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { LessonPage } from './pages/lessons/LessonPage';
import { PinyinPage } from './pages/learning/PinyinPage';
import { VocabPage } from './pages/learning/VocabPage';
import { SpeakingPracticePage } from './pages/learning/SpeakingPracticePage';
import { ExamListPage } from './pages/test/ExamListPage';
import { TestPage } from './pages/test/TestPage';
import { TestResultPage } from './pages/test/TestResultPage';
import { LeaderboardPage } from './pages/leaderboard/LeaderboardPage';
import { AdminCMSPage } from './pages/admin/AdminCMSPage';
// Mock Exam Module
import { MockExamListPage } from './pages/exam/MockExamListPage';
import { StudentExamSplitScreen } from './pages/exam/StudentExamSplitScreen';
import { TeacherExamManager } from './pages/exam/TeacherExamManager';

// Practice Module Pages
import { PracticeLessonsPage } from './pages/practice/PracticeLessonsPage';
import { PracticeLessonDetailPage } from './pages/practice/PracticeLessonDetailPage';
import { PracticeCollectionStudentDetailPage } from './pages/practice/PracticeCollectionStudentDetailPage';
import { PracticeExercisePage } from './pages/practice/PracticeExercisePage';
import { PracticeResultPage } from './pages/practice/PracticeResultPage';
import { PracticeProgressPage } from './pages/practice/PracticeProgressPage';

import { Lock, ShieldAlert, ArrowRight, Home } from 'lucide-react';

const PracticeAdminListPage = lazy(() => import('./pages/admin/practice/PracticeAdminListPage').then((module) => ({ default: module.PracticeAdminListPage })));
const PracticeCollectionCreatePage = lazy(() => import('./pages/admin/practice/PracticeCollectionCreatePage').then((module) => ({ default: module.PracticeCollectionCreatePage })));
const PracticeCollectionDetailPage = lazy(() => import('./pages/admin/practice/PracticeCollectionDetailPage').then((module) => ({ default: module.PracticeCollectionDetailPage })));
const PracticeVersionEditorPage = lazy(() => import('./pages/admin/practice/PracticeVersionEditorPage').then((module) => ({ default: module.PracticeVersionEditorPage })));
const PracticePreviewPage = lazy(() => import('./pages/admin/practice/PracticePreviewPage').then((module) => ({ default: module.PracticePreviewPage })));
const PracticeReviewPage = lazy(() => import('./pages/admin/practice/PracticeReviewPage').then((module) => ({ default: module.PracticeReviewPage })));

const PracticeAdminLoading: React.FC = () => (
  <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10" role="status" aria-live="polite">
    <span className="sr-only">Đang tải giao diện quản lý bài luyện tập…</span>
    <div className="h-10 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
  </div>
);

const AppContent: React.FC = () => {
  const { user, isLoading, hasCompletedOnboarding } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hanzi4u_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hanzi4u_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const syncHash = (hash: string) => {
      const clean = hash.split('?')[0] || '#/';
      if (clean.startsWith('#/lessons/')) {
        const lid = parseInt(clean.replace('#/lessons/', ''), 10);
        if (Number.isFinite(lid) && lid > 0) {
          saveInProgressLessonId(lid);
        }
      }
    };

    syncHash(window.location.hash || '#/');

    const handleHashChange = () => {
      const next = window.location.hash || '#/';
      setCurrentHash(next);
      syncHash(next);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isStudent = user?.role === 'STUDENT';
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'CONTENT_EDITOR';
  const basePath = currentHash.split('?')[0] || '#/';

  useEffect(() => {
    if (basePath !== '#/practice') return;

    const workbookRoute = '#/exams/workbook';
    window.history.replaceState(window.history.state, '', workbookRoute);
    setCurrentHash(workbookRoute);
  }, [basePath]);

  // Normalize root / login / landing routes to #/today (or #/admin/courses for Admin)
  useEffect(() => {
    if (!user) return;
    if (
      basePath === '#/' ||
      basePath === '' ||
      basePath === '#/landing' ||
      basePath === '#/login'
    ) {
      const defaultRoute = isAdminRole ? '#/admin/courses' : '#/today';
      if (!isStudent || hasCompletedOnboarding === true) {
        window.history.replaceState(null, '', defaultRoute);
        setCurrentHash(defaultRoute);
      }
    }
  }, [user, isStudent, isAdminRole, hasCompletedOnboarding, basePath]);

  if (isLoading || (isStudent && hasCompletedOnboarding === null)) {
    return <HanziLoadingScreen visible={true} progress={82} />;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GUEST / UNAUTHENTICATED ROUTES (DARK GLASSMORPHISM)
  // ──────────────────────────────────────────────────────────────────────────
  if (!user) {
    if (basePath === '#/' || basePath === '' || basePath === '#/landing') {
      return <LandingPage />;
    }

    if (basePath === '#/login') {
      return (
        <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[#FAF8F6]">
          <Navbar currentPath={currentHash} theme="light" />
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar">
            <LoginPage />
          </main>
        </div>
      );
    }

    const redirectUrl = `#/login?redirect=${encodeURIComponent(currentHash)}`;
    return (
      <MeshBackground variant="light" showHanzi={false} className="min-h-screen flex flex-col text-[#1C1917]">
        <Navbar currentPath={currentHash} theme="light" />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <GlassCard variant="light" className="max-w-md w-full p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#C41E3A]/10 border border-[#C41E3A]/20 text-[#C41E3A] mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#1C1917]">Vui lòng đăng nhập</h2>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Đăng nhập tài khoản Hanzi4U để tiếp tục học và lưu tiến độ cá nhân hóa của bạn.
            </p>
            <div className="space-y-2.5 pt-2">
              <ShimmerButton href={redirectUrl} className="w-full">
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
              <a
                href="#/"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-[#1C1917]/15 bg-white/80 hover:bg-white text-[#57534E] hover:text-[#1C1917] font-semibold text-xs transition-colors"
              >
                <Home className="w-4 h-4 text-[#C41E3A]" />
                <span>Về trang chủ</span>
              </a>
            </div>
          </GlassCard>
        </div>
      </MeshBackground>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DEDICATED FULLSCREEN SPLIT-SCREEN WORKSPACE FOR MOCK EXAMS (PDF + AUDIO)
  // ──────────────────────────────────────────────────────────────────────────
  if (basePath.startsWith('#/mock-exam/')) {
    const id = parseInt(basePath.replace('#/mock-exam/', ''), 10);
    return (
      <StudentExamSplitScreen
        examId={id || 1}
        onBack={() => {
          window.location.hash = '#/mock-exams';
        }}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. FIRST-TIME LOGIN ONLY (STUDENTS): ROADMAP ONBOARDING (LIGHT GLASS)
  // ──────────────────────────────────────────────────────────────────────────
  if (!isAdminRole && hasCompletedOnboarding === false) {

    return (
      <MeshBackground variant="light" showHanzi={false} className="flex flex-col text-[#1C1917]">
        <header className="sticky top-0 z-40 bg-[#FCFBF8]/88 dark:bg-[#0f151f]/90 backdrop-blur-xl border-b border-[#1C1917]/10 dark:border-white/10 h-16 px-4 sm:px-6 flex items-center justify-center shadow-sm shadow-[#1C1917]/[0.03]">
          <HanziLogo variant="light" size="md" showSubtitle={false} />
        </header>
        <main className="flex-1 pb-12">
          <PageTransition routeKey="onboarding-initial">
            <OnboardingRoadmapPage />
          </PageTransition>
        </main>
      </MeshBackground>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. MAIN AUTHENTICATED WORKSPACE (LIGHT GLASSMORPHISM + SIDEBAR)
  // ──────────────────────────────────────────────────────────────────────────
  const renderCurrentPage = () => {
    if (
      basePath === '#/' ||
      basePath === '' ||
      basePath === '#/today' ||
      basePath === '#/landing' ||
      basePath === '#/login'
    ) {
      return <TodayPage />;
    }

    if (basePath === '#/courses' || basePath === '#/roadmap') {
      return <CourseListPage />;
    }

    if (basePath.startsWith('#/courses/')) {
      const id = parseInt(basePath.replace('#/courses/', ''), 10);
      return <CourseDetailPage courseId={id || 1} />;
    }

    if (basePath.startsWith('#/lessons/')) {
      const id = parseInt(basePath.replace('#/lessons/', ''), 10);
      return <LessonPage lessonId={id || 1} />;
    }

    if (basePath === '#/vocab') {
      return <VocabPage initialTab="bank" />;
    }

    if (basePath === '#/srs') {
      return <VocabPage initialTab="srs" />;
    }

    if (basePath === '#/characters') {
      return <VocabPage initialTab="writing" />;
    }

    if (basePath === '#/speak-learn' || basePath === '#/pinyin') {
      return <PinyinPage />;
    }

    if (basePath === '#/speak-practice') {
      return <SpeakingPracticePage />;
    }

    // Mock Exam Module — Thi thử HSK bằng PDF và Audio
    if (basePath === '#/mock-exams') {
      return <MockExamListPage />;
    }

    if (basePath.startsWith('#/mock-exam/')) {
      const id = parseInt(basePath.replace('#/mock-exam/', ''), 10);
      return (
        <StudentExamSplitScreen
          examId={id || 1}
          onBack={() => {
            window.location.hash = '#/mock-exams';
          }}
        />
      );
    }

    if (basePath.startsWith('#/teacher/exams') || basePath.startsWith('#/admin/exams')) {
      return (
        <TeacherExamManager
          onBack={() => {
            window.location.hash = '#/mock-exams';
          }}
        />
      );
    }

    // ExamListPage — danh sách đề thi và bài luyện tập
    if (basePath === '#/exams') {
      return <ExamListPage initialTab="MOCK_EXAM" />;
    }

    if (basePath === '#/exams/workbook') {
      return <ExamListPage initialTab="WORKBOOK" />;
    }

    if (basePath === '#/quizzes' || basePath === '#/old-exams') {
      return <ExamListPage />;
    }


    if (basePath.startsWith('#/test-result/')) {
      const id = parseInt(basePath.replace('#/test-result/', ''), 10);
      return <TestResultPage submissionId={id || 1} />;
    }

    if (basePath.startsWith('#/test/')) {
      const id = parseInt(basePath.replace('#/test/', ''), 10);
      return <TestPage testId={id || 1} />;
    }

    if (basePath === '#/leaderboard') {
      return <LeaderboardPage />;
    }

    if (basePath === '#/progress') {
      return <ProgressPage />;
    }

    // ─── Practice Workbook Module Routes (Supports old bookmarks -> redirect to #/exams/workbook) ───
    if (basePath === '#/practice') {
      return <ExamListPage initialTab="WORKBOOK" />;
    }

    if (basePath === '#/practice/progress') {
      return <PracticeProgressPage />;
    }

    if (basePath.startsWith('#/practice/exercise/')) {
      const setId = parseInt(basePath.replace('#/practice/exercise/', ''), 10);
      return <PracticeExercisePage exerciseSetId={setId} />;
    }

    if (basePath.startsWith('#/practice/results/') || basePath.startsWith('#/practice/result/')) {
      const cleanPath = basePath.replace('#/practice/results/', '').replace('#/practice/result/', '');
      const attemptId = parseInt(cleanPath, 10);
      return <PracticeResultPage attemptId={attemptId} />;
    }

    // Match #/practice/collections/:collectionId (Must be BEFORE #/practice/:levelCode)
    const collectionMatch = basePath.match(/^#\/practice\/collections\/(\d+)/);
    if (collectionMatch) {
      const collectionId = parseInt(collectionMatch[1], 10);
      return <PracticeCollectionStudentDetailPage collectionId={collectionId} />;
    }

    // Match #/practice/:levelCode/lessons/:lessonId
    const lessonMatch = basePath.match(/^#\/practice\/([A-Za-z0-9_-]+)\/lessons\/(\d+)/);
    if (lessonMatch) {
      const levelCode = lessonMatch[1];
      const lessonId = parseInt(lessonMatch[2], 10);
      return <PracticeLessonDetailPage levelCode={levelCode} lessonId={lessonId} />;
    }

    // Match #/practice/:levelCode
    const levelMatch = basePath.match(/^#\/practice\/([A-Za-z0-9_-]+)/);
    if (levelMatch) {
      const levelCode = levelMatch[1];
      return <PracticeLessonsPage levelCode={levelCode} />;
    }

    if (basePath.startsWith('#/profile')) {
      return <ProfilePage />;
    }

    if (basePath.startsWith('#/onboarding')) {
      return <OnboardingRoadmapPage />;
    }

    // ─── ADMIN & STAFF WORKSPACE ───
    if (isAdminRole) {
      if (basePath.startsWith('#/profile')) {
        return <ProfilePage />;
      }
      if (basePath.startsWith('#/lessons/')) {
        const lid = parseInt(basePath.replace('#/lessons/', ''), 10);
        return <LessonPage lessonId={lid || 1} />;
      }

      // Priority 1: Practice CMS Routes (Exact & Regex matches)
      const versionPreviewMatch = basePath.match(/^#\/admin\/practice\/versions\/(\d+)\/preview$/);
      if (versionPreviewMatch) {
        return <Suspense fallback={<PracticeAdminLoading />}><PracticePreviewPage versionId={parseInt(versionPreviewMatch[1], 10)} /></Suspense>;
      }

      const versionReviewMatch = basePath.match(/^#\/admin\/practice\/versions\/(\d+)\/review$/);
      if (versionReviewMatch) {
        return <Suspense fallback={<PracticeAdminLoading />}><PracticeReviewPage versionId={parseInt(versionReviewMatch[1], 10)} /></Suspense>;
      }

      const versionEditMatch = basePath.match(/^#\/admin\/practice\/versions\/(\d+)\/edit$/);
      if (versionEditMatch) {
        return <Suspense fallback={<PracticeAdminLoading />}><PracticeVersionEditorPage versionId={parseInt(versionEditMatch[1], 10)} /></Suspense>;
      }

      if (basePath === '#/admin/practice/new') {
        return <Suspense fallback={<PracticeAdminLoading />}><PracticeCollectionCreatePage /></Suspense>;
      }

      const collectionDetailMatch = basePath.match(/^#\/admin\/practice\/(\d+)$/);
      if (collectionDetailMatch) {
        return <Suspense fallback={<PracticeAdminLoading />}><PracticeCollectionDetailPage collectionId={parseInt(collectionDetailMatch[1], 10)} /></Suspense>;
      }

      if (basePath === '#/admin/practice' || basePath.startsWith('#/admin/practice/')) {
        return <Suspense fallback={<PracticeAdminLoading />}><PracticeAdminListPage /></Suspense>;
      }

      // Priority 2: Admin Courses, Questions, Users
      if (basePath.startsWith('#/admin/questions')) {
        return <AdminCMSPage initialTab="questions" />;
      }

      if (basePath.startsWith('#/admin/users')) {
        if (user.role === 'ADMIN') {
          return <AdminCMSPage initialTab="rbac" />;
        }
        return <AdminCMSPage initialTab="courses" />;
      }

      if (basePath.startsWith('#/admin/courses')) {
        return <AdminCMSPage initialTab="courses" />;
      }

      // Fallback for #/admin
      if (basePath === '#/admin' || basePath === '#/admin/') {
        return <AdminCMSPage initialTab="courses" />;
      }
    }

    return <TodayPage />;
  };

  return (
    <MeshBackground variant="light" showHanzi={false} className="text-gray-900 font-sans">
      <Sidebar
        currentPath={currentHash}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
      <div
        className={`${sidebarCollapsed ? 'lg:pl-[90px]' : 'lg:pl-[269px]'
          } min-h-screen flex flex-col flex-1 min-w-0 transition-[padding] duration-300 ease-out`}
      >
        <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] flex-1 flex flex-col min-w-0">
            <PageTransition routeKey={basePath}>{renderCurrentPage()}</PageTransition>
          </div>
        </main>
      </div>
    </MeshBackground>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CustomCursor />
        <CelebrationOverlay />
        <DialogOverlay />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
