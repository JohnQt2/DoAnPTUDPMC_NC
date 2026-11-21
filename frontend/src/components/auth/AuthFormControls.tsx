import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedOtpInputProps {
  value: string[];
  onChange: (nextOtp: string[]) => void;
  disabled?: boolean;
  errorShakeKey?: number;
  idPrefix?: string;
  onComplete?: (fullOtp: string) => void;
}

/**
 * Apple/Linear-Grade 6-Digit OTP Input:
 * - Full 6-digit clipboard paste into ANY slot (extracts digits, fills all 6 immediately)
 * - Mobile `one-time-code` SMS/Gmail autofill support
 * - Staggered spring digit pop-in + animated focus ring + blinking cursor + error shake
 */
export const AnimatedOtpInput: React.FC<AnimatedOtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  errorShakeKey = 0,
  idPrefix = 'otp',
  onComplete,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [pastedPulse, setPastedPulse] = useState(0);

  const filledCount = value.filter(Boolean).length;

  const focusSlot = (idx: number) => {
    const clamped = Math.max(0, Math.min(5, idx));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  };

  const applyDigits = (raw: string, startIndex: number, isPasteEvent = false) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;

    const next = [...value];
    // If pasting 2+ digits (or full 6-digit code), start cleanly from slot 0 when >= 4 digits
    const origin = isPasteEvent && digits.length >= 4 ? 0 : startIndex;
    const chars = digits.slice(0, 6 - origin).split('');

    chars.forEach((ch, offset) => {
      if (origin + offset < 6) {
        next[origin + offset] = ch;
      }
    });

    onChange(next);
    if (isPasteEvent && chars.length > 1) {
      setPastedPulse((p) => p + 1);
    }

    const nextFocus = Math.min(5, origin + chars.length);
    focusSlot(chars.length > 1 ? Math.min(5, origin + chars.length - 1) : nextFocus);

    const joined = next.join('');
    if (joined.length === 6 && onComplete) {
      onComplete(joined);
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    const pastedText = e.clipboardData.getData('text') || '';
    applyDigits(pastedText, idx, true);
  };

  const handleChange = (idx: number, raw: string) => {
    if (disabled) return;
    const digits = raw.replace(/\D/g, '');

    if (!digits) {
      const next = [...value];
      next[idx] = '';
      onChange(next);
      return;
    }

    // Handles both mobile 6-digit autofill and fast overwriting of an existing digit
    if (digits.length > 1) {
      // If user typed a new digit into a slot that already held 1 digit, take the newest digit
      if (digits.length === 2 && value[idx]) {
        const newest = digits[0] === value[idx] ? digits[1] : digits[0];
        const next = [...value];
        next[idx] = newest;
        onChange(next);
        if (idx < 5) focusSlot(idx + 1);
        const joined = next.join('');
        if (joined.length === 6 && onComplete) onComplete(joined);
        return;
      }
      applyDigits(digits, idx, true);
      return;
    }

    const next = [...value];
    next[idx] = digits;
    onChange(next);

    if (idx < 5) {
      focusSlot(idx + 1);
    }

    const joined = next.join('');
    if (joined.length === 6 && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value];
        next[idx] = '';
        onChange(next);
      } else if (idx > 0) {
        const next = [...value];
        next[idx - 1] = '';
        onChange(next);
        focusSlot(idx - 1);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusSlot(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < 5) {
      e.preventDefault();
      focusSlot(idx + 1);
    }
  };

  return (
    <div className="space-y-3">
      <motion.div
        key={`shake-${errorShakeKey}`}
        animate={
          errorShakeKey > 0
            ? { x: [0, -7, 7, -5, 5, -2, 2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.38, ease: 'easeInOut' }}
        className="flex items-center justify-center gap-2 sm:gap-2.5"
      >
        {value.map((digit, idx) => {
          const isFocused = activeIdx === idx;
          const isFilled = digit !== '';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: isFocused ? 1.05 : 1 }}
              transition={{
                type: 'spring',
                stiffness: 460,
                damping: 26,
                delay: idx * 0.025,
              }}
              className="relative"
            >
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                id={`${idPrefix}-${idx}`}
                type="text"
                inputMode="numeric"
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                aria-label={`Chữ số mã xác thực thứ ${idx + 1}`}
                value={digit}
                disabled={disabled}
                onFocus={() => setActiveIdx(idx)}
                onBlur={() => setActiveIdx((cur) => (cur === idx ? null : cur))}
                onPaste={(e) => handlePaste(idx, e)}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-[54px] sm:w-12 sm:h-[58px] text-center text-xl font-extrabold font-mono rounded-xl border-2 bg-white text-[#181415] transition-all duration-150 focus:outline-none caret-transparent ${
                  isFocused
                    ? 'border-[#C41E3A] ring-[3px] ring-[#C41E3A]/15 shadow-[0_8px_20px_-10px_rgba(196,30,58,0.45)]'
                    : isFilled
                      ? 'border-[#C41E3A]/45 bg-[#FFFDFB]'
                      : 'border-[#E5DDD7] hover:border-[#C9BDB6]'
                } ${disabled ? 'opacity-55 bg-[#F5F2EC]' : ''}`}
              />

              {/* Animated Blinking Caret when Focused & Empty */}
              {isFocused && !isFilled && !disabled && (
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#C41E3A] rounded-full"
                />
              )}

              {/* Staggered Wave Pop Highlight Ring when Filled / Pasted */}
              {isFilled && (
                <motion.span
                  key={`pop-${digit}-${pastedPulse}`}
                  initial={{ scale: 0.72, opacity: 0.85 }}
                  animate={{ scale: 1.18, opacity: 0 }}
                  transition={{
                    duration: 0.36,
                    delay: pastedPulse > 0 ? idx * 0.038 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#C41E3A]"
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Sleek 6-Step Progress Bar + Paste Hint */}
      <div className="max-w-[300px] mx-auto space-y-1.5">
        <div className="h-1 w-full rounded-full bg-[#ECE6E1] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${(filledCount / 6) * 100}%` }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="h-full rounded-full bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#00A86B]"
          />
        </div>
        <p className="text-center text-[11px] text-[#8C7F82]">
          Bạn có thể <span className="font-semibold text-[#5F5658]">dán trực tiếp (Ctrl+V)</span> mã 6 chữ số từ Gmail
        </p>
      </div>
    </div>
  );
};
