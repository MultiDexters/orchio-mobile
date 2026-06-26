/**
 * Swappable voice engine contracts.
 * STT, TTS and wake-word detection are all defined as interfaces so the
 * concrete engine (on-device vs Deepgram, expo-speech vs native TTS,
 * Porcupine vs software keyword) can be swapped without touching the agent.
 */

// ── Speech-to-text ───────────────────────────────────────────────────────────

export interface SttResult {
  /**
   * The FULL current utterance so far for this listening session — NOT a
   * delta. The agent replaces its buffer with this value every time, which
   * is how we avoid duplicated words from cumulative engines.
   */
  transcript: string;
  /** True when the engine considers a segment finalised. */
  isFinal: boolean;
}

export interface SttCallbacks {
  onTranscript: (result: SttResult) => void;
  onError: (error: Error) => void;
  /** Engine ended on its own (we usually auto-restart inside the adapter). */
  onEnd?: () => void;
}

export interface SttEngine {
  readonly name: string;
  /** Whether this engine can run on the current device/config. */
  isAvailable(): Promise<boolean>;
  /** Begin a continuous listening session. Buffers reset on each start(). */
  start(callbacks: SttCallbacks): Promise<void>;
  /** Stop listening and finalise. Clears internal buffers. */
  stop(): Promise<void>;
  /** Stop and discard without finalising. */
  cancel(): Promise<void>;
  /** Tear down all native resources. */
  destroy(): Promise<void>;
  /** Currently capturing audio? */
  isListening(): boolean;
}

// ── Text-to-speech ───────────────────────────────────────────────────────────

export interface TtsOptions {
  rate?: number;
  pitch?: number;
  voiceId?: string | null;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (e: Error) => void;
}

export interface TtsVoice {
  id: string;
  name: string;
  language: string;
}

export interface TtsEngine {
  readonly name: string;
  speak(text: string, options?: TtsOptions): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
  listVoices(): Promise<TtsVoice[]>;
}

// ── Wake word ────────────────────────────────────────────────────────────────

export interface WakeInfo {
  /** Full text heard at the moment of wake, if the detector is text-based.
   *  Lets the agent execute trailing commands ("hi, plan my day"). */
  transcript?: string;
}

export interface WakeCallbacks {
  onWake: (info?: WakeInfo) => void;
  onError: (e: Error) => void;
}

export interface WakeWordEngine {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  start(callbacks: WakeCallbacks): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  isRunning(): boolean;
}
