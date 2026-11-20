import React, { useState, useEffect, startTransition } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HanziLogo } from './components/HanziLogo';
import { requestLandingBay } from './lib/scrollNavigation';
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
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      const next = window.location.hash || '#/';
      startTransition(() => {
        setCurrentHash(next);
      });
      if (
        !next.startsWith('#gioi-thieu') &&
        !next.startsWith('#thu-phong') &&
        !next.startsWith('#ghi-danh')
      ) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isStudent = user?.role === 'STUDENT';

  if (isLoading || (isStudent && hasCompletedOnboarding === null)) {
    return (
      <MeshBackground variant="light" className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <HanziLogo variant="light" size="md" showSubtitle={false} />
          <span className="text-xs font-medium text-[#6B5B4B]">Đang mở thư phòng Hanzi4U...</span>
        </div>
      </MeshBackground>
    );
  }

  const basePath = currentHash.split('?')[0] || '#/';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GUEST ROUTES (WARM ARCHIVAL HERITAGE × 3D × CHINESE STUDY WEBP)
  // ──────────────────────────────────────────────────────────────────────────
  if (!user) {
    if (
      basePath === '#/' ||
      basePath === '' ||
      basePath === '#/landing' ||
      basePath === '#gioi-thieu' ||
      basePath === '#thu-phong' ||
      basePath === '#ghi-danh'
    ) {
      return (
        <MeshBackground variant="light" className="min-h-screen flex flex-col">
          <Navbar currentPath={currentHash} theme="dark" />
          <main className="flex-1">
            <LandingPage />
          </main>

          {/* Heritage Forest-Jade Footer topped with Cinnabar Hairline (echoing libri.id.vn) */}
          <footer className="bg-[#1F3A2E] text-[#FBF7EC] border-t-2 border-[#7A2E2B]">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-5 space-y-3">
                <HanziLogo variant="dark" size="md" />
                <p className="text-xs text-[#FBF7EC]/70 leading-relaxed max-w-sm">
                  Thư phòng tự học tiếng Trung HSK 1–6 cho người Việt — tích hợp 63 âm Pinyin chuẩn,
                  mô phỏng thứ tự nét thư pháp, thẻ nhớ SRS và 48+ bộ đề luyện thi.
                </p>
              </div>

              <div className="md:col-span-4 space-y-2.5">
                <h3 className="font-editorial text-xs font-bold uppercase tracking-[0.18em] text-[#D4B26A]">
                  CHƯƠNG TRÌNH HSK 1 — 6
                </h3>
                <ul className="space-y-1.5 text-xs text-[#FBF7EC]/75">
                  <li>Bảng chữ cái 63 âm Pinyin & 4 thanh điệu</li>
                  <li>Tập viết chữ Hán trên ô Điền Tự Cách</li>
                  <li>30 Đề thi mô phỏng & 18 Bộ sách bài tập</li>
                </ul>
              </div>

              <div className="md:col-span-3 space-y-2.5">
                <h3 className="font-editorial text-xs font-bold uppercase tracking-[0.18em] text-[#D4B26A]">
                  LIÊN KẾT NHANH
                </h3>
                <div className="flex flex-col gap-1.5 text-xs text-[#FBF7EC]/75">
                  <a href="#/login?tab=register" className="hover:text-[#D4B26A] transition-colors">
                    Đăng ký học miễn phí
                  </a>
                  <a href="#/login" className="hover:text-[#D4B26A] transition-colors">
                    Đăng nhập tài khoản
                  </a>
                  <a
                    href="#thu-phong"
                    onClick={(e) => {
                      e.preventDefault();
                      requestLandingBay(0);
                    }}
                    className="hover:text-[#D4B26A] transition-colors"
                  >
                    Khám phá Thư phòng HSK
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-[#FBF7EC]/10 py-4 px-5 sm:px-8">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#FBF7EC]/55">
                <span>© 2026 Hanzi4U (hanzi4u.id.vn) — Học viện Hán ngữ trực tuyến</span>
                <span className="font-mono text-[#D4B26A]">Hanzi4U Edition · HSK 1–6</span>
              </div>
            </div>
          </footer>
        </MeshBackground>
      );
    }

    if (basePath === '#/login') {
      return (
        <MeshBackground variant="light" className="min-h-screen flex flex-col">
          <Navbar currentPath={currentHash} theme="dark" />
          <main className="flex-1 flex flex-col">
            <LoginPage />
          </main>
        </MeshBackground>
      );
    }

    const redirectUrl = `#/login?redirect=${encodeURIComponent(currentHash)}`;
    return (
      <MeshBackground variant="light" className="min-h-screen flex flex-col">
        <Navbar currentPath={currentHash} theme="dark" />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <GlassCard variant="light" className="max-w-md w-full p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-[8px] bg-[#1F3A2E] text-[#D4B26A] mx-auto flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-editorial font-bold text-[#2A2118]">Vui lòng đăng nhập</h2>
            <p className="text-sm text-[#6B5B4B] leading-relaxed">
              Đăng nhập tài khoản Hanzi4U để tiếp tục học và lưu tiến độ cá nhân hóa của bạn.
            </p>
            <div className="space-y-2.5 pt-2">
              <ShimmerButton href={redirectUrl} className="w-full">
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
              <a
                href="#/"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-[6px] border border-[#DECFAA] hover:bg-[#F3ECDC] text-[#2A2118] font-medium text-xs transition-colors"
              >
                <Home className="w-4 h-4 text-[#6B5B4B]" />
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
      <MeshBackground variant="light" className="text-[#2A2118] font-sans">
        <Sidebar currentPath={currentHash} />
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
  // 3. FIRST-TIME STUDENT ONBOARDING
  // ──────────────────────────────────────────────────────────────────────────
  if (hasCompletedOnboarding === false) {
    return (
      <MeshBackground variant="light" className="flex flex-col">
        <header className="sticky top-0 z-40 bg-[#1F3A2E] border-b border-[#B08D3C]/25 h-16 px-4 sm:px-6 flex items-center justify-center">
          <HanziLogo variant="dark" size="sm" />
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
  // 4. MAIN AUTHENTICATED WORKSPACE
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

    if (basePath === '#/courses' || basePath === '#/roadmap') return <CourseListPage />;
    if (basePath.startsWith('#/courses/')) {
      return <CourseDetailPage courseId={parseInt(basePath.replace('#/courses/', ''), 10) || 1} />;
    }
    if (basePath.startsWith('#/lessons/')) {
      return <LessonPage lessonId={parseInt(basePath.replace('#/lessons/', ''), 10) || 1} />;
    }
    if (basePath === '#/vocab') return <VocabPage initialTab="bank" />;
    if (basePath === '#/srs') return <VocabPage initialTab="srs" />;
    if (basePath === '#/characters') return <VocabPage initialTab="writing" />;
    if (basePath === '#/speak-learn' || basePath === '#/pinyin') return <PinyinPage />;
    if (basePath === '#/speak-practice') return <SpeakingPracticePage />;
    if (basePath === '#/exams') return <ExamListPage />;
    if (basePath.startsWith('#/test-result/')) {
      return (
        <TestResultPage submissionId={parseInt(basePath.replace('#/test-result/', ''), 10) || 1} />
      );
    }
    if (basePath.startsWith('#/test/')) {
      return <TestPage testId={parseInt(basePath.replace('#/test/', ''), 10) || 1} />;
    }
    if (basePath === '#/leaderboard') return <LeaderboardPage />;
    if (basePath === '#/progress') return <ProgressPage />;
    if (basePath.startsWith('#/profile')) return <ProfilePage />;
    if (basePath.startsWith('#/onboarding')) return <OnboardingRoadmapPage />;

    if (basePath.startsWith('#/admin')) {
      const canAccessCMS = user.role === 'ADMIN' || user.role === 'CONTENT_EDITOR';
      if (!canAccessCMS) {
        return (
          <div className="max-w-lg mx-auto my-20 px-4">
            <GlassCard className="p-8 text-center space-y-5">
              <div className="w-12 h-12 rounded-[8px] bg-[#7A2E2B]/10 border border-[#7A2E2B]/30 text-[#7A2E2B] mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-editorial font-bold text-[#2A2118]">
                403 - Không Có Quyền Truy Cập
              </h2>
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
    <MeshBackground variant="light" className="text-[#2A2118] font-sans">
      <Sidebar currentPath={currentHash} />
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
