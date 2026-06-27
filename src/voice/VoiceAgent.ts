import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import type { EnergyLevel } from '@/types';
import { normalizeTranscript } from '@/utils/strings';
import { useVoiceStore, type VoiceAgentState } from '@/stores/voiceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  COMMIT_SILENCE_MS,
  MIN_COMMIT_CHARS,
  POST_SPEAK_DELAY_MS,
  SLEEP_TIMEOUT_MS,
  TTS_GUARD_BASE_MS,
  TTS_GUARD_MAX_MS,
  TTS_GUARD_PER_CHAR_MS,
  WAKE_ACK,
} from './constants';
import { createSttEngine, type SttEngineName } from './stt';
import { getTtsEngine } from './tts';
import { createWakeEngine } from './wake';
import { matchWake, residualIsCommand } from './wake/match';
import { parseIntent, type AppRoute, type Intent } from './intents';
import type { SttEngine, TtsEngine, WakeWordEngine } from './types';

export interface AgentActions {
  navigate: (route: AppRoute) => void;
  /** Persist + answer a chat message. Returns the clean spoken reply. */
  sendChat: (text: string) => Promise<{ reply: string; savedSummary?: string }>;
  logEnergy: (
    level: EnergyLevel,
    opts?: { mood?: string; note?: string },
  ) => Promise<void>;
  /** Generate (or reshuffle) today's plan; returns the morning brief text. */
  generatePlan: (reshuffle: boolean) => Promise<string>;
  /** A short spoken summary of the top 3 tasks. */
  getTopTasksSpeech: () => Promise<string>;
  /** The morning brief text to read aloud. */
  getBriefSpeech: () => Promise<string>;
  /** Open the commands sheet (for the help intent). */
  openCommands: () => void;
  toast: (msg: string) => void;
}

/**
 * The turn-based, always-listening voice agent.
 *
 * Invariants:
 *  - In THINKING/SPEAKING the STT engine is fully stopped → the agent can
 *    never transcribe its own TTS or trigger itself.
 *  - The transcript buffer is REPLACED from the engine's cumulative result,
 *    never appended → no duplicated words.
 *  - A commit only happens after COMMIT_SILENCE_MS of silence → long rants
 *    with natural pauses stay one message.
 *  - The "muted for TTS" guard has a hard time-based fallback → it can never
 *    get stuck if a TTS "done" event is dropped.
 *  - The sleep timer only counts idle time while AWAKE (never while thinking
 *    or speaking).
 */
export class VoiceAgent {
  private stt: SttEngine | null = null;
  private tts: TtsEngine;
  private wake: WakeWordEngine | null = null;
  private actions: AgentActions;

  private buffer = '';
  private turnId = 0; // invalidates stale STT callbacks across transitions
  private speakToken = 0; // invalidates stale TTS "done"/guard callbacks
  private starting = false;

  private commitTimer: ReturnType<typeof setTimeout> | null = null;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private guardTimer: ReturnType<typeof setTimeout> | null = null;
  private postSpeakTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(actions: AgentActions) {
    this.actions = actions;
    this.tts = getTtsEngine();
  }

  // ── store helpers ──────────────────────────────────────────────────────────
  private setState(s: VoiceAgentState) {
    useVoiceStore.getState().setState(s);
  }
  private get state(): VoiceAgentState {
    return useVoiceStore.getState().state;
  }
  private setLive(t: string) {
    useVoiceStore.getState().setLiveTranscript(t);
  }
  private setError(e: string | null) {
    useVoiceStore.getState().setError(e);
  }

  // ── timers ───────────────────────────────────────────────────────────────
  private clearCommit() {
    if (this.commitTimer) clearTimeout(this.commitTimer);
    this.commitTimer = null;
  }
  private clearSleep() {
    if (this.sleepTimer) clearTimeout(this.sleepTimer);
    this.sleepTimer = null;
  }
  private clearGuard() {
    if (this.guardTimer) clearTimeout(this.guardTimer);
    this.guardTimer = null;
  }
  private clearPostSpeak() {
    if (this.postSpeakTimer) clearTimeout(this.postSpeakTimer);
    this.postSpeakTimer = null;
  }
  private clearAllTimers() {
    this.clearCommit();
    this.clearSleep();
    this.clearGuard();
    this.clearPostSpeak();
  }

