extends Node2D
# Smudge as a puppet. Every pose is cut into real parts (head, arms, tail, rod...)
# that turn around their own joints, plus a face drawn on top of the head:
# eyelids that blink, squint and droop, and a mouth that opens when he talks.
# rig.json (made by tools/puppet.py) says where every part and joint is.

var rig := {}
var poses := {}            # pose name -> {root, parts{name: Node2D}, face: Node2D}
var pose := ""
var springs := {}          # part name -> [angle, velocity]
var t := 0.0

# face state
var blink := 0.0           # 1 = fully closed, falls back to 0
var blink_wait := 2.0
var talk := 0.0            # seconds of talking left
var happy := 0.0           # seconds of happy squint left
var sleepy := 0.0          # 0..1 drooping lids
var mouth_open := 0.0
var look := 0.0            # head tilt he drifts toward when idle
var look_wait := 3.0
var busy := 0.0            # 0..1 how hard he is working (set by main)
var face_data := {}

func setup(rig_data: Dictionary) -> void:
	rig = rig_data
	for pname in rig:
		var e: Dictionary = rig[pname]
		var root := Node2D.new()
		root.visible = false
		add_child(root)
		var foot := Vector2(e["foot"][0], e["foot"][1])
		var parts := {}
		var behind: Array = []
		var front: Array = []
		for p in e["parts"]:
			if str(p["mode"]) == "behind":
				behind.append(p)
			else:
				front.append(p)
		for p in behind:
			parts[str(p["name"])] = _make_part(root, pname, p, foot)
		var base := Sprite2D.new()
		base.texture = load("res://art/puppet/%s_base.png" % pname)
		base.centered = false
		base.position = -foot
		root.add_child(base)
		for p in front:
			parts[str(p["name"])] = _make_part(root, pname, p, foot)
		var face: Node2D = null
		if e.get("face") != null and parts.has("head"):
			face = Node2D.new()
			face.set_meta("pose", pname)
			face.draw.connect(_draw_face.bind(face))
			parts["head"].add_child(face)
		poses[pname] = {"root": root, "parts": parts, "face": face}

func _make_part(root: Node2D, pname: String, p: Dictionary, foot: Vector2) -> Node2D:
	var pivot := Vector2(p["pivot"][0], p["pivot"][1])
	var holder := Node2D.new()
	holder.position = pivot - foot
	holder.set_meta("pivot", pivot)
	holder.set_meta("rest", pivot - foot)
	root.add_child(holder)
	var s := Sprite2D.new()
	s.texture = load("res://art/puppet/%s_%s.png" % [pname, str(p["name"])])
	s.centered = false
	s.position = Vector2(p["offset"][0], p["offset"][1]) - pivot
	holder.add_child(s)
	return holder

func set_pose(p: String) -> void:
	if p == pose or not poses.has(p):
		return
	if pose != "":
		poses[pose]["root"].visible = false
	pose = p
	var root: Node2D = poses[p]["root"]
	root.visible = true
	root.modulate.a = 0.0
	create_tween().tween_property(root, "modulate:a", 1.0, 0.18)
	springs.clear()

func kick(part: String, amount: float) -> void:
	var b: Array = springs.get(part, [0.0, 0.0])
	b[1] = float(b[1]) + amount
	springs[part] = b

func say(seconds: float) -> void:
	talk = seconds

func cheer(seconds: float) -> void:
	happy = seconds
	kick("tail", 8.0)

# a point on the current pose picture -> position in the parent's space
func point(img: Vector2) -> Vector2:
	var e: Dictionary = rig[pose]
	return position + (img - Vector2(e["foot"][0], e["foot"][1])) * scale

func named_point(key: String) -> Vector2:
	var e: Dictionary = rig[pose]
	if e.has(key):
		return point(Vector2(e[key][0], e[key][1]))
	return point(Vector2(e["bag"][0], e["bag"][1]))

# a point that rides on a moving part (the rod tip, the shovel blade)
func part_point(part: String, img: Vector2) -> Vector2:
	var parts: Dictionary = poses[pose]["parts"]
	if not parts.has(part):
		return point(img)
	var h: Node2D = parts[part]
	var pivot: Vector2 = h.get_meta("pivot")
	return position + (h.position + (img - pivot).rotated(h.rotation)) * scale

func size() -> Vector2:
	var e: Dictionary = rig[pose]
	return Vector2(e["size"][0], e["size"][1]) * scale

func top_left() -> Vector2:
	return point(Vector2.ZERO)

