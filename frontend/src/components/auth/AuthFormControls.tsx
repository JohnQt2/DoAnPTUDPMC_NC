import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';

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

interface ExitingGhost {
  id: number;
  ch: string;
  x: number;
  isMask: boolean;
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
  disallowSpaces?: boolean;
}

/**
 * Craft.do / Apple / Telegram-Grade Smooth Typing & Deleting Input:
 * - 0ms synchronous token diff during render (zero 1-frame lag between caret & characters)
 * - Real Framer Motion spring-physics gliding caret (`useSpring` + velocity micro-stretch)
 * - Crisp zero-blur GPU horizontal ink-glide on type (`x: -4 → 0, scale: 0.88 → 1`)
 * - Detached ghost dissolution on delete (never shifts remaining chars, 120fps even on rapid Backspace)
 * - Optional `disallowSpaces` with tactile micro-shake + auto-fading hint for password fields
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
  disallowSpaces = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const ghostMeasureRef = useRef<HTMLSpanElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nextTokenIdRef = useRef<number>(1);
  const nextGhostIdRef = useRef<number>(1);
  const typingTimerRef = useRef<number | null>(null);
  const spaceHintTimerRef = useRef<number | null>(null);
  const prevValueRef = useRef<string>(value);
  const tokensRef = useRef<CharToken[]>(
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
  const [exitingGhosts, setExitingGhosts] = useState<ExitingGhost[]>([]);
  const [spaceRejectKey, setSpaceRejectKey] = useState(0);
  const [showSpaceHint, setShowSpaceHint] = useState(false);

  const isMaskedPassword = type === 'password';
  const prevIsMaskedRef = useRef<boolean>(isMaskedPassword);

  // Spring-physics gliding caret (continuous velocity inertia — zero stutter on rapid typing/deleting!)
  const caretTargetX = useMotionValue(0);
  const smoothCaretX = useSpring(caretTargetX, {
    stiffness: 680,
    damping: 42,
    mass: 0.42,
  });
  const caretVelocity = useVelocity(smoothCaretX);
  const caretStretchX = useTransform(caretVelocity, [-900, 0, 900], [1.45, 1, 1.45]);
  const hasInitializedCaretRef = useRef(false);

  // 0ms synchronous prefix/suffix token reconciliation during render (zero frame delay!)
  if (prevValueRef.current !== value) {
    const prev = tokensRef.current;
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

    const middle: CharToken[] = nextChars
      .slice(prefix, nextChars.length - suffix)
      .map((ch) => ({ id: nextTokenIdRef.current++, ch }));

    tokensRef.current = [
      ...prev.slice(0, prefix),
      ...middle,
      ...prev.slice(prev.length - suffix),
    ];
    prevValueRef.current = value;
  }

  const tokens = tokensRef.current;

  const measureTextWidth = useCallback(
    (str: string): number => {
      if (isMaskedPassword) return Array.from(str).length * 9;
      const probe = ghostMeasureRef.current;
      if (!probe) return 0;
      probe.textContent = str;
      return probe.getBoundingClientRect().width;
    },
    [isMaskedPassword]
  );

  // Spawn detached GPU ghost characters whenever text is deleted (never disturbs remaining layout!)
  const spawnDeletedGhosts = useCallback(
    (oldVal: string, newVal: string) => {
      if (oldVal.length <= newVal.length) return;
      const oldChars = Array.from(oldVal);
      const newChars = Array.from(newVal);

      let prefix = 0;
      while (
        prefix < oldChars.length &&
        prefix < newChars.length &&
        oldChars[prefix] === newChars[prefix]
      ) {
        prefix++;
      }

      let suffix = 0;
      while (
        suffix < oldChars.length - prefix &&
        suffix < newChars.length - prefix &&
        oldChars[oldChars.length - 1 - suffix] === newChars[newChars.length - 1 - suffix]
      ) {
        suffix++;
      }

      const removed = oldChars.slice(prefix, oldChars.length - suffix);
      if (removed.length === 0) return;

      // Cap animated ghosts on bulk select-all delete to 18 chars for crisp 120fps
      const sliced = removed.slice(0, 18);
      const created: ExitingGhost[] = sliced.map((ch, i) => {
        const prefixBeforeChar = oldChars.slice(0, prefix + i).join('');
        return {
          id: nextGhostIdRef.current++,
          ch,
          x: measureTextWidth(prefixBeforeChar),
          isMask: isMaskedPassword,
        };
      });

      setExitingGhosts((prev) => [...prev.slice(-16), ...created]);
      const createdIds = new Set(created.map((g) => g.id));
      window.setTimeout(() => {
        setExitingGhosts((prev) => prev.filter((g) => !createdIds.has(g.id)));
      }, 170);
    },
    [isMaskedPassword, measureTextWidth]
  );

  const syncCaretAndScroll = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    setCaretPos(start);
    setHasSelection(start !== end);
    setScrollLeft(el.scrollLeft || 0);
  }, []);

  // Measure exact caret X pixel position and drive spring caret immediately before paint
  useLayoutEffect(() => {
    let nextX = 0;
    if (isMaskedPassword) {
      nextX = caretPos * 9;
    } else if (measureRef.current) {
      nextX = measureRef.current.getBoundingClientRect().width;
    }

    setCaretX(nextX);

    // Jump instantaneously on first focus or password eye-toggle so caret doesn't fly across screen
    if (!hasInitializedCaretRef.current || prevIsMaskedRef.current !== isMaskedPassword) {
      caretTargetX.jump(nextX);
      smoothCaretX.jump(nextX);
      hasInitializedCaretRef.current = true;
      prevIsMaskedRef.current = isMaskedPassword;
    } else {
      caretTargetX.set(nextX);
    }
  }, [value, caretPos, isMaskedPassword, caretTargetX, smoothCaretX]);

  // Keep scrollLeft synced on next frame after keyboard edits
  useEffect(() => {
    const idRaf = window.requestAnimationFrame(syncCaretAndScroll);
    return () => window.cancelAnimationFrame(idRaf);
  }, [value, syncCaretAndScroll]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (spaceHintTimerRef.current) window.clearTimeout(spaceHintTimerRef.current);
    };
  }, []);

  const pulseTypingState = () => {
    setIsTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setIsTyping(false), 420);
  };

  const triggerSpaceRejected = () => {
    setSpaceRejectKey((k) => k + 1);
    setShowSpaceHint(true);
    if (spaceHintTimerRef.current) window.clearTimeout(spaceHintTimerRef.current);
    spaceHintTimerRef.current = window.setTimeout(() => setShowSpaceHint(false), 2400);
  };

  const showNativeText = isComposing || hasSelection || isAutofilled;
  const rightPaddingCls = rightSlot ? 'pr-10' : 'pr-4';
  const overlayRightCls = rightSlot ? 'right-10' : 'right-4';
  const caretPrefixText = value.slice(0, caretPos);
  const effectiveScrollLeft = isMaskedPassword
    ? Math.max(0, caretX - Math.max(120, (viewportRef.current?.clientWidth || 220) - 8))
    : scrollLeft;

  return (
    <div className="w-full">
      <motion.div
        key={`field-shake-${spaceRejectKey}`}
        animate={
          spaceRejectKey > 0
            ? { x: [0, -4.5, 4.5, -2.5, 2.5, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.24, ease: 'easeInOut' }}
        className={`relative w-full rounded-xl border bg-white transition-all duration-200 ${
          showSpaceHint
            ? 'border-[#C41E3A] ring-2 ring-[#C41E3A]/20'
            : isFocused
              ? 'border-[#C41E3A] ring-2 ring-[#C41E3A]/15 shadow-[0_6px_18px_-12px_rgba(196,30,58,0.38)]'
              : 'border-[#EAE3DE] hover:border-[#D9CFC8]'
        } ${disabled ? 'opacity-60 bg-[#FAF8F6]' : ''}`}
      >
        {/* Left Icon with subtle focus tint */}
        {leftIcon && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-20 ${
              isFocused ? 'text-[#C41E3A]' : 'text-[#B8AEA9]'
            }`}
          >
            {leftIcon}
          </span>
        )}

        {/* Hidden exact-width caret measurement probes (kerning disabled to match input 1:1) */}
        <span
          ref={measureRef}
          aria-hidden="true"
          style={{ fontKerning: 'none', fontVariantLigatures: 'none' }}
          className="pointer-events-none invisible fixed -top-96 left-0 whitespace-pre text-sm font-sans leading-5"
        >
          {caretPrefixText}
        </span>
        <span
          ref={ghostMeasureRef}
          aria-hidden="true"
          style={{ fontKerning: 'none', fontVariantLigatures: 'none' }}
          className="pointer-events-none invisible fixed -top-96 left-0 whitespace-pre text-sm font-sans leading-5"
        />

        {/* Soft Airy Placeholder (light muted tone that glides smoothly away on first char) */}
        <AnimatePresence initial={false}>
          {value.length === 0 && !isComposing && !isAutofilled && (
            <motion.span
              key="smooth-placeholder"
              aria-hidden="true"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-none absolute inset-y-0 left-10 ${overlayRightCls} flex items-center text-sm font-sans text-[#C8BFB9] truncate select-none z-0`}
            >
              {placeholder}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Crisp 120fps Ink-Glide Typing, Detached Ghost Deletion & Spring Gliding Caret */}
        {!showNativeText && (
          <div
            ref={viewportRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-10 ${overlayRightCls} flex items-center overflow-hidden z-0`}
          >
            <div
              style={{
                transform: `translate3d(${-effectiveScrollLeft}px, 0, 0)`,
                fontKerning: 'none',
                fontVariantLigatures: 'none',
              }}
              className="relative flex items-center whitespace-pre text-sm font-sans leading-5 text-[#181415]"
            >
              {/* Active Characters (0ms synchronous — only newly inserted char springs smoothly in!) */}
              {tokens.map((tok) =>
                isMaskedPassword ? (
                  <motion.span
                    key={tok.id}
                    initial={{ opacity: 0, scale: 0.18 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 650, damping: 28, mass: 0.4 }}
                    className="inline-flex items-center justify-center w-[9px] h-5 shrink-0"
                  >
                    <span className="w-[5.5px] h-[5.5px] rounded-full bg-[#181415]" />
                  </motion.span>
                ) : (
                  <motion.span
                    key={tok.id}
                    initial={{ opacity: 0, x: -4, scale: 0.88 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 580, damping: 32, mass: 0.45 }}
                    className="inline-block whitespace-pre"
                  >
                    {tok.ch}
                  </motion.span>
                )
              )}

              {/* Detached Ghost Layer for Silky Backspace/Delete Dissolution (Zero Layout Reflow!) */}
              {exitingGhosts.map((g) => (
                <motion.span
                  key={`ghost-${g.id}`}
                  initial={{ opacity: 0.85, x: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: g.isMask ? -2 : -5,
                    scale: g.isMask ? 0.2 : 0.82,
                  }}
                  transition={{ duration: 0.145, ease: [0.22, 1, 0.36, 1] }}
                  style={{ left: g.x }}
                  className="pointer-events-none absolute top-0 flex items-center h-5 whitespace-pre text-[#181415]"
                >
                  {g.isMask ? (
                    <span className="inline-flex items-center justify-center w-[9px] h-5">
                      <span className="w-[5.5px] h-[5.5px] rounded-full bg-[#181415]" />
                    </span>
                  ) : (
                    g.ch
                  )}
                </motion.span>
              ))}

              {/* Real Spring-Physics Gliding Crimson Caret (Apple / Craft.do / Telegram style) */}
              {isFocused && !disabled && (
                <motion.span
                  style={{
                    x: smoothCaretX,
                    scaleX: caretStretchX,
                  }}
                  className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[1.8px] h-[18px] rounded-full bg-[#C41E3A] shadow-[0_0_6px_rgba(196,30,58,0.28)] origin-center ${
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
          onKeyDown={(e) => {
            if (disallowSpaces && (e.key === ' ' || e.code === 'Space')) {
              e.preventDefault();
              triggerSpaceRejected();
            }
          }}
          onChange={(e) => {
            setIsAutofilled(false);
            let nextVal = e.target.value;
            if (disallowSpaces && /\s/.test(nextVal)) {
              nextVal = nextVal.replace(/\s+/g, '');
              triggerSpaceRejected();
            }
            if (nextVal !== value) {
              if (nextVal.length < value.length) {
                spawnDeletedGhosts(value, nextVal);
              }
              onChange(nextVal);
              pulseTypingState();
            }
            syncCaretAndScroll();
          }}
          onFocus={() => {
            setIsFocused(true);
            hasInitializedCaretRef.current = false;
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
            let nextVal = e.currentTarget.value;
            if (disallowSpaces && /\s/.test(nextVal)) {
              nextVal = nextVal.replace(/\s+/g, '');
              triggerSpaceRejected();
            }
            onChange(nextVal);
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
      </motion.div>

      {/* Brief Tactile Warning if Spacebar is pressed inside Password */}
      <AnimatePresence>
        {showSpaceHint && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16 }}
            className="text-[11px] font-medium text-[#C41E3A] mt-1 px-1"
          >
            Mật khẩu không được chứa dấu cách.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
