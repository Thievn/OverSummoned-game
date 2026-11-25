extends Node2D
# OverSummoned Desk, Fable build.
# Smudge lives on the taskbar. Every key you press powers whatever he is doing
# where he is: stamping names in the Archive, fishing, picking locks, digging.
# All numbers come from rules.json, the same file the website uses.

const Voice = preload("res://voice.gd")
const OverlayScript = preload("res://overlay.gd")
const PuppetScript = preload("res://puppet.gd")
const CloudScript = preload("res://cloud.gd")
const SceneShader = preload("res://shaders/scene.gdshader")

const WIN := Vector2(640, 380)
const SAVE_PATH := "user://oversummoned_fable.cfg"
const MODELS := ["gpt-4o-mini", "claude-haiku-5-5", "grok-4-1-fast-non-reasoning"]
const POSE_FOR := {"Summoning": "stamp", "Fishing": "fish", "Lockpicking": "pick", "Digging": "dig"}
# Where things sit in each painted scene (scene picture pixels).
const VIEW := {
	"archive": {"scale": 0.6, "pose": 0.27, "anchor": Vector2(453, 255), "sleep": Vector2(455, 222), "circle": Vector2(453, 309), "circle_r": Vector2(175, 73), "light": 1.4},
	"dock": {"scale": 0.62, "pose": 0.35, "anchor": Vector2(610, 300), "sleep": Vector2(430, 280), "bob": Vector2(765, 358)},
	"bondi": {"scale": 0.6, "pose": 0.34, "anchor": Vector2(425, 314), "sleep": Vector2(330, 250), "bob": Vector2(640, 360)},
	"fjord": {"scale": 0.6, "pose": 0.34, "anchor": Vector2(585, 235), "sleep": Vector2(350, 300), "bob": Vector2(667, 245)},
	"speakeasy": {"scale": 0.5, "pose": 0.38, "anchor": Vector2(470, 600), "sleep": Vector2(300, 630), "light": 1.3},
	"vault": {"scale": 0.6, "pose": 0.34, "anchor": Vector2(500, 370), "sleep": Vector2(330, 390)},
	"closet": {"scale": 0.6, "pose": 0.34, "anchor": Vector2(500, 330), "sleep": Vector2(300, 360)},
	"outback": {"scale": 0.6, "pose": 0.34, "anchor": Vector2(355, 354), "sleep": Vector2(300, 340)},
	"blackforest": {"scale": 0.6, "pose": 0.34, "anchor": Vector2(415, 354), "sleep": Vector2(300, 340), "light": 1.75},
}
const YAWN_AFTER := 25.0
const SLEEP_AFTER := 60.0
const ANIM_GAP := 0.07

# ------------------------------------------------------------ data and art
var R := {}                  # rules.json
var items := {}
var heroes_by_id := {}
var tex := {}
var masks := {}
var loot_tex := {}
var hero_tex := {}
var sfx := {}
var font_body: FontFile
var font_title: FontFile

# ------------------------------------------------------------ nodes
var scene_sprite: Sprite2D
var scene_mat: ShaderMaterial
var overlay
var overlay_top
var smudge              # puppet.gd
var zzz: Label
var hud_title: Label
var hud_sub: Label
var hud_bar: ProgressBar
var hud_count: Label
var hud_ink: Label
var bubble: PanelContainer
var bubble_label: Label
var menu: PanelContainer
var tip: PanelContainer
var tip_text: RichTextLabel
var tab_boxes := {}
var tab_buttons := {}
var places_box: VBoxContainer
var roster_grid: GridContainer
var bag_grid: GridContainer
var bag_hint: Label
var coins_label: Label
var mode_option: OptionButton
var ai_provider: OptionButton
var ai_model: LineEdit
var ai_key: LineEdit
var ai_status: Label
var http: HTTPRequest
var ambience: AudioStreamPlayer
var last_passthrough := PackedVector2Array()

# ------------------------------------------------------------ save data
var place_index := 0
var progress := 0.0          # keys toward the next action at this place
var ink := 0.0
var xp := {"Summoning": 0, "Fishing": 0, "Lockpicking": 0, "Digging": 0}
var bag := {}
var roster := {}
var gold := 0
var total_keys := 0
var keys_today := 0
var sold_today := 0
var day := ""
var crate_clock := 0.0       # seconds of active typing toward the next rift crate
var crate_ready := false
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
var tap_budget := 14.0
var rate := 0.0
var activity := 0.0
var asleep := false
var yawned := false
var anim_gap := 0.0
var hand_flip := false
var bobber_dip := 0.0
var circle_flash := 0.0
var chatter_timer := 70.0
var ink_told := false
var ripples: Array = []
var fliers: Array = []
var floaters: Array = []
var bursts: Array = []
var bits: Array = []         # small particles: paper, sparks, dirt, ink
var scene_scale := 0.6
var travel_t := -1.0
var travel_to := 0
var travel_swapped := false
var demo_timer := 0.0
var save_timer := 10.0
var dragging := false
var drag_offset := Vector2i.ZERO
var menu_drag := false
var menu_drag_from := Vector2.ZERO
var loot_view := ""          # place id whose loot list is showing in the Places tab
var reset_armed := false
# ---- the link to the player's account (see cloud.gd). When linked, the server rolls every find and summon and keeps the ledger.
var cloud
var cloud_data := {}          # the whole ledger as the server last sent it; the pet only touches a few fields of it
var cloud_rev := 0
var cloud_busy := false
var cloud_save_t := 20.0
var pend := {}                # finds waiting to be rolled by the server: "place|luck" -> how many
var roll_timer := 0.0
var summon_wait := 0.0
var hauls_unsent := 0
var link_code: LineEdit
var link_status: Label
var link_req := ""            # the request id while waiting for Yes on the website
var link_poll_t := 0.0
var link_left := 0.0

# ============================================================ setup

func _ready() -> void:
	get_viewport().transparent_bg = true
	randomize()
	R = JSON.parse_string(FileAccess.get_file_as_string("res://rules.json"))
	items = R["items"]
	for h in R["heroes"]:
		heroes_by_id[h["id"]] = h
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

	smudge = PuppetScript.new()
	add_child(smudge)
	smudge.setup(JSON.parse_string(FileAccess.get_file_as_string("res://rig.json")))

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
	if cloud == null:
		cloud = CloudScript.new()
		add_child(cloud)
	http = HTTPRequest.new()
	http.timeout = 15.0
	http.request_completed.connect(_on_ai_reply)
	add_child(http)

	_enter_place(false)
	get_tree().auto_accept_quit = false
	if cloud.linked():
		_cloud_load()

func _load_art() -> void:
	for p in R["places"]:
		var id := str(p["id"])
		tex["scene_" + id] = load("res://art/scenes/%s.png" % id)
		masks[id] = load("res://art/scenes/%s_mask.png" % id)
	for id in items:
		var path := "res://art/loot/%s.png" % str(items[id]["icon"])
		if ResourceLoader.exists(path):
			loot_tex[id] = load(path)
	for extra in ["x_crate", "x_crate_open", "x_gold", "x_ink"]:
		loot_tex[extra] = load("res://art/loot/%s.png" % extra)
	for h in R["heroes"]:
		hero_tex[h["id"]] = load("res://art/heroes/%s.png" % str(h["id"]))
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
		factor = maxf(factor, 1.0)
	var old_pos := DisplayServer.window_get_position()
	var old_size := DisplayServer.window_get_size()
	var new_size := Vector2i(int(WIN.x * factor), int(WIN.y * factor))
	if new_size == old_size:
		return
	DisplayServer.window_set_size(new_size)
	if menu != null:
		DisplayServer.window_set_position(old_pos + old_size - new_size)

# ============================================================ rules helpers

func _place() -> Dictionary:
	return R["places"][place_index]

func _pid() -> String:
	return str(_place()["id"])

func _skill() -> String:
	return str(_place()["skill"])

func _level(skill: String) -> int:
	var x := int(xp.get(skill, 0))
	var table: Array = R["xp_table"]
	var lvl := 1
	while lvl < 99 and x >= int(table[lvl]):
		lvl += 1
	return lvl

func _perk(skill: String, key: String) -> float:
	var lvl := _level(skill)
	var total := 0.0
	for p in R["perks"]:
		if lvl >= int(p["level"]) and p.has(key):
			if key == "double":
				total = maxf(total, float(p[key]))
			else:
				total += float(p[key])
	return total

func _tier() -> Dictionary:
	return R["tier"][str(int(_place()["tier"]))]

# keys needed for one action here
func _need() -> float:
	if _skill() == "Summoning":
		return _summon_cost()
	return float(_tier()["keys"]) / (1.0 + _perk(_skill(), "speed"))

func _summon_cost() -> float:
	return float(R["summon"]["base_ink"]) + float(R["summon"]["per_unique"]) * float(roster.size())

func _card_level(count: int) -> int:
	var lvl := 1
	var maxl := int(R["card"]["max_level"])
	while lvl < maxl and count - 1 >= lvl * (lvl + 1) / 2:
		lvl += 1
	return lvl

func _unlocked(i: int) -> bool:
	var p: Dictionary = R["places"][i]
	return _level(str(p["skill"])) >= int(p["level"])

func _today() -> String:
	return Time.get_date_string_from_system()

func _roll_day() -> void:
	if day != _today():
		day = _today()
		keys_today = 0
		sold_today = 0

func _sell_cap() -> int:
	var total := 0
	for s in xp:
		total += _level(str(s))
	return int(R["gold"]["daily_sell_cap_base"]) + int(R["gold"]["daily_sell_cap_per_level"]) * total

# scene picture pixels -> window pixels
func _sp(p: Vector2) -> Vector2:
	return scene_sprite.position + p * scene_scale

func _view() -> Dictionary:
	return VIEW[_pid()]

# ============================================================ places

func _enter_place(talk: bool) -> void:
	var id := _pid()
	var v: Dictionary = VIEW[id]
	var stex: Texture2D = tex["scene_" + id]
	scene_scale = float(v["scale"])
	scene_sprite.texture = stex
	scene_sprite.scale = Vector2.ONE * scene_scale
	scene_sprite.position = Vector2(8.0, WIN.y - 6.0 - stex.get_height() * scene_scale)
	scene_mat.set_shader_parameter("mask", masks[id])
	scene_mat.set_shader_parameter("exposure", float(v.get("light", 1.24)))
	smudge.scale = Vector2.ONE * float(v["pose"])
	ripples.clear()
	fliers.clear()
	bits.clear()
	floaters.clear()
	_set_pose()
	_start_ambience()
	_update_hud()
	if talk:
		_say("move")
	_save_game()

