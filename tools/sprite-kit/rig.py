# Blender sprite builder: low-poly chibi rigs rendered with one fixed ortho camera.
import bpy, math, json, sys, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
argv = sys.argv[sys.argv.index('--')+1:]
SPEC = json.load(open(argv[0])); OUT = argv[1]
RES = 4  # render 4x, downsampled later
FRAME = 64

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
reset()
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.resolution_x = sc.render.resolution_y = FRAME*RES
sc.render.film_transparent = True
sc.display.render_aa = 'OFF'
sh = sc.display.shading
sh.color_type = 'MATERIAL'; sh.show_specular_highlight = False
sh.use_world_space_lighting = True; sh.studiolight_rotate_z = math.radians(-60)
sc.view_settings.view_transform = 'Standard'
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = FRAME/1.2
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
# shared baseline: z=0 sits 4px above the bottom of every frame
cam.location = (0, -200, (FRAME/2 - 4)/1.2); cam.rotation_euler = (math.radians(90), 0, 0)

mats = {}
def mat(hexc):
    if hexc in mats: return mats[hexc]
    m = bpy.data.materials.new(hexc); c = [int(hexc[i:i+2],16)/255 for i in (1,3,5)]
    m.diffuse_color = (*[x**2.2 for x in c], 1); mats[hexc] = m; return m

piv = {}
def empty(name, parent, loc):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e)
    if parent: e.parent = piv[parent]
    e.location = loc; e.rotation_mode = 'XYZ'; piv[name] = e; return e

def part(p):
    shape, size, off, col = p['shape'], p['size'], p.get('off',[0,0,0]), p['color']
    if shape == 'box': bpy.ops.mesh.primitive_cube_add(size=1)
    elif shape == 'sph': bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.5)
    elif shape == 'cyl': bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.5, depth=1)
    elif shape == 'cone': bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.5, depth=1)
    o = bpy.context.active_object; o.scale = size; o.location = off
    o.rotation_euler = [math.radians(a) for a in p.get('rot',[0,0,0])]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if p.get('bevel'):
        md = o.modifiers.new('b','BEVEL'); md.width = p['bevel']; md.segments = 1
    o.data.materials.append(mat(col)); o.parent = piv[p['pivot']]

S = SPEC.get('scale', 1.0)
for name, parent, loc in SPEC['pivots']:
    empty(name, parent, loc)
piv['root'].scale = (S,S,S)
if 'head' in piv: piv['head'].rotation_euler[2] = math.radians(SPEC.get('headturn', -28))
for p in SPEC['parts']: part(p)
tips = [n for n in piv if n.startswith('tip')]

def pose(fr):
    for name in piv:
        e = piv[name]; base = dict((n,l) for n,_,l in SPEC['pivots'])[name]
        r = fr.get(name, {})
        e.rotation_euler[1] = math.radians(-r.get('swing', 0))
        if name == 'root':
            e.rotation_euler[2] = math.radians(SPEC.get('turn',-30) + r.get('spin',0))
            e.location = (r.get('x',0), 0, r.get('z',0))
            sq = r.get('sq', 1.0); e.scale = (S/sq**0.5, S/sq**0.5, S*sq)
        else:
            e.location = (base[0]+r.get('x',0), base[1], base[2]+r.get('z',0))
            if 'sc' in r: e.scale = (r['sc'],)*3
            else: e.scale = (1,1,1)

meta = {}
os.makedirs(OUT, exist_ok=True)
for anim, frames in SPEC['anims'].items():
    meta[anim] = []
    for i, fr in enumerate(frames):
        pose(fr); bpy.context.view_layer.update()
        for light, tag in (('FLAT','f'), ('STUDIO','s')):
            sh.light = light
            sc.render.filepath = f"{OUT}/{anim}_{i}_{tag}.png"
            bpy.ops.render.render(write_still=True)
        tp = {}
        for t in tips:
            v = world_to_camera_view(sc, cam, piv[t].matrix_world.translation)
            tp[t] = [round(v.x*FRAME,1), round((1-v.y)*FRAME,1)]
        meta[anim].append(tp)
json.dump(meta, open(f"{OUT}/meta.json",'w'))
print("DONE", OUT)
