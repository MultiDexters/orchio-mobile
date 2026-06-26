import * as Speech from 'expo-speech';
import { toSpeech } from '@/utils/markdown';
import type { TtsEngine, TtsOptions, TtsVoice } from '../types';

/**
 * expo-speech TTS. We pick a clear en-US voice and always strip markdown
 * before speaking. NOTE: mobile TTS "onDone" is unreliable — callers must
 * also use a time-based fallback (the VoiceAgent does). We still fire the
 * callbacks here for the happy path.
 */
export class ExpoTts implements TtsEngine {
  readonly name = 'expo-speech';
  private speaking = false;
  private cachedVoiceId: string | null | undefined = undefined;

  async listVoices(): Promise<TtsVoice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.map((v) => ({
        id: v.identifier,
        name: v.name,
        language: v.language,
      }));
    } catch {
      return [];
    }
  }

  /** Choose a natural en-US voice once and cache it. */
  private async pickVoice(preferred?: string | null): Promise<string | null> {
    if (preferred) return preferred;
    if (this.cachedVoiceId !== undefined) return this.cachedVoiceId;

    const voices = await this.listVoices();
    const enUs = voices.filter((v) => /en[-_]US/i.test(v.language));
    // Prefer known-natural voices, else any en-US, else null (system default).
    const preferredNames = [
      /siri/i,
      /samantha/i,
      /aaron/i,
      /nicky/i,
      /en-us-x-/i, // Google network voices
      /enhanced/i,
    ];
    let chosen: TtsVoice | undefined;
    for (const rx of preferredNames) {
      chosen = enUs.find((v) => rx.test(v.name) || rx.test(v.id));
      if (chosen) break;
    }
    chosen ??= enUs[0];
    this.cachedVoiceId = chosen?.id ?? null;
    return this.cachedVoiceId;
  }

  async speak(text: string, options: TtsOptions = {}): Promise<void> {
    const clean = toSpeech(text);
    if (!clean) {
      options.onDone?.();
      return;
    }

    // Ensure we never overlap utterances.
    await this.stop();

    const voice = await this.pickVoice(options.voiceId);
    this.speaking = true;

    Speech.speak(clean, {
      language: 'en-US',
      rate: options.rate ?? 1.0,
      pitch: options.pitch ?? 1.0,
      voice: voice ?? undefined,
      onStart: () => options.onStart?.(),
      onDone: () => {
        this.speaking = false;
        options.onDone?.();
      },
      onStopped: () => {
        this.speaking = false;
        options.onDone?.();
      },
      onError: (e) => {
        this.speaking = false;
        options.onError?.(e instanceof Error ? e : new Error(String(e)));
      },
    });
  }

  async stop(): Promise<void> {
    this.speaking = false;
    try {
      await Speech.stop();
    } catch {
      /* ignore */
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return this.speaking;
    }
  }
}
