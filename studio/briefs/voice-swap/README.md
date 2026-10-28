# voice-swap (one-off, 2026-10-28)

The user's 5-minute AI-narrated explainer, re-voiced in the user's own voice at their request, for this video only.

1. Demucs (htdemucs, two stems) split the AI narration from the ambient music.
2. kNN-VC (MIT, github.com/bshall/knn-vc) converted the narration to the user's timbre, using 87 s of the user's speech from nvidia-journey-s1e2 as the reference. Timing is unchanged.
3. Voice sped up 1.2x (pitch preserved); picture sped up 1.2x; music kept at its original tempo, cut to the new length with a 4 s fade.
4. Mixed with the music about 7 dB under the voice, loudness -14 LUFS, peak -1.3 dBFS.

`words.json` is the original narration transcript; `check.json` is the converted voice re-transcribed (98% of words match). Audio and video files are not committed (public repo, the user's voice).
