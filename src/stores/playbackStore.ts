import { create } from 'zustand';
import { getTtsEngine } from '@/voice/tts';
import { toSpeech } from '@/utils/markdown';

interface PlaybackState {
  /** id of the message currently being read aloud, or null. */
  playingId: string | null;
  /** Toggle read-aloud for a message. Markdown is stripped before speaking. */
  toggle: (id: string, text: string) => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Drives the Chat "Listen" speaker buttons. Reads clean text aloud (markdown
 * stripped) and lets the user tap again to stop. Only one plays at a time.
 */
export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  playingId: null,

  toggle: async (id, text) => {
    const tts = getTtsEngine();
    if (get().playingId === id) {
      await tts.stop();
      set({ playingId: null });
      return;
    }
    await tts.stop();
    set({ playingId: id });
    await tts.speak(toSpeech(text), {
      onDone: () => {
        if (get().playingId === id) set({ playingId: null });
      },
      onError: () => {
        if (get().playingId === id) set({ playingId: null });
      },
    });
  },

  stop: async () => {
    await getTtsEngine().stop();
    set({ playingId: null });
  },
}));
