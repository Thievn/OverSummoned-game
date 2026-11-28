extends Node2D
# Smudge, built out of separate pictures stacked on top of one another.
#
# Every picture is drawn on the same 1024 x 1024 page, so a hat drawn for one activity fits all of
# them and a new cosmetic is one picture plus one line in items.json. Nothing here is baked
# together: the fur, the cloak, the hood or hat, the face items, the desk, the props and the two
# paws are all separate, and any of them can be swapped at any moment.
#
# Order, back to front: core (head and body) · face · head item · neck item · desk · desk prop ·
# the two paws with whatever they are holding · props that stand in front of the paws · effects.

const ART := 1024.0

# a value that chases a target the way a real object would: push it and it settles
class Spring:
	var x := 0.0
	var v := 0.0
	var k := 260.0
	var damp := 19.0
	func _init(stiff := 260.0, d := 19.0) -> void:
		k = stiff
		damp = d
	func kick(a: float) -> void:
		v += a
	func step(dt: float, target := 0.0) -> float:
		var steps := maxi(1, int(ceil(dt * 240.0)))
		var h := dt / float(steps)
		for i in steps:
			v += (target - x) * k * h - v * damp * h
			x += v * h
		return x

var rig := {}
var items := {}
var art := {}                     # name -> Texture2D, loaded once

var core: Sprite2D
var cloak_layer: Sprite2D
var face_item: Sprite2D
var head_item: Sprite2D
var neck_item: Sprite2D
var desk: Sprite2D
var desk_prop: Sprite2D
var front_prop: Sprite2D
var hand: Dictionary = {}         # "l" / "r" -> Node2D that moves; the paw and its tool ride on it
var paw: Dictionary = {}          # "l" / "r" -> Sprite2D
var held: Dictionary = {}         # "l" / "r" -> Sprite2D
var faces: Node2D                 # eyes and mouth, drawn over the core
var fx: Node2D                    # dirt, ink, sparkles, the chest glow

var body := Node2D.new()

var activity := "summon"
var look := {"head": "hood", "face": "", "neck": "", "fur": "brown", "cloak": "teal", "skin": "smudge"}
var expression := "happy"
var asleep := false
var blink := 0.0
var next_blink := 3.0
var t := 0.0
var breathe := 1.0

var lift := {"l": Spring.new(300.0, 17.0), "r": Spring.new(300.0, 17.0)}
var tilt := {"l": Spring.new(300.0, 17.0), "r": Spring.new(300.0, 17.0)}
var tool_rot := Spring.new(170.0, 11.0)
var float_sw := Spring.new(90.0, 5.0)
var head_bob := Spring.new(220.0, 14.0)
var next_paw := "r"
var lid_spring := Spring.new(260.0, 20.0)

var bits: Array = []              # little flying things: dirt, ink, sparks
var pop := 0.0                    # the chest lid pops open for a moment
var glow := 0.0
var glow_col := Color(1, 1, 1)

const FUR := {
	"brown": [Color(0.30, 0.18, 0.09), Color(0.80, 0.60, 0.42), 0.0],
	"white": [Color(0.52, 0.55, 0.62), Color(1.0, 1.0, 1.0), 1.0],
	"black": [Color(0.07, 0.07, 0.10), Color(0.33, 0.34, 0.42), 1.0],
	"gold":  [Color(0.54, 0.36, 0.05), Color(1.0, 0.86, 0.48), 1.0],
	"grey":  [Color(0.22, 0.22, 0.26), Color(0.62, 0.63, 0.68), 1.0],
	"ghost": [Color(0.42, 0.62, 0.78), Color(0.88, 0.97, 1.0), 1.0],
}
const CLOAK := {
	"teal":   [Color(0.03, 0.17, 0.21), Color(0.18, 0.46, 0.52), 0.0],
	"red":    [Color(0.28, 0.05, 0.06), Color(0.74, 0.20, 0.18), 1.0],
	"purple": [Color(0.18, 0.06, 0.30), Color(0.52, 0.28, 0.78), 1.0],
	"green":  [Color(0.05, 0.20, 0.09), Color(0.26, 0.56, 0.28), 1.0],
	"black":  [Color(0.05, 0.05, 0.08), Color(0.26, 0.26, 0.32), 1.0],
	"sand":   [Color(0.40, 0.31, 0.13), Color(0.90, 0.78, 0.50), 1.0],
}