func _set_pose() -> void:
	var v := _view()
	if asleep:
		smudge.position = _sp(v["sleep"])
		smudge.set_pose("sleep")
	else:
		smudge.position = _sp(v["anchor"])
		smudge.set_pose(str(POSE_FOR[_skill()]))

func _travel(index: int) -> void:
	if index == place_index or travel_t >= 0.0 or not _unlocked(index):
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
		place_index = travel_to
		progress = 0.0
		_enter_place(true)
		_play("whoosh", 1.0, -4.0)
		_refresh_places()
	var k := 0.0
	if travel_t < TRAVEL_OUT:
		k = travel_t / TRAVEL_OUT
	elif travel_t < TRAVEL_OUT + TRAVEL_IN:
		k = 1.0 - (travel_t - TRAVEL_OUT) / TRAVEL_IN
	else:
		travel_t = -1.0
	var e := k * k * (3.0 - 2.0 * k)
	scene_sprite.modulate = Color(1.0 + e * 0.6, 1.0 + e * 1.2, 1.0 + e * 1.1, 1.0 - e)
	smudge.modulate = Color(1.0 + e * 0.8, 1.0 + e * 1.5, 1.0 + e * 1.4, 1.0 - e * 0.85)

# ============================================================ every frame

func _process(delta: float) -> void:
	t += delta
	since_tap += delta
	tap_budget = minf(float(R["max_keys_per_second"]), tap_budget + float(R["max_keys_per_second"]) * delta)
	rate = maxf(0.0, rate - rate * 1.5 * delta)
	anim_gap = maxf(0.0, anim_gap - delta)
	bobber_dip = maxf(0.0, bobber_dip - 30.0 * delta)
	circle_flash = maxf(0.0, circle_flash - delta * 1.5)
	activity = lerpf(activity, clampf(rate / 6.0, 0.0, 1.0), 1.0 - exp(-4.0 * delta))
	scene_mat.set_shader_parameter("wind", activity)
	scene_mat.set_shader_parameter("flicker", activity)
	smudge.busy = activity

	# the rift crate only counts time you are actually typing
	if since_tap < 5.0 and not crate_ready:
		crate_clock += delta * (30.0 if test_mode else 1.0)
		if crate_clock >= float(R["crate"]["minutes"]) * 60.0:
			crate_clock = 0.0
			crate_ready = true
			bursts.append({"at": _crate_pos(), "t": 0.0})
			_play("sparkle", 1.0, -4.0)
			_say("crate")

	if demo_typing:
		demo_timer -= delta
		if demo_timer <= 0.0:
			demo_timer = randf_range(0.12, 0.35)
			_tap()

	# moods
	if not asleep and since_tap > YAWN_AFTER and not yawned:
		yawned = true
		_say("idle")
	if not asleep and since_tap > SLEEP_AFTER and travel_t < 0.0:
		asleep = true
		_say("sleep")
		_set_pose()
	smudge.sleepy = clampf((since_tap - 12.0) / 20.0, 0.0, 1.0) if not asleep else 0.0
	zzz.visible = asleep
	if asleep:
		zzz.position = smudge.named_point("zzz") + Vector2(0, -34.0 + sin(t * 1.4) * 4.0)
		zzz.modulate.a = 0.55 + 0.35 * sin(t * 1.8)
		# a sleeping animal does breathe: a slow, small rise and fall
		var v := float(_view()["pose"])
		smudge.scale = Vector2(v, v * (1.0 + sin(t * 1.5) * 0.02))

	chatter_timer -= delta
	if chatter_timer <= 0.0:
		chatter_timer = randf_range(70.0, 140.0)
		if not asleep:
			_say("busy" if rate > 2.0 else "idle")

	_update_effects(delta)
	_update_travel(delta)
	overlay.queue_redraw()
	overlay_top.queue_redraw()
	_update_passthrough()

	if link_req != "":
		link_left -= delta
		link_poll_t -= delta
		if link_left <= 0.0:
			link_req = ""
			_refresh_link()
		elif link_poll_t <= 0.0 and not cloud_busy:
			link_poll_t = 2.5
			_link_poll()
	if cloud.linked():
		roll_timer -= delta
		summon_wait -= delta
		cloud_save_t -= delta
		if roll_timer <= 0.0 and not pend.is_empty() and not cloud_busy:
			roll_timer = 1.0
			_cloud_roll()
		elif cloud_save_t <= 0.0 and not cloud_busy:
			cloud_save_t = 20.0
			_cloud_save()
	save_timer -= delta
	if save_timer <= 0.0:
		save_timer = 10.0
		_save_game()

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
		else:
			smudge.kick("head", -1.6)
			_play("plop", randf_range(0.95, 1.1), -6.0)
	fliers = keep
	keep = []
	for f in floaters:
		f["t"] = float(f["t"]) + delta
		if float(f["t"]) < 1.8:
			keep.append(f)
	floaters = keep
	keep = []
	for b in bursts:
		b["t"] = float(b["t"]) + delta
		if float(b["t"]) < 0.8:
			keep.append(b)
	bursts = keep
	keep = []
	for p in bits:
		p["t"] = float(p["t"]) + delta
		var v: Vector2 = p["v"]
		v.y += float(p["g"]) * delta
		if str(p["kind"]) == "paper":
			v.x += sin(float(p["t"]) * 5.0 + float(p["w"])) * 160.0 * delta
			v *= 1.0 - 1.6 * delta
		p["v"] = v
		p["p"] = (p["p"] as Vector2) + v * delta
		if float(p["t"]) < float(p["life"]):
			keep.append(p)
	bits = keep

func _bit(kind: String, at: Vector2, vel: Vector2, life: float, gravity: float, col: Color) -> void:
	if bits.size() > 60:
		return
	bits.append({"kind": kind, "p": at, "v": vel, "t": 0.0, "life": life, "g": gravity, "col": col, "w": randf_range(-6.0, 6.0)})

func _fly(texture: Texture2D, from: Vector2, to: Vector2, big: float, rise: float, hold: float, fly: float, lift := 40.0) -> void:
	if texture == null:
		return
	fliers.append({"tex": texture, "from": from, "to": to, "big": big, "rise": rise, "hold": hold, "fly": fly, "lift": lift, "t": 0.0})

func _float_text(text: String, at: Vector2, col: Color, px := 16) -> void:
	floaters.append({"text": text, "at": at, "col": col, "size": px, "t": 0.0})

func _crate_pos() -> Vector2:
	return Vector2(scene_sprite.position.x + 46.0, WIN.y - 40.0)

# ============================================================ input

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if menu.visible and get_viewport().gui_get_focus_owner() is LineEdit:
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
			if crate_ready and mb.position.distance_to(_crate_pos()) < 34.0:
				_open_crate()
			elif _smudge_rect().has_point(mb.position):
				_toggle_menu()
			else:
				_tap()
	elif event is InputEventMouseMotion and dragging:
		DisplayServer.window_set_position(DisplayServer.mouse_get_position() - drag_offset)

func _smudge_rect() -> Rect2:
	var sz: Vector2 = smudge.size()
	return Rect2(smudge.top_left() + sz * Vector2(0.15, 0.05), sz * Vector2(0.7, 0.9))

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		_save_game()
		get_tree().quit()

func _update_passthrough() -> void:
	if menu.visible:
		_set_passthrough(PackedVector2Array())
		return
	var s := DisplayServer.window_get_size()
	var k := float(s.x) / WIN.x
	var r := Rect2(scene_sprite.position, scene_sprite.texture.get_size() * scene_scale)
	r = r.merge(_smudge_rect()).merge(Rect2(Vector2(6, 6), Vector2(236, 92)))
	_set_passthrough(PackedVector2Array([
		(r.position * k).round(), (Vector2(r.end.x, r.position.y) * k).round(), (r.end * k).round(), (Vector2(r.position.x, r.end.y) * k).round()]))

func _set_passthrough(poly: PackedVector2Array) -> void:
	if poly == last_passthrough:
		return
	last_passthrough = poly
	DisplayServer.window_set_mouse_passthrough(poly)

# ============================================================ the tap

func _tap() -> void:
	if tap_budget < 1.0 or travel_t >= 0.0:
		return
	tap_budget -= 1.0
	since_tap = 0.0
	yawned = false
	rate += 1.0
	total_keys += 1
	_roll_day()
	keys_today += 1
	if asleep:
		asleep = false
		_set_pose()
		_say("wake")
	if key_sounds:
		_play("tick", randf_range(0.92, 1.08), -18.0)

	var skill := _skill()
	# one key, one motion
	if anim_gap <= 0.0:
		anim_gap = ANIM_GAP
		match skill:
			"Summoning":
				smudge.kick("arm", 30.0)
				smudge.kick("head", 2.2)
				circle_flash = maxf(circle_flash, 0.12)
				_play("slap", randf_range(0.9, 1.1), -10.0)
				var book: Vector2 = smudge.point(Vector2(400, 455))
				if randf() < 0.3:
					_bit("paper", book, Vector2(randf_range(-110, 110), randf_range(-230, -150)), randf_range(1.4, 2.2), 140.0, Color(0.96, 0.9, 0.76))
				for i in 2:
					_bit("dot", book, Vector2(randf_range(-60, 60), randf_range(-120, -50)), 0.5, 380.0, Color(0.15, 0.85, 0.75))
			"Fishing":
				smudge.kick("rod", 4.0)
				bobber_dip = maxf(bobber_dip, 3.0)
				if ripples.size() < 6:
					ripples.append(0.0)
			"Lockpicking":
				hand_flip = not hand_flip
				smudge.kick("hand_a" if hand_flip else "hand_b", -6.5 if hand_flip else 6.5)
				smudge.kick("head", 1.5)
				if randf() < 0.6:
					var h: Vector2 = smudge.named_point("hands")
					_bit("dot", h, Vector2(randf_range(-40, 90), randf_range(-110, -20)), 0.4, 260.0, Color(1.0, 0.9, 0.5))
			"Digging":
				smudge.kick("shovel", 10.0)
				smudge.kick("head", 2.0)
				var blade: Vector2 = smudge.part_point("shovel", Vector2(520, 440))
				for i in 3:
					_bit("dirt", blade, Vector2(randf_range(-30, 110), randf_range(-190, -90)), 0.7, 520.0, Color(0.42, 0.26, 0.14))

	# past the daily amount, keys count for very little (macros gain nothing; people never get here)
	var amount := 1.0
	if keys_today > int(R["daily_keys"]["full"]):
		amount = float(R["daily_keys"]["after"])
	if test_mode:
		amount *= 20.0
	if skill == "Summoning":
		ink += amount
		if ink >= _summon_cost():
			if cloud.linked():
				_cloud_summon()
			else:
				ink -= _summon_cost()
				_summon()
	else:
		var before := int(progress / _need() * float(R["lock_pins"]))
		progress += amount
		if skill == "Lockpicking":
			var now := int(progress / _need() * float(R["lock_pins"]))
			if now > before and progress < _need():
				_play("pin", pow(1.122, float(now - 1)), -4.0)
				smudge.kick("head", -2.0)
		if progress >= _need():
			progress = 0.0
			_action()
	_update_hud()

