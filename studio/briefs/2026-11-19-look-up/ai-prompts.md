# "Look up": AI animated film, shot-by-shot prompts (v2, medical aesthetic)

**Core idea (kept from the reference):** a person sealed inside a system, fed and occupied by it, while the real world outside quietly suffers; one sign says LOOK UP; the twist shows the system holds him too.

**Our version, respectful:** a dedicated doctor works inside a sealed white cabinet. The system keeps him busy: screens, alerts, forms, one patient at a time. Outside the wall, between visits, his patients' health quietly fades. A crack of light; a single drop; the wall opens and he sees them. One drifts away into fog before he can reach. The twist: from above, his room is one of hundreds of identical sealed rooms, every doctor alone with a screen. Then DocX paints LOOK UP, the walls lower, and light lines connect each doctor to his patients' paths.

Nobody is foolish, greedy or ugly. The villain is the system, never the doctor or the patient.

Format: 9:16 vertical, 1080x1920, 54 s, 16 shots, wordless (music + subtle sound design).

## How to produce it
1. **Character references first.** Generate the DOCTOR and the PATIENT until each looks right, then use those images as the character / subject reference in every shot (Midjourney `--cref`, Kling subject reference, Runway reference image). One seed per character.
2. **Stills, then motion.** Start frame from the STILL prompt (image model), then image-to-video with the MOTION prompt, 3-5 s per clip (Kling 2.x, Runway Gen-4, Veo). Slow, smooth camera only.
3. **No words in the AI.** Every label, the screens' text, LOOK UP and "by DocX" are overlaid afterwards in Remotion with the sound and music.
4. Send the clips; we cut to the timings below, grade, add text and sound.

## Style block (end of every STILL prompt)
`premium healthcare brand film, stylized 3D animation with soft matte materials, elegant and understated character design, cinematic soft lighting, gentle volumetric light, shallow depth of field, muted palette of clinical white, warm grey, soft sage and deep teal with one warm amber accent, calm and dignified mood, clean composition, vertical 9:16, high detail`

## Negative prompt (every shot)
`cartoon caricature, exaggerated features, fat, ugly, grotesque, comedic, blood, gore, money, coins, text, letters, logo, watermark, harsh neon, oversaturated, horror, dirty, messy, extra fingers, deformed hands, distorted face`

## Characters
- **DOCTOR:** `a focused doctor in his late thirties, neat short dark hair, kind tired eyes, clean white coat over a light blue shirt, stethoscope around the neck, upright posture, dignified and competent, quietly overwhelmed`
- **PATIENT:** `a dignified elderly woman in her seventies, silver hair, soft cardigan over a pale hospital gown, gentle face, frail but calm`
- **CABINET:** `a minimalist white doctor's office with no windows, soft seamless walls, one desk with a large monitor, a neat stack of patient folders, a single door, cool even light from the ceiling, sterile and quiet`

## Shots

