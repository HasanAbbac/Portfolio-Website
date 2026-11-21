"""Moves the 'moov' index of an MP4 to the front of the file so a browser can start playing, and seek, before the whole file has downloaded
(Blender writes it at the end). Same result as ffmpeg's -movflags +faststart, without needing ffmpeg.
Usage: python scripts/promo/faststart.py <in.mp4> [out.mp4]   (overwrites the input when no output is given)"""
import sys, struct

def atoms(b, start=0, end=None):
    end = len(b) if end is None else end; i = start
    while i < end:
        sz, typ = struct.unpack('>I4s', b[i:i + 8]); hdr = 8
        if sz == 1: sz = struct.unpack('>Q', b[i + 8:i + 16])[0]; hdr = 16
        elif sz == 0: sz = end - i
        yield typ.decode('latin1'), i, sz, hdr
        i += sz

def shift_offsets(moov, delta):
    moov = bytearray(moov)
    def walk(start, end):
        for typ, i, sz, hdr in atoms(bytes(moov), start, end):
            if typ in ('trak', 'mdia', 'minf', 'stbl'):
                walk(i + hdr, i + sz)
            elif typ == 'stco':
                n = struct.unpack('>I', moov[i + hdr + 4:i + hdr + 8])[0]
                for k in range(n):
                    p = i + hdr + 8 + 4 * k; v = struct.unpack('>I', moov[p:p + 4])[0]; moov[p:p + 4] = struct.pack('>I', v + delta)
            elif typ == 'co64':
                n = struct.unpack('>I', moov[i + hdr + 4:i + hdr + 8])[0]
                for k in range(n):
                    p = i + hdr + 8 + 8 * k; v = struct.unpack('>Q', moov[p:p + 8])[0]; moov[p:p + 8] = struct.pack('>Q', v + delta)
    walk(8, len(moov))
    return bytes(moov)

src = sys.argv[1]; dst = sys.argv[2] if len(sys.argv) > 2 else src
b = open(src, 'rb').read()
parts = {t: (i, sz) for t, i, sz, _ in atoms(b)}
order = [t for t, _, _, _ in atoms(b)]
if order.index('moov') < order.index('mdat'):
    print('already faststart'); sys.exit(0)
moov = b[parts['moov'][0]:parts['moov'][0] + parts['moov'][1]]
head = b''.join(b[i:i + sz] for t, i, sz, _ in atoms(b) if t not in ('moov', 'mdat'))  # ftyp, free, ...
mdat = b[parts['mdat'][0]:parts['mdat'][0] + parts['mdat'][1]]
moov2 = shift_offsets(moov, len(moov))
open(dst, 'wb').write(head + moov2 + mdat)
print('faststart written', dst, len(b), '->', len(head + moov2 + mdat))
