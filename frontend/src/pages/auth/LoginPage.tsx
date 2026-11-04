import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Mail, ShieldCheck, ArrowRight, RotateCcw, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [method, setMethod] = useState<'options' | 'email_input' | 'otp_verify'>('options');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Countdown timer for 300s OTP TTL
  useEffect(() => {
    let timer: any;
    if (method === 'otp_verify' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [method, countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post<{ message: string; expiresIn: number; devOtp?: string }>('/auth/otp/send', { email });
      setCountdown(res?.expiresIn || 300);
      setDevOtpHint(res?.devOtp || null);
      setMethod('otp_verify');
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of 6 digits
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
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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
      const res = await api.post<any>('/auth/otp/verify', { email, otp: fullOtp });
      login(res.accessToken, res.user);

      if (res.isNewUser) {
        window.location.hash = '#/profile';
      } else {
        window.location.hash = '#/courses';
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Mã OTP không chính xác.');
      if (err.data?.error?.code === 'OTP_ACCOUNT_LOCKED' || err.data?.error?.code === 'OTP_MAX_ATTEMPTS_EXCEEDED') {
        setIsLocked(true);
      }
      if (err.data?.error?.details?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.error.details.remainingAttempts);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Mock Google OAuth identification payload
      const mockGoogle = {
        email: 'google_user@gmail.com',
        name: 'Học Viên Google',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        googleId: 'g_' + Date.now(),
      };

      const res = await api.post<any>('/auth/google', mockGoogle);
      login(res.accessToken, res.user);
      window.location.hash = '#/courses';
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập bằng Google thất bại.');
    } finally {
      setIsSubmitting(false);
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
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white items-center justify-center text-3xl shadow-lg shadow-primary-500/20 mb-4">
            🀄
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Chào mừng đến với <span className="text-primary-600">ChinaEasy</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Nền tảng học tiếng Trung sơ cấp HSK chuẩn hóa cho người Việt
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm animate-shake">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
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

        {/* Dev OTP Helper */}
        {devOtpHint && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <span>💡 Mã OTP thử nghiệm nhanh: <strong>{devOtpHint}</strong></span>
            <button
              onClick={() => {
                setOtp(devOtpHint.split(''));
              }}
              className="text-amber-900 underline font-semibold text-[11px]"
            >
              Điền tự động
            </button>
          </div>
        )}

        {/* State 1: Choose Method */}
        {method === 'options' && (
          <div className="space-y-4 pt-2">
            <button
              onClick={() => setMethod('email_input')}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all hover:shadow-lg hover:shadow-primary-600/30"
            >
              <Mail className="w-5 h-5" />
              Đăng nhập qua Email OTP (Không cần mật khẩu)
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase">hoặc</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Tiếp tục với Google OAuth2
            </button>
          </div>
        )}

        {/* State 2: Enter Email */}
        {method === 'email_input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Địa chỉ Email của bạn
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="vidu@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMethod('options')}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800 transition-colors pt-2"
            >
              ← Quay lại chọn phương thức khác
            </button>
          </form>
        )}

        {/* State 3: Enter & Verify OTP */}
        {method === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs text-gray-500">Mã 6 chữ số đã gửi đến</span>
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
                <ShieldCheck className="w-4 h-4 text-primary-500" />
                Hiệu lực: <span className="font-bold text-gray-900">{formatTimer(countdown)}</span>
              </div>

              <button
                type="button"
                disabled={countdown > 0 || isSubmitting || isLocked}
                onClick={() => handleSendOtp()}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-40 disabled:hover:text-primary-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Gửi lại mã
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Xác thực & Vào học'}
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod('email_input');
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              Đổi địa chỉ email khác
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
