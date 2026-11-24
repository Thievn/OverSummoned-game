# Adds an "Items" scene to summoner.blend and renders item icons with the same toon look.
import bpy, bmesh, math, sys
from mathutils import Vector
OUT = "/workspace/oversummoned-blender/"
bpy.ops.wm.open_mainfile(filepath=OUT + "summoner.blend")
main = bpy.data.scenes["Summoner"]
if "Items" in bpy.data.scenes: bpy.data.scenes.remove(bpy.data.scenes["Items"])
for cn in ("Item_PirateHat", "Item_Sword"):
    c = bpy.data.collections.get(cn)
    if c:
        for o in list(c.objects): bpy.data.objects.remove(o)
        bpy.data.collections.remove(c)
for o in [o for o in bpy.data.objects if o.name.startswith(("Item", "PirateHat_Root", "Sword_Root"))]: bpy.data.objects.remove(o)
bpy.ops.outliner.orphans_purge(do_recursive=True)
sc = bpy.data.scenes.new("Items"); bpy.context.window.scene = sc
M = bpy.data.materials
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(((x/12.92) if x <= 0.04045 else ((x+0.055)/1.055)**2.4) for x in c) + (1.0,)
def toon(name, hexc, shadow, spec=False):
    if name in M: return M[name]
    m = M["Robe"].copy(); m.name = name
    n = m.node_tree.nodes
    mix = [x for x in n if x.type == 'MIX'][0]; mix.inputs[7].default_value = lin(hexc)
    ramp = [x for x in n if x.type == 'VALTORGB'][0]; sh = lin(shadow)
    ramp.color_ramp.elements[0].color = (sh[0]*0.9+0.05, sh[1]*0.9+0.05, sh[2]*0.9+0.05, 1)
    if spec: e = ramp.color_ramp.elements.new(0.85); e.color = (1.35, 1.35, 1.35, 1)
    return m
GOLD = M["Gold"]; OUTLINE = M["Outline"]
FELT = toon("Felt", "#44345a", "#5a4a8a"); RED = toon("SashRed", "#d0393f", "#7a3a7a")
BONE = toon("BoneWhite", "#f3ead8", "#9a8aa8"); STEEL = toon("Steel", "#d6dfee", "#7884aa", spec=True)
STEEL_D = toon("SteelDark", "#9aa6c2", "#5a6290"); LEATHER = toon("Leather", "#6b3a2a", "#4a2a4a")
FEATHER = toon("Feather", "#f4f0ff", "#9a8ad0")

def place(o, c):
    for uc in list(o.users_collection): uc.objects.unlink(o)
    c.objects.link(o); return o
def finish(o, mat, c, outline=0.014, smooth=True):
    o.data.materials.clear(); o.data.materials.append(mat)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if outline:
        o.data.materials.append(OUTLINE); s = o.modifiers.new("Outline", 'SOLIDIFY')
        s.thickness = outline; s.offset = 1; s.use_flip_normals = True; s.use_rim = False; s.material_offset = len(o.data.materials)-1
    return place(o, c)
def new(name, mesh_fn):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); mesh_fn(bm); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); return o
def prim(fn, **kw):
    fn(**kw); return bpy.context.object

# ---------------- pirate tricorn ----------------
HAT = bpy.data.collections.new("Item_PirateHat"); sc.collection.children.link(HAT)
def brim(bm, r0=0.3, r1=0.6, nr=10, nt=144):
    rows = []
    for i in range(nr+1):
        t = i/nr; row = []
        for j in range(nt):
            th = j/nt*2*math.pi
            c3 = math.cos(3*(th + math.pi/2))   # corner points at front (-Y) and two rear
            r = r0 + (r1-r0)*t*(1 + 0.16*max(c3, 0)**6)
            lift = 0.6*(t**1.25)*(0.58 - 0.53*c3)
            row.append(bm.verts.new((r*math.cos(th), r*math.sin(th), lift)))
        rows.append(row)
    for i in range(nr):
        for j in range(nt):
            bm.faces.new((rows[i][j], rows[i][(j+1) % nt], rows[i+1][(j+1) % nt], rows[i+1][j]))
