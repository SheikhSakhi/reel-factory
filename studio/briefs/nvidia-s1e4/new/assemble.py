"""Splice the user's real narration with converted inserts at silence-aligned cut points (see briefs/nvidia-s1e4/README.md)."""
import json, subprocess, wave
import numpy as np
W = 'briefs/nvidia-s1e4'; N = W + '/new'; SR = 44100
CUTS = {'seg1': (0, 57.12), 'seg2': (59.28, 60.89), 'seg3': (61.54, 93.45)}  # from the waveform, not whisper timestamps


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


voc = load(f'{W}/stems/htdemucs/mix/vocals.wav')
mus = load(f'{W}/stems/htdemucs/mix/no_vocals.wav')


def clip(k, pad=0.08):
    a = load(f'{N}/{k}_me.wav')
    w = json.load(open(f'{N}/{k}_check.json'))['words']
    return a[max(0, int((w[0]['start'] - pad) * SR)):int((w[-1]['end'] + pad + 0.05) * SR)]


def rms(x):
    return float(np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2)))


level = rms(voc[int(30 * SR):int(60 * SR)])
A, B, C = [x * (level / rms(x)) for x in (clip('A'), clip('B'), clip('C'))]
sil = lambda s: np.zeros(int(s * SR), np.float32)  # noqa: E731
src = lambda k: voc[int(CUTS[k][0] * SR):int(CUTS[k][1] * SR)]  # noqa: E731
pieces = [('src', src('seg1'), CUTS['seg1'][0]), ('new', np.concatenate([sil(0.12), A, sil(0.2)]), CUTS['seg1'][1]),
          ('src', src('seg2'), CUTS['seg2'][0]), ('new', np.concatenate([sil(0.1), B, sil(0.3)]), CUTS['seg2'][1]),
          ('src', src('seg3'), CUTS['seg3'][0]), ('new', np.concatenate([sil(0.6), C, sil(2.5)]), CUTS['seg3'][1])]
vo = np.concatenate([p[1] for p in pieces])
mix = vo + np.concatenate([mus] * 3)[:len(vo)]
mix = mix / max(1.0, np.max(np.abs(mix)) / 0.95)
with wave.open(f'{N}/voice-new.wav', 'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.stack([mix, mix], 1) * 32767).astype('<i2').tobytes())
t, tl = 0.0, []
for kind, a, s0 in pieces:
    d = len(a) / SR
    tl.append({'kind': kind, 'out': round(t, 3), 'dur': round(d, 3), 'src': s0})
    t += d
json.dump({'total': round(len(vo) / SR, 3), 'pieces': tl}, open(f'{N}/timeline.json', 'w'), indent=1)
print(json.dumps(tl), round(len(vo) / SR, 2))
