import React, { useState, useEffect } from 'react';
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
import { StudentExamSplitScreen } from './pages/exam/StudentExamSplitScreen';
import { TeacherExamManager } from './pages/exam/TeacherExamManager';
import { Lock, ShieldAlert, ArrowRight, Home } from 'lucide-react';

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
  const basePath = currentHash.split('?')[0] || '#/';

  // Normalize root / login / landing routes to #/today for authenticated students
  useEffect(() => {
    if (!user || !isStudent || hasCompletedOnboarding !== true) return;
    if (
      basePath === '#/' ||
      basePath === '' ||
      basePath === '#/landing' ||
      basePath === '#/login'
    ) {
      window.history.replaceState(null, '', '#/today');
      setCurrentHash('#/today');
    }
  }, [user, isStudent, hasCompletedOnboarding, basePath]);

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
          window.location.hash = '#/exams?mode=mock';
        }}
      />
    );
  }

  const isAdminRole = user.role === 'ADMIN' || user.role === 'CONTENT_EDITOR';

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ADMIN / CONTENT_EDITOR: DEDICATED ADMIN-ONLY WORKSPACE (LIGHT GLASS)
  // ──────────────────────────────────────────────────────────────────────────
  if (isAdminRole) {
    const isAdminProfile = basePath.startsWith('#/profile');
    const isAdminLessonPreview = basePath.startsWith('#/lessons/');
    const isTeacherExams = basePath.startsWith('#/teacher/exams') || basePath.startsWith('#/admin/exams');
    const isMockExamList = basePath === '#/mock-exams' || basePath === '#/exams';
    const adminTab: 'courses' | 'questions' | 'rbac' = basePath.startsWith('#/admin/questions')
      ? 'questions'
      : basePath.startsWith('#/admin/users') && user.role === 'ADMIN'
        ? 'rbac'
        : 'courses';

    return (
      <MeshBackground variant="light" showHanzi={false} className="text-[#1C1917] font-sans">
        <Sidebar
          currentPath={currentHash}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
        <div
          style={{ ['--sidebar-offset' as any]: sidebarCollapsed ? '6.25rem' : '17.25rem' }}
          className={`${
            sidebarCollapsed ? 'lg:pl-[6.25rem]' : 'lg:pl-[17.25rem]'
          } min-h-screen flex flex-col transition-[padding] duration-300 ease-out`}
        >
          <main className="flex-1 pb-16">
            <PageTransition
              routeKey={
                isAdminProfile
                  ? 'admin-profile'
                  : isAdminLessonPreview
                    ? basePath
                    : isTeacherExams
                      ? 'admin-exams'
                      : isMockExamList
                        ? 'admin-mock-exams'
                        : adminTab
              }
            >
              {isAdminProfile ? (
                <ProfilePage />
              ) : isAdminLessonPreview ? (
                <LessonPage lessonId={parseInt(basePath.replace('#/lessons/', ''), 10) || 1} />
              ) : isTeacherExams ? (
                <TeacherExamManager onBack={() => { window.location.hash = '#/exams'; }} />
              ) : isMockExamList ? (
                <ExamListPage />
              ) : (
                <AdminCMSPage initialTab={adminTab} />
              )}
            </PageTransition>
          </main>
        </div>
      </MeshBackground>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. FIRST-TIME LOGIN ONLY (STUDENTS): ROADMAP ONBOARDING (LIGHT GLASS)
  // ──────────────────────────────────────────────────────────────────────────
  if (hasCompletedOnboarding === false) {
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

    if (basePath === '#/exams' || basePath === '#/quizzes' || basePath === '#/old-exams') {
      return <ExamListPage />;
    }

    if (basePath === '#/mock-exams') {
      return <ExamListPage initialMode="MOCK_EXAM" />;
    }

    if (basePath.startsWith('#/mock-exam/')) {
      const id = parseInt(basePath.replace('#/mock-exam/', ''), 10);
      return (
        <StudentExamSplitScreen
          examId={id || 1}
          onBack={() => {
            window.location.hash = '#/exams?mode=mock';
          }}
        />
      );
    }

    if (basePath.startsWith('#/teacher/exams') || basePath.startsWith('#/admin/exams')) {
      return (
        <TeacherExamManager
          onBack={() => {
            window.location.hash = '#/exams';
          }}
        />
      );
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

    if (basePath.startsWith('#/profile')) {
      return <ProfilePage />;
    }

    if (basePath.startsWith('#/onboarding')) {
      return <OnboardingRoadmapPage />;
    }

    if (basePath.startsWith('#/admin')) {
      const canAccessCMS = user.role === 'ADMIN' || user.role === 'CONTENT_EDITOR';
      if (!canAccessCMS) {
        return (
          <div className="max-w-lg mx-auto my-20 px-4">
            <GlassCard className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">403 - Không Có Quyền Truy Cập</h2>
              <ShimmerButton href="#/today">Về trang Hôm nay</ShimmerButton>
            </GlassCard>
          </div>
        );
      }
      return <AdminCMSPage />;
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
        style={{ ['--sidebar-offset' as any]: sidebarCollapsed ? '6.25rem' : '17.25rem' }}
        className={`${
          sidebarCollapsed ? 'lg:pl-[6.25rem]' : 'lg:pl-[17.25rem]'
        } min-h-screen flex flex-col transition-[padding] duration-300 ease-out`}
      >
        <main className="flex-1 pb-8">
          <PageTransition routeKey={basePath}>{renderCurrentPage()}</PageTransition>
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
