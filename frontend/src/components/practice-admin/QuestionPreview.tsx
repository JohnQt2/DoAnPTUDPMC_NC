import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { QuestionRenderer } from '../practice/QuestionRenderer';
import { PracticeAdminQuestion } from '../../pages/admin/practice/practice-admin.types';

interface QuestionPreviewProps {
  question: PracticeAdminQuestion;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question }) => {
  const [userAns, setUserAns] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Xem trước giao diện học viên (Live Preview)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAnswer(!showAnswer)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
        </button>
      </div>

      <div className="py-2">
        <QuestionRenderer
          question={question}
          userAnswer={userAns}
          onChangeAnswer={setUserAns}
          showResult={showAnswer}
          correctAnswer={question.answer}
          explanation={question.explanation}
        />
      </div>
    </div>
  );
};
