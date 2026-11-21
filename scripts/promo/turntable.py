"""Renders a transparent turntable (PNG sequence) of one of the portfolio's .blend files, using the scene's own lights and materials.
The model is turned on a pivot while an orthographic camera and the lights stay put, so the studio lighting sweeps across it.
The .blend is never saved.
Run:  blender -b "<file>.blend" --python scripts/promo/turntable.py -- <out_dir> <frames> <rot0> <rot1> <fit:max|h> <target> <hide1,hide2> <scene_frame> <samples> [size] [only_frame]
Scale convention: 1 target unit = 300 px at size 1200 (the promo page relies on this)."""
import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
out_dir, N, rot0, rot1, fit, target, hide, scene_frame, samples = argv[:9]
N = int(N); rot0 = float(rot0); rot1 = float(rot1); target = float(target); scene_frame = int(scene_frame); samples = int(samples)
size_px = int(argv[9]) if len(argv) > 9 else 1200
only = int(argv[10]) if len(argv) > 10 else None
os.makedirs(out_dir, exist_ok=True)

sc = bpy.context.scene
sc.frame_set(scene_frame)
# backdrops stay in the scene (they light the glass and metal through reflections and bounce) but the camera cannot see them
static = set()
for name in [h for h in hide.split(',') if h]:
    o = bpy.data.objects.get(name)
    if o: o.visible_camera = False; static.add(o.name)
orig_cam = sc.camera

dg = bpy.context.evaluated_depsgraph_get()
mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
meshes = [o for o in bpy.data.objects if o.type in ('MESH', 'CURVE', 'SURFACE', 'FONT') and not o.hide_render and not o.hide_get() and o.name not in static]
for o in meshes:
    eo = o.evaluated_get(dg)
    for c in eo.bound_box:
        w = eo.matrix_world @ Vector(c)
        mn = Vector((min(mn[i], w[i]) for i in range(3))); mx = Vector((max(mx[i], w[i]) for i in range(3)))
size = mx - mn; center = (mn + mx) / 2
print('bbox', tuple(round(v, 3) for v in mn), tuple(round(v, 3) for v in mx), 'size', tuple(round(v, 3) for v in size))

# pivot at the model's centre line; every root object (not lights or cameras) is parented to it
pivot = bpy.data.objects.new('Turn', None); sc.collection.objects.link(pivot)
pivot.location = (center.x, center.y, 0)
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
    if o is pivot or o.parent is not None or o.type in ('LIGHT', 'CAMERA') or o.name in static: continue
    if o.hide_render and o.type in ('MESH', 'CURVE', 'SURFACE', 'FONT'): continue
    mw = o.matrix_world.copy(); o.parent = pivot; o.matrix_world = mw

# orthographic camera: 1 target unit = 300 px
orig = size.z if fit == 'h' else max(size.x, size.y, size.z)
ortho = (size_px / 300.0) * (orig / target)
cam_data = bpy.data.cameras.new('TurnCam'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = ortho; cam_data.clip_start = 0.01; cam_data.clip_end = 1000
cam = bpy.data.objects.new('TurnCam', cam_data); sc.collection.objects.link(cam)
aim = Vector((center.x, center.y, mn.z + size.z / 2))
elev = math.radians(9)
dist = max(size) * 12 + 20
az = Vector((0, -1, 0))
if orig_cam is not None:  # look from the same side as the scene's own camera so the backdrop lights and reflects as designed
    d = orig_cam.matrix_world.translation - aim; d.z = 0
    if d.length > 1e-6: az = d.normalized()
cam.location = aim + Vector((az.x * math.cos(elev), az.y * math.cos(elev), math.sin(elev))) * dist
cam.rotation_euler = (aim - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam

r = sc.render
r.resolution_x = r.resolution_y = size_px; r.resolution_percentage = 100
r.film_transparent = True
if hasattr(r.image_settings, 'media_type'): r.image_settings.media_type = 'IMAGE'
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.image_settings.color_depth = '8'
r.engine = 'CYCLES'
cy = sc.cycles
cy.samples = samples; cy.use_denoising = True; cy.device = 'GPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'; prefs.refresh_devices()
    for d in prefs.devices: d.use = d.type == 'OPTIX'
except Exception as e:
    print('GPU setup failed, falling back to CPU:', e); cy.device = 'CPU'

ease = lambda x: x * x * (3 - 2 * x)
frames = range(N) if only is None else [only]
for i in frames:
    k = i / max(1, N - 1)
    pivot.rotation_euler.z = math.radians(rot0 + (rot1 - rot0) * (0.35 * k + 0.65 * ease(k)))
    r.filepath = os.path.join(out_dir, f't{i:04d}.png')
    bpy.ops.render.render(write_still=True)
print('turntable done', out_dir)
