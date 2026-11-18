import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { OnboardingRoadmapPage } from './pages/onboarding/OnboardingRoadmapPage';
import { CourseListPage } from './pages/courses/CourseListPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { LessonPage } from './pages/lessons/LessonPage';
import { PinyinPage } from './pages/learning/PinyinPage';
import { CharacterPracticePage } from './pages/learning/CharacterPracticePage';
import { TestPage } from './pages/test/TestPage';
import { TestResultPage } from './pages/test/TestResultPage';
import { SrsReviewPage } from './pages/srs/SrsReviewPage';
import { AdminCMSPage } from './pages/admin/AdminCMSPage';
import { Lock, ShieldAlert, ArrowRight, Home } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50/40 to-white">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-400 text-white flex items-center justify-center font-chinese font-black text-2xl shadow-lg shadow-primary-500/20 motion-safe:animate-pulse"
          >
            汉
          </span>
          <span className="text-sm font-bold text-gray-600">Đang khởi tạo Hanzi4u...</span>
        </div>
      </div>
    );
  }

  // Base path without query parameters for clean routing
  const basePath = currentHash.split('?')[0] || '#/';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GUEST / UNAUTHENTICATED ROUTES & AUTH GUARD
  // ──────────────────────────────────────────────────────────────────────────
  if (!user) {
    // Public page: Landing Page
    if (basePath === '#/' || basePath === '' || basePath === '#/landing') {
      return <LandingPage />;
    }

    // Public page: Login / Register Page
    if (basePath === '#/login') {
      return <LoginPage />;
    }

    // Protected Route Wall for unauthenticated guests
    const redirectUrl = `#/login?redirect=${encodeURIComponent(currentHash)}`;
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-primary-100 shadow-xl shadow-primary-100/50 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-500 mx-auto flex items-center justify-center shadow-inner">
            <Lock aria-hidden="true" className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
              Cổng Học Viên Hanzi4u
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Đăng Nhập Không Gian Học Tập Cá Nhân
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Đăng nhập để mở lộ trình thích ứng HSK 3.0, lưu điểm luyện viết chữ Hán, đo cao độ giọng nói F0 và đồng bộ thẻ nhớ SRS của riêng bạn.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={redirectUrl}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-primary-500/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <span>Đăng Nhập / Tạo Tài Khoản Học Thử</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </a>

            <a
              href="#/"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-primary-100 hover:bg-primary-50/50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Home aria-hidden="true" className="w-4 h-4 text-primary-400" />
              <span>Quay Lại Trang Chủ Hanzi4u</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED USER ROUTES
  // ──────────────────────────────────────────────────────────────────────────
  const renderCurrentPage = () => {
    if (basePath === '#/' || basePath === '' || basePath === '#/landing' || basePath === '#/login') {
      return <CourseListPage />;
    }

    if (basePath.startsWith('#/profile')) {
      return <ProfilePage />;
    }

    if (basePath.startsWith('#/onboarding') || basePath.startsWith('#/roadmap')) {
      return <OnboardingRoadmapPage />;
    }

    if (basePath.startsWith('#/courses/')) {
      const id = parseInt(basePath.replace('#/courses/', ''), 10);
      return <CourseDetailPage courseId={id || 1} />;
    }

    if (basePath.startsWith('#/lessons/')) {
      const id = parseInt(basePath.replace('#/lessons/', ''), 10);
      return <LessonPage lessonId={id || 1} />;
    }

    if (basePath === '#/pinyin') {
      return <PinyinPage />;
    }

    if (basePath === '#/characters') {
      return <CharacterPracticePage />;
    }

    if (basePath.startsWith('#/test-result/')) {
      const id = parseInt(basePath.replace('#/test-result/', ''), 10);
      return <TestResultPage submissionId={id || 1} />;
    }

    if (basePath.startsWith('#/test/')) {
      const id = parseInt(basePath.replace('#/test/', ''), 10);
      return <TestPage testId={id || 1} />;
    }

    if (basePath === '#/srs') {
      return <SrsReviewPage />;
    }

    // RBAC Guard for Admin CMS
    if (basePath.startsWith('#/admin')) {
      const canAccessCMS = user.role === 'ADMIN' || user.role === 'CONTENT_EDITOR';
      if (!canAccessCMS) {
        return (
          <div className="max-w-lg mx-auto my-20 px-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">403 - Không Có Quyền Truy Cập</h2>
            <p className="text-sm text-gray-500">
              Khu vực Quản trị CMS chỉ dành riêng cho vai trò <strong className="text-gray-800">ADMIN</strong> hoặc <strong className="text-gray-800">CONTENT_EDITOR</strong>. Tài khoản của bạn hiện là <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{user.role}</code>.
            </p>
            <a
              href="#/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Về Trang Khóa Học</span>
            </a>
          </div>
        );
      }
      return <AdminCMSPage />;
    }

    return <CourseListPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-50/30 via-white to-white text-gray-900 font-sans">
      <Navbar currentPath={currentHash} />
      <main className="flex-1 pb-16">{renderCurrentPage()}</main>
      <footer className="border-t border-primary-100 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-primary-500 text-white flex items-center justify-center font-chinese font-black text-sm">
              汉
            </span>
            <span className="font-bold text-gray-800">
              Hanzi<span className="text-primary-500">4u</span>
            </span>
            <span className="text-gray-400">• Nền Tảng Học Tiếng Trung Thông Minh Chuẩn HSK 3.0</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/courses" className="hover:text-primary-600 font-medium">Lộ trình HSK</a>
            <a href="#/pinyin" className="hover:text-primary-600 font-medium">Bảng Pinyin</a>
            <a href="#/characters" className="hover:text-primary-600 font-medium">Bảng Trắng Chữ Hán</a>
            <a href="#/srs" className="hover:text-primary-600 font-medium">Ôn tập SRS</a>
          </div>
          <p className="text-gray-400">© 2026 Hanzi4u (hanzi4u.id.vn). All rights reserved.</p>
        </div>
      </footer>
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
