import type { SttEngine, WakeCallbacks, WakeWordEngine } from '../types';
import { matchWake } from './match';

/**
 * Software wake detector. Runs the shared STT engine in ARMED and fires when
 * any accepted wake word appears at the start of the transcript. This is the
 * default detector (no Picovoice key required) and is the one that accepts a
 * bare "Hi", "Hey", "Hello", "Yo" and the "orch" mishearings.
 *
 * It reuses the SAME SttEngine instance the agent uses for AWAKE listening so
 * the native recognizer is never double-started. The agent stops this before
 * starting the AWAKE turn.
 */
export class KeywordWake implements WakeWordEngine {
  readonly name = 'keyword';
  private running = false;
  private fired = false;

  constructor(private readonly stt: SttEngine) {}

  async isAvailable(): Promise<boolean> {
    return this.stt.isAvailable();
  }

  async start(callbacks: WakeCallbacks): Promise<void> {
    this.running = true;
    this.fired = false;
    await this.stt.start({
      onTranscript: ({ transcript }) => {
        if (!this.running || this.fired) return;
        const { matched } = matchWake(transcript);
        if (matched) {
          this.fired = true;
          callbacks.onWake({ transcript });
        }
      },
      onError: (e) => {
        if (this.running) callbacks.onError(e);
      },
    });
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.stt.stop();
  }

  async destroy(): Promise<void> {
    this.running = false;
    // Do not destroy the shared STT engine here; the agent owns its lifecycle.
  }

  isRunning(): boolean {
    return this.running;
  }
}
