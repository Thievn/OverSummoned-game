extends Node2D
# OverSummoned Desk, sample build.
# Smudge sits on the taskbar. Every key press or click on his window powers
# whatever he is doing at his current location: summoning heroes in the Archive,
# fishing the Roman bathhouse, or picking the speakeasy safe.

const Data = preload("res://data.gd")
const OverlayScript = preload("res://overlay.gd")

# ------------------------------------------------------------ layout (scene art pixels)
const WIN := Vector2(640, 380)
const SCENE_SCALE := 0.6
const SCENE_POS := Vector2(8, 0)          # y is set so the scene sits on the bottom edge
const POSE_SCALE := 0.34
const POSE_SCALES := {"archive": 0.34, "bathhouse": 0.34, "speakeasy": 0.272}
const ANCHOR := {"archive": Vector2(440, 392), "bathhouse": Vector2(215, 410), "speakeasy": Vector2(575, 338)}
const CIRCLE := Vector2(440, 382)
const CIRCLE_R := Vector2(186, 44)
const POOL := Vector2(585, 335)
const POOL_R := Vector2(195, 58)
const DIAL := Vector2(712, 196)
const ROD_TIP := Vector2(0.99, 0.227)       # rod tip as a fraction of the fishing pose image

# ------------------------------------------------------------ tuning
const MAX_TAPS_PER_SEC := 20.0
const YAWN_AFTER := 25.0
const SLEEP_AFTER := 60.0
const SAVE_PATH := "user://oversummoned_desk.cfg"
const SKILLS := ["Summoning", "Fishing", "Lockpicking"]

# ------------------------------------------------------------ art
var tex := {}
var loot_tex := {}
var hero_tex := {}
var sfx := {}
var font_body: FontFile
var font_title: FontFile

# ------------------------------------------------------------ nodes
var scene_sprite: Sprite2D
var overlay   # overlay.gd node (untyped so its `main` field is reachable)
var last_passthrough := PackedVector2Array()
var smudge_root: Node2D
var smudge: Sprite2D
var zzz: Label
var hud_title: Label
var hud_sub: Label
var hud_bar: ProgressBar
var hud_count: Label
var bubble: PanelContainer
var bubble_label: Label
var popup: PanelContainer
var popup_icon: TextureRect
var popup_title: Label
var popup_sub: Label
var popup_tween: Tween
var menu: PanelContainer
var tab_boxes := {}
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

# ------------------------------------------------------------ state (saved)
var loc_index := 0
var progress := {"archive": 0.0, "bathhouse": 0.0, "speakeasy": 0.0}
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
var test_mode := false
var demo_typing := false
var size_index := 1

# ------------------------------------------------------------ state (live)
var t := 0.0
var since_tap := 999.0
var tap_budget := MAX_TAPS_PER_SEC
var rate := 0.0
var asleep := false
var yawned := false
var squash := Vector2.ZERO        # x = amount, y = velocity
var slap_timer := 0.0
var cheer_timer := 0.0
var bobber_dip := 0.0
var circle_flash := 0.0
var chatter_timer := 70.0
var activity := 0.0              # 0 = idle, 1 = typing hard. Smoothed, drives every tempo.
var slap_phase := 0.0
var bob_phase := 0.0
var pick_phase := 0.0
var ripples: Array = []          # ages of expanding rings on the pool
var ripple_timer := 0.0
var tick_cooldown := 0.0
var pose_scale := POSE_SCALE
var demo_timer := 0.0
var save_timer := 10.0
var dragging := false
var drag_offset := Vector2i.ZERO
const MODELS := ["gpt-4o-mini", "claude-haiku-5-5", "grok-4-1-fast-non-reasoning"]

# ============================================================ setup

func _ready() -> void:
	get_viewport().transparent_bg = true
	randomize()
	_load_art()
	_load_game()
	_apply_window_size()
	_place_window()
	_start_ambience()

	scene_sprite = Sprite2D.new()
	scene_sprite.centered = false
	scene_sprite.scale = Vector2.ONE * SCENE_SCALE
	add_child(scene_sprite)

	overlay = OverlayScript.new()
	overlay.main = self
	add_child(overlay)

	smudge_root = Node2D.new()
	add_child(smudge_root)
	smudge = Sprite2D.new()
	smudge.scale = Vector2.ONE * pose_scale
	smudge_root.add_child(smudge)

	zzz = _label(18, true)
	zzz.text = "z Z z"
	zzz.visible = false
	add_child(zzz)

	_build_hud()
	_build_bubble()
	_build_popup()
	_build_menu()

	http = HTTPRequest.new()
	http.timeout = 15.0
	http.request_completed.connect(_on_ai_reply)
	add_child(http)

	_enter_location(false)
	get_tree().auto_accept_quit = false

