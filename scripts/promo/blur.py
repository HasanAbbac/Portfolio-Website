"""Averages the sub-frames written by render.mjs --sub N into one motion-blurred frame each.
Usage: python scripts/promo/blur.py <subframes_dir> <out_dir>"""
import sys, glob, os, re
import numpy as np
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
groups = {}
for f in glob.glob(os.path.join(src, 's*_*.jpg')):
    m = re.match(r's(\d+)_(\d+)\.jpg', os.path.basename(f))
    groups.setdefault(int(m.group(1)), []).append((int(m.group(2)), f))

def job(item):
    n, files = item
    acc = None
    for _, f in sorted(files):
        a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
        acc = a if acc is None else acc + a
    Image.fromarray((acc / len(files) + 0.5).astype(np.uint8)).save(os.path.join(out, f'f{n:05d}.jpg'), quality=94, subsampling=0)

with ThreadPoolExecutor(max_workers=6) as ex:
    list(ex.map(job, sorted(groups.items())))
print('blurred', len(groups), 'frames')
