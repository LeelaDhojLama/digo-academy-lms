'use client';

import { useEffect, useState } from 'react';

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Ticking countdown to a session's start. Shows "LIVE NOW" once the target has
 * passed (or when `live` is set). Renders a stable placeholder on the server to
 * avoid hydration mismatch, then starts ticking on the client.
 */
export function LiveCountdown({ target, live = false }: { target: string; live?: boolean }) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? targetMs - Date.now() : targetMs - now;

  if (live || remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
        <span className="size-2 animate-pulse rounded-full bg-brand-coral" />
        Live now
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide tabular-nums">
      <span className="size-2 rounded-full bg-emerald-300" />
      Live in {format(remaining)}
    </span>
  );
}
