import { redirect } from "next/navigation";
import { createServerClientSSR } from "@/lib/supabase-server";

export default async function HomePage() {
  const sb = await createServerClientSSR();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // If logged in, go straight to dashboard
  if (user) {
    redirect("/app");
  }

  // Otherwise show landing page
  return (
    <main className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-bold">Personal Diary</h1>
        <p className="text-zinc-400">
          A private journal you can access anywhere. Verify email once with OTP,
          then set a password.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/signup"
            className="px-4 py-2 rounded bg-white text-zinc-900 font-medium"
          >
            Create account
          </a>
          <a
            href="/login"
            className="px-4 py-2 rounded border border-zinc-700"
          >
            Log in
          </a>
        </div>
      </div>
    </main>
  );
}
