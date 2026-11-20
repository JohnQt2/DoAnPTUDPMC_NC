import React from 'react';

interface BorderBeamProps {
  className?: string;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

/**
 * Intentionally disabled in 2026 Minimalist SaaS theme (replaced by crisp 1px architectural borders).
 */
export const BorderBeam: React.FC<BorderBeamProps> = () => null;
