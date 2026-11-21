"""Measures each Blender turntable frame (alpha bounding box) and writes meta.json next to the PNGs:
the picture centre column and the base row per frame (lightly smoothed), so the promo can keep the model centred on its pedestal.
Usage: python scripts/promo/ttmeta.py <turntable_dir>"""
import sys, glob, json, os
import numpy as np
from PIL import Image

d = sys.argv[1]
files = sorted(glob.glob(os.path.join(d, 't*.png')))
cx, rb = [], []
for f in files:
    a = np.asarray(Image.open(f))[:, :, 3] > 25
    cols = np.where(a.any(0))[0]; rows = np.where(a.any(1))[0]
    cx.append((cols.min() + cols.max()) / 2); rb.append(float(rows.max()))
def smooth(v, w=15):
    v = np.array(v); k = np.ones(w) / w; pad = np.pad(v, (w // 2, w // 2), mode='edge'); return np.convolve(pad, k, mode='valid')
json.dump({'cx': [round(float(x), 1) for x in smooth(cx)], 'rb': [round(float(x), 1) for x in smooth(rb)]}, open(os.path.join(d, 'meta.json'), 'w'))
print(d, 'frames', len(files), 'cx range', round(min(cx)), round(max(cx)), 'rb range', round(min(rb)), round(max(rb)))
