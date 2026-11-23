# Daily run settings

Read by /reel-daily on every scheduled run. Change these lines to change the run.

- **Schedule:** Mon, Wed, Fri; run starts 07:31 IST, finished reel delivered around 09:00 IST
- **Mode:** auto       (auto = the system makes everything; half-auto = script first, you record, then video)
- **Language:** en
- **Length:** 30-45 s for explainers and B-roll (80-110 words); story formats (F1, F2) may run 50-75 s, like the references
- **Voice:** ElevenLabs is connected (key held by the session's proxy as a network secret; `vo.py` detects it). Narrator reels: write `[S1] NARRATOR: ...` and set `elevenlabs_voice` in cast.json; dialogue: one ElevenLabs voice per speaker. Default picks: narrator Sarah `EXAVITQu4vr4xnSDxMaL` (mature, reassuring), wise elder Bill `pqHfZKP75CvOlQylNhV4`, storyteller George `JBFqnCBsd6RMkjVDRZzb`, calm male Brian `nPczCjzI2devNBz1zQrb`, educator Alice `Xb7hH8MSUJpSbSDYk0k2`. Account is FREE tier (10,000 characters/month, non-commercial): about 10 reels a month; a paid plan is needed before posting for Treint. Falls back to free edge-tts when no key
- **Face:** none. Faceless characters, a mascot, screens and drawings only
- **Style:** rotate formats and styles per `formats-lab.md`, studied from `references.md`; surprise the user, never repeat the last run's look
- **Topics:** AI in healthcare, doctor workflows, patient care between visits, DocX/Treint where relevant
- **CTA:** none. End on the insight. No product tag or slogan at the end, no "follow for more"; DocX appears only when the story is genuinely about it
- **Tone:** a calm colleague explaining, never an advert
- **Never:** individual medical advice, drug dosing, named patients, unverified claims, politics
