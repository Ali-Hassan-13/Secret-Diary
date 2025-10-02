/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const MOODS = ['happy', 'neutral', 'sad', 'angry', 'anxious', 'excited'] as const;
const BUCKET = 'diary-images'; // make sure this public bucket exists in Supabase
const MAX_MB = 8;

export default function NewEntryPage() {
  const sb = createClient();
  const router = useRouter();

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<(typeof MOODS)[number]>('neutral');

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  function onPick(f: File | null) {
    if (!f) return setFile(null);
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file (jpeg/png/webp).');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be ≤ ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    onPick(f ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
        error: userErr,
      } = await sb.auth.getUser();
      if (userErr || !user) throw new Error('Not authenticated');

      // 1) Upload image if present
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;

        const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      // 2) Insert entry
      const createdAt = new Date(`${date}T00:00:00`);
      const { error: insErr } = await sb.from('entries').insert({
        user_id: user.id,
        title,
        body,
        mood,
        created_at: createdAt.toISOString(),
        image_url,
      });
      if (insErr) throw insErr;

      router.push('/app');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Entry</h1>
        <a
          href="/app"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          Cancel
        </a>
      </div>

      {/* Date */}
      <div className="grid gap-2">
        <label className="text-sm text-zinc-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/40"
          required
        />
      </div>

      {/* Title */}
      <div className="grid gap-2">
        <label className="text-sm text-zinc-400">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
          required
        />
      </div>

      {/* Body */}
      <div className="grid gap-2">
        <label className="text-sm text-zinc-400">Body (Markdown)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your thoughts…"
          rows={8}
          className="rounded-lg border border-white/10 bg-zinc-900/70 p-3 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
        />
      </div>

      {/* Mood */}
      <div className="grid gap-2">
        <label className="text-sm text-zinc-400">Mood</label>
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value as (typeof MOODS)[number])}
          className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/40"
        >
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Image upload */}
      <div className="grid gap-2">
        <label className="text-sm text-zinc-400">Image (optional)</label>

        {/* Drag & drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={[
            'flex h-32 cursor-pointer items-center justify-center rounded-xl border border-dashed',
            dragOver ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/15 hover:bg-white/5',
          ].join(' ')}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          <span className="text-sm text-zinc-400">
            Drag & drop, or <span className="text-zinc-200 underline">browse</span> to upload
          </span>
        </label>

        {/* Preview */}
        {file && (
          <div className="flex items-center gap-3">
            <img
              src={previewUrl}
              alt="preview"
              className="h-24 w-24 rounded-lg border border-white/10 object-cover"
            />
            <div className="text-sm text-zinc-400">
              <div className="text-zinc-200">{file.name}</div>
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

        <p className="text-xs text-zinc-500">JPEG/PNG/WebP, up to {MAX_MB} MB.</p>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !title}
          className="rounded-lg bg-cyan-400 px-4 py-2 font-medium text-zinc-900 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/app')}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-zinc-200 hover:bg-white/10"
        >
          Back
        </button>
      </div>
    </form>
  );
}
