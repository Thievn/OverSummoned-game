# Adds the idle -> cast -> idle loop to summoner.blend and renders preview frames.
# blender -b -P anim.py -- [still N] [norender]
import bpy, bmesh, math, sys
from mathutils import Vector, Quaternion
OUT = "/workspace/oversummoned-blender/"
ARGS = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
bpy.ops.wm.open_mainfile(filepath=OUT + "summoner_still_backup.blend")  # pristine still scene
sc = bpy.data.scenes["Summoner"]; bpy.context.window.scene = sc
O = bpy.data.objects; M = bpy.data.materials
rig = O["SummonerRig"]; arm = rig.data
FPS, END = 24, 120
sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = END

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(((x/12.92) if x <= 0.04045 else ((x+0.055)/1.055)**2.4) for x in c) + (1.0,)

def origin_to_geo(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

def bone_parent(o, bn):
    bpy.context.view_layer.update(); mw = o.matrix_world.copy()
    o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = bn
    bpy.context.view_layer.update(); o.matrix_world = mw

# ---- rest pose helper: build new face parts in rig rest space -------------
rest_mw = rig.matrix_world.copy()
CH = bpy.data.collections["Summoner"]
def add_face_part(name, mesh_obj, mat):
    mesh_obj.name = name; mesh_obj.matrix_world = rest_mw @ mesh_obj.matrix_world
    mesh_obj.data.materials.clear(); mesh_obj.data.materials.append(mat)
    for p in mesh_obj.data.polygons: p.use_smooth = True
    for uc in list(mesh_obj.users_collection): uc.objects.unlink(mesh_obj)
    CH.objects.link(mesh_obj); bone_parent(mesh_obj, "head"); origin_to_geo(mesh_obj); return mesh_obj

MOUTH = M.get("Mouth") or M["Eye"].copy(); MOUTH.name = "Mouth"
mix = [n for n in MOUTH.node_tree.nodes if n.type == 'MIX'][0]; mix.inputs[7].default_value = lin("#5a1626")
for n in ("Mouth_Smile", "Mouth_Open"):
    if n in O: O.remove(O[n])
# smile: lower half of a thin torus on the face
bpy.ops.mesh.primitive_torus_add(major_radius=0.04, minor_radius=0.009, major_segments=32, minor_segments=8,
                                 location=(0.012, -0.205, 1.315), rotation=(math.radians(90), 0, 0))
sm = bpy.context.object; bpy.ops.object.transform_apply()
bm = bmesh.new(); bm.from_mesh(sm.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > 1.31], context='VERTS'); bm.to_mesh(sm.data); bm.free()
smile = add_face_part("Mouth_Smile", sm, MOUTH)
bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, location=(0.012, -0.2, 1.295))
om = bpy.context.object; om.scale = (0.035, 0.014, 0.04); bpy.ops.object.transform_apply()
mopen = add_face_part("Mouth_Open", om, MOUTH)

# ---- eye glow material driven by rig["cast"] --------------------------------
rig["cast"] = 0.0
rig.id_properties_ui("cast").update(min=0.0, max=1.0)
def drive(sock, expr, path='default_value'):
    fc = sock.driver_add(path); d = fc.driver; d.type = 'SCRIPTED'
    v = d.variables.new(); v.name = "c"; v.type = 'SINGLE_PROP'
    v.targets[0].id = rig; v.targets[0].data_path = '["cast"]'; d.expression = expr
eg = M.get("EyeGlow")
if eg: M.remove(eg)
eg = M["Eye"].copy(); eg.name = "EyeGlow"; nt = eg.node_tree
toon_em = [n for n in nt.nodes if n.type == 'EMISSION'][0]; out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
pe = nt.nodes.new('ShaderNodeEmission'); pe.inputs[0].default_value = lin("#c46bff")
mx = nt.nodes.new('ShaderNodeMixShader')
nt.links.new(toon_em.outputs[0], mx.inputs[1]); nt.links.new(pe.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs[0])
drive(mx.inputs[0], "min(1, c*1.6)"); drive(pe.inputs[1], "1 + 3*c")
eyes = [o for o in O if o.name.startswith("Eye") and not o.name.startswith("EyeHi") and o.parent == rig]
his = [o for o in O if o.name.startswith("EyeHi") and o.parent == rig]
for e in eyes:
    e.data.materials[0] = eg if e.data.materials else None
