import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthContext } from "@/lib/supabase/server";

export default async function LoginPage() {
  const auth = await getAuthContext();

  if (auth) {
    redirect("/dashboard");
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="ds-page flex min-h-screen items-center justify-center px-4 py-10"
    >
      <LoginForm />
    </main>
  );
}
