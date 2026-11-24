# OverSummoned summoner proof scene. Run: blender -b -P build.py -- [preview]
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix, Euler

OUT = "/workspace/oversummoned-blender/"
ARGS = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
PREVIEW = "preview" in ARGS
RES = 512 if PREVIEW else 1024

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = "Summoner"

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(((x/12.92) if x <= 0.04045 else ((x+0.055)/1.055)**2.4) for x in c) + (1.0,)

# ---------------- materials ----------------
MATS = {}
def toon(name, hexc, shadow="#6a5a9a", spec=False):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; n = nt.nodes; l = nt.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    dif = n.new('ShaderNodeBsdfDiffuse'); dif.inputs[0].default_value = (1, 1, 1, 1)
    s2r = n.new('ShaderNodeShaderToRGB')
    ramp = n.new('ShaderNodeValToRGB'); r = ramp.color_ramp; r.interpolation = 'CONSTANT'
    sh = lin(shadow)
    r.elements[0].position = 0.0; r.elements[0].color = (sh[0]*0.9+0.05, sh[1]*0.9+0.05, sh[2]*0.9+0.05, 1)
    r.elements[1].position = 0.22; r.elements[1].color = (1, 1, 1, 1)
    if spec:
        e = r.elements.new(0.85); e.color = (1.35, 1.35, 1.35, 1)
    mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    mix.inputs[7].default_value = lin(hexc)
    em = n.new('ShaderNodeEmission')
    l.new(dif.outputs[0], s2r.inputs[0]); l.new(s2r.outputs[0], ramp.inputs[0])
    l.new(ramp.outputs[0], mix.inputs[6]); l.new(mix.outputs[2], em.inputs[0])
    l.new(em.outputs[0], out.inputs[0])
    m.diffuse_color = lin(hexc)
    MATS[name] = m; return m

