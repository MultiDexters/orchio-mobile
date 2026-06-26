# Orchio 🎙️

**An energy-aware daily planner you run almost entirely by voice — hands-free.**

Say “Hi”, talk naturally (commands *or* free-form rants), and Orchio replies out
loud and takes action: logs your energy, plans your day, reads your priorities,
files tasks/notes/goals from a brain-dump, and just *talks* like a real
assistant. Built with React Native (Expo), Supabase, and OpenAI GPT-4o.

> The headline is the **fully automated voice agent** — a turn-based,
> always-listening state machine that never hears itself, never cuts you off,
> never duplicates words, and keeps listening through long conversations. See
> **[VOICE.md](VOICE.md)**.

> 📱 This is the **mobile companion** to the Orchio web app
> ([MultiDexters/orchio](https://github.com/MultiDexters/orchio)). It **reuses
> the same Supabase backend**, so accounts and data are shared across web and
> mobile. Recommended home: a new repo, e.g. `MultiDexters/orchio-mobile`.

---

## ✨ Features

- **Hands-free voice agent** — wake word → speak → spoken reply → keep going.
- **Energy-aware planning** — GPT-4o builds a day plan + morning brief that puts
  hard work where your energy is highest.
- **Brain-dump capture** — ramble, and Orchio extracts tasks, notes, goals and
  feelings, persists them, and confirms.
- **Voice commands** — navigate, log energy, plan/reshuffle, read top three, read
  brief, “stop listening”, “what can you do”.
- **Chat** with per-message **Listen** (TTS, markdown stripped), live-refreshed
  via Supabase Realtime.
- **Calm, minimal UI** — rounded cards, soft shadows, Reanimated/Moti
  transitions, light/dark mode.

## 🧱 Tech stack

React Native + **Expo** (managed) · **TypeScript** · **Expo Router** ·
**Zustand** · **TanStack Query** · **Supabase** (Auth/Postgres/Realtime) ·
**OpenAI GPT-4o** (via Supabase Edge Functions) · **Picovoice Porcupine**
(wake word) · **@react-native-voice/voice** / **Deepgram** (STT) ·
**expo-speech** (TTS) · **expo-av** (audio session) · **NativeWind** ·
**Reanimated + Moti** · **lucide-react-native**.

## 📁 Project structure

```
orchio/
├─ app/                       # Expo Router screens
│  ├─ _layout.tsx             # providers, auth gate, theme, toasts
│  ├─ (auth)/                 # login, signup
│  └─ (app)/                  # today, tasks, chat, energy, settings (+ goals, brief)
├─ src/
│  ├─ voice/                  # ⭐ the voice agent (state machine + swappable engines)
│  ├─ stores/                 # zustand: auth, voice, settings, ui, toast, playback
│  ├─ api/                    # supabase CRUD + edge-function calls
│  ├─ hooks/                  # TanStack Query hooks
│  ├─ components/             # ui kit + voice overlay + domain components
│  ├─ theme/ lib/ utils/ types/
├─ supabase/
│  ├─ functions/                 # chat, plan, tasks, energy, stt-token (additive)
│  ├─ realtime_chat.sql          # one-off: enable Realtime on chat_messages
│  └─ tests/rls_check.sql        # verify cross-user isolation
├─ VOICE.md                   # the voice state machine & tuning constants
└─ .env.example
```

---

## 🚀 Setup

### 0. Prerequisites

- Node 18+ and npm
- An [Expo](https://expo.dev) account + `npm i -g eas-cli`
- The [Supabase CLI](https://supabase.com/docs/guides/cli)
- A **physical device** (or simulator with a dev build). **Expo Go will NOT
  work** — Orchio uses native modules (`@react-native-voice/voice`,
  `@picovoice/porcupine-react-native`). You need a **development build**.

### 1. Install

```bash
npm install
cp .env.example .env   # then fill it in (see below)
```

### 2. Supabase — reuse the existing Orchio backend

The mobile app **shares the same Supabase project as the Orchio web app**, so a
user has one account and one set of data across web + mobile. The schema and RLS
already exist (from the web repo's migrations) — you do **not** run `db push`
here. You only add the edge functions and one Realtime tweak.

1. Link the CLI to the shared project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
2. Deploy the edge functions (additive — the web app doesn't use Supabase
   functions, so nothing collides):
   ```bash
   supabase functions deploy chat plan tasks energy stt-token
   ```
3. Set **edge-function secrets** (server-side only — never in the app):
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   # SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
   # Only if using client-side Deepgram streaming:
   supabase secrets set DEEPGRAM_API_KEY=... DEEPGRAM_PROJECT_ID=...
   ```
4. Enable Realtime on `chat_messages` (the web schema only enables it for
   `plans`). Paste [`supabase/realtime_chat.sql`](supabase/realtime_chat.sql)
   into the Supabase Dashboard → SQL Editor and run it once. It's additive and
   safe.

> Prefer a **standalone** backend instead (mobile data separate from web)? Create
> a fresh Supabase project and create the same tables/enums/RLS — see the web
> repo's `supabase/migrations/001_initial_schema.sql` for the canonical schema.

### 3. App environment (`.env`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
EXPO_PUBLIC_PICOVOICE_ACCESS_KEY=YOUR-PICOVOICE-KEY     # optional but recommended
EXPO_PUBLIC_STT_ENGINE=ondevice                         # ondevice | deepgram
```

Use the **same** `EXPO_PUBLIC_SUPABASE_URL` / anon key as the Orchio web app so
mobile and web share users and data. These `EXPO_PUBLIC_*` values are public
client keys — safe to ship. The OpenAI key and Supabase service role are **only**
ever set as edge-function secrets.

### 4. Picovoice Porcupine (wake word) — optional

Orchio works out of the box with the **software wake detector** (accepts “Hi”,
“Hey”, “Hi Orch”, etc.). For low-power, always-on detection:

1. Create a free access key at [console.picovoice.ai](https://console.picovoice.ai)
   and put it in `EXPO_PUBLIC_PICOVOICE_ACCESS_KEY`.
2. (Optional) Train a custom **“Hi Orch”** wake word, download the `.ppn`, drop it
   in `assets/wake/`, and pass its path to `PorcupineWake` via the wake factory
   (`src/voice/wake/index.ts`). Without a custom model it falls back to a
   built-in keyword for testing.

See **[VOICE.md](VOICE.md)** for how the two detectors are chosen and swapped.

### 5. Deepgram (streaming STT) — optional

The default STT is on-device (`@react-native-voice/voice`). To use Deepgram
streaming instead, set `EXPO_PUBLIC_STT_ENGINE=deepgram` and configure the
`stt-token` function secrets (step 2.4). The app fetches a short-lived token so
the Deepgram key never ships in the bundle. Note: live PCM streaming needs a
native audio source on a dev build — see comments in
[`src/voice/stt/DeepgramStt.ts`](src/voice/stt/DeepgramStt.ts).

---

## 📱 Running on a device (development build)

```bash
# Generate native projects from the managed config
npx expo prebuild

# Run on a connected device / emulator
npx expo run:android      # Android
npx expo run:ios          # iOS (macOS + Xcode)
```

Or build a dev client with EAS and install it, then `npx expo start --dev-client`:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

On first launch, Orchio requests **microphone** permission with a clear
explanation (and degrades gracefully if denied).

## 🏗️ EAS production builds

```bash
eas login
eas build:configure
eas build --profile production --platform android   # .aab
eas build --profile production --platform ios        # .ipa
eas submit  --profile production --platform ios      # optional: App Store
```

Set the same `EXPO_PUBLIC_*` values as EAS environment variables (or use
`eas.json` `env`), and your `eas.json` `projectId`/credentials as usual.

---

## ✅ Acceptance criteria → where it lives

| Criterion | Implementation |
| --- | --- |
| “Hi” wakes within ~1s + audible ack | `KeywordWake`/`PorcupineWake` → `VoiceAgent.onWake` → `WAKE_ACK` |
| Long rant = ONE message, no duplicates | silence-commit + **replace** buffer (`VoiceAgent`, `OnDeviceStt`) |
| Mic records nothing while speaking | STT **stopped** in `THINKING`/`SPEAKING`; time-based guard |
| Never reads markdown aloud | `toSpeech`/`stripMarkdown` before all TTS |
| “I’m feeling low” → log 2/5 + Chat + spoken reply | `intents.ts` `log_energy_feeling` → `VoiceAgent.execute` |
| Non-command speech answered out loud + saved | `chat` intent → `chat` edge function → TTS |
| 5-min convo keeps listening | sleep timer only runs in AWAKE |
| Commands by voice | `intents.ts` + `VoiceAgent.execute` |
| RLS: no cross-user reads | RLS from the shared schema + `supabase/tests/rls_check.sql` |

## 🔐 Security notes

- The OpenAI key and Supabase **service role** live **only** in edge-function
  secrets, never in the app.
- Every table has **Row Level Security**; functions act *as the user* (forward
  the JWT) so RLS is always enforced. Verify with `supabase/tests/rls_check.sql`.

## 🧰 Scripts

```bash
npm run start       # expo start (use --dev-client)
npm run android     # expo run:android
npm run ios         # expo run:ios
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## 🩺 Troubleshooting

- **Voice does nothing / “unavailable”** → you’re in Expo Go. Use a dev build.
- **No sound from TTS on iOS** → the agent toggles the audio session to the
  loud speaker during `SPEAKING`; make sure the device isn’t on silent for media.
- **Wake word not triggering** → check mic permission; the software detector
  needs STT available (dev build). Try the in-app mic tap to wake manually.
- **Edge function 401** → confirm you’re signed in and the function has
  `verify_jwt = true` (it does by default).
