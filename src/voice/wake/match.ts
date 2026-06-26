import { WAKE_WORDS } from '../constants';

const sortedWakeWords = [...WAKE_WORDS].sort((a, b) => b.length - a.length);

function clean(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface WakeMatch {
  matched: boolean;
  /** Anything the user said after the wake word (a trailing command). */
  residual: string;
}

/**
 * Detect a wake word at the START of the transcript and return whatever
 * trailing words remain. "hi, plan my day" -> { matched, residual: "plan my day" }.
 * "hi there" -> { matched, residual: "" } (treated as filler by the agent).
 */
export function matchWake(transcript: string): WakeMatch {
  const text = clean(transcript);
  if (!text) return { matched: false, residual: '' };

  for (const word of sortedWakeWords) {
    const w = clean(word);
    if (text === w) return { matched: true, residual: '' };
    if (text.startsWith(w + ' ')) {
      return { matched: true, residual: text.slice(w.length).trim() };
    }
  }
  return { matched: false, residual: '' };
}

/** Words that are pure greeting filler — not a real trailing command. */
const FILLER = new Set([
  'there',
  'orch',
  'orchie',
  'orca',
  'orchid',
  'again',
  'buddy',
  'please',
  'so',
  'um',
  'uh',
]);

/** Decide whether a residual after the wake word is a real command worth
 *  executing immediately vs just greeting filler ("hi there"). */
export function residualIsCommand(residual: string): boolean {
  const r = clean(residual);
  if (!r) return false;
  const words = r.split(' ').filter((x) => !FILLER.has(x));
  return words.length > 0;
}