for o in eyes + his + [O["CastFlare"], O["CastFlareGlow"]]: origin_to_geo(o)
# purple eye halo spheres (blended), only visible while casting
halo_m = M.get("EyeHaloMat") or M["FlareGlowMat"].copy(); halo_m.name = "EyeHaloMat"
[n for n in halo_m.node_tree.nodes if n.type == 'EMISSION'][0].inputs[0].default_value = lin("#c46bff")
halos = []
for e in eyes:
    hn = e.name + "_Halo"
    if hn in O: O.remove(O[hn])
    h = e.copy(); h.data = bpy.data.meshes.new(hn); h.name = hn; CH.objects.link(h)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=0.06); bm.to_mesh(h.data); bm.free()
    h.data.materials.append(halo_m); h.scale = (0.0, 0.0, 0.0); h.visible_shadow = False
    for p in h.data.polygons: p.use_smooth = True
    halos.append(h)
# circle + pedestal rune intensity
for mn, expr in (("Rune", "1.6 + 2.2*c"), ("RuneViolet", "1.5 + 2.5*c"), ("Core", "2 + 2*c")):
    e = [n for n in M[mn].node_tree.nodes if n.type == 'EMISSION'][0]; drive(e.inputs[1], expr)
for mn, expr in (("CircleGlowMat", "1.2 + 1.8*c"), ("ColumnMat", "1.3 + 2.2*c")):
    e = [n for n in M[mn].node_tree.nodes if n.type == 'EMISSION'][0]; drive(e.inputs[1], expr)

# ---- circle spinner -------------------------------------------------------
CIRC = bpy.data.collections["SummonCircle"]
ring = O.get("CircleSpin") or bpy.data.objects.new("CircleSpin", None)
if ring.name not in CIRC.objects: CIRC.objects.link(ring)
cc = sum((O["Ring_Outer"].matrix_world @ (sum((Vector(c) for c in O["Ring_Outer"].bound_box), Vector())/8),), Vector())
ring.location = (cc.x, cc.y, 0.0)
bpy.context.view_layer.update()
inner = O.get("CircleSpinInner") or bpy.data.objects.new("CircleSpinInner", None)
if inner.name not in CIRC.objects: CIRC.objects.link(inner)
inner.location = ring.location
bpy.context.view_layer.update()
for o in list(CIRC.objects):
    if o.name.startswith(("Ring_", "Tick", "Hex")) and o.parent is None:
        mw = o.matrix_world.copy()
        o.parent = inner if o.name.startswith(("Hex", "Ring_Inner", "Ring_Core")) else ring
        bpy.context.view_layer.update(); o.matrix_world = mw

# ---- timeline ----------------------------------------------------------------
# idle 1-40 | windup 40-62 | release 62-68 | hold 68-88 | settle 88-104 | idle 104-120
def cast_curve(f):
    if f < 40: return 0.0
    if f < 62: return 0.55*(f-40)/22
    if f < 68: return 0.55 + 0.45*(f-62)/6
    if f < 88: return 1.0
    if f < 104: return 1.0 - (f-88)/16
    return 0.0
for f in range(1, END+1):
    rig["cast"] = cast_curve(f); rig.keyframe_insert('["cast"]', frame=f)
# spin speed (deg/frame) follows cast power; scale so total turn is a multiple of 60 deg (seamless loop)
spd = [1.0 + 9.0*cast_curve(f)**1.5 for f in range(1, END+1)]
tot = sum(spd); k = (round(tot/60) or 1)*60/tot
ang = 0.0; ang2 = 0.0
for i, f in enumerate(range(1, END+1)):
    ring.rotation_euler.z = math.radians(ang); ring.keyframe_insert("rotation_euler", index=2, frame=f)
    inner.rotation_euler.z = math.radians(-ang2); inner.keyframe_insert("rotation_euler", index=2, frame=f)
    ang += spd[i]*k; ang2 += spd[i]*k*1.0
for o in (ring, inner):
    for fc in o.animation_data.action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'

