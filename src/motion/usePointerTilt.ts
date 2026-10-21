import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * Subtle pointer-driven tilt for the hero illustration.
 *
 * Mouse only: touch and pen inputs are ignored so scrolling on mobile never
 * fights the artwork. When reduced motion is requested the values stay flat.
 */
export function usePointerTilt(intensity = 6) {
  const reduce = useReducedMotion();
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [intensity, -intensity]), {
    stiffness: 140,
    damping: 22,
    mass: 0.4,
  });
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-intensity, intensity]), {
    stiffness: 140,
    damping: 22,
    mass: 0.4,
  });

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  const onPointerLeave = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return {
    rotateX,
    rotateY,
    transformPerspective: 1400,
    onPointerMove,
    onPointerLeave,
  };
}
