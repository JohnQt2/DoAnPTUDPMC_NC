import React from 'react';
import { FileQuestion, Plus } from 'lucide-react';
import { ShimmerButton } from '../ui';

interface EmptyPracticeStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyPracticeState: React.FC<EmptyPracticeStateProps> = ({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) => {
  return (
    <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center border border-slate-200 dark:border-slate-700">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      {(actionLabel && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <ShimmerButton href={actionHref} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {actionLabel}
            </ShimmerButton>
          ) : (
            <ShimmerButton onClick={onAction} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {actionLabel}
            </ShimmerButton>
          )}
        </div>
      )}
    </div>
  );
};
