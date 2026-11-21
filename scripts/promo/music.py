"""Original soundtrack for the portfolio promo, synthesised from scratch (no samples, no third-party music),
so there is nothing to license. 120 BPM, A minor (Am - F - C - G), 50 seconds, stereo 44.1 kHz WAV.
Usage:  python scripts/promo/music.py <out.wav>
Timing follows the animation: a build-up to the title at ~3.1 s, the full beat from 8 s, whoosh + impact on every scene cut."""
import sys, wave
import numpy as np
from scipy import signal

SR = 44100
DUR = 52.0   # the main part; a 2.5 s cold open is added in front at the end
N = int(SR * DUR)
BPM = 120
BEAT = 60.0 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def t_arr(n): return np.arange(n) / SR
def hz(note): return 440.0 * 2 ** ((note - 69) / 12)

def add(buf_l, buf_r, start, sig, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    sig = sig[: N - i]
    gl = gain * np.cos((pan + 1) * np.pi / 4); gr = gain * np.sin((pan + 1) * np.pi / 4)
    buf_l[i:i + len(sig)] += sig * gl; buf_r[i:i + len(sig)] += sig * gr

def lp(x, f, order=2): b, a = signal.butter(order, min(f, SR / 2 - 100) / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, order=2): b, a = signal.butter(order, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f1, f2): b, a = signal.butter(2, [f1 / (SR / 2), min(f2, SR / 2 - 100) / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def env(n, a, d, s, r):
    e = np.ones(n); na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, max(na, 1)); e[na:na + nd] = np.linspace(1, s, max(nd, 1)); e[na + nd:] = s
    if nr > 0 and nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def saw(f, n, detune=0.0):
    t = t_arr(n); return 2 * ((t * f * (1 + detune)) % 1) - 1
def sq(f, n): return np.sign(np.sin(2 * np.pi * f * t_arr(n)))

ROOTS = [57, 53, 60, 55]  # A3 F3 C4 G3 (chord roots, octave 3)
CHORDS = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]]  # Am, F, C, G (minor, then major triads)

def chord_notes(bar, octave=0):
    r = ROOTS[bar % 4]; return [r + iv + 12 * octave for iv in CHORDS[bar % 4]]

def section_gain(t, pts):  # piecewise-linear automation [(time, gain), ...]
    ts, gs = zip(*pts); return np.interp(t, ts, gs)

# ---------------- pad (whole piece, swelling) ----------------
pad_l = np.zeros(N); pad_r = np.zeros(N)
nbars = int(DUR / BAR) + 1
for bar in range(nbars):
    start = bar * BAR; n = int(BAR * SR * 1.15)
    for k, note in enumerate(chord_notes(bar, 0)):
        f = hz(note)
        v = (saw(f, n, 0.003) + saw(f, n, -0.004) + 0.6 * saw(f * 2, n, 0.002)) / 2.6
        v = lp(v, 1500) * env(n, 0.5, 0.4, 0.8, 0.9)
        add(pad_l, pad_r, start, v, pan=-0.5 + 0.5 * k, gain=0.12)
tt = t_arr(N)
pad_gain = section_gain(tt, [(0, 0.0), (1.5, 0.55), (8, 0.7), (14, 0.5), (24, 0.5), (36, 0.85), (42, 1.0), (49, 1.0), (52, 0.0)])

# ---------------- sub drone for the intro ----------------
d = np.sin(2 * np.pi * hz(33) * tt) * 0.5 + np.sin(2 * np.pi * hz(45) * tt) * 0.25
dg = section_gain(tt, [(0, 0.0), (2.0, 0.5), (3.0, 0.0), (3.1, 0.0)])
L += d * dg * 0.25; R += d * dg * 0.25

# ---------------- riser into the title + impact ----------------
def riser(start, dur, gain=0.5):
    n = int(dur * SR); noise = rng.standard_normal(n)
    out = np.zeros(n); seg = 12
    for i in range(seg):
        a = int(i * n / seg); b = int((i + 1) * n / seg)
        f = 300 * (1 + i) ** 1.6
        out[a:b] = bp(noise, f * 0.7, f * 1.4)[a:b]
    out *= np.linspace(0, 1, n) ** 2
    return out / (np.max(np.abs(out)) + 1e-9) * gain
