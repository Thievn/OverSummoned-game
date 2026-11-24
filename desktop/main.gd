extends Node2D
# OverSummoned Desk, sample build.
# Smudge sits on the taskbar. Every key press or click on his window powers
# whatever he is doing at his current location: summoning heroes in the Archive,
# fishing off the Roman dock at Ostia, or picking the speakeasy safe.

const Data = preload("res://data.gd")
const OverlayScript = preload("res://overlay.gd")
const RigShader = preload("res://shaders/rig.gdshader")
const SceneShader = preload("res://shaders/scene.gdshader")

# ------------------------------------------------------------ layout (scene art pixels)
const WIN := Vector2(640, 380)
const SCENE_X := 8.0
const SCENE_SCALES := {"archive": 0.6, "dock": 0.62, "speakeasy": 0.5}
const POSE_SCALES := {"archive": 0.34, "dock": 0.35, "speakeasy": 0.38}
# where Smudge's anchor point lands in each scene (scene image pixels)
const ANCHOR := {"archive": Vector2(440, 350), "dock": Vector2(610, 300), "speakeasy": Vector2(470, 600)}
# where he curls up to sleep, if not his work spot (on the planks, not over the water)
const SLEEP_ANCHOR := {"dock": Vector2(430, 272)}
const CIRCLE := Vector2(440, 382)
const CIRCLE_R := Vector2(186, 44)
const BOB := Vector2(765, 358)          # where the line meets the Tiber
const DIAL := Vector2(615, 305)         # the safe's brass dial

# ------------------------------------------------------------ Smudge's rig (pose image pixels)
# The point of each pose that sits on the scene anchor: his seat on the pier,
# his knee on the speakeasy floor, his feet everywhere else.
const FOOT := {"fish": Vector2(250, 355), "pick": Vector2(257, 522)}
# Where his backpack is in each pose: loot flies here.
const BAG_AT := {
	"stand": Vector2(55, 240), "slap_up": Vector2(100, 165), "slap_down": Vector2(105, 150),
	"fish": Vector2(60, 250), "pick": Vector2(120, 250), "sleep": Vector2(240, 180), "cheer": Vector2(110, 190),
}
const LEDGER_AT := Vector2(330, 380)   # the open book in both slap poses
const ROD_TIP := Vector2(470, 50)
# Soft bones: name, pivot, center of the area it moves, radius of that area, where the soft edge starts.
const RIG := {
	"fish": [
		["rod", Vector2(262, 248), Vector2(430, 140), Vector2(190, 150), 0.7],
		["head", Vector2(205, 165), Vector2(215, 85), Vector2(80, 78), 0.55],
		["feet", Vector2(265, 365), Vector2(285, 440), Vector2(70, 75), 0.5],
		["tail", Vector2(140, 390), Vector2(125, 475), Vector2(55, 75), 0.5],
	],
	"pick": [
		["hand_a", Vector2(370, 212), Vector2(455, 205), Vector2(80, 28), 0.5],
		["hand_b", Vector2(370, 250), Vector2(455, 250), Vector2(80, 28), 0.5],
		["head", Vector2(320, 165), Vector2(345, 95), Vector2(80, 75), 0.55],
		["tail", Vector2(140, 445), Vector2(60, 470), Vector2(85, 55), 0.5],
	],
	"slap_up": [
		["arm", Vector2(380, 195), Vector2(465, 95), Vector2(100, 100), 0.55],
		["head", Vector2(300, 190), Vector2(310, 110), Vector2(80, 80), 0.55],
		["tail", Vector2(130, 330), Vector2(60, 280), Vector2(60, 70), 0.5],
	],
	"slap_down": [
		["head", Vector2(300, 190), Vector2(300, 110), Vector2(80, 80), 0.55],
	],
	"stand": [
		["head", Vector2(150, 140), Vector2(160, 80), Vector2(70, 70), 0.55],
		["tail", Vector2(300, 450), Vector2(345, 420), Vector2(70, 70), 0.5],
	],
	"sleep": [
		["head", Vector2(290, 235), Vector2(290, 150), Vector2(95, 90), 0.55],
	],
	"cheer": [],
}

# ------------------------------------------------------------ rules
const MAX_TAPS_PER_SEC := 20.0
const ANIM_GAP := 0.07          # a new tap animation at most this often
const YAWN_AFTER := 25.0
const SLEEP_AFTER := 60.0
const SAVE_PATH := "user://oversummoned_desk.cfg"
const SKILLS := ["Summoning", "Fishing", "Lockpicking"]
const MODELS := ["gpt-4o-mini", "claude-haiku-5-5", "grok-4-1-fast-non-reasoning"]

# ------------------------------------------------------------ nodes and art
var tex := {}
var masks := {}
var loot_tex := {}
var hero_tex := {}
var sfx := {}
var font_body: FontFile
var font_title: FontFile

var scene_sprite: Sprite2D
var scene_mat: ShaderMaterial
var overlay        # overlay.gd under Smudge (untyped so its fields are reachable)
var overlay_top    # overlay.gd above Smudge
var last_passthrough := PackedVector2Array()
var smudge_root: Node2D
var smudge: Sprite2D
var rig_mat: ShaderMaterial
var zzz: Label
var hud_title: Label
var hud_sub: Label
var hud_bar: ProgressBar
var hud_count: Label
var bubble: PanelContainer
var bubble_label: Label
var menu: PanelContainer
var tab_boxes := {}
var tab_buttons := {}
var bag_hint: Label
var places_box: VBoxContainer
var roster_grid: GridContainer
var bag_grid: GridContainer
var coins_label: Label
var mode_option: OptionButton
var ai_provider: OptionButton
var ai_model: LineEdit
var ai_key: LineEdit
var ai_status: Label
var http: HTTPRequest
var ambience: AudioStreamPlayer

# ------------------------------------------------------------ save data
var loc_index := 0
var progress := {"archive": 0.0, "dock": 0.0, "speakeasy": 0.0}
var pins_done := 0
var xp := {"Summoning": 0, "Fishing": 0, "Lockpicking": 0}
var bag := {}
var roster := {}
var coins := 0
var total_taps := 0
var mode := "salty"
var api_provider := 0
var api_model := ""
var api_key := ""
var sound_on := true
var key_sounds := false
var test_mode := false
var demo_typing := false
var size_index := 1

# ------------------------------------------------------------ live state
var t := 0.0
var since_tap := 0.0
var tap_budget := MAX_TAPS_PER_SEC
var rate := 0.0
var asleep := false
var yawned := false
var squash := Vector2.ZERO        # x = amount, y = velocity
var slap_timer := 0.0
var cheer_timer := 0.0
var anim_gap := 0.0
var bobber_dip := 0.0
var circle_flash := 0.0
var chatter_timer := 70.0
var activity := 0.0              # smoothed typing speed, 0..1 (only for wind and ambience)
var bones := {}                  # bone name -> [angle, velocity] springs, kicked by taps
var hand_flip := false
var ripples: Array = []          # ages of rings at the bobber
var fliers: Array = []           # loot and heroes flying into the bag
var floaters: Array = []         # floating text (level ups, item names)
var bursts: Array = []           # ring bursts
var papers: Array = []           # loose ledger pages flying in the Archive
var sparks: Array = []           # little sparks at the safe dial
var dial_spin := 0.0
var lean := Vector2.ZERO         # x = amount, y = velocity (leaning into the safe)
var travel_t := -1.0             # time-travel animation clock, -1 when not travelling
var travel_to := 0
var travel_swapped := false
var menu_drag := false
var menu_drag_from := Vector2.ZERO
var scene_scale := 0.6
var pose_scale := 0.34
var demo_timer := 0.0
var save_timer := 10.0
var dragging := false
var drag_offset := Vector2i.ZERO

# ============================================================ setup

func _ready() -> void:
	get_viewport().transparent_bg = true
	randomize()
	_load_art()
	_load_game()
	_apply_window_size()
	_place_window()

	scene_sprite = Sprite2D.new()
	scene_sprite.centered = false
	scene_mat = ShaderMaterial.new()
	scene_mat.shader = SceneShader
	scene_sprite.material = scene_mat
	add_child(scene_sprite)

	overlay = OverlayScript.new()
	overlay.main = self
	overlay.layer = 0
	add_child(overlay)

	smudge_root = Node2D.new()
	add_child(smudge_root)
	smudge = Sprite2D.new()
	rig_mat = ShaderMaterial.new()
	rig_mat.shader = RigShader
	smudge.material = rig_mat
	smudge_root.add_child(smudge)

	overlay_top = OverlayScript.new()
	overlay_top.main = self
	overlay_top.layer = 1
	add_child(overlay_top)

	zzz = _label(18, true)
	zzz.text = "z Z z"
	zzz.visible = false
	add_child(zzz)

	_build_hud()
	_build_bubble()
	_build_menu()

	ambience = AudioStreamPlayer.new()
	ambience.volume_db = -16.0
	add_child(ambience)

	http = HTTPRequest.new()
	http.timeout = 15.0
	http.request_completed.connect(_on_ai_reply)
	add_child(http)

	_enter_location(false)
	get_tree().auto_accept_quit = false