def emit(name, hexc, strength=1.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = m.node_tree.nodes; n.clear()
    o = n.new('ShaderNodeOutputMaterial'); e = n.new('ShaderNodeEmission')
    e.inputs[0].default_value = lin(hexc); e.inputs[1].default_value = strength
    m.node_tree.links.new(e.outputs[0], o.inputs[0]); MATS[name] = m; return m

def glow(name, hexc, alpha=0.6, radius=1.0, strength=1.0, mode='SPHERICAL', axis_scale=(1,1,1)):
    """Blended emissive material with radial falloff in object space."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.surface_render_method = 'BLENDED'
    nt = m.node_tree; n = nt.nodes; l = nt.links; n.clear()
    o = n.new('ShaderNodeOutputMaterial')
    tc = n.new('ShaderNodeTexCoord'); mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (axis_scale[0]/radius, axis_scale[1]/radius, axis_scale[2]/radius)
    g = n.new('ShaderNodeTexGradient'); g.gradient_type = mode
    ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'EASE'
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 1.0; ramp.color_ramp.elements[1].color = (alpha, alpha, alpha, 1)
    e = n.new('ShaderNodeEmission'); e.inputs[0].default_value = lin(hexc); e.inputs[1].default_value = strength
    t = n.new('ShaderNodeBsdfTransparent'); mx = n.new('ShaderNodeMixShader')
    l.new(tc.outputs['Object'], mp.inputs[0]); l.new(mp.outputs[0], g.inputs[0])
    l.new(g.outputs[1], ramp.inputs[0]); l.new(ramp.outputs[0], mx.inputs[0])
    l.new(t.outputs[0], mx.inputs[1]); l.new(e.outputs[0], mx.inputs[2]); l.new(mx.outputs[0], o.inputs[0])
    return m, ramp

def facing_glow(name, hexc, alpha=0.8, strength=1.4):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.surface_render_method = 'BLENDED'
    nt = m.node_tree; n = nt.nodes; l = nt.links; n.clear()
    o = n.new('ShaderNodeOutputMaterial'); lw = n.new('ShaderNodeLayerWeight'); lw.inputs[0].default_value = 0.5
    ramp = n.new('ShaderNodeValToRGB'); cr = ramp.color_ramp; cr.interpolation = 'EASE'
    cr.elements[0].color = (alpha, alpha, alpha, 1); cr.elements[1].position = 0.75; cr.elements[1].color = (0, 0, 0, 1)
    e = n.new('ShaderNodeEmission'); e.inputs[0].default_value = lin(hexc); e.inputs[1].default_value = strength
    t = n.new('ShaderNodeBsdfTransparent'); mx = n.new('ShaderNodeMixShader')
    l.new(lw.outputs['Facing'], ramp.inputs[0]); l.new(ramp.outputs[0], mx.inputs[0])
    l.new(t.outputs[0], mx.inputs[1]); l.new(e.outputs[0], mx.inputs[2]); l.new(mx.outputs[0], o.inputs[0])
    return m

def shadow_mat(name, alpha=0.55, radius=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.surface_render_method = 'BLENDED'
    nt = m.node_tree; n = nt.nodes; l = nt.links; n.clear()
    o = n.new('ShaderNodeOutputMaterial'); tc = n.new('ShaderNodeTexCoord'); mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (1/radius, 1/radius, 1/radius)
    g = n.new('ShaderNodeTexGradient'); g.gradient_type = 'SPHERICAL'
    ramp = n.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0, 0, 0, 1)
    cr.elements[1].position = 0.55; cr.elements[1].color = (alpha, alpha, alpha, 1)
    t = n.new('ShaderNodeBsdfTransparent'); e = n.new('ShaderNodeEmission'); e.inputs[0].default_value = lin("#120a1c")
    mx = n.new('ShaderNodeMixShader')
    l.new(tc.outputs['Object'], mp.inputs[0]); l.new(mp.outputs[0], g.inputs[0]); l.new(g.outputs[1], ramp.inputs[0])
    l.new(ramp.outputs[0], mx.inputs[0]); l.new(t.outputs[0], mx.inputs[1]); l.new(e.outputs[0], mx.inputs[2])
    l.new(mx.outputs[0], o.inputs[0]); return m

OUTLINE = bpy.data.materials.new("Outline"); OUTLINE.use_nodes = True
_n = OUTLINE.node_tree.nodes; _n.clear()
_o = _n.new('ShaderNodeOutputMaterial'); _e = _n.new('ShaderNodeEmission'); _e.inputs[0].default_value = lin("#1a1024")
OUTLINE.node_tree.links.new(_e.outputs[0], _o.inputs[0]); OUTLINE.use_backface_culling = True; OUTLINE.use_backface_culling_shadow = True

# ---------------- helpers ----------------
def coll(name, parent=None):
    c = bpy.data.collections.new(name); (parent or sc.collection).children.link(c); return c

def place(obj, c):
    for uc in list(obj.users_collection): uc.objects.unlink(obj)
    c.objects.link(obj); return obj

def finish(obj, mat, c, outline=0.012, smooth=True, bevel=0.0):
    obj.data.materials.clear(); obj.data.materials.append(mat)
    if smooth and obj.type == 'MESH':
        for p in obj.data.polygons: p.use_smooth = True
    if bevel:
        b = obj.modifiers.new("Bevel", 'BEVEL'); b.width = bevel; b.segments = 2; b.limit_method = 'ANGLE'
    if outline:
        obj.data.materials.append(OUTLINE)
        s = obj.modifiers.new("Outline", 'SOLIDIFY'); s.thickness = outline; s.offset = 1
        s.use_flip_normals = True; s.use_rim = False; s.material_offset = 1
    return place(obj, c)

def sphere(name, loc, scale, seg=32, ring=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(scale=True); return o

def cyl(name, loc, r, depth, verts=32, r2=None, rot=(0,0,0)):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; return o

def limb(name, p1, p2, r1, r2, verts=20):
    p1, p2 = Vector(p1), Vector(p2); d = p2 - p1
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=d.length, location=(p1+p2)/2)
    o = bpy.context.object; o.name = name
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bpy.ops.object.transform_apply(rotation=True); return o

def torus(name, loc, R, r, rot=(0,0,0), scale=(1,1,1), maj=64, mn=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=maj, minor_segments=mn, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale; bpy.ops.object.transform_apply(scale=True, rotation=True); return o

def box(name, loc, size, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size; bpy.ops.object.transform_apply(scale=True); return o

def disc(name, loc, r, verts=96):
    bpy.ops.mesh.primitive_circle_add(vertices=verts, radius=r, fill_type='NGON', location=loc)
    o = bpy.context.object; o.name = name; return o

# ---------------- palette ----------------
ROBE = toon("Robe", "#5544c4", "#4c3a8a")
ROBE_D = toon("RobeDark", "#3a2f96", "#4c3a8a")
LINING = toon("Lining", "#c2417a", "#7a3a8a")
GOLD = toon("Gold", "#f0bf4c", "#a0605a", spec=True)
SKIN = toon("Skin", "#f5c9a5", "#c08aa0")
BOOT = toon("Boot", "#5a3426", "#5a3a5a")
BELT = toon("Belt", "#7b4226", "#5a3a5a")
WOOD = toon("Wood", "#9a6236", "#6a4060")
EYE = toon("Eye", "#1e1430", "#888888")
WHITE = emit("EyeHi", "#ffffff", 1.0)
STONE = toon("Stone", "#9aa0b8", "#5a5880")
STONE_T = toon("StoneTop", "#b8bdd2", "#6a6890")
STONE_D = toon("StoneDark", "#767c98", "#4a4870")
RUNE = emit("Rune", "#7ff6ff", 1.6)
RUNE_V = emit("RuneViolet", "#c69bff", 1.5)
CORE = emit("Core", "#e8ffff", 2.0)

# ---------------- pedestal (world) ----------------
CHAR_POS = Vector((-1.2, 0.15, 0))
PED = coll("Pedestal")
ped_parts = [
    (cyl("Ped_Base", CHAR_POS + Vector((0, 0, 0.06)), 0.66, 0.12, verts=8), STONE_D),
    (cyl("Ped_Column", CHAR_POS + Vector((0, 0, 0.22)), 0.52, 0.22, verts=8), STONE),
    (cyl("Ped_Top", CHAR_POS + Vector((0, 0, 0.375)), 0.6, 0.09, verts=8), STONE_T),
]
for o, m in ped_parts:
    o.rotation_euler.z = math.pi/8
    finish(o, m, PED, outline=0.016, smooth=False, bevel=0.018)
# glowing rune band on pedestal column (small rune slabs on the octagon faces)
for i in range(8):
    a = math.pi/8 + i*math.pi/4 + math.pi/8
    rr = 0.52*math.cos(math.pi/8) + 0.004
    p = CHAR_POS + Vector((math.cos(a)*rr, math.sin(a)*rr, 0.22))
    b = box(f"Ped_Rune{i}", p, (0.012, 0.12, 0.05), rot=(0, 0, a))
    finish(b, RUNE_V, PED, outline=0, smooth=False)
PED_TOP = 0.42
# contact shadow
sh = disc("ContactShadow", CHAR_POS + Vector((0.05, 0.05, 0.003)), 1.0)
sh.scale = (1.05, 0.95, 1)
place(sh, PED); sh.data.materials.append(shadow_mat("ShadowMat", 0.7, 1.0))

# soft occlusion where the boots meet the pedestal top
ao = disc("FootShadow", CHAR_POS + Vector((0.03, -0.02, PED_TOP + 0.003)), 1.0) if False else None
# ---------------- summoning circle (world) ----------------
CIRC = coll("SummonCircle")
CC = Vector((0.45, 1.25, 0.0)); R = 1.0
for nm, rad, th, mt in [("Ring_Outer", R, 0.035, RUNE), ("Ring_Mid", R*0.84, 0.022, RUNE),
                        ("Ring_Inner", R*0.34, 0.02, RUNE_V), ("Ring_Core", R*0.12, 0.018, CORE)]:
    t = torus(nm, CC + Vector((0, 0, 0.012)), rad, th, scale=(1, 1, 0.25)); finish(t, mt, CIRC, outline=0)
# hexagram
for k in range(2):
    pts = [CC + Vector((math.cos(a)*R*0.84, math.sin(a)*R*0.84, 0.012))
           for a in [math.pi/2 + k*math.pi + j*2*math.pi/3 for j in range(3)]]
    for j in range(3):
        a, b2 = pts[j], pts[(j+1) % 3]; d = b2 - a
        bx = box(f"Hex{k}{j}", (a+b2)/2, (d.length, 0.03, 0.008), rot=(0, 0, math.atan2(d.y, d.x)))
        finish(bx, RUNE_V if k else RUNE, CIRC, outline=0, smooth=False)
# rune ticks between outer and mid ring
for i in range(36):
    a = i*2*math.pi/36; rr = R*0.92
    L = 0.09 if i % 3 == 0 else 0.045
    bx = box(f"Tick{i}", CC + Vector((math.cos(a)*rr, math.sin(a)*rr, 0.012)), (L, 0.016, 0.008), rot=(0, 0, a))
    finish(bx, RUNE, CIRC, outline=0, smooth=False)
# floor glow + light column
gd = disc("CircleGlow", CC + Vector((0, 0, 0.004)), 1.0); gm, _ = glow("CircleGlowMat", "#5fd8ff", 0.55, 1.0, 1.2)
gd.scale = (1.35, 1.35, 1); place(gd, CIRC); gd.data.materials.append(gm)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=R*0.8, depth=1.6, location=CC + Vector((0, 0, 0.8)), end_fill_type='NOTHING')
col = bpy.context.object; col.name = "LightColumn"; place(col, CIRC)
cm, cramp = glow("ColumnMat", "#8fe9ff", 0.32, 1.6, 1.3, mode='LINEAR')
# linear gradient along Z: rotate mapping so gradient runs bottom (bright) -> top (clear)
mp = [n for n in cm.node_tree.nodes if n.type == 'MAPPING'][0]
mp.inputs['Rotation'].default_value = (0, math.radians(90), 0)
mp.inputs['Location'].default_value = (0, 0, 0)
mp.inputs['Scale'].default_value = (1/1.6, 1/1.6, 1/1.6)
mp.inputs['Location'].default_value = (0.5, 0, 0)  # object z in [-0.8,0.8] -> [0,1]
cramp.color_ramp.elements[0].color = (0.32, 0.32, 0.32, 1); cramp.color_ramp.elements[1].color = (0, 0, 0, 1)
_n = cm.node_tree.nodes; _l = cm.node_tree.links
_lw = _n.new('ShaderNodeLayerWeight'); _lw.inputs[0].default_value = 0.5
_inv = _n.new('ShaderNodeMath'); _inv.operation = 'POWER'
_one = _n.new('ShaderNodeMath'); _one.operation = 'SUBTRACT'; _one.inputs[0].default_value = 1.0
_l.new(_lw.outputs['Facing'], _one.inputs[1]); _l.new(_one.outputs[0], _inv.inputs[0]); _inv.inputs[1].default_value = 2.5
_mul = _n.new('ShaderNodeMath'); _mul.operation = 'MULTIPLY'
_mx = [x for x in _n if x.type == 'MIX_SHADER'][0]
_l.new(cramp.outputs[0], _mul.inputs[0]); _l.new(_inv.outputs[0], _mul.inputs[1]); _l.new(_mul.outputs[0], _mx.inputs[0])
cramp.color_ramp.elements[0].color = (0.5, 0.5, 0.5, 1)
col.data.materials.append(cm)
for p in col.data.polygons: p.use_smooth = True
# motes
import random; random.seed(11)
for i in range(14):
    a = random.uniform(0, 2*math.pi); rr = random.uniform(0.05, R*0.5)
    s_ = random.uniform(0.018, 0.035)
    m_ = sphere(f"Mote{i}", CC + Vector((math.cos(a)*rr, math.sin(a)*rr, random.uniform(0.6, 1.45))), (s_, s_, s_), seg=8, ring=6)
    finish(m_, CORE if i % 3 else RUNE_V, CIRC, outline=0)

# ---------------- summoner (built in local rest space, faces -Y) ----------------
CH = coll("Summoner")
amt = bpy.data.armatures.new("SummonerRig"); rig = bpy.data.objects.new("SummonerRig", amt); CH.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
B = {}
def bone(name, h, t, parent=None):
    b = amt.edit_bones.new(name); b.head = h; b.tail = t
    if parent: b.parent = B[parent]; b.use_connect = False
    B[name] = b; return b
# Casting arm = character's LEFT (+X local); staff arm = RIGHT (-X local)
SH_L, EL_L, HA_L = Vector((0.25, 0, 1.13)), Vector((0.42, -0.17, 1.2)), Vector((0.55, -0.36, 1.36))
SH_R, EL_R, HA_R = Vector((-0.25, 0, 1.13)), Vector((-0.41, 0.02, 0.93)), Vector((-0.48, -0.04, 0.8))
bone("root", (0, 0, 0), (0, 0, 0.3))
bone("hips", (0, 0, 0.55), (0, 0, 0.8), "root")
bone("spine", (0, 0, 0.8), (0, 0, 1.12), "hips")
bone("head", (0, 0, 1.2), (0, 0, 1.6), "spine")
bone("HatSocket", (0, 0, 1.6), (0, 0, 1.75), "head")
bone("foot.L", (0.12, 0, 0.12), (0.12, -0.2, 0.05), "root")
bone("foot.R", (-0.12, 0, 0.12), (-0.12, -0.2, 0.05), "root")
bone("upper_arm.L", SH_L, EL_L, "spine"); bone("forearm.L", EL_L, HA_L, "upper_arm.L")
bone("hand.L", HA_L, HA_L + Vector((0.0, -0.1, 0.06)), "forearm.L")
bone("upper_arm.R", SH_R, EL_R, "spine"); bone("forearm.R", EL_R, HA_R, "upper_arm.R")
bone("hand.R", HA_R, HA_R + Vector((0, -0.1, 0)), "forearm.R")
bone("WeaponSocket", HA_R, HA_R + Vector((0, 0, 0.15)), "hand.R")
bone("CastFX", HA_L + Vector((0, -0.1, 0.06)), HA_L + Vector((0, -0.25, 0.1)), "hand.L")
bpy.ops.object.mode_set(mode='OBJECT')

parts = []  # (obj, bone)
def P(o, mat, bn, outline=0.012, smooth=True):
    finish(o, mat, CH, outline=outline, smooth=smooth); parts.append((o, bn)); return o

# feet / boots planted on z=0 (pedestal top in local space)
for sx, bn in ((0.13, "foot.L"), (-0.13, "foot.R")):
    b_ = sphere(f"Boot{bn[-1]}", (sx, -0.24, 0.065), (0.095, 0.15, 0.07))
    for v in b_.data.vertices:  # flatten sole so it sits flat on the stone
        if v.co.z < 0.02: v.co.z = 0.0 + max(v.co.z, 0.0)*0.0
    P(b_, BOOT, bn)
# robe
robe = cyl("Robe", (0, 0, 0.62), 0.36, 0.96, verts=32, r2=0.22); P(robe, ROBE, "hips")
hem = torus("RobeHem", (0, 0, 0.15), 0.355, 0.03, maj=48); P(hem, GOLD, "hips")
front = box("RobeFrontPanel", (0, -0.305, 0.6), (0.09, 0.02, 0.88)); front.rotation_euler.x = -0.15
bpy.ops.object.select_all(action='DESELECT'); front.select_set(True); bpy.context.view_layer.objects.active = front
bpy.ops.object.transform_apply(rotation=True); P(front, GOLD, "hips", outline=0.008, smooth=False)
belt = torus("Belt", (0, 0, 0.8), 0.29, 0.04, maj=40, scale=(1, 0.95, 1)); P(belt, BELT, "hips")
buckle = box("Buckle", (0, -0.33, 0.8), (0.09, 0.03, 0.08)); P(buckle, GOLD, "hips", smooth=False)
chest = sphere("Chest", (0, 0, 1.02), (0.25, 0.19, 0.2)); P(chest, ROBE, "spine")
mantle = cyl("Mantle", (0, 0, 1.08), 0.3, 0.17, verts=32, r2=0.17); P(mantle, ROBE_D, "spine")
mtrim = torus("MantleTrim", (0, 0, 1.005), 0.29, 0.016, maj=48); P(mtrim, GOLD, "spine")
# head + face
head = sphere("Head", (0, -0.03, 1.38), (0.215, 0.2, 0.21)); P(head, SKIN, "head")
for sx in (0.068, -0.068):
    e = sphere("Eye", (sx*1.12, -0.215, 1.385), (0.03, 0.014, 0.048), seg=16, ring=8); P(e, EYE, "head", outline=0)
    hi = sphere("EyeHi", (sx*1.12+0.011, -0.229, 1.4), (0.009, 0.004, 0.012), seg=8, ring=6); P(hi, WHITE, "head", outline=0)
for sx in (0.12, -0.12):
    bl = sphere("Blush", (sx*1.1, -0.18, 1.32), (0.035, 0.01, 0.018), seg=12, ring=6); P(bl, toon("Blush", "#f29aa0", "#c08aa0"), "head", outline=0)
# hood: sphere shell with face opening cut out
hood = sphere("Hood", (0, 0.02, 1.43), (0.285, 0.285, 0.3), seg=40, ring=20)
bm = bmesh.new(); bm.from_mesh(hood.data)
cut = [v for v in bm.verts if v.co.y < -0.05 and 1.18 < v.co.z < 1.6]
bmesh.ops.delete(bm, geom=cut, context='VERTS'); bm.to_mesh(hood.data); bm.free()
sol = hood.modifiers.new("Thick", 'SOLIDIFY'); sol.thickness = 0.035; sol.offset = 1
hood.data.materials.append(ROBE); hood.data.materials.append(LINING)
sol.material_offset = 1  # inner shell shows lining colour... (outer=offset 0)
for p in hood.data.polygons: p.use_smooth = True
hood.data.materials.append(OUTLINE)
so = hood.modifiers.new("Outline", 'SOLIDIFY'); so.thickness = 0.012; so.offset = 1; so.use_flip_normals = True; so.use_rim = False; so.material_offset = 2
place(hood, CH); parts.append((hood, "head"))
tip = limb("HoodTip", (0, 0.22, 1.55), (0, 0.46, 1.32), 0.14, 0.02, verts=24); P(tip, ROBE, "head")
# casting arm (left, +X): sleeve, forearm sleeve with flared cuff, open hand
P(limb("SleeveUpper.L", SH_L, EL_L, 0.085, 0.075), ROBE, "upper_arm.L")
P(sphere("Elbow.L", EL_L, (0.078, 0.078, 0.078)), ROBE, "upper_arm.L")
P(limb("SleeveFore.L", EL_L, HA_L - (HA_L-EL_L).normalized()*0.02, 0.075, 0.11), ROBE, "forearm.L")
P(limb("Cuff.L", HA_L - (HA_L-EL_L).normalized()*0.05, HA_L - (HA_L-EL_L).normalized()*0.01, 0.115, 0.115), GOLD, "forearm.L")
palm = sphere("Hand.L", HA_L + Vector((0, -0.05, 0.03)), (0.06, 0.05, 0.07)); P(palm, SKIN, "hand.L")
for i, (dx, dz) in enumerate([(-0.035, 0.07), (-0.01, 0.085), (0.015, 0.08), (0.04, 0.065)]):
    f = limb(f"Finger{i}.L", HA_L + Vector((dx, -0.06, 0.05)), HA_L + Vector((dx*1.2, -0.08, 0.05+dz)), 0.017, 0.014, verts=10)
    P(f, SKIN, "hand.L", outline=0.006)
P(limb("Thumb.L", HA_L + Vector((-0.05, -0.05, 0.0)), HA_L + Vector((-0.1, -0.09, 0.04)), 0.02, 0.016, verts=10), SKIN, "hand.L", outline=0.006)
# staff arm (right, -X): hangs down, fist wrapped around the staff
P(limb("SleeveUpper.R", SH_R, EL_R, 0.085, 0.075), ROBE, "upper_arm.R")
P(sphere("Elbow.R", EL_R, (0.078, 0.078, 0.078)), ROBE, "upper_arm.R")
P(limb("SleeveFore.R", EL_R, HA_R + Vector((0, 0.03, 0.03)), 0.075, 0.105), ROBE, "forearm.R")
P(limb("Cuff.R", HA_R + Vector((0, 0.025, 0.05)), HA_R + Vector((0, 0.015, 0.02)), 0.108, 0.108), GOLD, "forearm.R")
P(sphere("Fist.R", HA_R + Vector((0, -0.01, -0.03)), (0.065, 0.065, 0.06)), SKIN, "hand.R")
# staff (in WeaponSocket) runs through the fist, butt rests on the pedestal
SX, SY = HA_R.x, HA_R.y - 0.015
STAFF = coll("Gear_Staff", CH)
def W(o, mat, outline=0.012, smooth=True):
    finish(o, mat, STAFF, outline=outline, smooth=smooth); parts.append((o, "WeaponSocket")); return o
W(cyl("StaffShaft", (SX, SY, 0.86), 0.028, 1.72, verts=16), WOOD)
W(cyl("StaffButt", (SX, SY, 0.03), 0.038, 0.06, verts=16), GOLD)
W(cyl("StaffCollar", (SX, SY, 1.7), 0.045, 0.07, verts=16), GOLD)
W(torus("StaffRing", (SX, SY, 1.86), 0.12, 0.026, rot=(math.radians(90), 0, math.radians(-32)), maj=40), GOLD)
W(torus("StaffRingInner", (SX, SY, 1.86), 0.07, 0.012, rot=(math.radians(90), 0, math.radians(-32)), maj=32), GOLD, outline=0.008)
W(cyl("StaffSpike", (SX, SY, 2.02), 0.03, 0.1, verts=12, r2=0.0), GOLD)
# cast flare in the open palm
flare = sphere("CastFlare", HA_L + Vector((0.06, -0.15, 0.09)), (0.065, 0.065, 0.065), seg=16, ring=8)
finish(flare, CORE, CH, outline=0); parts.append((flare, "CastFX"))
fg = sphere("CastFlareGlow", HA_L + Vector((0.06, -0.15, 0.09)), (0.2, 0.2, 0.2), seg=24, ring=12)
fgm = facing_glow("FlareGlowMat", "#8ff3ff", 0.85); 
place(fg, CH); fg.data.materials.append(fgm); parts.append((fg, "CastFX"))

# bone-parent every part (keep world transform)
bpy.context.view_layer.update()
for o, bn in parts:
    mw = o.matrix_world.copy(); o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = bn
    bpy.context.view_layer.update(); o.matrix_world = mw
bpy.context.view_layer.update()
# place rig on pedestal, turned 3/4 toward the circle
rig.location = CHAR_POS + Vector((0, 0, PED_TOP))
rig.rotation_euler = (0, 0, math.radians(40))
bpy.context.view_layer.update()

ao = disc("FootShadow", CHAR_POS + Vector((0.0, -0.03, 0.424)), 1.0); ao.scale = (0.46, 0.46, 1)
place(ao, PED); ao.data.materials.append(shadow_mat("FootShadowMat", 0.55, 1.0)); ao.visible_shadow = False
# energy stream from palm to circle centre
palm_w = flare.matrix_world @ (sum((Vector(c) for c in flare.bound_box), Vector()) / 8)
cu = bpy.data.curves.new("Stream", 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.014; cu.bevel_resolution = 4
sp = cu.splines.new('BEZIER'); sp.bezier_points.add(1)
p0, p1 = sp.bezier_points
p0.co = palm_w; p1.co = CC + Vector((0, 0, 0.35))
p0.handle_left = p0.co; p0.handle_right = p0.co + Vector((0.6, 0.25, 0.35))
p1.handle_left = p1.co + Vector((-0.45, -0.1, 0.55)); p1.handle_right = p1.co
cu.bevel_factor_mapping_start = 'SPLINE'
st = bpy.data.objects.new("EnergyStream", cu); CIRC.objects.link(st); cu.materials.append(CORE)
cu2 = cu.copy(); cu2.bevel_depth = 0.045
st2 = bpy.data.objects.new("EnergyStreamGlow", cu2); CIRC.objects.link(st2)
sgm, _ = glow("StreamGlowMat", "#7fe8ff", 0.35, 0.05, 1.3, mode='LINEAR'); cu2.materials.clear()
# simple flat-alpha glow for the stream
sgm2 = bpy.data.materials.new("StreamGlowFlat"); sgm2.use_nodes = True; sgm2.surface_render_method = 'BLENDED'
nn = sgm2.node_tree.nodes; nn.clear(); o_ = nn.new('ShaderNodeOutputMaterial'); e_ = nn.new('ShaderNodeEmission')
e_.inputs[0].default_value = lin("#7fe8ff"); t_ = nn.new('ShaderNodeBsdfTransparent'); m_ = nn.new('ShaderNodeMixShader')
m_.inputs[0].default_value = 0.3
sgm2.node_tree.links.new(t_.outputs[0], m_.inputs[1]); sgm2.node_tree.links.new(e_.outputs[0], m_.inputs[2])
sgm2.node_tree.links.new(m_.outputs[0], o_.inputs[0]); cu2.materials.append(sgm2)

# ---------------- lighting / render ----------------
sun_d = bpy.data.lights.new("Key", 'SUN'); sun_d.energy = 3.0; sun_d.angle = math.radians(3)
sun = bpy.data.objects.new("Key", sun_d); sc.collection.objects.link(sun)
sun.rotation_euler = Vector((-0.55, -0.75, 0.65)).normalized().to_track_quat('Z', 'Y').to_euler()
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.08, 0.1, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 1.0

sc.render.engine = 'BLENDER_EEVEE_NEXT'
sc.eevee.taa_render_samples = 16 if PREVIEW else 48
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = RES
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.render.filter_size = 1.2

cam_d = bpy.data.cameras.new("Cam"); cam_d.type = 'ORTHO'
cam = bpy.data.objects.new("Cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.rotation_euler = (math.radians(63), 0, math.radians(8))
cam.location = (0.0, 0.0, 0.0)
bpy.context.view_layer.update()

def fit_camera(cam, objs, margin=0.11):
    dg = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted(); xs = []; ys = []
    for o in objs:
        if o.hide_render or o.type not in ('MESH', 'CURVE'): continue
        oe = o.evaluated_get(dg)
        for c in oe.bound_box:
            p = inv @ (oe.matrix_world @ Vector(c)); xs.append(p.x); ys.append(p.y)
    cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    span = max(max(xs)-min(xs), max(ys)-min(ys))
    cam.location = cam.matrix_world @ Vector((cx, cy, 0)) - cam.matrix_world.to_3x3() @ Vector((0, 0, -20))
    cam.data.ortho_scale = span / (1 - 2*margin)
    cam.data.clip_end = 100
    return span

for o in list(CIRC.all_objects) + [sh, fg]:
    o.visible_shadow = False
# pull camera back along its view axis, then centre on all visible geometry with margin
cam.location = cam.matrix_world.to_3x3() @ Vector((0, 0, 20)); bpy.context.view_layer.update()
fit_camera(cam, list(sc.objects))
bpy.context.view_layer.update()

bpy.ops.wm.save_as_mainfile(filepath=OUT + "summoner.blend")
if "norender" not in ARGS:
    sc.render.filepath = OUT + ("preview.png" if PREVIEW else "test_render.png")
    bpy.ops.render.render(write_still=True)
print("DONE")
