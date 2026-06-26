import type { EnergyLevel } from '@/types';
import { clampEnergy, feelingToEnergy } from '@/utils/energy';

export type AppRoute =
  | 'today'
  | 'tasks'
  | 'energy'
  | 'chat'
  | 'goals'
  | 'brief'
  | 'settings';

export type Intent =
  | { kind: 'navigate'; route: AppRoute }
  | { kind: 'log_energy_numeric'; level: EnergyLevel }
  | { kind: 'log_energy_feeling'; level: EnergyLevel; text: string }
  | { kind: 'plan'; reshuffle: boolean }
  | { kind: 'read_top_tasks' }
  | { kind: 'read_brief' }
  | { kind: 'help' }
  | { kind: 'stop' }
  | { kind: 'chat'; text: string };

const ROUTE_WORDS: Record<string, AppRoute> = {
  today: 'today',
  home: 'today',
  'home screen': 'today',
  plan: 'today',
  task: 'tasks',
  tasks: 'tasks',
  'to do': 'tasks',
  todo: 'tasks',
  todos: 'tasks',
  energy: 'energy',
  chat: 'chat',
  assistant: 'chat',
  conversation: 'chat',
  goal: 'goals',
  goals: 'goals',
  brief: 'brief',
  briefing: 'brief',
  reflection: 'brief',
  settings: 'settings',
  preferences: 'settings',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

function extractEnergyNumber(text: string): number | null {
  const digit = text.match(/\b([1-5])\b/);
  if (digit) return Number(digit[1]);
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) return n;
  }
  return null;
}

/**
 * Parse a committed utterance into an Intent.
 * Anything that isn't a recognised command falls through to a conversational
 * `chat` intent — the heart of the voice agent.
 */
export function parseIntent(raw: string): Intent {
  const text = normalize(raw);

  // ── Stop / sleep ──────────────────────────────────────────────────────────
  if (
    /\b(stop listening|go to sleep|stop talking|that('?s| is) all|never mind|nevermind|goodbye|good bye|go away|dismiss)\b/.test(
      text,
    ) ||
    text === 'stop' ||
    text === 'sleep' ||
    text === 'quiet'
  ) {
    return { kind: 'stop' };
  }

  // ── Help ──────────────────────────────────────────────────────────────────
  if (
    /\b(what can you do|what can i (say|do)|help me out|show (me )?commands|list commands|your commands)\b/.test(
      text,
    ) ||
    text === 'help' ||
    text === 'commands'
  ) {
    return { kind: 'help' };
  }

  // ── Plan / reshuffle ────────────────────────────────────────────────────────
  if (
    /\b(reshuffle|re shuffle|reschedule|redo|regenerate|re plan|replan|rebuild|shuffle)\b.*\bplan|day\b/.test(
      text,
    ) ||
    /\b(reshuffle|reschedule|regenerate|replan)\b/.test(text)
  ) {
    return { kind: 'plan', reshuffle: true };
  }
  if (
    /\b(plan|organi[sz]e|schedule|map out|sort out)\b.*\b(my )?(day|today|morning|schedule)\b/.test(
      text,
    ) ||
    /\bplan my day\b/.test(text) ||
    text === 'plan my day' ||
    text === 'make a plan'
  ) {
    return { kind: 'plan', reshuffle: false };
  }

  // ── Read top tasks / priorities ─────────────────────────────────────────────
  if (
    /\b(top (three|3)|my (top )?priorities|what should i (do|work on|focus on)|what'?s next|most important)\b/.test(
      text,
    )
  ) {
    return { kind: 'read_top_tasks' };
  }

  // ── Read brief ──────────────────────────────────────────────────────────────
  if (/\b(read (me )?(my )?brief|morning brief|my briefing|read the brief|what'?s my brief)\b/.test(text)) {
    return { kind: 'read_brief' };
  }

  // ── Log energy (numeric) ────────────────────────────────────────────────────
  // "log energy 4", "energy level 3", "set energy to 5", "my energy is 2"
  if (/\benergy\b/.test(text) && /\b([1-5]|one|two|three|four|five)\b/.test(text)) {
    const n = extractEnergyNumber(text);
    if (n != null) {
      return { kind: 'log_energy_numeric', level: clampEnergy(n) };
    }
  }
  if (/\b(log|set|record)\b/.test(text) && /\benergy\b/.test(text)) {
    const n = extractEnergyNumber(text);
    if (n != null) return { kind: 'log_energy_numeric', level: clampEnergy(n) };
  }

  // ── Log energy (feeling) ────────────────────────────────────────────────────
  // "I'm feeling low/tired/great", "my energy is drained", "I feel okay"
  const feelingTrigger =
    /\b(i'?m feeling|i am feeling|i feel|feeling|my energy (is|feels)|i'?m (so |really )?(tired|exhausted|drained|low|great|good|okay|fine|peak|amazing|wired|sluggish|wiped))\b/.test(
      text,
    );
  if (feelingTrigger) {
    const level = feelingToEnergy(text);
    if (level != null) {
      return { kind: 'log_energy_feeling', level, text: raw.trim() };
    }
  }

  // ── Navigate ────────────────────────────────────────────────────────────────
  const navTrigger = /\b(go to|open|show( me)?|take me to|navigate to|switch to|jump to|view)\b/.test(
    text,
  );
  if (navTrigger) {
    // Find the first route word mentioned.
    for (const [word, route] of Object.entries(ROUTE_WORDS)) {
      if (new RegExp(`\\b${word}\\b`).test(text)) {
        return { kind: 'navigate', route };
      }
    }
  }

  // ── Conversational fallback ─────────────────────────────────────────────────
  return { kind: 'chat', text: raw.trim() };
}
