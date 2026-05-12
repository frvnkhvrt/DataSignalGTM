"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

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
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
          DataSignalGTM
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-50">
          Sign in to your workspace
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Use a magic link or Google OAuth. New users get a private workspace
          automatically.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <label htmlFor="email" className="block text-xs font-medium text-zinc-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={signInWithMagicLink}
          disabled={isPending || !email.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send magic link
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-[11px] uppercase tracking-wide text-zinc-600">
          or
        </span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
      >
        Continue with Google
      </button>

      <p className="mt-5 text-xs leading-relaxed text-zinc-500">
        Local demo: sign in as{" "}
        <span className="font-mono text-zinc-300">
          demo@datasignalgtm.local
        </span>{" "}
        after running the Phase 1 migration.
      </p>
    </div>
  );
}