# One finished action at a fishing, lockpicking or digging place.
func _action() -> void:
	var skill := _skill()
	var tier := _tier()
	var from := _loot_from()
	var n := 2 if randf() < _perk(skill, "double") else 1
	var best := ""
	if cloud.linked():
		# the server decides what was found; it arrives a moment later (see _cloud_roll)
		var lk := snappedf(float(_level(skill)) * float(R["loot"]["luck_per_level"]) + _perk(skill, "luck"), 0.01)
		var key := "%s|%s" % [_pid(), str(lk)]
		pend[key] = int(pend.get(key, 0)) + n
		hauls_unsent += 1
	else:
		for i in n:
			var id := _roll_loot(_place(), skill, 0.0)
			bag[id] = int(bag.get(id, 0)) + 1
			_fly(loot_tex.get(id), from + Vector2(i * 22, 0), smudge.named_point("bag"), 64.0, 0.35 + i * 0.12, 0.35, 0.55, 50.0)
			if best == "" or R["rarities"].find(str(items[id]["rarity"])) > R["rarities"].find(str(items[best]["rarity"])):
				best = id
	ink += float(tier["ink"])
	var it: Dictionary = items[best] if best != "" else {"name": "", "rarity": "common", "flavor": ""}
	if best != "":
		_float_text(str(it["name"]), from + Vector2(0, -74), Color(str(R["rarity_color"][str(it["rarity"])])), 14)
	match skill:
		"Fishing":
			bobber_dip = 9.0
			ripples.append_array([0.0, 0.12, 0.24])
			smudge.kick("rod", -8.0)
			_play("catch", 1.0, -6.0)
		"Lockpicking":
			_play("unlock", 1.0, -4.0)
			for i in 14:
				var a := randf() * TAU
				_bit("dot", from, Vector2(cos(a), sin(a) - 0.6) * randf_range(40, 130), 0.45, 260.0, Color(1.0, 0.9, 0.5))
		"Digging":
			_play("catch", 0.8, -6.0)
	_gain(skill, int(tier["xp"]))
	var rare := str(it["rarity"]) != "common"
	if rare:
		smudge.cheer(1.4)
	if best != "" and (rare or randf() < 0.25):
		_say_text(str(it["flavor"]))
	if ink >= _summon_cost() and not ink_told:
		ink_told = true
		_say("ink")
	_refresh_bag()

func _loot_from() -> Vector2:
	match _skill():
		"Fishing":
			return _sp(_view()["bob"])
		"Lockpicking":
			return smudge.named_point("hands") + Vector2(18, -6)
		"Digging":
			return smudge.named_point("blade")
	return smudge.position

func _roll_loot(place: Dictionary, skill: String, extra_luck: float) -> String:
	var luck := float(_level(skill)) * float(R["loot"]["luck_per_level"]) + _perk(skill, "luck") + extra_luck
	var total := 0.0
	var ws: Array = []
	for row in place["loot"]:
		var w := float(row[1])
		if str(items[row[0]]["rarity"]) != "common":
			w *= 1.0 + luck
		ws.append(w)
		total += w
	var pick := randf() * total
	for i in ws.size():
		pick -= float(ws[i])
		if pick <= 0.0:
			return str(place["loot"][i][0])
	return str(place["loot"][0][0])

func _gain(skill: String, amount: int) -> void:
	var before := _level(skill)
	xp[skill] = int(xp.get(skill, 0)) + amount
	var now := _level(skill)
	if now > before:
		_play("level", 1.0, -4.0)
		bursts.append({"at": smudge.position + Vector2(0, -60), "t": 0.0})
		_float_text("%s Lv %d" % [skill, now], smudge.position + Vector2(0, -150), Color("#FFD35C"), 20)
		smudge.cheer(1.6)
		for p in R["perks"]:
			if int(p["level"]) == now:
				_say_text("New perk: %s. %s." % [str(p["name"]), str(p["text"])])
		for i in R["places"].size():
			var pl: Dictionary = R["places"][i]
			if str(pl["skill"]) == skill and int(pl["level"]) == now:
				_say_text("New place unlocked: %s!" % str(pl["name"]))
		_refresh_places()

func _summon() -> void:
	var cost := _summon_cost()
	var lvl := _level("Summoning")
	var weights := {}
	for r in R["summon"]["weights"]:
		var w := float(R["summon"]["weights"][r])
		if r in ["rare", "epic", "legendary"]:
			w += float(R["summon"]["luck_per_level"]) * lvl
		weights[r] = w
	var total := 0.0
	for r in weights:
		total += float(weights[r])
	var pick := randf() * total
	var rarity := "common"
	for r in weights:
		pick -= float(weights[r])
		if pick <= 0.0:
			rarity = str(r)
			break
	var pool: Array = []
	for h in R["heroes"]:
		if str(h["rarity"]) == rarity:
			pool.append(h)
	var hero: Dictionary = pool[randi() % pool.size()]
	roster[str(hero["id"])] = int(roster.get(str(hero["id"]), 0)) + 1
	_summon_show(hero, int(roster[str(hero["id"])]) - 1, cost, true)

# the arrival itself: the card climbs out of the circle. local = this PC decided it (not linked), so it also hands out the shard and xp
func _summon_show(hero: Dictionary, had: int, cost: float, local: bool) -> void:
	var id := str(hero["id"])
	var rarity := str(hero["rarity"])
	ink_told = false
	circle_flash = 1.0
	_play("summon", 1.0, -4.0)
	var c := _sp(_view()["circle"])
	_fly(hero_tex[id], c, smudge.point(Vector2(400, 455)), 150.0, 0.7, 1.3, 0.45, 60.0)
	var label := str(hero["name"])
	if had > 0:
		var lv := _card_level(had + 1)
		label += "  Lv %d" % lv if lv > _card_level(had) else "  +1 copy"
		if local and _card_level(had) >= int(R["card"]["max_level"]):
			bag["x_shard"] = int(bag.get("x_shard", 0)) + 1
	else:
		label = "NEW: " + label
	_float_text(label, Vector2(c.x, minf(c.y + 40.0, WIN.y - 10.0)), Color(str(R["rarity_color"][rarity])), 16)
	if local:
		_gain("Summoning", int(cost * float(R["summon"]["xp_per_ink"])))
	if rarity in ["rare", "epic", "legendary", "absurd", "unhinged"] or had == 0:
		smudge.cheer(1.8)
	var i := ["sweet", "salty", "unhinged"].find(mode)
	_say_text(str(hero["lines"][i]))
	_refresh_roster()

func _open_crate() -> void:
	crate_ready = false
	var c := _crate_pos()
	var open_places: Array = []
	for i in R["places"].size():
		if _unlocked(i) and (R["places"][i]["loot"] as Array).size() > 0 and str(R["places"][i]["skill"]) != "Summoning":
			open_places.append(R["places"][i])
	# rift crates sometimes hold things from the neon decades (the Archive's own table)
	var rift: Dictionary = R["places"][0]
	var rift_chance := float(R.get("rift", {}).get("crate_chance", 0.0)) if (rift["loot"] as Array).size() > 0 else 0.0
	if open_places.is_empty():
		open_places.append(rift)
	for i in int(R["crate"]["rolls"]):
		var pl: Dictionary = rift if randf() < rift_chance else open_places[randi() % open_places.size()]
		if cloud.linked():
			var ck := "%s|%s" % [str(pl["id"]), str(snappedf(float(R["crate"]["luck"]), 0.01))]
			pend[ck] = int(pend.get(ck, 0)) + 1
			continue
		var id := _roll_loot(pl, str(pl["skill"]), float(R["crate"]["luck"]))
		bag[id] = int(bag.get(id, 0)) + 1
		_fly(loot_tex.get(id), c + Vector2(i * 26, -10), smudge.named_point("bag"), 60.0, 0.3 + i * 0.18, 0.4, 0.55, 60.0)
	var g := randi_range(int(R["crate"]["gold"][0]), int(R["crate"]["gold"][1]))
	gold += g
	ink += float(R["crate"]["ink"])
	_float_text("+%d gold  +%d ink" % [g, int(R["crate"]["ink"])], c + Vector2(60, -70), Color("#FFD35C"), 15)
	bursts.append({"at": c, "t": 0.0})
	_play("unlock", 1.1, -4.0)
	smudge.cheer(1.6)
	_refresh_bag()
	_update_hud()
	_save_game()

func _sell_extras() -> void:
	if cloud.linked():
		_cloud_sell()
		return
	_roll_day()
	var room := _sell_cap() - sold_today
	var earned := 0
	for id in bag.keys():
		var n := int(bag[id])
		var price := int(items[id]["sell"])
		while n > 1 and earned + price <= room:
			n -= 1
			earned += price
		bag[id] = n
	gold += earned
	sold_today += earned
	_refresh_bag()
	_play("sparkle" if earned > 0 else "blip", 1.0, -6.0)
	if earned > 0:
		_say_text("Sold the extras for %d gold." % earned)
	elif room <= 0:
		_say_text("The market's had enough of us today. Come back tomorrow.")
	else:
		_say_text("Nothing extra to sell yet.")

