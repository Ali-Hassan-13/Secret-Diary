/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const sb = createClient();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setErr(null);
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: pwd,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    window.location.href = '/app';
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-gradient-slow blur-3xl" />

      {/* Floating glowing orbs */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl animate-pulse" />

      {/* Glass login card */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 shadow-2xl p-8 space-y-6">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-zinc-400 mt-1 tracking-wide">
            Sign in to your personal diary
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Password</label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>

        {/* Button */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-4 py-3 font-medium text-zinc-950 shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {/* Error message */}
        {err && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 text-center">
            {err}
          </p>
        )}

        {/* Redirect link */}
        <p className="text-xs text-center text-zinc-500 pt-4">
          Don’t have an account?{' '}
          <a href="/signup" className="text-cyan-400 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
