"""Builds 1080x1920 (9:16) frames for phones and social feeds from the 16:9 frames:
the picture sits in the middle over a blurred, darkened copy of itself, with the name above and the tagline below.
Usage: python scripts/promo/vertical.py <frames_dir> <out_dir>"""
import sys, os, glob
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageEnhance

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
FONT = 'C:/Windows/Fonts/consola.ttf'

def job(f):
    im = Image.open(f).convert('RGB')
    bg = im.resize((3413, 1920), Image.BILINEAR).crop((1166, 0, 2246, 1920)).filter(ImageFilter.GaussianBlur(42))
    bg = ImageEnhance.Brightness(bg).enhance(0.42)
    fg = im.resize((1080, 608), Image.LANCZOS)
    bg.paste(fg, (0, 656))
    d = ImageDraw.Draw(bg)
    try:
        f1 = ImageFont.truetype(FONT, 46); f2 = ImageFont.truetype(FONT, 30)
    except OSError:
        f1 = f2 = ImageFont.load_default()
    d.text((540, 520), 'HASAN ABBASI', font=f1, fill=(255, 244, 234), anchor='mm')
    d.text((540, 1340), '3D ARTIST  .  ANIMATOR  .  GAME DEVELOPER', font=f2, fill=(255, 159, 126), anchor='mm')
    bg.save(os.path.join(out, os.path.basename(f)), quality=92)
    return 1

if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(src, 'f*.jpg')))
    with ProcessPoolExecutor(max_workers=6) as ex:
        n = sum(ex.map(job, files, chunksize=8))
    print('vertical frames:', n)
