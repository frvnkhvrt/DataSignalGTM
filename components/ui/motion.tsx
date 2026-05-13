"use client";

import * as React from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";

// ── Token layer ────────────────────────────────────────────────────────────────

export const dur = {
  instant: 0.12,
  fast: 0.18,
  base: 0.24,
  smooth: 0.36,
  slow: 0.42,
  reveal: 0.52,
} as const;

export const ease = {
  premium: [0.16, 1, 0.3, 1] as const,
  out: [0.0, 0.0, 0.2, 1.0] as const,
  in: [0.4, 0.0, 1.0, 1.0] as const,
  inOut: [0.4, 0.0, 0.2, 1.0] as const,
} as const;

export const spring = {
  snappy: { type: "spring" as const, stiffness: 500, damping: 36, mass: 0.8 },
  bouncy: { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.9 },
  gentle: { type: "spring" as const, stiffness: 220, damping: 34, mass: 1.0 },
  slow: { type: "spring" as const, stiffness: 140, damping: 30, mass: 1.2 },
} as const;

/** The standard tween used throughout the app, matching --ease-premium */
export const premiumTween = {
  duration: dur.base,
  ease: ease.premium,
} as const;

// ── Variant presets ────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.base, ease: ease.premium } },
  exit: { opacity: 0, transition: { duration: dur.fast, ease: ease.in } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.reveal, ease: ease.premium },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

/** Like slideUp but with a subtle blur — use for page-level section reveals only. */
export const slideUpBlur: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: dur.reveal, ease: ease.premium },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: dur.base, ease: ease.premium },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const springPop: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

/** Tighter stagger for dense lists (command palette items, issue cards, etc.) */
export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
};

export const staggerItem: Variants = slideUp;

export const listRowEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.smooth, ease: ease.premium },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: dur.fast, ease: ease.in },
  },
};

export const statusPulse: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.42, ease: ease.premium, repeat: 0 },
  },
};

// ── Type helpers ───────────────────────────────────────────────────────────────

type MotionDivProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: React.ReactNode;
};

type RevealProps = MotionDivProps & {
  delay?: number;
};

// ── Reveal ─────────────────────────────────────────────────────────────────────

/** Fade + slide-up reveal on scroll-into-view. Used for marketing sections. */
function Reveal({ delay = 0, children, ...props }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.24 }}
      variants={slideUp}
      transition={{ duration: dur.reveal, ease: ease.premium, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger / StaggerItem ──────────────────────────────────────────────────────

/** Container that staggers its children on scroll-into-view. */
function Stagger({ children, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={staggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child; place inside `<Stagger>`. */
function StaggerItem({ children, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}

// ── PageReveal ─────────────────────────────────────────────────────────────────

/** Wraps a page section with a fade + slide entrance on mount (not scroll). */
function PageReveal({
  delay = 0,
  children,
  ...props
}: MotionDivProps & { delay?: number }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpBlur}
      transition={{ duration: dur.reveal, ease: ease.premium, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── MotionCard ─────────────────────────────────────────────────────────────────

/** A div with a subtle scale + shadow lift on hover. */
function MotionCard({ children, className, ...props }: MotionDivProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -2, scale: 1.012 }}
      transition={spring.snappy}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── MotionList / MotionListItem ────────────────────────────────────────────────

type MotionListProps = {
  children: React.ReactNode;
  className?: string;
  as?: "ul" | "div" | "ol";
};

/**
 * A list container that manages `AnimatePresence` for its children.
 * Wrap items in `<MotionListItem key={id}>` to get enter/exit animations.
 */
function MotionList({ children, className, as: Tag = "div" }: MotionListProps) {
  return (
    <Tag className={className}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </Tag>
  );
}

type MotionListItemProps = {
  children: React.ReactNode;
  className?: string;
  as?: "li" | "div" | "tr";
};

/** Animated list item for use inside `<MotionList>`. Must have a stable `key`. */
function MotionListItem({
  children,
  className,
  as: Tag = "div",
  ...rest
}: MotionListItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <Tag className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </Tag>
    );
  }

  if (Tag === "tr") {
    return (
      <motion.tr
        className={className}
        variants={listRowEnter}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout="position"
        {...(rest as HTMLMotionProps<"tr">)}
      >
        {children}
      </motion.tr>
    );
  }

  if (Tag === "li") {
    return (
      <motion.li
        className={className}
        variants={listRowEnter}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout="position"
        {...(rest as HTMLMotionProps<"li">)}
      >
        {children}
      </motion.li>
    );
  }

  return (
    <motion.div
      className={className}
      variants={listRowEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout="position"
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

// ── Exports ────────────────────────────────────────────────────────────────────

export {
  // Components
  Reveal,
  Stagger,
  StaggerItem,
  PageReveal,
  MotionCard,
  MotionList,
  MotionListItem,
};