func _load_art() -> void:
	for k in ["stand", "slap_up", "slap_down", "sleep", "cheer", "fish", "pick"]:
		tex[k] = load("res://art/smudge/%s.png" % k)
	for k in ["archive", "bathhouse", "speakeasy"]:
		tex["scene_" + k] = load("res://art/scenes/%s.png" % k)
	for table in Data.LOOT.values():
		for row in table:
			loot_tex[row[1]] = load("res://art/loot/%s.png" % row[1])
	for h in Data.HEROES:
		hero_tex[h[0]] = load("res://art/heroes/%s.png" % h[0])
	for n in ["tick", "plop", "splash", "catch", "pin", "unlock", "sparkle", "blip"]:
		sfx[n] = load("res://sfx/%s.wav" % n)
	font_body = load("res://fonts/Nunito.ttf")
	font_title = load("res://fonts/LilitaOne.ttf")

func _place_window() -> void:
	var usable := DisplayServer.screen_get_usable_rect()
	var win := DisplayServer.window_get_size()
	DisplayServer.window_set_position(usable.end - win - Vector2i(16, 0))

func _apply_window_size() -> void:
	var factor: float = [0.75, 1.0, 1.3][clampi(size_index, 0, 2)]
	DisplayServer.window_set_size(Vector2i(int(WIN.x * factor), int(WIN.y * factor)))

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

func _enter_location(talk: bool) -> void:
	var id := _loc_id()
	var stex: Texture2D = tex["scene_" + id]
	scene_sprite.texture = stex
	scene_sprite.position = Vector2(SCENE_POS.x, WIN.y - 6.0 - stex.get_height() * SCENE_SCALE)
	smudge_root.position = scene_sprite.position + ANCHOR[id] * SCENE_SCALE
	pose_scale = float(POSE_SCALES.get(id, POSE_SCALE))
	smudge.rotation = 0.0
	ripples.clear()
	_set_pose()
	_update_hud()
	overlay.queue_redraw()
	if talk:
		_say("move")
	_save_game()

func _travel(index: int) -> void:
	if index == loc_index:
		return
	loc_index = index
	pins_done = 0
	_enter_location(true)
	_play("blip")
	_refresh_places()

func _pose_name() -> String:
	if asleep:
		return "sleep"
	if cheer_timer > 0.0:
		return "cheer"
	match str(_loc()["kind"]):
		"summon":
			return "slap_down" if slap_timer > 0.0 else "slap_up"
		"fish":
			return "fish"
		"lock":
			return "pick"
	return "stand"

func _set_pose() -> void:
	var p := _pose_name()
	var tx: Texture2D = tex[p]
	if smudge.texture != tx:
		smudge.texture = tx
		smudge.offset = Vector2(0, -tx.get_height() / 2.0)

# ============================================================ every frame

