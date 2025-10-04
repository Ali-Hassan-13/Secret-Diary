/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const MOODS = ['happy', 'neutral', 'sad', 'angry', 'anxious', 'excited'] as const;
type Mood = (typeof MOODS)[number];

const BUCKET = 'diary-images';
const MAX_MB = 8;

/** Color + glow system */
const MOOD_STYLES: Record<
  Mood,
  {
    dot: string;
    neon: string;
    gradient: string;
  }
> = {
  happy:   { dot: 'bg-emerald-400', neon: 'neon-green', gradient: 'from-emerald-400 via-lime-400 to-green-500' },
  neutral: { dot: 'bg-zinc-400',    neon: 'neon-gray',  gradient: 'from-zinc-300 via-zinc-400 to-zinc-600' },
  sad:     { dot: 'bg-sky-400',     neon: 'neon-blue',  gradient: 'from-sky-400 via-blue-500 to-cyan-500' },
  angry:   { dot: 'bg-rose-500',    neon: 'neon-red',   gradient: 'from-rose-400 via-pink-500 to-orange-500' },
  anxious: { dot: 'bg-amber-400',   neon: 'neon-yellow',gradient: 'from-amber-400 via-amber-500 to-yellow-400' },
  excited: { dot: 'bg-fuchsia-500', neon: 'neon-pink',  gradient: 'from-fuchsia-400 via-pink-500 to-purple-500' },
};

export default function NewEntryPage() {
  const sb = createClient();
  const router = useRouter();

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  const styles = MOOD_STYLES[mood];

  function onPick(f: File | null) {
    if (!f) return setFile(null);
    if (!f.type.startsWith('image/')) return setError('Please select an image file.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Image must be ≤ ${MAX_MB} MB.`);
    setError(null);
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSaving(true);
      const {
        data: { user },
        error: userErr,
      } = await sb.auth.getUser();
      if (userErr || !user) throw new Error('Not authenticated');

      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from(BUCKET).upload(path, file);
        if (upErr) throw upErr;
        const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
        image_url = data.publicUrl;
      }

      await sb.from('entries').insert({
        user_id: user.id,
        title,
        body,
        mood,
        created_at: new Date(`${date}T00:00:00`).toISOString(),
        image_url,
      });

      router.push('/app');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 animate-fade-in"
    >
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold tracking-tight ${styles.neon}`}>New Entry</h1>
        <a
          href="/app"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          Cancel
        </a>
      </div>

      {/* Date + Title */}
      <div className="grid gap-4">
        <label className="text-sm text-zinc-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
        <label className="text-sm text-zinc-400 mt-2">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Today's title..."
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
      </div>

      {/* Body */}
      <div className="grid gap-2">
        <label className="text-sm text-zinc-400">Thoughts</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What’s on your mind..."
          rows={8}
          className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
        />
      </div>

      {/* Mood Selector */}
      <div className="space-y-3">
        <label className="text-sm text-zinc-400">Mood</label>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map((m) => {
            const active = m === mood;
            const s = MOOD_STYLES[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm capitalize transition-all duration-300 ${
                  active
                    ? `bg-white/5 shadow-[0_0_15px] ${s.dot} text-white neon-glow`
                    : 'hover:bg-white/5 text-zinc-400'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Image (optional)</label>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            onPick(f ?? null);
          }}
          className={`flex h-32 cursor-pointer items-center justify-center rounded-xl border border-dashed transition ${
            dragOver ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/15 hover:bg-white/5'
          }`}
        >
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          <span className="text-sm text-zinc-400">
            Drag & drop, or <span className="text-zinc-200 underline">browse</span> to upload
          </span>
        </label>

        {file && (
          <div className="flex items-center flex-wrap gap-3">
            <img
              src={previewUrl}
              alt="preview"
              className="h-24 w-24 rounded-lg border border-white/10 object-cover"
            />
            <div className="text-sm text-zinc-400">
              <div className="text-zinc-200 truncate max-w-[180px]">{file.name}</div>
              <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-3">
        <button
          type="submit"
          disabled={saving || !title}
          className={`w-full rounded-lg bg-gradient-to-r ${styles.gradient} px-4 py-2 font-semibold text-zinc-900 shadow-lg transition-all hover:scale-[1.03] neon-glow`}
        >
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/app')}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-zinc-200 hover:bg-white/10 transition"
        >
          Back
        </button>
      </div>
    </form>
  );
}