# ============================================================ drawing the effects

func draw_overlay(c: Node2D, layer: int) -> void:
	if layer == 1:
		_draw_top(c)
		return
	var skill := _skill()
	if skill == "Summoning":
		_draw_circle(c)
	elif skill == "Fishing" and not asleep:
		var b: Vector2 = _sp(_view()["bob"])
		var bob := b + Vector2(0, bobber_dip + sin(t * 1.7) * 1.2)
		for a in ripples:
			var age := float(a)
			var rr := 5.0 + age * 26.0
			_ring(c, b + Vector2(0, 3), Vector2(rr, rr * 0.32), 1.0, Color(0.85, 1.0, 1.0, clampf(0.9 - age * 0.65, 0.0, 1.0)), 2.0)
		c.draw_circle(bob, 5.5, Color("#0B1020"))
		c.draw_circle(bob, 4.5, Color("#FF4A3A"))
		c.draw_rect(Rect2(bob + Vector2(-4.5, 0.5), Vector2(9, 4)), Color("#F4F1E8"))
		c.draw_circle(bob + Vector2(-1.5, -2.0), 1.4, Color(1, 1, 1, 0.9))

# The ink ring fills round the painted circle; the middle glows as it nears closing.
func _draw_circle(c: Node2D) -> void:
	var v := _view()
	var center: Vector2 = _sp(v["circle"])
	var rad: Vector2 = (v["circle_r"] as Vector2) * scene_scale
	var f := clampf(ink / _summon_cost(), 0.0, 1.0)
	var g := maxf(clampf((f - 0.7) / 0.3, 0.0, 1.0), circle_flash)
	if g > 0.0:
		for i in 6:
			var k := 1.0 - float(i) / 6.0
			_fill_ellipse(c, center, rad * (0.25 + 0.7 * k), Color(0.45, 1.0, 0.9, 0.08 * g * (1.0 + 0.3 * sin(t * 4.0))))
	_ring(c, center, rad * 1.04, 1.0, Color(0.1, 0.2, 0.25, 0.55), 6.0)
	_ring(c, center, rad * 1.04, f, Color(0.6, 1.0, 0.95, 0.95), 4.5)
	if circle_flash > 0.0:
		_ring(c, center, rad * (1.04 + (1.0 - circle_flash) * 0.5), 1.0, Color(0.6, 1.0, 0.95, circle_flash), 7.0)

func _ring(c: Node2D, center: Vector2, rad: Vector2, frac: float, col: Color, width: float) -> void:
	if frac <= 0.0:
		return
	var pts := PackedVector2Array()
	var n := maxi(3, int(72 * frac))
	for i in n + 1:
		var a := -PI / 2.0 + TAU * frac * float(i) / float(n)
		pts.append(center + Vector2(cos(a) * rad.x, sin(a) * rad.y))
	c.draw_polyline(pts, col, width, true)

func _fill_ellipse(c: Node2D, center: Vector2, rad: Vector2, col: Color) -> void:
	var pts := PackedVector2Array()
	for i in 40:
		var a := TAU * float(i) / 40.0
		pts.append(center + Vector2(cos(a) * rad.x, sin(a) * rad.y))
	c.draw_colored_polygon(pts, col)

# Above Smudge: fishing line, lock pins, particles, flying loot, bursts, text, the crate, the portal.
func _draw_top(c: Node2D) -> void:
	var skill := _skill()
	if not asleep and travel_t < 0.0:
		if skill == "Fishing":
			var tip_p: Vector2 = smudge.part_point("rod", Vector2(470, 50))
			var bob: Vector2 = _sp(_view()["bob"]) + Vector2(0, bobber_dip + sin(t * 1.7) * 1.2)
			var pts := PackedVector2Array()
			var sag := 18.0 - minf(12.0, bobber_dip * 1.5)
			for i in 13:
				var u := float(i) / 12.0
				pts.append(tip_p.lerp(bob, u) + Vector2(0, sin(u * PI) * sag))
			c.draw_polyline(pts, Color(0.95, 0.97, 1.0, 0.9), 1.2, true)
		elif skill == "Lockpicking":
			var h: Vector2 = smudge.named_point("hands") + Vector2(-20, -44)
			var pins := int(R["lock_pins"])
			var f := clampf(progress / _need(), 0.0, 1.0) * pins
			for i in pins:
				var p := h + Vector2(i * 11, 0)
				var fill := clampf(f - float(i), 0.0, 1.0)
				c.draw_rect(Rect2(p - Vector2(4, 7), Vector2(8, 14)), Color(0.08, 0.1, 0.2, 0.9))
				c.draw_rect(Rect2(p + Vector2(-4, 7 - 14 * fill), Vector2(8, 14 * fill)), Color("#FFC83D"))
				c.draw_rect(Rect2(p - Vector2(4, 7), Vector2(8, 14)), Color("#0B1020"), false, 1.5)
	for p in bits:
		var u := float(p["t"]) / float(p["life"])
		var col: Color = p["col"]
		col.a = 1.0 - maxf(0.0, u - 0.6) / 0.4
		if str(p["kind"]) == "paper":
			var flip := cos(float(p["t"]) * 7.0 + float(p["w"]))
			var sz := Vector2(12.0 * absf(flip) + 2.0, 15.0)
			c.draw_set_transform(p["p"], float(p["t"]) * float(p["w"]), Vector2.ONE)
			c.draw_rect(Rect2(-sz / 2.0, sz), col)
			c.draw_rect(Rect2(-sz / 2.0, sz), Color(0.35, 0.25, 0.15, col.a * 0.8), false, 1.0)
			c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		else:
			c.draw_circle(p["p"], (2.6 if str(p["kind"]) == "dirt" else 1.9) * (1.0 - u * 0.5), col)
	if crate_ready:
		var cp := _crate_pos() + Vector2(0, sin(t * 3.0) * 3.0)
		var ct: Texture2D = loot_tex["x_crate"]
		_fill_ellipse(c, cp + Vector2(0, 4), Vector2(34, 30) * (1.0 + 0.08 * sin(t * 5.0)), Color(0.4, 1.0, 0.9, 0.18))
		c.draw_texture_rect(ct, Rect2(cp - Vector2(26, 26), Vector2(52, 52)), false)
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
		var sz2 := tx.get_size()
		var draw_size := sz2 * (side / maxf(sz2.x, sz2.y))
		c.draw_texture_rect(tx, Rect2(pos - draw_size / 2.0, draw_size), false, Color(1, 1, 1, alpha))
	for f in floaters:
		var u3 := float(f["t"]) / 1.8
		var at2: Vector2 = f["at"]
		var px := int(f["size"])
		var text := str(f["text"])
		var w := font_title.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, px).x
		var p2 := Vector2(clampf(at2.x - w / 2.0, 6.0, WIN.x - w - 6.0), maxf(at2.y - u3 * 26.0, 110.0))
		var a := 1.0 - maxf(0.0, u3 - 0.65) / 0.35
		c.draw_string_outline(font_title, p2, text, HORIZONTAL_ALIGNMENT_LEFT, -1, px, 6, Color(0.04, 0.06, 0.12, a))
		var col2: Color = f["col"]
		col2.a = a
		c.draw_string(font_title, p2, text, HORIZONTAL_ALIGNMENT_LEFT, -1, px, col2)
	if travel_t >= 0.0:
		var k2 := clampf(travel_t / TRAVEL_OUT if travel_t < TRAVEL_OUT else 1.0 - (travel_t - TRAVEL_OUT) / TRAVEL_IN, 0.0, 1.0)
		var center: Vector2 = smudge.position + Vector2(0, -70)
		for i in 5:
			var r := (30.0 + i * 22.0) * (0.4 + k2)
			var a0 := travel_t * (6.0 - i) + i
			c.draw_arc(center, r, a0, a0 + PI * 1.3, 32, Color(0.5, 1.0, 0.92, k2 * (0.9 - i * 0.12)), 3.0 - i * 0.3, true)
		for i in 18:
			var a1 := float(i) / 18.0 * TAU + travel_t * 4.0
			var r2 := 40.0 + 80.0 * fmod(float(i) * 0.37 + travel_t, 1.0)
			c.draw_circle(center + Vector2(cos(a1), sin(a1) * 0.7) * r2 * (0.5 + k2 * 0.8), 2.0, Color(1.0, 0.95, 0.7, k2))

# ============================================================ HUD and speech

func _label(font_px: int, outline: bool, title := false) -> Label:
	var l := Label.new()
	l.add_theme_font_override("font", font_title if title else font_body)
	l.add_theme_font_size_override("font_size", font_px)
	l.add_theme_color_override("font_color", Color.WHITE if outline else Color("#1E2A47"))
	if outline:
		l.add_theme_color_override("font_outline_color", Color("#0B1020"))
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
	return sb

func _build_hud() -> void:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", _panel_style(Color("#141C33F2"), Color("#3A4A72")))
	p.position = Vector2(8, 8)
	p.custom_minimum_size = Vector2(230, 0)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(p)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 1)
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
	bg.bg_color = Color("#0B1020")
	bg.set_corner_radius_all(6)
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("#19C9B3")
	fill.set_corner_radius_all(6)
	hud_bar.add_theme_stylebox_override("background", bg)
	hud_bar.add_theme_stylebox_override("fill", fill)
	hud_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(hud_bar)
	hud_count = _label(12, false)
	hud_count.add_theme_color_override("font_color", Color("#AEB8D0"))
	v.add_child(hud_count)
	hud_ink = _label(12, false)
	hud_ink.add_theme_color_override("font_color", Color("#5CE0C6"))
	v.add_child(hud_ink)

func _update_hud() -> void:
	if hud_title == null:
		return
	var pl := _place()
	var skill := _skill()
	hud_title.text = str(pl["name"])
	hud_sub.text = "%s Lv %d · %s" % [skill, _level(skill), str(pl["era"])]
	var cost := _summon_cost()
	if skill == "Summoning":
		hud_bar.max_value = cost
		hud_bar.value = ink
		hud_count.text = "%d of %d heroes met" % [roster.size(), R["heroes"].size()]
	else:
		hud_bar.max_value = _need()
		hud_bar.value = progress
		var word: String = {"Fishing": "bite", "Lockpicking": "lock", "Digging": "find"}[skill]
		hud_count.text = "Next %s in %d keys" % [word, maxi(0, int(ceil(_need() - progress)))]
	hud_ink.text = "Ink %s / %s%s" % [_num(int(ink)), _num(int(cost)), "  ·  ready, go to the Archive" if ink >= cost and skill != "Summoning" else ""]