func _process(delta: float) -> void:
	t += delta
	var dt := minf(delta, 0.05)
	since_tap += delta
	tap_budget = minf(MAX_TAPS_PER_SEC, tap_budget + MAX_TAPS_PER_SEC * delta)
	rate = maxf(0.0, rate - rate * 0.6 * delta)
	slap_timer = maxf(0.0, slap_timer - delta)
	cheer_timer = maxf(0.0, cheer_timer - delta)
	bobber_dip = maxf(0.0, bobber_dip - 14.0 * delta)
	tick_cooldown = maxf(0.0, tick_cooldown - delta)
	var target := clampf(rate / 6.0, 0.0, 1.0)
	activity = lerpf(activity, target, 1.0 - exp(-3.0 * delta))
	_animate_location(delta)
	circle_flash = maxf(0.0, circle_flash - delta * 1.5)

	# demo typing (Settings): a steady fake typist so you can watch without typing
	if demo_typing:
		demo_timer -= delta
		if demo_timer <= 0.0:
			demo_timer = randf_range(0.08, 0.3)
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
		zzz.position = smudge_root.position + Vector2(30, -150 + sin(t * 2.0) * 4.0)
		zzz.modulate.a = 0.6 + 0.4 * sin(t * 3.0)

	# chatter while you work
	chatter_timer -= delta
	if chatter_timer <= 0.0:
		chatter_timer = randf_range(70.0, 140.0)
		if not asleep:
			_say("busy" if rate > 2.0 else "idle")

	# squash and stretch spring, gentle breathing, little hops
	# squash and stretch around the feet, so Smudge stays planted on the floor
	squash.y += (-90.0 * squash.x - 11.0 * squash.y) * dt
	squash.x += squash.y * dt
	var breathe := sin(t * 2.2) * 0.012
	smudge.scale = Vector2(pose_scale * (1.0 + squash.x * 0.5 - breathe * 0.5), pose_scale * (1.0 - squash.x + breathe))
	smudge.position = Vector2.ZERO
	_set_pose()

	overlay.queue_redraw()
	_update_passthrough()

	save_timer -= delta
	if save_timer <= 0.0:
		save_timer = 10.0
		_save_game()

# Typing speed sets the tempo. Nothing reacts to single keys directly, so fast
# typing speeds things up smoothly instead of making Smudge jitter.
func _animate_location(delta: float) -> void:
	match str(_loc()["kind"]):
		"summon":
			if activity > 0.04:
				var before := floorf(slap_phase)
				slap_phase += delta * (0.9 + 2.6 * activity)     # at most about 3.5 slaps a second
				if floorf(slap_phase) > before:
					slap_timer = 0.14
					squash.y += 1.1
		"fish":
			bob_phase += delta * (1.4 + 4.6 * activity)
			ripple_timer -= delta
			if ripple_timer <= 0.0:
				ripple_timer = lerpf(2.4, 0.45, activity)
				ripples.append(0.0)
			var keep: Array = []
			for a in ripples:
				var age := float(a) + delta
				if age < 1.6:
					keep.append(age)
			ripples = keep
		"lock":
			pick_phase += delta * (1.5 + 6.5 * activity)
			smudge.rotation = sin(pick_phase) * 0.02 * activity

# ============================================================ input

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if menu.visible and _menu_has_text_focus():
			return
		if event.keycode == KEY_ESCAPE and menu.visible:
			menu.visible = false
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
	var w := tx.get_width() * pose_scale
	var h := tx.get_height() * pose_scale
	return Rect2(smudge_root.position + Vector2(-w * 0.35, -h * 0.95), Vector2(w * 0.7, h * 0.9))

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
	var r := Rect2(scene_sprite.position, scene_sprite.texture.get_size() * SCENE_SCALE)
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
	rate += 0.7
	total_taps += 1
	if asleep:
		asleep = false
		_say("wake")
	var skill := _skill()
	var before := _level(skill)
	xp[skill] = int(xp.get(skill, 0)) + 1
	if _level(skill) > before:
		_level_up(skill)
	if tick_cooldown <= 0.0:
		tick_cooldown = 0.1
		_play("tick", randf_range(0.9, 1.15), -16.0)

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
				_play("pin", randf_range(0.95, 1.1), -4.0)
				if pins_done >= int(_loc().get("pins", 5)):
					pins_done = 0
					_unlock()
				elif randf() < 0.25:
					_say("pin")
	_update_hud()

func _level_up(skill: String) -> void:
	_play("sparkle")
	cheer_timer = 1.0
	_say_text("Level up! %s is now %d." % [skill, _level(skill)])

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
	cheer_timer = 1.6
	_play("sparkle")
	var sub := "%s · %s" % [str(hero[2]), str(hero[3])]
	if count > 0:
		_add_bag("Card Shard", 1)
		sub = "Duplicate: +1 Card Shard"
	_show_popup(hero_tex[id], str(hero[1]), "%s %s · %s" % [rarity.capitalize(), str(hero[4]), sub], Data.RARITY_COLOR[rarity])
	if rarity in ["epic", "legendary", "rare"]:
		_say("summon_rare")
	else:
		_say("summon")
	_refresh_roster()

