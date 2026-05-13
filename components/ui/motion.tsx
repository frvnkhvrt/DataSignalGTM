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
  // Pure fade exit — avoids upward flick in table rows and dense lists
  exit: {
    opacity: 0,
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

// Semantic element types for Stagger / StaggerItem
type StaggerAsTag = "div" | "ul" | "ol" | "section" | "nav";
type StaggerItemAsTag = "div" | "li";

// Shared HTML attributes safe to forward to any element type
type CommonMotionProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  children: React.ReactNode;
};

// Module-level lookup so elements aren't recreated on each render.
// Cast as React.ElementType — the standard polymorphic component pattern —
// to avoid incompatible event-handler overloads (e.g. Motion's onDrag vs DOM's).
const staggerTagMap: Record<StaggerAsTag, React.ElementType> = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  section: motion.section,
  nav: motion.nav,
};

const staggerItemTagMap: Record<StaggerItemAsTag, React.ElementType> = {
  div: motion.div,
  li: motion.li,
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

/**
 * Container that staggers its children on scroll-into-view.
 *
 * The stagger step is calculated automatically from the child count so that
 * the total stagger window never exceeds ~400ms regardless of list length:
 *   staggerStep = Math.min(0.08, 400ms / childCount)
 *
 * Override with an explicit `count` prop when the child count is dynamic
 * (e.g. filtered lists) or when React.Children.count would be unreliable.
 *
 * Use `as` to render a semantic HTML element instead of the default `div`:
 *   <Stagger as="ul"> → renders a <ul> (use with <StaggerItem as="li">)
 *   <Stagger as="section"> → renders a <section>
 */
function Stagger({
  children,
  as = "div",
  count: countProp,
  ...props
}: CommonMotionProps & { as?: StaggerAsTag; count?: number }) {
  const reduced = useReducedMotion();
  const autoCount = React.Children.count(children);
  const count = Math.max(1, countProp ?? autoCount);
  // Cap total stagger at 400ms: if 10 items @ 0.08s = 800ms → too long.
  // Formula keeps individual step ≤ 80ms and total ≤ 400ms.
  const staggerStep = Math.min(0.08, 0.4 / count);

  if (reduced) {
    const PlainTag = as as React.ElementType;
    return <PlainTag {...props}>{children}</PlainTag>;
  }

  const MotionTag = staggerTagMap[as];

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerStep,
            delayChildren: 0.06,
          },
        },
      }}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </MotionTag>
  );
}

/**
 * A single staggered child; place inside `<Stagger>`.
 *
 * Use `as="li"` when the parent `<Stagger>` renders as `"ul"` or `"ol"`:
 *   <Stagger as="ul"><StaggerItem as="li">…</StaggerItem></Stagger>
 */
function StaggerItem({
  children,
  as = "div",
  ...props
}: CommonMotionProps & { as?: StaggerItemAsTag }) {
  const reduced = useReducedMotion();

  if (reduced) {
    const PlainTag = as as React.ElementType;
    return <PlainTag {...props}>{children}</PlainTag>;
  }

  const MotionTag = staggerItemTagMap[as];

  return (
    <MotionTag
      variants={staggerItem}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </MotionTag>
  );
}

// ── PageReveal ─────────────────────────────────────────────────────────────────

/**
 * Base stagger step between sequential page sections.
 * Four sections at 0.08s apart means the last beat starts at 240ms —
 * well within the attention window without feeling slow.
 */
export const PAGE_REVEAL_STAGGER = 0.08;

/**
 * Wraps a page section with a fade + slide entrance on mount (not scroll).
 *
 * Prefer `order` (0-based index) so delay is derived automatically:
 *   <PageReveal order={0}>   →  delay 0ms   (hero)
 *   <PageReveal order={1}>   →  delay 80ms  (metrics)
 *   <PageReveal order={2}>   →  delay 160ms (charts)
 *   <PageReveal order={3}>   →  delay 240ms (panels)
 *
 * The legacy `delay` prop is still accepted for one-off overrides.
 */
function PageReveal({
  order,
  delay = 0,
  children,
  ...props
}: MotionDivProps & { order?: number; delay?: number }) {
  const reduced = useReducedMotion();
  const resolvedDelay = order !== undefined ? order * PAGE_REVEAL_STAGGER : delay;

  if (reduced) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpBlur}
      transition={{ duration: dur.reveal, ease: ease.premium, delay: resolvedDelay }}
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