func _num(n: int) -> String:
	var s := str(n)
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return s + out

func _build_bubble() -> void:
	bubble = PanelContainer.new()
	bubble.add_theme_stylebox_override("panel", _panel_style(Color(1, 1, 1, 0.97), Color("#1E2A47"), 12))
	bubble_label = _label(14, false)
	bubble_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bubble_label.custom_minimum_size = Vector2(180, 0)
	bubble.add_child(bubble_label)
	bubble.visible = false
	bubble.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bubble)

func _say(event: String) -> void:
	if asleep and event != "sleep":
		return
	if api_key != "" and event in ["idle", "busy", "move", "dig", "crate"] and randf() < 0.6:
		_ask_ai(event)
		return
	var pack: Dictionary = Voice.LINES[mode]
	var lines: Array = pack.get(event, pack["idle"])
	_say_text(str(lines[randi() % lines.size()]))

var bubble_tween: Tween
func _say_text(text: String) -> void:
	bubble_label.text = text
	bubble.visible = true
	bubble.reset_size()
	var head: Vector2 = smudge.top_left() + Vector2(smudge.size().x * 0.5, 0)
	if head.y - bubble.size.y - 4.0 >= 104.0:
		bubble.position = Vector2(clampf(head.x - 30, 4, WIN.x - bubble.size.x - 4), head.y - bubble.size.y - 4.0)
	else:
		# no room above him under the HUD: put it beside his head instead
		var side: float = smudge.top_left().x + smudge.size().x * 0.92
		if side + bubble.size.x > WIN.x - 4.0:
			side = smudge.top_left().x - bubble.size.x + smudge.size().x * 0.08
		bubble.position = Vector2(clampf(side, 4, WIN.x - bubble.size.x - 4), maxf(104.0, head.y + 4.0))
	bubble.scale = Vector2(0.6, 0.6)
	bubble.pivot_offset = Vector2(30, bubble.size.y)
	_play("blip", randf_range(0.95, 1.1), -14.0)
	if not asleep:
		smudge.say(minf(2.6, 0.5 + text.length() * 0.035))
	if bubble_tween:
		bubble_tween.kill()
	bubble_tween = create_tween()
	bubble_tween.tween_property(bubble, "scale", Vector2.ONE, 0.15).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	bubble_tween.tween_interval(clampf(2.2 + text.length() * 0.04, 3.0, 6.5))
	bubble_tween.tween_callback(func(): bubble.visible = false)

func _ask_ai(event: String) -> void:
	if http.get_http_client_status() != HTTPClient.STATUS_DISCONNECTED:
		return
	var system: String = Voice.AI_SYSTEM[mode]
	var prompt := "Event: %s. Location: %s (%s). %s level %d. Heroes summoned so far: %d." % [
		event, str(_place()["name"]), str(_place()["era"]), _skill(), _level(_skill()), roster.size()]
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
		_say_offline()

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
		_say_offline()
		return
	if ai_status:
		ai_status.text = "AI is talking."
	_say_text(text.strip_edges().left(140))

func _say_offline() -> void:
	var lines: Array = Voice.LINES[mode]["idle"]
	_say_text(str(lines[randi() % lines.size()]))

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

func _start_ambience() -> void:
	if ambience == null:
		return
	var kind: String = {"Summoning": "archive", "Fishing": "dock", "Lockpicking": "speakeasy", "Digging": "dock"}[_skill()]
	var stream: AudioStreamWAV = load("res://sfx/amb_%s.wav" % kind)
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = int(stream.get_length() * stream.mix_rate)
	if ambience.stream != stream:
		ambience.stream = stream
		ambience.play()
	ambience.stream_paused = not sound_on

# ============================================================ menu

func _build_menu() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	menu = PanelContainer.new()
	menu.position = Vector2(WIN.x - 336, 6)
	menu.custom_minimum_size = Vector2(330, 368)
	menu.size = Vector2(330, 368)
	var th := Theme.new()
	th.default_font = font_body
	th.default_font_size = 14
	th.set_color("font_color", "Label", Color("#EEF2FA"))
	var b_normal := _panel_style(Color("#F2B935"), Color("#0B1020"), 9)
	b_normal.set_content_margin_all(5)
	b_normal.content_margin_left = 10
	b_normal.content_margin_right = 10
	b_normal.border_width_bottom = 4
	var b_hover: StyleBoxFlat = b_normal.duplicate()
	b_hover.bg_color = Color("#FFD35C")
	var b_press: StyleBoxFlat = b_normal.duplicate()
	b_press.bg_color = Color("#E0A41F")
	b_press.border_width_bottom = 2
	var b_off: StyleBoxFlat = b_normal.duplicate()
	b_off.bg_color = Color("#3A4466")
	for kind in ["Button", "OptionButton"]:
		th.set_stylebox("normal", kind, b_normal)
		th.set_stylebox("hover", kind, b_hover)
		th.set_stylebox("pressed", kind, b_press)
		th.set_stylebox("hover_pressed", kind, b_press)
		th.set_stylebox("disabled", kind, b_off)
		th.set_stylebox("focus", kind, StyleBoxEmpty.new())
		for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
			th.set_color(state, kind, Color("#141C33"))
		th.set_color("font_disabled_color", kind, Color("#9AA6C4"))
	var empty := StyleBoxEmpty.new()
	for st in ["normal", "hover", "pressed", "hover_pressed", "focus", "disabled"]:
		th.set_stylebox(st, "CheckBox", empty)
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		th.set_color(state, "CheckBox", Color("#EEF2FA"))
	th.set_icon("unchecked", "CheckBox", _box_icon(false))
	th.set_icon("checked", "CheckBox", _box_icon(true))
	th.set_stylebox("panel", "PopupMenu", _panel_style(Color("#141C33"), Color("#F2B935"), 8))
	th.set_color("font_color", "PopupMenu", Color("#EEF2FA"))
	th.set_color("font_hover_color", "PopupMenu", Color("#141C33"))
	var hov := StyleBoxFlat.new()
	hov.bg_color = Color("#F2B935")
	hov.set_corner_radius_all(4)
	th.set_stylebox("hover", "PopupMenu", hov)
	var le := _panel_style(Color("#0B1020"), Color("#3A4A72"), 8)
	le.set_content_margin_all(6)
	th.set_stylebox("normal", "LineEdit", le)
	th.set_stylebox("focus", "LineEdit", le)
	th.set_color("font_color", "LineEdit", Color("#EEF2FA"))
	th.set_color("font_placeholder_color", "LineEdit", Color("#7C88A6"))
	menu.theme = th
	var frame := _panel_style(Color("#121A30FA"), Color("#F2B935"), 16)
	frame.set_content_margin_all(10)
	menu.add_theme_stylebox_override("panel", frame)
	layer.add_child(menu)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	menu.add_child(v)
	var header := HBoxContainer.new()
	header.mouse_filter = Control.MOUSE_FILTER_STOP
	header.mouse_default_cursor_shape = Control.CURSOR_MOVE
	header.gui_input.connect(_on_menu_header_input)
	v.add_child(header)
	var title := _label(22, true, true)
	title.text = "Smudge's Ledger"
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	header.add_child(_button("X", _close_menu))
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

	places_box = VBoxContainer.new()
	places_box.add_theme_constant_override("separation", 6)
	pages.add_child(places_box)
	tab_boxes["Places"] = places_box

	var roster_box := VBoxContainer.new()
	pages.add_child(roster_box)
	tab_boxes["Heroes"] = roster_box
	roster_grid = GridContainer.new()
	roster_grid.columns = 3
	roster_grid.add_theme_constant_override("h_separation", 6)
	roster_grid.add_theme_constant_override("v_separation", 6)
	roster_box.add_child(roster_grid)

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
	bag_hint = _note("")
	bag_box.add_child(bag_hint)

	var talk := VBoxContainer.new()
	talk.add_theme_constant_override("separation", 6)
	pages.add_child(talk)
	tab_boxes["Smudge"] = talk
	talk.add_child(_section("Voice"))
	mode_option = OptionButton.new()
	mode_option.focus_mode = Control.FOCUS_NONE
	for m in ["sweet", "salty", "unhinged"]:
		mode_option.add_item(str(Voice.MODE_NAMES[m]))
	mode_option.select(["sweet", "salty", "unhinged"].find(mode))
	mode_option.item_selected.connect(_set_mode)
	talk.add_child(mode_option)
	talk.add_child(_section("Your own AI (optional)"))
	talk.add_child(_note("Lets Smudge improvise. The key stays encrypted on this PC."))
	ai_provider = OptionButton.new()
	ai_provider.focus_mode = Control.FOCUS_NONE
	for p in ["OpenAI", "Anthropic (Claude)", "xAI (Grok)"]:
		ai_provider.add_item(p)
	ai_provider.select(api_provider)
	ai_provider.item_selected.connect(func(i): ai_model.placeholder_text = "model: " + str(MODELS[i]))
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
	ai_status = _note("Using built-in lines." if api_key == "" else "AI key saved.")
	talk.add_child(ai_status)

	var settings := VBoxContainer.new()
	settings.add_theme_constant_override("separation", 4)
	pages.add_child(settings)
	tab_boxes["Settings"] = settings
	var lt := _label(14, false, true)
	lt.text = "Your account"
	lt.add_theme_color_override("font_color", Color("#F2B935"))
	settings.add_child(lt)
	link_status = _note("")
	settings.add_child(link_status)
	var lrow := HBoxContainer.new()
	link_code = LineEdit.new()
	link_code.placeholder_text = "Code from oversummoned.com"
	link_code.max_length = 12
	link_code.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lrow.add_child(link_code)
	lrow.add_child(_button("Link", _link_now))
	lrow.add_child(_button("Unlink", _unlink))
	settings.add_child(lrow)
	settings.add_child(_button("Link in browser (no code)", _link_browser))
	_refresh_link()
	settings.add_child(_section("Sound"))
	settings.add_child(_check("Sound", sound_on, _set_sound))
	settings.add_child(_check("Key click sounds", key_sounds, func(on): key_sounds = on))
	settings.add_child(_section("Window"))
	settings.add_child(_check("Always on top", true, func(on): DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_ALWAYS_ON_TOP, on)))
	var size_row := HBoxContainer.new()
	size_row.add_theme_constant_override("separation", 4)
	for i in 3:
		size_row.add_child(_button(["Small", "Normal", "Large"][i], _set_size.bind(i)))
	settings.add_child(size_row)
	settings.add_child(_button("Snap to bottom-right", _place_window))
	settings.add_child(_section("Testing"))
	settings.add_child(_check("Test mode (20x faster)", test_mode, func(on): test_mode = on))
	settings.add_child(_check("Demo typing (types for you)", demo_typing, func(on): demo_typing = on))
	settings.add_child(_note("Right-drag the scene to move the window. Drag this menu by its title. Click Smudge to open it."))
	var danger := HBoxContainer.new()
	danger.add_child(_button("Reset progress", _reset_progress))
	danger.add_child(_button("Quit", _quit))
	settings.add_child(danger)

	# the item and hero tooltip
	tip = PanelContainer.new()
	var ts := _panel_style(Color("#070B16F5"), Color("#8892B0"), 8)
	ts.set_border_width_all(2)
	tip.add_theme_stylebox_override("panel", ts)
	tip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tip.visible = false
	tip_text = RichTextLabel.new()
	tip_text.bbcode_enabled = true
	tip_text.fit_content = true
	tip_text.scroll_active = false
	tip_text.custom_minimum_size = Vector2(210, 0)
	tip_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tip_text.add_theme_font_override("normal_font", font_body)
	tip_text.add_theme_font_override("bold_font", font_title)
	tip_text.add_theme_font_size_override("normal_font_size", 13)
	tip_text.add_theme_font_size_override("bold_font_size", 15)
	tip_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tip.add_child(tip_text)
	layer.add_child(tip)

	_refresh_places()
	_refresh_roster()
	_refresh_bag()
	_show_tab("Places")
	menu.visible = false

