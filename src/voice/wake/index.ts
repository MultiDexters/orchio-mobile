import type { SttEngine, WakeWordEngine } from '../types';
import { PorcupineWake } from './PorcupineWake';
import { KeywordWake } from './KeywordWake';

/**
 * Choose a wake engine.
 * - If Picovoice is configured AND its native module is present, use
 *   Porcupine (low-power, always-on) for the custom "Hi Orch" keyword.
 * - Otherwise use the software KeywordWake, which accepts the full set of
 *   wake words (incl. bare "Hi") using the shared STT engine.
 */
export async function createWakeEngine(
  stt: SttEngine,
  opts?: { preferPorcupine?: boolean; keywordPaths?: string[] },
): Promise<WakeWordEngine> {
  if (opts?.preferPorcupine !== false) {
    const porcupine = new PorcupineWake(opts?.keywordPaths);
    if (await porcupine.isAvailable()) return porcupine;
  }
  return new KeywordWake(stt);
}

export { PorcupineWake, KeywordWake };
export { matchWake, residualIsCommand } from './match';
