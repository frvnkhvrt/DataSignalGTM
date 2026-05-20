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
  /** Values mirrored in `app/globals.css` :root `--ds-duration-*` — keep in sync. */
  instant: 0.12,
  /** Dense list rows — command palette, micro entrances */
  micro: 0.14,
  fast: 0.18,
  base: 0.24,
  /** Table tbody crossfades, panel swaps */
  swap: 0.22,
  /** Empty-state copy, receipt panels */
  lifted: 0.28,
  /** Demo banner and ambient layout beats */
  banner: 0.32,
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
  /** UI controls: buttons, pills, badges — tight, crisp, zero overshoot */
  snappy: { type: "spring" as const, stiffness: 540, damping: 40, mass: 0.8 },
  /** Entrance pops: card scale-in, icon reveal — slight character without bounce */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 26, mass: 0.85 },
  /** Layout transitions: sidebar pill, tab indicator — smooth and controlled */
  gentle: { type: "spring" as const, stiffness: 280, damping: 36, mass: 0.9 },
  /** Heavy objects: modals, drawer overlays — authoritative, stable */
  slow: { type: "spring" as const, stiffness: 140, damping: 30, mass: 1.2 },
  /** DialogMotionContent / command-sheet panels — tuned blur settle (pairs with overlayPanelMotion) */
  dialogPanel: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 },
  /** Sidebar `layoutId` active pill */
  sidebarPill: { type: "spring" as const, stiffness: 380, damping: 36, mass: 0.9 },
  /** KPI / metric value pop when the number changes */
  metricPop: { type: "spring" as const, stiffness: 480, damping: 32, mass: 0.75 },
  /** Organic/living transition spring — stiffness 400, damping 30 */
  vibrant: { type: "spring" as const, stiffness: 400, damping: 30, mass: 1.0 },
} as const;

/** The standard tween used throughout the app, matching --ease-premium */
export const premiumTween = {
  duration: dur.base,
  ease: ease.premium,
} as const;

/** Default transition on motion root (`MotionConfig` in providers). */
export const motionDefaultsTransition = {
  duration: dur.base,
  ease: ease.premium,
} as const;

export function overlayBackdropMotion(reduced: boolean | null) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduced ? 0.01 : dur.fast, ease: ease.premium },
  };
}

/**
 * Shared modal / palette panel choreography for `DialogMotionContent` — keeps every overlay
 * shell visually aligned (spring in, premium ease out).
 */
export function overlayPanelMotion(reduced: boolean | null, align: "center" | "top") {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: dur.instant, ease: ease.premium },
    };
  }
  return {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: align === "top" ? -10 : 12,
      filter: "blur(6px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: spring.dialogPanel,
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      y: align === "top" ? -6 : 8,
      filter: "blur(4px)",
      transition: { duration: dur.fast, ease: ease.in },
    },
  };
}

export const transitionPaletteItem = { duration: dur.micro, ease: ease.premium };
export const transitionPaletteEmpty = { duration: dur.swap, ease: ease.premium };
export const transitionTopBarSubtitle = { duration: dur.fast, ease: ease.premium };
export const transitionOnboardingStep = { duration: dur.base, ease: ease.premium };
export const transitionTableSkeletonFade = { duration: dur.fast, ease: ease.premium };
export const transitionTableContentFade = { duration: dur.swap, ease: ease.premium };
export const transitionReceiptCrossfadeShort = { duration: dur.fast, ease: ease.premium };
export const transitionReceiptCrossfade = { duration: dur.swap, ease: ease.premium };
export const transitionReceiptContent = { duration: dur.lifted, ease: ease.premium };
export const transitionEmptyStateText = {
  duration: dur.lifted,
  ease: ease.premium,
  delay: 0.1,
} as const;
export const transitionEmptyStateAction = {
  duration: dur.swap,
  ease: ease.premium,
  delay: 0.2,
} as const;
export const transitionQueryErrorCopy = {
  duration: dur.base,
  ease: ease.premium,
  delay: 0.16,
} as const;
export const transitionDemoBanner = { duration: dur.banner, ease: ease.premium };

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
  hidden: { opacity: 0, y: 8, filter: "blur(2px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: dur.reveal, ease: ease.premium },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(2px)",
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

/** Single palette row — parent must use staggerContainerFast */
export const cmdPaletteItemVariants: Variants = {
  hidden: { opacity: 0, y: 3 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionPaletteItem,
  },
};

export const staggerItem: Variants = slideUp;

export const listRowEnter: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.base, ease: ease.premium },
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
    transition: { duration: dur.slow, ease: ease.premium, repeat: 0 },
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
      whileHover={{ y: -1.5, scale: 1.008 }}
      whileTap={{ scale: 0.994, y: 0 }}
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