func _box_icon(on: bool) -> ImageTexture:
	var img := Image.create(18, 18, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	for y in 18:
		for x in 18:
			var edge := x < 2 or y < 2 or x > 15 or y > 15
			if on:
				img.set_pixel(x, y, Color("#FFD35C") if edge else Color("#F2B935"))
			elif edge:
				img.set_pixel(x, y, Color("#9AA6C4"))
	if on:
		for p in [Vector2i(4, 9), Vector2i(5, 10), Vector2i(6, 11), Vector2i(7, 12), Vector2i(8, 11), Vector2i(9, 10), Vector2i(10, 9), Vector2i(11, 8), Vector2i(12, 7), Vector2i(13, 6)]:
			for d in [Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 0)]:
				img.set_pixelv(p + d, Color("#141C33"))
	return ImageTexture.create_from_image(img)

func _section(text: String) -> Label:
	var l := _label(15, false, true)
	l.text = text
	l.add_theme_color_override("font_color", Color("#F2B935"))
	return l

func _note(text: String) -> Label:
	var l := Label.new()
	l.text = text
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(296, 0)
	l.add_theme_font_size_override("font_size", 12)
	l.add_theme_color_override("font_color", Color("#9AA6C4"))
	return l

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

func _card_style(border: Color, bg := Color("#0B1020")) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(8)
	sb.set_content_margin_all(4)
	return sb

func _on_menu_header_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		menu_drag = event.pressed
		menu_drag_from = event.global_position - menu.position
	elif event is InputEventMouseMotion and menu_drag:
		var p: Vector2 = event.global_position - menu_drag_from
		menu.position = Vector2(clampf(p.x, 0.0, WIN.x - menu.size.x), clampf(p.y, 0.0, WIN.y - 40.0))

func _show_tab(tab_name: String) -> void:
	_hide_tip()
	for k in tab_boxes:
		tab_boxes[k].visible = (k == tab_name)
	for k in tab_buttons:
		var b: Button = tab_buttons[k]
		var on: bool = k == tab_name
		var sb := _panel_style(Color("#F2B935") if on else Color("#1E2848"), Color("#0B1020") if on else Color("#3A4A72"), 9)
		sb.set_content_margin_all(4)
		b.add_theme_stylebox_override("normal", sb)
		b.add_theme_stylebox_override("hover", sb)
		b.add_theme_color_override("font_color", Color("#141C33") if on else Color("#C9D2E8"))
		b.add_theme_color_override("font_hover_color", Color("#141C33") if on else Color.WHITE)
	if tab_name == "Bag":
		_refresh_bag()
	if tab_name == "Places":
		loot_view = ""
		_refresh_places()
	_play("blip", 1.0, -14.0)

func _toggle_menu() -> void:
	menu.visible = not menu.visible
	_apply_window_size()
	if menu.visible:
		_show_tab("Places")
		smudge.kick("head", 2.5)

func _close_menu() -> void:
	menu.visible = false
	_hide_tip()
	_apply_window_size()

# ------------------------------------------------------------ tooltips (World of Warcraft style)

func _hex(rarity: String) -> String:
	return str(R["rarity_color"][rarity])

func _item_tip(id: String) -> String:
	var it: Dictionary = items[id]
	var s := "[b][color=%s]%s[/color][/b]\n" % [_hex(str(it["rarity"])), str(it["name"])]
	if str(it["kind"]) == "gear":
		s += "[color=#c9d2e8]%s  ·  %s[/color]\n" % [str(it["slot"]).capitalize(), str(it["rarity"]).capitalize()]
		for k in it["stats"]:
			s += "+%d %s\n" % [int(it["stats"][k]), str(k).capitalize()]
		if it.has("equip"):
			s += "[color=#3ecf6b]Equip: +%d%% %s speed[/color]\n" % [int(it["equip"]["speed"]), str(it["equip"]["skill"])]
		var owner: Dictionary = heroes_by_id[str(it["owner"])]
		s += "[color=#5ce0c6]Signature: %s (+50%% on them)[/color]\n" % str(owner["name"])
	else:
		s += "[color=#c9d2e8]Treasure  ·  %s[/color]\n" % str(it["rarity"]).capitalize()
	s += "[color=#ffd35c]\"%s\"[/color]\n" % str(it["flavor"])
	for p in R["places"]:
		if str(p["id"]) == str(it["place"]):
			s += "[color=#9aa6c4]Found at: %s[/color]\n" % str(p["name"])
	s += "[color=#9aa6c4]Sells for %d gold[/color]" % int(it["sell"])
	if bag.has(id):
		s += "[color=#9aa6c4]  ·  you have %d[/color]" % int(bag[id])
	return s

func _hero_tip(h: Dictionary) -> String:
	var owned := int(roster.get(str(h["id"]), 0))
	if owned == 0:
		return "[b][color=#9aa6c4]???[/color][/b]\nNot summoned yet. Somebody out there is about to have a very strange day."
	var lvl := _card_level(owned)
	var mult := 1.0 + float(R["card"]["stat_per_level"]) * float(lvl - 1)
	var s := "[b][color=%s]%s[/color][/b]\n[color=#c9d2e8]%s  ·  %s  ·  %s[/color]\n[color=#c9d2e8]%s %s  ·  Card Lv %d[/color]\n" % [
		_hex(str(h["rarity"])), str(h["name"]), str(h["title"]), str(h["era"]), str(h["species"]), str(h["rarity"]).capitalize(), "", lvl]
	var line := ""
	for k in R["stats"]:
		line += "%s %d   " % [str(k).capitalize().left(3), int(round(float(h["stats"][k]) * mult))]
	s += line + "\n[color=#ffd35c]%s[/color]\n" % str(h["bio"])
	if str(h.get("fact", "")) != "":
		s += "[color=#9fd8ff]True fact: %s[/color]\n" % str(h["fact"])
	var have := 0
	for g in h["gear"]:
		if bag.has(g):
			have += 1
	s += "[color=#5ce0c6]Signature items found: %d of 3[/color]" % have
	return s

func _show_tip(text: String, near: Control) -> void:
	tip_text.text = text
	tip.visible = true
	tip.reset_size()
	var r := near.get_global_rect()
	var x := r.position.x - tip.size.x - 6.0
	if x < 4.0:
		x = minf(r.end.x + 6.0, WIN.x - tip.size.x - 4.0)
	tip.position = Vector2(x, clampf(r.position.y, 4.0, maxf(4.0, WIN.y - tip.size.y - 4.0)))

func _hide_tip() -> void:
	if tip != null:
		tip.visible = false

func _with_tip(node: Control, text_maker: Callable) -> void:
	node.mouse_filter = Control.MOUSE_FILTER_STOP
	node.mouse_entered.connect(func(): _show_tip(text_maker.call(), node))
	node.mouse_exited.connect(_hide_tip)

# ------------------------------------------------------------ menu pages

func _refresh_places() -> void:
	if places_box == null:
		return
	for ch in places_box.get_children():
		ch.queue_free()
	if loot_view != "":
		_build_loot_list()
		return
	for i in R["places"].size():
		var pl: Dictionary = R["places"][i]
		var here = i == place_index
		var open := _unlocked(i)
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", _card_style(Color("#F2B935") if here else Color("#2C3A5E"), Color("#1A2442") if here else Color("#0F1629")))
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		card.add_child(row)
		var pic := TextureRect.new()
		pic.texture = tex["scene_" + str(pl["id"])]
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(76, 54)
		if not open:
			pic.modulate = Color(0.1, 0.12, 0.22, 0.9)
		row.add_child(pic)
		var col := VBoxContainer.new()
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		col.add_theme_constant_override("separation", 1)
		row.add_child(col)
		var name_l := _label(15, false, true)
		name_l.text = str(pl["name"])
		name_l.add_theme_color_override("font_color", Color.WHITE if open else Color("#7C88A6"))
		col.add_child(name_l)
		var d := _note("%s · %s" % [str(pl["era"]), str(pl["skill"])])
		d.custom_minimum_size = Vector2(190, 0)
		col.add_child(d)
		var btns := HBoxContainer.new()
		btns.add_theme_constant_override("separation", 4)
		col.add_child(btns)
		if here:
			var hl := _note("Smudge is here")
			hl.custom_minimum_size = Vector2(0, 0)
			hl.autowrap_mode = TextServer.AUTOWRAP_OFF
			hl.add_theme_color_override("font_color", Color("#5CE0C6"))
			btns.add_child(hl)
		elif open:
			var go := _button("Travel", _travel.bind(i))
			go.add_theme_font_size_override("font_size", 12)
			btns.add_child(go)
		else:
			var lock := _note("Needs %s Lv %d" % [str(pl["skill"]), int(pl["level"])])
			lock.custom_minimum_size = Vector2(0, 0)
			lock.autowrap_mode = TextServer.AUTOWRAP_OFF
			lock.add_theme_color_override("font_color", Color("#FF8C6B"))
			btns.add_child(lock)
		if (pl["loot"] as Array).size() > 0:
			var lb := _button("Loot", _open_loot.bind(str(pl["id"])))
			lb.add_theme_font_size_override("font_size", 12)
			lb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			btns.add_child(lb)
		_with_tip(card, func(): return "[b]%s[/b]\n[color=#ffd35c]%s[/color]" % [str(pl["name"]), str(pl["blurb"])])
		places_box.add_child(card)

