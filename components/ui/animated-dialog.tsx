"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { overlayBackdropMotion, overlayPanelMotion } from "@/components/ui/motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
      // Restore focus to the trigger element. Fall back to document.body when
      // the trigger has been removed from the DOM (e.g. optimistic UI updates).
      if (previous?.isConnected) {
        previous.focus();
      } else {
        document.body.focus();
      }
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

  const panelMotion = overlayPanelMotion(reducedMotion, align);

  const overlayMotion = overlayBackdropMotion(reducedMotion);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "fixed inset-0 z-50 flex p-4 backdrop-blur-lg",
            "bg-background/72 [background-image:radial-gradient(ellipse_at_50%_0%,color-mix(in_oklch,var(--primary)_6%,transparent),transparent_60%)]",
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
              "w-full rounded-xl border border-border/80 bg-card text-card-foreground",
              "ring-1 ring-primary/[0.06] ds-dialog-panel-shadow",
              "[background-image:linear-gradient(to_bottom,color-mix(in_oklch,var(--card)_100%,transparent),var(--card))]",
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