func _catch() -> void:
	var row := _roll_loot("bathhouse", "Fishing")
	_add_bag(str(row[0]), 1)
	bobber_dip = 9.0
	ripples.append_array([0.0, 0.15, 0.3])
	_play("splash")
	_play("catch", 1.0, -4.0)
	_show_popup(loot_tex[row[1]], str(row[0]), "%s · Bathhouse catch" % str(row[4]).capitalize(), Color("#2FA8FF"))
	if str(row[4]) != "common":
		cheer_timer = 1.0
		_say("catch")
	elif randf() < 0.3:
		_say("catch")

func _unlock() -> void:
	var n := 2 + (1 if _level("Lockpicking") >= 10 else 0)
	var best: Array = []
	var best_rank := -1
	for i in n:
		var row := _roll_loot("speakeasy", "Lockpicking")
		_add_bag(str(row[0]), 1)
		var rank := ["common", "uncommon", "rare", "epic"].find(str(row[4]))
		if rank > best_rank:
			best_rank = rank
			best = row
	coins += randi_range(5, 20)
	cheer_timer = 1.4
	_play("unlock")
	_play("sparkle", 1.1, -6.0)
	_show_popup(loot_tex[best[1]], "Safe cracked!", "%d items + coins. Best: %s" % [n, str(best[0])], Color("#FFC83D"))
	_say("unlock")

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
	_play("sparkle" if earned > 0 else "blip")
	_say_text("Sold the extras for %d coins." % earned if earned > 0 else "Nothing extra to sell yet.")

# ============================================================ drawing the effects

func draw_overlay(c: Node2D) -> void:
	var o := scene_sprite.position
	var k := SCENE_SCALE
	match str(_loc()["kind"]):
		"summon":
			var center := o + CIRCLE * k
			var rad := CIRCLE_R * k
			var f := clampf(float(progress.get("archive", 0.0)) / _need(), 0.0, 1.0)
			_ellipse(c, center, rad, 0.0, 1.0, Color(0.5, 1.0, 0.92, 0.18), 6.0)
			_ellipse(c, center, rad, 0.0, f, Color(0.5, 1.0, 0.92, 0.95), 4.0)
			if circle_flash > 0.0:
				_ellipse(c, center, rad * (1.0 + (1.0 - circle_flash) * 0.6), 0.0, 1.0, Color(0.6, 1.0, 0.95, circle_flash), 8.0)
		"fish":
			var tip := smudge_root.position + smudge.position + Vector2(
				(ROD_TIP.x - 0.5) * smudge.texture.get_width() * smudge.scale.x,
				-(1.0 - ROD_TIP.y) * smudge.texture.get_height() * smudge.scale.y)
			var surface := o + POOL * k + Vector2(-40, 0)
			var bob := surface + Vector2(0, bobber_dip + sin(bob_phase) * 1.6)
			for a in ripples:
				var age := float(a)
				var rr := 5.0 + age * 22.0
				_ellipse(c, surface + Vector2(0, 2), Vector2(rr, rr * 0.32), 0.0, 1.0, Color(1, 1, 1, clampf(0.75 - age * 0.47, 0.0, 1.0)), 1.4)
			var mid := (tip + bob) / 2.0 + Vector2(0, 16)
			c.draw_polyline(PackedVector2Array([tip, mid.lerp(tip, 0.45), mid, bob]), Color(1, 1, 1, 0.9), 1.2, true)
			c.draw_line(bob, bob + Vector2(0, 9), Color(1, 1, 1, 0.3), 1.0)   # line under the surface
			c.draw_circle(bob, 4.0, Color("#FF5B47"))
			c.draw_circle(bob + Vector2(0, -1.5), 1.6, Color(1, 1, 1, 0.9))
		"lock":
			var dial := o + DIAL * k
			var pins := int(_loc().get("pins", 5))
			var f2 := clampf(float(progress.get("speakeasy", 0.0)) / _need(), 0.0, 1.0)
			for i in pins:
				var p := dial + Vector2(-26 + i * 13, -38)
				var col := Color("#FFC83D") if i < pins_done else Color(0.12, 0.16, 0.28, 0.85)
				c.draw_rect(Rect2(p - Vector2(4, 7), Vector2(8, 14)), col)
				c.draw_rect(Rect2(p - Vector2(4, 7), Vector2(8, 14)), Color("#1E2A47"), false, 1.5)
				if i == pins_done:
					c.draw_rect(Rect2(p + Vector2(-4, 7 - 14 * f2), Vector2(8, 14 * f2)), Color(1, 0.85, 0.4, 0.7))

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
	p.add_theme_stylebox_override("panel", _panel_style(Color("#1E2A47F0"), Color("#FFC83D")))
	p.position = Vector2(8, 8)
	p.custom_minimum_size = Vector2(226, 0)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(p)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 2)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(v)
	hud_title = _label(17, false, true)
	hud_title.add_theme_color_override("font_color", Color("#FFC83D"))
	v.add_child(hud_title)
	hud_sub = _label(12, false)
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
	hud_count = _label(11, false)
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
	bubble_label = _label(13, false)
	bubble_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bubble_label.custom_minimum_size = Vector2(170, 0)
	bubble.add_child(bubble_label)
	bubble.visible = false
	bubble.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bubble)

