"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const premiumTransition = {
  duration: 0.24,
  ease: [0.16, 1, 0.3, 1] as const,
};

function AnimatedDialog({
  open,
  onClose,
  children,
  labelledBy,
  className,
  overlayClassName,
  align = "center",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy: string;
  className?: string;
  overlayClassName?: string;
  align?: "center" | "top";
}) {
  const reducedMotion = useReducedMotion();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const panelMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96, y: align === "top" ? -8 : 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: align === "top" ? -6 : 8 },
        transition: premiumTransition,
      };

  const overlayMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "fixed inset-0 z-50 flex bg-background/72 p-4 backdrop-blur-md",
            align === "top" ? "items-start justify-center pt-20" : "items-center justify-center",
            overlayClassName
          )}
          onClick={onClose}
          role="presentation"
          {...overlayMotion}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={cn(
              "w-full rounded-xl border border-border bg-card text-card-foreground shadow-elevated",
              className
            )}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={trapFocus}
            {...panelMotion}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { AnimatedDialog };