func _ready() -> void:
	rig = _json("res://rig.json")
	items = _json("res://items.json")
	add_child(body)
	core = _sprite(body, "core", true)
	core.position = _off("core")
	cloak_layer = _sprite(body, "core", true)
	cloak_layer.position = _off("core")
	_shade(cloak_layer, "mask", tex("core_cloak_mask"))
	_shade(cloak_layer, "clip_to_mask", 1.0)
	neck_item = _sprite(body, "", false)       # a scarf sits under his chin, so it goes on early
	faces = Node2D.new()
	faces.draw.connect(_draw_face)
	body.add_child(faces)
	face_item = _sprite(body, "", false)       # glasses sit over his eyes
	head_item = _sprite(body, "", false)       # the hood or a hat goes on last, over everything
	desk = _sprite(self, "desk", false)
	desk.position = _off("desk")
	desk_prop = _sprite(self, "", false)
	for s: String in ["l", "r"]:
		var h := Node2D.new()
		add_child(h)
		hand[s] = h
		paw[s] = _sprite(h, "paw_" + s, true)
		var at: Array = rig.get("paw_" + s, [367, 822])
		paw[s].position = _off("paw_" + s) - Vector2(float(at[0]), float(at[1]))
		held[s] = _sprite(h, "", false)
	front_prop = _sprite(self, "", false)
	fx = Node2D.new()
	fx.draw.connect(_draw_fx)
	add_child(fx)
	dress()
	set_activity(activity)


func _json(path: String) -> Dictionary:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		push_error("missing " + path)
		return {}
	var d = JSON.parse_string(f.get_as_text())
	return d if d is Dictionary else {}


func tex(nm: String) -> Texture2D:
	if nm == "":
		return null
	if not art.has(nm):
		var p := "res://art/%s.png" % nm
		art[nm] = load(p) if ResourceLoader.exists(p) else null
	return art[nm]


func _off(part: String) -> Vector2:
	var o: Dictionary = rig.get("off", {})
	var v: Array = o.get(part, [0, 0])
	return Vector2(float(v[0]), float(v[1]))


func _sprite(parent: Node, nm: String, tintable: bool) -> Sprite2D:
	var s := Sprite2D.new()
	s.centered = false
	s.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if nm != "":
		s.texture = tex(nm)
	if tintable:
		var m := ShaderMaterial.new()
		m.shader = load("res://fur.gdshader")
		var mk2 := tex(nm + "_fur_mask")
		if mk2:
			m.set_shader_parameter("mask", mk2)
		s.material = m
	parent.add_child(s)
	return s


# ---------------------------------------------------------------- what he is wearing

func dress(changed := {}) -> void:
	for k: String in changed:
		look[k] = changed[k]
	var skin: String = look.get("skin", "smudge")
	var base := "core" if skin == "smudge" else "core_" + skin
	if tex(base) == null:
		base = "core"
	core.texture = tex(base)
	var mk := tex(base + "_fur_mask")
	_shade(core, "mask", mk if mk else tex("core_fur_mask"))
	_fur(core, look.get("fur", "brown"))
	for s: String in ["l", "r"]:
		_fur(paw[s], look.get("fur", "brown"))
	var head: String = look.get("head", "hood")
	head_item.texture = tex(_pic(head))
	_place(head_item, head)
	if head == "hood":
		_cloak(head_item, look.get("cloak", "teal"))
	_cloak_core(look.get("cloak", "teal"))
	face_item.texture = tex(_pic(look.get("face", "")))
	_place(face_item, look.get("face", ""))
	neck_item.texture = tex(_pic(look.get("neck", "")))
	_place(neck_item, look.get("neck", ""))
	queue_redraw()


