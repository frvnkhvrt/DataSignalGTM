"use client";

import { Toaster as Sonner } from "sonner";
import { AlertCircle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

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
        loading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-elevated group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:shadow-glow",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
