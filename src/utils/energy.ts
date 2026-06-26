import type { AiEnergyCost, EnergyCost, EnergyLevel } from '@/types';

/**
 * Map a natural-language feeling to a 1–5 energy level.
 * Used by the voice agent for "I'm feeling low / drained / peak" etc.
 * Returns null when no feeling word is detected.
 */
const FEELING_MAP: { level: EnergyLevel; words: string[] }[] = [
  {
    level: 1,
    words: [
      'exhausted',
      'drained',
      'dead',
      'burnt out',
      'burned out',
      'wiped',
      'shattered',
      'running on empty',
      'depleted',
    ],
  },
  {
    level: 2,
    words: ['low', 'tired', 'sleepy', 'sluggish', 'groggy', 'meh', 'flat', 'foggy'],
  },
  {
    level: 3,
    words: ['okay', 'ok', 'fine', 'alright', 'neutral', 'so so', 'so-so', 'medium', 'average'],
  },
  {
    level: 4,
    words: ['good', 'energized', 'energised', 'fresh', 'productive', 'motivated', 'sharp'],
  },
  {
    level: 5,
    words: ['peak', 'great', 'amazing', 'unstoppable', 'fantastic', 'on fire', 'pumped', 'wired'],
  },
];

export function feelingToEnergy(text: string): EnergyLevel | null {
  const t = ` ${text.toLowerCase()} `;
  // Check the strongest signals first (1 and 5) then the middle.
  const order = [1, 5, 2, 4, 3] as const;
  for (const lvl of order) {
    const entry = FEELING_MAP.find((e) => e.level === lvl)!;
    if (entry.words.some((w) => t.includes(` ${w} `) || t.includes(`${w}`))) {
      return entry.level;
    }
  }
  return null;
}

export const ENERGY_LABEL: Record<EnergyLevel, string> = {
  1: 'Depleted',
  2: 'Low',
  3: 'Steady',
  4: 'Good',
  5: 'Peak',
};

export const ENERGY_EMOJI: Record<EnergyLevel, string> = {
  1: '🪫',
  2: '😴',
  3: '🙂',
  4: '⚡',
  5: '🚀',
};

export function clampEnergy(n: number): EnergyLevel {
  const v = Math.round(n);
  if (v <= 1) return 1;
  if (v >= 5) return 5;
  return v as EnergyLevel;
}

// ── Task energy cost (matches the shared DB enum) ────────────────────────────

export const ENERGY_COST_LABEL: Record<EnergyCost, string> = {
  deep_focus: 'Deep focus',
  moderate: 'Moderate',
  light: 'Light',
  admin: 'Admin',
};

const VALID_COSTS: EnergyCost[] = ['deep_focus', 'moderate', 'light', 'admin'];

/** Map the AI's coarse low/moderate/high (or a raw enum value) to a DB EnergyCost. */
export function toEnergyCost(value: AiEnergyCost | EnergyCost | string): EnergyCost {
  if (VALID_COSTS.includes(value as EnergyCost)) return value as EnergyCost;
  switch (value) {
    case 'low':
      return 'light';
    case 'high':
      return 'deep_focus';
    case 'moderate':
    default:
      return 'moderate';
  }
}
