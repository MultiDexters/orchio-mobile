# Orchio — Voice agent

The voice agent is a **turn-based, always-listening state machine**. Its job is
to never hear itself, never cut the user off, never duplicate words, and to keep
listening through long conversations. This document describes the machine and
its tuning constants.

Core files:

| Concern | File |
| --- | --- |
| State machine / controller | [`src/voice/VoiceAgent.ts`](src/voice/VoiceAgent.ts) |
| Tuning constants + wake words | [`src/voice/constants.ts`](src/voice/constants.ts) |
| Intent parsing | [`src/voice/intents.ts`](src/voice/intents.ts) |
| STT interface + adapters | [`src/voice/stt/`](src/voice/stt/) |
| TTS interface + adapter | [`src/voice/tts/`](src/voice/tts/) |
| Wake-word interface + adapters | [`src/voice/wake/`](src/voice/wake/) |
| React wiring / lifecycle | [`src/voice/useVoiceAgent.ts`](src/voice/useVoiceAgent.ts) |
| Reactive UI state | [`src/stores/voiceStore.ts`](src/stores/voiceStore.ts) |

## State machine

```
        ┌──────┐   enable / mic tap
        │ OFF  │ ───────────────────────────┐
        └──────┘                             ▼
                                        ┌─────────┐
            wake word / mic tap   ◀──────│ ARMED   │  (Porcupine or software
        ┌──────────────────────────────│         │   wake detector running)
        ▼                               └─────────┘
   ┌─────────┐  silence ≥ COMMIT_SILENCE_MS   ▲  ▲
   │  AWAKE  │ ───────────────┐               │  │ sleep ≥ SLEEP_TIMEOUT_MS
   │ (STT on)│                │               │  │ or "stop listening"
   └─────────┘                ▼               │  │
        ▲                ┌──────────┐         │  │
        │                │ THINKING │ (mic    │  │
        │                │          │  muted) │  │
        │                └──────────┘         │  │
        │                     │ reply ready    │  │
        │                     ▼                │  │
        │   POST_SPEAK_DELAY ┌──────────┐ ─────┘  │
        └────────────────────│ SPEAKING │ ────────┘
                             │ (mic off)│  (thenArm on "stop")
                              └──────────┘
```

- **OFF** — voice disabled.
- **ARMED** — only the wake word is being listened for. Mic icon idle.
- **AWAKE** — full STT running, capturing an utterance. “Your turn — speak now.”
- **THINKING** — request/AI in flight. **Mic fully stopped.**
- **SPEAKING** — TTS playing. **Mic fully stopped.** After it finishes we wait
  `POST_SPEAK_DELAY` then return to AWAKE (or ARMED after “stop listening”).

## The five bugs we designed against

1. **Cut-offs.** We buffer the transcript and only **commit** after the user is
   silent for `COMMIT_SILENCE_MS`. Long thoughts with natural pauses stay ONE
   message. The on-device recognizer auto-restarts across its own short
   finalisations so a pause never ends the turn early.
2. **Duplicated words.** Engines emit *cumulative* transcripts. The agent
   **replaces** its buffer from the latest full transcript — it never appends
   deltas. After committing, the recognizer is stopped/reset so finalised words
   aren’t re-read.
3. **Hearing itself.** In `THINKING` and `SPEAKING` the STT engine is *stopped*,
   not merely ignored — the agent cannot transcribe its own TTS or be triggered
   by it.
4. **Stuck “muted” guard.** Mobile TTS `onDone` events are unreliable. Every
   `speak()` arms a **time-based fallback** (`TTS_GUARD_BASE_MS +
   length·TTS_GUARD_PER_CHAR_MS`, clamped to `TTS_GUARD_MAX_MS`). The guard can
   never get stuck even if the “done” event is dropped. A monotonically
   increasing `speakToken` invalidates stale callbacks.
5. **Sleeping mid-conversation.** The inactivity timer (`SLEEP_TIMEOUT_MS`) only
   runs while `AWAKE`, and is reset on every new transcript. It never counts
   time spent thinking or speaking, so a 5-minute back-and-forth keeps listening.

## Tuning constants

All in [`src/voice/constants.ts`](src/voice/constants.ts):

| Constant | Default | Meaning |
| --- | --- | --- |
| `COMMIT_SILENCE_MS` | `1700` | Pause before an utterance is committed. Raise for slower speakers, lower for snappier turns. |
| `POST_SPEAK_DELAY_MS` | `700` | Quiet gap after TTS before re-opening the mic (avoids capturing the audio tail/echo). |
| `SLEEP_TIMEOUT_MS` | `45000` | Idle time in AWAKE before returning to ARMED. |
| `TTS_GUARD_BASE_MS` | `1200` | Base of the time-based TTS guard. |
| `TTS_GUARD_PER_CHAR_MS` | `70` | Added per character (~14 chars/sec at rate 1.0). |
| `TTS_GUARD_MAX_MS` | `30000` | Hard ceiling on the guard. |
| `MIN_COMMIT_CHARS` | `2` | Below this, a commit is treated as noise and ignored. |
| `WAKE_WORDS` | see file | Accepted wake phrases + common mishearings. |
| `WAKE_ACK` | `"Yes?"` | Spoken acknowledgement on wake. |

## Wake words

Accepted: **Hi, Hey, Hello, Yo, Hi there, Hey there, Hi Orch, Hey Orch, Orch**,
plus mishearings **orchie, orchid, orca, arch, orc**. Matching is in
[`src/voice/wake/match.ts`](src/voice/wake/match.ts).

If the wake phrase carries a trailing **command** (“hi, plan my day”) it is
executed immediately. If it’s just filler (“hi there”) the agent says “Yes?” and
waits.

### Two wake detectors (swappable)

- **`KeywordWake`** (default) — software detector using the shared STT engine.
  Accepts the full wake-word set including a bare “Hi”. No Picovoice key needed.
  Robust foreground always-listening.
- **`PorcupineWake`** — low-power, always-on detection via Picovoice Porcupine.
  Ship a custom **“Hi Orch”** `.ppn` model (from the Picovoice console) in
  `assets/wake/` and point `keywordPaths` at it. With no custom model it falls
  back to a built-in keyword for testing. Selected automatically when a
  Picovoice access key is configured (toggle in Settings → Wake-word detection).

## Swapping engines

Everything sits behind interfaces in [`src/voice/types.ts`](src/voice/types.ts):

- **STT**: `OnDeviceStt` (`@react-native-voice/voice`, default) or `DeepgramStt`
  (streaming WebSocket; needs a PCM source + a short-lived token from the
  `stt-token` edge function). Pick via `EXPO_PUBLIC_STT_ENGINE`.
- **TTS**: `ExpoTts` (`expo-speech`). Picks a natural en-US voice and **strips
  markdown** before speaking (see [`src/utils/markdown.ts`](src/utils/markdown.ts)).
- **Wake**: `KeywordWake` / `PorcupineWake` as above.

To add an engine, implement the interface and register it in the matching
`index.ts` factory — the agent doesn’t change.

## Manual control (mic tap)

The floating mic adapts to state: **OFF→enable**, **ARMED→wake**, **AWAKE→sleep**,
**SPEAKING→barge-in/interrupt**. See `pressVoiceMic()` in
[`src/voice/useVoiceAgent.ts`](src/voice/useVoiceAgent.ts).
