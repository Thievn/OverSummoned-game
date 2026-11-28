extends Node2D
# OverSummoned desktop pet, second version: Smudge sits on your desk facing you and farms while you
# type. One key, one movement. The keys fill a chest; the chest goes to your account on the website.
#
# Everything you can see him wear, hold or sit behind is a separate picture (see rig.gd and
# items.json), so a new hat is one picture and one line of text, and it works with every activity.

const VIEW := Rect2(58, 66, 908, 952)         # the part of the 1024 page the window shows
const SIZES := {"Small": 330, "Medium": 430, "Large": 560}
const SAVE := "user://pet2.json"

var rig                       # rig.gd: the layered Smudge
var cloud                     # cloud.gd: the link to the website
var pet := {}
var items := {}
var rules := {}

# what he is doing and what he is wearing
var activity := "summon"
var look := {"head": "hood", "face": "face_none", "neck": "neck_none", "fur": "brown", "cloak": "teal", "skin": "smudge"}
var owned := {"hood": true, "bare": true, "face_none": true, "neck_none": true,
			  "fur_brown": true, "cloak_teal": true, "skin_smudge": true}
var unlock_all := false                        # a switch for testing: every item in the wardrobe

# counting
var keys_total := 0                            # never goes down, never resets
var keys_today := 0
var keys_session := 0
var day := ""
var streak := 1
var chests_opened := 0
var best_kps := 0.0
var best_day := 0
var minutes := {"summon": 0.0, "fish": 0.0, "dig": 0.0, "pick": 0.0}
var chest_keys := 0.0
var ink := 0.0
var gold := 0
var bag := {}

# how it feels
var budget := 14.0
var rate := 0.0
var kps := 0.0
var since_key := 99.0
var asleep := false
var chest_ready := false
var chest_rarity := "common"
var opening := 0.0
var since_say := 0.0
var say_at := 90.0
var bubble := ""
var bubble_t := 0.0
var sound := true
var mood := "salty"
var size_name := "Medium"
var top_most := true
var dragging := false
var drag_from := Vector2i.ZERO
var pressed_at := Vector2.ZERO
var cloud_busy := false
var save_t := 0.0
var note := ""
var note_t := 0.0

var menu: Control
var stage: Node2D
var ui: Node2D              # the counter, the bar and his speech bubble, drawn over the top of him
var font: Font


func _ready() -> void:
	pet = _json("res://pet.json")
	items = _json("res://items.json")
	rules = _json("res://rules.json")
	font = ThemeDB.fallback_font
	cloud = preload("res://cloud.gd").new()
	add_child(cloud)
	stage = Node2D.new()
	add_child(stage)
	rig = preload("res://rig.gd").new()
	stage.add_child(rig)
	ui = Node2D.new()                 # added after the stage, so it draws over him and not under
	ui.draw.connect(_draw_ui)
	add_child(ui)
	_build_menu()
	_load()
	_apply_size()
	rig.call_deferred("dress", look)
	rig.call_deferred("set_activity", activity)
	get_window().set_flag(Window.FLAG_ALWAYS_ON_TOP, top_most)
	_roll_day()
	say(_line("idle"))


func _json(path: String) -> Dictionary:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return {}
	var d = JSON.parse_string(f.get_as_text())
	return d if d is Dictionary else {}


# ---------------------------------------------------------------- the window

func _apply_size() -> void:
	var w: int = int(SIZES.get(size_name, 430))
	var k := float(w) / VIEW.size.x
	var h := int(VIEW.size.y * k)
	DisplayServer.window_set_size(Vector2i(w, h))
	stage.scale = Vector2(k, k)
	stage.position = -VIEW.position * k
	if ui:
		ui.queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE and menu.visible:
			menu.visible = false
			return
		_key()
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed:
			menu.visible = not menu.visible
			if menu.visible:
				_refresh_menu()
		elif mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				dragging = true
				pressed_at = mb.position
				drag_from = DisplayServer.mouse_get_position() - DisplayServer.window_get_position()
			else:
				dragging = false
				if mb.position.distance_to(pressed_at) < 4.0:
					if chest_ready and _chest_rect().has_point(mb.position):
						_open_chest()
					else:
						_key()
	elif event is InputEventMouseMotion and dragging:
		DisplayServer.window_set_position(DisplayServer.mouse_get_position() - drag_from)


# ---------------------------------------------------------------- one key, one movement

