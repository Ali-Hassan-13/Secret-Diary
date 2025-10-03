/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const MOODS = ['happy', 'neutral', 'sad', 'angry', 'anxious', 'excited'] as const;
const BUCKET = 'diary-images';
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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



// 'use client';

// import { useMemo, useState } from 'react';
// import { useEntries } from '@/lib/hooks/useEntries';
// import { useEntry } from '@/lib/hooks/useEntry';
// import Modal from './_components/Modal';
// import ReactMarkdown from 'react-markdown';

// export default function AppHome() {
//   const { data: entries, isLoading, error } = useEntries();
//   const [selectedId, setSelectedId] = useState<string | null>(null);
//   const [q, setQ] = useState('');
//   const { data: entry, isLoading: loadingEntry } = useEntry(selectedId ?? undefined);

//   const open = (id: string) => setSelectedId(id);
//   const close = () => setSelectedId(null);

//   // lightweight client-side filter
//   const filtered = useMemo(() => {
//     const term = q.trim().toLowerCase();
//     if (!term) return entries ?? [];
//     return (entries ?? []).filter(e =>
//       (e.title ?? '').toLowerCase().includes(term) ||
//       (e.mood ?? '').toLowerCase().includes(term)
//     );
//   }, [entries, q]);

//   return (
//     <>
//       {/* Top bar */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="text-2xl font-bold">Your Diary</h1>
//         <div className="flex gap-2">
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Search title or mood…"
//             className="w-full sm:w-64 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/40"
//           />
//           <a
//             href="/app/entries/new"
//             className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
//           >
//             + New Entry
//           </a>
//         </div>
//       </div>

//       {/* States */}
//       {isLoading && (
//         <ul className="mt-4 space-y-3">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <li
//               key={i}
//               className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5"
//             />
//           ))}
//         </ul>
//       )}

//       {error && (
//         <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
//           Error: {String(error)}
//         </p>
//       )}

//       {!isLoading && !error && filtered.length === 0 && (
//         <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
//           <p className="text-zinc-300">Nothing here yet.</p>
//           <p className="mt-1 text-sm text-zinc-500">
//             Click <span className="font-medium text-zinc-300">+ New Entry</span> to write your first note.
//           </p>
//         </div>
//       )}

//       {/* List */}
//       {filtered.length > 0 && (
//         <ul className="mt-4 grid gap-3">
//           {filtered.map((e) => (
//             <li
//               key={e.id}
//               className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
//               onClick={() => open(e.id)}
//               title="Click to view"
//             >
//               <div className="flex items-center justify-between">
//                 <span className="line-clamp-1 font-medium text-zinc-100">
//                   {e.title || 'Untitled'}
//                 </span>
//                 <span className="text-2xs rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400">
//                   {e.mood || '—'}
//                 </span>
//               </div>
//               <p className="mt-1 text-xs text-zinc-500">
//                 {new Date(e.created_at).toLocaleString()}
//               </p>
//             </li>
//           ))}
//         </ul>
//       )}

//       {/* View Modal */}
//       <Modal open={!!selectedId} onClose={close} title={entry?.title || 'Entry'}>
//         {loadingEntry ? (
//           <p className="text-zinc-400">Loading entry…</p>
//         ) : entry ? (
//           <div className="space-y-4">
//             <div className="text-xs text-zinc-500">
//               {new Date(entry.created_at).toLocaleString()}
//               {entry.mood ? ` • ${entry.mood}` : ''}
//             </div>

//             {entry.image_url && (
//   <a
//     href={entry.image_url}
//     target="_blank"
//     rel="noopener noreferrer"
//     className="block mt-2 text-center"
//   >
//     <img
//       src={entry.image_url}
//       alt="Diary attachment"
//       className="h-32 w-auto inline-block rounded-lg border border-white/10 object-cover cursor-pointer hover:opacity-90 transition"
//     />
//     <p className="mt-1 text-xs text-zinc-500">Click to view full image</p>
//   </a>
// )}

//             {/* Markdown body */}
//             <div className="pt-2 flex justify-between">
//   <button
//     onClick={async () => {
//       if (!entry) return;
//       if (!confirm("Are you sure you want to delete this entry?")) return;

//       const sb = (await import('@/lib/supabase')).createClient();
//       const { error } = await sb.from('entries').delete().eq('id', entry.id);

//       if (error) {
//         alert("Failed to delete entry: " + error.message);
//       } else {
//         close(); // close modal
//         window.location.reload(); // refresh list (simple way)
//       }
//     }}
//     className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20"
//   >
//     Delete
//   </button>

//   <button
//     onClick={close}
//     className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
//   >
//     Close
//   </button>
// </div>

//           </div>
//         ) : (
//           <p className="text-red-500">Entry not found.</p>
//         )}
//       </Modal>
//     </>
//   );
// }
