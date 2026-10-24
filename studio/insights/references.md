# Reference reels

The user's chosen references (2026-10-24). Every run reads this with `formats-lab.md`. Copy the **structure, pacing and devices**, never their words, characters, footage or music.

Measured by downloading each reel and watching it at 1-4 fps (shot lengths from ffmpeg scene detection).

## 1. Live story / B-roll

| Reel | Account | Length | Shots | Likes |
|---|---|---|---|---|
| [DdEUPcWR_EB](https://www.instagram.com/reel/DdEUPcWR_EB/) | Adema Rakhmetova (RU travel vlog) | 138 s | ~69 cuts | 54.8k |
| [DaQ1N0kS-cF](https://www.instagram.com/reel/DaQ1N0kS-cF/) | farza ("is my startup trash?") | 122 s | ~67 cuts | 11.3k |
| [DaTqyUtB-7I](https://www.instagram.com/reel/DaTqyUtB-7I/) | farza ("i can't take it anymore chat") | 86 s | ~62 cuts | 19.2k |
| [DdH5CY8SqSh](https://www.instagram.com/reel/DdH5CY8SqSh/) | farza ("i wanna show you something", 16:9) | 43 s | ~49 cuts | 1.7k |

What they do:
- **A cut every 1-2 s.** The narration is one continuous voice; the picture changes under it constantly: the narrator, the screen, a meme, a chart, a location.
- **Every line has a literal picture.** "I open Instagram" = a phone opening Instagram. "Passive income" = a guy on a beach chair. The B-roll illustrates the exact word, often humorously.
- **Screen as proof.** Real product UI, analytics (29,025 → 531,416), tweets and DMs fill a third of the shots.
- **Pattern breaks.** Background swaps (green screen to Windows XP hill, Matrix rain, game-show stage), a sudden close-up, a meme, a zoom-blur montage of 100 faces ("everyone in their...").
- **Small white captions**, lower third, sentence case, no boxes. They don't compete with the picture.
- **Honest, personal first-person voice** with a real problem ("is my startup trash?") and a live update. It ends on a soft CTA ("comment help", "try it free").
- Adema: a cinematic travel diary, warm grade, the narrator's inner monologue over long scenic shots; it ends on "to be continued" (a series).

Without a face, the transferable parts are: continuous narration, a literal picture for every line, screens as proof, a pattern break every 5-8 s, small captions, a series ending.

## 2. Interaction, hook, narration, dialogues (character series)

| Reel | Account | Length | Shots | Likes |
|---|---|---|---|---|
| [De01PWIIU_X](https://www.instagram.com/reel/De01PWIIU_X/) | Yaroslav Andreev, "Series 8: Animation in Claude" | 61 s | ~16 | 91 |
| [De1QiQvoJ89](https://www.instagram.com/reel/De1QiQvoJ89/) | same, "Series 9: PHP vulnerability" | 70 s | ~19 | 222 |
| [De12TCLosaz](https://www.instagram.com/reel/De12TCLosaz/) | same, "Series 10: AI invented the sources" | 70 s | ~25 | 1.0k |

What they do:
- **A recurring cast**: a young guy in a cap, and "Klod", an orange cube with two black eyes (an AI assistant made physical). Guest characters per episode (an old professor). The look is stylised 3D (game engine or AI video).
- **A sitcom scene, not a lecture.** Two characters talk in a room: the guy asks Klod for something lazy ("make 20 sources, solid ones"), Klod does it badly or literally, a third character catches it. The lesson comes out of the conflict.
- **The lesson as a prop**: a card ("How to ask for sources: ...") inside the scene, and real screens (a browser, a chat) shown on a laptop.
- **Series chrome**: "SERIES 10" + the topic on a red label at the start.
- **Word-chip captions**: bold serif words, each on its own blue or red box, the speaker's colour tells who talks.
- Shots 2-4 s; camera moves between the two speakers; a punchline at the end ("we are on PHP?" / "don't touch it").
- **Caution:** these three have the lowest numbers of all your references (91 to 1.0k likes). The format is clever, but the evidence that it reaches people is weak so far.

## 3. Meaning, narration, dialogues (parable)

| Reel | Account | Length | Shots | Likes |
|---|---|---|---|---|
| [Ddoum1KNWf8](https://www.instagram.com/reel/Ddoum1KNWf8/) | Garib, "Ne svoy" (faceless character) | 68 s | ~18 | 9.4k |
| [DePSUDsNciv](https://www.instagram.com/reel/DePSUDsNciv/) | same | 77 s | ~24 | **282.6k** |

What they do:
- **One recurring faceless character** (pink bucket hat, beard, pink tee, teal trousers) who is the wise one, plus a guest who has the problem. Faces are blank on purpose: anyone can be the guest.
- **Painterly, sunlit, cinematic stills** with small motion (a hand enters, a fork cuts the cake). AI-generated images animated with an image-to-video model; not code.
- **A parable in 60-75 s**: a concrete situation (a convert burning out at a café; a man chasing a $100 bill into an open grave), a dialogue, then one quote that reframes it, then a resolution shot (the two walk away together).
- **The hook is a visual question**: a $100 bill falls into a grave. Title card "Money led him the wrong way" over a black frame.
- **A metaphor object carries the meaning**: the cake (eat it slice by slice), the grave.
- **Camera grammar of a film**: wide establishing, over-the-shoulder for each line, insert close-ups of hands and objects, a top-down shot, a final wide.
- Captions: plain white sans, 1-3 words, centre; key lines BIG in condensed caps ("WHO IS YOUR LORD?").
- 2-4 s shots; slow, warm pacing; the voice acting is natural dialogue between two people.
- This is the strongest evidence in the set: 282k likes on one episode.

## What this means for us (faceless, no user voice)

| Device | Can code (Remotion) do it? |
|---|---|
| A recurring mascot like Klod (geometric) | Yes: a 3D mascot in three.js inside Remotion, lit, with camera moves |
| Faceless human characters, painterly (Garib) | Only roughly: flat vector people in SVG. The real look needs an image model (stills) plus code motion |
| B-roll montage | Yes for screens, charts, UI, typography, icons; real-world footage needs a stock library (Pexels, free key) |
| Word-chip captions, series chrome, prop cards, screens on a laptop | Yes, fully |
| Dialogue voices | Synthetic: two edge-tts voices (free) or ElevenLabs stock voices (better, paid). The weakest link without the user's voice |

## How the scripts work (from the transcripts)

**The first line drops you into the middle of a scene.** None of them opens with a topic or a greeting:
- Parable: "STOP! Quiet, look under your feet." / "I accepted Islam a month ago, and it's so hard."
- Klod: "Did you write his reference list? Of twenty books, ONE exists. Wikipedia!" (the consequence first, then the flashback)
- Klod: "A studio quoted me 100k for an ad like this, and you did it for free?"
- B-roll: "Every goddamn day I open Instagram and every day I grow more confused." / "It has been nine weeks since I launched my idea."

**Dialogue shape (parable and sitcom), 60-75 s, 25-40 short lines:**
1. Conflict or consequence in line 1 (0-3 s).
2. Flashback or setup: who wanted what (3-15 s).
3. The mistake played out, with one comic or shocking beat (15-35 s).
4. The reframe: one quotable line (a hadith or Quran verse; "looking right doesn't mean it exists") (35-50 s).
5. The practical rule as a prop card or a direct instruction ("ask only for sources with a link, and open each one") (50-60 s).
6. Callback punchline to line 1 ("You said the whole cake was mine." "You turned it down.") (last 3 s).

Lines are short (2-8 words), spoken by alternating voices, with almost no narration. The lesson is never announced; a character discovers it.

**B-roll monologue shape:** a confession or tension line → personal stakes and numbers (9 weeks, 15M views) → the honest twist ("I thought this idea was dumb") → the question for the audience → an update or CTA. It's spoken quickly and informally, like talking to a friend.