func _key() -> void:
	if budget < 1.0:
		return
	budget -= 1.0
	since_key = 0.0
	rate += 1.0
	keys_total += 1
	keys_session += 1
	_roll_day()
	keys_today += 1
	best_day = maxi(best_day, keys_today)
	if asleep:
		asleep = false
		rig.asleep = false
		rig.expression = "surprised"
		say(_line("wake"))
	rig.tap()
	var worth := 1.0
	if keys_today > int(pet.get("daily_full", 40000)):
		worth = float(pet.get("after_daily", 0.05))
	if activity == "summon":
		ink += worth * float(pet.get("ink_per_key", 1.0))
	if not chest_ready:
		chest_keys += worth                       # keys past the daily amount barely count
		if chest_keys >= float(pet["chest"]["keys"]):
			_drop_chest()
	if ui:
		ui.queue_redraw()


func _roll_day() -> void:
	var d := Time.get_date_string_from_system()
	if d == day:
		return
	if day != "":
		var y := Time.get_unix_time_from_datetime_string(day)
		streak = streak + 1 if Time.get_unix_time_from_datetime_string(d) - y < 172800 else 1
	day = d
	keys_today = 0


func _process(dt: float) -> void:
	budget = minf(float(pet.get("max_keys_per_second", 14)), budget + dt * float(pet.get("max_keys_per_second", 14)))
	rate = maxf(0.0, rate - dt * 2.4)
	kps = lerpf(kps, rate * 0.5, minf(1.0, dt * 4.0))
	best_kps = maxf(best_kps, kps)
	since_key += dt
	minutes[activity] = float(minutes.get(activity, 0.0)) + dt / 60.0
	if not asleep and since_key > float(pet.get("sleep_after", 150)):
		asleep = true
		rig.asleep = true
		say(_line("sleep"))
	rig.expression = "sleepy" if asleep else ("cheer" if opening > 0.0 else ("focused" if kps > 3.0 else "happy"))
	if opening > 0.0:
		opening = maxf(0.0, opening - dt)
	bubble_t = maxf(0.0, bubble_t - dt)
	note_t = maxf(0.0, note_t - dt)
	since_say += dt
	if since_say > say_at and not asleep and bubble_t <= 0.0:
		since_say = 0.0
		var gap: Array = pet.get("say_every", [70, 160])
		say_at = randf_range(float(gap[0]), float(gap[1]))
		say(_line("idle"))
	save_t += dt
	if save_t > 20.0:
		save_t = 0.0
		_save()
	if ui:
		ui.queue_redraw()


# ---------------------------------------------------------------- chests

func _drop_chest() -> void:
	chest_ready = true
	chest_keys = 0.0
	chest_rarity = "common"
	say(_line("crate"))


func _chest_rect() -> Rect2:
	var k := stage.scale.x
	var c := (Vector2(512, 690) * k) + stage.position
	return Rect2(c - Vector2(46, 46), Vector2(92, 92))


func _open_chest() -> void:
	chest_ready = false
	chests_opened += 1
	opening = 2.2
	var c: Dictionary = pet["chest"]
	var got_gold := randi_range(int(c["gold"][0]), int(c["gold"][1]))
	gold += got_gold
	ink += float(c["ink"])
	var best := "common"
	var names: Array = []
	var where = items["activities"][activity].get("place", "")
	if cloud.linked() and str(where) != "":
		var place: String = str(where)
		var r = await cloud.pet("roll", {"rolls": [{"place": place, "n": int(c["rolls"]), "luck": 0.0}]})
		if r is Dictionary and r.has("add"):
			for id in r["add"]:
				bag[id] = int(bag.get(id, 0)) + int(r["add"][id])
				names.append(id)
				best = _better(best, _rarity_of(id))
	else:
		names.append("a few bits and pieces")
	rig.chest_glow(_rarity_colour(best), 1.0)
	rig.expression = "cheer"
	chest_rarity = best
	_note("Chest: %d gold, %d ink%s" % [got_gold, int(c["ink"]), ", and some finds" if names.size() else ""])
	say(_line("summon_rare" if best != "common" else "crate"))
	_save()


func _rarity_of(id: String) -> String:
	var it = rules.get("items", {}).get(id, null)
	return str(it.get("rarity", "common")) if it is Dictionary else "common"


func _better(a: String, b: String) -> String:
	var order: Array = rules.get("rarities", ["common", "uncommon", "rare", "epic", "legendary", "absurd", "unhinged"])
	return b if order.find(b) > order.find(a) else a


