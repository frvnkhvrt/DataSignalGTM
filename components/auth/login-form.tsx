"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function callbackUrl(next = "/") {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

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

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Local demo: sign in as{" "}
        <span className="font-mono text-foreground">
          demo@datasignalgtm.local
        </span>{" "}
        after running the Phase 1 migration.
      </p>
      </CardContent>
    </Card>
  );
}
