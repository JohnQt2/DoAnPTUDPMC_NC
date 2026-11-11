import React, {
  useEffect,
  useState,
} from 'react';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { Navbar } from './components/Navbar';

import {
  ArrowRight,
  Home,
  Lock,
  ShieldAlert,
} from 'lucide-react';

// Public pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';

// Student pages
import { ProfilePage } from './pages/profile/ProfilePage';
import { LearningSurveyPage } from './pages/profile/LearningSurveyPage';
import { CourseListPage } from './pages/courses/CourseListPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { LessonPage } from './pages/lessons/LessonPage';
import { PinyinPage } from './pages/learning/PinyinPage';
import { CharacterPracticePage } from './pages/learning/CharacterPracticePage';
import { TestPage } from './pages/test/TestPage';
import { TestResultPage } from './pages/test/TestResultPage';
import { SrsReviewPage } from './pages/srs/SrsReviewPage';

// Admin pages
import { AdminCMSPage } from './pages/admin/AdminCMSPage';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  const [currentHash, setCurrentHash] =
    useState(
      window.location.hash || '#/'
    );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(
        window.location.hash || '#/'
      );

      window.scrollTo(0, 0);
    };

    window.addEventListener(
      'hashchange',
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange
      );
    };
  }, []);

  /**
   * Chuẩn hóa đường dẫn hash bằng cách
   * bỏ phần query string.
   *
   * Ví dụ:
   * #/login?redirect=%23%2Fprofile
   * trở thành:
   * #/login
   */
  const basePath =
    currentHash.split('?')[0] || '#/';

  /**
   * Đang khôi phục phiên đăng nhập bằng
   * Refresh Token.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-chinese font-black text-2xl shadow-lg motion-safe:animate-pulse"
          >
            中
          </span>

          <span className="text-sm font-bold text-gray-600">
            Đang khởi tạo ChinaEasy...
          </span>
        </div>
      </div>
    );
  }

  /**
   * GUEST ROUTES
   */
  if (!user) {
    if (
      basePath === '#/' ||
      basePath === '' ||
      basePath === '#/landing'
    ) {
      return <LandingPage />;
    }

    if (basePath === '#/login') {
      return <LoginPage />;
    }

    const redirectUrl =
      `#/login?redirect=${encodeURIComponent(
        currentHash
      )}`;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto py-16 px-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-xl shadow-gray-200/50 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center shadow-inner">
              <Lock
                aria-hidden="true"
                className="w-8 h-8"
              />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider">
                Yêu cầu đăng nhập
              </span>

              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Bắt Đầu Hành Trình Học
                Tiếng Trung
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                Trang bạn vừa truy cập yêu
                cầu tài khoản học viên để hệ
                thống ghi nhận kết quả, lưu
                tiến độ và cá nhân hóa lộ
                trình học tập.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={redirectUrl}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-primary-600/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                <span>
                  Đăng Nhập / Tạo Tài
                  Khoản Ngay
                </span>

                <ArrowRight
                  aria-hidden="true"
                  className="w-4 h-4"
                />
              </a>

              <a
                href="#/"
                className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <Home
                  aria-hidden="true"
                  className="w-4 h-4 text-gray-400"
                />

                <span>
                  Quay Lại Trang Chủ Giới
                  Thiệu
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * AUTHENTICATED ROUTES
   */
  const renderCurrentPage = () => {
    /**
     * Người dùng đã đăng nhập truy cập
     * trang gốc hoặc trang đăng nhập sẽ
     * được đưa đến danh sách khóa học.
     */
    if (
      basePath === '#/' ||
      basePath === '' ||
      basePath === '#/landing' ||
      basePath === '#/login'
    ) {
      return <CourseListPage />;
    }

    /**
     * Khảo sát nhu cầu học tập.
     *
     * Route này phải đặt trước route hồ sơ
     * tổng quát để dễ đọc và tránh xung đột
     * nếu sau này đổi thành route con.
     */
    if (basePath === '#/learning-survey') {
      return <LearningSurveyPage />;
    }

    /**
     * Hồ sơ cá nhân.
     */
    if (basePath === '#/profile') {
      return <ProfilePage />;
    }

    /**
     * Danh sách khóa học.
     */
    if (basePath === '#/courses') {
      return <CourseListPage />;
    }

    /**
     * Chi tiết khóa học.
     */
    if (
      basePath.startsWith('#/courses/')
    ) {
      const courseId = parseInt(
        basePath.replace(
          '#/courses/',
          ''
        ),
        10
      );

      return (
        <CourseDetailPage
          courseId={courseId || 1}
        />
      );
    }

    /**
     * Chi tiết bài học.
     */
    if (
      basePath.startsWith('#/lessons/')
    ) {
      const lessonId = parseInt(
        basePath.replace(
          '#/lessons/',
          ''
        ),
        10
      );

      return (
        <LessonPage
          lessonId={lessonId || 1}
        />
      );
    }

    /**
     * Luyện Pinyin.
     */
    if (basePath === '#/pinyin') {
      return <PinyinPage />;
    }

    /**
     * Luyện chữ Hán.
     */
    if (basePath === '#/characters') {
      return <CharacterPracticePage />;
    }

    /**
     * Kết quả bài kiểm tra.
     * Phải đặt trước route /test/:id.
     */
    if (
      basePath.startsWith(
        '#/test-result/'
      )
    ) {
      const submissionId = parseInt(
        basePath.replace(
          '#/test-result/',
          ''
        ),
        10
      );

      return (
        <TestResultPage
          submissionId={
            submissionId || 1
          }
        />
      );
    }

    /**
     * Làm bài kiểm tra.
     */
    if (
      basePath.startsWith('#/test/')
    ) {
      const testId = parseInt(
        basePath.replace(
          '#/test/',
          ''
        ),
        10
      );

      return (
        <TestPage
          testId={testId || 1}
        />
      );
    }

    /**
     * Ôn tập SRS.
     */
    if (basePath === '#/srs') {
      return <SrsReviewPage />;
    }

    /**
     * Khu vực CMS có RBAC.
     */
    if (
      basePath.startsWith('#/admin')
    ) {
      const canAccessCMS =
        user.role === 'ADMIN' ||
        user.role ===
        'CONTENT_EDITOR';

      if (!canAccessCMS) {
        return (
          <div className="max-w-lg mx-auto my-20 px-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              403 - Không Có Quyền Truy
              Cập
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed">
              Khu vực Quản trị CMS chỉ
              dành cho vai trò{' '}
              <strong className="text-gray-800">
                ADMIN
              </strong>{' '}
              hoặc{' '}
              <strong className="text-gray-800">
                CONTENT_EDITOR
              </strong>
              . Tài khoản hiện tại có vai
              trò{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                {user.role}
              </code>
              .
            </p>

            <a
              href="#/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>
                Về Trang Khóa Học
              </span>
            </a>
          </div>
        );
      }

      return <AdminCMSPage />;
    }

    /**
     * Route không tồn tại:
     * quay về danh sách khóa học.
     */
    return <CourseListPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Navbar currentPath={currentHash} />

      <main className="flex-1 pb-16">
        {renderCurrentPage()}
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-400">
        <p>
          © 2026 ChinaEasy - Nền Tảng
          Học Tiếng Trung Sơ Cấp. Kiến
          trúc Modular Monolith chuẩn hóa
          theo báo cáo kỹ thuật.
        </p>
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