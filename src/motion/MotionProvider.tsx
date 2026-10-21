import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Motion respects `prefers-reduced-motion` by default. Reduced motion keeps
 * opacity fades (so context is not lost) and drops transforms, springs and
 * layout animation.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.4, ease: [0.22, 0.9, 0.3, 1] }}
    >
      {children}
    </MotionConfig>
  );
}