# ---- arm / body poses --------------------------------------------------------
pb = rig.pose.bones; eb = arm.bones
def R(bn): return eb[bn].matrix_local.to_quaternion()
def restdir(bn): return (eb[bn].tail_local - eb[bn].head_local).normalized()
def local_q(bn, parent_delta, want_dir):
    d0 = parent_delta @ restdir(bn)
    q2 = d0.rotation_difference(Vector(want_dir).normalized()) @ parent_delta  # world delta for this bone
    Rc = R(bn); ql = Rc.inverted() @ parent_delta.inverted() @ q2 @ Rc
    return ql, q2
def pose_arm(up_dir, fore_dir, spine_dir=(0, 0, 1)):
    qs, ds = local_q("spine", Quaternion(), spine_dir)
    qu, du = local_q("upper_arm.L", ds, up_dir)
    qf, df = local_q("forearm.L", du, fore_dir)
    return qs, qu, qf
REST_UP = restdir("upper_arm.L"); REST_FO = restdir("forearm.L")
POSES = {
    "idle":    pose_arm((0.07, -0.04, -0.23), (0.03, -0.22, 0.02)),
    "idle_b":  pose_arm((0.07, -0.04, -0.23), (0.03, -0.22, 0.02), (0, 0.025, 1)),
    "windup":  pose_arm((0.12, 0.1, 0.12), (0.02, -0.06, 0.22), (0, 0.07, 1)),
    "release": pose_arm(tuple(REST_UP + Vector((0, -0.04, -0.02))), tuple(REST_FO), (0, -0.08, 1)),
    "hold":    pose_arm(tuple(REST_UP), tuple(REST_FO), (0, -0.04, 1)),
}
for b in pb: b.rotation_mode = 'QUATERNION'
def key_pose(name, f, head_tilt=0.0):
    qs, qu, qf = POSES[name]
    pb["spine"].rotation_quaternion = qs; pb["upper_arm.L"].rotation_quaternion = qu; pb["forearm.L"].rotation_quaternion = qf
    pb["head"].rotation_quaternion = Quaternion((0, 1, 0), head_tilt)
    for bn in ("spine", "upper_arm.L", "forearm.L", "head"):
        pb[bn].keyframe_insert("rotation_quaternion", frame=f)
for f, name, tilt in [(1, "idle", 0.0), (11, "idle_b", 0.04), (21, "idle", 0.0), (31, "idle_b", -0.03), (40, "idle", 0.0),
                      (56, "windup", -0.06), (62, "windup", -0.07), (66, "release", 0.03), (70, "hold", 0.02),
                      (86, "hold", 0.0), (100, "idle", 0.0), (110, "idle_b", 0.03), (120, "idle", 0.0)]:
    key_pose(name, f, tilt)

# ---- face: blinks, mouth -----------------------------------------------------
def keyscale(o, f, s):
    o.scale = s; o.keyframe_insert("scale", frame=f)
base = {o.name: tuple(o.scale) for o in eyes + his}
def blink(f0):
    for o in eyes + his:
        b = base[o.name]
        keyscale(o, f0, b); keyscale(o, f0+2, (b[0]*1.1, b[1], b[2]*0.08)); keyscale(o, f0+3, (b[0]*1.1, b[1], b[2]*0.08)); keyscale(o, f0+5, b)
for f0 in (14, 33, 106): blink(f0)
for o in eyes:  # widen while casting
    b = base[o.name]
    keyscale(o, 58, b); keyscale(o, 66, (b[0]*1.15, b[1], b[2]*1.2)); keyscale(o, 88, (b[0]*1.15, b[1], b[2]*1.2)); keyscale(o, 100, b)
for o in his:  # highlights vanish under the glow
    b = base[o.name]; keyscale(o, 60, b); keyscale(o, 64, (0, 0, 0)); keyscale(o, 90, (0, 0, 0)); keyscale(o, 98, b)
for h in halos:
    keyscale(h, 1, (0, 0, 0)); keyscale(h, 56, (0, 0, 0)); keyscale(h, 66, (1.2, 1.2, 1.2)); keyscale(h, 76, (1.0, 1.0, 1.0))
    keyscale(h, 88, (1.1, 1.1, 1.1)); keyscale(h, 100, (0, 0, 0)); keyscale(h, 120, (0, 0, 0))
