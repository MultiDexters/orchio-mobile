import { env } from '@/lib/env';
import { PORCUPINE_FALLBACK_BUILTIN } from '../constants';
import type { WakeCallbacks, WakeWordEngine } from '../types';

/**
 * Low-power, always-on wake detection via Picovoice Porcupine.
 *
 * Ship a custom "Hi Orch" keyword (.ppn from console.picovoice.ai) and place
 * it in `assets/wake/`, then pass its bundled path via `keywordPaths`. With
 * no custom model we fall back to a built-in keyword so the path still works
 * for testing. Bare "Hi"/"Hey" etc. are handled by the software KeywordWake
 * engine (see ./KeywordWake) which is the default when Porcupine isn't set up.
 */
export class PorcupineWake implements WakeWordEngine {
  readonly name = 'porcupine';
  private manager: any | null = null;
  private running = false;

  constructor(private readonly keywordPaths?: string[]) {}

  private getModule(): any | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('@picovoice/porcupine-react-native');
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(env.picovoiceAccessKey) && Boolean(this.getModule());
  }

  async start(callbacks: WakeCallbacks): Promise<void> {
    const mod = this.getModule();
    if (!mod) throw new Error('Porcupine native module unavailable');
    if (!env.picovoiceAccessKey) throw new Error('Missing Picovoice access key');

    const { PorcupineManager, BuiltInKeywords } = mod;

    const onDetected = (_index: number) => callbacks.onWake({});
    const onError = (e: any) =>
      callbacks.onError(e instanceof Error ? e : new Error(String(e)));

    if (this.keywordPaths && this.keywordPaths.length > 0) {
      this.manager = await PorcupineManager.fromKeywordPaths(
        env.picovoiceAccessKey,
        this.keywordPaths,
        onDetected,
        onError,
        this.keywordPaths.map(() => 0.6),
      );
    } else {
      const builtin =
        BuiltInKeywords?.[PORCUPINE_FALLBACK_BUILTIN] ??
        BuiltInKeywords?.COMPUTER;
      this.manager = await PorcupineManager.fromBuiltInKeywords(
        env.picovoiceAccessKey,
        [builtin],
        onDetected,
        onError,
      );
    }

    await this.manager.start();
    this.running = true;
  }

  async stop(): Promise<void> {
    this.running = false;
    try {
      await this.manager?.stop();
    } catch {
      /* ignore */
    }
  }

  async destroy(): Promise<void> {
    this.running = false;
    try {
      await this.manager?.delete();
    } catch {
      /* ignore */
    }
    this.manager = null;
  }

  isRunning(): boolean {
    return this.running;
  }
}
