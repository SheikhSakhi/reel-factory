"""Convert a narration track to the user's voice with kNN-VC (MIT), chunked at pauses.

usage: convert.py <repo_dir> <source_vocals.wav> <reference.wav> <out.wav>
"""
import sys

import numpy as np
import soundfile as sf
import torch
import torchaudio

repo, src_path, ref_path, out_path = sys.argv[1:5]
SR = 16000
torch.set_num_threads(4)

knn_vc = torch.hub.load(repo, "knn_vc", source="local", prematched=True, pretrained=True, device="cpu", trust_repo=True)


def load16(path: str) -> torch.Tensor:
    wav, sr = torchaudio.load(path)
    wav = wav.mean(0, keepdim=True)
    if sr != SR:
        wav = torchaudio.functional.resample(wav, sr, SR)
    return wav


ref = load16(ref_path)
with torch.inference_mode():
    # The matching set: WavLM features of every frame of the user's speech, in 20 s pieces.
    feats = [knn_vc.get_features(ref[:, i:i + SR * 20]) for i in range(0, ref.shape[1], SR * 20)]
    matching = torch.cat(feats, dim=0)
print("matching set frames:", matching.shape[0], flush=True)

src = load16(src_path)[0].numpy()
# Chunk at quiet points near every 18 s so no word is cut.
frame = int(0.02 * SR)
energy = np.array([np.sqrt(np.mean(src[i:i + frame] ** 2)) for i in range(0, len(src) - frame, frame)])
cuts, pos = [0], 0
while pos + 18 * SR < len(src):
    lo, hi = (pos + 15 * SR) // frame, min(len(energy), (pos + 21 * SR) // frame)
    k = lo + int(np.argmin(energy[lo:hi]))
    pos = k * frame
    cuts.append(pos)
cuts.append(len(src))

out = []
with torch.inference_mode():
    for a, b in zip(cuts, cuts[1:]):
        piece = torch.from_numpy(src[a:b]).float()[None]
        if np.sqrt(np.mean(src[a:b] ** 2)) < 1e-4:
            out.append(np.zeros(b - a, dtype=np.float32))
            continue
        q = knn_vc.get_features(piece)
        y = knn_vc.match(q, matching, topk=4).cpu().numpy()
        y = np.pad(y, (0, max(0, (b - a) - len(y))))[: b - a]  # keep timing exactly
        out.append(y.astype(np.float32))
        print(f"converted {a / SR:6.1f}-{b / SR:6.1f}s", flush=True)
sf.write(out_path, np.concatenate(out), SR)
print("wrote", out_path)
