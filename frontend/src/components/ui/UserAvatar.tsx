import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/cn';

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  displayName = 'U',
  size = 'md',
  className,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();
  const hasValidImage = Boolean(avatarUrl && avatarUrl.trim() && !imgFailed);

  if (hasValidImage) {
    return (
      <img
        src={avatarUrl!}
        alt={displayName}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={cn(
          'rounded-full object-cover border border-zinc-200 shrink-0 bg-white',
          SIZE_MAP[size],
          className
        )}
      />
    );
  }

  return (
    <div
      aria-label={displayName}
      className={cn(
        'rounded-full bg-zinc-900 text-white flex items-center justify-center font-display font-semibold uppercase shrink-0 border border-zinc-800',
        SIZE_MAP[size],
        className
      )}
    >
      {initial}
    </div>
  );
};
