"""Joins captured frames and the soundtrack into an MP4 (H.264 + AAC) with Blender's video sequencer.
  blender -b --python scripts/promo/encode.py -- <frames_dir> <audio.wav> <out.mp4> [options]
Options (key=value):  w=1920 h=1080 fps=30 crf=HIGH|MEDIUM|LOW  segs=a-b,c-d  (frame ranges to keep, played in this order)
                      fade=6 (cross-fade length in frames between segments)  tail=12 (audio fade-out in frames)
Without segs the whole sequence is used."""
import sys, os, glob
import bpy

argv = sys.argv[sys.argv.index('--') + 1:]
frames_dir, audio, out = argv[:3]
opt = dict(a.split('=', 1) for a in argv[3:])
W = int(opt.get('w', 1920)); H = int(opt.get('h', 1080)); fps = int(opt.get('fps', 30))
crf = opt.get('crf', 'HIGH'); fade = int(opt.get('fade', 6)); tail = int(opt.get('tail', 12))

files = sorted(glob.glob(os.path.join(frames_dir, 'f*.jpg')))
assert files, 'no frames found in ' + frames_dir
segs = [tuple(int(v) for v in s.split('-')) for s in opt['segs'].split(',')] if 'segs' in opt else [(0, len(files) - 1)]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = fps; scene.render.fps_base = 1
scene.render.resolution_x = W; scene.render.resolution_y = H; scene.render.resolution_percentage = 100
seq = scene.sequence_editor_create()
strips = seq.strips if hasattr(seq, 'strips') else seq.sequences

pos = 1; vstrips = []
for i, (a, b) in enumerate(segs):
    ch = 1 + (i % 2)                              # alternate channels so neighbouring strips can overlap for a cross-fade
    st = strips.new_image(f'seg{i}', files[a], ch, pos)
    for f in files[a + 1:b + 1]:
        st.elements.append(os.path.basename(f))
    vstrips.append(st)
    snd = strips.new_sound(f'snd{i}', audio, 3 + (i % 2), pos)
    snd.frame_offset_start = a
    snd.frame_final_duration = b - a + 1
    pos += (b - a + 1) - (fade if len(segs) > 1 else 0)
total = max(s.frame_final_end for s in vstrips)
for i in range(len(vstrips) - 1):                 # video cross-fades; audio cross-fades through short fades on each sound strip
    a, b = vstrips[i], vstrips[i + 1]
    if fade > 0:
        eff = strips.new_effect(f'x{i}', 'CROSS', 5, b.frame_final_start, length=fade, input1=a, input2=b)
if len(segs) > 1 or 'tail' in opt:
    for s in [x for x in strips if x.type == 'SOUND']:
        s.volume = 1.0
        s.keyframe_insert('volume', frame=s.frame_final_start)
        s.volume = 0.0
        s.keyframe_insert('volume', frame=s.frame_final_end)
        s.volume = 1.0
        s.keyframe_insert('volume', frame=s.frame_final_start + 4)
        s.keyframe_insert('volume', frame=s.frame_final_end - max(tail, 1))
        s.volume = 0.0
        s.keyframe_insert('volume', frame=s.frame_final_end)
scene.frame_start = 1; scene.frame_end = int(total) - 1
print('frames:', len(files), 'segments:', segs, 'output frames:', scene.frame_end)

r = scene.render
if hasattr(r.image_settings, 'media_type'): r.image_settings.media_type = 'VIDEO'
r.image_settings.file_format = 'FFMPEG'
r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'
r.ffmpeg.constant_rate_factor = crf; r.ffmpeg.ffmpeg_preset = 'GOOD'; r.ffmpeg.gopsize = fps
r.ffmpeg.audio_codec = 'AAC'; r.ffmpeg.audio_bitrate = 192; r.ffmpeg.audio_mixrate = 44100; r.ffmpeg.audio_channels = 'STEREO'
r.filepath = out
scene.view_settings.view_transform = 'Standard'
bpy.ops.render.render(animation=True)
print('done', out, os.path.getsize(out) if os.path.exists(out) else 'missing')