func _pic(id: String) -> String:
	if id == "":
		return ""
	var it: Dictionary = items.get("items", {}).get(id, {})
	return str(it.get("pic", id))


func _place(s: Sprite2D, id: String) -> void:
	# an item says where its own middle should land and how wide it should be; everything else
	# about where it sits comes from the rig, never from the picture
	s.visible = s.texture != null
	if s.texture == null:
		return
	var it: Dictionary = items.get("items", {}).get(id, {})
	s.material = null
	if bool(it.get("full", false)):
		# cut from the same page he was drawn on, so it goes straight back where it came from
		var nudge: Array = rig.get("hood_at", [0, 0])
		s.scale = Vector2.ONE
		s.position = _off(str(it.get("pic", id))) + Vector2(float(nudge[0]), float(nudge[1]))
		return
	var at: Array = it.get("at", rig.get("head_top", [517, 118]))
	var w := float(it.get("w", 440))
	var k := w / float(s.texture.get_width())
	s.scale = Vector2(k, k)
	s.position = Vector2(float(at[0]) - s.texture.get_width() * k * 0.5,
						 float(at[1]) - s.texture.get_height() * k * float(it.get("anchor_y", 0.0)))


func _shade(s: Sprite2D, key: String, value) -> void:
	var m := s.material as ShaderMaterial
	if m:
		m.set_shader_parameter(key, value)


func _fur(s: Sprite2D, nm: String) -> void:
	if s.material == null:
		return
	var c: Array = FUR.get(nm, FUR["brown"])
	_shade(s, "dark_col", c[0])
	_shade(s, "light_col", c[1])
	_shade(s, "amount", c[2])


func _cloak_core(nm: String) -> void:
	# the body picture has his cloak in it too; a second sprite over the top carries the new colour
	if cloak_layer == null:
		return
	var c: Array = CLOAK.get(nm, CLOAK["teal"])
	_shade(cloak_layer, "dark_col", c[0])
	_shade(cloak_layer, "light_col", c[1])
	_shade(cloak_layer, "amount", c[2])


func _cloak(s: Sprite2D, nm: String) -> void:
	var c: Array = CLOAK.get(nm, CLOAK["teal"])
	if s.material == null:
		var m := ShaderMaterial.new()
		m.shader = load("res://fur.gdshader")
		s.material = m
	var mk := tex("hood_fur_mask")
	if mk:
		_shade(s, "mask", mk)
	_shade(s, "dark_col", c[0])
	_shade(s, "light_col", c[1])
	_shade(s, "amount", c[2])


# ---------------------------------------------------------------- what he is doing

func set_activity(nm: String) -> void:
	activity = nm
	var a: Dictionary = items.get("activities", {}).get(nm, {})
	desk_prop.texture = tex(str(a.get("desk", "")))
	_prop(desk_prop, a.get("desk_at", [512, 806]), float(a.get("desk_w", 300)), 1.0)
	front_prop.texture = tex(str(a.get("front", "")))
	_prop(front_prop, a.get("front_at", [512, 870]), float(a.get("front_w", 300)), 1.0)
	for s: String in ["l", "r"]:
		var key: String = "hold_" + s
		held[s].texture = tex(str(a.get(key, "")))
		held[s].visible = held[s].texture != null
		if held[s].texture:
			# where the tool sits is given as a nudge from the middle of that paw, and how far down
			# the tool its own grip is (0 = the top of the picture, 1 = the bottom)
			var at: Array = a.get(key + "_at", [0, 0])
			var w := float(a.get(key + "_w", 120))
			var k := w / float(held[s].texture.get_width())
			var grip: Array = a.get(key + "_grip", [0.5, 0.5])
			held[s].scale = Vector2(k, k)
			held[s].offset = -Vector2(float(held[s].texture.get_width()) * float(grip[0]),
									  float(held[s].texture.get_height()) * float(grip[1]))
			held[s].position = Vector2(float(at[0]), float(at[1]))
			held[s].rotation = deg_to_rad(float(a.get(key + "_rot", 0.0)))
	queue_redraw()


