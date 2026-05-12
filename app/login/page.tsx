import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthContext } from "@/lib/supabase/server";

export default async function LoginPage() {
  const auth = await getAuthContext();

  if (auth) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <LoginForm />
    </main>
  );
}
