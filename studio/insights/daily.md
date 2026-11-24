# Daily run settings

Read by /reel-daily on every scheduled run. Change these lines to change the run.

- **Schedule:** Mon, Wed, Fri; run starts 07:31 IST, finished reel delivered around 09:00 IST
- **Mode:** auto       (auto = the system makes everything; half-auto = script first, you record, then video)
- **Language:** en
- **Length:** 30-45 s for explainers and B-roll (80-110 words); story formats (F1, F2) may run 50-75 s, like the references
- **Voice:** ElevenLabs by DEFAULT (user, 2026-11-24: "ElevenLabs is better, make it default"). The key is a network secret held by the session's proxy; `vo.py` detects it and maps each brief voice to an ElevenLabs stock voice (Emma -> Sarah narrator, Connor -> Bill elder, Andrew -> Eric, Ava -> Matilda, Brian -> Brian, Ryan -> George, Sonia -> Lily; override per speaker with `elevenlabs_voice` in cast.json). Account: Creator plan (commercial use), ~130k characters/month; a reel uses ~1k. If credits would run out, the run falls back to free edge-tts and says so. Say in each delivery which voice engine was used
- **Face:** none. Faceless characters, a mascot, screens and drawings only
- **Style:** rotate formats and styles per `formats-lab.md`, studied from `references.md`; surprise the user, never repeat the last run's look
- **Topics:** AI in healthcare, doctor workflows, patient care between visits, DocX/Treint where relevant
- **CTA:** none. End on the insight. No product tag or slogan at the end, no "follow for more"; DocX appears only when the story is genuinely about it
- **Tone:** a calm colleague explaining, never an advert
- **Never:** individual medical advice, drug dosing, named patients, unverified claims, politics