func _build_popup() -> void:
	popup = PanelContainer.new()
	popup.add_theme_stylebox_override("panel", _panel_style(Color("#FFFBF2"), Color("#1E2A47")))
	popup.custom_minimum_size = Vector2(150, 0)
	popup.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	popup.add_child(v)
	popup_icon = TextureRect.new()
	popup_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	popup_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	popup_icon.custom_minimum_size = Vector2(130, 120)
	popup_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(popup_icon)
	popup_title = _label(16, false, true)
	popup_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup_title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(popup_title)
	popup_sub = _label(11, false)
	popup_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup_sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	popup_sub.custom_minimum_size = Vector2(150, 0)
	v.add_child(popup_sub)
	popup.visible = false
	add_child(popup)

func _show_popup(icon: Texture2D, title: String, sub: String, frame: Color) -> void:
	popup_icon.texture = icon
	popup_title.text = title
	popup_sub.text = sub
	var sb := _panel_style(Color("#FFFBF2"), frame)
	sb.set_border_width_all(4)
	popup.add_theme_stylebox_override("panel", sb)
	popup.visible = true
	popup.modulate.a = 1.0
	popup.reset_size()
	var x := WIN.x - 182.0
	popup.position = Vector2(x, WIN.y)
	popup.scale = Vector2(0.8, 0.8)
	popup.pivot_offset = Vector2(80, 120)
	if popup_tween:
		popup_tween.kill()
	popup_tween = create_tween()
	popup_tween.set_parallel(true)
	popup_tween.tween_property(popup, "position", Vector2(x, 70), 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	popup_tween.tween_property(popup, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	popup_tween.chain().tween_interval(2.6)
	popup_tween.chain().tween_property(popup, "modulate:a", 0.0, 0.4)
	popup_tween.chain().tween_callback(_hide_popup)

func _hide_popup() -> void:
	popup.visible = false

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
	var head := smudge_root.position + Vector2(-20, -smudge.texture.get_height() * pose_scale - 10)
	bubble.position = Vector2(clampf(head.x - 40, 4, WIN.x - bubble.size.x - 4), clampf(head.y - bubble.size.y, 84, WIN.y - 60))
	bubble.scale = Vector2(0.6, 0.6)
	bubble.pivot_offset = Vector2(30, bubble.size.y)
	_play("blip", randf_range(0.95, 1.15), -8.0)
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

func _start_ambience() -> void:
	var stream: AudioStreamWAV = load("res://sfx/ambience.wav")
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = int(stream.get_length() * stream.mix_rate)
	ambience = AudioStreamPlayer.new()
	ambience.stream = stream
	ambience.volume_db = -14.0
	add_child(ambience)
	ambience.play()
	ambience.stream_paused = not sound_on

# ============================================================ menu

func _build_menu() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	menu = PanelContainer.new()
	menu.position = Vector2(WIN.x - 318, 6)
	menu.custom_minimum_size = Vector2(312, 368)
	menu.size = Vector2(312, 368)
	var th := Theme.new()
	th.default_font = font_body
	th.default_font_size = 13
	th.set_color("font_color", "Label", Color("#E7ECF7"))
	th.set_color("font_color", "Button", Color("#1E2A47"))
	th.set_color("font_hover_color", "Button", Color("#1E2A47"))
	th.set_color("font_pressed_color", "Button", Color("#1E2A47"))
	var b_normal := _panel_style(Color("#FFC83D"), Color("#1E2A47"), 10)
	b_normal.set_content_margin_all(5)
	var b_hover := _panel_style(Color("#FFD866"), Color("#1E2A47"), 10)
	b_hover.set_content_margin_all(5)
	th.set_stylebox("normal", "Button", b_normal)
	th.set_stylebox("hover", "Button", b_hover)
	th.set_stylebox("pressed", "Button", b_hover)
	menu.theme = th
	menu.add_theme_stylebox_override("panel", _panel_style(Color("#1E2A47F7"), Color("#FFC83D"), 16))
	layer.add_child(menu)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 6)
	menu.add_child(v)
	var header := HBoxContainer.new()
	v.add_child(header)
	var title := _label(20, false, true)
	title.text = "Smudge's Ledger"
	title.add_theme_color_override("font_color", Color("#FFC83D"))
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	header.add_child(_button("x", _close_menu))
	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 3)
	v.add_child(tabs)
	for tab_name in ["Places", "Roster", "Bag", "Smudge", "Settings"]:
		var tb := _button(tab_name, _show_tab.bind(tab_name))
		tb.add_theme_font_size_override("font_size", 11)
		tabs.add_child(tb)

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(0, 290)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(scroll)
	var pages := VBoxContainer.new()
	pages.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(pages)

	# Places
	places_box = VBoxContainer.new()
	pages.add_child(places_box)
	tab_boxes["Places"] = places_box
	_refresh_places()

	# Roster
	var roster_box := VBoxContainer.new()
	pages.add_child(roster_box)
	tab_boxes["Roster"] = roster_box
	roster_grid = GridContainer.new()
	roster_grid.columns = 3
	roster_box.add_child(roster_grid)
	_refresh_roster()

	# Bag
	var bag_box := VBoxContainer.new()
	pages.add_child(bag_box)
	tab_boxes["Bag"] = bag_box
	coins_label = Label.new()
	bag_box.add_child(coins_label)
	bag_box.add_child(_button("Sell extras for coins", _sell_extras))
	bag_grid = GridContainer.new()
	bag_grid.columns = 2
	bag_box.add_child(bag_grid)
	_refresh_bag()

	# Smudge (voice + your own AI key)
	var talk := VBoxContainer.new()
	pages.add_child(talk)
	tab_boxes["Smudge"] = talk
	var vl := Label.new()
	vl.text = "Smudge's voice"
	talk.add_child(vl)
	mode_option = OptionButton.new()
	mode_option.focus_mode = Control.FOCUS_NONE
	for m in ["sweet", "salty", "unhinged"]:
		mode_option.add_item(str(Data.MODE_NAMES[m]))
	mode_option.select(["sweet", "salty", "unhinged"].find(mode))
	mode_option.item_selected.connect(_set_mode)
	talk.add_child(mode_option)
	var info := Label.new()
	info.text = "Optional: your own AI key lets Smudge\nimprovise. It stays encrypted on this PC."
	info.add_theme_font_size_override("font_size", 11)
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
	ai_status.add_theme_font_size_override("font_size", 11)
	ai_status.text = "Using built-in lines." if api_key == "" else "AI key saved."
	talk.add_child(ai_status)

	# Settings
	var settings := VBoxContainer.new()
	pages.add_child(settings)
	tab_boxes["Settings"] = settings
	settings.add_child(_check("Sound", sound_on, _set_sound))
	settings.add_child(_check("Always on top", true, _set_on_top))
	settings.add_child(_check("Test mode (10x faster)", test_mode, _set_test_mode))
	settings.add_child(_check("Demo typing (types for you)", demo_typing, _set_demo))
	var size_row := HBoxContainer.new()
	var sl := Label.new()
	sl.text = "Size "
	size_row.add_child(sl)
	for i in 3:
		size_row.add_child(_button(["Small", "Normal", "Large"][i], _set_size.bind(i)))
	settings.add_child(size_row)
	settings.add_child(_button("Snap to bottom-right", _place_window))
	var hint := Label.new()
	hint.text = "Right-drag to move. Click Smudge for this menu.\nThis sample counts keys while its window\nis focused. Global counting comes next."
	hint.add_theme_font_size_override("font_size", 11)
	settings.add_child(hint)
	settings.add_child(_button("Reset progress", _reset_progress))
	settings.add_child(_button("Quit", _quit))

	_show_tab("Places")
	menu.visible = false

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
	c.add_theme_color_override("font_color", Color("#E7ECF7"))
	c.add_theme_color_override("font_hover_color", Color.WHITE)
	c.add_theme_color_override("font_pressed_color", Color("#FFC83D"))
	c.toggled.connect(action)
	return c

