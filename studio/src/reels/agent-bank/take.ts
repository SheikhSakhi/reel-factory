import takeJson from "../../../public/vo/agent-bank/take.json";
import { loadTake, wordFrame, type VoScene, type VoTake, type VoWord } from "../../kit";

export const TAKE = loadTake(takeJson);

/** Local (scene-relative) frame of the n-th spoken occurrence of a word. */
export const localAt = (s: VoScene) => (token: string, occurrence = 0): number => wordFrame(TAKE, s.id, token, occurrence) - s.from;

const isLetterI = (token: string): boolean => /^И\.?$/.test(token);

/**
 * The script spells "ИИ" as "И И" / "И. И." so the TTS voice says both letters.
 * For captions, glue those pairs back into "ИИ".
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
      words.push(w);
    });
    return { ...s, words };
  }),
});
