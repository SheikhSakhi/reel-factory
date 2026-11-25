# Treatment Intelligence: "weaponized preparation" (NVIDIA-style narrated edit)

- Reference: the user's Drive screen recording of a viral NVIDIA reel (monkeymotions, 56 s): one deep narrator, a cut every ~1 s, real footage (interviews, stage, archive, products, stock), bold condensed word cards on red/white, one centred caption word, hard sound hits.
- Script: the user's own, word for word (vo-take.txt), kept as sent (user, 2026-11-24). Runs ~85-90 s.
- Narrator: ElevenLabs stock voice, deep and confident (audition: Brian vs Adam). The founder's quote ("We saw a completely different kind of healthtech...") plays over the user's own footage, voiced with ElevenLabs (stock or a clone of his own voice, his choice); muted original audio; interview-style sound; lower third "Dr. Sheikhislam Sakhi, Founder, Treint". Caption labels AI voice.
- Footage: the user's raw clips (pending), product screen recordings (pending), Pexels stock (key pending), code-built data animations for what doesn't exist.
- Risks raised and accepted by the user: length vs the 56 s original; "the only technology of its kind" (superiority claim); "bring down the death rate" (an aim, not a proven result); the reference's structure belongs to its creator.

## Voice auditions v2 (2026-11-25)
Stock voices rejected by the user. Method: isolated the NVIDIA narrator with demucs, ranked 878 public ElevenLabs library voices by ECAPA speaker embedding, re-read the NVIDIA opening with the top 14, kept the best 4. The original is paced fast (opening = 9.8 s); candidates use ElevenLabs speed 1.2 plus a small time-stretch to match.
Narrator candidates (out/voice-auditions/ti-voice-match-v2.mp3, after the original):
1. Professor H (kJQzNtKOEkJ2Y7ui1GTM)
2. Bradley, Earnest Narrator (RexqLjNzkCjWogguKyff), one of the most used faceless-narration voices
3. Roman Voss (TFmrsRqiMPIeENU66yUi)
4. Grant Whitman (wLoW00IP5kfH8oiOBAPp)
Quote candidates (out/voice-auditions/ti-quote-v2.mp3, after the original Jensen clip):
1. Jerry B (1t1EeRixsJrKbiF1zwM6), interview-room treatment
2. Luke (RNnkVeW25AwKYxZgnHBH), interview-room
3. Kyle Hudson (lbmEtjv1o5fhobC3UKM4), interview-room
4. Jerry B, light phone treatment (no echo)

## Decisions (2026-11-25, round 2)
- Quote: APPROVED = Jerry B (1t1EeRixsJrKbiF1zwM6), light phone treatment, no echo:
  `highpass=f=260,lowpass=f=4800,asoftclip=type=tanh,equalizer=f=1800:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=4` + pink room tone at 0.004.
- Narrator: the user rejected all v2 candidates and wants the exact NVIDIA voice. Scan widened to the whole male English library (~3,400 voices).
- Music: the user wants the same song. Shazam (on the demucs music stem) = "4 Raws" by 8wakeup (3 of 4 windows; the first 12 s matched "Wavy Emotion (slowed)" by LxstOak, probably the intro). The published version should take it from the Instagram audio picker (licensed); a baked-in copy risks muting.
- Full library scan done (~3,400 male English voices, ECAPA vs demucs-isolated narrator). No exact match: best same-text score 0.32 = A-Chan ver.2 (VyTe5Cy1ZXnpHrKVrxwk); library median 0.05, p99 0.18; a same-speaker match would be above 0.5. The NVIDIA voice is likely private or from another TTS tool. Audition: out/voice-auditions/ti-voice-closest.mp3.
- Exhaustive scan (2026-11-25): ~16,200 public ElevenLabs male voices (all languages) + all 23 Microsoft neural English male voices, ECAPA vs the demucs-isolated narrator, as is and pitch/speed-shifted (0.80-1.10). No same-speaker match. Verified best: Zach ×1.25 speed-up 0.39, A-Chan 0.32, Microsoft Andrew 0.16 (same speaker > 0.5). Pitch-shifted-reference highs (0.57) did not survive re-generation (artefact). Conclusion: the NVIDIA narrator is not a public ElevenLabs or Microsoft voice; likely a private clone or another tool (CapCut etc.).
