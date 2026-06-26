import { normalizeTranscript } from '@/utils/strings';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { SttCallbacks, SttEngine } from '../types';

/**
 * Streaming STT via Deepgram's realtime WebSocket API.
 *
 * Security: by default this fetches a SHORT-LIVED token from the
 * `stt-token` edge function so the Deepgram key never ships in the app.
 * (Only if EXPO_PUBLIC_DEEPGRAM_API_KEY is set do we use it directly — for
 * local testing; not recommended for production.)
 *
 * Audio: Deepgram needs raw PCM frames. Expo's managed `expo-av` does not
 * expose live PCM in JS, so an `AudioFrameSource` is injected. The repo
 * ships on-device STT as the default working engine; wire a PCM-capable
 * native source (dev build) and switch EXPO_PUBLIC_STT_ENGINE=deepgram to
 * use this. Protocol handling below is complete and production-shaped.
 */
export interface AudioFrameSource {
  isAvailable(): Promise<boolean>;
  /** Begin emitting 16-bit little-endian PCM frames (16kHz mono). */
  start(onFrame: (pcm: ArrayBuffer) => void): Promise<void>;
  stop(): Promise<void>;
}

/** Default no-op source: not available in managed Expo (no live PCM). */
const unavailableSource: AudioFrameSource = {
  isAvailable: async () => false,
  start: async () => {
    throw new Error('No PCM audio source configured for Deepgram streaming');
  },
  stop: async () => {},
};

const DG_SAMPLE_RATE = 16000;

export class DeepgramStt implements SttEngine {
  readonly name = 'deepgram';

  private ws: WebSocket | null = null;
  private listening = false;
  private committedSegments: string[] = [];
  private currentInterim = '';
  private callbacks: SttCallbacks | null = null;
  private keepAlive: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly source: AudioFrameSource = unavailableSource) {}

  async isAvailable(): Promise<boolean> {
    const hasKeyPath = Boolean(env.deepgramApiKey) || Boolean(env.supabaseUrl);
    return hasKeyPath && (await this.source.isAvailable());
  }

  private async getToken(): Promise<string> {
    if (env.deepgramApiKey) return env.deepgramApiKey;
    const { data, error } = await supabase.functions.invoke<{ token: string }>(
      'stt-token',
      { body: {} },
    );
    if (error || !data?.token) {
      throw new Error('Could not obtain Deepgram token');
    }
    return data.token;
  }

  private emit() {
    if (!this.callbacks) return;
    const full = normalizeTranscript(
      [...this.committedSegments, this.currentInterim].join(' '),
    );
    this.callbacks.onTranscript({ transcript: full, isFinal: false });
  }

  async start(callbacks: SttCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.committedSegments = [];
    this.currentInterim = '';
    this.listening = true;

    const token = await this.getToken();
    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en-US',
      encoding: 'linear16',
      sample_rate: String(DG_SAMPLE_RATE),
      smart_format: 'true',
      interim_results: 'true',
      endpointing: '300',
    });
    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    // RN WebSocket supports a 3rd "protocols" arg used here for auth.
    this.ws = new WebSocket(url, ['token', token]);

    this.ws.onopen = async () => {
      try {
        await this.source.start((pcm) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(pcm);
          }
        });
      } catch (err) {
        this.callbacks?.onError(err as Error);
      }
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(String(evt.data));
        const alt = msg?.channel?.alternatives?.[0];
        if (!alt) return;
        const text: string = alt.transcript ?? '';
        if (!text) return;
        if (msg.is_final) {
          this.committedSegments.push(text.trim());
          this.currentInterim = '';
        } else {
          // REPLACE interim (cumulative within the current segment).
          this.currentInterim = text;
        }
        this.emit();
      } catch {
        /* non-JSON keepalive frames */
      }
    };

    this.ws.onerror = () => {
      if (this.listening) {
        this.callbacks?.onError(new Error('Deepgram socket error'));
      }
    };

    this.ws.onclose = () => {
      this.callbacks?.onEnd?.();
    };

    // Deepgram closes idle sockets; ping with KeepAlive.
    this.keepAlive = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 6000);
  }

  private async teardown(finalize: boolean) {
    this.listening = false;
    if (this.keepAlive) {
      clearInterval(this.keepAlive);
      this.keepAlive = null;
    }
    await this.source.stop().catch(() => {});
    if (this.ws) {
      try {
        if (finalize && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'CloseStream' }));
        }
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.committedSegments = [];
    this.currentInterim = '';
  }

  async stop(): Promise<void> {
    await this.teardown(true);
  }

  async cancel(): Promise<void> {
    await this.teardown(false);
  }

  async destroy(): Promise<void> {
    await this.teardown(false);
  }

  isListening(): boolean {
    return this.listening;
  }
}
