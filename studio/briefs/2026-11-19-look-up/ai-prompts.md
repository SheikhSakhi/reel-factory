# "Look up": AI animated cartoon, shot-by-shot prompts

Concept (same core as the reference, adapted to medicine): a doctor sealed in a windowless cabinet is fed pills by the system and paid a coin for every prescription. The wall falls: outside, his patient lies on a table in a field, wilting, under a painted sign "LOOK UP!". A drop of blood hits his forehead, a coin distracts him, and a robotic arm takes the patient away. Twist: his cabinet stands in the same field, wired to tubes from the sky. He is fed too.

Format: 9:16 vertical, 1080x1920, 54 s, 16 shots, wordless (music + cartoon sound effects).

## How to produce it
1. **Character sheet first.** Generate the DOCTOR and the PATIENT (prompts below) until you have one image of each you like. Use them as the character reference / image reference in every later shot (Midjourney `--cref`, Kling "subject reference", Runway "reference image"). Keep one seed per character.
2. **Stills, then motion.** For each shot, generate the start frame with the STILL prompt (image model), then animate it with the MOTION prompt (image-to-video, 3-5 s, Kling 2.x / Runway Gen-4 / Pika). Keep camera moves small.
3. **Add all words in post, not in the AI.** AI garbles text. Leave the sign, the canister label, the ad and the news blank in the prompts; we overlay "PILLS", "NEW! MAXICOR", "PRESCRIBE", "LOOK UP!", "by DocX" and the news text in Remotion, with the sound effects and music.
4. Cut the clips to the timings below; animate on twos if the tool allows (12 fps feel).

## Style block (paste at the end of every STILL prompt)
`2D hand-drawn cartoon, satirical indie animation, thick uneven black ink outlines with slight line wobble, flat colours, no gradients, no shading except simple flat shadow shapes, clean white background where indoors, bright cyan sky and saturated green grass outdoors, simple rounded shapes, deadpan absurd humour, vertical 9:16 composition, high resolution`

## Negative prompt (every shot)
`3D, CGI, realistic, photorealistic, gradients, soft shading, anime, text, letters, watermark, logo, extra fingers, deformed hands, blurry, noisy background`

## Characters
- **DOCTOR:** `a chubby bald middle-aged man with pale pink skin, a big round soft head, small ears, heavy droopy eyelids, tiny nose, wide mouth, an open white doctor's coat with nothing underneath showing a soft round belly, a grey stethoscope around his neck, bare feet, sitting slumped in a worn dark-green armchair`
- **PATIENT:** `a thin elderly person in a pale blue-grey hospital gown, grey skin, eyes half closed, lying on a metal examination table, very weak, head drooping to one side like a wilting plant`
- **CABINET:** `a small windowless doctor's cabinet with plain white walls, grey metal pipes and a thick yellow cable running along the ceiling, a glass canister full of colourful pills hanging from the ceiling with a grey tube running down to the doctor's mouth, a pink piggy bank on the floor, a dark desktop monitor on a stand facing the doctor`

## Shots

