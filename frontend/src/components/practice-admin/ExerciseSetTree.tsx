import React from 'react';
import {
  Folder,
  HelpCircle,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  GripVertical,
} from 'lucide-react';
import {
  PracticeAdminExerciseSet,
  PracticeAdminQuestion,
} from '../../pages/admin/practice/practice-admin.types';

interface ExerciseSetTreeProps {
  exerciseSets: PracticeAdminExerciseSet[];
  selectedSetId: number | null;
  selectedQuestionId: number | null;
  isEditable: boolean;
  onSelectSet: (setId: number) => void;
  onSelectQuestion: (setId: number, questionId: number) => void;
  onAddSet: () => void;
  onAddQuestion: (setId: number) => void;
  onMoveSet: (setId: number, direction: 'up' | 'down') => void;
  onMoveQuestion: (setId: number, questionId: number, direction: 'up' | 'down') => void;
}

export const ExerciseSetTree: React.FC<ExerciseSetTreeProps> = ({
  exerciseSets,
  selectedSetId,
  selectedQuestionId,
  isEditable,
  onSelectSet,
  onSelectQuestion,
  onAddSet,
  onAddQuestion,
  onMoveSet,
  onMoveQuestion,
}) => {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Phần thi & Câu hỏi ({exerciseSets.reduce((acc, s) => acc + s.questions.length, 0)} câu)
        </h3>
        {isEditable && (
          <button
            type="button"
            onClick={onAddSet}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm phần</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {exerciseSets.map((set, sIdx) => {
          const isSetSelected = selectedSetId === set.id && selectedQuestionId === null;

          return (
            <div
              key={set.id}
              className={`rounded-2xl border transition-all ${
                isSetSelected
                  ? 'border-rose-500 bg-rose-500/[0.04] shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40'
              }`}
            >
              {/* Exercise Set Header */}
              <div
                onClick={() => onSelectSet(set.id)}
                className="group flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-t-2xl"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSetSelected ? 'text-rose-500' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-chinese">
                      {set.titleZh}
                    </div>
                    {set.titleVi && (
                      <div className="text-[11px] text-slate-400 truncate">{set.titleVi}</div>
                    )}
                  </div>
                </div>

                {isEditable && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      type="button"
                      disabled={sIdx === 0}
                      onClick={() => onMoveSet(set.id, 'up')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={sIdx === exerciseSets.length - 1}
                      onClick={() => onMoveSet(set.id, 'down')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddQuestion(set.id)}
                      title="Thêm câu hỏi vào phần này"
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 cursor-pointer ml-1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="p-1.5 pt-0 space-y-1">
                {set.questions.map((q, qIdx) => {
                  const isQSelected = selectedQuestionId === q.id;

                  return (
                    <div
                      key={q.id}
                      onClick={() => onSelectQuestion(set.id, q.id)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
                        isQSelected
                          ? 'bg-rose-500 text-white font-semibold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <HelpCircle
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isQSelected ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">
                          Câu {q.sortOrder}: {q.code}
                        </span>
                      </div>

                      {isEditable && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center gap-0.5 ${
                            isQSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={qIdx === 0}
                            onClick={() => onMoveQuestion(set.id, q.id, 'up')}
                            className="p-0.5 rounded hover:bg-black/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={qIdx === set.questions.length - 1}
                            onClick={() => onMoveQuestion(set.id, q.id, 'down')}
                            className="p-0.5 rounded hover:bg-black/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {set.questions.length === 0 && (
                  <div className="py-2 px-3 text-center text-[11px] text-slate-400 italic">
                    Chưa có câu hỏi nào trong phần này
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {exerciseSets.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có phần thi nào. Hãy nhấn "Thêm phần" để bắt đầu soạn đề.
          </div>
        )}
      </div>
    </div>
  );
};
