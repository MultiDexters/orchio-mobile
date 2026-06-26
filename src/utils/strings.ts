export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "in 2 hours", "yesterday", "Jun 26" — compact relative-ish formatting. */
export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);

  if (abs < 1) return 'now';
  if (abs < 60) return diffMin > 0 ? `in ${abs}m` : `${abs}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24)
    return diffHr > 0 ? `in ${Math.abs(diffHr)}h` : `${Math.abs(diffHr)}h ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/** Collapse repeated whitespace and trim — used to clean STT transcripts. */
export function normalizeTranscript(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
