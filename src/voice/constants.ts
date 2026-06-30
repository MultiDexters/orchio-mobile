/**
 * Voice agent tuning constants. Documented in VOICE.md.
 * Change these to tune turn-taking feel — they encode the hard-won fixes
 * for cut-offs, duplication, and self-hearing.
 */

/** How long the user must pause before we commit (act on) their utterance.
 *  Set to 5s so you can keep talking through long pauses — the agent only
 *  responds after ~5 seconds of true silence. Lower it (e.g. 2500) if you
 *  want snappier turn-taking. */
export const COMMIT_SILENCE_MS = 5000;

/** Quiet gap after TTS finishes before we re-open the mic. Prevents the
 *  tail of our own speech (and echo) from being transcribed. */
export const POST_SPEAK_DELAY_MS = 700;

/** Idle time in AWAKE (no speech, not thinking/speaking) before we go back
 *  to ARMED. Only counts true silence after the agent has finished talking. */
export const SLEEP_TIMEOUT_MS = 45_000;

/** Hard ceiling on how long the "mic is muted for TTS" guard may stay on,
 *  regardless of whether the TTS "done" event ever fires. Mobile TTS end
 *  events are unreliable; this guarantees the guard can never get stuck.
 *  Computed as base + perChar * length at call time, clamped to this max. */
export const TTS_GUARD_MAX_MS = 30_000;
export const TTS_GUARD_BASE_MS = 1200;
export const TTS_GUARD_PER_CHAR_MS = 70; // ~14 chars/sec at rate 1.0

/** Minimum characters of committed transcript before we treat it as a real
 *  utterance (filters stray single-word noise / echoes). */
export const MIN_COMMIT_CHARS = 2;

/** Wake words (and common mishearings) accepted in ARMED state when the
 *  software wake detector is used. Porcupine uses its own keyword model. */
export const WAKE_WORDS: string[] = [
  'hi',
  'hey',
  'hello',
  'yo',
  'hi there',
  'hey there',
  'hi orch',
  'hey orch',
  'hello orch',
  'orch',
  // common STT mishearings of "orch"
  'orchie',
  'orchid',
  'orca',
  'arch',
  'orc',
  'hi orchie',
  'hi orca',
  'hey orca',
];

/** Acknowledgement spoken on wake (kept tiny so it doesn't delay the turn). */
export const WAKE_ACK = 'Yes?';

/** Porcupine built-in keyword used as the wake word when no custom .ppn is
 *  bundled. "hey google"/"computer" etc. are built-ins; we ship a custom
 *  "Hi Orch" model (assets/wake/) and fall back to a built-in if missing. */
export const PORCUPINE_FALLBACK_BUILTIN = 'COMPUTER';
