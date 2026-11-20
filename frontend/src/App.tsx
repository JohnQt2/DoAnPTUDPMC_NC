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
      <MeshBackground variant="light" className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="w-11 h-11 rounded-xl bg-[#09090B] text-white flex items-center justify-center font-hanzi-serif font-bold text-xl"
          >
            汉
          </span>
          <span className="text-xs font-medium text-zinc-500">Đang tải Hanzi4U...</span>
        </div>
      </MeshBackground>
    );
  }

  const basePath = currentHash.split('?')[0] || '#/';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GUEST / UNAUTHENTICATED ROUTES (MINIMALIST ALABASTER SAAS 2026)
  // ──────────────────────────────────────────────────────────────────────────
  if (!user) {
    if (basePath === '#/' || basePath === '' || basePath === '#/landing') {
      return (
        <MeshBackground variant="light" className="min-h-screen flex flex-col">
          <Navbar currentPath={currentHash} theme="light" />
          <main className="flex-1">
            <LandingPage />
          </main>
          <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
            © 2026 Hanzi4U (hanzi4u.id.vn) — Nền tảng học tiếng Trung HSK
          </footer>
        </MeshBackground>
      );
    }

    if (basePath === '#/login') {
      return (
        <MeshBackground variant="light" className="min-h-screen flex flex-col">
          <Navbar currentPath={currentHash} theme="light" />
          <main className="flex-1 flex flex-col">
            <LoginPage />
          </main>
        </MeshBackground>
      );
    }

    const redirectUrl = `#/login?redirect=${encodeURIComponent(currentHash)}`;
    return (
      <MeshBackground variant="light" className="min-h-screen flex flex-col">
        <Navbar currentPath={currentHash} theme="light" />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <GlassCard className="max-w-sm w-full p-8 text-center space-y-5 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 mx-auto flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-zinc-900">Vui lòng đăng nhập</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Đăng nhập tài khoản Hanzi4U để tiếp tục học và đồng bộ tiến độ của bạn.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <ShimmerButton href={redirectUrl} className="w-full">
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
              <a
                href="#/"
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-zinc-500" />
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
  // 2. ADMIN / CONTENT_EDITOR WORKSPACE
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
      <MeshBackground variant="light" className="text-[#09090B] font-sans">
        <Sidebar currentPath={visualHash} />
        <div className="lg:pl-60 min-h-screen flex flex-col">
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
  // 3. FIRST-TIME LOGIN ONLY (STUDENTS): ROADMAP ONBOARDING
  // ──────────────────────────────────────────────────────────────────────────
  if (hasCompletedOnboarding === false) {
    return (
      <MeshBackground variant="light" className="flex flex-col">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 h-14 px-4 sm:px-6 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#09090B] text-white flex items-center justify-center font-hanzi-serif font-bold text-base">
              汉
            </span>
            <span className="font-display font-bold text-lg tracking-tight text-zinc-900">
              Hanzi<span className="text-[#BE123C]">4U</span>
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
  // 4. MAIN AUTHENTICATED STUDENT WORKSPACE
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
          <div className="max-w-md mx-auto my-20 px-4">
            <GlassCard className="p-8 text-center space-y-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-[#BE123C] mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900">403 — Không có quyền truy cập</h2>
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
    <MeshBackground variant="light" className="text-[#09090B] font-sans">
      <Sidebar currentPath={visualHash} />
      <div className="lg:pl-60 min-h-screen flex flex-col">
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
      <CelebrationOverlay />
      <DialogOverlay />
      <AppContent />
    </AuthProvider>
  );
};

export default App;
