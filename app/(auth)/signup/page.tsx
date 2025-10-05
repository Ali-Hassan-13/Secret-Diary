/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

type Phase = 'enter' | 'verify';
const RESEND_COOLDOWN = 30; // seconds

export default function SignupPage() {
  const sb = createClient();

  const [phase, setPhase] = useState<Phase>('enter');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeValue = useMemo(() => code.join(''), [code]);
  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (phase === 'verify') inputsRef.current[0]?.focus();
  }, [phase]);

  const sendOtp = async () => {
    setErr(null);
    setInfo(null);
    if (!emailValid) {
      setErr('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setPhase('verify');
      setInfo('A 6-digit code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setErr(null);
    setInfo(null);
    if (codeValue.length !== 6) {
      setErr('Enter the 6-digit code.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await sb.auth.verifyOtp({
        email: email.trim(),
        token: codeValue,
        type: 'email',
      });
      if (error) throw error;
      window.location.href = '/set-password';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await sendOtp();
  };

  const onOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(0, 1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const onOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (code[idx]) {
        const next = [...code];
        next[idx] = '';
        setCode(next);
      } else if (idx > 0) inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => txt[i] || '');
    setCode(next);
    const last = Math.min(txt.length, 6) - 1;
    inputsRef.current[Math.max(last, 0)]?.focus();
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-gradient-slow blur-3xl" />

      {/* Floating glowing orbs */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl animate-pulse" />

      <div className="relative z-10 w-full max-w-md backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Personal Diary
          </h1>
          <p className="text-sm text-zinc-400 mt-1 tracking-wide">
            {phase === 'enter' ? 'Step 1/2 — Verify your email' : 'Step 2/2 — Enter the code'}
          </p>
        </div>

        {phase === 'enter' && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
            />
            <button
              onClick={sendOtp}
              disabled={!emailValid || loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-4 py-3 font-medium text-zinc-950 shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        )}

        {phase === 'verify' && (
          <>
            <div className="text-sm text-center text-zinc-300 mb-2">
              We sent a code to <span className="font-medium text-zinc-100">{email}</span>
            </div>
            <div className="flex justify-center gap-2" onPaste={onOtpPaste}>
              {code.map((v, i) => (
                <input
                  key={i}
                 ref={(el) => {
  inputsRef.current[i] = el;
}}

                  inputMode="numeric"
                  aria-label={`Digit ${i + 1}`}
                  autoComplete="one-time-code"
                  className="h-12 w-12 text-center text-lg rounded-lg border border-white/10 bg-zinc-900/70 outline-none focus:ring-2 focus:ring-cyan-500/40 transition-transform hover:scale-105"
                  maxLength={1}
                  value={v}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <button
              onClick={verifyOtp}
              disabled={codeValue.length !== 6 || loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-4 py-3 font-medium text-zinc-950 shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div className="flex justify-between text-sm text-zinc-400">
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="hover:text-cyan-300 disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
              <button onClick={() => setPhase('enter')} className="hover:text-cyan-300">
                Change email
              </button>
            </div>
          </>
        )}

        {err && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 text-center">
            {err}
          </p>
        )}
        {info && !err && (
          <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 text-center">
            {info}
          </p>
        )}

        <p className="text-xs text-center text-zinc-500 pt-4">
          Already have an account?{' '}
          <a href="/login" className="text-cyan-400 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}