func _open_loot(id: String) -> void:
	loot_view = id
	_refresh_places()

func _close_loot() -> void:
	loot_view = ""
	_refresh_places()

# Everything that can drop at one place, with the odds. Items you have not found yet are shadows.
func _build_loot_list() -> void:
	var pl: Dictionary = {}
	for p in R["places"]:
		if str(p["id"]) == loot_view:
			pl = p
	var top := HBoxContainer.new()
	top.add_child(_button("< Back", _close_loot))
	var tl := _label(15, false, true)
	tl.text = "  " + str(pl["name"])
	tl.add_theme_color_override("font_color", Color.WHITE)
	top.add_child(tl)
	places_box.add_child(top)
	var total := 0.0
	for row in pl["loot"]:
		total += float(row[1])
	var grid := GridContainer.new()
	grid.columns = 6
	grid.add_theme_constant_override("h_separation", 4)
	grid.add_theme_constant_override("v_separation", 4)
	places_box.add_child(grid)
	for row in pl["loot"]:
		var id := str(row[0])
		var found := bag.has(id)
		var chance := float(row[1]) / total * 100.0
		var slot := _slot(id, 0, found)
		_with_tip(slot, func(): return (_item_tip(id) if found else "[b][color=%s]???[/color][/b]\n[color=#c9d2e8]%s[/color]\nNot found yet." % [_hex(str(items[id]["rarity"])), str(items[id]["rarity"]).capitalize()]) + "\n[color=#9aa6c4]Drop chance: %s%%[/color]" % (("%.1f" % chance) if chance >= 1.0 else ("%.2f" % chance)))
		grid.add_child(slot)
	places_box.add_child(_note("Hover an item for its odds. Skill level and perks raise the chance of everything above common."))

func _slot(id: String, count: int, lit := true) -> PanelContainer:
	var slot := PanelContainer.new()
	slot.custom_minimum_size = Vector2(46, 46)
	if id == "":
		slot.add_theme_stylebox_override("panel", _card_style(Color("#222D4C"), Color("#0D1427")))
		return slot
	var rc := Color(_hex(str(items[id]["rarity"])))
	slot.add_theme_stylebox_override("panel", _card_style(rc if lit else rc.darkened(0.55), Color("#182343")))
	var icon := TextureRect.new()
	icon.texture = loot_tex.get(id)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if not lit:
		icon.modulate = Color(0.04, 0.06, 0.13, 0.95)
	slot.add_child(icon)
	if count > 1:
		var badge := _label(12, true, true)
		badge.text = str(count)
		badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		badge.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
		slot.add_child(badge)
	return slot

func _refresh_roster() -> void:
	if roster_grid == null:
		return
	for ch in roster_grid.get_children():
		ch.queue_free()
	for h in R["heroes"]:
		var id := str(h["id"])
		var owned := int(roster.get(id, 0))
		var rc := Color(_hex(str(h["rarity"])))
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", _card_style(rc if owned > 0 else Color("#2C3A5E")))
		card.custom_minimum_size = Vector2(94, 0)
		var cell := VBoxContainer.new()
		cell.add_theme_constant_override("separation", 0)
		cell.mouse_filter = Control.MOUSE_FILTER_IGNORE
		card.add_child(cell)
		var pic := TextureRect.new()
		pic.texture = hero_tex[id]
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(86, 92)
		pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if owned == 0:
			pic.modulate = Color(0.04, 0.06, 0.13, 0.95)   # a silhouette until they are summoned
		cell.add_child(pic)
		var n := Label.new()
		n.text = (str(h["name"]) + ("  Lv %d" % _card_level(owned) if owned > 1 else "")) if owned > 0 else "???"
		n.add_theme_font_size_override("font_size", 11)
		n.add_theme_color_override("font_color", rc if owned > 0 else Color("#5A668A"))
		n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		n.custom_minimum_size = Vector2(86, 0)
		n.mouse_filter = Control.MOUSE_FILTER_IGNORE
		cell.add_child(n)
		_with_tip(card, _hero_tip.bind(h))
		roster_grid.add_child(card)

func _refresh_bag() -> void:
	if bag_grid == null:
		return
	var total := 0
	for k in bag:
		total += int(bag[k])
	coins_label.text = "%s gold" % _num(gold)
	bag_hint.text = ("%d items, %d kinds. Hover one for details. Selling today: %s of %s gold." % [total, bag.size(), _num(sold_today), _num(_sell_cap())]) if total > 0 else "Empty. Go fishing, crack a safe or dig something up."
	for ch in bag_grid.get_children():
		ch.queue_free()
	var ids := bag.keys()
	var order: Array = R["rarities"]
	ids.sort_custom(func(a, b):
		var ra := order.find(str(items[a]["rarity"]))
		var rb := order.find(str(items[b]["rarity"]))
		return ra > rb if ra != rb else str(items[a]["name"]) < str(items[b]["name"]))
	for i in maxi(30, int(ceil(ids.size() / 6.0)) * 6):
		if i < ids.size():
			var id := str(ids[i])
			var slot := _slot(id, int(bag[id]))
			_with_tip(slot, _item_tip.bind(id))
			bag_grid.add_child(slot)
		else:
			bag_grid.add_child(_slot("", 0))

# ------------------------------------------------------------ menu actions

func _set_mode(i: int) -> void:
	mode = ["sweet", "salty", "unhinged"][i]
	_save_game()
	_say("idle")

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

func _set_size(i: int) -> void:
	size_index = i
	_apply_window_size()
	_save_game()

func _reset_progress() -> void:
	if not reset_armed:
		reset_armed = true
		_say_text("Click Reset again to wipe everything. Everything.")
		return
	reset_armed = false
	place_index = 0
	progress = 0.0
	ink = 0.0
	xp = {"Summoning": 0, "Fishing": 0, "Lockpicking": 0, "Digging": 0}
	bag = {}
	roster = {}
	gold = 0
	total_keys = 0
	keys_today = 0
	sold_today = 0
	crate_clock = 0.0
	crate_ready = false
	_enter_place(false)
	_refresh_bag()
	_refresh_roster()
	_refresh_places()
	_say_text("Fresh ledger. Nobody remembers anything.")

func _quit() -> void:
	_save_game()
	get_tree().quit()

# ============================================================ saving

func _save_game() -> void:
	var cfg := ConfigFile.new()
	var g := {"place": _pid(), "progress": progress, "ink": ink, "xp": xp, "bag": bag, "roster": roster, "gold": gold,
		"total_keys": total_keys, "keys_today": keys_today, "sold_today": sold_today, "day": day, "crate_clock": crate_clock, "crate_ready": crate_ready}
	for k in g:
		cfg.set_value("game", k, g[k])
	var pf := {"mode": mode, "sound": sound_on, "key_sounds": key_sounds, "size": size_index}
	for k in pf:
		cfg.set_value("prefs", k, pf[k])
	cfg.set_value("ai", "provider", api_provider)
	cfg.set_value("ai", "model", api_model)
	cfg.set_value("ai", "key", api_key)
	cfg.set_value("link", "token", cloud.token if cloud != null else "")
	cfg.set_value("link", "name", cloud.username if cloud != null else "")
	cfg.save_encrypted_pass(SAVE_PATH, OS.get_unique_id())

func _load_game() -> void:
	if cloud == null:
		cloud = CloudScript.new()
		add_child(cloud)
	var cfg := ConfigFile.new()
	if cfg.load_encrypted_pass(SAVE_PATH, OS.get_unique_id()) != OK:
		return
	cloud.token = str(cfg.get_value("link", "token", ""))
	cloud.username = str(cfg.get_value("link", "name", ""))
	var want := str(cfg.get_value("game", "place", "archive"))
	for i in R["places"].size():
		if str(R["places"][i]["id"]) == want:
			place_index = i
	progress = float(cfg.get_value("game", "progress", 0.0))
	ink = float(cfg.get_value("game", "ink", 0.0))
	var x = cfg.get_value("game", "xp", {})
	if x is Dictionary:
		for k in x:
			xp[str(k)] = int(x[k])
	var b = cfg.get_value("game", "bag", {})
	if b is Dictionary:
		for k in b:
			if items.has(str(k)):
				bag[str(k)] = int(b[k])
	var r = cfg.get_value("game", "roster", {})
	if r is Dictionary:
		for k in r:
			if heroes_by_id.has(str(k)):
				roster[str(k)] = int(r[k])
	gold = int(cfg.get_value("game", "gold", 0))
	total_keys = int(cfg.get_value("game", "total_keys", 0))
	keys_today = int(cfg.get_value("game", "keys_today", 0))
	sold_today = int(cfg.get_value("game", "sold_today", 0))
	day = str(cfg.get_value("game", "day", ""))
	crate_clock = float(cfg.get_value("game", "crate_clock", 0.0))
	crate_ready = bool(cfg.get_value("game", "crate_ready", false))
	mode = str(cfg.get_value("prefs", "mode", "salty"))
	if not (mode in ["sweet", "salty", "unhinged"]):
		mode = "salty"
	sound_on = bool(cfg.get_value("prefs", "sound", true))
	key_sounds = bool(cfg.get_value("prefs", "key_sounds", false))
	size_index = int(cfg.get_value("prefs", "size", 1))
	api_provider = int(cfg.get_value("ai", "provider", 0))
	api_model = str(cfg.get_value("ai", "model", ""))
	api_key = str(cfg.get_value("ai", "key", ""))


