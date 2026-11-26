import React, { useState } from 'react';
import { Check, X, Volume2, ImageOff, AlertCircle } from 'lucide-react';
import { CharacterWritingQuestion } from './CharacterWritingQuestion';

// Component hiển thị hình ảnh an toàn có fallback
export const SafeImage: React.FC<{
  src: string;
  alt?: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="flex flex-col items-center justify-center p-3 text-center text-[#6B7280] bg-[#FAF7F2] w-full h-full min-h-[100px]">
        <ImageOff className="w-6 h-6 text-[#F59E0B] mb-1" />
        <span className="text-[11px] font-medium">Hình ảnh đang được cập nhật</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Hình minh họa'}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

// Hàm chuẩn hóa chuỗi loại bỏ ????? và ký tự lỗi
export const cleanText = (str: any, fallback = 'Nội dung câu hỏi đang được cập nhật'): string => {
  if (typeof str !== 'string' || !str.trim()) return fallback;
  const trimmed = str.trim();
  // Bắt các chuỗi bị lỗi ?????, ?? (b?l?i), ?? (kǒf?i), m? m?, xi?y?
  if (
    trimmed.includes('????') ||
    trimmed.includes('???') ||
    trimmed.includes('b?l?i') ||
    trimmed.includes('kǒf?i') ||
    trimmed.includes('k?f?i') ||
    trimmed.includes('m?') ||
    trimmed.includes('xi?') ||
    trimmed.includes('t?bi?') ||
    trimmed.includes('d?y?') ||
    /^\?+$/.test(trimmed) ||
    /^\?+\s*\(.*\)$/.test(trimmed)
  ) {
    if (trimmed.includes('(') || trimmed.includes('（')) {
      return 'Từ vựng đang được cập nhật';
    }
    return fallback;
  }
  return trimmed;
};

// Hàm chuẩn hóa đáp án an toàn, tránh render pinyin lỗi m?, b?, xi?y?
export const cleanAnswerText = (str: any, fallback = 'Nội dung phiên âm đang được cập nhật'): string => {
  if (typeof str !== 'string' || !str.trim()) return '';
  const trimmed = str.trim();
  if (
    trimmed.includes('?') ||
    trimmed.includes('m?') ||
    trimmed.includes('b?') ||
    trimmed.includes('xi?y?') ||
    trimmed.includes('t?bi?') ||
    trimmed.includes('d?y?')
  ) {
    return fallback;
  }
  return trimmed;
};

export const cleanVocab = (zh: any, py: any) => {
  const isZhCorrupted = !zh || typeof zh !== 'string' || zh.includes('?') || /^\?+$/.test(zh.trim());
  const isPyCorrupted =
    !py ||
    typeof py !== 'string' ||
    py.includes('?') ||
    py.includes('b?l?i') ||
    py.includes('m?') ||
    py.includes('xi?y?');

  if (isZhCorrupted && isPyCorrupted) {
    return {
      wordZh: 'Từ vựng đang được cập nhật',
      wordPinyin: '',
      isPlaceholder: true,
    };
  }

  return {
    wordZh: isZhCorrupted ? 'Từ vựng đang được cập nhật' : zh,
    wordPinyin: isPyCorrupted ? 'Nội dung phiên âm đang được cập nhật' : py,
    isPlaceholder: false,
  };
};

interface QuestionRendererProps {
  question: any;
  userAnswer: any;
  onChangeAnswer: (val: any) => void;
  readOnly?: boolean;
  showResult?: boolean;
  correctAnswer?: any;
  explanation?: any;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  userAnswer,
  onChangeAnswer,
  readOnly = false,
  showResult = false,
  correctAnswer,
  explanation,
}) => {
  if (!question) {
    return (
      <div className="p-8 text-center text-[#6B7280]">
        Chưa có thông tin câu hỏi.
      </div>
    );
  }

  const type = question?.type;
  const prompt = question?.prompt ?? {};

  // True/False Question
  if (type === 'TRUE_FALSE') {
    const isCheckedTrue = userAnswer === true;
    const isCheckedFalse = userAnswer === false;
    const isCorrectAns = showResult && correctAnswer?.value !== undefined ? correctAnswer.value : null;

    const instructionText = cleanText(prompt.instruction, 'Phán đoán tính đúng sai của nội dung');
    const vocab = cleanVocab(prompt.wordZh, prompt.wordPinyin);

    return (
      <div className="space-y-4">
        {instructionText && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            {instructionText}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm">
          {prompt.imageUrl && (
            <div className="w-56 h-44 rounded-xl overflow-hidden bg-[#FAF7F2] flex items-center justify-center border border-[#F3E8D6] shadow-sm">
              <SafeImage
                src={prompt.imageUrl}
                alt="Hình câu hỏi"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

          <div className="flex-1 space-y-3">
            {prompt.wordZh && (
              <div className="space-y-1">
                <div className="text-xs text-[#6B7280]">Từ vựng tương ứng:</div>
                <div className="text-3xl font-chinese font-bold text-[#1F2937]">{vocab.wordZh}</div>
                {vocab.wordPinyin && (
                  <div className="text-base font-semibold text-[#D97706]">{vocab.wordPinyin}</div>
                )}
              </div>
            )}

            {prompt.audioText && (
              <div className="text-sm text-[#1F2937]">
                <span className="text-xs text-[#6B7280] block mb-0.5">Nội dung bài nghe:</span>
                <span className="font-medium text-[#1F2937]">{prompt.audioText}</span>
              </div>
            )}

            <div className="pt-2">
              <span className="text-xs text-[#6B7280] block mb-2 font-medium">
                Hình ảnh có phù hợp với nội dung không?
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChangeAnswer(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    isCheckedTrue
                      ? 'bg-[#ECFDF5] text-[#22C55E] border-[#22C55E] shadow-sm'
                      : 'bg-white hover:border-[#F59E0B] hover:-translate-y-0.5 text-[#1F2937] border-[#F3E8D6] shadow-sm'
                  }`}
                >
                  <Check className="w-4 h-4 text-[#22C55E]" />
                  Đúng (√)
                </button>

                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChangeAnswer(false)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    isCheckedFalse
                      ? 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444] shadow-sm'
                      : 'bg-white hover:border-[#F59E0B] hover:-translate-y-0.5 text-[#1F2937] border-[#F3E8D6] shadow-sm'
                  }`}
                >
                  <X className="w-4 h-4 text-[#EF4444]" />
                  Sai (×)
                </button>
              </div>
            </div>
          </div>
        </div>

        {showResult && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-xs text-[#1F2937] space-y-1.5">
            <div>
              <span className="font-semibold text-[#6B7280]">Đáp án chuẩn: </span>
              <span className="font-bold text-[#F59E0B]">
                {isCorrectAns ? 'Đúng (√)' : 'Sai (×)'}
              </span>
            </div>
            <div className="pt-1 border-t border-[#F3E8D6]">
              <span className="font-semibold text-[#1F2937]">Giải thích chi tiết: </span>
              <span className="text-[#6B7280] leading-relaxed">
                {explanation
                  ? (typeof explanation === 'object' ? explanation.vi || JSON.stringify(explanation) : explanation)
                  : 'Chưa có giải thích cho câu hỏi này.'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image Choice Question (e.g. Listening Part 2)
  if (type === 'IMAGE_CHOICE') {
    const selectedKey = String(userAnswer || '').toUpperCase();
    const correctKey = showResult && correctAnswer?.value ? String(correctAnswer.value).toUpperCase() : null;

    const instructionText = cleanText(prompt.instruction, 'Xem từ vựng chọn hình ảnh phù hợp');
    const dialogueText = prompt.dialogue ? cleanText(prompt.dialogue, 'Từ vựng đang được cập nhật') : null;

    return (
      <div className="space-y-4">
        {instructionText && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            {instructionText}
          </div>
        )}

        {dialogueText && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-sm text-[#1F2937] whitespace-pre-line leading-relaxed font-chinese font-semibold">
            {dialogueText}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {prompt.options?.map((opt: any) => {
            const isSelected = selectedKey === opt.key;
            const isTarget = correctKey === opt.key;

            return (
              <button
                key={opt.key}
                type="button"
                disabled={readOnly}
                onClick={() => onChangeAnswer(opt.key)}
                className={`relative flex flex-col items-center p-2 rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-[#F59E0B] bg-[#FFF7E6] shadow-md -translate-y-0.5'
                    : 'border-[#F3E8D6] bg-white hover:border-[#F59E0B] hover:-translate-y-0.5 shadow-sm'
                }`}
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF7F2] flex items-center justify-center mb-2 border border-[#F3E8D6]">
                  <SafeImage
                    src={opt.imageUrl}
                    alt={`Lựa chọn ${opt.key}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-[#FAF7F2] text-[#1F2937] border border-[#F3E8D6]'
                  }`}
                >
                  {opt.key}
                </div>
                {showResult && isTarget && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#22C55E] text-white">
                    Đúng
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-xs text-[#1F2937] space-y-1.5">
            <div>
              <span className="font-semibold text-[#6B7280]">Đáp án chuẩn: </span>
              <span className="font-bold text-[#22C55E]">{correctKey}</span>
            </div>
            <div className="pt-1 border-t border-[#F3E8D6]">
              <span className="font-semibold text-[#1F2937]">Giải thích chi tiết: </span>
              <span className="text-[#6B7280] leading-relaxed">
                {explanation
                  ? (typeof explanation === 'object' ? explanation.vi || JSON.stringify(explanation) : explanation)
                  : 'Chưa có giải thích cho câu hỏi này.'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single Choice / Listen & Choose / Tone Selection
  if (type === 'SINGLE_CHOICE' || type === 'LISTEN_AND_CHOOSE' || type === 'TONE_SELECTION') {
    const selectedKey = String(userAnswer || '').trim();
    const correctKey = showResult && correctAnswer?.value ? String(correctAnswer.value).trim() : null;

    const instructionText = cleanText(prompt.instruction, 'Nghe và chọn đáp án đúng');
    const vocab = cleanVocab(prompt.wordZh, prompt.wordPinyinBase || prompt.wordPinyin);

    return (
      <div className="space-y-4">
        {instructionText && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            {instructionText}
          </div>
        )}

        {/* Question sentence or prompt */}
        {prompt.questionText && (
          <div className="text-lg font-bold text-[#1F2937] font-chinese">
            {cleanText(prompt.questionText, 'Nội dung câu hỏi đang được cập nhật')}
          </div>
        )}

        {prompt.sentence && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-xl font-chinese font-semibold text-[#1F2937]">
            {cleanText(prompt.sentence, 'Nội dung câu hỏi đang được cập nhật')}
          </div>
        )}

        {prompt.wordZh && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6]">
            <span className="text-2xl font-chinese font-bold text-[#D97706]">{vocab.wordZh}</span>
            {vocab.wordPinyin && (
              <span className="text-sm font-medium text-[#6B7280]">({vocab.wordPinyin})</span>
            )}
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {prompt.options?.map((opt: any) => {
            const isSelected = selectedKey === opt.key;
            const isTarget = correctKey === opt.key;
            const isWrong = showResult && isSelected && !isTarget;

            let cardStyles = 'border-[#F3E8D6] bg-white text-[#1F2937] hover:border-[#F59E0B] hover:-translate-y-0.5 shadow-sm';
            if (showResult && isTarget) {
              cardStyles = 'border-[#22C55E] bg-[#ECFDF5] text-[#1F2937] font-semibold shadow-sm';
            } else if (isWrong) {
              cardStyles = 'border-[#EF4444] bg-[#FEF2F2] text-[#EF4444] font-semibold shadow-sm';
            } else if (isSelected) {
              cardStyles = 'border-[#F59E0B] bg-[#FFF7E6] text-[#1F2937] font-semibold shadow-sm -translate-y-0.5';
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={readOnly}
                onClick={() => onChangeAnswer(opt.key)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${cardStyles}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    showResult && isTarget
                      ? 'bg-[#22C55E] text-white'
                      : isWrong
                      ? 'bg-[#EF4444] text-white'
                      : isSelected
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-[#FAF7F2] text-[#6B7280] border border-[#F3E8D6]'
                  }`}
                >
                  {opt.key}
                </div>
                <div className="flex-1 font-chinese text-base leading-snug">{opt.text}</div>
                {showResult && isTarget && (
                  <span className="text-xs font-bold text-[#22C55E] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Chuẩn
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-xs text-[#1F2937] space-y-1.5">
            <div>
              <span className="font-semibold text-[#6B7280]">Đáp án chuẩn: </span>
              <span className="font-bold text-[#22C55E]">{correctKey}</span>
            </div>
            <div className="pt-1 border-t border-[#F3E8D6]">
              <span className="font-semibold text-[#1F2937]">Giải thích chi tiết: </span>
              <span className="text-[#6B7280] leading-relaxed">
                {explanation
                  ? (typeof explanation === 'object' ? explanation.vi || JSON.stringify(explanation) : explanation)
                  : 'Chưa có giải thích cho câu hỏi này.'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Character Writing Question
  if (type === 'CHARACTER_WRITING') {
    return (
      <div className="space-y-4">
        {prompt.instruction && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            {prompt.instruction}
          </div>
        )}

        <CharacterWritingQuestion
          character={prompt.character}
          pinyin={prompt.pinyin}
          meaning={prompt.meaning}
          strokeName={prompt.strokeName}
          strokes={prompt.strokes}
          instruction={prompt.instruction}
          value={userAnswer}
          onChange={onChangeAnswer}
          readOnly={readOnly}
        />

        {showResult && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-xs space-y-1.5">
            <span className="font-semibold text-[#1F2937]">Giải thích chi tiết: </span>
            <span className="text-[#6B7280] leading-relaxed">
              {explanation
                ? (typeof explanation === 'object' ? explanation.vi || JSON.stringify(explanation) : explanation)
                : 'Chưa có giải thích cho câu hỏi này.'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Text Input Question
  if (type === 'TEXT_INPUT') {
    const rawVal = typeof userAnswer === 'string' ? userAnswer : '';
    const placeholder = prompt.placeholder || 'Nhập câu trả lời...';
    const maxLength = typeof prompt.maxLength === 'number' && prompt.maxLength > 0 ? prompt.maxLength : 100;
    const textBefore = prompt.textBefore || prompt.prefix || null;
    const textAfter = prompt.textAfter || prompt.suffix || null;

    const instructionText = cleanText(prompt.instruction, 'Nhập câu trả lời chính xác');
    const contentText = prompt.content ? cleanText(prompt.content, 'Nội dung câu hỏi đang được cập nhật') : null;
    const promptTextVal = prompt.promptText ? cleanText(prompt.promptText, 'Nội dung câu hỏi đang được cập nhật') : null;

    let correctText = '';
    if (showResult && correctAnswer) {
      if (typeof correctAnswer === 'object') {
        const rawCorrect = String(correctAnswer.value ?? '');
        correctText = cleanAnswerText(rawCorrect);
        if (Array.isArray(correctAnswer.acceptedValues) && correctAnswer.acceptedValues.length > 0) {
          const cleanedAccepted = correctAnswer.acceptedValues.map((v: any) => cleanAnswerText(String(v)));
          correctText += ` (hoặc: ${cleanedAccepted.join(', ')})`;
        }
      } else {
        correctText = cleanAnswerText(String(correctAnswer));
      }
    }

    return (
      <div className="space-y-4">
        {instructionText && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            {instructionText}
          </div>
        )}

        {contentText && (
          <div className="text-sm font-medium text-[#1F2937] leading-relaxed">
            {contentText}
          </div>
        )}

        {promptTextVal && (
          <div className="text-base font-semibold text-[#1F2937]">
            {promptTextVal}
          </div>
        )}

        <div className="p-5 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {textBefore && (
              <span className="text-sm font-semibold text-[#1F2937] select-none">
                {textBefore}
              </span>
            )}

            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                aria-label={prompt.instruction || prompt.promptText || 'Câu trả lời của bạn'}
                value={rawVal}
                disabled={readOnly}
                maxLength={maxLength}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  // Chặn submit toàn bài khi nhấn phím Enter
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  onChangeAnswer(e.target.value);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-base font-medium transition-all outline-none border ${
                  readOnly
                    ? 'bg-[#FAF7F2] border-[#F3E8D6] text-[#6B7280] cursor-not-allowed opacity-90'
                    : 'bg-[#FAF7F2] border-[#F3E8D6] text-[#1F2937] focus:bg-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                }`}
              />
            </div>

            {textAfter && (
              <span className="text-sm font-semibold text-[#1F2937] select-none">
                {textAfter}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
            <span>Hỗ trợ gõ trực tiếp Pinyin có dấu (ā, á, ǎ, à...)</span>
            <span>{rawVal.length}/{maxLength}</span>
          </div>
        </div>

        {showResult && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-xs space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-[#6B7280] shrink-0">Đáp án chuẩn:</span>
              <span className="font-bold text-[#22C55E]">{correctText}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold text-[#6B7280] shrink-0">Bạn đã nhập:</span>
              <span className={`font-semibold ${rawVal ? 'text-[#1F2937]' : 'text-[#6B7280] italic'}`}>
                {rawVal || '(Bỏ trống)'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#F3E8D6] text-[#6B7280] leading-relaxed">
              <span className="font-semibold text-[#1F2937]">Giải thích chi tiết: </span>
              <span>
                {explanation
                  ? (typeof explanation === 'object' ? explanation.vi || JSON.stringify(explanation) : explanation)
                  : 'Chưa có giải thích cho câu hỏi này.'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback / Unknown question renderer
  return (
    <div className="p-4 rounded-xl bg-white border border-[#F3E8D6] text-sm text-[#1F2937]">
      <div className="font-semibold text-[#F59E0B] mb-2">Câu hỏi ({type})</div>
      <div className="text-xs text-[#6B7280]">{JSON.stringify(prompt)}</div>
    </div>
  );
};
