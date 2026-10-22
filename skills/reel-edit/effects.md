# Effects catalog (plan.json)

```json
{
  "captions": { "style": "pop", "emphasis": ["65", "scribe"], "scenes": ["S1", "S2", "S3"] },
  "zooms": [ { "at": "S2:don't", "scale": 1.3, "hold": 18 } ],
  "overlays": [
    { "type": "lowerThird", "at": "S1:here's", "name": "Dr. Sheikhislam Sakhi", "title": "Neurosurgeon · Founder, Treint" },
    { "type": "callout", "at": "S1:truth", "kicker": "MYTH", "text": "AI scribes save time" },
    { "type": "slam", "at": "S2:don't", "text": "Wrong" },
    { "type": "flash", "at": "S2:don't" },
    { "type": "stat", "at": "S3:65", "to": 65, "suffix": "%", "label": "felt less burned out", "source": "JAMA 2025" },
    { "type": "image", "at": "S3:look", "src": "assets/my-reel/dashboard.png", "device": "card" },
    { "type": "arrow", "at": "S3:here", "x": 700, "y": 900, "from": "left", "label": "this one" },
    { "type": "burst", "at": "S3:free", "x": 540, "y": 520 },
    { "type": "cta", "at": "S4:comment", "keyword": "SCRIBE", "promise": "the full study" }
  ],
  "progress": true,
  "sfx": true,
  "cover": "S1:scribes"
}
```

## Moments (`at`)

| Form | Means |
|---|---|
| `"S2:three"` | the first time "three" is spoken in scene S2 (case and punctuation ignored; `65%` matches `"65"`) |
| `"S2:three#1"` | the second time |
| `"S2:start"` / `"S2:end"` | the scene's first frame / where its speech ends |
| `"12.5s"` | 12.5 seconds into the edited video |
| `240` | frame 240 (30 fps) |

## Overlays

| type | Use for | Fields (default hold in frames) |
|---|---|---|
| `lowerThird` | introducing the speaker or a guest; the credential is the hook's proof | `name`, `title` (100) |
| `callout` | a claim, step or label next to the face | `text`, `kicker`, `side` left/right, `y` (75) |
| `slam` | the one word that matters; max 2 per video | `text`, `y` (30) |
| `flash` | a hard beat, paired with slam or a cut | (8) |
| `stat` | any number, counting up; source required | `to`, `from`, `prefix`, `suffix`, `label`, `source` (80) |
| `image` | a screenshot or result the user supplied | `src` (under public/), `device` card/phone/browser, `caption`, `url` (90) |
| `arrow` | pointing at something in frame | `x`, `y` (px on 1080x1920), `from` left/right/top, `label` (60) |
| `burst` | a small celebration on a win | `x`, `y` (24) |
| `cta` | the end card, stays to the end; captions stop here | `keyword`, `promise` |

Every overlay takes `hold` to change how long it stays.

## Other keys

- `zooms`: punch-in on a word: `scale` (1.15 subtle, 1.3 strong), `hold` frames. Cuts already alternate between wide and a 12% zoom.
- `captions.style`: `pop` (1-3 big words, spoken word on an accent box), `pill` (sentence captions on a pill), `none`.
- `captions.emphasis`: words always underlined in the accent colour.
- `progress`: thin progress bar at the top.
- `sfx`: automatic quiet sounds per overlay (whoosh, thud, click, pop, ding); `false` turns them off.
- `cover`: the moment used for `out/<slug>-cover.jpg`.

## Layout

On the 1080x1920 frame: chrome and progress at y≈210, callouts y≈330, the face centred near y≈760, lower third y≈1080, captions y≈1250, platform UI below y≈1500 and right of x≈940. Don't put widgets on the face for more than ~3 s.
