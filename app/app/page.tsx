'use client';

import { useMemo, useState, useEffect } from 'react';
import { useEntries } from '@/lib/hooks/useEntries';
import { useEntry } from '@/lib/hooks/useEntry';
import Modal from './_components/Modal';
import ReactMarkdown from 'react-markdown';

// 🎨 Mood colors
const MOOD_COLORS: Record<string, string> = {
  happy: '#4ade80',
  neutral: '#a1a1aa',
  sad: '#38bdf8',
  angry: '#f87171',
  anxious: '#facc15',
  excited: '#e879f9',
};

// 🧠 Mood labels
const MOOD_LABELS: Record<string, string> = {
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
  angry: 'Angry',
  anxious: 'Anxious',
  excited: 'Excited',
};

export default function AppHome() {
  const { data: entries, isLoading, error } = useEntries();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const { data: entry, isLoading: loadingEntry } = useEntry(selectedId ?? undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const open = (id: string) => setSelectedId(id);
  const close = () => setSelectedId(null);

  // 🪶 Filter entries
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries ?? [];
    return (entries ?? []).filter(
      (e) =>
        (e.title ?? '').toLowerCase().includes(term) ||
        (e.mood ?? '').toLowerCase().includes(term)
    );
  }, [entries, q]);

  // 🧩 Mood stats
  const moodStats = useMemo(() => {
    if (!entries || entries.length === 0) return {};
    const counts: Record<string, number> = {};
    for (const e of entries) {
      const mood = e.mood ?? 'neutral';
      counts[mood] = (counts[mood] || 0) + 1;
    }
    return counts;
  }, [entries]);

  const total = Object.values(moodStats).reduce((a, b) => a + b, 0);
  const dominantMood = total
    ? Object.entries(moodStats).sort((a, b) => b[1] - a[1])[0][0]
    : 'neutral';

  const domColor = MOOD_COLORS[dominantMood] ?? '#a1a1aa';
  const domLabel = MOOD_LABELS[dominantMood] ?? 'Neutral';

  // 🕒 Timeline insight
  const timelineInfo = useMemo(() => {
    if (!entries || entries.length === 0) return null;

    const sorted = [...entries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const first = new Date(sorted[0].created_at);
    const last = new Date(sorted[sorted.length - 1].created_at);

    const firstDate = first.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const daysSinceLast = Math.round(
      (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      firstDate,
      total: sorted.length,
      lastAgo:
        daysSinceLast === 0
          ? 'today'
          : daysSinceLast === 1
          ? 'yesterday'
          : `${daysSinceLast} days ago`,
    };
  }, [entries]);

  if (!mounted) return null;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
        {/* Left Side — Entries */}
        <section className="flex flex-col h-[80vh] bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">Your Diary</h1>
            <a
              href="/app/entries/new"
              className="rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:scale-[1.03] transition-all"
            >
              + New
            </a>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or mood…"
            className="w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm mb-4 outline-none text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-400/50 transition"
          />

          {/* Scrollable List */}
          <div className="overflow-y-auto pr-2 flex-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg border border-white/10 bg-white/5"
                />
              ))
            ) : filtered.length === 0 ? (
              <p className="text-zinc-500 text-sm">No entries yet.</p>
            ) : (
              filtered.map((e) => (
                <div
                  key={e.id}
                  onClick={() => open(e.id)}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition p-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: MOOD_COLORS[e.mood] || '#71717a' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-100 group-hover:text-white transition line-clamp-1">
                        {e.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(e.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${MOOD_COLORS[e.mood] || '#71717a'}20`,
                      color: MOOD_COLORS[e.mood] || '#71717a',
                    }}
                  >
                    {e.mood || '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Side — Mood Dial */}
        <section className="flex flex-col items-center justify-center h-[80vh] space-y-6">
          {timelineInfo && (
            <p className="text-sm text-zinc-400 text-center max-w-xs">
              You’ve been journaling since{' '}
              <span className="text-zinc-200 font-medium">{timelineInfo.firstDate}</span> —{' '}
              <span className="text-zinc-200 font-medium">{timelineInfo.total}</span> entries
              so far. Last updated{' '}
              <span className="text-zinc-200 font-medium">{timelineInfo.lastAgo}</span>.
            </p>
          )}

          {/* Animated Mood Dial */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-700 ease-in-out"
            style={{
              width: '260px',
              height: '260px',
              background: `radial-gradient(circle at center, ${domColor}30 0%, transparent 70%)`,
              boxShadow: `0 0 50px ${domColor}20`,
            }}
          >
            <div
              className="absolute rounded-full blur-3xl opacity-30 animate-pulse"
              style={{
                width: '200px',
                height: '200px',
                backgroundColor: domColor,
              }}
            />
            <div
              className="relative rounded-full border border-white/10 flex flex-col items-center justify-center text-center bg-white/5 backdrop-blur-sm shadow-md"
              style={{ width: '180px', height: '180px' }}
            >
              <h2 className="text-lg font-semibold" style={{ color: domColor }}>
                {domLabel}
              </h2>
              <p className="text-xs text-zinc-400">Dominant Mood</p>
            </div>
          </div>

          {/* Mood breakdown */}
          <div className="mt-4 space-y-2 text-sm w-48">
            {Object.entries(moodStats).map(([m, count]) => (
              <div key={m} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: MOOD_COLORS[m] || '#71717a' }}
                  />
                  {MOOD_LABELS[m]}
                </span>
                <span className="text-zinc-400">
                  {((count / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal for viewing entry */}
      <Modal open={!!selectedId} onClose={close} title={entry?.title || 'Entry'}>
        {loadingEntry ? (
          <p className="text-zinc-400">Loading entry…</p>
        ) : entry ? (
          <div className="space-y-4">
            <div className="text-xs text-zinc-500">
              {new Date(entry.created_at).toLocaleString()} • {entry.mood}
            </div>
            {entry.image_url && (
              <a
                href={entry.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center"
              >
                <img
                  src={entry.image_url}
                  alt="Attachment"
                  className="h-40 w-auto inline-block rounded-lg border border-white/10 object-cover hover:opacity-90 transition"
                />
              </a>
            )}
            <div className="text-sm text-zinc-300">
              <ReactMarkdown>{entry.body || '_No content_'}</ReactMarkdown>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={async () => {
                  if (!entry) return;
                  if (!confirm('Delete this entry?')) return;
                  const sb = (await import('@/lib/supabase')).createClient();
                  const { error } = await sb.from('entries').delete().eq('id', entry.id);
                  if (error) alert('Failed to delete: ' + error.message);
                  else {
                    close();
                    window.location.reload();
                  }
                }}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20 transition"
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
    </main>
  );
}
