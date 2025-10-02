'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const sb = createClient();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setErr(null); setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error) return setErr(error.message);
    window.location.href = '/app';
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <input
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
        />
        <input
          type="password"
          value={pwd}
          onChange={(e)=>setPwd(e.target.value)}
          placeholder="Password"
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
        />
        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded bg-white text-zinc-900 p-2 font-medium"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        {err && <p className="text-red-500 text-sm">{err}</p>}
      </div>
    </main>
  );
}
