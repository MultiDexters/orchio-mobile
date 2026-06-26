import type { SttEngine } from '../types';
import { OnDeviceStt } from './OnDeviceStt';
import { DeepgramStt } from './DeepgramStt';

export type SttEngineName = 'ondevice' | 'deepgram';

/**
 * Build an STT engine by name, with graceful fallback to on-device.
 * The agent calls this; nothing else needs to know which engine is live.
 */
export async function createSttEngine(
  preferred: SttEngineName,
): Promise<SttEngine> {
  if (preferred === 'deepgram') {
    const dg = new DeepgramStt();
    if (await dg.isAvailable()) return dg;
    // Fall back silently — on-device always works on a dev/native build.
  }
  return new OnDeviceStt();
}

export { OnDeviceStt, DeepgramStt };