add(L, R, 0.4, riser(0, 2.7, 0.45), pan=0.0)

def boom(start, gain=0.9, long=1.2):
    n = int(long * SR); t = t_arr(n)
    f = 110 * np.exp(-t * 3.2) + 38
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.0)
    nz = hp(rng.standard_normal(n), 800) * np.exp(-t * 14) * 0.35
    add(L, R, start, (x + nz) * gain, 0.0)
boom(3.1, 1.0, 2.0)
boom(42.0, 0.9, 2.5)

def whoosh(start, dur=0.56, gain=0.35):
    n = int(dur * SR); noise = rng.standard_normal(n); out = np.zeros(n)
    seg = 10
    for i in range(seg):
        a = int(i * n / seg); b = int((i + 1) * n / seg)
        f = 500 * 1.55 ** i
        out[a:b] = bp(noise, f * 0.75, f * 1.35)[a:b]
    out = out * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    out = out / (np.max(np.abs(out)) + 1e-9) * gain
    pan = np.linspace(0.9, 0.1, n)  # sweeps from left to right
    i = int(start * SR); m = min(n, N - i)
    L[i:i + m] += (out * pan)[:m]; R[i:i + m] += (out * (1 - pan))[:m]

CUTS = [8, 14, 18, 21, 24, 28, 32, 36, 42]
for c in CUTS:
    whoosh(c - 0.3, 0.58, 0.32 if c in (8, 14, 24, 36, 42) else 0.2)
for c in (8, 14, 24, 36):
    boom(c, 0.55, 0.9)

# ---------------- drums ----------------
def kick(start, gain=1.0):
    n = int(0.32 * SR); t = t_arr(n)
    f = 45 + 120 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 200) * 0.15
    add(L, R, start, (x + click) * gain, 0.0)
def snare(start, gain=0.5):
    n = int(0.25 * SR); t = t_arr(n)
    x = bp(rng.standard_normal(n), 1500, 7000) * np.exp(-t * 20) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * 0.4
    add(L, R, start, x * gain, 0.05)
def hat(start, gain=0.18, open_=False):
    n = int((0.22 if open_ else 0.06) * SR); t = t_arr(n)
    x = hp(rng.standard_normal(n), 7500) * np.exp(-t * (14 if open_ else 70))
    add(L, R, start, x * gain, 0.3)

for beat in range(int(DUR / BEAT)):
    t0 = beat * BEAT
    if t0 < 4.0 or t0 >= 46.0: continue
    soft = 0.45 if t0 < 8 else 1.0
    if 36 <= t0 < 42: soft = 0.85
    kick(t0, 0.85 * soft)
    if t0 >= 14 and beat % 2 == 1 and t0 < 42: snare(t0, 0.55)
    if t0 >= 6 and t0 < 46:
        hat(t0 + BEAT * 0.5, 0.2 if t0 >= 8 else 0.1, open_=(beat % 4 == 3))
        if t0 >= 14: hat(t0 + BEAT * 0.25, 0.07); hat(t0 + BEAT * 0.75, 0.07)

# ---------------- bass ----------------
for bar in range(nbars):
    st = bar * BAR
    if st < 8 or st >= 46: continue
    root = hz(ROOTS[bar % 4] - 24)
    for e in range(8):
        t0 = st + e * BEAT / 2
        if e in (1, 3, 5) and not (14 <= st < 36): continue
        n = int(BEAT * 0.45 * SR)
        x = (np.sin(2 * np.pi * root * t_arr(n)) + 0.35 * saw(root, n)) * env(n, 0.005, 0.1, 0.6, 0.05)
        x = lp(x, 400)
        gain = 0.42 * (0.8 if st < 14 else 1.0)
        # sidechain-ish duck right after each kick is implied by the short notes
        add(L, R, t0, x, 0.0, gain)

