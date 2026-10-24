# Daily run settings

Read by /reel-daily on every scheduled run. Change these lines to change the run.

- **Schedule:** Mon, Wed, Fri; run starts 07:31 IST, finished reel delivered around 09:00 IST
- **Mode:** auto       (auto = the system makes everything; half-auto = script first, you record, then video)
- **Language:** en
- **Length:** 30-45 s for explainers and B-roll (80-110 words); story formats (F1, F2) may run 50-75 s, like the references
- **Voice:** synthetic (ElevenLabs if a key is set, else edge-tts); 2 distinct voices for dialogue formats. On request after delivery ("make it with my voice"): send the script, the user records, re-make with `vo.py --audio`
- **Face:** none. Faceless characters, a mascot, screens and drawings only
- **Style:** rotate formats and styles per `formats-lab.md`, studied from `references.md`; surprise the user, never repeat the last run's look
- **Topics:** AI in healthcare, doctor workflows, patient care between visits, DocX/Treint where relevant
- **Never:** individual medical advice, drug dosing, named patients, unverified claims, politics
