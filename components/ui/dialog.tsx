"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import {
  overlayBackdropMotion,
  overlayPanelMotion,
} from "@/components/ui/motion";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-background/70 backdrop-blur-sm duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "ds-dialog-panel-shadow fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card/95 p-4 text-sm text-card-foreground shadow-elevated backdrop-blur-xl duration-[var(--ds-duration-fast)] ease-[var(--ease-premium)] outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button variant="ghost" className="absolute top-2 right-2" size="icon">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Radix `Dialog` + springed overlay/panel (same choreography as legacy AnimatedDialog).
 * Pass `open` matching the parent `<Dialog open={…}>` value. Uses `forceMount` on the portal
 * so Radix focus/scroll-lock stay correct while `AnimatePresence` runs exit motion.
 */
function DialogMotionContent({
  open,
  align = "center",
  children,
  className,
  overlayClassName,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** Must match the parent `<Dialog open={…}>` value. */
  open: boolean;
  align?: "center" | "top";
  showCloseButton?: boolean;
  overlayClassName?: string;
}) {
  const reduced = useReducedMotion();
  const backdrop = overlayBackdropMotion(reduced);
  const panel = overlayPanelMotion(reduced, align);

  return (
    <DialogPrimitive.Portal forceMount>
      <AnimatePresence initial={false}>
        {open ? (
          <DialogPrimitive.Overlay key="dialog-motion-overlay" asChild forceMount>
            <motion.div
              aria-hidden
              className={cn(
                "fixed inset-0 z-50 backdrop-blur-lg",
                "bg-background/72 [background-image:radial-gradient(ellipse_at_50%_0%,color-mix(in_oklch,var(--primary)_6%,transparent),transparent_60%)]",
                overlayClassName
              )}
              initial={backdrop.initial}
              animate={backdrop.animate}
              exit={backdrop.exit}
              transition={backdrop.transition}
            />
          </DialogPrimitive.Overlay>
        ) : null}
        {open ? (
          <DialogPrimitive.Content
            key="dialog-motion-content"
            data-slot="dialog-motion-content"
            forceMount
            asChild
            {...props}
          >
            <motion.div
              className={cn(
                align === "top"
                  ? "fixed left-1/2 top-[min(5rem,12vh)] z-[51] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 gap-4 outline-none sm:max-w-lg"
                  : "fixed top-1/2 left-1/2 z-[51] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 outline-none sm:max-w-lg",
                "rounded-xl border border-border/80 bg-card text-card-foreground",
                "ring-1 ring-primary/[0.06] ds-dialog-panel-shadow",
                "[background-image:linear-gradient(to_bottom,color-mix(in_oklch,var(--card)_100%,transparent),var(--card))]",
                className
              )}
              initial={panel.initial}
              animate={panel.animate}
              exit={panel.exit}
            >
              {children}
              {showCloseButton && (
                <DialogPrimitive.Close data-slot="dialog-close" asChild>
                  <Button variant="ghost" className="absolute top-2 right-2" size="icon">
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogPrimitive.Close>
              )}
            </motion.div>
          </DialogPrimitive.Content>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMotionContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