func _show_tab(tab_name: String) -> void:
	for k in tab_boxes:
		tab_boxes[k].visible = (k == tab_name)
	if tab_name == "Bag":
		_refresh_bag()
	_play("blip", 1.0, -10.0)

func _toggle_menu() -> void:
	menu.visible = not menu.visible
	if menu.visible:
		_show_tab("Places")
		squash.y += 1.0

func _close_menu() -> void:
	menu.visible = false

func _refresh_places() -> void:
	if places_box == null:
		return
	for ch in places_box.get_children():
		ch.queue_free()
	for i in Data.LOCATIONS.size():
		var l: Dictionary = Data.LOCATIONS[i]
		var box := VBoxContainer.new()
		var b := _button("%s%s" % ["> " if i == loc_index else "", str(l["name"])], _travel.bind(i))
		box.add_child(b)
		var d := Label.new()
		d.text = "%s · %s Lv %d\n%s" % [str(l["era"]), str(l["skill"]), _level(str(l["skill"])), str(l["blurb"])]
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.custom_minimum_size = Vector2(280, 0)
		d.add_theme_font_size_override("font_size", 11)
		box.add_child(d)
		places_box.add_child(box)
	var soon := Label.new()
	soon.text = "Coming next: Pompeii dig site, Ice Age fishing hole, pharaoh's tomb."
	soon.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	soon.custom_minimum_size = Vector2(280, 0)
	soon.add_theme_font_size_override("font_size", 11)
	soon.add_theme_color_override("font_color", Color("#AEB8D0"))
	places_box.add_child(soon)

