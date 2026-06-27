import { create } from 'zustand';

export type VoiceAgentState =
  | 'OFF'
  | 'ARMED'
  | 'AWAKE'
  | 'THINKING'
  | 'SPEAKING';

interface VoiceStoreState {
  state: VoiceAgentState;
  /** Live, in-progress transcript shown while AWAKE. */
  liveTranscript: string;
  /** The text currently being spoken (for the caption / debugging). */
  speakingText: string | null;
  /** mic permission: null = unknown, true/false once resolved. */
  micPermission: boolean | null;
  /** Wake-word engine is loaded & listening. */
  wakeReady: boolean;
  /** True when the speech module isn't present (e.g. running in Expo Go).
   *  Voice needs a development build; the rest of the app still works. */
  unavailable: boolean;
  lastError: string | null;

  setState: (s: VoiceAgentState) => void;
  setLiveTranscript: (t: string) => void;
  setSpeakingText: (t: string | null) => void;
  setMicPermission: (b: boolean | null) => void;
  setWakeReady: (b: boolean) => void;
  setUnavailable: (b: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStoreState>((set) => ({
  state: 'OFF',
  liveTranscript: '',
  speakingText: null,
  micPermission: null,
  wakeReady: false,
  unavailable: false,
  lastError: null,

  setState: (state) => set({ state }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  setSpeakingText: (speakingText) => set({ speakingText }),
  setMicPermission: (micPermission) => set({ micPermission }),
  setWakeReady: (wakeReady) => set({ wakeReady }),
  setUnavailable: (unavailable) => set({ unavailable }),
  setError: (lastError) => set({ lastError }),
  reset: () =>
    set({
      state: 'OFF',
      liveTranscript: '',
      speakingText: null,
      lastError: null,
    }),
}));

/** Human-friendly status bubble copy for each state. */
export function statusCopy(state: VoiceAgentState): {
  title: string;
  subtitle: string;
} {
  switch (state) {
    case 'OFF':
      return { title: 'Voice off', subtitle: 'Tap the mic to enable' };
    case 'ARMED':
      return { title: "Say 'Hi' to wake me", subtitle: 'Listening for wake word' };
    case 'AWAKE':
      return { title: 'Your turn — speak now', subtitle: 'I’m listening…' };
    case 'THINKING':
      return { title: 'Thinking…', subtitle: 'Working on it' };
    case 'SPEAKING':
      return { title: 'Speaking… (mic off)', subtitle: 'I’ll listen again in a sec' };
  }
}