| # | Time | STILL prompt (start frame) | MOTION prompt | Post / sound |
|---|---|---|---|---|
| 1 | 0.0-3.0 | Wide symmetrical shot of the CABINET; the DOCTOR at the desk in soft cool light, the monitor glowing, the door to his left. Sealed, quiet, beautiful and slightly lonely. | Very slow push in; he types, the monitor light flickers softly on his face. | Low ambient tone; soft keyboard taps. |
| 2 | 3.0-5.5 | Close-up of the monitor: a clean medical interface full of small notification badges and a queue of patient cards. | Notification badges multiply one by one; the queue scrolls. | Overlay on screen: "Inbox 214", "Next patient 09:15". Soft notification pings, layered. |
| 3 | 5.5-8.0 | Medium shot: the door opens, a patient silhouette walks in, sits, and the light changes to warm for a moment. | Time-lapse: patients enter and leave one by one, each visit a short warm glow, then cool again. | Overlay a small clock "15 min" ticking. Door sounds, soft. |
| 4 | 8.0-10.0 | Close-up of the DOCTOR's hands signing a prescription and placing it on a neat growing stack. | He signs, the stack rises slightly; his hand pauses, tired. | Pen on paper. |
| 5 | 10.0-12.0 | Over-the-shoulder shot behind the DOCTOR: the monitor in front, the smooth white wall above it. | A hairline crack of warm light appears in the wall above the monitor. He doesn't notice, eyes on the screen. | A faint high tone. |
| 6 | 12.0-14.0 | Close-up of the desk: a single clear drop of water falling from above toward a patient folder. | The drop lands on the folder in slow motion and spreads; the folder's name tag softly blurs. | One clean droplet sound, silence after. |
| 7 | 14.0-16.5 | Close-up of the DOCTOR's face, lit by the screen; a thin line of warm light falls across his eyes. | He slowly looks up from the screen toward the light; his expression changes from routine to attention. | Music enters, one soft piano note. |
| 8 | 16.5-20.0 | Over-the-shoulder shot: the wall above the monitor gently dissolves into floating fragments of light, revealing a misty landscape at golden hour. | The wall pieces float away like paper in slow motion, light pours into the room. | Soft rising swell. |
| 9 | 20.0-24.0 | Wide landscape at golden hour, soft fog: the PATIENT sitting on a simple bench in a quiet meadow, a small potted plant on her lap, its leaves drooping. Other figures, small and far away, sit on benches across the meadow, each alone. | The plant's leaves droop a little more; her shoulders sink with a slow breath. Gentle push in. | Wind, very soft. Overlay small label "between visits". |
| 10 | 24.0-27.0 | Close-up of the PATIENT holding the plant, looking toward the camera with quiet hope. | She looks up toward the light; a faint smile, tired eyes. | Single sustained note. |
| 11 | 27.0-30.0 | Over-the-shoulder shot: the DOCTOR rising from his chair toward the opening; on the monitor a new alert pulls light back toward the screen. | He hesitates between the screen and the opening; the screen brightens and calls him back. | Ping, ping. Overlay "New message (98)". |
| 12 | 30.0-34.0 | Wide landscape: fog thickening around the PATIENT's bench. | The fog slowly rolls in and the bench softly fades into it while the doctor's room light stays behind; not dramatic, just quietly gone. | Wind rises then falls. No music for one beat. |
| 13 | 34.0-38.0 | High aerial shot: the doctor's white room seen from above, a glowing rectangle in the fog. | Slow rise upward: the camera reveals dozens, then hundreds of identical white rooms in a grid, each with one doctor at one glowing screen, all sealed. | Deep ambient hum. This is the twist. |
| 14 | 38.0-42.0 | Close aerial: on the roof of one room, a paint bucket and a wide brush resting at the edge, fresh paint across the roof. | The brush finishes a stroke of paint on the roof. | Overlay painted "LOOK UP" on the roof, the bucket labeled "by DocX". Brush sound. |
| 15 | 42.0-48.0 | Aerial wide at sunrise: the grid of white rooms. | The walls of the rooms slowly lower like opening flowers; thin golden threads of light extend from each doctor to the patients on benches across the meadow, connecting them; plants lift their leaves. | Music resolves, warm. |
| 16 | 48.0-54.0 | The DOCTOR standing in the open meadow at sunrise, one hand on the PATIENT's shoulder, both looking at the same horizon; her plant green again. | Slow pull back; light grows warmer. | Overlay "LOOK UP" and "by DocX", fade out. |

## Notes
- The story's charge comes from the system, not from the people: the doctor is diligent, the patient is dignified, the fog is the gap between visits.
- If a face changes between shots, regenerate with a higher character-reference weight or reuse the previous clip's last frame as the next start image.
- The concept's core follows Pietro Cascavilla's short (a sealed person, LOOK UP, the twist from above); everything specific is ours.
