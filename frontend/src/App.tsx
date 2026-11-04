import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { CourseListPage } from './pages/courses/CourseListPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { LessonPage } from './pages/lessons/LessonPage';
import { PinyinPage } from './pages/learning/PinyinPage';
import { CharacterPracticePage } from './pages/learning/CharacterPracticePage';
import { TestPage } from './pages/test/TestPage';
import { TestResultPage } from './pages/test/TestResultPage';
import { SrsReviewPage } from './pages/srs/SrsReviewPage';
import { AdminCMSPage } from './pages/admin/AdminCMSPage';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/courses');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/courses');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-2xl shadow-lg animate-pulse">
            🀄
          </span>
          <span className="text-sm font-bold text-gray-600">Đang khởi tạo ChinaEasy...</span>
        </div>
      </div>
    );
  }

  // Simple Hash Router pattern
  const renderCurrentPage = () => {
    if (currentHash === '#/login') {
      return <LoginPage />;
    }

    if (currentHash.startsWith('#/profile')) {
      return <ProfilePage />;
    }

    if (currentHash.startsWith('#/courses/')) {
      const id = parseInt(currentHash.replace('#/courses/', ''), 10);
      return <CourseDetailPage courseId={id || 1} />;
    }

    if (currentHash.startsWith('#/lessons/')) {
      const id = parseInt(currentHash.replace('#/lessons/', ''), 10);
      return <LessonPage lessonId={id || 1} />;
    }

    if (currentHash === '#/pinyin') {
      return <PinyinPage />;
    }

    if (currentHash === '#/characters') {
      return <CharacterPracticePage />;
    }

    if (currentHash.startsWith('#/test-result/')) {
      const id = parseInt(currentHash.replace('#/test-result/', ''), 10);
      return <TestResultPage submissionId={id || 1} />;
    }

    if (currentHash.startsWith('#/test/')) {
      const id = parseInt(currentHash.replace('#/test/', ''), 10);
      return <TestPage testId={id || 1} />;
    }

    if (currentHash === '#/srs') {
      return <SrsReviewPage />;
    }

    if (currentHash.startsWith('#/admin')) {
      return <AdminCMSPage />;
    }

    // Default: Course List Page
    return <CourseListPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Navbar currentPath={currentHash} />
      <main className="flex-1 pb-16">{renderCurrentPage()}</main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        <p>© 2026 ChinaEasy - Nền Tảng Học Tiếng Trung Sơ Cấp. Kiến trúc Modular Monolith chuẩn hóa theo báo cáo kỹ thuật.</p>
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