  private armSleepTimer() {
    this.clearSleep();
    this.sleepTimer = setTimeout(() => {
      // Only sleep if we're genuinely idle in AWAKE.
      if (this.state === 'AWAKE') {
        void this.goArmed();
      }
    }, SLEEP_TIMEOUT_MS);
  }

  // ── audio session ──────────────────────────────────────────────────────────
  private async configureAudio(recording: boolean) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: recording,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch {
      /* best effort */
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      useVoiceStore.getState().setMicPermission(granted);
      return granted;
    } catch {
      useVoiceStore.getState().setMicPermission(false);
      return false;
    }
  }

  // ── lifecycle ───────────────────────────────────────────────────────────────
  /** Turn the agent on: build engines and start listening for the wake word. */
  async start(): Promise<void> {
    if (this.starting) return;
    if (this.state !== 'OFF') return;
    this.starting = true;
    this.setError(null);
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        this.actions.toast('Microphone permission is needed for voice.');
        this.setState('OFF');
        return;
      }

      const engineName = useSettingsStore.getState().sttEngine as SttEngineName;
      this.stt = await createSttEngine(engineName);

      // Voice needs native speech modules that are NOT present in Expo Go.
      // If unavailable, degrade gracefully — the rest of the app works fine.
      const sttAvailable = await this.stt.isAvailable();
      if (!sttAvailable) {
        useVoiceStore.getState().setUnavailable(true);
        this.setError(
          'Voice needs a development build — the speech module isn’t available in Expo Go.',
        );
        this.setState('OFF');
        return;
      }
      useVoiceStore.getState().setUnavailable(false);

      this.wake = await createWakeEngine(this.stt, {
        preferPorcupine: useSettingsStore.getState().wakeWordEnabled,
      });

      await this.goArmed();
    } catch (err) {
      this.fail(err as Error);
    } finally {
      this.starting = false;
    }
  }

  /** Turn the agent off entirely. */
  async stop(): Promise<void> {
    this.turnId++;
    this.speakToken++;
    this.clearAllTimers();
    this.buffer = '';
    this.setLive('');
    try {
      await this.wake?.stop();
      await this.stt?.stop();
      await this.tts.stop();
    } catch {
      /* ignore */
    }
    useVoiceStore.getState().setWakeReady(false);
    this.setState('OFF');
  }

  async destroy(): Promise<void> {
    await this.stop();
    try {
      await this.wake?.destroy();
      await this.stt?.destroy();
    } catch {
      /* ignore */
    }
    this.wake = null;
    this.stt = null;
  }

  private fail(err: Error) {
    this.setError(err.message);
    this.actions.toast(err.message);
    // Try to recover into ARMED rather than dying.
    void this.goArmed().catch(() => this.setState('OFF'));
  }

  // ── ARMED: wait for wake word ────────────────────────────────────────────────
  private async goArmed(): Promise<void> {
    this.turnId++;
    this.clearAllTimers();
    this.buffer = '';
    this.setLive('');
    this.setState('ARMED');

    if (!this.wake || !this.stt) return;

    // Make sure no STT turn is still running before the wake engine (which may
    // share the same recognizer) starts.
    try {
      await this.stt.stop();
    } catch {
      /* ignore */
    }
    await this.configureAudio(true);

    try {
      await this.wake.start({
        onWake: (info) => {
          void this.onWake(info?.transcript);
        },
        onError: (e) => {
          // wake errors are usually benign (recognizer restarts); surface once
          this.setError(e.message);
        },
      });
      useVoiceStore.getState().setWakeReady(true);
    } catch (err) {
      // Do NOT loop back through fail()/goArmed() — that spins the same error
      // (e.g. a missing native module). Surface once and go OFF.
      useVoiceStore.getState().setWakeReady(false);
      this.setError((err as Error).message);
      this.setState('OFF');
    }
  }

  /** Allow the UI to trigger a wake manually (mic tap while ARMED). */
  async wakeManually(): Promise<void> {
    if (this.state === 'ARMED') {
      await this.onWake(undefined);
    }
  }

  /** UI: put the agent back to sleep (ARMED) from AWAKE. */
  async sleep(): Promise<void> {
    if (this.state === 'AWAKE' || this.state === 'THINKING') {
      await this.tts.stop().catch(() => {});
      await this.goArmed();
    }
  }

  private async onWake(heardTranscript?: string): Promise<void> {
    if (this.state !== 'ARMED') return;
    await this.wake?.stop();
    useVoiceStore.getState().setWakeReady(false);

    // Did the wake phrase carry a trailing command? ("hi, plan my day")
    let residual = '';
    if (heardTranscript) {
      residual = matchWake(heardTranscript).residual;
    }

    if (residual && residualIsCommand(residual)) {
      // Execute immediately — no "Yes?" needed.
      await this.handleCommitted(normalizeTranscript(residual));
      return;
    }

    // Just a greeting — acknowledge and listen.
    const ack = useSettingsStore.getState().acknowledgeOnWake;
    if (ack) {
      await this.speak(WAKE_ACK, { thenListen: true });
    } else {
      await this.enterAwake();
    }
  }

  // ── AWAKE: capture an utterance ──────────────────────────────────────────────
  private async enterAwake(): Promise<void> {
    this.turnId++;
    const myTurn = this.turnId;
    this.clearAllTimers();
    this.buffer = '';
    this.setLive('');
    this.setState('AWAKE');
    await this.configureAudio(true);

    if (!this.stt) return;
    try {
      await this.stt.start({
        onTranscript: ({ transcript }) => {
          if (this.turnId !== myTurn) return; // stale callback
          if (this.state !== 'AWAKE') return; // mic must be off otherwise
          const text = normalizeTranscript(transcript);
          // REPLACE — never append. Cumulative engines can't duplicate words.
          this.buffer = text;
          this.setLive(text);
          // The user is speaking → push back both commit and sleep.
          this.armSleepTimer();
          this.scheduleCommit(myTurn);
        },
        onError: (e) => {
          if (this.turnId !== myTurn) return;
          this.setError(e.message);
        },
      });
      this.armSleepTimer();
    } catch (err) {
      this.fail(err as Error);
    }
  }

  private scheduleCommit(myTurn: number) {
    this.clearCommit();
    this.commitTimer = setTimeout(() => {
      if (this.turnId !== myTurn) return;
      if (this.state !== 'AWAKE') return;
      const text = this.buffer.trim();
      if (text.length < MIN_COMMIT_CHARS) {
        // Nothing meaningful — keep listening.
        return;
      }
      void this.handleCommitted(text);
    }, COMMIT_SILENCE_MS);
  }

  /** Stop capturing, mute the mic, and act on the committed utterance. */
  private async handleCommitted(text: string): Promise<void> {
    this.turnId++; // invalidate any pending STT callbacks
    this.clearAllTimers();
    this.buffer = '';
    this.setLive('');
    this.setState('THINKING');
    // Hard stop the recognizer so nothing is captured while we work/speak.
    try {
      await this.stt?.stop();
    } catch {
      /* ignore */
    }

    const intent = parseIntent(text);
    try {
      await this.execute(intent, text);
    } catch (err) {
      await this.speak(
        `Sorry, something went wrong. ${(err as Error).message ?? ''}`.trim(),
        { thenListen: true },
      );
    }
  }

  // ── intent execution ─────────────────────────────────────────────────────────
  private async execute(intent: Intent, rawText: string): Promise<void> {
    switch (intent.kind) {
      case 'stop': {
        await this.speak('Okay, going to sleep. Say Hi to wake me.', {
          thenArm: true,
        });
        return;
      }

      case 'help': {
        this.actions.openCommands();
        await this.speak(
          'You can ask me to plan your day, log your energy, read your top three tasks, read your brief, or just talk to me. What would you like?',
          { thenListen: true },
        );
        return;
      }

      case 'navigate': {
        this.actions.navigate(intent.route);
        await this.speak(`Opening ${intent.route}.`, { thenListen: true });
        return;
      }

      case 'log_energy_numeric': {
        await this.actions.logEnergy(intent.level);
        this.actions.toast(`Energy logged ${intent.level}/5`);
        await this.speak(`Logged your energy at ${intent.level} out of 5.`, {
          thenListen: true,
        });
        return;
      }

      case 'log_energy_feeling': {
        // Log it AND send to chat AND navigate to Chat (per spec).
        await this.actions.logEnergy(intent.level, { note: intent.text });
        this.actions.toast(`Energy logged ${intent.level}/5`);
        this.actions.navigate('chat');
        const { reply } = await this.actions.sendChat(intent.text);
        await this.speak(reply, { thenListen: true });
        return;
      }

      case 'plan': {
        const brief = await this.actions.generatePlan(intent.reshuffle);
        this.actions.navigate('today');
        this.actions.toast(intent.reshuffle ? 'Plan reshuffled' : 'Plan ready');
        await this.speak(
          `${intent.reshuffle ? 'Reshuffled' : 'Here is'} your plan. ${brief}`,
          { thenListen: true },
        );
        return;
      }

      case 'read_top_tasks': {
        const speech = await this.actions.getTopTasksSpeech();
        await this.speak(speech, { thenListen: true });
        return;
      }

      case 'read_brief': {
        const brief = await this.actions.getBriefSpeech();
        await this.speak(brief, { thenListen: true });
        return;
      }

      case 'chat':
      default: {
        // The conversational heart — save to Chat and speak the reply.
        this.actions.navigate('chat');
        const { reply, savedSummary } = await this.actions.sendChat(
          intent.kind === 'chat' ? intent.text : rawText,
        );
        if (savedSummary) this.actions.toast(savedSummary);
        await this.speak(reply, { thenListen: true });
        return;
      }
    }
  }

  // ── SPEAKING: TTS with an un-stuck-able guard ────────────────────────────────
  /**
   * Speak text, keep the mic fully muted for the whole duration plus the
   * post-speak delay, then either listen again or go back to ARMED.
   */
  private async speak(
    text: string,
    next: { thenListen?: boolean; thenArm?: boolean } = { thenListen: true },
  ): Promise<void> {
    this.clearAllTimers();
    this.setState('SPEAKING');
    useVoiceStore.getState().setSpeakingText(text);

    // Belt & braces: ensure the recognizer is not running while we speak.
    try {
      await this.stt?.stop();
    } catch {
      /* ignore */
    }
    await this.configureAudio(false); // route TTS to the loud speaker

    const myToken = ++this.speakToken;
    let settled = false;

    const finish = () => {
      if (settled) return;
      if (myToken !== this.speakToken) return;
      settled = true;
      this.clearGuard();
      useVoiceStore.getState().setSpeakingText(null);
      // Brief pause so our audio tail / echo isn't captured.
      this.postSpeakTimer = setTimeout(() => {
        if (myToken !== this.speakToken) return;
        if (next.thenArm) {
          void this.goArmed();
        } else {
          void this.enterAwake();
        }
      }, POST_SPEAK_DELAY_MS);
    };

    // Time-based fallback: the guard can NEVER get stuck even if onDone is
    // never delivered (which happens on real devices).
    const guardMs = Math.min(
      TTS_GUARD_MAX_MS,
      TTS_GUARD_BASE_MS + text.length * TTS_GUARD_PER_CHAR_MS,
    );
    this.clearGuard();
    this.guardTimer = setTimeout(finish, guardMs);

    try {
      await this.tts.speak(text, {
        rate: useSettingsStore.getState().ttsRate,
        voiceId: useSettingsStore.getState().ttsVoiceId,
        onDone: finish,
        onError: () => finish(),
      });
    } catch {
      finish();
    }
  }

  /** UI: stop talking right now (barge-in) and listen. */
  async interrupt(): Promise<void> {
    if (this.state === 'SPEAKING') {
      this.speakToken++; // invalidate the in-flight speak
      this.clearGuard();
      this.clearPostSpeak();
      await this.tts.stop();
      useVoiceStore.getState().setSpeakingText(null);
      await this.enterAwake();
    }
  }

  /** Speak arbitrary text on demand (e.g. Chat "Listen") without changing
   *  the agent's turn state. Used only when the agent is OFF/ARMED. */
  async speakOneShot(text: string): Promise<void> {
    await this.configureAudio(false);
    await this.tts.speak(text, {
      rate: useSettingsStore.getState().ttsRate,
      voiceId: useSettingsStore.getState().ttsVoiceId,
    });
  }
}