# ---------------- arpeggio (stereo ping-pong echo) ----------------
arp_l = np.zeros(N); arp_r = np.zeros(N)
for bar in range(nbars):
    st = bar * BAR
    if st < 8 or st >= 46: continue
    notes = chord_notes(bar, 1) + [chord_notes(bar, 1)[0] + 12]
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for s16 in range(16):
        t0 = st + s16 * BEAT / 4
        note = notes[pattern[s16 % 8] % 4] + (12 if (s16 // 8) == 1 and bar % 2 == 1 else 0)
        n = int(0.28 * SR); f = hz(note)
        x = (saw(f, n, 0.002) + 0.7 * sq(f * 2, n) * 0.3) * np.exp(-t_arr(n) * 9)
        x = lp(x, 3800) * 0.5
        add(arp_l, arp_r, t0, x, pan=-0.35 if s16 % 2 == 0 else 0.35, gain=1.0)
arp_gain = section_gain(tt, [(0, 0), (8, 0.18), (14, 0.34), (24, 0.34), (32, 0.28), (36, 0.4), (42, 0.3), (47, 0.2), (52, 0)])
dl = int(BEAT * 0.75 * SR)
echo_l = arp_l.copy(); echo_r = arp_r.copy()
echo_l[dl:] += arp_r[:-dl] * 0.38; echo_r[dl:] += arp_l[:-dl] * 0.38

# ---------------- lead melody for the model showcase and outro ----------------
lead_l = np.zeros(N); lead_r = np.zeros(N)
MEL = [(0, 72), (1, 71), (2, 67), (3, 69), (4, 72), (5, 74), (6, 71), (7, 67)]
for bar in range(nbars):
    st = bar * BAR
    if not (14 <= st < 24 or 36 <= st < 46): continue
    pent = [chord_notes(bar, 1)[0] + 12, chord_notes(bar, 1)[2] + 12, chord_notes(bar, 1)[1] + 12, chord_notes(bar, 1)[2]]
    pat = [(0, 0, 1.0), (1.0, 1, 0.5), (1.5, 2, 0.5), (2.5, 3, 1.5)]
    for off, idx, ln in pat:
        t0 = st + off * BEAT; n = int(ln * BEAT * SR * 1.3); f = hz(pent[idx])
        x = (saw(f, n, 0.003) + saw(f, n, -0.003) + sq(f, n) * 0.25) / 2.25
        x = lp(x, 2600) * env(n, 0.01, 0.3, 0.45, 0.25)
        add(lead_l, lead_r, t0, x, 0.15, 0.2)

# ---------------- final chord stab and tail ----------------
tail_l = np.zeros(N); tail_r = np.zeros(N)
for k, note in enumerate([57, 60, 64, 69, 72]):
    n = int(8.0 * SR); f = hz(note)
    x = (saw(f, n, 0.003) + saw(f, n, -0.003)) / 2
    x = lp(x, 2200) * env(n, 0.02, 0.8, 0.5, 3.0)
    add(tail_l, tail_r, 42.0, x, pan=-0.6 + 0.3 * k, gain=0.16)

# ---------------- UI ticks and a soft shimmer on the end card ----------------
def tick(start, gain=0.12, f=1900):
    n = int(0.07 * SR); t = t_arr(n)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 55) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 90)
    add(L, R, start, x * gain, 0.0)
def shimmer(start, gain=0.1):
    n = int(1.6 * SR); t = t_arr(n)
    x = sum(np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 2.4) for m in (81, 84, 88, 93)) / 4
    add(L, R, start, x * gain, 0.2)
for gi, count in enumerate([1, 3, 8]):
    for ci in range(count): tick(8 + 0.7 + gi * 0.45 + 0.25 + ci * 0.07, 0.09, 1500 + 120 * ci)
for a0 in (14, 18, 21):
    tick(a0 + 0.2, 0.14, 1200)
    for k in range(3): tick(a0 + 0.75 + k * 0.1, 0.08, 1700 + 200 * k)