func _load_art() -> void:
	for k in ["stand", "slap_up", "slap_down", "sleep", "cheer", "fish", "pick"]:
		tex[k] = load("res://art/smudge/%s.png" % k)
	for l in Data.LOCATIONS:
		var id := str(l["id"])
		tex["scene_" + id] = load("res://art/scenes/%s.png" % id)
		masks[id] = load("res://art/scenes/%s_mask.png" % id)
	for table in Data.LOOT.values():
		for row in table:
			loot_tex[row[1]] = load("res://art/loot/%s.png" % row[1])
	for h in Data.HEROES:
		hero_tex[h[0]] = load("res://art/heroes/%s.png" % h[0])
	for n in ["tick", "slap", "plop", "catch", "pin", "unlock", "summon", "sparkle", "level", "whoosh", "blip"]:
		sfx[n] = load("res://sfx/%s.wav" % n)
	font_body = load("res://fonts/Nunito.ttf")
	font_title = load("res://fonts/LilitaOne.ttf")

func _place_window() -> void:
	var usable := DisplayServer.screen_get_usable_rect()
	var win := DisplayServer.window_get_size()
	DisplayServer.window_set_position(usable.end - win - Vector2i(16, 0))

func _apply_window_size() -> void:
	var factor: float = [0.75, 1.0, 1.3][clampi(size_index, 0, 2)]
	if menu != null and menu.visible:
		factor = maxf(factor, 1.0)   # the menu always opens at a readable size
	var old_pos := DisplayServer.window_get_position()
	var old_size := DisplayServer.window_get_size()
	var new_size := Vector2i(int(WIN.x * factor), int(WIN.y * factor))
	if new_size == old_size:
		return
	DisplayServer.window_set_size(new_size)
	if menu != null:
		DisplayServer.window_set_position(old_pos + old_size - new_size)   # keep the bottom-right corner put

# ============================================================ locations

func _loc() -> Dictionary:
	return Data.LOCATIONS[loc_index]

func _loc_id() -> String:
	return str(_loc()["id"])

func _skill() -> String:
	return str(_loc()["skill"])

func _level(skill: String) -> int:
	return Data.level_for_xp(int(xp.get(skill, 0)))

# Taps needed for the next drop here. Higher levels are a little faster.
func _need() -> float:
	var base := float(_loc()["taps"])
	var lvl := _level(_skill())
	var f := maxf(0.6, 1.0 - 0.004 * float(lvl - 1))
	return base * f

# scene image pixels -> window pixels
func _sp(p: Vector2) -> Vector2:
	return scene_sprite.position + p * scene_scale

func _enter_location(talk: bool) -> void:
	var id := _loc_id()
	var stex: Texture2D = tex["scene_" + id]
	scene_scale = float(SCENE_SCALES.get(id, 0.6))
	pose_scale = float(POSE_SCALES.get(id, 0.34))
	scene_sprite.texture = stex
	scene_sprite.scale = Vector2.ONE * scene_scale
	scene_sprite.position = Vector2(SCENE_X, WIN.y - 6.0 - stex.get_height() * scene_scale)
	scene_mat.set_shader_parameter("mask", masks[id])
	smudge_root.position = _sp(ANCHOR[id])
	ripples.clear()
	fliers.clear()
	bones.clear()
	_set_pose()
	_start_ambience()
	_update_hud()
	overlay.queue_redraw()
	if talk:
		_say("move")
	_save_game()

# Smudge opens the ledger, a time portal swirls round him, the old place folds
# away and the new one blooms in. About a second, start to finish.
func _travel(index: int) -> void:
	if index == loc_index or travel_t >= 0.0:
		return
	travel_to = index
	travel_t = 0.0
	travel_swapped = false
	_close_menu()
	asleep = false
	since_tap = 0.0
	_play("summon", 1.3, -8.0)

const TRAVEL_OUT := 0.55
const TRAVEL_IN := 0.55

func _update_travel(delta: float) -> void:
	if travel_t < 0.0:
		return
	travel_t += delta
	if not travel_swapped and travel_t >= TRAVEL_OUT:
		travel_swapped = true
		loc_index = travel_to
		pins_done = 0
		_enter_location(true)
		_play("whoosh", 1.0, -4.0)
		_refresh_places()
	var k := 0.0
	if travel_t < TRAVEL_OUT:
		k = travel_t / TRAVEL_OUT
	elif travel_t < TRAVEL_OUT + TRAVEL_IN:
		k = 1.0 - (travel_t - TRAVEL_OUT) / TRAVEL_IN
	else:
		travel_t = -1.0
		k = 0.0
	var e := k * k * (3.0 - 2.0 * k)
	scene_sprite.modulate = Color(1.0 + e * 0.6, 1.0 + e * 1.2, 1.0 + e * 1.1, 1.0 - e)
	scene_sprite.scale = Vector2.ONE * scene_scale * (1.0 - e * 0.08)
	smudge.modulate = Color(1.0 + e * 0.8, 1.0 + e * 1.5, 1.0 + e * 1.4, 1.0 - e * 0.85)

func _pose_name() -> String:
	if asleep:
		return "sleep"
	if cheer_timer > 0.0 and str(_loc()["kind"]) == "summon":
		return "cheer"
	match str(_loc()["kind"]):
		"summon":
			return "slap_down" if slap_timer > 0.0 else "slap_up"
		"fish":
			return "fish"
		"lock":
			return "pick"
	return "stand"

func _foot(p: String) -> Vector2:
	if FOOT.has(p):
		return FOOT[p]
	var tx: Texture2D = tex[p]
	return Vector2(tx.get_width() / 2.0, tx.get_height())

# a point on the current pose image -> window pixels
func _pose_point(img: Vector2) -> Vector2:
	var p := _pose_name()
	return smudge_root.position + (img - _foot(p)) * pose_scale

func _set_pose() -> void:
	var p := _pose_name()
	var id := _loc_id()
	var spot: Vector2 = SLEEP_ANCHOR[id] if (p == "sleep" and SLEEP_ANCHOR.has(id)) else ANCHOR[id]
	smudge_root.position = _sp(spot)
	var tx: Texture2D = tex[p]
	if smudge.texture != tx:
		smudge.texture = tx
		smudge.offset = tx.get_size() / 2.0 - _foot(p)
		rig_mat.set_shader_parameter("tex_size", tx.get_size())

# ============================================================ every frame

func _process(delta: float) -> void:
	t += delta
	var dt := minf(delta, 0.05)
	since_tap += delta
	tap_budget = minf(MAX_TAPS_PER_SEC, tap_budget + MAX_TAPS_PER_SEC * delta)
	rate = maxf(0.0, rate - rate * 1.5 * delta)
	slap_timer = maxf(0.0, slap_timer - delta)
	cheer_timer = maxf(0.0, cheer_timer - delta)
	anim_gap = maxf(0.0, anim_gap - delta)
	bobber_dip = maxf(0.0, bobber_dip - 30.0 * delta)
	circle_flash = maxf(0.0, circle_flash - delta * 1.5)
	activity = lerpf(activity, clampf(rate / 6.0, 0.0, 1.0), 1.0 - exp(-4.0 * delta))
	scene_mat.set_shader_parameter("wind", activity)

	# demo typing (Settings): a steady fake typist so you can watch without typing
	if demo_typing:
		demo_timer -= delta
		if demo_timer <= 0.0:
			demo_timer = randf_range(0.12, 0.35)
			_tap()

	# idle moods
	if not asleep and since_tap > YAWN_AFTER and not yawned:
		yawned = true
		_say("idle")
	if not asleep and since_tap > SLEEP_AFTER:
		asleep = true
		_say("sleep")
	zzz.visible = asleep
	if asleep:
		zzz.position = _pose_point(Vector2(380, 60)) + Vector2(0, sin(t * 1.4) * 4.0)
		zzz.modulate.a = 0.55 + 0.35 * sin(t * 1.8)

	# chatter while you work
	chatter_timer -= delta
	if chatter_timer <= 0.0:
		chatter_timer = randf_range(70.0, 140.0)
		if not asleep:
			_say("busy" if rate > 2.0 else "idle")

	# a small spring on the whole body; breathing scales from the seat or feet, so he stays planted
	squash.y += (-160.0 * squash.x - 16.0 * squash.y) * dt
	squash.x += squash.y * dt
	var breathe := sin(t * (1.3 if asleep else 2.0)) * (0.018 if asleep else 0.010)
	smudge.scale = Vector2(pose_scale * (1.0 + squash.x * 0.4 - breathe * 0.4), pose_scale * (1.0 - squash.x + breathe))
	# leaning into the safe on each pick
	lean.y += (-260.0 * lean.x - 24.0 * lean.y) * dt
	lean.x += lean.y * dt
	smudge.position = Vector2(lean.x * 6.0, 0)
	smudge.rotation = lean.x * 0.04
	dial_spin += delta * (0.4 + activity * 3.0)
	scene_mat.set_shader_parameter("flicker", activity)
	_set_pose()
	_update_rig(dt)
	_update_effects(delta)
	_update_travel(delta)

	overlay.queue_redraw()
	overlay_top.queue_redraw()
	_update_passthrough()

	save_timer -= delta
	if save_timer <= 0.0:
		save_timer = 10.0
		_save_game()

# ------------------------------------------------------------ the rig

func _kick(bone: String, amount: float) -> void:
	var b: Array = bones.get(bone, [0.0, 0.0])
	b[1] = float(b[1]) + amount
	bones[bone] = b

func _bone(bone: String) -> float:
	return float(bones.get(bone, [0.0, 0.0])[0])