func _rarity_colour(r: String) -> Color:
	var m: Dictionary = rules.get("rarity_color", {})
	return Color(str(m.get(r, "#ffd27a")))


# ---------------------------------------------------------------- what he says

func _line(kind: String) -> String:
	var v: Dictionary = preload("res://voice.gd").LINES.get(mood, {})
	var pool: Array = v.get(kind, v.get("idle", ["..."]))
	if pool.is_empty():
		return ""
	return str(pool[randi() % pool.size()])


func say(text: String) -> void:
	if text == "":
		return
	bubble = text
	bubble_t = clampf(4.5 + text.length() * 0.07, 5.0, 11.0)


func _note(text: String) -> void:
	note = text
	note_t = 6.0


# ---------------------------------------------------------------- saving

func _save() -> void:
	_save_local()
	if cloud.linked() and not cloud_busy:
		cloud_busy = true
		await cloud.pet("save", {"data": {"v": 4, "ink": int(ink), "gold": gold, "bag": bag,
										  "pet_keys": keys_total}, "rev": 0})
		cloud_busy = false


func _save_local() -> void:
	var d := {
		"keys_total": keys_total, "keys_today": keys_today, "day": day, "streak": streak,
		"chests": chests_opened, "best_kps": best_kps, "best_day": best_day, "minutes": minutes,
		"chest_keys": chest_keys, "ink": ink, "gold": gold, "bag": bag,
		"activity": activity, "look": look, "owned": owned,
		"sound": sound, "mood": mood, "size": size_name, "top": top_most,
		"token": cloud.token, "username": cloud.username,
	}
	var f := FileAccess.open(SAVE, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(d))


func _load() -> void:
	if not FileAccess.file_exists(SAVE):
		return
	var f := FileAccess.open(SAVE, FileAccess.READ)
	var d = JSON.parse_string(f.get_as_text())
	if not (d is Dictionary):
		return
	keys_total = int(d.get("keys_total", 0))
	keys_today = int(d.get("keys_today", 0))
	day = str(d.get("day", ""))
	streak = int(d.get("streak", 1))
	chests_opened = int(d.get("chests", 0))
	best_kps = float(d.get("best_kps", 0.0))
	best_day = int(d.get("best_day", 0))
	minutes = d.get("minutes", minutes)
	chest_keys = float(d.get("chest_keys", 0))
	ink = float(d.get("ink", 0.0))
	gold = int(d.get("gold", 0))
	bag = d.get("bag", {})
	activity = str(d.get("activity", "summon"))
	look = d.get("look", look)
	owned = d.get("owned", owned)
	sound = bool(d.get("sound", true))
	mood = str(d.get("mood", "salty"))
	size_name = str(d.get("size", "Medium"))
	top_most = bool(d.get("top", true))
	cloud.token = str(d.get("token", ""))
	cloud.username = str(d.get("username", ""))


# ---------------------------------------------------------------- what is drawn over him

