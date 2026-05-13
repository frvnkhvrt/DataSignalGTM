"use client";

import { cloneElement, type MouseEvent, type ReactElement } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { useAuthContext } from "@/lib/auth-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const DEMO_TOOLTIP = "No disponible en modo demo";
const DEMO_TOAST =
  "Esta acción no está disponible en la demo. ¡Regístrate para usarla!";

type DemoLimitedChildProps = {
  className?: string;
  disabled?: boolean;
  title?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  "aria-disabled"?: boolean;
};

export function useDemoLimitation(surface: string) {
  const { isDemo, org } = useAuthContext();

  function showDemoLimitation(action: string) {
    toast.info(DEMO_TOAST, {
      description: "La demo es de solo lectura para mantener los datos limpios.",
    });
    track({
      event: "demo_limitation_viewed",
      properties: {
        org_id: org.id,
        action,
        surface,
      },
    });
  }

  return { isDemo, showDemoLimitation };
}

export function DemoLimitedAction({
  action,
  surface,
  wrapperClassName,
  children,
}: {
  action: string;
  surface: string;
  wrapperClassName?: string;
  children: ReactElement<DemoLimitedChildProps>;
}) {
  const { isDemo, showDemoLimitation } = useDemoLimitation(surface);
  const reduced = useReducedMotion();

  if (!isDemo) return children;

  return (
    <motion.span
      data-demo-wrapper
      className={cn("inline-flex", wrapperClassName)}
      title={DEMO_TOOLTIP}
      whileTap={reduced ? undefined : { scale: 0.97 }}
    >
      {cloneElement(children, {
        // disabled=false intentionally: keeps the element keyboard-reachable so
        // users discover the demo limitation via the toast + shake feedback.
        // aria-disabled=true signals the semantic state to assistive technology.
        disabled: false,
        title: DEMO_TOOLTIP,
        "aria-disabled": true,
        className: cn(
          children.props.className,
          "cursor-not-allowed opacity-55 saturate-50 hover:translate-y-0 hover:bg-muted"
        ),
        onClick: (event: MouseEvent<HTMLElement>) => {
          event.preventDefault();
          event.stopPropagation();
          showDemoLimitation(action);
          // Trigger CSS shake on the wrapper span via class toggle
          const el = (event.currentTarget as HTMLElement).closest<HTMLElement>(
            "[data-demo-wrapper]"
          );
          if (el && !reduced) {
            el.classList.remove("ds-shake");
            // Force reflow so re-adding the class re-triggers animation
            void el.offsetWidth;
            el.classList.add("ds-shake");
          }
        },
      })}
    </motion.span>
  );
}

// Variant that wraps in a div with data attribute for shake targeting
export function DemoLimitedActionShake({
  action,
  surface,
  wrapperClassName,
  children,
}: {
  action: string;
  surface: string;
  wrapperClassName?: string;
  children: ReactElement<DemoLimitedChildProps>;
}) {
  const { isDemo, showDemoLimitation } = useDemoLimitation(surface);
  const reduced = useReducedMotion();

  if (!isDemo) return children;

  function handleClick(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    showDemoLimitation(action);

    const el = (event.currentTarget as HTMLElement).closest<HTMLElement>(
      "[data-demo-wrapper]"
    );
    if (el && !reduced) {
      el.classList.remove("ds-shake");
      void el.offsetWidth;
      el.classList.add("ds-shake");
    }
  }

  return (
    <span
      data-demo-wrapper
      className={cn("inline-flex", wrapperClassName)}
      title={DEMO_TOOLTIP}
    >
      {cloneElement(children, {
        // disabled=false intentionally: keeps the element keyboard-reachable so
        // users discover the demo limitation via the toast + shake feedback.
        // aria-disabled=true signals the semantic state to assistive technology.
        disabled: false,
        title: DEMO_TOOLTIP,
        "aria-disabled": true,
        className: cn(
          children.props.className,
          "cursor-not-allowed opacity-55 saturate-50 hover:translate-y-0 hover:bg-muted"
        ),
        onClick: handleClick,
      })}
    </span>
  );
}
