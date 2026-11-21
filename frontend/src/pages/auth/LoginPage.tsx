import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { HanziLogoMark } from '../../components/HanziLogo';
import { SunbeamDustOverlay } from '../../components/landing/ArchitecturalOrnaments';
import { AnimatedOtpInput } from '../../components/auth/AuthFormControls';
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
  Check,
  Clock,
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

type AuthStep = 'form' | 'otp_verify' | 'forgot_email' | 'forgot_otp' | 'forgot_new_password';

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
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [otpShakeKey, setOtpShakeKey] = useState(0);
  const [countdown, setCountdown] = useState(300);
  const [actionCooldown, setActionCooldown] = useState(0);
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

  const applyRateLimitCooldown = (err: any) => {
    const code = err?.data?.error?.code;
    if (err?.status === 429 || code === 'RATE_LIMIT_EXCEEDED') {
      const rawSec = Number(
        err?.retryAfterSeconds ?? err?.data?.error?.details?.remainingSeconds ?? 30
      );
      const seconds = Number.isFinite(rawSec) && rawSec > 0 ? Math.min(300, Math.ceil(rawSec)) : 30;
      setActionCooldown(seconds);
    }
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
    if ((step === 'otp_verify' || step === 'forgot_otp') && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Live cooldown countdown when rate-limited (HTTP 429) so users know exact wait time
  useEffect(() => {
    if (actionCooldown <= 0) return;
    const timer = setInterval(() => {
      setActionCooldown((prev) => {
        if (prev <= 1) {
          setErrorCode((cur) => {
            if (cur === 'RATE_LIMIT_EXCEEDED') {
              setErrorMessage(null);
              return null;
            }
            return cur;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [actionCooldown > 0]);

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
      setErrorMessage(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau ít giây.');
      applyRateLimitCooldown(err);
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
      applyRateLimitCooldown(err);
      if (err.data?.error?.details?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.error.details.remainingAttempts);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Quên mật khẩu (Bước 1/3): Gửi mã OTP về Gmail */
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
      setResetToken(null);
      setInfoMessage(
        res?.message || `Mã OTP đặt lại mật khẩu đã được gửi tới ${normalizedEmail}.`
      );
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setStep('forgot_otp');
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Không thể gửi mã OTP đặt lại mật khẩu.');
      applyRateLimitCooldown(err);
      if (code === 'OTP_ACCOUNT_LOCKED') {
        setIsLocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Quên mật khẩu (Bước 2/3): Xác thực riêng mã OTP 6 chữ số trước khi mở form đổi mật khẩu */
  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP đã gửi về Gmail.');
      setOtpShakeKey((k) => k + 1);
      return;
    }

    setIsSubmitting(true);
    clearAlerts();

    try {
      const res = await api.post<{ message: string; resetToken: string; expiresIn: number }>(
        '/auth/password/verify-otp',
        {
          email: email.trim().toLowerCase(),
          otp: fullOtp,
        }
      );
      setResetToken(res.resetToken);
      setNewPassword('');
      setConfirmPassword('');
      setInfoMessage(
        res?.message || 'Xác thực OTP thành công! Bạn có thể tạo mật khẩu mới ngay bây giờ.'
      );
      setStep('forgot_new_password');
    } catch (err: any) {
      const code = err.data?.error?.code || null;
      setErrorCode(code);
      setErrorMessage(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      setOtpShakeKey((k) => k + 1);
      applyRateLimitCooldown(err);
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

  /** Quên mật khẩu (Bước 3/3): Đặt mật khẩu mới sau khi đã xác thực OTP thành công */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setErrorMessage('Phiên xác thực OTP đã hết hạn. Vui lòng xác thực lại từ đầu.');
      setStep('forgot_email');
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
        resetToken,
        newPassword,
      });
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '', '']);
      setResetToken(null);
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
      applyRateLimitCooldown(err);
      if (code === 'RESET_TOKEN_INVALID' || code === 'RESET_TOKEN_EXPIRED') {
        setResetToken(null);
        setStep('forgot_email');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.');
      setOtpShakeKey((k) => k + 1);
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
      setOtpShakeKey((k) => k + 1);
      applyRateLimitCooldown(err);
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
    setResetToken(null);
    setOtp(['', '', '', '', '', '']);
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

  const isForgotStep =
    step === 'forgot_email' || step === 'forgot_otp' || step === 'forgot_new_password';
  const forgotStepIndex =
    step === 'forgot_email' ? 1 : step === 'forgot_otp' ? 2 : step === 'forgot_new_password' ? 3 : 0;

  // 120fps zero-re-render 2.5D mouse parallax refs (HoYoverse /vi/home style)
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const beamLayerRef = useRef<HTMLDivElement>(null);
  const dustLayerRef = useRef<HTMLDivElement>(null);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const cur = mouseCurrentRef.current;
      const tgt = mouseTargetRef.current;
      cur.x += (tgt.x - cur.x) * 0.065;
      cur.y += (tgt.y - cur.y) * 0.065;

      if (bgLayerRef.current) {
        const bx = (cur.x * -18).toFixed(2);
        const by = (cur.y * -12).toFixed(2);
        const rx = (cur.y * 1.1).toFixed(2);
        const ry = (cur.x * -1.4).toFixed(2);
        bgLayerRef.current.style.transform = `perspective(1200px) translate3d(${bx}px, ${by}px, 0) scale(1.06) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      if (beamLayerRef.current) {
        const lx = (cur.x * 24).toFixed(2);
        const ly = (cur.y * 14).toFixed(2);
        beamLayerRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      }
      if (dustLayerRef.current) {
        const dx = (cur.x * 36).toFixed(2);
        const dy = (cur.y * 22).toFixed(2);
        dustLayerRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      onPointerMove={(e) => {
        mouseTargetRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        mouseTargetRef.current.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      }}
      className="relative flex-1 flex items-center justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#FAF8F6]"
    >
      {/* Layer 1: 2.5D Mouse-Tracking Chinese Study Desk .webp Backdrop */}
      <div
        ref={bgLayerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{ transform: 'perspective(1200px) scale(1.06)' }}
      >
        <img
          src="/images/login-study-desk.webp"
          alt=""
          decoding="async"
          className="w-full h-full object-cover opacity-38"
        />
      </div>

      {/* Layer 2 & 3: Afternoon Window Sunbeams & Floating Golden Dust Motes */}
      <SunbeamDustOverlay beamRef={beamLayerRef} dustRef={dustLayerRef} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAF8F6]/70 via-[#FAF8F6]/75 to-[#FAF8F6]/90"
      />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[436px] space-y-3.5 sm:space-y-4"
      >
        <div className="p-5 sm:p-7 space-y-4 sm:space-y-5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAE3DE] border-t-[3px] border-t-[#C41E3A] shadow-[0_22px_50px_-20px_rgba(24,20,21,0.18)]">
          {/* Header with Bespoke Hanzi4U Crimson Seal */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center mb-1">
              <HanziLogoMark variant="light" className="w-11 h-11 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#181415] tracking-tight">
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
                ? 'Bước 1: Nhập Gmail đã đăng ký để nhận mã xác thực OTP'
                : step === 'forgot_otp'
                  ? 'Bước 2: Xác thực mã OTP 6 chữ số đã gửi về Gmail'
                  : step === 'forgot_new_password'
                    ? 'Bước 3: Tạo mật khẩu mới cho tài khoản của bạn'
                    : 'Bắt đầu hành trình chinh phục tiếng Trung HSK'}
            </p>
          </div>

          {/* 3-Step Visual Progress Stepper for Forgot Password */}
          {isForgotStep && (
            <div className="flex items-center justify-between gap-1.5 px-2 py-2 rounded-xl bg-[#FAF8F6] border border-[#EAE3DE]">
              {[
                { idx: 1, label: 'Email' },
                { idx: 2, label: 'Mã OTP' },
                { idx: 3, label: 'Mật khẩu mới' },
              ].map((item, i) => {
                const done = forgotStepIndex > item.idx;
                const active = forgotStepIndex === item.idx;
                return (
                  <React.Fragment key={item.idx}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors shrink-0 ${
                          done
                            ? 'bg-[#00A86B] text-white'
                            : active
                              ? 'bg-[#C41E3A] text-white shadow-[0_0_0_3px_rgba(196,30,58,0.14)]'
                              : 'bg-[#E8E1DC] text-[#78716C]'
                        }`}
                      >
                        {done ? <Check className="w-3 h-3 stroke-[3]" /> : item.idx}
                      </span>
                      <span
                        className={`text-[11px] font-semibold truncate ${
                          active
                            ? 'text-[#181415]'
                            : done
                              ? 'text-[#00A86B]'
                              : 'text-[#8C7F82]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className="flex-1 h-[2px] rounded-full bg-[#E8E1DC] overflow-hidden min-w-[14px]">
                        <motion.div
                          initial={false}
                          animate={{ scaleX: forgotStepIndex > item.idx ? 1 : 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full w-full origin-left bg-[#00A86B]"
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

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

          {/* Animated Contextual Alerts */}
          <AnimatePresence mode="wait">
            {successMessage && !errorMessage && (
              <motion.div
                key="success-alert"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {infoMessage && step === 'form' && !errorMessage && !successMessage && (
              <motion.div
                key="info-alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4A017] shrink-0" aria-hidden="true" />
                <span>{infoMessage}</span>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                key={`error-alert-${errorCode}-${errorMessage}`}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-[#9E162E] text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#C41E3A] mt-0.5" aria-hidden="true" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold leading-snug">{errorMessage}</p>

                  {actionCooldown > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-rose-200/80 text-[11px] font-semibold text-[#9E162E]">
                      <Clock className="w-3.5 h-3.5 text-[#C41E3A]" aria-hidden="true" />
                      <span>Có thể thao tác lại sau {actionCooldown} giây</span>
                    </div>
                  )}

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
              </motion.div>
            )}

            {infoMessage &&
              (step === 'otp_verify' || step === 'forgot_otp' || step === 'forgot_new_password') &&
              !errorMessage && (
                <motion.div
                  key={`otp-info-${step}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" aria-hidden="true" />
                  <span>{infoMessage}</span>
                </motion.div>
              )}
          </AnimatePresence>

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
                      autoComplete="name"
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
                      autoComplete="email"
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
                      autoComplete="new-password"
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
                  disabled={isSubmitting || isGoogleLoading || actionCooldown > 0}
                  className={submitBtnCls}
                >
                  <span>
                    {actionCooldown > 0
                      ? `Vui lòng chờ ${actionCooldown}s...`
                      : isSubmitting
                        ? 'Đang gửi mã xác nhận...'
                        : 'Tiếp tục'}
                  </span>
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
                      autoComplete="email"
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
                        autoComplete="current-password"
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
                  disabled={isSubmitting || isGoogleLoading || actionCooldown > 0}
                  className={submitBtnCls}
                >
                  <span>
                    {actionCooldown > 0
                      ? `Vui lòng chờ ${actionCooldown}s...`
                      : isSubmitting
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
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="text-center space-y-0.5">
                  <span className="text-xs text-[#5F5658]">Mã xác nhận 6 chữ số đã gửi đến</span>
                  <p className="text-sm font-semibold text-[#181415]">{email}</p>
                </div>

                <AnimatedOtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isLocked}
                  errorShakeKey={otpShakeKey}
                  idPrefix="otp"
                />

                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-1.5 text-[#5F5658] font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#C41E3A]" aria-hidden="true" />
                    Hiệu lực: <span className="font-semibold text-[#181415]">{formatTimer(countdown)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={countdown > 0 || isSubmitting || isLocked || actionCooldown > 0}
                    onClick={() => handleSendOtp()}
                    className="flex items-center gap-1 text-[#C41E3A] hover:text-[#9E162E] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{actionCooldown > 0 ? `Chờ ${actionCooldown}s` : 'Gửi lại mã'}</span>
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isSubmitting || isLocked || actionCooldown > 0}
                  className={submitBtnCls}
                >
                  <span>
                    {actionCooldown > 0
                      ? `Vui lòng chờ ${actionCooldown}s...`
                      : isSubmitting
                        ? 'Đang xác nhận...'
                        : 'Xác nhận & Đăng nhập'}
                  </span>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </motion.button>

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

            {/* STEP 3A: Forgot Password — 1/3 Request Gmail OTP */}
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
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || actionCooldown > 0}
                  className={submitBtnCls}
                >
                  <span>
                    {actionCooldown > 0
                      ? `Vui lòng chờ ${actionCooldown}s...`
                      : isSubmitting
                        ? 'Đang gửi mã OTP...'
                        : 'Gửi mã OTP về Gmail'}
                  </span>
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

            {/* STEP 3B: Forgot Password — 2/3 Verify OTP ONLY (Password form unlocks next) */}
            {step === 'forgot_otp' && (
              <motion.form
                key="forgot-otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleForgotVerifyOtp}
                className="space-y-4"
              >
                <div className="text-center space-y-0.5">
                  <span className="text-xs text-[#5F5658]">Mã OTP đặt lại mật khẩu đã gửi tới</span>
                  <p className="text-sm font-bold text-[#181415]">{email}</p>
                </div>

                <AnimatedOtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isLocked}
                  errorShakeKey={otpShakeKey}
                  idPrefix="reset-otp"
                />

                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-1.5 text-[#5F5658] font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#C41E3A]" aria-hidden="true" />
                    Hiệu lực: <span className="font-bold text-[#181415]">{formatTimer(countdown)}</span>
                  </div>
                  <button
                    type="button"
                    disabled={countdown > 0 || isSubmitting || isLocked || actionCooldown > 0}
                    onClick={() => handleForgotSendOtp()}
                    className="flex items-center gap-1 text-[#C41E3A] hover:text-[#9E162E] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{actionCooldown > 0 ? `Chờ ${actionCooldown}s` : 'Gửi lại mã'}</span>
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isSubmitting || isLocked || actionCooldown > 0}
                  className={submitBtnCls}
                >
                  <span>
                    {actionCooldown > 0
                      ? `Vui lòng chờ ${actionCooldown}s...`
                      : isSubmitting
                        ? 'Đang kiểm tra mã OTP...'
                        : 'Xác thực mã OTP'}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </motion.button>

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

            {/* STEP 3C: Forgot Password — 3/3 Set New Password (Shown ONLY after OTP verified) */}
            {step === 'forgot_new_password' && (
              <motion.form
                key="forgot-new-password-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleResetPassword}
                className="space-y-3.5"
              >
                <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#FAF8F6] border border-[#EAE3DE] text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#00A86B] shrink-0" aria-hidden="true" />
                  <span className="text-[#5F5658] truncate">
                    Đã xác thực: <strong className="text-[#181415]">{email}</strong>
                  </span>
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
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-[#C41E3A] font-medium mt-1 px-1">
                      Mật khẩu xác nhận chưa khớp.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || actionCooldown > 0}
                  className={submitBtnCls}
                >
                  <span>
                    {actionCooldown > 0
                      ? `Vui lòng chờ ${actionCooldown}s...`
                      : isSubmitting
                        ? 'Đang cập nhật mật khẩu...'
                        : 'Cập nhật mật khẩu mới'}
                  </span>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setAuthTab('login');
                    setResetToken(null);
                    clearAlerts();
                    setInfoMessage(null);
                  }}
                  className="w-full text-center text-xs text-[#5F5658] hover:text-[#181415] transition-colors cursor-pointer"
                >
                  ← Hủy & quay lại Đăng nhập
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-[#5F5658]">
          Bằng cách tiếp tục, bạn đồng ý với điều khoản sử dụng của Hanzi4U.
        </p>
      </motion.div>
    </div>
  );
};
