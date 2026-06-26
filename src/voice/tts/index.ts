import type { TtsEngine } from '../types';
import { ExpoTts } from './ExpoTts';

let singleton: TtsEngine | null = null;

/** Shared TTS engine (used by the agent AND the Chat "Listen" buttons). */
export function getTtsEngine(): TtsEngine {
  singleton ??= new ExpoTts();
  return singleton;
}

export { ExpoTts };