for i in range(3): tick(36 + 1.2 + i * 0.5, 0.13, 1400)
for k in range(3): tick(42 + 3.0 + k * 0.2, 0.1, 1700 + 200 * k)
shimmer(47.7, 0.12)

# ---------------- pre-cut risers (reverse-cymbal style swell into the big cuts) ----------------
for c in (8, 14, 24, 36, 42): add(L, R, c - 1.0, riser(0, 1.0, 0.22), 0.0)

# ---------------- sidechain ducking, reverb and the music bus ----------------
duck = np.ones(N)
for beat in range(int(DUR / BEAT)):
    t0 = beat * BEAT
    if t0 < 4.0 or t0 >= 46.0: continue
    i = int(t0 * SR); m = int(0.32 * SR); tt2 = np.arange(min(m, N - i)) / SR
    duck[i:i + len(tt2)] = np.minimum(duck[i:i + len(tt2)], 1 - 0.5 * np.exp(-tt2 / 0.11))
bus_l = pad_l * pad_gain + (arp_l + 0) * 0 + echo_l * arp_gain * 0.7 + lead_l + tail_l
bus_r = pad_r * pad_gain + (arp_r + 0) * 0 + echo_r * arp_gain * 0.7 + lead_r + tail_r
bus_l *= duck; bus_r *= duck
ir_n = int(2.2 * SR); ir_t = t_arr(ir_n)
ir_l = lp(rng.standard_normal(ir_n), 6000) * np.exp(-ir_t * 2.6); ir_r = lp(rng.standard_normal(ir_n), 6000) * np.exp(-ir_t * 2.6)
ir_l /= np.sqrt((ir_l ** 2).sum()); ir_r /= np.sqrt((ir_r ** 2).sum())
wet_l = signal.fftconvolve(bus_l, ir_l)[:N]; wet_r = signal.fftconvolve(bus_r, ir_r)[:N]
L += bus_l + wet_l * 0.32; R += bus_r + wet_r * 0.32

# ---------------- master ----------------
# gentle bus compression via soft clipping, fade in/out, normalise to -2 dBFS
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= np.minimum(1, tt / 0.3)[:, None] * np.minimum(1, (DUR - tt) / 3.0)[:, None]
mix = hp(mix[:, 0], 28), hp(mix[:, 1], 28)
mix = np.stack(mix, 1)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.8
# ---------------- cold open (2.5 s): a low swell, typing ticks and a rising sweep into the build ----------------
OFF = 2.5; n0 = int(OFF * SR)
iL = np.zeros(n0); iR = np.zeros(n0); it = t_arr(n0)
drone = (np.sin(2 * np.pi * hz(33) * it) * 0.6 + np.sin(2 * np.pi * hz(45) * it) * 0.3) * np.minimum(1, it / 1.2) * 0.22
iL += drone; iR += drone
def itick(t, g=0.1):
    n = int(0.06 * SR); tt3 = t_arr(n); x = (np.sin(2 * np.pi * 2300 * tt3) * np.exp(-tt3 * 70)) * g
    i = int(t * SR); iL[i:i + n] += x[: n0 - i]; iR[i:i + n] += x[: n0 - i]
for k in range(14): itick(0.4 + k * 0.045)
for k in range(18): itick(0.85 + k * 0.04, 0.07)
sw = riser(0, 0.9, 0.35); i0 = int(1.6 * SR); iL[i0:i0 + len(sw)] += sw[: n0 - i0]; iR[i0:i0 + len(sw)] += sw[: n0 - i0]
intro = np.stack([iL, iR], 1)
intro *= np.minimum(1, it / 0.25)[:, None]
mix = np.concatenate([intro / (np.max(np.abs(intro)) + 1e-9) * 0.55 * 0.8 + 0, mix])
mix = mix / max(1.0, np.max(np.abs(mix)) / 0.8)
N = len(mix)
pcm = (mix * 32767).astype('<i2')
out = sys.argv[1] if len(sys.argv) > 1 else 'promo-audio.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', out, round(N / SR, 1), 's')