func _refresh_roster() -> void:
	if roster_grid == null:
		return
	for ch in roster_grid.get_children():
		ch.queue_free()
	for h in Data.HEROES:
		var id := str(h[0])
		var owned := int(roster.get(id, 0))
		var cell := VBoxContainer.new()
		cell.custom_minimum_size = Vector2(92, 0)
		var pic := TextureRect.new()
		pic.texture = hero_tex[id]
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(88, 88)
		if owned == 0:
			pic.modulate = Color(0.05, 0.07, 0.15, 0.85)
		cell.add_child(pic)
		var n := Label.new()
		n.text = str(h[1]) if owned > 0 else "???"
		n.add_theme_font_size_override("font_size", 10)
		n.add_theme_color_override("font_color", Data.RARITY_COLOR[str(h[5])])
		n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		n.custom_minimum_size = Vector2(88, 0)
		cell.add_child(n)
		if owned > 1:
			var c := Label.new()
			c.text = "x%d" % owned
			c.add_theme_font_size_override("font_size", 10)
			c.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			cell.add_child(c)
		roster_grid.add_child(cell)

func _refresh_bag() -> void:
	if bag_grid == null:
		return
	coins_label.text = "Coins: %d" % coins
	for ch in bag_grid.get_children():
		ch.queue_free()
	var items := bag.keys()
	items.sort()
	if items.is_empty():
		var e := Label.new()
		e.text = "Empty. Go fishing or crack a safe."
		bag_grid.add_child(e)
		return
	for item in items:
		var row := HBoxContainer.new()
		row.custom_minimum_size = Vector2(140, 0)
		var icon := TextureRect.new()
		icon.texture = _item_icon(str(item))
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.custom_minimum_size = Vector2(28, 28)
		row.add_child(icon)
		var l := Label.new()
		l.text = "%s x%d" % [str(item), int(bag[item])]
		l.add_theme_font_size_override("font_size", 11)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size = Vector2(104, 0)
		row.add_child(l)
		bag_grid.add_child(row)

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
	progress = {"archive": 0.0, "bathhouse": 0.0, "speakeasy": 0.0}
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
			progress[k] = float(p[k])
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
	test_mode = bool(cfg.get_value("prefs", "test_mode", false))
	size_index = int(cfg.get_value("prefs", "size", 1))
	api_provider = int(cfg.get_value("ai", "provider", 0))
	api_model = str(cfg.get_value("ai", "model", ""))
	api_key = str(cfg.get_value("ai", "key", ""))
