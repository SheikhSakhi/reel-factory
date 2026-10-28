import type { Panels } from "../kit";
import { panels as docxSplit } from "./docx-split/Panels";
import { panels as nvidiaS1e2 } from "./nvidia-journey-s1e2/Panels";

// Explainer panels per edit slug: the animator adds one import + one line per video that has them,
// e.g.  import { panels as myReel } from "./my-reel/Panels";   ...   "my-reel": myReel,
export const PANELS: Readonly<Record<string, Panels>> = {
  "docx-split": docxSplit,
  "nvidia-journey-s1e2": nvidiaS1e2,
};