// ── MotionIcon ─────────────────────────────────────────────────────────────────

/**
 * Wraps an icon node with a spring scale + rotation on hover.
 * Ideal for CTA icons, sidebar icons, and interactive icon buttons.
 */
function MotionIcon({
  children,
  className,
  rotate = 12,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex" }}
      whileHover={{ scale: 1.18, rotate }}
      transition={spring.snappy}
    >
      {children}
    </motion.span>
  );
}

// ── FadeSlide ──────────────────────────────────────────────────────────────────

/**
 * Lightweight fade + slide-up for inline content reveals.
 * Lighter than `PageReveal` — animates on mount, no scroll trigger.
 */
function FadeSlide({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.fast, ease: ease.premium, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Magnetic Attraction ────────────────────────────────────────────────────────

export function Magnetic({ children, scale = 0.3 }: { children: React.ReactNode; scale?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (reduced) return;
    const parent = ref.current?.closest("a") || ref.current?.closest("button");
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = parent.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const x = (clientX - centerX) * scale;
      const y = (clientY - centerY) * scale;
      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    parent.addEventListener("mousemove", handleMouseMove as EventListener);
    parent.addEventListener("mouseleave", handleMouseLeave as EventListener);
    return () => {
      parent.removeEventListener("mousemove", handleMouseMove as EventListener);
      parent.removeEventListener("mouseleave", handleMouseLeave as EventListener);
    };
  }, [scale, reduced]);

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      ref={ref}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ display: "inline-flex" }}
    >
      {children}
    </motion.div>
  );
}

// ── Glow Ripple ────────────────────────────────────────────────────────────────

export interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function useGlowRipples() {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const addRipple = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((prev) => [...prev, { id: Date.now() + Math.random(), x, y }]);
  };
  const clearRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };
  return { ripples, addRipple, clearRipple };
}

export function GlowRippleContainer({ ripples, onClear }: { ripples: Ripple[]; onClear: (id: number) => void }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full border border-primary/40 bg-primary/5 shadow-[0_0_12px_var(--color-primary)] pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
            }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 22, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => onClear(ripple.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Dynamic Glass Card ─────────────────────────────────────────────────────────

export const glassCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
    scale: 0.98,
    "--card-opacity": 0.35,
    "--card-blur": "4px",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    "--card-opacity": 0.65,
    "--card-blur": "12px",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    "--card-opacity": 0.35,
    "--card-blur": "4px",
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

import { cn } from "@/lib/utils";

export const DynamicGlassCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof motion.div>
>(({ children, className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={glassCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("ds-dynamic-glass-card border border-border/70 shadow-soft ring-1 ring-black/[0.04] dark:ring-white/[0.06]", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});
DynamicGlassCard.displayName = "DynamicGlassCard";

// ── Page Transition Wrapper ────────────────────────────────────────────────────

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  
  if (reduced) return <>{children}</>;
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 30,
            staggerChildren: 0.05,
          },
        },
        exit: {
          opacity: 0,
          y: -10,
          transition: {
            duration: 0.2,
            ease: ease.premium,
          },
        },
      }}
      className="w-full"
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
  MotionIcon,
  FadeSlide,
};
