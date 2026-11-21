import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  );
};

interface CharToken {
  id: number;
  ch: string;
}

interface SmoothAuthInputProps {
  id: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Silky Tactile Auth Input (Apple / Telegram / Linear-inspired):
 * - Stable prefix/suffix diff so ONLY newly typed chars softly blur-fade in (140ms)
 *   and ONLY deleted chars softly dissolve out (115ms) with zero jitter on existing text
 * - Smooth spring-like gliding crimson caret (`85ms` ease-out) with gentle breathing idle pulse
 * - Light airy placeholder that gently glides away on first keystroke
 * - 100% native Vietnamese IME (Telex/VNI), text selection, autofill & horizontal scroll safe
 */
export const SmoothAuthInput: React.FC<SmoothAuthInputProps> = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  minLength,
  autoComplete,
  leftIcon,
  rightSlot,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nextTokenIdRef = useRef<number>(1);
  const typingTimerRef = useRef<number | null>(null);

  const [tokens, setTokens] = useState<CharToken[]>(() =>
    Array.from(value).map((ch) => ({ id: nextTokenIdRef.current++, ch }))
  );
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [caretPos, setCaretPos] = useState(value.length);
  const [caretX, setCaretX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const isMaskedPassword = type === 'password';

  // Diff value into stable CharToken[] so only inserted/deleted characters animate
  useEffect(() => {
    setTokens((prev) => {
      const nextChars = Array.from(value);
      let prefix = 0;
      while (
        prefix < prev.length &&
        prefix < nextChars.length &&
        prev[prefix].ch === nextChars[prefix]
      ) {
        prefix++;
      }

      let suffix = 0;
      while (
        suffix < prev.length - prefix &&
        suffix < nextChars.length - prefix &&
        prev[prev.length - 1 - suffix].ch === nextChars[nextChars.length - 1 - suffix]
      ) {
        suffix++;
      }

      if (prefix + suffix === prev.length && prefix + suffix === nextChars.length) {
        return prev;
      }

      const middle: CharToken[] = nextChars
        .slice(prefix, nextChars.length - suffix)
        .map((ch) => ({ id: nextTokenIdRef.current++, ch }));

      return [
        ...prev.slice(0, prefix),
        ...middle,
        ...prev.slice(prev.length - suffix),
      ];
    });
  }, [value]);

  const syncCaretAndScroll = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    setCaretPos(start);
    setHasSelection(start !== end);
    setScrollLeft(el.scrollLeft || 0);
  }, []);

  // Measure exact caret X pixel position in proportional font or fixed-width password dots
  useLayoutEffect(() => {
    if (isMaskedPassword) {
      setCaretX(caretPos * 9);
      return;
    }
    if (measureRef.current) {
      setCaretX(measureRef.current.getBoundingClientRect().width);
    }
  }, [value, caretPos, isMaskedPassword]);

  // Keep scrollLeft synced on next frame after programmatic or keyboard text edits
  useEffect(() => {
    const idRaf = window.requestAnimationFrame(syncCaretAndScroll);
    return () => window.cancelAnimationFrame(idRaf);
  }, [value, syncCaretAndScroll]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const pulseTypingState = () => {
    setIsTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setIsTyping(false), 380);
  };

  const showNativeText = isComposing || hasSelection || isAutofilled;
  const rightPaddingCls = rightSlot ? 'pr-10' : 'pr-4';
  const overlayRightCls = rightSlot ? 'right-10' : 'right-4';
  const caretPrefixText = value.slice(0, caretPos);

  return (
    <div
      className={`relative w-full rounded-xl border bg-white transition-all duration-200 ${
        isFocused
          ? 'border-[#C41E3A] ring-2 ring-[#C41E3A]/15 shadow-[0_6px_18px_-12px_rgba(196,30,58,0.38)]'
          : 'border-[#EAE3DE] hover:border-[#D9CFC8]'
      } ${disabled ? 'opacity-60 bg-[#FAF8F6]' : ''}`}
    >
      {/* Left Icon with subtle focus tint */}
      {leftIcon && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-20 ${
            isFocused ? 'text-[#C41E3A]' : 'text-[#AFA5A3]'
          }`}
        >
          {leftIcon}
        </span>
      )}

      {/* Hidden exact-width caret measurement probe (kerning disabled to match input 1:1) */}
      {!isMaskedPassword && (
        <span
          ref={measureRef}
          aria-hidden="true"
          style={{ fontKerning: 'none', fontVariantLigatures: 'none' }}
          className="pointer-events-none invisible fixed -top-96 left-0 whitespace-pre text-sm font-sans leading-5"
        >
          {caretPrefixText}
        </span>
      )}

      {/* Soft Airy Placeholder (noticeably lighter & softly glides away when typing) */}
      <AnimatePresence initial={false}>
        {value.length === 0 && !isComposing && !isAutofilled && (
          <motion.span
            key="smooth-placeholder"
            aria-hidden="true"
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-none absolute inset-y-0 left-10 ${overlayRightCls} flex items-center text-sm font-sans text-[#C2B8B4] truncate select-none z-0`}
          >
            {placeholder}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Silky Per-Character Enter/Delete Overlay & Smooth Gliding Crimson Caret */}
      {!showNativeText && (
        <div
          ref={viewportRef}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-10 ${overlayRightCls} flex items-center overflow-hidden z-0`}
        >
          <div
            style={{
              transform: `translate3d(${-(isMaskedPassword ? Math.max(0, caretX - Math.max(120, (viewportRef.current?.clientWidth || 220) - 8)) : scrollLeft)}px, 0, 0)`,
              fontKerning: 'none',
              fontVariantLigatures: 'none',
            }}
            className="relative flex items-center whitespace-pre text-sm font-sans leading-5 text-[#181415]"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {tokens.map((tok) =>
                isMaskedPassword ? (
                  <motion.span
                    key={tok.id}
                    initial={{ opacity: 0, scale: 0.35 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.35 }}
                    transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center justify-center w-[9px] h-5 shrink-0"
                  >
                    <span className="w-[5.5px] h-[5.5px] rounded-full bg-[#181415]" />
                  </motion.span>
                ) : (
                  <motion.span
                    key={tok.id}
                    initial={{ opacity: 0, y: 2.5, scale: 0.94, filter: 'blur(1.5px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{
                      opacity: 0,
                      y: -2,
                      scale: 0.88,
                      filter: 'blur(1.5px)',
                      transition: { duration: 0.11, ease: 'easeOut' },
                    }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-block whitespace-pre"
                  >
                    {tok.ch}
                  </motion.span>
                )
              )}
            </AnimatePresence>

            {/* Smooth Gliding Crimson Caret (VS Code / macOS Smooth Caret physics) */}
            {isFocused && !disabled && (
              <span
                style={{
                  transform: `translate3d(${caretX}px, -50%, 0)`,
                  transition: 'transform 85ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className={`pointer-events-none absolute left-0 top-1/2 w-[1.75px] h-[18px] rounded-full bg-[#C41E3A] ${
                  isTyping ? 'opacity-100' : 'animate-smooth-caret'
                }`}
              />
            )}
          </div>
        </div>
      )}

      {/* Real Native Input (Full keyboard, IME, paste, autofill, accessibility & selection) */}
      <input
        ref={inputRef}
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        disabled={disabled}
        value={value}
        style={{ fontKerning: 'none', fontVariantLigatures: 'none' }}
        onChange={(e) => {
          setIsAutofilled(false);
          onChange(e.target.value);
          pulseTypingState();
          syncCaretAndScroll();
        }}
        onFocus={() => {
          setIsFocused(true);
          syncCaretAndScroll();
        }}
        onBlur={() => {
          setIsFocused(false);
          setHasSelection(false);
          setIsTyping(false);
        }}
        onSelect={syncCaretAndScroll}
        onKeyUp={syncCaretAndScroll}
        onClick={syncCaretAndScroll}
        onScroll={syncCaretAndScroll}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => {
          setIsComposing(false);
          onChange(e.currentTarget.value);
          pulseTypingState();
          syncCaretAndScroll();
        }}
        onAnimationStart={(e) => {
          if (e.animationName === 'onAutoFillStart') {
            setIsAutofilled(true);
          }
        }}
        className={`auth-smooth-input relative z-10 w-full pl-10 ${rightPaddingCls} py-2.5 rounded-xl bg-transparent text-sm font-sans leading-5 focus:outline-none ${
          showNativeText
            ? 'text-[#181415] caret-[#C41E3A]'
            : 'text-transparent caret-transparent selection:bg-[#C41E3A]/18 selection:text-[#181415]'
        }`}
      />

      {/* Optional Right Slot (Password Visibility Eye Toggle) */}
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center">
          {rightSlot}
        </div>
      )}
    </div>
  );
};
