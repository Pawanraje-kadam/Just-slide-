import type { Transition, Variants } from 'motion/react';

/**
 * Shared motion values.
 *
 * The easing curve matches the CSS `--ease-clay` token so JavaScript-driven
 * motion and the hand-authored CSS transitions feel like one system.
 */
export const clayEase = [0.22, 0.9, 0.3, 1] as const;

export const softSpring: Transition = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
  mass: 0.5,
};

/** Fade-and-rise used for section entrances. */
export const revealUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15, margin: '0px 0px -60px 0px' },
  transition: { duration: 0.6, ease: clayEase },
};

/** A quieter entrance for large surfaces that should not travel far. */
export const revealSoft = {
  initial: { opacity: 0, y: 14, scale: 0.994 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.1, margin: '0px 0px -40px 0px' },
  transition: { duration: 0.55, ease: clayEase },
};

/** Page-level entrance, used by the router frame. */
export const pageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: clayEase },
};

export const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: clayEase },
  },
};
