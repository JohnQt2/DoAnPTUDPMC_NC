import React from 'react';
import { PracticeCategory } from '../../pages/admin/practice/practice-admin.types';
import { CATEGORY_LABELS } from '../../pages/admin/practice/practice-admin.constants';

export const PracticeCategoryBadge: React.FC<{ category: PracticeCategory }> = ({ category }) => {
  const item = CATEGORY_LABELS[category] || { label: category, badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.badge}`}>
      {item.label}
    </span>
  );
};
