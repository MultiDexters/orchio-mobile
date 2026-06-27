import { NativeModules } from 'react-native';
import { normalizeTranscript } from '@/utils/strings';
import type { SttCallbacks, SttEngine } from '../types';

/**
 * On-device STT via @react-native-voice/voice.
 *
 * Native recognizers finalise (and stop) after a short silence. To support
 * ONE long utterance across natural pauses we run a continuous session:
 *  - keep finalised segments in `committedSegments`
 *  - keep the active sub-session's latest partial in `currentPartial`
 *  - the transcript we emit is always the FULL join of both (cumulative,
 *    REPLACE semantics) — never a delta, so words can't duplicate
 *  - when a sub-session ends we auto-restart while still "listening"
 *
 * The agent layer owns the silence-commit timer; this adapter just keeps a
 * faithful, growing transcript flowing.
 */
export class OnDeviceStt implements SttEngine {
  readonly name = 'ondevice';

  private Voice: any | null = null;
  private listening = false;
  private restarting = false;
  private committedSegments: string[] = [];
  private currentPartial = '';
  private callbacks: SttCallbacks | null = null;
  private readonly locale: string;

  constructor(locale = 'en-US') {
    this.locale = locale;
  }

  private getVoice(): any | null {
    if (this.Voice) return this.Voice;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@react-native-voice/voice');
      this.Voice = mod.default ?? mod;
      return this.Voice;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    const Voice = this.getVoice();
    if (!Voice) return false;
    // The reliable signal is whether the NATIVE module is linked. In Expo Go
    // it is absent; in a dev/standalone build it is present (named "Voice" on
    // iOS, "RCTVoice" on Android). The native isAvailable() RPC is flaky and
    // can return falsy for non-fatal reasons, so don't gate on it.
    const nm: Record<string, unknown> = NativeModules ?? {};
    return Boolean(nm.Voice || nm.RCTVoice);
  }

  private emit() {
    if (!this.callbacks) return;
    const full = normalizeTranscript(
      [...this.committedSegments, this.currentPartial].join(' '),
    );
    this.callbacks.onTranscript({ transcript: full, isFinal: false });
  }

  private bindListeners(Voice: any) {
    Voice.onSpeechPartialResults = (e: { value?: string[] }) => {
      if (!this.listening) return;
      const best = e.value?.[0] ?? '';
      // REPLACE the partial for the active sub-session (cumulative engine).
      this.currentPartial = best;
      this.emit();
    };

    Voice.onSpeechResults = (e: { value?: string[] }) => {
      if (!this.listening) return;
      const best = e.value?.[0] ?? '';
      if (best.trim()) {
        this.committedSegments.push(best.trim());
      }
      this.currentPartial = '';
      this.emit();
    };

    Voice.onSpeechEnd = () => {
      // A sub-session finished. If we're still meant to be listening,
      // restart so the long utterance keeps flowing across the pause.
      if (this.listening) {
        void this.restart();
      }
    };

    Voice.onSpeechError = (e: { error?: { code?: string; message?: string } }) => {
      const code = e?.error?.code ?? '';
      // "no match" / "speech timeout" are normal during pauses — restart.
      const benign = ['7', '6', 'recognition_fail', '203', '205'];
      if (this.listening && benign.some((c) => String(code).includes(c))) {
        void this.restart();
        return;
      }
      if (this.listening) {
        this.callbacks?.onError(
          new Error(e?.error?.message ?? `STT error ${code || 'unknown'}`),
        );
      }
    };
  }

  private async restart() {
    if (this.restarting || !this.listening) return;
    this.restarting = true;
    const Voice = this.getVoice();
    try {
      await Voice?.cancel().catch(() => {});
      if (this.listening) {
        await Voice?.start(this.locale);
      }
    } catch (err) {
      if (this.listening) {
        this.callbacks?.onError(err as Error);
      }
    } finally {
      this.restarting = false;
    }
  }

  async start(callbacks: SttCallbacks): Promise<void> {
    const Voice = this.getVoice();
    if (!Voice) throw new Error('On-device speech recognition unavailable');

    this.callbacks = callbacks;
    this.committedSegments = [];
    this.currentPartial = '';
    this.listening = true;

    this.bindListeners(Voice);
    await Voice.start(this.locale);
  }

  async stop(): Promise<void> {
    this.listening = false;
    const Voice = this.getVoice();
    try {
      await Voice?.stop();
    } catch {
      /* ignore */
    }
    this.committedSegments = [];
    this.currentPartial = '';
  }

  async cancel(): Promise<void> {
    this.listening = false;
    const Voice = this.getVoice();
    try {
      await Voice?.cancel();
    } catch {
      /* ignore */
    }
    this.committedSegments = [];
    this.currentPartial = '';
  }

  async destroy(): Promise<void> {
    this.listening = false;
    const Voice = this.getVoice();
    try {
      await Voice?.destroy();
      Voice?.removeAllListeners?.();
    } catch {
      /* ignore */
    }
  }

  isListening(): boolean {
    return this.listening;
  }
}
