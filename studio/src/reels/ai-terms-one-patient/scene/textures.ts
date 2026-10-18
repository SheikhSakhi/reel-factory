// Loads the film's image assets once. The 3D canvas mounts only after they are ready, because
// the canvas draws each frame exactly once: a texture arriving later would never be shown.
import { useEffect, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, staticFile } from "remotion";
import { LAYERS } from "../world";

type Tex = { xray: THREE.Texture; feat: THREE.Texture[] };
let loaded: Tex | null = null;
let pending: Promise<Tex> | null = null;

const load = (): Promise<Tex> => {
  pending ??= (async () => {
    const loader = new THREE.TextureLoader();
    const get = async (file: string) => {
      const t = await loader.loadAsync(staticFile(`ai-terms/${file}`));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const [xray, ...feat] = await Promise.all([get("xray.png"), ...LAYERS.map((l) => get(l.tex))]);
    loaded = { xray, feat };
    return loaded;
  })();
  return pending;
};

/** True once textures are loaded; holds the render until then. */
export const useTexturesReady = (): boolean => {
  const [ready, setReady] = useState(loaded !== null);
  const [handle] = useState(() => (loaded ? null : delayRender("loading film textures")));
  useEffect(() => {
    if (ready) return;
    load().then(() => { setReady(true); if (handle !== null) continueRender(handle); });
  }, [ready, handle]);
  return ready;
};

/** Textures for components mounted inside the gated canvas. */
export const useTextures = (): Tex => {
  if (!loaded) throw new Error("textures used before useTexturesReady() resolved");
  return loaded;
};
