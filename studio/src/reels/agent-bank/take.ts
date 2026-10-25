import ruJson from "../../../public/vo/agent-bank/take.json";
import enJson from "../../../public/vo/agent-bank-en/take.json";
import enFastJson from "../../../public/vo/agent-bank-en-fast/take.json";
import { loadTake, type VoTake, type VoWord } from "../../kit";
import enAnchors from "./anchors-en.json";
import { EN_TEXT, type Lang } from "./lang";

const isLetterI = (token: string): boolean => /^И\.?$/.test(token);

/**
 * Caption tokens as they should read on screen. The Russian script spells "ИИ" as
 * "И И" / "И. И." so the voice says both letters, and the English script spells
 * "Treint" as "Tre-int" for the same reason; captions show the real spelling.
 */
export const captionTake = (take: VoTake): VoTake => ({
  ...take,
  scenes: take.scenes.map((s) => {
    const words: VoWord[] = [];
    s.words.forEach((w, i) => {
      const prev = s.words[i - 1];
      if (prev && isLetterI(prev.token) && /^И\.?(-.*)?$/.test(w.token) && words.length > 0) {
        const last = words[words.length - 1];
        words[words.length - 1] = { token: `ИИ${w.token.replace(/^И\.?/, "")}`, frame: last.frame, endFrame: w.endFrame };
        return;
      }
      words.push({ ...w, token: w.token.replace(/^Tre-int/, "Treint") });
    });
    return { ...s, words };
  }),
});

const RU_TAKE = loadTake(ruJson);
const EN_TAKE = loadTake(enJson);

export const LANG_RU: Lang = {
  id: "ru", take: RU_TAKE, captions: captionTake(RU_TAKE), music: "audio/agent-bank/music.wav",
  keepTogether: ["пяти миллиардов долларов", "пяти триллионов долларов"],
};

export const LANG_EN: Lang = {
  id: "en", take: EN_TAKE, captions: captionTake(EN_TAKE), music: "audio/agent-bank-en/music.wav",
  anchors: enAnchors as unknown as Record<string, readonly [string, number]>, text: EN_TEXT,
  keepTogether: ["$5 billion", "$8 billion", "$5 trillion"],
};

/** English at 1.2x speech (pitch kept); animation, captions, SFX and score retime to it. */
export const LANG_EN_FAST: Lang = { ...LANG_EN, take: loadTake(enFastJson), captions: captionTake(loadTake(enFastJson)), music: "audio/agent-bank-en-fast/music.wav" };