func _draw_ui() -> void:
	var k := stage.scale.x
	var w := float(DisplayServer.window_get_size().x)
	var h := float(DisplayServer.window_get_size().y)
	# the key count, the way Bongo Cat does it: one number that only ever goes up
	var big := int(14 + 10 * k)
	var s := _commas(keys_total)
	var tw := font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, big).x
	var base := Vector2(w * 0.5 - tw * 0.5, h - 16)
	_ink_text(s, base, big, Color(1, 1, 1))
	var sub := "keys"
	var sw := font.get_string_size(sub, HORIZONTAL_ALIGNMENT_LEFT, -1, int(big * 0.52)).x
	_ink_text(sub, Vector2(w * 0.5 - sw * 0.5, h - 16 - big * 0.95), int(big * 0.52), Color(0.72, 0.79, 0.95))
	# the chest bar
	var bw := w * 0.46
	var bx := w * 0.5 - bw * 0.5
	var by := h - 14 - big * 1.55
	var f := clampf(chest_keys / float(pet["chest"]["keys"]), 0.0, 1.0)
	ui.draw_rect(Rect2(bx, by, bw, 7.0), Color(0, 0, 0, 0.45), true)
	ui.draw_rect(Rect2(bx, by, bw * f, 7.0), Color(0.95, 0.73, 0.21), true)
	if chest_ready:
		_draw_waiting_chest(k)
	if note_t > 0.0:
		var nw := font.get_string_size(note, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
		_ink_text(note, Vector2(w * 0.5 - nw * 0.5, by - 12), 13, Color(1, 0.88, 0.55))
	if bubble_t > 0.0:
		_draw_bubble(k)


func _draw_waiting_chest(k: float) -> void:
	var r := _chest_rect()
	var bob := sin(Time.get_ticks_msec() * 0.004) * 4.0
	var c := r.get_center() + Vector2(0, bob)
	ui.draw_circle(c, 40.0, Color(1, 0.84, 0.35, 0.18))
	ui.draw_rect(Rect2(c - Vector2(30, 22), Vector2(60, 44)), Color(0.45, 0.28, 0.14), true)
	ui.draw_rect(Rect2(c - Vector2(30, 22), Vector2(60, 44)), Color(0.09, 0.07, 0.07), false, 3.0)
	ui.draw_rect(Rect2(c - Vector2(30, -2), Vector2(60, 6)), Color(0.28, 0.28, 0.32), true)
	ui.draw_rect(Rect2(c - Vector2(7, 2), Vector2(14, 16)), Color(0.86, 0.69, 0.25), true)
	var t := "Open"
	var tw := font.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
	_ink_text(t, c + Vector2(-tw * 0.5, 40), 13, Color(1, 0.9, 0.6))


func _draw_bubble(k: float) -> void:
	var pad := 9.0
	var maxw := DisplayServer.window_get_size().x * 0.78
	var size := 13
	var lines := _wrap(bubble, maxw - pad * 2, size)
	var lh := font.get_height(size) + 2.0
	var bw := 0.0
	for l in lines:
		bw = maxf(bw, font.get_string_size(l, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x)
	bw += pad * 2
	var bh := lh * lines.size() + pad * 1.6
	var x := clampf(DisplayServer.window_get_size().x * 0.5 - bw * 0.5, 4.0, DisplayServer.window_get_size().x - bw - 4.0)
	var y := 6.0
	var a := clampf(bubble_t, 0.0, 1.0)
	var paper := Color(0.99, 0.96, 0.89, a)
	var ink := Color(0.16, 0.13, 0.22, a)
	ui.draw_rect(Rect2(x, y, bw, bh), paper, true)
	ui.draw_rect(Rect2(x, y, bw, bh), ink, false, 2.5)
	var tip := Vector2(x + bw * 0.42, y + bh)
	ui.draw_colored_polygon(PackedVector2Array([tip, tip + Vector2(16, 0), tip + Vector2(5, 13)]), paper)
	ui.draw_line(tip, tip + Vector2(5, 13), ink, 2.5)
	ui.draw_line(tip + Vector2(16, 0), tip + Vector2(5, 13), ink, 2.5)
	# the little name tab, the same as on the website
	var nm := "Smudge"
	var nw := font.get_string_size(nm, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x
	ui.draw_rect(Rect2(x + 8, y - 9, nw + 12, 17), Color(0.95, 0.73, 0.21, a), true)
	ui.draw_rect(Rect2(x + 8, y - 9, nw + 12, 17), ink, false, 2.0)
	ui.draw_string(font, Vector2(x + 14, y + 3), nm, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.08, 0.11, 0.2, a))
	for i in lines.size():
		ui.draw_string(font, Vector2(x + pad, y + pad + lh * (i + 0.75)), lines[i],
					HORIZONTAL_ALIGNMENT_LEFT, -1, size, Color(0.16, 0.13, 0.22, a))


func _wrap(text: String, w: float, size: int) -> Array:
	var out: Array = []
	var line := ""
	for word in text.split(" "):
		var t := word if line == "" else line + " " + word
		if font.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x > w and line != "":
			out.append(line)
			line = word
		else:
			line = t
	if line != "":
		out.append(line)
	return out


func _ink_text(s: String, at: Vector2, size: int, col: Color) -> void:
	for d in [Vector2(-2, 0), Vector2(2, 0), Vector2(0, -2), Vector2(0, 2), Vector2(-1.4, -1.4), Vector2(1.4, 1.4), Vector2(-1.4, 1.4), Vector2(1.4, -1.4)]:
		ui.draw_string(font, at + d, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, Color(0.04, 0.06, 0.12, col.a * 0.9))
	ui.draw_string(font, at, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)


func _commas(n: int) -> String:
	var s := str(n)
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return s + out


# ---------------------------------------------------------------- the menu

var tabs := ["Doing", "Wardrobe", "Chests", "Numbers", "Settings"]
var tab := "Doing"
var body: VBoxContainer
var tabbar: HBoxContainer


func _build_menu() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	menu = PanelContainer.new()
	menu.visible = false
	menu.position = Vector2(8, 8)
	menu.custom_minimum_size = Vector2(312, 0)
	var st := StyleBoxFlat.new()
	st.bg_color = Color(0.05, 0.07, 0.14, 0.98)
	st.border_color = Color(0.16, 0.22, 0.38)
	st.set_border_width_all(2)
	st.set_corner_radius_all(12)
	st.set_content_margin_all(10)
	menu.add_theme_stylebox_override("panel", st)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	menu.add_child(col)
	var head := HBoxContainer.new()
	var title := Label.new()
	title.text = "Smudge"
	title.add_theme_font_size_override("font_size", 17)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(title)
	var x := Button.new()
	x.text = "✕"
	x.pressed.connect(func(): menu.visible = false)
	head.add_child(x)
	col.add_child(head)
	var sub := Label.new()
	sub.text = "He farms on your desk while you type."
	sub.add_theme_font_size_override("font_size", 11)
	sub.modulate = Color(0.72, 0.79, 0.95)
	col.add_child(sub)
	tabbar = HBoxContainer.new()
	tabbar.add_theme_constant_override("separation", 4)
	col.add_child(tabbar)
	for t in tabs:
		var b := Button.new()
		b.text = t
		b.toggle_mode = true
		b.pressed.connect(func():
			tab = t
			_refresh_menu())
		tabbar.add_child(b)
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(0, 250)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	body = VBoxContainer.new()
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 6)
	scroll.add_child(body)
	layer.add_child(menu)


func _clear(n: Node) -> void:
	# taken out of the tree first, so a rebuilt tab never shows the old one underneath for a frame
	for c in n.get_children():
		n.remove_child(c)
		c.queue_free()


func _lbl(parent: Node, text: String, size := 12, col := Color(0.82, 0.87, 0.98)) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.modulate = col
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(l)
	return l


func _row(parent: Node) -> HBoxContainer:
	var r := HBoxContainer.new()
	r.add_theme_constant_override("separation", 5)
	parent.add_child(r)
	return r


func _chip(parent: Node, text: String, on: bool, fn: Callable, dim := false) -> Button:
	var b := Button.new()
	b.text = text
	b.toggle_mode = true
	b.button_pressed = on
	b.disabled = dim
	b.add_theme_font_size_override("font_size", 12)
	b.pressed.connect(fn)
	parent.add_child(b)
	return b


func _refresh_menu() -> void:
	for b in tabbar.get_children():
		(b as Button).button_pressed = (b as Button).text == tab
	_clear(body)
	match tab:
		"Doing": _tab_doing()
		"Wardrobe": _tab_wardrobe()
		"Chests": _tab_chests()
		"Numbers": _tab_numbers()
		"Settings": _tab_settings()


func _tab_doing() -> void:
	_lbl(body, "Pick what he works on. Stamping makes ink for your summons. The other three bring back things from the place they belong to.", 11, Color(0.68, 0.75, 0.92))
	for id in items["activities"]:
		var a: Dictionary = items["activities"][id]
		var r := _row(body)
		var pick := func():
			activity = id
			rig.set_activity(id)
			_refresh_menu()
		_chip(r, str(a["name"]), id == activity, pick)
		_lbl(r, str(a["blurb"]), 11, Color(0.66, 0.73, 0.9))


func _tab_wardrobe() -> void:
	_lbl(body, "Anything in here goes with anything else, and with whatever he is doing.", 11, Color(0.68, 0.75, 0.92))
	var by_slot := {}
	for id in items["items"]:
		var slot := str(items["items"][id]["slot"])
		if not by_slot.has(slot):
			by_slot[slot] = []
		by_slot[slot].append(id)
	for slot in items["slots"]:
		if not by_slot.has(slot):
			continue
		_lbl(body, str(items["slots"][slot]), 13, Color(1, 1, 1))
		var grid := HFlowContainer.new()
		grid.add_theme_constant_override("h_separation", 4)
		grid.add_theme_constant_override("v_separation", 4)
		body.add_child(grid)
		for id in by_slot[slot]:
			var it: Dictionary = items["items"][id]
			var val := str(it.get("value", id))
			var have: bool = unlock_all or bool(owned.get(id, false))
			var worn: bool = str(look.get(slot, "")) == val
			var how := str(it.get("how", "Not yours yet."))
			var wear := func():
				if not have:
					_note(how)
					_refresh_menu()
					return
				look[slot] = val
				rig.dress(look)
				_save_local()
				_refresh_menu()
			_chip(grid, str(it["name"]) + ("" if have else "  (locked)"), worn, wear)
	var b := Button.new()
	b.text = "Everything unlocked, for testing" if unlock_all else "Unlock everything, for testing"
	b.toggle_mode = true
	b.button_pressed = unlock_all
	b.add_theme_font_size_override("font_size", 11)
	b.pressed.connect(func():
		unlock_all = not unlock_all
		_refresh_menu())
	body.add_child(b)


func _tab_chests() -> void:
	var need := int(pet["chest"]["keys"])
	_lbl(body, "Every key you press fills the chest. When it is full a chest lands on the desk; click it to open.", 11, Color(0.68, 0.75, 0.92))
	_lbl(body, "%d of %d keys" % [int(chest_keys), need], 15, Color(1, 1, 1))
	_lbl(body, "Chests opened: %d" % chests_opened, 12)
	_lbl(body, "What is inside: gold, ink, and two or three finds from wherever he is working. Now and then a piece of gear or something to wear.", 11, Color(0.68, 0.75, 0.92))
	if not cloud.linked():
		_lbl(body, "He is not signed in to your account yet, so nothing is being saved to the website. Settings has the sign-in.", 11, Color(1, 0.75, 0.5))


func _tab_numbers() -> void:
	var rows := [
		["Keys, all time", _commas(keys_total)],
		["Today", _commas(keys_today)],
		["This session", _commas(keys_session)],
		["Keys a second, now", "%.1f" % kps],
		["Best keys a second", "%.1f" % best_kps],
		["Best day", _commas(best_day)],
		["Days in a row", str(streak)],
		["Chests opened", str(chests_opened)],
	]
	for r in rows:
		var h := _row(body)
		var a := _lbl(h, str(r[0]), 12, Color(0.72, 0.79, 0.95))
		a.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_lbl(h, str(r[1]), 13, Color(1, 1, 1))
	_lbl(body, "Time at each job", 13, Color(1, 1, 1))
	for id in items["activities"]:
		var h := _row(body)
		var a := _lbl(h, str(items["activities"][id]["name"]), 12, Color(0.72, 0.79, 0.95))
		a.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_lbl(h, "%d min" % int(minutes.get(id, 0.0)), 12, Color(1, 1, 1))
	_lbl(body, "He counts how many keys you press and never which ones. Nothing you type is read or kept.", 11, Color(0.68, 0.75, 0.92))


func _tab_settings() -> void:
	_lbl(body, "Size", 13, Color(1, 1, 1))
	var r := _row(body)
	for s in SIZES:
		_chip(r, s, s == size_name, func():
			size_name = s
			_apply_size()
			_save_local()
			_refresh_menu())
	_lbl(body, "How he talks", 13, Color(1, 1, 1))
	var r2 := _row(body)
	for m in ["sweet", "salty", "unhinged"]:
		_chip(r2, m.capitalize(), m == mood, func():
			mood = m
			say(_line("idle"))
			_refresh_menu())
	var r3 := _row(body)
	_chip(r3, "Always on top", top_most, func():
		top_most = not top_most
		get_window().set_flag(Window.FLAG_ALWAYS_ON_TOP, top_most)
		_refresh_menu())
	_chip(r3, "Sound", sound, func():
		sound = not sound
		_refresh_menu())
	_lbl(body, "Your account", 13, Color(1, 1, 1))
	if cloud.linked():
		_lbl(body, "Signed in as %s. Everything he finds goes to your ledger on the website." % cloud.username, 11)
	else:
		_lbl(body, "Not signed in. Open your account on oversummoned.com, go to Desktop pet, and type the code it gives you here.", 11, Color(0.72, 0.79, 0.95))
		var e := LineEdit.new()
		e.placeholder_text = "Pairing code"
		body.add_child(e)
		var b := Button.new()
		b.text = "Sign in"
		b.pressed.connect(func(): _pair(e.text.strip_edges()))
		body.add_child(b)
	var q := Button.new()
	q.text = "Quit"
	q.pressed.connect(func():
		_save_local()
		get_tree().quit())
	body.add_child(q)


func _pair(code: String) -> void:
	if code == "":
		return
	var r = await cloud.claim(code, OS.get_name())
	if r is Dictionary and r.has("token"):
		cloud.token = str(r["token"])
		cloud.username = str(r.get("username", "you"))
		_note("Smudge knows you now, %s." % cloud.username)
		_save()
	else:
		_note("That code did not work. They only last ten minutes.")
	_refresh_menu()
