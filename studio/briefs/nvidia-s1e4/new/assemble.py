"""Splice the user's real narration with converted inserts at silence-aligned cut points (see briefs/nvidia-s1e4/README.md)."""
import json, subprocess, wave
import numpy as np
W = 'briefs/nvidia-s1e4'; N = W + '/new'; SR = 44100
CUTS = {'seg1': (0, 57.12), 'seg3': (61.54, 93.45)}  # from the waveform, not whisper timestamps


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


def fade(x, ms=14):
    n = int(SR * ms / 1000)
    x = x.copy(); r = np.linspace(0, 1, n, dtype=np.float32)
    x[:n] *= r; x[-n:] *= r[::-1]
    return x


def span(k, t0, t1):
    a = load(f'{N}/{k}_me.wav')
    return a[int(t0 * SR):int(t1 * SR)]


# The attention example as one voice: the clean take of the sentence (from line C, where it converted well: line A
# lost "and" and blurred "at night"), the creator's own "Attention links it to" passed through the same converter
# (so the timbre doesn't jump mid-phrase), then "a cough". Short fades at every join.
cw = json.load(open(f'{N}/Cold_check.json'))['words']
sent = span('Cold', cw[8]['start'] - 0.06, cw[18]['end'] + 0.12)
bw = json.load(open(f'{N}/B_check.json'))['words']
cough = span('B', bw[0]['start'] - 0.05, bw[-1]['end'] + 0.12)
links = load(f'{N}/seg2_me.wav')
C = clip('C2')
sent, links, cough, C = [fade(x * (level / rms(x))) for x in (sent, links, cough, C)]
sil = lambda s: np.zeros(int(s * SR), np.float32)  # noqa: E731
src = lambda k: fade(voc[int(CUTS[k][0] * SR):int(CUTS[k][1] * SR)], 8)  # noqa: E731
D = np.concatenate([sil(0.12), sent, sil(0.32), links, sil(0.04), cough, sil(0.25)])
pieces = [('src', src('seg1'), CUTS['seg1'][0]), ('new', D, CUTS['seg1'][1]),
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
