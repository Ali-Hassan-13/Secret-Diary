'use client';

export default function BrandHeader() {
  return (
    <header className="flex items-center justify-between py-2 border-b border-zinc-800">
      <h1 className="text-xl font-bold text-cyan-400 tracking-wide">
        Personal Diary
      </h1>
      <span className="text-xs text-zinc-500">Your private space</span>
    </header>
  );
}