# Springs settle in about a quarter second, so motion stops when typing stops.
func _update_rig(dt: float) -> void:
	for k in bones:
		var b: Array = bones[k]
		var a := float(b[0])
		var v := float(b[1])
		v += (-220.0 * a - 22.0 * v) * dt
		a += v * dt
		bones[k] = [a, v]
	var p := _pose_name()
	var list: Array = RIG.get(p, [])
	var ba := PackedVector4Array()
	var bb := PackedVector4Array()
	for bone in list:
		var bname := str(bone[0])
		var ang := _bone(bname)
		match bname:
			"head":
				ang += sin(t * 0.8) * 0.025 if not asleep else sin(t * 1.3) * 0.05
			"tail":
				ang += sin(t * 1.2) * 0.07
			"feet":
				ang += sin(t * 1.6) * 0.07
			"rod":
				ang += sin(t * 1.1) * 0.012
			"arm":
				ang += sin(t * 2.0) * 0.03
		var pivot: Vector2 = bone[1]
		var center: Vector2 = bone[2]
		var rad: Vector2 = bone[3]
		ba.append(Vector4(pivot.x, pivot.y, center.x, center.y))
		bb.append(Vector4(rad.x, rad.y, ang, float(bone[4])))
	while ba.size() < 4:
		ba.append(Vector4.ZERO)
		bb.append(Vector4(1, 1, 0, 0.5))
	rig_mat.set_shader_parameter("bone_a", ba)
	rig_mat.set_shader_parameter("bone_b", bb)
	rig_mat.set_shader_parameter("bone_count", list.size())

# The rod tip, following the rod bone.
func _rod_tip() -> Vector2:
	var pivot: Vector2 = RIG["fish"][0][1]
	var ang := _bone("rod") + sin(t * 1.1) * 0.012
	var tip := pivot + (ROD_TIP - pivot).rotated(ang)
	return smudge_root.position + (tip - _foot("fish")) * smudge.scale

# ------------------------------------------------------------ flying things

func _update_effects(delta: float) -> void:
	var keep: Array = []
	for a in ripples:
		var age := float(a) + delta
		if age < 1.4:
			keep.append(age)
	ripples = keep
	keep = []
	for f in fliers:
		f["t"] = float(f["t"]) + delta
		var total := float(f["rise"]) + float(f["hold"]) + float(f["fly"])
		if float(f["t"]) < total:
			keep.append(f)
		elif not bool(f.get("landed", false)):
			f["landed"] = true
			squash.y -= 1.2
			_play("plop", randf_range(0.95, 1.1), -6.0)
	fliers = keep
	keep = []
	for f in floaters:
		f["t"] = float(f["t"]) + delta
		if float(f["t"]) < 1.6:
			keep.append(f)
	floaters = keep
	keep = []
	for b in bursts:
		b["t"] = float(b["t"]) + delta
		if float(b["t"]) < 0.8:
			keep.append(b)
	bursts = keep
	keep = []
	for p in papers:
		p["t"] = float(p["t"]) + delta
		var v: Vector2 = p["v"]
		v.y += 140.0 * delta                       # gravity, but paper is light
		v.x += sin(float(p["t"]) * 5.0 + float(p["w"])) * 160.0 * delta   # flutter
		v *= 1.0 - 1.6 * delta                     # air drag
		p["v"] = v
		p["p"] = (p["p"] as Vector2) + v * delta
		p["r"] = float(p["r"]) + float(p["w"]) * delta
		if float(p["t"]) < float(p["life"]):
			keep.append(p)
	papers = keep
	keep = []
	for sp in sparks:
		sp["t"] = float(sp["t"]) + delta
		var v2: Vector2 = sp["v"]
		v2.y += 260.0 * delta
		sp["v"] = v2
		sp["p"] = (sp["p"] as Vector2) + v2 * delta
		if float(sp["t"]) < 0.45:
			keep.append(sp)
	sparks = keep

# Something pops out at `from`, hangs for a moment, then shrinks into `to`.
func _fly(texture: Texture2D, from: Vector2, to: Vector2, big: float, rise: float, hold: float, fly: float, lift := 40.0) -> void:
	if texture == null:
		return
	fliers.append({"tex": texture, "from": from, "to": to, "big": big, "rise": rise, "hold": hold, "fly": fly, "lift": lift, "t": 0.0})

func _float_text(text: String, at: Vector2, col: Color, size := 16) -> void:
	floaters.append({"text": text, "at": at, "col": col, "size": size, "t": 0.0})

func _bag_point() -> Vector2:
	return _pose_point(BAG_AT.get(_pose_name(), Vector2(80, 200)))

# ============================================================ input

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if menu.visible and _menu_has_text_focus():
			return
		if event.keycode == KEY_ESCAPE and menu.visible:
			_close_menu()
			return
		_tap()
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_RIGHT:
			dragging = mb.pressed
			drag_offset = DisplayServer.mouse_get_position() - DisplayServer.window_get_position()
		elif mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			if menu.visible and menu.get_global_rect().has_point(mb.position):
				return
			if _smudge_rect().has_point(mb.position):
				_toggle_menu()
			else:
				_tap()
	elif event is InputEventMouseMotion and dragging:
		DisplayServer.window_set_position(DisplayServer.mouse_get_position() - drag_offset)

func _menu_has_text_focus() -> bool:
	var f := get_viewport().gui_get_focus_owner()
	return f is LineEdit

func _smudge_rect() -> Rect2:
	var tx: Texture2D = smudge.texture
	var top_left := _pose_point(Vector2.ZERO)
	var sz := tx.get_size() * pose_scale
	return Rect2(top_left + sz * Vector2(0.15, 0.05), sz * Vector2(0.7, 0.9))

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		_save_game()
		get_tree().quit()

# Clicks on the empty, see-through parts of the window go to the desktop.
func _update_passthrough() -> void:
	if menu.visible:
		_set_passthrough(PackedVector2Array())
		return
	var s := DisplayServer.window_get_size()
	var k := float(s.x) / WIN.x
	var r := Rect2(scene_sprite.position, scene_sprite.texture.get_size() * scene_scale)
	r = r.merge(_smudge_rect()).merge(Rect2(Vector2(6, 6), Vector2(232, 74)))
	_set_passthrough(PackedVector2Array([
		(r.position * k).round(), (Vector2(r.end.x, r.position.y) * k).round(), (r.end * k).round(), (Vector2(r.position.x, r.end.y) * k).round()]))

# Only touch the OS window region when it actually changes.
func _set_passthrough(poly: PackedVector2Array) -> void:
	if poly == last_passthrough:
		return
	last_passthrough = poly
	DisplayServer.window_set_mouse_passthrough(poly)

# ============================================================ the tap

func _tap() -> void:
	if tap_budget < 1.0:
		return   # over 20 taps a second: ignored (no key-repeat or macro farming)
	tap_budget -= 1.0
	since_tap = 0.0
	yawned = false
	rate += 1.0
	total_taps += 1
	if asleep:
		asleep = false
		_say("wake")
	if key_sounds:
		_play("tick", randf_range(0.92, 1.08), -18.0)

	# one tap, one motion
	if anim_gap <= 0.0:
		anim_gap = ANIM_GAP
		match str(_loc()["kind"]):
			"summon":
				slap_timer = 0.11
				_kick("head", 1.4)
				squash.y += 0.5
				circle_flash = maxf(circle_flash, 0.15)
				_play("slap", randf_range(0.9, 1.1), -10.0)
				if randf() < 0.35 and papers.size() < 14:
					_spawn_paper()
			"fish":
				_kick("rod", 1.8)
				bobber_dip = maxf(bobber_dip, 3.0)
				if ripples.size() < 6:
					ripples.append(0.0)
			"lock":
				hand_flip = not hand_flip
				_kick("hand_a" if hand_flip else "hand_b", -1.8 if hand_flip else 1.8)
				_kick("head", 0.5)
				lean.y += 2.2 if hand_flip else 1.4
				dial_spin += 0.35 if hand_flip else -0.25
				if randf() < 0.5:
					_spark(2)

	var amount := 10.0 if test_mode else 1.0
	var id := _loc_id()
	progress[id] = float(progress.get(id, 0.0)) + amount
	match str(_loc()["kind"]):
		"summon":
			if float(progress[id]) >= _need():
				progress[id] = 0.0
				_summon()
		"fish":
			if float(progress[id]) >= _need():
				progress[id] = 0.0
				_catch()
		"lock":
			if float(progress[id]) >= _need():
				progress[id] = 0.0
				pins_done += 1
				_play("pin", pow(1.122, float(pins_done - 1)), -4.0)   # each pin a step higher
				_spark(8)
				_gain("Lockpicking", Data.XP_PIN)
				if pins_done >= int(_loc().get("pins", 5)):
					pins_done = 0
					_unlock()
				elif randf() < 0.25:
					_say("pin")
	_update_hud()

func _gain(skill: String, amount: int) -> void:
	var before := _level(skill)
	xp[skill] = int(xp.get(skill, 0)) + amount
	if _level(skill) > before:
		_level_up(skill)

func _level_up(skill: String) -> void:
	_play("level", 1.0, -4.0)
	var at := _pose_point(Vector2(260, 60))
	bursts.append({"at": smudge_root.position + Vector2(0, -60), "t": 0.0})
	_float_text("%s Lv %d" % [skill, _level(skill)], at, Color("#FFD35C"), 20)
	_refresh_places()

# ============================================================ rewards