| # | Time | STILL prompt (start frame) | MOTION prompt | Post / sound |
|---|---|---|---|---|
| 1 | 0.0-3.0 | Wide shot of the CABINET from a slight angle. The DOCTOR slumped in the armchair, the pill tube in his mouth, eyes half closed, the piggy bank beside the chair, the monitor in front of him seen from the back. | The doctor chews slowly with a bored face, pills slide down the tube into his mouth, he blinks once. Static camera. | Label "PILLS" on the canister. Music starts; soft chewing. |
| 2 | 3.0-5.0 | Same wide shot; the DOCTOR suddenly excited, eyes wide, mouth open in a big grin, one fist raised. | He pumps his fist in the air twice, grinning at the screen. | "pop" |
| 3 | 5.0-8.0 | Over-the-shoulder close shot from behind the DOCTOR: the back of his bald head large in the lower left corner, his arm resting on the green armrest, the monitor in the centre showing a bright blank advert with a big green button. | His hand moves to the mouse and clicks; the green button flashes darker. Slight push in. | Overlay on screen: "NEW! MAXICOR®", "PRESCRIBE". "click" |
| 4 | 8.0-9.5 | Close-up of a pink piggy bank on a grey floor, a gold coin in the air above its slot. | The coin drops into the slot, the piggy bank jiggles happily. | "ding" |
| 5 | 9.5-11.0 | Over-the-shoulder shot: from the desk, a thick yellow tube runs up and into the white wall behind the monitor; colourful pills inside the tube. | Pills move along the yellow tube and disappear into the wall. | soft "whoosh" |
| 6 | 11.0-14.0 | Over-the-shoulder shot: the white wall above the monitor with a thin black crack. | The crack spreads across the wall in jagged lines; tiny plaster dust falls. | "tick", "tick" |
| 7 | 14.0-17.0 | Over-the-shoulder shot: a large chunk of the white wall above the monitor broken out like a window, revealing bright cyan sky with white cartoon clouds and a green field. | Wall pieces fall down out of frame; the doctor's head turns slightly toward the opening. | "impact", "thud" |
| 8 | 17.0-21.0 | Wide outdoor shot: green field and cyan sky, the PATIENT on a metal exam table in the middle, the yellow tube from the wall ending in the patient's mouth, a blank wooden signboard on a post above, a grey paint bucket with pink paint dripping down its side next to the table. | The patient's chest barely rises; the head droops slowly, like a wilting plant. Clouds drift. Gentle push in. | Overlay pink brush text "LOOK UP!" on the sign and "by DocX" on the bucket. |
| 9 | 21.0-23.0 | Front close-up of the DOCTOR in the armchair, blank stare, mouth closed, the grey ceiling pipe above his head. | He stares, blinks slowly. | silence for a beat |
| 10 | 23.0-25.0 | Same front close-up; a single red drop of blood falling from above toward his forehead. | The drop hits his forehead with a small red splat; his eyes snap wide open, mouth a small "o". | "blip" |
| 11 | 25.0-27.0 | Same close-up, red splat on his forehead; a gold coin falling from the top left of the frame. | His eyes follow the coin, his hand grabs it, his face turns into a huge grin. | "ding" |
| 12 | 27.0-32.0 | Over-the-shoulder shot: the window in the wall shows the field and the PATIENT on the table; a grey robotic arm with a pink claw entering from the top-left corner of the sky. | The robotic arm descends, grips the exam table and lifts the patient up and out of the window frame. The doctor shakes with laughter, facing his screen. | "rise", then "riser" |
| 13 | 32.0-36.0 | Over-the-shoulder shot: the monitor now shows a cartoon TV news studio, a news anchor on the left and a blank white panel on the right. | The anchor talks; the panel slides in. | Overlay "NEWS", then "DON'T TRUST PATIENTS", then a red X stamp. "pop", "impact" |
| 14 | 36.0-40.0 | Wide shot of the CABINET as in shot 1, the empty window hole behind the monitor, the DOCTOR relaxed again with the pill tube in his mouth, red splat still on his forehead. | He chews contentedly, eyes closing. Very slow zoom out. | chewing |
| 15 | 40.0-48.0 | Exterior wide shot: a huge cyan sky with clouds over a green field; in the middle, a small white box (the cabinet) with many grey tubes and yellow cables coming down into it from the top of the frame. | Slow pull back and up, revealing more sky and more cables; a robotic arm hovers far above the box. | low hum, music swells |
| 16 | 48.0-54.0 | The same sky and field, the box small at the bottom. | Hold; clouds drift. | Overlay pink brush text "LOOK UP!" big in the sky, "by DocX" under it. Fade out. "impact" |

## Notes
- Text: never ask the model for words; every label is overlaid in post (step 3).
- Consistency: if the doctor's face drifts between shots, regenerate with the character reference at higher strength, or reuse shot 1's frame as the start image.
- Authorship: the concept follows Pietro Cascavilla's short; publishing is the owner's decision (see 00-pick.md).
