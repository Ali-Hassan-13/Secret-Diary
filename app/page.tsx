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

  // Otherwise show animated landing
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-gradient-slow blur-3xl" />

      {/* Floating glowing orbs */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-blue-500/10 blur-2xl animate-pulse-slow" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-xl backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 shadow-2xl p-10 text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Secret Diary
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          A private journal you can access anywhere. Verify email once with OTP,
          then set a password.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-6 py-2.5 font-medium text-zinc-950 shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all hover:scale-[1.03]"
          >
            Create account
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 font-medium text-zinc-200 hover:bg-white/10 hover:text-white transition-all hover:scale-[1.03]"
          >
            Log in
          </a>
        </div>
      </div>

      {/* Subtle footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
    </main>
  );
}
