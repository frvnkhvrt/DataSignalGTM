"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

const transition = {
  duration: 0.42,
  ease: [0.16, 1, 0.3, 1],
} as const;

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition,
  },
};

const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

type MotionDivProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: React.ReactNode;
};

type RevealProps = MotionDivProps & {
  delay?: number;
};

function Reveal({ delay = 0, children, ...props }: RevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={revealVariants}
      transition={{ ...transition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function Stagger({ children, ...props }: MotionDivProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, ...props }: MotionDivProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div variants={revealVariants} {...props}>
      {children}
    </motion.div>
  );
}

export { Reveal, Stagger, StaggerItem };