func _summon() -> void:
	var luck := float(_level("Summoning")) * 0.15
	var weights := {}
	for r in Data.RARITY_WEIGHT:
		var w := float(Data.RARITY_WEIGHT[r])
		if r in ["rare", "epic", "legendary"]:
			w += luck
		weights[r] = w
	var rarity := _weighted_key(weights)
	var pool: Array = []
	for h in Data.HEROES:
		if h[5] == rarity:
			pool.append(h)
	var hero: Array = pool[randi() % pool.size()]
	var id := str(hero[0])
	var count := int(roster.get(id, 0))
	roster[id] = count + 1
	circle_flash = 1.0
	_play("summon", 1.0, -4.0)
	# the hero rises out of the circle, stands a moment, then folds into the ledger
	var c := _sp(CIRCLE)
	_fly(hero_tex[id], c, _pose_point(LEDGER_AT), 150.0, 0.7, 1.1, 0.45, 70.0)
	var label := str(hero[1])
	if count > 0:
		_add_bag("Card Shard", 1)
		label += "  (dupe: +1 shard)"
	_float_text(label, Vector2(c.x, minf(c.y + 34.0, WIN.y - 10.0)), Data.RARITY_COLOR[rarity], 16)
	_gain("Summoning", Data.XP_SUMMON)
	if rarity in ["epic", "legendary", "rare"]:
		cheer_timer = 1.2
	_say_find(Data.HERO_LINES.get(id, []), "summon_rare" if rarity in ["epic", "legendary", "rare"] else "summon", 1.0)
	_refresh_roster()

func _catch() -> void:
	var row := _roll_loot("dock", "Fishing")
	_add_bag(str(row[0]), 1)
	bobber_dip = 9.0
	ripples.append_array([0.0, 0.12, 0.24])
	_kick("rod", -4.0)
	_play("catch", 1.0, -6.0)
	var b := _sp(BOB)
	_fly(loot_tex[row[1]], b, _bag_point(), 64.0, 0.35, 0.35, 0.55, 50.0)
	_float_text(str(row[0]), b + Vector2(0, -70), _rarity_color(str(row[4])), 14)
	_gain("Fishing", Data.XP_CATCH)
	if str(row[4]) != "common":
		cheer_timer = 0.9
	_say_find(Data.FINDS.get(str(row[0]), []), "catch", 1.0 if str(row[4]) != "common" else 0.6)

func _unlock() -> void:
	var n := 2 + (1 if _level("Lockpicking") >= 10 else 0)
	var d := _sp(DIAL)
	var best: Array = []
	var best_rank := -1
	for i in n:
		var row := _roll_loot("speakeasy", "Lockpicking")
		var rank := ["common", "uncommon", "rare", "epic"].find(str(row[4]))
		if rank > best_rank:
			best_rank = rank
			best = row
		_add_bag(str(row[0]), 1)
		_fly(loot_tex[row[1]], d + Vector2(i * 18 - 18, 0), _bag_point(), 56.0, 0.3 + i * 0.15, 0.3, 0.55, 45.0)
		if i == 0:
			_float_text(str(row[0]), d + Vector2(0, -70), _rarity_color(str(row[4])), 14)
	coins += randi_range(5, 20)
	_gain("Lockpicking", Data.XP_UNLOCK)
	cheer_timer = 1.1
	_play("unlock", 1.0, -4.0)
	_spark(20)
	_say_find(Data.FINDS.get(str(best[0]), []), "unlock", 1.0)

# Smudge reacts to the actual thing he found, in his current voice.
func _say_find(lines: Array, fallback: String, chance: float) -> void:
	if randf() > chance:
		return
	if api_key != "" and randf() < 0.5:
		_ask_ai(fallback)
		return
	var i := ["sweet", "salty", "unhinged"].find(mode)
	if lines.size() == 3 and i >= 0:
		_say_text(str(lines[i]))
	else:
		_say(fallback)

func _spawn_paper() -> void:
	var from := _pose_point(LEDGER_AT) + Vector2(randf_range(-10, 10), -6)
	papers.append({"p": from, "v": Vector2(randf_range(-110, 110), randf_range(-230, -150)),
		"r": randf() * TAU, "w": randf_range(-6.0, 6.0), "t": 0.0, "life": randf_range(1.4, 2.2), "s": randf_range(0.8, 1.2)})

func _spark(n: int) -> void:
	var at := _sp(DIAL)
	for i in n:
		var a := randf() * TAU
		sparks.append({"p": at, "v": Vector2(cos(a), sin(a) - 0.6) * randf_range(40, 130), "t": 0.0})

func _rarity_color(r: String) -> Color:
	return Data.RARITY_COLOR.get(r, Color.WHITE)

func _roll_loot(table: String, skill: String) -> Array:
	var rows: Array = Data.LOOT[table]
	var luck := float(_level(skill)) * 0.08
	var total := 0.0
	for r in rows:
		total += float(r[2]) + (luck if str(r[4]) != "common" else 0.0)
	var pick := randf() * total
	for r in rows:
		pick -= float(r[2]) + (luck if str(r[4]) != "common" else 0.0)
		if pick <= 0.0:
			return r
	return rows[0]

func _weighted_key(weights: Dictionary) -> String:
	var total := 0.0
	for k in weights:
		total += float(weights[k])
	var pick := randf() * total
	for k in weights:
		pick -= float(weights[k])
		if pick <= 0.0:
			return str(k)
	return str(weights.keys()[0])

func _add_bag(item: String, n: int) -> void:
	bag[item] = int(bag.get(item, 0)) + n
	_refresh_bag()

func _item_value(item: String) -> int:
	for table in Data.LOOT.values():
		for row in table:
			if str(row[0]) == item:
				return int(row[3])
	return 1

func _item_icon(item: String) -> Texture2D:
	for table in Data.LOOT.values():
		for row in table:
			if str(row[0]) == item:
				return loot_tex[row[1]]
	return null

func _sell_extras() -> void:
	var earned := 0
	for item in bag.keys():
		var n := int(bag[item])
		if n > 1:
			earned += (n - 1) * _item_value(str(item))
			bag[item] = 1
	coins += earned
	_refresh_bag()
	_play("sparkle" if earned > 0 else "blip", 1.0, -6.0)
	_say_text("Sold the extras for %d coins." % earned if earned > 0 else "Nothing extra to sell yet.")

# ============================================================ drawing the effects

func draw_overlay(c: Node2D, layer: int) -> void:
	if layer == 1:
		_draw_top(c)
		return
	match str(_loc()["kind"]):
		"summon":
			_draw_circle_part(c, false)
		"fish":
			var bob := _sp(BOB) + Vector2(0, bobber_dip + sin(t * 1.7) * 1.2)
			for a in ripples:
				var age := float(a)
				var rr := 5.0 + age * 26.0
				var al := clampf(0.9 - age * 0.65, 0.0, 1.0)
				_ellipse(c, _sp(BOB) + Vector2(0, 3), Vector2(rr, rr * 0.32), 0.0, 1.0, Color(0.85, 1.0, 1.0, al), 2.0)
			c.draw_circle(bob + Vector2(0, 2), 6.0, Color(0, 0, 0, 0.25))
			c.draw_circle(bob, 5.5, Color("#0B1020"))
			c.draw_circle(bob, 4.5, Color("#FF4A3A"))
			c.draw_rect(Rect2(bob + Vector2(-4.5, 0.5), Vector2(9, 4)), Color("#F4F1E8"))
			c.draw_circle(bob + Vector2(-1.5, -2.0), 1.4, Color(1, 1, 1, 0.9))
		"lock":
			pass

