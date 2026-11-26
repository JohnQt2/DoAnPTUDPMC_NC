import React from 'react';
import { PracticeCollectionStatus, PracticeVersionStatus } from '../../pages/admin/practice/practice-admin.types';
import { COLLECTION_STATUS_CONFIG, VERSION_STATUS_CONFIG } from '../../pages/admin/practice/practice-admin.constants';

interface PracticeStatusBadgeProps {
  status: PracticeCollectionStatus | PracticeVersionStatus;
  type?: 'collection' | 'version';
  size?: 'sm' | 'md';
}

export const PracticeStatusBadge: React.FC<PracticeStatusBadgeProps> = ({
  status,
  type = 'collection',
  size = 'md',
}) => {
  const config =
    type === 'collection'
      ? COLLECTION_STATUS_CONFIG[status as PracticeCollectionStatus] || COLLECTION_STATUS_CONFIG.DRAFT
      : VERSION_STATUS_CONFIG[status as PracticeVersionStatus] || VERSION_STATUS_CONFIG.DRAFT;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
    >
      {'dot' in config && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
};
