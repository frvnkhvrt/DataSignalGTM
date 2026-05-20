"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Orchestrates page transition animations across router navigation events.
 * Keying on the pathname forces Framer Motion to unmount the old screen
 * and mount the new screen, triggering staggered entrances and layout morphing.
 */
export function LayoutTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
          hidden: {
            opacity: 0,
            y: 12,
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 30,
              staggerChildren: 0.05,
              delayChildren: 0.02,
            },
          },
          exit: {
            opacity: 0,
            y: -10,
            transition: {
              duration: 0.18,
              ease: [0.16, 1, 0.3, 1], // ease-out expo
            },
          },
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
