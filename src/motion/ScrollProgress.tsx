import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

/**
 * A hairline reading-progress bar pinned to the top of the viewport.
 * Purely decorative: it is hidden from assistive technology, and it tracks
 * the scroll position instantly when reduced motion is requested.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX: reduceMotion ? scrollYProgress : smoothed }}
      aria-hidden="true"
      initial={false}
    />
  );
}