func _prop(s: Sprite2D, at, w: float, anchor_y: float) -> void:
	s.visible = s.texture != null
	if s.texture == null:
		return
	var k := w / float(s.texture.get_width())
	s.scale = Vector2(k, k)
	s.position = Vector2(float(at[0]) - s.texture.get_width() * k * 0.5,
						 float(at[1]) - s.texture.get_height() * k * anchor_y)


# ---------------------------------------------------------------- one key, one movement

func tap() -> void:
	if asleep:
		return
	var a: Dictionary = items.get("activities", {}).get(activity, {})
	var which := str(a.get("hand", "alt"))
	var s := next_paw
	if which != "alt":
		s = which
	next_paw = "l" if next_paw == "r" else "r"
	match activity:
		"summon":
			lift[s].kick(-520.0)                 # the stamp comes down on the book
			head_bob.kick(-130.0)
			_spray("ink", Vector2(540, 790), 5)
		"fish":
			tool_rot.kick(-5.6)                  # the rod flicks and the float swings after it
			float_sw.kick(3.4)
			head_bob.kick(-55.0)
			if randf() < 0.06:
				_spray("splash", Vector2(690, 770), 7)
		"dig":
			lift[s].kick(-470.0)
			tool_rot.kick(4.4)
			head_bob.kick(-90.0)
			_spray("dirt", Vector2(430, 790), 6)
		"pick":
			lift[s].kick(-150.0)
			tilt[s].kick(-7.0 if s == "l" else 7.0)
			tool_rot.kick(5.0 if s == "l" else -5.0)
			head_bob.kick(-40.0)
			if randf() < 0.05:
				pop = 1.0
				_spray("spark", Vector2(512, 800), 6)


func _spray(kind: String, at: Vector2, n: int) -> void:
	for i in n:
		bits.append({
			"kind": kind, "p": at + Vector2(randf_range(-26, 26), randf_range(-10, 10)),
			"v": Vector2(randf_range(-150, 150), randf_range(-430, -210)),
			"life": randf_range(0.45, 0.9), "age": 0.0, "r": randf_range(3.0, 7.0),
		})
	if bits.size() > 90:
		bits = bits.slice(bits.size() - 90)


func chest_glow(col: Color, strength := 1.0) -> void:
	glow_col = col
	glow = strength


# ---------------------------------------------------------------- every frame

func _process(dt: float) -> void:
	t += dt
	dt = minf(dt, 0.05)
	var a: Dictionary = items.get("activities", {}).get(activity, {})
	for s: String in ["l", "r"]:
		var rest := float(a.get("rest_" + s, 0.0))
		var y: float = lift[s].step(dt, -rest)
		var r: float = tilt[s].step(dt, 0.0)
		var at: Array = rig.get("paw_" + s, [367, 822])
		hand[s].position = Vector2(float(at[0]), float(at[1]) + y)
		hand[s].rotation = deg_to_rad(r)
	held["r"].rotation = deg_to_rad(float(a.get("hold_r_rot", 0.0)) + tool_rot.step(dt, 0.0))
	if held["l"].texture:
		held["l"].rotation = deg_to_rad(float(a.get("hold_l_rot", 0.0)) - tool_rot.x * 0.6)
	float_sw.step(dt, 0.0)
	var bob := head_bob.step(dt, 0.0)

	# he breathes, and the whole of him leans a touch when he works
	breathe = 1.0 + sin(t * 1.5) * (0.004 if asleep else 0.009)
	# he swells a little as he breathes and sinks a touch as he works, both about the point where
	# the desk hides him, so his feet never move
	var pivot := Vector2(float(rig.get("chest", [517, 650])[0]), float(rig.get("desk_top", 806)))
	var sc := Vector2(2.0 - breathe, breathe)
	body.transform = Transform2D(0.0, sc, 0.0, pivot - pivot * sc + Vector2(0.0, bob * 0.10))

	# blinking, and the eyes closing when he nods off
	if asleep:
		lid_spring.step(dt, 1.0)
	else:
		next_blink -= dt
		if next_blink <= 0.0:
			next_blink = randf_range(2.6, 6.5)
			blink = 0.16
		blink = maxf(0.0, blink - dt)
		lid_spring.step(dt, 1.0 if blink > 0.0 else 0.0)

	for b: Dictionary in bits:
		b["age"] += dt
		var v: Vector2 = b["v"]          # a Vector2 inside a dictionary has to be put back, not poked
		v.y += 1250.0 * dt
		b["v"] = v
		b["p"] = b["p"] + v * dt
	bits = bits.filter(func(b): return b["age"] < b["life"])
	pop = maxf(0.0, pop - dt * 1.4)
	glow = maxf(0.0, glow - dt * 0.55)
	if front_prop.texture:
		front_prop.offset.y = -14.0 * pop      # the chest lid jumps when a pin gives
	faces.queue_redraw()
	fx.queue_redraw()


