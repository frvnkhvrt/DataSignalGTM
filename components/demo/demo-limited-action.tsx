"use client";

import { cloneElement, type MouseEvent, type ReactElement } from "react";
import { toast } from "sonner";
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

  if (!isDemo) return children;

  return (
    <span className={cn("inline-flex", wrapperClassName)} title={DEMO_TOOLTIP}>
      {cloneElement(children, {
        disabled: false,
        title: DEMO_TOOLTIP,
        "aria-disabled": true,
        className: cn(
          children.props.className,
          "cursor-not-allowed opacity-55 saturate-50 hover:translate-y-0 hover:bg-muted"
        ),
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          showDemoLimitation(action);
        },
      })}
    </span>
  );
}
