'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function SetPasswordPage() {
  const sb = createClient();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  // If user not logged in (no OTP session), bounce back to signup
  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/signup';
    });
  }, [sb]);

  const save = async () => {
    setErr(null);
    if (pwd.length < 8) return setErr('Password must be at least 8 characters.');
    if (pwd !== confirm) return setErr('Passwords do not match.');
    setLoading(true);
    const { error } = await sb.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return setErr(error.message);
    window.location.href = '/app';
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Set your password</h1>
        <input
          type="password"
          value={pwd}
          onChange={(e)=>setPwd(e.target.value)}
          placeholder="New password"
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e)=>setConfirm(e.target.value)}
          placeholder="Confirm password"
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
        />
        <button
          onClick={save}
          disabled={loading}
          className="w-full rounded bg-white text-zinc-900 p-2 font-medium"
        >
          {loading ? 'Saving…' : 'Save password'}
        </button>
        {err && <p className="text-red-500 text-sm">{err}</p>}
      </div>
    </main>
  );
}
