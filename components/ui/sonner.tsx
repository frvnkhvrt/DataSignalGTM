"use client";

import { Toaster as Sonner } from "sonner";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-4 w-4 text-success" />,
        error: <XCircle className="h-4 w-4 text-destructive" />,
        info: <Info className="h-4 w-4 text-info" />,
        warning: <AlertCircle className="h-4 w-4 text-warning" />,
        loading: <Spinner />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-elevated group-[.toaster]:backdrop-blur-xl group-[.toaster]:[box-shadow:inset_0_1px_0_0_rgb(255_255_255_/_0.07),0_24px_70px_rgb(0_0_0_/_0.42)]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-gradient-to-b group-[.toast]:from-primary group-[.toast]:to-primary/88 group-[.toast]:text-primary-foreground group-[.toast]:shadow-glow group-[.toast]:[box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.15)]",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:[box-shadow:inset_2px_0_0_var(--color-success),inset_0_1px_0_0_rgb(255_255_255_/_0.07),0_24px_70px_rgb(0_0_0_/_0.42)]",
          error:
            "group-[.toaster]:[box-shadow:inset_2px_0_0_var(--color-destructive),inset_0_1px_0_0_rgb(255_255_255_/_0.07),0_24px_70px_rgb(0_0_0_/_0.42)]",
          info:
            "group-[.toaster]:[box-shadow:inset_2px_0_0_var(--color-info),inset_0_1px_0_0_rgb(255_255_255_/_0.07),0_24px_70px_rgb(0_0_0_/_0.42)]",
          warning:
            "group-[.toaster]:[box-shadow:inset_2px_0_0_var(--color-warning),inset_0_1px_0_0_rgb(255_255_255_/_0.07),0_24px_70px_rgb(0_0_0_/_0.42)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