# Above Smudge: the fishing line, flying loot, bursts and floating text.
func _draw_top(c: Node2D) -> void:
	if str(_loc()["kind"]) == "summon":
		_draw_circle_part(c, true)
		for p in papers:
			var age := float(p["t"]) / float(p["life"])
			var a := 1.0 - maxf(0.0, age - 0.7) / 0.3
			var flip := cos(float(p["t"]) * 7.0 + float(p["w"]))   # pages turn as they tumble
			var sz := Vector2(13.0 * absf(flip) + 2.0, 16.0) * float(p["s"])
			c.draw_set_transform(p["p"], float(p["r"]), Vector2.ONE)
			c.draw_rect(Rect2(-sz / 2.0, sz), Color(0.96, 0.9, 0.76, a))
			c.draw_rect(Rect2(-sz / 2.0, sz), Color(0.35, 0.25, 0.15, a * 0.8), false, 1.0)
			for li in 3:
				var y := -sz.y / 2.0 + 4.0 + li * 4.0
				c.draw_line(Vector2(-sz.x / 2.0 + 2.0, y), Vector2(sz.x / 2.0 - 2.0, y), Color(0.3, 0.25, 0.2, a * 0.6), 1.0)
		c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if str(_loc()["kind"]) == "lock":
		var dial := _sp(DIAL)
		var pins := int(_loc().get("pins", 5))
		var f2 := clampf(float(progress.get("speakeasy", 0.0)) / _need(), 0.0, 1.0)
		# the dial turns as you pick
		var dr := 13.0
		c.draw_arc(dial, dr, 0.0, TAU, 28, Color(1.0, 0.85, 0.4, 0.25 + 0.4 * activity), 2.0, true)
		c.draw_line(dial, dial + Vector2(cos(dial_spin), sin(dial_spin)) * dr, Color("#FFE7A0"), 2.0, true)
		for i in pins:
			var p := dial + Vector2(16 + i * 12, 78)
			var col := Color("#FFC83D") if i < pins_done else Color(0.12, 0.16, 0.28, 0.9)
			c.draw_rect(Rect2(p - Vector2(4, 7), Vector2(8, 14)), col)
			if i == pins_done:
				c.draw_rect(Rect2(p + Vector2(-4, 7 - 14 * f2), Vector2(8, 14 * f2)), Color(1, 0.85, 0.4, 0.8))
			c.draw_rect(Rect2(p - Vector2(4, 7), Vector2(8, 14)), Color("#0B1020"), false, 1.5)
	for sp in sparks:
		var u := float(sp["t"]) / 0.45
		c.draw_circle(sp["p"], 1.8 * (1.0 - u) + 0.6, Color(1.0, 0.85 + 0.15 * (1.0 - u), 0.5, 1.0 - u))
	if travel_t >= 0.0:
		_draw_portal(c)
	if str(_loc()["kind"]) == "fish" and _pose_name() == "fish":
		var tip := _rod_tip()
		var bob := _sp(BOB) + Vector2(0, bobber_dip + sin(t * 1.7) * 1.2)
		var pts := PackedVector2Array()
		var sag := 18.0 - minf(12.0, bobber_dip * 1.5)
		for i in 13:
			var u := float(i) / 12.0
			pts.append(tip.lerp(bob, u) + Vector2(0, sin(u * PI) * sag))
		c.draw_polyline(pts, Color(0.95, 0.97, 1.0, 0.85), 1.1, true)
	for b in bursts:
		var k := float(b["t"]) / 0.8
		var at: Vector2 = b["at"]
		c.draw_arc(at, 20.0 + k * 70.0, 0.0, TAU, 48, Color(1.0, 0.85, 0.35, 1.0 - k), 4.0 * (1.0 - k) + 1.0, true)
		c.draw_arc(at, 10.0 + k * 45.0, 0.0, TAU, 40, Color(0.5, 1.0, 0.92, (1.0 - k) * 0.8), 2.0, true)
	for f in fliers:
		var tt := float(f["t"])
		var rise := float(f["rise"])
		var hold := float(f["hold"])
		var fly := float(f["fly"])
		var from: Vector2 = f["from"]
		var to: Vector2 = f["to"]
		var big := float(f["big"])
		var top := from + Vector2(0, -float(f["lift"]))
		var pos := top
		var side := big
		var alpha := 1.0
		if tt < rise:
			var u := ease(tt / rise, -2.0)
			pos = from.lerp(top, u)
			side = lerpf(big * 0.2, big, u)
			alpha = clampf(u * 2.0, 0.0, 1.0)
		elif tt < rise + hold:
			pos = top + Vector2(0, sin((tt - rise) * 6.0) * 2.0)
		else:
			var u2 := clampf((tt - rise - hold) / fly, 0.0, 1.0)
			var e := u2 * u2
			pos = top.lerp(to, e) + Vector2(0, -sin(u2 * PI) * 30.0)
			side = lerpf(big, 10.0, e)
			alpha = 1.0 - maxf(0.0, u2 - 0.85) / 0.15
		var tx: Texture2D = f["tex"]
		var sz := tx.get_size()
		var k2 := side / maxf(sz.x, sz.y)
		var draw_size := sz * k2
		c.draw_texture_rect(tx, Rect2(pos - draw_size / 2.0, draw_size), false, Color(1, 1, 1, alpha))
	for f in floaters:
		var u3 := float(f["t"]) / 1.6
		var at2: Vector2 = f["at"]
		var size := int(f["size"])
		var text := str(f["text"])
		var w := font_title.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
		var p2 := Vector2(clampf(at2.x - w / 2.0, 6.0, WIN.x - w - 6.0), at2.y - u3 * 30.0)
		var a := 1.0 - maxf(0.0, u3 - 0.6) / 0.4
		c.draw_string_outline(font_title, p2, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, 6, Color(0.04, 0.06, 0.12, a))
		var col: Color = f["col"]
		col.a = a
		c.draw_string(font_title, p2, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)

# The summon circle. The back half is drawn under Smudge and the front half over
# him, so he stands inside the ring and you can watch it close around him.
func _draw_circle_part(c: Node2D, front: bool) -> void:
	var center := _sp(CIRCLE)
	var rad := CIRCLE_R * scene_scale
	var f := clampf(float(progress.get("archive", 0.0)) / _need(), 0.0, 1.0)
	_ellipse_half(c, center, rad, 1.0, Color(0.5, 1.0, 0.92, 0.22), 6.0, front)
	_ellipse_half(c, center, rad, f, Color(0.55, 1.0, 0.93, 0.95), 4.0, front)
	_ellipse_half(c, center, rad * 0.86, f, Color(0.55, 1.0, 0.93, 0.35), 2.0, front)
	if not front:
		# as the ring nears closing, the middle starts to glow
		var g := clampf((f - 0.7) / 0.3, 0.0, 1.0)
		g = maxf(g, circle_flash)
		if g > 0.0:
			for i in 6:
				var k := 1.0 - float(i) / 6.0
				_fill_ellipse(c, center, rad * (0.25 + 0.7 * k), Color(0.45, 1.0, 0.9, 0.07 * g * (1.0 + 0.3 * sin(t * 4.0))))
	if circle_flash > 0.0:
		_ellipse_half(c, center, rad * (1.0 + (1.0 - circle_flash) * 0.6), 1.0, Color(0.6, 1.0, 0.95, circle_flash), 8.0, front)

func _fill_ellipse(c: Node2D, center: Vector2, rad: Vector2, col: Color) -> void:
	var pts := PackedVector2Array()
	for i in 40:
		var a := TAU * float(i) / 40.0
		pts.append(center + Vector2(cos(a) * rad.x, sin(a) * rad.y))
	c.draw_colored_polygon(pts, col)

# Part of an ellipse from the top, clockwise, keeping only the back (upper) or front (lower) half.
func _ellipse_half(c: Node2D, center: Vector2, rad: Vector2, frac: float, col: Color, width: float, front: bool) -> void:
	if frac <= 0.0:
		return
	var n := maxi(3, int(96 * frac))
	var pts := PackedVector2Array()
	for i in n + 1:
		var a := -PI / 2.0 + TAU * frac * float(i) / float(n)
		var lower := sin(a) > 0.0
		if lower == front:
			pts.append(center + Vector2(cos(a) * rad.x, sin(a) * rad.y))
		elif pts.size() > 1:
			c.draw_polyline(pts, col, width, true)
			pts = PackedVector2Array()
		else:
			pts = PackedVector2Array()
	if pts.size() > 1:
		c.draw_polyline(pts, col, width, true)

# A swirl of teal rings and sparks around Smudge while he jumps through time.
func _draw_portal(c: Node2D) -> void:
	var k := travel_t / TRAVEL_OUT if travel_t < TRAVEL_OUT else 1.0 - (travel_t - TRAVEL_OUT) / TRAVEL_IN
	k = clampf(k, 0.0, 1.0)
	var center := smudge_root.position + Vector2(0, -70)
	for i in 5:
		var r := (30.0 + i * 22.0) * (0.4 + k)
		var a0 := travel_t * (6.0 - i) + i
		c.draw_arc(center, r, a0, a0 + PI * 1.3, 32, Color(0.5, 1.0, 0.92, k * (0.9 - i * 0.12)), 3.0 - i * 0.3, true)
	for i in 18:
		var a := float(i) / 18.0 * TAU + travel_t * 4.0
		var r2 := 40.0 + 80.0 * fmod(float(i) * 0.37 + travel_t, 1.0)
		c.draw_circle(center + Vector2(cos(a), sin(a) * 0.7) * r2 * (0.5 + k * 0.8), 2.0, Color(1.0, 0.95, 0.7, k))
	_fill_ellipse(c, center, Vector2(60, 60) * k, Color(0.7, 1.0, 0.95, k * 0.25))

func _ellipse(c: Node2D, center: Vector2, rad: Vector2, start: float, frac: float, col: Color, width: float) -> void:
	if frac <= 0.0:
		return
	var pts := PackedVector2Array()
	var n := maxi(3, int(64 * frac))
	for i in n + 1:
		var a := -PI / 2.0 + TAU * frac * float(i) / float(n) + start
		pts.append(center + Vector2(cos(a) * rad.x, sin(a) * rad.y))
	c.draw_polyline(pts, col, width, true)

# ============================================================ HUD, bubble, popup

func _label(font_px: int, outline: bool, title := false) -> Label:
	var l := Label.new()
	l.add_theme_font_override("font", font_title if title else font_body)
	l.add_theme_font_size_override("font_size", font_px)
	l.add_theme_color_override("font_color", Color.WHITE if outline else Color("#1E2A47"))
	if outline:
		l.add_theme_color_override("font_outline_color", Color("#1E2A47"))
		l.add_theme_constant_override("outline_size", 6)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _panel_style(bg: Color, border: Color, radius := 14) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(3)
	sb.set_corner_radius_all(radius)
	sb.set_content_margin_all(8)
	sb.shadow_color = Color(0.12, 0.16, 0.28, 0.9)
	sb.shadow_offset = Vector2(0, 3)
	sb.shadow_size = 0
	return sb

func _build_hud() -> void:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", _panel_style(Color("#141C33F2"), Color("#3A4A72")))
	p.position = Vector2(8, 8)
	p.custom_minimum_size = Vector2(226, 0)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(p)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 2)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(v)
	hud_title = _label(18, false, true)
	hud_title.add_theme_color_override("font_color", Color.WHITE)
	v.add_child(hud_title)
	hud_sub = _label(13, false)
	hud_sub.add_theme_color_override("font_color", Color("#E7ECF7"))
	v.add_child(hud_sub)
	hud_bar = ProgressBar.new()
	hud_bar.show_percentage = false
	hud_bar.custom_minimum_size = Vector2(0, 10)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color("#0F1528")
	bg.set_corner_radius_all(6)
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("#12B5A2")
	fill.set_corner_radius_all(6)
	hud_bar.add_theme_stylebox_override("background", bg)
	hud_bar.add_theme_stylebox_override("fill", fill)
	hud_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(hud_bar)
	hud_count = _label(12, false)
	hud_count.add_theme_color_override("font_color", Color("#AEB8D0"))
	v.add_child(hud_count)

