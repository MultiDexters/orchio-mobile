import { useCallback, useEffect } from 'react';
import { useVoiceStore } from '@/stores/voiceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { getVoiceAgent } from './agentSingleton';

/**
 * The smart mic action, usable anywhere (overlay, Chat screen) WITHOUT the
 * lifecycle side-effects of the controller hook. Acts on the current state.
 */
export function pressVoiceMic(): void {
  const agent = getVoiceAgent();
  const s = useVoiceStore.getState().state;
  switch (s) {
    case 'OFF':
      useSettingsStore.getState().setVoiceEnabled(true);
      void agent.start();
      break;
    case 'ARMED':
      void agent.wakeManually();
      break;
    case 'AWAKE':
      void agent.sleep();
      break;
    case 'SPEAKING':
      void agent.interrupt();
      break;
    case 'THINKING':
    default:
      break;
  }
}

/**
 * App-wide controller for the voice agent. Mount ONCE (in the authed layout).
 * Starts/stops the agent based on auth + the voiceEnabled setting, and exposes
 * the smart mic-press handler used by the floating overlay.
 */
export function useVoiceAgentController() {
  const isAuthed = useAuthStore((s) => Boolean(s.user));
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const state = useVoiceStore((s) => s.state);

  useEffect(() => {
    if (!hydrated) return;
    const agent = getVoiceAgent();
    if (isAuthed && voiceEnabled) {
      if (useVoiceStore.getState().state === 'OFF') {
        void agent.start();
      }
    } else {
      void agent.stop();
    }
  }, [isAuthed, voiceEnabled, hydrated]);

  // Tear down on unmount of the authed area.
  useEffect(() => {
    return () => {
      void getVoiceAgent().stop();
    };
  }, []);

  const onMicPress = useCallback(() => pressVoiceMic(), []);

  const disableVoice = useCallback(() => {
    useSettingsStore.getState().setVoiceEnabled(false);
    void getVoiceAgent().stop();
  }, []);

  return { state, onMicPress, disableVoice };
}

/** Lightweight read-only access to voice state for any component. */
export function useVoiceState() {
  return useVoiceStore();
}