keyscale(smile, 1, (1, 1, 1)); keyscale(smile, 50, (1, 1, 1)); keyscale(smile, 58, (0.7, 1, 0.4)); keyscale(smile, 63, (0, 0, 0))
keyscale(smile, 92, (0, 0, 0)); keyscale(smile, 98, (1, 1, 1))
keyscale(mopen, 1, (0, 0, 0)); keyscale(mopen, 62, (0, 0, 0)); keyscale(mopen, 66, (1.1, 1, 1.2)); keyscale(mopen, 86, (1, 1, 1))
keyscale(mopen, 93, (0, 0, 0)); keyscale(mopen, 120, (0, 0, 0))
# palm flare grows through the windup, bursts on release
for o in (O["CastFlare"], O["CastFlareGlow"]):
    keyscale(o, 1, (0, 0, 0)); keyscale(o, 44, (0, 0, 0)); keyscale(o, 60, (0.8, 0.8, 0.8)); keyscale(o, 66, (1.6, 1.6, 1.6))
    keyscale(o, 72, (1.1, 1.1, 1.1)); keyscale(o, 88, (1.15, 1.15, 1.15)); keyscale(o, 98, (0, 0, 0)); keyscale(o, 120, (0, 0, 0))
# energy stream shoots out on release and retracts after
for cn in ("EnergyStream", "EnergyStreamGlow"):
    cu = O[cn].data
    cu.bevel_factor_end = 0.0; cu.keyframe_insert("bevel_factor_end", frame=65)
    cu.bevel_factor_end = 1.0; cu.keyframe_insert("bevel_factor_end", frame=70)
    cu.bevel_factor_start = 0.0; cu.keyframe_insert("bevel_factor_start", frame=86)
    cu.bevel_factor_start = 1.0; cu.keyframe_insert("bevel_factor_start", frame=94)
# motes bob
for i, o in enumerate([o for o in CIRC.objects if o.name.startswith("Mote")]):
    z0 = o.location.z
    for f in range(1, END+1, 8):
        o.location.z = z0 + 0.06*math.sin((f/END)*2*math.pi*2 + i) + 0.1*cast_curve(f)
        o.keyframe_insert("location", index=2, frame=f)
    o.location.z = z0; o.keyframe_insert("location", index=2, frame=END)

# ---- tighter camera over the whole clip --------------------------------------
O["CircleGlow"].scale = (1.18, 1.18, 1); O["ContactShadow"].scale = (0.92, 0.85, 1)
cam = sc.camera; ASPECT = 960/640
def fit_all(margin=0.08):
    xs = []; ys = []
    for f in range(1, END+1, 3):
        sc.frame_set(f); dg = bpy.context.evaluated_depsgraph_get(); inv = cam.matrix_world.inverted()
        for o in sc.objects:
            if o.type != 'MESH' or o.hide_render: continue  # curves report bogus bounds; the stream lies between hand and circle anyway
            oe = o.evaluated_get(dg)
            if o.type == 'MESH':
                pts = [oe.matrix_world @ v.co for v in oe.data.vertices] if len(oe.data.vertices) < 3000 else [oe.matrix_world @ Vector(c) for c in oe.bound_box]
            else:
                pts = [oe.matrix_world @ Vector(c) for c in oe.bound_box]
            for p in pts:
                q = inv @ p; xs.append(q.x); ys.append(q.y)
    cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    sx, sy = max(xs)-min(xs), max(ys)-min(ys)
    cam.location = cam.matrix_world @ Vector((cx, cy, 0))
    cam.data.ortho_scale = max(sx, sy*ASPECT)/(1-2*margin)
fit_all()
sc.frame_set(1)
sc.render.resolution_x = 960; sc.render.resolution_y = 640
sc.eevee.taa_render_samples = 16
bpy.ops.wm.save_as_mainfile(filepath=OUT + "summoner.blend")
if "norender" in ARGS: sys.exit(0)
if "still" in ARGS:
    for f in [int(x) for x in ARGS[ARGS.index("still")+1].split(",")]:
        sc.frame_set(f); sc.render.filepath = OUT + f"preview/check_{f:03d}.png"; bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = OUT + "preview/frames/f_"; bpy.ops.render.render(animation=True)
print("ANIM DONE")
