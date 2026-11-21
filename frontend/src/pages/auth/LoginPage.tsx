import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { HanziLogoMark } from '../../components/HanziLogo';
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
  Eye,
  EyeOff,
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

type AuthStep = 'form' | 'otp_verify' | 'forgot_email' | 'forgot_reset';

export const LoginPage: React.FC = () => {
  const { login, refreshSession } = useAuth();

  // Mặc định vào là Đăng nhập
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<AuthStep>('form');
  const [loginSubMode, setLoginSubMode] = useState<'password' | 'otp'>('password');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const clearAlerts = () => {
    setErrorMessage(null);
    setErrorCode(null);
    setRemainingAttempts(null);
  };

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
    return isNewUser ? '#/onboarding' : '#/courses';
  };

  // Sync authTab whenever URL hash changes (handles clicking Navbar links while on #/login)
  useEffect(() => {
    const syncFromHash = (isInitial = false) => {
      const rawHash = window.location.hash || '';
      const queryStr = rawHash.includes('?') ? rawHash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);

      const tabParam = params.get('tab');
      if (tabParam === 'register') {
        setAuthTab('register');
        setStep('form');
        clearAlerts();
      } else if (tabParam === 'login' || !tabParam) {
        setAuthTab('login');
        setStep('form');
        clearAlerts();
      }

      const googleError = params.get('google_error');
      if (googleError) {
        setErrorMessage(decodeURIComponent(googleError));
      }

      if (isInitial) {
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
      }
    };

    syncFromHash(true);
    const onHash = () => syncFromHash(false);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Countdown timer for 300s OTP TTL (both login/register OTP and forgot-password OTP)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if ((step === 'otp_verify' || step === 'forgot_reset') && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const validateEmailFormat = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  };

  const validateGmailFormat = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return (
      /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(normalized) ||
      /^[a-zA-Z0-9._%+-]+@hanzi4u\.id\.vn$/i.test(normalized) ||
      /^[a-zA-Z0-9._%+-]+@chinaeasy\.vn$/i.test(normalized)
    );
  };

  /** Gửi mã OTP xác thực Gmail (Đăng ký tài khoản mới hoặc Đăng nhập bằng OTP) */
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !validateGmailFormat(normalizedEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail hợp lệ (vd: ten_cua_ban@gmail.com).');
      setErrorCode('INVALID_EMAIL');
      return;
    }

    if (authTab === 'register') {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setErrorMessage('Vui lòng nhập họ và tên tối thiểu 2 ký tự.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Mật khẩu cần có tối thiểu 6 ký tự.');
        return;
      }
    }

    setIsSubmitting(true);
    clearAlerts();
    setInfoMessage(null);
    setSuccessMessage(null);

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
      setIsLocked(false);
      setInfoMessage(
        res?.message || `Mã xác thực OTP 6 chữ số đã được gửi tới địa chỉ ${normalizedEmail}.`
      );
      setStep('otp_verify');
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Không thể gửi mã OTP.');
      if (code === 'OTP_ACCOUNT_LOCKED') {
        setIsLocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Đăng nhập bằng Email và Mật khẩu */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !validateEmailFormat(normalizedEmail)) {
      setErrorMessage('Địa chỉ email không đúng định dạng (vd: ten_cua_ban@gmail.com).');
      setErrorCode('INVALID_EMAIL');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    clearAlerts();
    setSuccessMessage(null);

    try {
      const res = await api.post<any>('/auth/login', {
        email: normalizedEmail,
        password,
      });
      login(res.accessToken, res.user);
      window.location.hash = getRedirectTarget();
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      if (err.data?.error?.details?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.error.details.remainingAttempts);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Quên mật khẩu (Bước 1): Gửi mã OTP về Gmail */
  const handleForgotSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !validateEmailFormat(normalizedEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ email đã đăng ký tài khoản.');
      setErrorCode('INVALID_EMAIL');
      return;
    }

    setIsSubmitting(true);
    clearAlerts();
    setInfoMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post<{ message: string; expiresIn: number }>('/auth/password/forgot', {
        email: normalizedEmail,
      });
      setCountdown(res?.expiresIn || 300);
      setIsLocked(false);
      setInfoMessage(
        res?.message || `Mã OTP đặt lại mật khẩu đã được gửi tới ${normalizedEmail}.`
      );
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setStep('forgot_reset');
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Không thể gửi mã OTP đặt lại mật khẩu.');
      if (code === 'OTP_ACCOUNT_LOCKED') {
        setIsLocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Quên mật khẩu (Bước 2): Xác nhận mã OTP từ Gmail và đặt mật khẩu mới */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP đã gửi về Gmail.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận chưa trùng khớp với mật khẩu mới.');
      return;
    }

    setIsSubmitting(true);
    clearAlerts();

    try {
      const res = await api.post<{ message: string }>('/auth/password/reset', {
        email: email.trim().toLowerCase(),
        otp: fullOtp,
        newPassword,
      });
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '', '']);
      setAuthTab('login');
      setLoginSubMode('password');
      setStep('form');
      setInfoMessage(null);
      setSuccessMessage(
        res?.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
      );
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Không thể đặt lại mật khẩu.');
      if (code === 'OTP_ACCOUNT_LOCKED' || code === 'OTP_MAX_ATTEMPTS_EXCEEDED') {
        setIsLocked(true);
      }
      if (err.data?.error?.details?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.error.details.remainingAttempts);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string, prefix = 'otp') => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextInput = document.getElementById(`${prefix}-${Math.min(5, digits.length)}`);
      nextInput?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`${prefix}-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    prefix = 'otp'
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`${prefix}-${index - 1}`);
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
    clearAlerts();

    try {
      const res = await api.post<any>('/auth/otp/verify', {
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });
      login(res.accessToken, res.user);
      window.location.hash = getRedirectTarget(res.isNewUser);
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Mã OTP không chính xác.');
      if (code === 'OTP_ACCOUNT_LOCKED' || code === 'OTP_MAX_ATTEMPTS_EXCEEDED') {
        setIsLocked(true);
      }
      if (err.data?.error?.details?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.error.details.remainingAttempts);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Đăng nhập Google OAuth2 qua GIS Popup hoặc Authorization Code Flow fallback */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    clearAlerts();
    setSuccessMessage(null);

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
        // Fallback sang DEFAULT_GOOGLE_CLIENT_ID
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

  const openForgotPasswordFlow = () => {
    clearAlerts();
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsLocked(false);
    setStep('forgot_email');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE3DE] bg-white text-sm text-[#181415] placeholder-[#8C7F82] focus:outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 transition-all';

  const passwordInputCls =
    'w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#EAE3DE] bg-white text-sm text-[#181415] placeholder-[#8C7F82] focus:outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 transition-all';

  const submitBtnCls =
    'w-full h-10 px-5 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(196,30,58,0.5)] transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none';

  const GoogleIcon = (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
  );

  const isForgotStep = step === 'forgot_email' || step === 'forgot_reset';

  return (
    <div className="relative flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#FAF8F6]">
      {/* Real Chinese Study Desk .webp Backdrop */}
      <img
        src="/images/login-study-desk.webp"
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAF8F6]/75 via-[#FAF8F6]/80 to-[#FAF8F6]/92"
      />

      <div className="relative z-10 w-full max-w-[436px] space-y-5">
        <div className="p-7 sm:p-8 space-y-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAE3DE] border-t-[3px] border-t-[#C41E3A] shadow-[0_22px_50px_-20px_rgba(24,20,21,0.18)]">
          {/* Header with Bespoke Hanzi4U Crimson Seal */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center mb-1">
              <HanziLogoMark variant="light" className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-[#181415] tracking-tight">
              {isForgotStep ? (
                'Đặt lại mật khẩu'
              ) : (
                <>
                  Chào mừng đến với <span className="text-[#C41E3A]">Hanzi4U</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-[#5F5658]">
              {step === 'forgot_email'
                ? 'Nhập Gmail đã đăng ký để nhận mã xác thực OTP'
                : step === 'forgot_reset'
                  ? 'Nhập mã OTP từ Gmail và tạo mật khẩu mới của bạn'
                  : 'Bắt đầu hành trình chinh phục tiếng Trung HSK'}
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          {step === 'form' && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#FAF8F6] border border-[#EAE3DE]">
              {(['login', 'register'] as const).map((tab) => {
                const active = authTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setAuthTab(tab);
                      clearAlerts();
                      setSuccessMessage(null);
                    }}
                    className={`relative min-h-[38px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] ${
                      active ? 'text-white' : 'text-[#5F5658] hover:text-[#181415]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-tab-pill"
                        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                        className="absolute inset-0 rounded-lg bg-[#C41E3A] shadow-xs"
                      />
                    )}
                    <span className="relative z-10">
                      {tab === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Success Alert (e.g. after password reset) */}
          {successMessage && !errorMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Info Notice */}
          {infoMessage && step === 'form' && !errorMessage && !successMessage && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D4A017] shrink-0" aria-hidden="true" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error Alert with Smart Contextual Shortcut */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-[#9E162E] text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#C41E3A] mt-0.5" aria-hidden="true" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold leading-snug">{errorMessage}</p>
                {remainingAttempts !== null && !isLocked && step !== 'form' && (
                  <p className="text-[11px] text-[#9E162E]/85">
                    Lưu ý: Nhập sai quá 5 lần sẽ tạm khóa xác thực trong 15 phút.
                  </p>
                )}

                {errorCode === 'ACCOUNT_NOT_FOUND' && (step === 'form' || step === 'forgot_email') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setStep('form');
                      clearAlerts();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#C41E3A] hover:text-[#9E162E] underline underline-offset-2 cursor-pointer"
                  >
                    <span>Tạo tài khoản mới với email này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {(errorCode === 'PASSWORD_NOT_SET' ||
                  errorCode === 'INVALID_PASSWORD' ||
                  errorCode === 'LOGIN_ACCOUNT_LOCKED') &&
                  step === 'form' && (
                    <button
                      type="button"
                      onClick={openForgotPasswordFlow}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#C41E3A] hover:text-[#9E162E] underline underline-offset-2 cursor-pointer"
                    >
                      <span>Quên mật khẩu? Đặt lại qua Gmail OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                {errorCode === 'EMAIL_ALREADY_REGISTERED' && step === 'form' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setLoginSubMode('password');
                      clearAlerts();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#C41E3A] hover:text-[#9E162E] underline underline-offset-2 cursor-pointer"
                  >
                    <span>Chuyển sang tab Đăng nhập</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* OTP Dispatched Alert */}
          {infoMessage && (step === 'otp_verify' || step === 'forgot_reset') && !errorMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" aria-hidden="true" />
              <span>{infoMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1A: Register */}
            {step === 'form' && authTab === 'register' && (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.16 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="register-display-name"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Họ và tên
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="register-display-name"
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="register-email"
                      type="email"
                      required
                      placeholder="ten_cua_ban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={passwordInputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3.5 top-3 text-[#8C7F82] hover:text-[#181415] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className={submitBtnCls}
                >
                  <span>{isSubmitting ? 'Đang gửi mã xác nhận...' : 'Tiếp tục'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-[#EAE3DE] w-full" />
                  <span className="px-3 text-[11px] text-[#8C7F82] font-medium uppercase">hoặc</span>
                  <div className="border-t border-[#EAE3DE] w-full" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full h-10 flex items-center justify-center gap-2.5 px-4 rounded-xl border border-[#EAE3DE] bg-white hover:bg-[#FAF8F6] hover:border-[#C41E3A]/35 text-[#181415] font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {GoogleIcon}
                  <span>{isGoogleLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}</span>
                </button>
              </motion.form>
            )}

            {/* STEP 1B: Login */}
            {step === 'form' && authTab === 'login' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                onSubmit={loginSubMode === 'password' ? handlePasswordLogin : handleSendOtp}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="ten_cua_ban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {loginSubMode === 'password' && (
                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-[#181415] mb-1.5"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock
                        className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                        aria-hidden="true"
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Nhập mật khẩu của bạn"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={passwordInputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3.5 top-3 text-[#8C7F82] hover:text-[#181415] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={openForgotPasswordFlow}
                        className="text-xs font-semibold text-[#5F5658] hover:text-[#C41E3A] transition-colors cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className={submitBtnCls}
                >
                  <span>
                    {isSubmitting
                      ? 'Đang xử lý...'
                      : loginSubMode === 'password'
                        ? 'Đăng nhập'
                        : 'Gửi mã xác nhận'}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginSubMode((prev) => (prev === 'password' ? 'otp' : 'password'));
                    clearAlerts();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#5F5658] hover:text-[#C41E3A] py-1 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {loginSubMode === 'password'
                      ? 'Đăng nhập bằng mã gửi qua email'
                      : 'Đăng nhập bằng mật khẩu'}
                  </span>
                </button>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-[#EAE3DE] w-full" />
                  <span className="px-3 text-[11px] text-[#8C7F82] font-medium uppercase">hoặc</span>
                  <div className="border-t border-[#EAE3DE] w-full" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full h-10 flex items-center justify-center gap-2.5 px-4 rounded-xl border border-[#EAE3DE] bg-white hover:bg-[#FAF8F6] hover:border-[#C41E3A]/35 text-[#181415] font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {GoogleIcon}
                  <span>{isGoogleLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}</span>
                </button>
              </motion.form>
            )}

            {/* STEP 2: Login / Register OTP Verify */}
            {step === 'otp_verify' && (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div className="text-center space-y-1">
                  <span className="text-xs text-[#5F5658]">Mã xác nhận 6 chữ số đã gửi đến</span>
                  <p className="text-sm font-semibold text-[#181415]">{email}</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      aria-label={`Chữ số OTP thứ ${idx + 1}`}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value, 'otp')}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e, 'otp')}
                      disabled={isLocked}
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-[#EAE3DE] bg-white text-[#181415] focus:outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-1.5 text-[#5F5658] font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#C41E3A]" aria-hidden="true" />
                    Hiệu lực: <span className="font-semibold text-[#181415]">{formatTimer(countdown)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={countdown > 0 || isSubmitting || isLocked}
                    onClick={() => handleSendOtp()}
                    className="flex items-center gap-1 text-[#C41E3A] hover:text-[#9E162E] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Gửi lại mã
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className={submitBtnCls}
                >
                  <span>{isSubmitting ? 'Đang xác nhận...' : 'Xác nhận & Đăng nhập'}</span>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    clearAlerts();
                    setInfoMessage(null);
                  }}
                  className="w-full text-center text-xs text-[#5F5658] hover:text-[#181415] transition-colors cursor-pointer"
                >
                  ← Quay lại chỉnh sửa email
                </button>
              </motion.form>
            )}

            {/* STEP 3A: Forgot Password — Request Gmail OTP */}
            {step === 'forgot_email' && (
              <motion.form
                key="forgot-email-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleForgotSendOtp}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Email tài khoản
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="ten_cua_ban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={submitBtnCls}>
                  <span>{isSubmitting ? 'Đang gửi mã OTP...' : 'Gửi mã OTP về Gmail'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setAuthTab('login');
                    clearAlerts();
                    setInfoMessage(null);
                  }}
                  className="w-full text-center text-xs text-[#5F5658] hover:text-[#181415] transition-colors cursor-pointer pt-1"
                >
                  ← Quay lại Đăng nhập
                </button>
              </motion.form>
            )}

            {/* STEP 3B: Forgot Password — Enter OTP + New Password */}
            {step === 'forgot_reset' && (
              <motion.form
                key="forgot-reset-form"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <span className="text-xs text-[#5F5658]">Mã OTP đặt lại mật khẩu đã gửi tới</span>
                  <p className="text-sm font-bold text-[#181415]">{email}</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`reset-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      aria-label={`Mã OTP đặt lại mật khẩu số ${idx + 1}`}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value, 'reset-otp')}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e, 'reset-otp')}
                      disabled={isLocked}
                      className="w-11 h-12 text-center text-lg font-extrabold rounded-xl border border-[#EAE3DE] bg-white text-[#181415] focus:outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-1.5 text-[#5F5658] font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#C41E3A]" aria-hidden="true" />
                    Hiệu lực: <span className="font-bold text-[#181415]">{formatTimer(countdown)}</span>
                  </div>
                  <button
                    type="button"
                    disabled={countdown > 0 || isSubmitting || isLocked}
                    onClick={() => handleForgotSendOtp()}
                    className="flex items-center gap-1 text-[#C41E3A] hover:text-[#9E162E] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Gửi lại mã
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLocked}
                      className={passwordInputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3.5 top-3 text-[#8C7F82] hover:text-[#181415] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="block text-xs font-semibold text-[#181415] mb-1.5"
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7F82]"
                      aria-hidden="true"
                    />
                    <input
                      id="reset-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLocked}
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className={submitBtnCls}
                >
                  <span>{isSubmitting ? 'Đang cập nhật mật khẩu...' : 'Xác nhận đặt lại mật khẩu'}</span>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot_email');
                    clearAlerts();
                    setInfoMessage(null);
                  }}
                  className="w-full text-center text-xs text-[#5F5658] hover:text-[#181415] transition-colors cursor-pointer"
                >
                  ← Đổi email khác
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-[#5F5658]">
          Bằng cách tiếp tục, bạn đồng ý với điều khoản sử dụng của Hanzi4U.
        </p>
      </div>
    </div>
  );
};
