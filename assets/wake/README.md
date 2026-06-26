# Custom wake word (Picovoice Porcupine)

Drop your trained **“Hi Orch”** keyword model here:

- `Hi-Orch_en_android.ppn` (Android)
- `Hi-Orch_en_ios.ppn` (iOS)

Train it for free at https://console.picovoice.ai → Porcupine → create a custom
wake word, then download the `.ppn` for each platform.

Wire the paths in [`src/voice/wake/index.ts`](../../src/voice/wake/index.ts) by
passing `keywordPaths` to `PorcupineWake`. Without a custom model, Porcupine
falls back to a built-in keyword and the software `KeywordWake` still accepts
“Hi”, “Hey”, “Hi Orch”, etc. (see [VOICE.md](../../VOICE.md)).