func _update_hud() -> void:
	if hud_title == null:
		return
	var l := _loc()
	hud_title.text = str(l["name"])
	hud_sub.text = "%s Lv %d · %s" % [_skill(), _level(_skill()), str(l["era"])]
	var need := _need()
	var have := float(progress.get(_loc_id(), 0.0))
	match str(l["kind"]):
		"summon":
			hud_bar.max_value = need
			hud_bar.value = have
			hud_count.text = "Circle %d%%   ·   %d heroes met" % [int(have / need * 100.0), roster.size()]
		"fish":
			hud_bar.max_value = need
			hud_bar.value = have
			hud_count.text = "Next bite in %d taps" % maxi(0, int(ceil(need - have)))
		"lock":
			var pins := int(l.get("pins", 5))
			hud_bar.max_value = need * pins
			hud_bar.value = need * pins_done + have
			hud_count.text = "Pin %d of %d" % [mini(pins_done + 1, pins), pins]

func _build_bubble() -> void:
	bubble = PanelContainer.new()
	bubble.add_theme_stylebox_override("panel", _panel_style(Color(1, 1, 1, 0.97), Color("#1E2A47"), 12))
	bubble_label = _label(14, false)
	bubble_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bubble_label.custom_minimum_size = Vector2(170, 0)
	bubble.add_child(bubble_label)
	bubble.visible = false
	bubble.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bubble)

# ============================================================ talking

func _say(event: String) -> void:
	if asleep and event != "sleep":
		return
	if api_key != "" and event in ["summon", "summon_rare", "catch", "unlock", "idle", "busy", "move"] and randf() < 0.6:
		_ask_ai(event)
		return
	var pack: Dictionary = Data.LINES[mode]
	var lines: Array = pack.get(event, pack["idle"])
	_say_text(str(lines[randi() % lines.size()]))

func _say_text(text: String) -> void:
	bubble_label.text = text
	bubble.visible = true
	bubble.reset_size()
	var head := _pose_point(Vector2(smudge.texture.get_width() * 0.5, 0)) + Vector2(-20, -6)
	bubble.position = Vector2(clampf(head.x - 40, 4, WIN.x - bubble.size.x - 4), clampf(head.y - bubble.size.y, 84, WIN.y - 60))
	bubble.scale = Vector2(0.6, 0.6)
	bubble.pivot_offset = Vector2(30, bubble.size.y)
	_play("blip", randf_range(0.95, 1.1), -14.0)
	var tw := create_tween()
	tw.tween_property(bubble, "scale", Vector2.ONE, 0.15).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(3.8)
	tw.tween_callback(_hide_bubble)

func _hide_bubble() -> void:
	bubble.visible = false