# ---------------------------------------------------------------- the face
# His eyes and mouth are drawn, not pictures, so he can pull any expression without new art.
# Each one paints over the drawn eye in his own fur colour first, then draws the new shape.

func _fur_at() -> Color:
	var c: Array = FUR.get(look.get("fur", "brown"), FUR["brown"])
	if float(c[2]) < 0.5:
		return Color(0.47, 0.31, 0.18)
	return Color(c[0]).lerp(Color(c[1]), 0.55)


func _draw_face() -> void:
	var ink := Color(0.07, 0.05, 0.05)
	var shut: float = clampf(lid_spring.x, 0.0, 1.0)
	var e := expression
	if asleep:
		e = "sleepy"
	for side: String in ["l", "r"]:
		var at: Array = rig.get("eye_" + side, [426, 291])
		var c := Vector2(float(at[0]), float(at[1]))
		var r := float(rig.get("eye_r_px", 42))
		match e:
			"happy", "cheer":
				_cover(c, r)
				_arc(faces, c + Vector2(0, 6), r * 0.78, ink, true)
			"angry":
				_cover(c, r)
				faces.draw_circle(c + Vector2(0, 4), r * 0.46, ink)
				var dx := (1.0 if side == "l" else -1.0)
				faces.draw_line(c + Vector2(-r * 0.8 * dx, -r * 0.78), c + Vector2(r * 0.8 * dx, -r * 0.30), ink, 9.0, true)
			"sleepy":
				_cover(c, r)
				_arc(faces, c, r * 0.72, ink, false)
			"surprised":
				_cover(c, r)
				faces.draw_circle(c, r * 0.72, Color(1, 1, 1))
				faces.draw_arc(c, r * 0.72, 0, TAU, 40, ink, 7.0, true)
				faces.draw_circle(c, r * 0.34, ink)
			"focused":
				if shut > 0.02:
					_cover(c, r * (0.55 + 0.45 * shut))
					if shut > 0.45:
						_arc(faces, c, r * 0.70, ink, false)
			_:
				if shut > 0.02:
					_cover(c, r * (0.55 + 0.45 * shut))
					if shut > 0.45:
						_arc(faces, c, r * 0.70, ink, false)
	_draw_mouth(e, ink)


func _cover(c: Vector2, r: float) -> void:
	# paint the drawn eye out in his own fur, so a new one can be drawn in its place
	var f := _fur_at()
	faces.draw_circle(c + Vector2(0, 2), r * 1.12, f)
	faces.draw_circle(c + Vector2(-r * 0.25, -r * 0.45), r * 0.75, f.lightened(0.06))


func _arc(n: Node2D, c: Vector2, r: float, col: Color, up: bool) -> void:
	var pts := PackedVector2Array()
	for i in 17:
		var a := PI * float(i) / 16.0
		var y := sin(a) * r * 0.5
		if up:
			y = -sin(a) * r * 0.62
		pts.append(c + Vector2(-cos(a) * r, y))
	n.draw_polyline(pts, col, 9.0, true)


