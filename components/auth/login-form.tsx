"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function callbackUrl(next = "/") {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

const DEMO_ERROR_MESSAGES: Record<string, string> = {
  demo_unavailable:
    "The demo environment is temporarily unavailable. Please try again shortly.",
  demo_signin_failed:
    "We could not sign you in to the demo. Please try again or sign in with your own account.",
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const demoError = searchParams.get("error");
  const demoErrorMessage = demoError ? DEMO_ERROR_MESSAGES[demoError] : null;

  function signInWithMagicLink() {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl("/"),
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Check your email for a magic link.");
    });
  }

  function signInWithGoogle() {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl("/"),
        },
      });

      if (error) {
        toast.error(error.message);
      }
    });
  }

  return (
    <Card elevated className="w-full max-w-md bg-card/88">
      {demoErrorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-t-xl border-b border-destructive/25 bg-destructive/10 px-5 py-3 text-xs text-destructive"
        >
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {demoErrorMessage}
        </div>
      )}
      <CardHeader>
        <p className="ds-eyebrow text-primary">
          DataSignalGTM
        </p>
        <CardTitle className="ds-heading mt-3 text-2xl text-foreground">
          Sign in to your workspace
        </CardTitle>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Use a magic link or Google OAuth. New users get a private workspace
          automatically.
        </p>
      </CardHeader>

      <CardContent>
      <div className="space-y-3">
        <label htmlFor="email" className="block text-xs font-medium text-muted-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Button
          type="button"
          onClick={signInWithMagicLink}
          disabled={isPending || !email.trim()}
          className="w-full"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send magic link
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        variant="outline"
        className="w-full"
      >
        Continue with Google
      </Button>

      <div className="mt-5 space-y-3">
        <Link
          href="/demo"
          className="ds-focus-ring ds-pressable flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/8 px-3 py-2.5 text-sm font-medium text-primary hover:border-primary/40 hover:bg-primary/12 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Explore the live demo — no sign-up needed
        </Link>
        <p className="text-xs leading-relaxed text-muted-foreground">
          New users get a private workspace automatically on first sign-in.
        </p>
      </div>
      </CardContent>
    </Card>
  );
}
