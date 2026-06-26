import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/lib/env';

export type ThemePref = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePref;
  voiceEnabled: boolean;
  wakeWordEnabled: boolean;
  /** Audible "Yes?" acknowledgement when waking. */
  acknowledgeOnWake: boolean;
  sttEngine: 'ondevice' | 'deepgram';
  ttsRate: number;
  ttsVoiceId: string | null;
  hydrated: boolean;

  setTheme: (t: ThemePref) => void;
  setVoiceEnabled: (b: boolean) => void;
  setWakeWordEnabled: (b: boolean) => void;
  setAcknowledgeOnWake: (b: boolean) => void;
  setSttEngine: (e: 'ondevice' | 'deepgram') => void;
  setTtsRate: (n: number) => void;
  setTtsVoiceId: (id: string | null) => void;
  markHydrated: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      voiceEnabled: true,
      wakeWordEnabled: true,
      acknowledgeOnWake: true,
      sttEngine: env.sttEngine,
      ttsRate: 1.0,
      ttsVoiceId: null,
      hydrated: false,

      setTheme: (theme) => set({ theme }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setWakeWordEnabled: (wakeWordEnabled) => set({ wakeWordEnabled }),
      setAcknowledgeOnWake: (acknowledgeOnWake) => set({ acknowledgeOnWake }),
      setSttEngine: (sttEngine) => set({ sttEngine }),
      setTtsRate: (ttsRate) => set({ ttsRate }),
      setTtsVoiceId: (ttsVoiceId) => set({ ttsVoiceId }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'orchio-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        theme: s.theme,
        voiceEnabled: s.voiceEnabled,
        wakeWordEnabled: s.wakeWordEnabled,
        acknowledgeOnWake: s.acknowledgeOnWake,
        sttEngine: s.sttEngine,
        ttsRate: s.ttsRate,
        ttsVoiceId: s.ttsVoiceId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