func _draw_mouth(e: String, ink: Color) -> void:
	var at: Array = rig.get("mouth", [521, 396])
	var c := Vector2(float(at[0]), float(at[1]))
	var w := float(rig.get("mouth_w", 186)) * 0.5
	if e == "surprised":
		faces.draw_circle(c + Vector2(0, 10), 26.0, Color(0.32, 0.12, 0.14))
		faces.draw_arc(c + Vector2(0, 10), 26.0, 0, TAU, 32, ink, 7.0, true)
	elif e == "cheer":
		var pts := PackedVector2Array()
		for i in 15:
			var a := PI * float(i) / 14.0
			pts.append(c + Vector2(-cos(a) * w * 0.8, sin(a) * 40.0))
		faces.draw_colored_polygon(pts, Color(0.36, 0.14, 0.16))
		faces.draw_polyline(pts, ink, 8.0, true)
	elif e == "angry":
		faces.draw_line(c + Vector2(-w * 0.6, 8), c + Vector2(w * 0.6, 8), ink, 9.0, true)
	elif e == "focused":
		# hard at it: the tip of his tongue comes out
		faces.draw_circle(c + Vector2(14, 24), 20.0, Color(0.85, 0.42, 0.45))
		faces.draw_arc(c + Vector2(14, 24), 20.0, 0, TAU, 24, ink, 5.0, true)


# ---------------------------------------------------------------- effects

const BIT_COL := {
	"ink": Color(0.09, 0.11, 0.2), "dirt": Color(0.36, 0.23, 0.12),
	"splash": Color(0.55, 0.82, 0.88), "spark": Color(1.0, 0.86, 0.45),
}

func _draw_fx() -> void:
	# the line and float, drawn rather than painted, so they can swing on their own
	if activity == "fish" and held["r"].texture:
		var tip := _rod_tip()
		var sway := float_sw.x
		var fa: Array = items["activities"]["fish"].get("float_at", [690, 742])
		var fl := Vector2(float(fa[0]) + sway * 7.0, float(fa[1]) - absf(sway) * 3.0)
		fx.draw_line(tip, fl, Color(0.95, 0.95, 0.98, 0.85), 3.0, true)
		fx.draw_circle(fl, 15.0, Color(0.86, 0.22, 0.18))
		fx.draw_circle(fl + Vector2(0, -8), 15.0, Color(0.96, 0.96, 0.96))
		fx.draw_arc(fl, 15.0, 0, TAU, 24, Color(0.1, 0.07, 0.07), 3.0, true)
	for b: Dictionary in bits:
		var f: float = 1.0 - b["age"] / b["life"]
		var col: Color = BIT_COL.get(b["kind"], Color(1, 1, 1))
		col.a = clampf(f * 1.4, 0.0, 1.0)
		fx.draw_circle(b["p"], float(b["r"]) * (0.4 + f * 0.8), col)
	if glow > 0.001:
		var at := Vector2(512, 790)
		for i in 9:
			var ang := float(i) / 9.0 * TAU + t * 0.6
			var ray := glow_col
			ray.a = 0.20 * glow
			var p1 := at + Vector2(cos(ang), sin(ang) * 0.55) * 60.0
			var p2 := at + Vector2(cos(ang), sin(ang) * 0.55) * (210.0 + 90.0 * glow)
			fx.draw_line(p1, p2, ray, 26.0, true)
		var c2 := glow_col
		c2.a = 0.45 * glow
		fx.draw_circle(at, 90.0 * (0.6 + glow * 0.6), c2)


func _rod_tip() -> Vector2:
	var s: Sprite2D = held["r"]
	if s.texture == null:
		return Vector2.ZERO
	var local := Vector2(float(s.texture.get_width()) * 0.88, float(s.texture.get_height()) * 0.06)
	return hand["r"].transform * (s.transform * local)
