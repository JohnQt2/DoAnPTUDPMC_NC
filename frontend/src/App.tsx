import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

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
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading || (user && hasCompletedOnboarding === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-chinese font-black text-2xl shadow-lg motion-safe:animate-pulse"
          >
            汉
          </span>
          <span className="text-sm font-bold text-gray-600">Đang tải Hanzi4u...</span>
        </div>
      </div>
    );
  }

  const basePath = currentHash.split('?')[0] || '#/';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GUEST / UNAUTHENTICATED ROUTES
  // ──────────────────────────────────────────────────────────────────────────
  if (!user) {
    if (basePath === '#/' || basePath === '' || basePath === '#/landing') {
      return (
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar currentPath={currentHash} />
          <main className="flex-1">
            <LandingPage />
          </main>
          <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
            © 2026 Hanzi4u (hanzi4u.id.vn)
          </footer>
        </div>
      );
    }

    if (basePath === '#/login') {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar currentPath={currentHash} />
          <main className="flex-1">
            <LoginPage />
          </main>
        </div>
      );
    }

    const redirectUrl = `#/login?redirect=${encodeURIComponent(currentHash)}`;
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar currentPath={currentHash} />
        <div className="max-w-md mx-auto my-20 px-4">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Vui lòng đăng nhập</h2>
            <p className="text-sm text-gray-500">
              Đăng nhập tài khoản Hanzi4u để tiếp tục học và lưu tiến độ của bạn.
            </p>
            <div className="space-y-2.5 pt-1">
              <a
                href={redirectUrl}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#/"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs"
              >
                <Home className="w-4 h-4 text-gray-400" />
                <span>Về trang chủ</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FIRST-TIME LOGIN ONLY: SHOW ROADMAP ONBOARDING QUESTIONS
  // From 2nd login onwards, hasCompletedOnboarding === true so this is skipped!
  // ──────────────────────────────────────────────────────────────────────────
  if (hasCompletedOnboarding === false) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-100 h-16 px-4 sm:px-6 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center font-chinese font-black text-lg">
              汉
            </span>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              Hanzi<span className="text-primary-500">4u</span>
            </span>
          </div>
        </header>
        <main className="flex-1 pb-12">
          <OnboardingRoadmapPage />
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MAIN AUTHENTICATED WORKSPACE (8-ITEM LEFT SIDEBAR MATCHING IMAGE 2)
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

    if (basePath === '#/vocab' || basePath === '#/srs') {
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
          <div className="max-w-lg mx-auto my-20 px-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">403 - Không Có Quyền Truy Cập</h2>
            <a
              href="#/today"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm"
            >
              Về trang Hôm nay
            </a>
          </div>
        );
      }
      return <AdminCMSPage />;
    }

    return <TodayPage />;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar currentPath={currentHash} />
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <main className="flex-1 pb-16">{renderCurrentPage()}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