# ============================================================ the account link
func _refresh_link() -> void:
	if link_status == null:
		return
	if link_req != "":
		link_status.text = "Your browser has opened oversummoned.com. Sign in if it asks, check it shows %s, and press Yes. Waiting." % link_req.left(4).to_upper()
	elif cloud.linked():
		link_status.text = "Linked to %s. Everything here is the same ledger as the website." % (cloud.username if cloud.username != "" else "your account")
	else:
		link_status.text = "Not linked. Press Link in browser, or get a code on oversummoned.com (Account, Link a desktop pet) and type it here. Once per computer. On Steam neither will be needed."

func _link_now() -> void:
	var code := link_code.text.strip_edges()
	if code == "" or cloud_busy:
		return
	cloud_busy = true
	link_status.text = "Asking the ledger."
	var r = await cloud.claim(code, "Desktop pet on %s" % OS.get_name())
	cloud_busy = false
	if not (r is Dictionary):
		link_status.text = "Could not reach oversummoned.com. Check the internet and try again."
		return
	if str(r.get("r", "")) != "ok":
		link_status.text = str(r.get("r", "That did not work."))
		return
	cloud.token = str(r["token"])
	cloud.username = str(r.get("username", ""))
	link_code.text = ""
	_save_game()
	_refresh_link()
	await _cloud_load()

# the no-typing way: make up a long random id, open the website with it, and keep asking until the player says Yes there
func _link_browser() -> void:
	if cloud.linked():
		return
	var bytes := Crypto.new().generate_random_bytes(20)
	link_req = bytes.hex_encode()
	link_left = 600.0
	link_poll_t = 3.0
	OS.shell_open("https://oversummoned.com/play?pet=" + link_req)
	_refresh_link()

func _link_poll() -> void:
	var req := link_req
	cloud_busy = true
	var r = await cloud.poll(req)
	cloud_busy = false
	if req != link_req or not (r is Dictionary) or str(r.get("r", "")) != "ok":
		return
	link_req = ""
	cloud.token = str(r["token"])
	cloud.username = str(r.get("username", ""))
	_save_game()
	_refresh_link()
	await _cloud_load()

func _unlink() -> void:
	link_req = ""
	cloud.token = ""
	cloud.username = ""
	cloud_data = {}
	pend.clear()
	_save_game()
	_refresh_link()

func _cloud_note(text: String) -> void:
	if link_status != null:
		link_status.text = text

# put the server's ledger on screen. With no ledger yet, start from the same blank page the website would
func _cloud_take(d) -> void:
	if d is Dictionary:
		cloud_data = d
	else:
		cloud_data = {"v": 3, "ink": float(R["summon"]["base_ink"]) + float(R["summon"]["per_unique"]), "gold": 0, "xp": {}, "bag": {}, "roster": {"kevin": 1}}
	ink = float(cloud_data.get("ink", 0.0))
	gold = int(cloud_data.get("gold", 0))
	for k in xp:
		xp[k] = 0
	var x = cloud_data.get("xp", {})
	if x is Dictionary:
		for k in x:
			if xp.has(str(k)):
				xp[str(k)] = int(x[k])
	bag = {}
	var b = cloud_data.get("bag", {})
	if b is Dictionary:
		for k in b:
			if items.has(str(k)) and int(b[k]) > 0:
				bag[str(k)] = int(b[k])
	roster = {}
	var ro = cloud_data.get("roster", {})
	if ro is Dictionary:
		for k in ro:
			if heroes_by_id.has(str(k)):
				roster[str(k)] = int(ro[k])
	hauls_unsent = 0
	if place_index >= R["places"].size() or not _unlocked(place_index):
		place_index = 0
		_enter_place(false)
	_refresh_places()
	_refresh_roster()
	_refresh_bag()
	_refresh_link()

func _cloud_load() -> void:
	cloud_busy = true
	var r = await cloud.pet("load")
	cloud_busy = false
	if not (r is Dictionary):
		_cloud_note("Could not reach the ledger. Nothing is saved until it answers.")
		return
	if str(r.get("r", "")) == "unlinked":
		_cloud_note("This pet was unlinked on the website.")
		cloud.token = ""
		_save_game()
		return
	if str(r.get("r", "")) != "ok":
		_cloud_note(str(r.get("r", "")))
		return
	cloud.username = str(r.get("username", cloud.username))
	cloud_rev = int(r.get("rev", 0))
	_cloud_take(r.get("data"))

func _cloud_save() -> void:
	if not cloud.linked() or cloud_busy:
		return
	cloud_busy = true
	var d: Dictionary = cloud_data.duplicate(true)
	d["v"] = 3
	d["ink"] = ink
	d["gold"] = gold
	d["xp"] = xp.duplicate()
	d["bag"] = bag.duplicate()
	d["roster"] = roster.duplicate()
	d["actions"] = int(d.get("actions", 0)) + hauls_unsent
	d["last"] = Time.get_unix_time_from_system() * 1000.0
	var sent := hauls_unsent
	var r = await cloud.pet("save", {"data": d, "rev": cloud_rev})
	cloud_busy = false
	if not (r is Dictionary):
		return
	if str(r.get("r", "")) == "unlinked":
		_unlink()
		return
	if bool(r.get("ok", false)):
		cloud_rev = int(r.get("rev", cloud_rev))
		cloud_data = d
		hauls_unsent = maxi(0, hauls_unsent - sent)
	elif r.get("data") != null:
		# the website (or another pet) wrote a newer page, or the server refused this one: take the server's page
		cloud_rev = int(r.get("rev", 0))
		_cloud_take(r["data"])

func _cloud_roll() -> void:
	if cloud_busy or pend.is_empty():
		return
	cloud_busy = true
	var took: Dictionary = pend.duplicate()
	pend.clear()
	var rolls: Array = []
	for key in took:
		var parts: PackedStringArray = str(key).split("|")
		rolls.append({"place": parts[0], "luck": float(parts[1]), "n": int(took[key])})
	var r = await cloud.pet("roll", {"rolls": rolls})
	cloud_busy = false
	if not (r is Dictionary):
		for key in took:
			pend[key] = int(pend.get(key, 0)) + int(took[key])
		roll_timer = 15.0
		return
	if str(r.get("r", "")) == "unlinked":
		_unlink()
		return
	if str(r.get("r", "")) != "ok":
		return
	cloud_rev = int(r.get("rev", cloud_rev))
	var add = r.get("add", {})
	var from := _loot_from()
	var best := ""
	var shown := 0
	if add is Dictionary:
		for id in add:
			var sid := str(id)
			if not items.has(sid):
				continue
			bag[sid] = int(bag.get(sid, 0)) + int(add[id])
			if shown < 4:
				_fly(loot_tex.get(sid), from + Vector2(shown * 22, 0), smudge.named_point("bag"), 64.0, 0.35 + shown * 0.12, 0.35, 0.55, 50.0)
				shown += 1
			if best == "" or R["rarities"].find(str(items[sid]["rarity"])) > R["rarities"].find(str(items[best]["rarity"])):
				best = sid
	if best != "":
		var it: Dictionary = items[best]
		_float_text(str(it["name"]), from + Vector2(0, -74), Color(str(R["rarity_color"][str(it["rarity"])])), 14)
		if str(it["rarity"]) != "common":
			smudge.cheer(1.4)
			_say_text(str(it["flavor"]))
	_refresh_bag()

func _cloud_summon() -> void:
	if cloud_busy or summon_wait > 0.0:
		return
	summon_wait = 4.0
	await _cloud_save()          # the server has to know about the ink first
	if cloud_busy:
		return
	cloud_busy = true
	var r = await cloud.pet("summon", {"n": 1})
	cloud_busy = false
	if not (r is Dictionary) or str(r.get("r", "")) != "ok":
		summon_wait = 20.0
		if r is Dictionary and str(r.get("r", "")) == "unlinked":
			_unlink()
		return
	cloud_rev = int(r.get("rev", cloud_rev))
	var st: Dictionary = r["set"]
	ink = float(st.get("ink", ink))
	bag["x_shard"] = int(st.get("shards", bag.get("x_shard", 0)))
	xp["Summoning"] = int(st.get("sxp", xp["Summoning"]))
	cloud_data["summons"] = int(st.get("summons", 0))
	var ro = st.get("roster", {})
	if ro is Dictionary:
		for k in ro:
			if heroes_by_id.has(str(k)):
				roster[str(k)] = int(ro[k])
	var got: Array = r.get("got", [])
	if got.size() > 0 and heroes_by_id.has(str(got[0]["id"])):
		_summon_show(heroes_by_id[str(got[0]["id"])], int(got[0]["had"]), float(got[0]["cost"]), false)
	_refresh_bag()

func _cloud_sell() -> void:
	if cloud_busy:
		return
	var map := {}
	for id in bag.keys():
		var sid := str(id)
		if str(items[sid]["kind"]) != "loot" or sid == "x_shard":
			continue
		var spare := int(bag[sid]) - (0 if bool(items[sid].get("junk", false)) else 1)
		if spare > 0:
			map[sid] = spare
	if map.is_empty():
		_say_text("Nothing extra to sell yet.")
		return
	await _cloud_save()
	if cloud_busy:
		return
	cloud_busy = true
	var r = await cloud.pet("sell", {"items": map})
	cloud_busy = false
	if not (r is Dictionary) or str(r.get("r", "")) != "ok":
		_say_text("The market is not answering.")
		return
	cloud_rev = int(r.get("rev", cloud_rev))
	var st: Dictionary = r["set"]
	gold = int(st.get("gold", gold))
	var sb = st.get("bag", {})
	if sb is Dictionary:
		for k in sb:
			if int(sb[k]) > 0:
				bag[str(k)] = int(sb[k])
			else:
				bag.erase(str(k))
	_refresh_bag()
	_play("sparkle", 1.0, -6.0)
	_say_text("Sold the extras for %d gold." % int(r.get("earned", 0)))
