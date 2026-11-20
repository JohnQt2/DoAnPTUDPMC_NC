import React, { useState, useEffect, startTransition } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
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
import { Lock, ShieldAlert, ArrowRight, Home } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading, hasCompletedOnboarding } = useAuth();
  const [visualHash, setVisualHash] = useState(window.location.hash || '#/');
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      const next = window.location.hash || '#/';
      setVisualHash(next);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      startTransition(() => {
        setCurrentHash(next);
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isStudent = user?.role === 'STUDENT';

  if (isLoading || (isStudent && hasCompletedOnboarding === null)) {
    return (
      <MeshBackground variant="light" showHanzi={false} className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-3.5">
          <span
            aria-hidden="true"
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-500 text-white flex items-center justify-center font-chinese font-black text-2xl shadow-xl shadow-primary-500/25 motion-safe:animate-pulse"
          >
            汉
          </span>
          <span className="text-sm font-bold text-gray-600">Đang tải Hanzi4U...</span>
        </div>
      </MeshBackground>
    );
  }

  const basePath = currentHash.split('?')[0] || '#/';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GUEST / UNAUTHENTICATED ROUTES (DARK GLASSMORPHISM)
  // ──────────────────────────────────────────────────────────────────────────
  if (!user) {
    if (basePath === '#/' || basePath === '' || basePath === '#/landing') {
      return (
        <MeshBackground variant="dark" className="min-h-screen flex flex-col">
          <Navbar currentPath={currentHash} theme="dark" />
          <main className="flex-1">
            <LandingPage />
          </main>
          <footer className="border-t border-white/[0.08] bg-black/20 backdrop-blur-md py-6 text-center text-xs text-white/40">
            © 2026 Hanzi4U (hanzi4u.id.vn) — Nền tảng học tiếng Trung HSK cho người Việt
          </footer>
        </MeshBackground>
      );
    }

    if (basePath === '#/login') {
      return (
        <MeshBackground variant="dark" className="min-h-screen flex flex-col">
          <Navbar currentPath={currentHash} theme="dark" />
          <main className="flex-1 flex flex-col">
            <LoginPage />
          </main>
        </MeshBackground>
      );
    }

    const redirectUrl = `#/login?redirect=${encodeURIComponent(currentHash)}`;
    return (
      <MeshBackground variant="dark" className="min-h-screen flex flex-col">
        <Navbar currentPath={currentHash} theme="dark" />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <GlassCard variant="dark" className="max-w-md w-full p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-400/30 text-primary-300 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Vui lòng đăng nhập</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Đăng nhập tài khoản Hanzi4U để tiếp tục học và lưu tiến độ cá nhân hóa của bạn.
            </p>
            <div className="space-y-2.5 pt-2">
              <ShimmerButton href={redirectUrl} className="w-full">
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
              <a
                href="#/"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-white/15 hover:bg-white/10 text-white/75 font-semibold text-xs transition-colors"
              >
                <Home className="w-4 h-4 text-white/50" />
                <span>Về trang chủ</span>
              </a>
            </div>
          </GlassCard>
        </div>
      </MeshBackground>
    );
  }

  const isAdminRole = user.role === 'ADMIN' || user.role === 'CONTENT_EDITOR';

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ADMIN / CONTENT_EDITOR: DEDICATED ADMIN-ONLY WORKSPACE (LIGHT GLASS)
  // ──────────────────────────────────────────────────────────────────────────
  if (isAdminRole) {
    const isAdminProfile = basePath.startsWith('#/profile');
    const isAdminLessonPreview = basePath.startsWith('#/lessons/');
    const adminTab: 'courses' | 'questions' | 'rbac' = basePath.startsWith('#/admin/questions')
      ? 'questions'
      : basePath.startsWith('#/admin/users') && user.role === 'ADMIN'
        ? 'rbac'
        : 'courses';

    return (
      <MeshBackground variant="light" showHanzi={false} className="text-[#16151B] font-sans">
        <Sidebar currentPath={visualHash} />
        <div className="lg:pl-[17.25rem] min-h-screen flex flex-col">
          <main className="flex-1 pb-16">
            <PageTransition
              routeKey={isAdminProfile ? 'admin-profile' : isAdminLessonPreview ? basePath : adminTab}
            >
              {isAdminProfile ? (
                <ProfilePage />
              ) : isAdminLessonPreview ? (
                <LessonPage lessonId={parseInt(basePath.replace('#/lessons/', ''), 10) || 1} />
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
      <MeshBackground variant="light" showHanzi={false} className="flex flex-col">
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/80 h-16 px-4 sm:px-6 flex items-center justify-center shadow-sm shadow-gray-900/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-500 text-white flex items-center justify-center font-chinese font-black text-lg shadow-sm">
              汉
            </span>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              Hanzi<span className="text-primary-600">4U</span>
            </span>
          </div>
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

    if (basePath === '#/exams') {
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
    <MeshBackground variant="light" showHanzi={false} className="text-[#16151B] font-sans">
      <Sidebar currentPath={visualHash} />
      <div className="lg:pl-[17.25rem] min-h-screen flex flex-col">
        <main className="flex-1 pb-16">
          <PageTransition routeKey={basePath}>{renderCurrentPage()}</PageTransition>
        </main>
      </div>
    </MeshBackground>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CustomCursor />
      <CelebrationOverlay />
      <DialogOverlay />
      <AppContent />
    </AuthProvider>
  );
};

export default App;