func _ask_ai(event: String) -> void:
	if http.get_http_client_status() != HTTPClient.STATUS_DISCONNECTED:
		return
	var system: String = Data.AI_SYSTEM[mode]
	var prompt := "Event: %s. Location: %s (%s). %s level %d. Heroes summoned so far: %d." % [
		event, str(_loc()["name"]), str(_loc()["era"]), _skill(), _level(_skill()), roster.size()]
	var model: String = api_model if api_model != "" else str(MODELS[api_provider])
	var url := ""
	var headers := PackedStringArray(["Content-Type: application/json"])
	var body := {}
	match api_provider:
		1:
			url = "https://api.anthropic.com/v1/messages"
			headers.append("x-api-key: " + api_key)
			headers.append("anthropic-version: 2023-06-01")
			body = {"model": model, "max_tokens": 60, "system": system, "messages": [{"role": "user", "content": prompt}]}
		2:
			url = "https://api.x.ai/v1/chat/completions"
			headers.append("Authorization: Bearer " + api_key)
			body = {"model": model, "max_tokens": 60, "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}
		_:
			url = "https://api.openai.com/v1/chat/completions"
			headers.append("Authorization: Bearer " + api_key)
			body = {"model": model, "max_completion_tokens": 60, "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}
	if http.request(url, headers, HTTPClient.METHOD_POST, JSON.stringify(body)) != OK:
		_say_offline("idle")

func _on_ai_reply(result: int, code: int, _headers: PackedStringArray, data: PackedByteArray) -> void:
	var text := ""
	var parsed = JSON.parse_string(data.get_string_from_utf8())
	if result == HTTPRequest.RESULT_SUCCESS and code == 200 and parsed is Dictionary:
		if parsed.has("content"):
			text = str(parsed["content"][0]["text"])
		elif parsed.has("choices"):
			text = str(parsed["choices"][0]["message"]["content"])
	if text.strip_edges() == "":
		if ai_status:
			ai_status.text = "AI didn't answer (code %d). Using built-in lines." % code
		_say_offline("idle")
		return
	if ai_status:
		ai_status.text = "AI is talking."
	_say_text(text.strip_edges().left(140))

func _say_offline(event: String) -> void:
	var pack: Dictionary = Data.LINES[mode]
	var lines: Array = pack.get(event, pack["idle"])
	_say_text(str(lines[randi() % lines.size()]))

# ============================================================ sound

func _play(sound: String, pitch := 1.0, db := 0.0) -> void:
	if not sound_on or not sfx.has(sound):
		return
	var p := AudioStreamPlayer.new()
	p.stream = sfx[sound]
	p.pitch_scale = pitch
	p.volume_db = db
	add_child(p)
	p.play()
	p.finished.connect(p.queue_free)

# Each place has its own quiet bed of sound: page rustle, river and gulls, a muffled jazz room.
func _start_ambience() -> void:
	if ambience == null:
		return
	var path := "res://sfx/amb_%s.wav" % _loc_id()
	if not ResourceLoader.exists(path):
		ambience.stop()
		return
	var stream: AudioStreamWAV = load(path)
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = int(stream.get_length() * stream.mix_rate)
	ambience.stream = stream
	ambience.play()
	ambience.stream_paused = not sound_on

# ============================================================ menu

func _build_menu() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	menu = PanelContainer.new()
	menu.position = Vector2(WIN.x - 330, 6)
	menu.custom_minimum_size = Vector2(324, 368)
	menu.size = Vector2(324, 368)
	var th := Theme.new()
	th.default_font = font_body
	th.default_font_size = 14
	th.set_color("font_color", "Label", Color("#EEF2FA"))
	var b_normal := _panel_style(Color("#F2B935"), Color("#0B1020"), 9)
	b_normal.set_content_margin_all(5)
	b_normal.content_margin_left = 10
	b_normal.content_margin_right = 10
	b_normal.shadow_size = 0
	b_normal.border_width_bottom = 4
	var b_hover := b_normal.duplicate()
	b_hover.bg_color = Color("#FFD35C")
	var b_press := b_normal.duplicate()
	b_press.bg_color = Color("#E0A41F")
	b_press.border_width_bottom = 2
	for kind in ["Button", "OptionButton"]:
		th.set_stylebox("normal", kind, b_normal)
		th.set_stylebox("hover", kind, b_hover)
		th.set_stylebox("pressed", kind, b_press)
		th.set_stylebox("hover_pressed", kind, b_press)
		th.set_stylebox("focus", kind, StyleBoxEmpty.new())
		for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
			th.set_color(state, kind, Color("#141C33"))
	var empty := StyleBoxEmpty.new()
	for st in ["normal", "hover", "pressed", "hover_pressed", "focus", "disabled"]:
		th.set_stylebox(st, "CheckBox", empty)
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		th.set_color(state, "CheckBox", Color("#EEF2FA"))
	var pm := _panel_style(Color("#141C33"), Color("#F2B935"), 8)
	th.set_stylebox("panel", "PopupMenu", pm)
	th.set_color("font_color", "PopupMenu", Color("#EEF2FA"))
	th.set_color("font_hover_color", "PopupMenu", Color("#141C33"))
	var hov := StyleBoxFlat.new()
	hov.bg_color = Color("#F2B935")
	hov.set_corner_radius_all(4)
	th.set_stylebox("hover", "PopupMenu", hov)
	var le := _panel_style(Color("#0B1020"), Color("#3A4A72"), 8)
	le.set_content_margin_all(6)
	le.shadow_size = 0
	th.set_stylebox("normal", "LineEdit", le)
	th.set_stylebox("focus", "LineEdit", le)
	th.set_color("font_color", "LineEdit", Color("#EEF2FA"))
	th.set_color("font_placeholder_color", "LineEdit", Color("#7C88A6"))
	var tip := _panel_style(Color("#0B1020"), Color("#F2B935"), 6)
	tip.set_content_margin_all(5)
	th.set_stylebox("panel", "TooltipPanel", tip)
	th.set_color("font_color", "TooltipLabel", Color("#EEF2FA"))
	th.set_icon("unchecked", "CheckBox", _box_icon(false))
	th.set_icon("checked", "CheckBox", _box_icon(true))
	menu.theme = th
	var frame := _panel_style(Color("#121A30FA"), Color("#F2B935"), 16)
	frame.set_content_margin_all(10)
	menu.add_theme_stylebox_override("panel", frame)
	layer.add_child(menu)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	menu.add_child(v)

	# header: drag it to move the menu
	var header := HBoxContainer.new()
	header.mouse_filter = Control.MOUSE_FILTER_STOP
	header.mouse_default_cursor_shape = Control.CURSOR_MOVE
	header.gui_input.connect(_on_menu_header_input)
	header.tooltip_text = "Drag to move"
	v.add_child(header)
	var title := _label(22, true, true)
	title.text = "Smudge's Ledger"
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	var close := _button("X", _close_menu)
	header.add_child(close)

	# tabs
	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 4)
	v.add_child(tabs)
	for tab_name in ["Places", "Heroes", "Bag", "Smudge", "Settings"]:
		var tb := _button(tab_name, _show_tab.bind(tab_name))
		tb.add_theme_font_size_override("font_size", 12)
		tb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab_buttons[tab_name] = tb
		tabs.add_child(tb)

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(0, 278)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(scroll)
	var pages := VBoxContainer.new()
	pages.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(pages)

	# Places
	places_box = VBoxContainer.new()
	places_box.add_theme_constant_override("separation", 8)
	pages.add_child(places_box)
	tab_boxes["Places"] = places_box
	_refresh_places()

	# Heroes
	var roster_box := VBoxContainer.new()
	pages.add_child(roster_box)
	tab_boxes["Heroes"] = roster_box
	roster_grid = GridContainer.new()
	roster_grid.columns = 3
	roster_grid.add_theme_constant_override("h_separation", 6)
	roster_grid.add_theme_constant_override("v_separation", 6)
	roster_box.add_child(roster_grid)
	_refresh_roster()

	# Bag
	var bag_box := VBoxContainer.new()
	bag_box.add_theme_constant_override("separation", 8)
	pages.add_child(bag_box)
	tab_boxes["Bag"] = bag_box
	var bag_top := HBoxContainer.new()
	bag_box.add_child(bag_top)
	coins_label = _label(16, true, true)
	coins_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bag_top.add_child(coins_label)
	bag_top.add_child(_button("Sell extras", _sell_extras))
	bag_grid = GridContainer.new()
	bag_grid.columns = 6
	bag_grid.add_theme_constant_override("h_separation", 4)
	bag_grid.add_theme_constant_override("v_separation", 4)
	bag_box.add_child(bag_grid)
	bag_hint = Label.new()
	bag_hint.add_theme_font_size_override("font_size", 12)
	bag_hint.add_theme_color_override("font_color", Color("#9AA6C4"))
	bag_hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bag_hint.custom_minimum_size = Vector2(290, 0)
	bag_box.add_child(bag_hint)
	_refresh_bag()

	# Smudge (voice + your own AI key)
	var talk := VBoxContainer.new()
	talk.add_theme_constant_override("separation", 6)
	pages.add_child(talk)
	tab_boxes["Smudge"] = talk
	talk.add_child(_section("Voice"))
	mode_option = OptionButton.new()
	mode_option.focus_mode = Control.FOCUS_NONE
	for m in ["sweet", "salty", "unhinged"]:
		mode_option.add_item(str(Data.MODE_NAMES[m]))
	mode_option.select(["sweet", "salty", "unhinged"].find(mode))
	mode_option.item_selected.connect(_set_mode)
	talk.add_child(mode_option)
	talk.add_child(_section("Your own AI (optional)"))
	var info := Label.new()
	info.text = "Lets Smudge improvise. The key stays encrypted on this PC."
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.custom_minimum_size = Vector2(290, 0)
	info.add_theme_font_size_override("font_size", 12)
	info.add_theme_color_override("font_color", Color("#9AA6C4"))
	talk.add_child(info)
	ai_provider = OptionButton.new()
	ai_provider.focus_mode = Control.FOCUS_NONE
	for p in ["OpenAI", "Anthropic (Claude)", "xAI (Grok)"]:
		ai_provider.add_item(p)
	ai_provider.select(api_provider)
	ai_provider.item_selected.connect(_on_provider)
	talk.add_child(ai_provider)
	ai_model = LineEdit.new()
	ai_model.text = api_model
	ai_model.placeholder_text = "model: " + str(MODELS[api_provider])
	talk.add_child(ai_model)
	ai_key = LineEdit.new()
	ai_key.secret = true
	ai_key.placeholder_text = "API key"
	ai_key.text = api_key
	talk.add_child(ai_key)
	var row := HBoxContainer.new()
	row.add_child(_button("Save", _save_ai))
	row.add_child(_button("Test", _test_ai))
	row.add_child(_button("Clear", _clear_ai))
	talk.add_child(row)
	ai_status = Label.new()
	ai_status.add_theme_font_size_override("font_size", 12)
	ai_status.text = "Using built-in lines." if api_key == "" else "AI key saved."
	talk.add_child(ai_status)

	# Settings
	var settings := VBoxContainer.new()
	settings.add_theme_constant_override("separation", 4)
	pages.add_child(settings)
	tab_boxes["Settings"] = settings
	settings.add_child(_section("Sound"))
	settings.add_child(_check("Sound", sound_on, _set_sound))
	settings.add_child(_check("Key click sounds", key_sounds, _set_key_sounds))
	settings.add_child(_section("Window"))
	settings.add_child(_check("Always on top", true, _set_on_top))
	var size_row := HBoxContainer.new()
	size_row.add_theme_constant_override("separation", 4)
	for i in 3:
		size_row.add_child(_button(["Small", "Normal", "Large"][i], _set_size.bind(i)))
	settings.add_child(size_row)
	settings.add_child(_button("Snap to bottom-right", _place_window))
	settings.add_child(_section("Testing"))
	settings.add_child(_check("Test mode (10x faster)", test_mode, _set_test_mode))
	settings.add_child(_check("Demo typing (types for you)", demo_typing, _set_demo))
	var hint := Label.new()
	hint.text = "Right-drag the scene to move the window. Drag this menu by its title. Click Smudge to open it."
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.custom_minimum_size = Vector2(290, 0)
	hint.add_theme_font_size_override("font_size", 12)
	hint.add_theme_color_override("font_color", Color("#9AA6C4"))
	settings.add_child(hint)
	var danger := HBoxContainer.new()
	danger.add_child(_button("Reset progress", _reset_progress))
	danger.add_child(_button("Quit", _quit))
	settings.add_child(danger)

	_show_tab("Places")
	menu.visible = false

# Checkbox icons drawn in code: an outlined box, and a yellow box with a tick.
func _box_icon(on: bool) -> ImageTexture:
	var img := Image.create(18, 18, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	for y in 18:
		for x in 18:
			var edge := x < 2 or y < 2 or x > 15 or y > 15
			if on:
				img.set_pixel(x, y, Color("#F2B935") if not edge else Color("#FFD35C"))
			elif edge:
				img.set_pixel(x, y, Color("#9AA6C4"))
	if on:
		var tick := [Vector2i(4, 9), Vector2i(5, 10), Vector2i(6, 11), Vector2i(7, 12), Vector2i(8, 11), Vector2i(9, 10), Vector2i(10, 9), Vector2i(11, 8), Vector2i(12, 7), Vector2i(13, 6)]
		for p in tick:
			for d in [Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 0)]:
				img.set_pixelv(p + d, Color("#141C33"))
	return ImageTexture.create_from_image(img)

func _section(text: String) -> Label:
	var l := _label(15, false, true)
	l.text = text
	l.add_theme_color_override("font_color", Color("#F2B935"))
	return l

func _on_menu_header_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		menu_drag = event.pressed
		menu_drag_from = event.global_position - menu.position
	elif event is InputEventMouseMotion and menu_drag:
		var p: Vector2 = event.global_position - menu_drag_from
		menu.position = Vector2(clampf(p.x, 0.0, WIN.x - menu.size.x), clampf(p.y, 0.0, WIN.y - 40.0))

func _button(text: String, action: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.pressed.connect(action)
	return b

func _check(text: String, on: bool, action: Callable) -> CheckBox:
	var c := CheckBox.new()
	c.text = text
	c.button_pressed = on
	c.focus_mode = Control.FOCUS_NONE
	c.toggled.connect(action)
	return c

func _show_tab(tab_name: String) -> void:
	for k in tab_boxes:
		tab_boxes[k].visible = (k == tab_name)
	for k in tab_buttons:
		var b: Button = tab_buttons[k]
		var on: bool = k == tab_name
		var sb := _panel_style(Color("#F2B935") if on else Color("#1E2848"), Color("#0B1020") if on else Color("#3A4A72"), 9)
		sb.set_content_margin_all(4)
		sb.shadow_size = 0
		b.add_theme_stylebox_override("normal", sb)
		b.add_theme_stylebox_override("hover", sb)
		b.add_theme_color_override("font_color", Color("#141C33") if on else Color("#C9D2E8"))
		b.add_theme_color_override("font_hover_color", Color("#141C33") if on else Color.WHITE)
	if tab_name == "Bag":
		_refresh_bag()
	_play("blip", 1.0, -14.0)

func _toggle_menu() -> void:
	menu.visible = not menu.visible
	_apply_window_size()
	if menu.visible:
		_show_tab("Places")
		squash.y += 1.0

func _close_menu() -> void:
	menu.visible = false
	_apply_window_size()

func _card_style(border: Color, bg := Color("#0B1020")) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(8)
	sb.set_content_margin_all(4)
	return sb

func _refresh_places() -> void:
	if places_box == null:
		return
	for ch in places_box.get_children():
		ch.queue_free()
	for i in Data.LOCATIONS.size():
		var l: Dictionary = Data.LOCATIONS[i]
		var here := i == loc_index
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", _card_style(Color("#F2B935") if here else Color("#2C3A5E"), Color("#1A2442") if here else Color("#0F1629")))
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		card.add_child(row)
		var pic := TextureRect.new()
		pic.texture = tex["scene_" + str(l["id"])]
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(72, 52)
		row.add_child(pic)
		var col := VBoxContainer.new()
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		col.add_theme_constant_override("separation", 0)
		row.add_child(col)
		var name_l := _label(15, false, true)
		name_l.text = str(l["name"])
		name_l.add_theme_color_override("font_color", Color.WHITE)
		col.add_child(name_l)
		var d := Label.new()
		d.text = "%s · %s Lv %d" % [str(l["era"]), str(l["skill"]), _level(str(l["skill"]))]
		d.add_theme_font_size_override("font_size", 12)
		d.add_theme_color_override("font_color", Color("#9AA6C4"))
		col.add_child(d)
		if here:
			var hl := Label.new()
			hl.text = "Smudge is here"
			hl.add_theme_font_size_override("font_size", 12)
			hl.add_theme_color_override("font_color", Color("#5CE0C6"))
			col.add_child(hl)
		else:
			var go := _button("Travel", _travel.bind(i))
			go.add_theme_font_size_override("font_size", 12)
			go.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
			col.add_child(go)
		card.tooltip_text = str(l["blurb"])
		places_box.add_child(card)
	var soon := Label.new()
	soon.text = "Coming next: Pompeii dig site, Ice Age fishing hole, pharaoh's tomb."
	soon.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	soon.custom_minimum_size = Vector2(290, 0)
	soon.add_theme_font_size_override("font_size", 12)
	soon.add_theme_color_override("font_color", Color("#9AA6C4"))
	places_box.add_child(soon)

func _refresh_roster() -> void:
	if roster_grid == null:
		return
	for ch in roster_grid.get_children():
		ch.queue_free()
	for h in Data.HEROES:
		var id := str(h[0])
		var owned := int(roster.get(id, 0))
		var rc: Color = Data.RARITY_COLOR[str(h[5])]
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", _card_style(rc if owned > 0 else Color("#2C3A5E")))
		card.custom_minimum_size = Vector2(92, 0)
		var cell := VBoxContainer.new()
		cell.add_theme_constant_override("separation", 0)
		card.add_child(cell)
		var pic := TextureRect.new()
		pic.texture = hero_tex[id]
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(84, 84)
		if owned == 0:
			pic.modulate = Color(0.05, 0.07, 0.15, 0.9)
		cell.add_child(pic)
		var n := Label.new()
		n.text = str(h[1]) if owned > 0 else "???"
		n.add_theme_font_size_override("font_size", 11)
		n.add_theme_color_override("font_color", rc if owned > 0 else Color("#5A668A"))
		n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		n.custom_minimum_size = Vector2(84, 0)
		cell.add_child(n)
		if owned > 1:
			var c := Label.new()
			c.text = "x%d" % owned
			c.add_theme_font_size_override("font_size", 11)
			c.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			cell.add_child(c)
		card.tooltip_text = ("%s, %s\n%s · %s %s" % [str(h[1]), str(h[2]), str(h[3]), str(h[5]).capitalize(), str(h[4])]) if owned > 0 else "Not summoned yet"
		roster_grid.add_child(card)

func _item_rarity(item: String) -> String:
	for table in Data.LOOT.values():
		for row in table:
			if str(row[0]) == item:
				return str(row[4])
	return "common"

const BAG_SLOTS := 30

func _refresh_bag() -> void:
	if bag_grid == null:
		return
	var total := 0
	for k in bag:
		total += int(bag[k])
	coins_label.text = "%d coins" % coins
	bag_hint.text = "%d items, %d kinds. Hover an item for details." % [total, bag.size()] if total > 0 else "Empty. Go fishing or crack a safe."
	for ch in bag_grid.get_children():
		ch.queue_free()
	var items := bag.keys()
	items.sort_custom(func(a, b): return ["epic", "rare", "uncommon", "common"].find(_item_rarity(str(a))) < ["epic", "rare", "uncommon", "common"].find(_item_rarity(str(b))))
	for i in maxi(BAG_SLOTS, items.size()):
		var slot := PanelContainer.new()
		slot.custom_minimum_size = Vector2(46, 46)
		if i < items.size():
			var item := str(items[i])
			var r := _item_rarity(item)
			slot.add_theme_stylebox_override("panel", _card_style(Data.RARITY_COLOR.get(r, Color.GRAY), Color("#182343")))
			var icon := TextureRect.new()
			icon.texture = _item_icon(item)
			icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
			slot.add_child(icon)
			var n := int(bag[items[i]])
			if n > 1:
				var badge := _label(12, true, true)
				badge.text = str(n)
				badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
				badge.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
				slot.add_child(badge)
			slot.tooltip_text = "%s  x%d\n%s · worth %d coins each" % [item, n, r.capitalize(), _item_value(item)]
		else:
			slot.add_theme_stylebox_override("panel", _card_style(Color("#222D4C"), Color("#0D1427")))
		bag_grid.add_child(slot)

# ------------------------------------------------------------ menu actions

func _set_mode(i: int) -> void:
	mode = ["sweet", "salty", "unhinged"][i]
	_save_game()
	_say("idle")

func _on_provider(i: int) -> void:
	ai_model.placeholder_text = "model: " + str(MODELS[i])

func _save_ai() -> void:
	api_provider = ai_provider.selected
	api_model = ai_model.text.strip_edges()
	api_key = ai_key.text.strip_edges()
	ai_status.text = "Using built-in lines." if api_key == "" else "AI key saved."
	ai_key.release_focus()
	ai_model.release_focus()
	_save_game()

func _test_ai() -> void:
	_save_ai()
	if api_key == "":
		_say("idle")
	else:
		_ask_ai("The player pressed the Test button. Say hello in character.")

func _clear_ai() -> void:
	ai_key.text = ""
	_save_ai()

func _set_sound(on: bool) -> void:
	sound_on = on
	if ambience:
		ambience.stream_paused = not on
	_save_game()

func _set_on_top(on: bool) -> void:
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_ALWAYS_ON_TOP, on)

func _set_key_sounds(on: bool) -> void:
	key_sounds = on
	_save_game()

func _set_test_mode(on: bool) -> void:
	test_mode = on
	_save_game()

func _set_demo(on: bool) -> void:
	demo_typing = on

func _set_size(i: int) -> void:
	size_index = i
	_apply_window_size()
	_place_window()
	_save_game()

var reset_armed := false
func _reset_progress() -> void:
	if not reset_armed:
		reset_armed = true
		_say_text("Click Reset again to wipe everything. Everything.")
		return
	reset_armed = false
	progress = {"archive": 0.0, "dock": 0.0, "speakeasy": 0.0}
	pins_done = 0
	xp = {"Summoning": 0, "Fishing": 0, "Lockpicking": 0}
	bag = {}
	roster = {}
	coins = 0
	total_taps = 0
	_refresh_bag()
	_refresh_roster()
	_refresh_places()
	_update_hud()
	_save_game()
	_say_text("Fresh ledger. Nobody remembers anything.")

func _quit() -> void:
	_save_game()
	get_tree().quit()

# ============================================================ saving

func _save_game() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("game", "loc_index", loc_index)
	cfg.set_value("game", "progress", progress)
	cfg.set_value("game", "pins_done", pins_done)
	cfg.set_value("game", "xp", xp)
	cfg.set_value("game", "bag", bag)
	cfg.set_value("game", "roster", roster)
	cfg.set_value("game", "coins", coins)
	cfg.set_value("game", "total_taps", total_taps)
	cfg.set_value("prefs", "mode", mode)
	cfg.set_value("prefs", "sound", sound_on)
	cfg.set_value("prefs", "key_sounds", key_sounds)
	cfg.set_value("prefs", "test_mode", test_mode)
	cfg.set_value("prefs", "size", size_index)
	cfg.set_value("ai", "provider", api_provider)
	cfg.set_value("ai", "model", api_model)
	cfg.set_value("ai", "key", api_key)
	cfg.save_encrypted_pass(SAVE_PATH, OS.get_unique_id())

func _load_game() -> void:
	var cfg := ConfigFile.new()
	if cfg.load_encrypted_pass(SAVE_PATH, OS.get_unique_id()) != OK:
		return
	loc_index = clampi(int(cfg.get_value("game", "loc_index", 0)), 0, Data.LOCATIONS.size() - 1)
	var p = cfg.get_value("game", "progress", progress)
	if p is Dictionary:
		for k in p:
			progress["dock" if str(k) == "bathhouse" else str(k)] = float(p[k])
	pins_done = int(cfg.get_value("game", "pins_done", 0))
	var x = cfg.get_value("game", "xp", xp)
	if x is Dictionary:
		for k in x:
			xp[k] = int(x[k])
	var b = cfg.get_value("game", "bag", {})
	if b is Dictionary:
		bag = b
	var r = cfg.get_value("game", "roster", {})
	if r is Dictionary:
		roster = r
	coins = int(cfg.get_value("game", "coins", 0))
	total_taps = int(cfg.get_value("game", "total_taps", 0))
	mode = str(cfg.get_value("prefs", "mode", "salty"))
	if not (mode in ["sweet", "salty", "unhinged"]):
		mode = "salty"
	sound_on = bool(cfg.get_value("prefs", "sound", true))
	key_sounds = bool(cfg.get_value("prefs", "key_sounds", false))
	test_mode = bool(cfg.get_value("prefs", "test_mode", false))
	size_index = int(cfg.get_value("prefs", "size", 1))
	api_provider = int(cfg.get_value("ai", "provider", 0))
	api_model = str(cfg.get_value("ai", "model", ""))
	api_key = str(cfg.get_value("ai", "key", ""))
