import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { clayEase } from './presets';

/**
 * Fades and lifts each route on navigation. Keyed on `pathname` only, so
 * filter/search param changes inside Explore never re-trigger the transition.
 */
export function RouteFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <motion.div
      key={pathname}
      className="route-frame"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: clayEase }}
    >
      {children}
    </motion.div>
  );
}