b = new("Hat_Brim", brim)
sol = b.modifiers.new("Thick", 'SOLIDIFY'); sol.thickness = 0.035; sol.offset = 0
finish(b, FELT, HAT, outline=0.016)
cr = prim(bpy.ops.mesh.primitive_uv_sphere_add, segments=48, ring_count=24, location=(0, 0, 0.0))
cr.name = "Hat_Crown"; cr.scale = (0.32, 0.32, 0.52); bpy.ops.object.transform_apply()
bm = bmesh.new(); bm.from_mesh(cr.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.02], context='VERTS'); bm.to_mesh(cr.data); bm.free()
finish(cr, FELT, HAT); place(cr, HAT)
band = prim(bpy.ops.mesh.primitive_cylinder_add, vertices=48, radius=0.335, depth=0.08, location=(0, 0, 0.05)); band.name = "Hat_Band"
finish(band, RED, HAT)
# gold trim along the brim edge
cu = bpy.data.curves.new("Hat_Trim", 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.022; cu.bevel_resolution = 3
spl = cu.splines.new('POLY'); nt = 144; spl.points.add(nt-1); spl.use_cyclic_u = True
for j in range(nt):
    th = j/nt*2*math.pi; c3 = math.cos(3*(th + math.pi/2))
    r = (0.3 + 0.3*(1 + 0.16*max(c3, 0)**6)); lift = 0.6*(0.58 - 0.53*c3)
    spl.points[j].co = (r*math.cos(th), r*math.sin(th), lift, 1)
tr = bpy.data.objects.new("Hat_Trim", cu); HAT.objects.link(tr); cu.materials.append(GOLD)
# skull & crossbones on the front corner's upturned face: put on crown front
sk = prim(bpy.ops.mesh.primitive_uv_sphere_add, segments=24, ring_count=12, location=(0, -0.295, 0.33)); sk.name = "Hat_Skull"
sk.scale = (0.1, 0.06, 0.095); bpy.ops.object.transform_apply(); finish(sk, BONE, HAT, outline=0.008)
jaw = prim(bpy.ops.mesh.primitive_cube_add, size=1, location=(0, -0.325, 0.245)); jaw.name = "Hat_SkullJaw"
jaw.scale = (0.1, 0.04, 0.05); bpy.ops.object.transform_apply(); finish(jaw, BONE, HAT, outline=0.008, smooth=False)
for sx in (-0.037, 0.037):
    e = prim(bpy.ops.mesh.primitive_uv_sphere_add, segments=12, ring_count=6, location=(sx, -0.353, 0.335)); e.name = "Hat_SkullEye"
    e.scale = (0.025, 0.012, 0.028); bpy.ops.object.transform_apply(); finish(e, M["Eye"], HAT, outline=0)
for ang in (0.7, -0.7):
    cb = prim(bpy.ops.mesh.primitive_cylinder_add, vertices=12, radius=0.02, depth=0.34, location=(0, -0.33, 0.17), rotation=(math.pi/2 - 0.25, 0, 0))
    cb.name = "Hat_Bone"; cb.rotation_euler = (0, ang, 0); cb.location = (0, -0.315, 0.31)
    bpy.ops.object.transform_apply(); finish(cb, BONE, HAT, outline=0.007)
# feather tucked in the band at the side


# ---------------- sword ----------------
SW = bpy.data.collections.new("Item_Sword"); sc.collection.children.link(SW)
def blade(bm):
    # diamond cross-section blade with a pointed tip, from z=0.16 to z=1.5
    prof = [(0.075, 0), (0, 0.022), (-0.075, 0), (0, -0.022)]
    rings = []
    for z, s in [(0.16, 1.0), (0.3, 0.97), (1.2, 0.9), (1.3, 0.75)]:
        rings.append([bm.verts.new((x*s, y*s, z)) for x, y in prof])
    tip = bm.verts.new((0, 0, 1.52))
    for a, c in zip(rings, rings[1:]):
        for j in range(4): bm.faces.new((a[j], a[(j+1) % 4], c[(j+1) % 4], c[j]))
    for j in range(4): bm.faces.new((rings[-1][j], rings[-1][(j+1) % 4], tip))
    bm.faces.new(list(reversed(rings[0])))
bl = new("Sword_Blade", blade); finish(bl, STEEL, SW, outline=0.012, smooth=False)
bl.data.materials.append(STEEL_D)
for f in bl.data.polygons:
    if f.material_index == 0 and f.normal.x < -0.1: f.material_index = 2
fu = prim(bpy.ops.mesh.primitive_cube_add, size=1, location=(0, -0.0125, 0.68)); fu.name = "Sword_Fuller"
fu.scale = (0.018, 0.006, 0.86); bpy.ops.object.transform_apply(); finish(fu, STEEL_D, SW, outline=0, smooth=False)
fu2 = fu.copy(); fu2.data = fu.data; fu2.location.y = 0.025; SW.objects.link(fu2)
gd = prim(bpy.ops.mesh.primitive_cube_add, size=1, location=(0, 0, 0.12)); gd.name = "Sword_Guard"
gd.scale = (0.44, 0.075, 0.07); bpy.ops.object.transform_apply()
bv = gd.modifiers.new("Bevel", 'BEVEL'); bv.width = 0.02; bv.segments = 3
finish(gd, GOLD, SW, outline=0.012, smooth=False)
for sx in (-0.24, 0.24):
    k = prim(bpy.ops.mesh.primitive_uv_sphere_add, segments=24, ring_count=12, location=(sx, 0, 0.14)); k.name = "Sword_GuardKnob"
    k.scale = (0.05, 0.05, 0.05); bpy.ops.object.transform_apply(); finish(k, GOLD, SW, outline=0.01)
gr = prim(bpy.ops.mesh.primitive_cylinder_add, vertices=20, radius=0.04, depth=0.32, location=(0, 0, -0.08)); gr.name = "Sword_Grip"
finish(gr, LEATHER, SW, outline=0.012)
for z in (-0.19, -0.12, -0.05, 0.02):
    t = prim(bpy.ops.mesh.primitive_torus_add, major_radius=0.042, minor_radius=0.009, location=(0, 0, z), rotation=(0, 0.25, 0))
    t.name = "Sword_Wrap"; finish(t, toon("LeatherDark", "#4a2418", "#3a1a3a"), SW, outline=0)
po = prim(bpy.ops.mesh.primitive_uv_sphere_add, segments=24, ring_count=12, location=(0, 0, -0.29)); po.name = "Sword_Pommel"
po.scale = (0.07, 0.07, 0.07); bpy.ops.object.transform_apply(); finish(po, GOLD, SW, outline=0.012)

# ---------------- items scene: light, camera, render ----------------
sun = bpy.data.objects.new("ItemKey", bpy.data.lights.new("ItemKey", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = Vector((-0.5, -0.8, 0.7)).normalized().to_track_quat('Z', 'Y').to_euler()
sc.world = main.world
for attr in ("engine",): setattr(sc.render, attr, main.render.engine)
sc.eevee.taa_render_samples = 48; sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = 768
sc.view_settings.view_transform = 'Standard'
cam = bpy.data.objects.new("ItemCam", bpy.data.cameras.new("ItemCam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.clip_end = 100

def fit(objs, margin=0.14):
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted(); xs = []; ys = []
    for o in objs:
        oe = o.evaluated_get(dg)
        for c in oe.bound_box:
            p = inv @ (oe.matrix_world @ Vector(c)); xs.append(p.x); ys.append(p.y)
    cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    span = max(max(xs)-min(xs), max(ys)-min(ys))
    cam.location = cam.matrix_world @ Vector((cx, cy, 0)); cam.data.ortho_scale = span/(1-2*margin)

hat_root = bpy.data.objects.new("PirateHat_Root", None); HAT.objects.link(hat_root)
for o in HAT.objects:
    if o is not hat_root: o.parent = hat_root
sw_root = bpy.data.objects.new("Sword_Root", None); SW.objects.link(sw_root)
for o in SW.objects:
    if o is not sw_root: o.parent = sw_root
sw_root.rotation_euler = (0, math.radians(-45), 0)
hat_root.rotation_euler = (0, 0, math.radians(-10))

def shot(colname, root, rot, name):
    for c in (HAT, SW): c.hide_render = (c.name != colname)
    cam.rotation_euler = rot; cam.location = (0, 0, 0)
    bpy.context.view_layer.update()
    cam.location = cam.matrix_world.to_3x3() @ Vector((0, 0, 20)); bpy.context.view_layer.update()
    fit([o for o in bpy.data.collections[colname].objects if o.type in ('MESH', 'CURVE')])
    sc.render.filepath = OUT + "items/" + name; bpy.ops.render.render(write_still=True)

shot("Item_PirateHat", hat_root, (math.radians(66), 0, math.radians(5)), "pirate_hat_raw.png")
shot("Item_Sword", sw_root, (math.radians(80), 0, math.radians(6)), "sword_raw.png")
bpy.context.window.scene = main
bpy.ops.wm.save_as_mainfile(filepath=OUT + "summoner.blend")
print("ITEMS DONE")
