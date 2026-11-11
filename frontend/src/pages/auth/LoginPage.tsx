import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Languages,
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const DEFAULT_GOOGLE_CLIENT_ID =
  '236710689789-ipu0ad4sdke0paakb5ujmu0ukq9b4mc9.apps.googleusercontent.com';

export const LoginPage: React.FC = () => {
  const { login, refreshSession } = useAuth();

  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<'form' | 'otp_verify'>('form');
  const [loginSubMode, setLoginSubMode] = useState<'password' | 'otp'>('password');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const getRedirectTarget = (isNewUser?: boolean): string => {
    const rawHash = window.location.hash || '';
    if (rawHash.includes('?')) {
      const queryStr = rawHash.split('?')[1];
      const params = new URLSearchParams(queryStr);
      const redirectParam = params.get('redirect');
      if (redirectParam) {
        return decodeURIComponent(redirectParam);
      }
    }
    return isNewUser ? '#/profile' : '#/courses';
  };

  // Read query params from URL hash (e.g. #/login?tab=register&redirect=%23%2Flessons%2F1 or ?google_oauth=success)
  useEffect(() => {
    const rawHash = window.location.hash || '';
    if (!rawHash.includes('?')) return;

    const queryStr = rawHash.split('?')[1];
    const params = new URLSearchParams(queryStr);

    const tabParam = params.get('tab');
    if (tabParam === 'register') setAuthTab('register');
    if (tabParam === 'login') setAuthTab('login');

    const googleError = params.get('google_error');
    if (googleError) {
      setErrorMessage(decodeURIComponent(googleError));
    }

    const googleOauth = params.get('google_oauth');
    if (googleOauth === 'success') {
      const isNew = params.get('is_new') === '1';
      setIsGoogleLoading(true);
      refreshSession()
        .then((ok) => {
          if (ok) {
            window.location.hash = getRedirectTarget(isNew);
          } else {
            setErrorMessage('Không thể đồng bộ phiên đăng nhập Google. Vui lòng thử lại.');
          }
        })
        .finally(() => setIsGoogleLoading(false));
      return;
    }

    const redirectParam = params.get('redirect');
    if (redirectParam && !googleError) {
      setInfoMessage('Vui lòng đăng nhập hoặc tạo tài khoản để tiếp tục vào học.');
    }
  }, []);

  // Countdown timer for 300s OTP TTL
  useEffect(() => {
    let timer: any;
    if (step === 'otp_verify' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const validateGmailFormat = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return (
      /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(normalized) ||
      /^[a-zA-Z0-9._%+-]+@chinaeasy\.vn$/i.test(normalized)
    );
  };

  /**
   * Gửi mã OTP xác thực Gmail (Dùng cho cả Đăng ký tài khoản mới lần đầu & Đăng nhập bằng OTP)
   */
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !validateGmailFormat(normalizedEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail hợp lệ có định dạng @gmail.com.');
      return;
    }

    if (authTab === 'register') {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setErrorMessage('Vui lòng nhập tên hiển thị tối thiểu 2 ký tự.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Vui lòng nhập mật khẩu tối thiểu 6 ký tự.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const payload: any = {
        email: normalizedEmail,
        mode: authTab === 'register' ? 'register' : 'login',
      };
      if (authTab === 'register') {
        payload.password = password;
        payload.displayName = displayName.trim();
      }

      const res = await api.post<{ message: string; expiresIn: number; senderEmail?: string }>(
        '/auth/otp/send',
        payload
      );
      setCountdown(res?.expiresIn || 300);
      setInfoMessage(
        res?.message || `Mã xác thực OTP 6 chữ số đã được gửi tới địa chỉ ${normalizedEmail}.`
      );
      setStep('otp_verify');
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi mã OTP.');
      if (err.data?.error?.code === 'OTP_ACCOUNT_LOCKED') {
        setIsLocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Đăng nhập bằng Gmail (@gmail.com) và Mật khẩu
   */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !validateGmailFormat(normalizedEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail hợp lệ có định dạng @gmail.com.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post<any>('/auth/login', {
        email: normalizedEmail,
        password,
      });
      login(res.accessToken, res.user);
      window.location.hash = getRedirectTarget();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextInput = document.getElementById(`otp-${Math.min(5, digits.length)}`);
      nextInput?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post<any>('/auth/otp/verify', {
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });
      login(res.accessToken, res.user);
      window.location.hash = getRedirectTarget(res.isNewUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Mã OTP không chính xác.');
      if (
        err.data?.error?.code === 'OTP_ACCOUNT_LOCKED' ||
        err.data?.error?.code === 'OTP_MAX_ATTEMPTS_EXCEEDED'
      ) {
        setIsLocked(true);
      }
      if (err.data?.error?.details?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.error.details.remainingAttempts);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Đăng nhập Google OAuth2 thật qua Google Identity Services (Popup chọn tài khoản Google thật)
   * hoặc chuyển hướng sang OAuth2 Authorization Code Flow nếu trình duyệt chặn popup.
   */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const rawHash = window.location.hash || '';
      const redirectState = rawHash.includes('?')
        ? new URLSearchParams(rawHash.split('?')[1]).get('redirect') || ''
        : '';

      let clientId = DEFAULT_GOOGLE_CLIENT_ID;
      let authUrl = '';

      try {
        const config = await api.get<{ clientId: string; authUrl: string }>('/auth/google/config', {
          params: redirectState ? { state: redirectState } : undefined,
        });
        if (config?.clientId) clientId = config.clientId;
        if (config?.authUrl) authUrl = config.authUrl;
      } catch {
        // Sử dụng DEFAULT_GOOGLE_CLIENT_ID nếu không tải được config
      }

      const googleOAuth2 = window.google?.accounts?.oauth2;

      if (googleOAuth2) {
        const tokenClient = googleOAuth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              setIsGoogleLoading(false);
              if (tokenResponse.error !== 'access_denied') {
                setErrorMessage(
                  tokenResponse.error_description || 'Không thể xác thực tài khoản Google.'
                );
              }
              return;
            }

            try {
              const res = await api.post<any>('/auth/google', {
                accessToken: tokenResponse.access_token,
              });
              login(res.accessToken, res.user);
              window.location.hash = getRedirectTarget(res.isNewUser);
            } catch (err: any) {
              setErrorMessage(err.message || 'Đăng nhập bằng Google OAuth2 thất bại.');
            } finally {
              setIsGoogleLoading(false);
            }
          },
          error_callback: (err) => {
            setIsGoogleLoading(false);
            if (err?.type === 'popup_failed_to_open' && authUrl) {
              window.location.href = authUrl;
              return;
            }
            if (err?.type !== 'popup_closed') {
              setErrorMessage('Cửa sổ đăng nhập Google đã đóng hoặc bị chặn bởi trình duyệt.');
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // Fallback: Chuyển hướng sang Google OAuth2 Authorization Code Flow nếu script GIS chưa sẵn sàng
      if (authUrl) {
        window.location.href = authUrl;
        return;
      }

      setErrorMessage(
        'Không thể khởi tạo Google Identity Services. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
      setIsGoogleLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập bằng Google thất bại.');
      setIsGoogleLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white items-center justify-center shadow-lg shadow-primary-500/20 mb-4">
            <Languages className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Chào mừng đến với <span className="text-primary-600">ChinaEasy</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Nền tảng học tiếng Trung sơ cấp HSK chuẩn hóa cho người Việt
          </p>
        </div>

        {/* Mode Switcher Tabs (Only visible before OTP step) */}
        {step === 'form' && (
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setErrorMessage(null);
              }}
              className={`min-h-[42px] py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                authTab === 'register'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Đăng ký lần đầu (Guest)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setErrorMessage(null);
              }}
              className={`min-h-[42px] py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                authTab === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Đăng nhập tài khoản
            </button>
          </div>
        )}

        {/* Redirect / Status Info Notice */}
        {infoMessage && step === 'form' && !errorMessage && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-medium flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              {remainingAttempts !== null && !isLocked && (
                <p className="text-xs text-red-600">
                  Cảnh báo: Nhập sai quá 5 lần sẽ khóa tài khoản trong 15 phút.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Alert (Email Dispatched Notice - NO OTP SHOWN ON UI) */}
        {infoMessage && step === 'otp_verify' && !errorMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1A: First-Time Guest Registration (Gmail @gmail.com + Password -> OTP) */}
        {step === 'form' && authTab === 'register' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="register-display-name"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Họ và tên hiển thị
              </label>
              <div className="relative">
                <UserIcon
                  className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="register-display-name"
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Địa chỉ Gmail (@gmail.com)
              </label>
              <div className="relative">
                <Mail
                  className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="register-email"
                  type="email"
                  required
                  placeholder="ten_cua_ban@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {isSubmitting ? 'Đang gửi mã OTP...' : 'Đăng ký & Gửi mã OTP xác thực'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase">hoặc</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleLoading}
              className="w-full min-h-[48px] flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isGoogleLoading ? 'Đang kết nối Google OAuth2...' : 'Tiếp tục với Google OAuth2'}
            </button>
          </form>
        )}

        {/* STEP 1B: Existing User Login (Password or Email OTP or Google OAuth2) */}
        {step === 'form' && authTab === 'login' && (
          <form
            onSubmit={loginSubMode === 'password' ? handlePasswordLogin : handleSendOtp}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Địa chỉ Gmail (@gmail.com)
              </label>
              <div className="relative">
                <Mail
                  className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="ten_cua_ban@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {loginSubMode === 'password' && (
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : loginSubMode === 'password'
                  ? 'Đăng nhập vào học'
                  : 'Gửi mã xác thực OTP qua Gmail'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginSubMode((prev) => (prev === 'password' ? 'otp' : 'password'));
                setErrorMessage(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 py-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
              {loginSubMode === 'password'
                ? 'Chuyển sang đăng nhập bằng mã Email OTP (Không cần mật khẩu)'
                : 'Chuyển sang đăng nhập bằng Mật khẩu'}
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase">hoặc</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleLoading}
              className="w-full min-h-[48px] flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isGoogleLoading ? 'Đang kết nối Google OAuth2...' : 'Tiếp tục với Google OAuth2'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter & Verify 6-Digit OTP */}
        {step === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs text-gray-500">Mã xác thực 6 chữ số đã gửi đến Gmail</span>
              <p className="text-sm font-bold text-gray-900">{email}</p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  aria-label={`Chữ số OTP thứ ${idx + 1}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={isLocked}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 text-gray-500 font-mono">
                <ShieldCheck className="w-4 h-4 text-primary-500" aria-hidden="true" />
                Hiệu lực: <span className="font-bold text-gray-900">{formatTimer(countdown)}</span>
              </div>

              <button
                type="button"
                disabled={countdown > 0 || isSubmitting || isLocked}
                onClick={() => handleSendOtp()}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold cursor-pointer disabled:opacity-40 disabled:hover:text-primary-600"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Gửi lại mã
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Xác thực OTP & Hoàn tất'}
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              ← Quay lại chỉnh sửa thông tin Gmail
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
