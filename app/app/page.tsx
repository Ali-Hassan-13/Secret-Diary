'use client';

import { useMemo, useState } from 'react';
import { useEntries } from '@/lib/hooks/useEntries';
import { useEntry } from '@/lib/hooks/useEntry';
import Modal from './_components/Modal';
import ReactMarkdown from 'react-markdown';

export default function AppHome() {
  const { data: entries, isLoading, error } = useEntries();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const { data: entry, isLoading: loadingEntry } = useEntry(selectedId ?? undefined);

  const open = (id: string) => setSelectedId(id);
  const close = () => setSelectedId(null);

  // lightweight client-side filter
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries ?? [];
    return (entries ?? []).filter(e =>
      (e.title ?? '').toLowerCase().includes(term) ||
      (e.mood ?? '').toLowerCase().includes(term)
    );
  }, [entries, q]);

  return (
    <>
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Your Diary</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or mood…"
            className="w-full sm:w-64 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          <a
            href="/app/entries/new"
            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            + New Entry
          </a>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <ul className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5"
            />
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          Error: {String(error)}
        </p>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-zinc-300">Nothing here yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Click <span className="font-medium text-zinc-300">+ New Entry</span> to write your first note.
          </p>
        </div>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
              onClick={() => open(e.id)}
              title="Click to view"
            >
              <div className="flex items-center justify-between">
                <span className="line-clamp-1 font-medium text-zinc-100">
                  {e.title || 'Untitled'}
                </span>
                <span className="text-2xs rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400">
                  {e.mood || '—'}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(e.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* View Modal */}
      <Modal open={!!selectedId} onClose={close} title={entry?.title || 'Entry'}>
        {loadingEntry ? (
          <p className="text-zinc-400">Loading entry…</p>
        ) : entry ? (
          <div className="space-y-4">
            <div className="text-xs text-zinc-500">
              {new Date(entry.created_at).toLocaleString()}
              {entry.mood ? ` • ${entry.mood}` : ''}
            </div>

            {entry.image_url && (
  <a
    href={entry.image_url}
    target="_blank"
    rel="noopener noreferrer"
    className="block mt-2 text-center"
  >
    <img
      src={entry.image_url}
      alt="Diary attachment"
      className="h-32 w-auto inline-block rounded-lg border border-white/10 object-cover cursor-pointer hover:opacity-90 transition"
    />
    <p className="mt-1 text-xs text-zinc-500">Click to view full image</p>
  </a>
)}

            {/* Markdown body */}
            <div className="pt-2 flex justify-between">
  <button
    onClick={async () => {
      if (!entry) return;
      if (!confirm("Are you sure you want to delete this entry?")) return;

      const sb = (await import('@/lib/supabase')).createClient();
      const { error } = await sb.from('entries').delete().eq('id', entry.id);

      if (error) {
        alert("Failed to delete entry: " + error.message);
      } else {
        close(); // close modal
        window.location.reload(); // refresh list (simple way)
      }
    }}
    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20"
  >
    Delete
  </button>

  <button
    onClick={close}
    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
  >
    Close
  </button>
</div>

          </div>
        ) : (
          <p className="text-red-500">Entry not found.</p>
        )}
      </Modal>
    </>
  );
}
