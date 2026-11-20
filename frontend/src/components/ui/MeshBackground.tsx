import React from 'react';
import { cn } from '../../lib/cn';
import { ThreeAmbientGlassCanvas } from '../three/ThreeAmbientGlassCanvas';

interface MeshBackgroundProps {
  variant?: 'dark' | 'light';
  showHanzi?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  variant = 'dark',
  className,
  children,
}) => {
  if (variant === 'light') {
    return (
      <div className={cn('relative min-h-screen overflow-x-clip', className)}>
        {/* Global SVG Optical Refraction Filter (subtle curved glass lens) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed w-0 h-0 overflow-hidden"
          style={{ position: 'fixed', width: 0, height: 0 }}
        >
          <defs>
            <filter id="ios-liquid-refraction" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.011 0.014"
                numOctaves="2"
                seed="7"
                result="lensNoise"
              />
              <feGaussianBlur in="lensNoise" stdDeviation="7" result="smoothLens" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="smoothLens"
                scale="10"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Warm Museum Rice-Paper Base (#F4F2EE) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 workspace-mesh-bg"
        />

        {/* Real 3D WebGL Floating Liquid Glass Sculpture Backdrop (ThreeUI-inspired) */}
        <ThreeAmbientGlassCanvas />

        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // Obsidian Gallery Dark Mode (inspired by HOLM & OTTO on Landing.love — calm, restrained, zero neon clutter)
  return (
    <div className={cn('relative overflow-hidden bg-[#090A0F] text-[#F4F2EE]', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundColor: '#090A0F',
          backgroundImage:
            'radial-gradient(ellipse 52% 44% at 78% 22%, rgba(217, 58, 85, 0.14) 0%, transparent 62%), radial-gradient(ellipse 48% 42% at 18% 82%, rgba(148, 163, 184, 0.08) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
