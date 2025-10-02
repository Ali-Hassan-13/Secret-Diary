'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function SignupPage() {
  const sb = createClient();

  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'enter'|'verify'>('enter');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const sendOtp = async () => {
    setErr(null); setLoading(true);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    setLoading(false);
    if (error) return setErr(error.message);
    setPhase('verify');
  };

  const verifyOtp = async () => {
    setErr(null); setLoading(true);
    const { error } = await sb.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setLoading(false);
    if (error) return setErr(error.message);

    // (optional) ensure profile row on server later. For now, go set password.
    window.location.href = '/set-password';
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Create your diary</h1>

        {phase === 'enter' && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
            />
            <button
              onClick={sendOtp}
              disabled={!email || loading}
              className="w-full rounded bg-white text-zinc-900 p-2 font-medium"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
            {err && <p className="text-red-500 text-sm">{err}</p>}
          </>
        )}

        {phase === 'verify' && (
          <>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 tracking-widest text-center"
            />
            <button
              onClick={verifyOtp}
              disabled={code.length !== 6 || loading}
              className="w-full rounded bg-white text-zinc-900 p-2 font-medium"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button onClick={sendOtp} className="text-sm underline text-zinc-300">
              Resend code
            </button>
            {err && <p className="text-red-500 text-sm">{err}</p>}
          </>
        )}

        <p className="text-xs text-zinc-400">
          Already have an account? <a className="underline" href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}