func _process(delta: float) -> void:
	if pose == "":
		return
	t += delta
	var dt := minf(delta, 0.05)
	# springs: stiff and well damped, so a part snaps out and settles in a quarter second
	var steps := maxi(1, int(ceil(dt * 240.0)))
	var h_step := dt / float(steps)
	for k in springs:
		var b: Array = springs[k]
		var a := float(b[0])
		var v := float(b[1])
		for i in steps:      # small fixed steps, so it moves the same at any frame rate
			v += (-300.0 * a - 18.0 * v) * h_step
			a += v * h_step
		springs[k] = [a, v]
	# idle glances: now and then he tips his head a little, then comes back
	look_wait -= delta
	if look_wait <= 0.0:
		look_wait = randf_range(2.5, 6.0)
		look = randf_range(-0.07, 0.07) if randf() < 0.7 else 0.0
	# blinking
	blink = maxf(0.0, blink - delta * 7.0)
	blink_wait -= delta
	if blink_wait <= 0.0:
		blink_wait = randf_range(2.2, 5.5)
		blink = 1.0
		if randf() < 0.2:
			blink_wait = 0.25    # a quick double blink
	talk = maxf(0.0, talk - delta)
	happy = maxf(0.0, happy - delta)
	var target_mouth := 0.0
	if talk > 0.0:
		target_mouth = 0.35 + 0.65 * absf(sin(t * 17.0) * sin(t * 6.3 + 1.0))
	mouth_open = lerpf(mouth_open, target_mouth, 1.0 - exp(-30.0 * delta))

	var parts: Dictionary = poses[pose]["parts"]
	for pname in parts:
		var h: Node2D = parts[pname]
		var ang := float(springs.get(pname, [0.0, 0.0])[0])
		match str(pname):
			"head":
				var cur: float = h.get_meta("look", 0.0)
				cur = lerpf(cur, look * (1.0 - busy), 1.0 - exp(-4.0 * delta))
				h.set_meta("look", cur)
				ang += cur
				ang = clampf(ang, -0.22, 0.22)
			"tail":
				ang += sin(t * 1.3) * 0.06 + sin(t * 2.9) * 0.025 + (sin(t * 14.0) * 0.12 if happy > 0.0 else 0.0)
				ang = clampf(ang, -0.5, 0.5)
			"feet":
				ang += sin(t * 1.5) * 0.09
			"rod":
				ang += sin(t * 0.9) * 0.012
				ang = clampf(ang, -0.3, 0.2)
			"arm":
				# the arm now swings from the shoulder under the cloak, so it needs no slide
				ang = clampf(ang, -0.2, 1.7)
			"over":
				ang = 0.0   # the cloak drape and fists that sit on top of a moving part stay put
			"hand_a", "hand_b":
				ang = clampf(ang, -0.3, 0.3)
			"shovel":
				ang = clampf(ang, -0.25, 0.45)
		h.rotation = ang
	var face: Node2D = poses[pose]["face"]
	if face != null:
		face.queue_redraw()

func _lid() -> float:
	return clampf(maxf(blink, sleepy * 0.55), 0.0, 1.0)

func _draw_face(face: Node2D) -> void:
	var pname := str(face.get_meta("pose"))
	var e: Dictionary = rig[pname]
	var f: Dictionary = e["face"]
	var head: Node2D = face.get_parent()
	var pivot: Vector2 = head.get_meta("pivot")
	var fur := Color8(int(f["fur"][0]), int(f["fur"][1]), int(f["fur"][2]))
	var ink := Color("#1c1420")
	var lid := _lid()
	for eye in f["eyes"]:
		var c := Vector2(eye[0], eye[1]) - pivot
		var r := Vector2(float(eye[2]) * 1.25, float(eye[3]) * 1.3)
		if happy > 0.0:
			# happy: eyes shut into two upward curves
			face.draw_colored_polygon(_ellipse_pts(c, r, 0.0, 1.0), fur)
			var arc := PackedVector2Array()
			for i in 9:
				var u := float(i) / 8.0
				arc.append(c + Vector2((u - 0.5) * 2.0 * r.x * 0.8, r.y * 0.25 - sin(u * PI) * r.y * 0.7))
			face.draw_polyline(arc, ink, 3.0, true)
		elif lid > 0.02:
			var pts := _ellipse_pts(c, r, 0.0, lid)
			if pts.size() >= 3:
				face.draw_colored_polygon(pts, fur)
				var y := c.y - r.y + 2.0 * r.y * lid
				var half := r.x * sqrt(maxf(0.0, 1.0 - pow((y - c.y) / r.y, 2.0)))
				face.draw_line(Vector2(c.x - half, y), Vector2(c.x + half, y), ink, 2.5, true)
	var m: Array = f["mouth"]
	if mouth_open > 0.05 and float(m[2]) > 0.0:
		var mc := Vector2(m[0], m[1]) - pivot
		var mr := Vector2(float(m[2]), float(m[3]) * mouth_open + 1.0)
		face.draw_colored_polygon(_ellipse_pts(mc, mr + Vector2(1.5, 1.5), 0.0, 1.0), ink)
		face.draw_colored_polygon(_ellipse_pts(mc, mr, 0.0, 1.0), Color("#5a1f2c"))
		if mouth_open > 0.4:
			face.draw_colored_polygon(_ellipse_pts(mc + Vector2(0, mr.y * 0.45), Vector2(mr.x * 0.6, mr.y * 0.5), 0.0, 1.0), Color("#f08a94"))

# An ellipse, or just its top slice down to `frac` of its height (for eyelids).
func _ellipse_pts(c: Vector2, r: Vector2, _start: float, frac: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	var y_cut := -r.y + 2.0 * r.y * frac
	for i in 28:
		var a := TAU * float(i) / 28.0
		var p := Vector2(cos(a) * r.x, sin(a) * r.y)
		if p.y > y_cut:
			var half := r.x * sqrt(maxf(0.0, 1.0 - pow(y_cut / r.y, 2.0)))
			p = Vector2(clampf(p.x, -half, half), y_cut)
		pts.append(c + p)
	# drop repeated points so the polygon stays valid
	var clean := PackedVector2Array()
	for p in pts:
		if clean.is_empty() or clean[clean.size() - 1].distance_to(p) > 0.3:
			clean.append(p)
	return clean
