extends Node2D
## Overlay window, HUD, drawer wiring, and the summon-reveal animation.

const StageScript = preload("res://scripts/summoning_stage.gd")
const DrawerScript = preload("res://scripts/drawer.gd")
const BubbleScript = preload("res://scripts/speech_bubble.gd")
const RingScript = preload("res://scripts/progress_ring.gd")

const STAGE_DESIGN := Vector2(840, 430)
const BUBBLE_PAD := 128
const HUD_BAND := 100
const DRAWER_SIZE := Vector2(470, 580)
const TOGGLE_SIZE := Vector2(44, 44)

var stage: Node2D
var ui: CanvasLayer
var drawer: Control
var bubble: Control
var clicks_pill: Panel
var clicks_label: Label
var drop_ring: Control
var toggle: Button
var banner: Panel
var banner_label: Label
var fly_item: Sprite2D
var plus_label: Label
var _hit_poly := PackedVector2Array()
var _dragging := false
var _moved := false
var _press_offset := Vector2i()
var _placed := false
var _summon_busy := false
var _font_bold: FontFile
var _font: FontFile


func _ready() -> void:
	_font_bold = load("res://assets/ui/DejaVuSans-Bold.ttf") as FontFile
	_font = load("res://assets/ui/DejaVuSans.ttf") as FontFile
	if not _headless():
		get_viewport().transparent_bg = true
		DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_TRANSPARENT, true)
		DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_BORDERLESS, true)
		# Keep resize enabled until the first _apply_window so programmatic
		# size changes work on X11; _apply_window re-locks it afterwards
		# (except during --capture-shots).
		if not _is_capture():
			DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_RESIZE_DISABLED, true)
		DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_ALWAYS_ON_TOP, GameState.flag("always_on_top"))
	_build()
	GameState.clicks_changed.connect(func(_t: int) -> void: _refresh_hud())
	GameState.timer_changed.connect(func(_s: float, _a: bool) -> void: _refresh_hud())
	GameState.charge_changed.connect(func(_c: int, _n: int) -> void: _refresh_hud())
	GameState.drop_started.connect(_on_drop_started)
	GameState.scale_changed.connect(func(_v: float) -> void: _apply_window(true))
	GameState.settings_changed.connect(_apply_chrome)
	Chatter.line_ready.connect(_on_line)
	call_deferred("_boot_window")
	set_process(true)


func _is_capture() -> bool:
	return "--capture-shots" in OS.get_cmdline_user_args()


func _boot_window() -> void:
	if _is_capture():
		_placed = true
		GameState.set_flag("click_through", false)
		GameState.set_flag("always_on_top", false)
		GameState.scale_value = 1.0
		await _capture_sequence()
		get_tree().quit()
		return
	_apply_window(false)
	if _headless():
		_placed = true
		return
	var pix := DisplayServer.window_get_size()
	var saved := GameState.window_pos
	var pos := saved
	if saved.x < 0 or saved.y < 0:
		var screen := DisplayServer.screen_get_usable_rect()
		pos = screen.position + Vector2i(screen.size) - pix - Vector2i(18, 12)
	DisplayServer.window_set_position(_clamp_window(pos, pix))
	_placed = true
	_remember_window()
	_rebuild_passthrough()
	# A little hello.
	await get_tree().create_timer(0.6).timeout
	Chatter.request_line("idle", true)


func _build() -> void:
	stage = StageScript.new()
	stage.name = "Stage"
	add_child(stage)

	fly_item = Sprite2D.new()
	fly_item.centered = true
	fly_item.visible = false
	fly_item.z_index = 40
	add_child(fly_item)

	plus_label = Label.new()
	plus_label.visible = false
	plus_label.text = "+1"
	plus_label.z_index = 41
	if _font_bold:
		plus_label.add_theme_font_override("font", _font_bold)
	plus_label.add_theme_font_size_override("font_size", 18)
	plus_label.add_theme_color_override("font_color", Color(1, 0.92, 0.45, 1))
	add_child(plus_label)

	ui = CanvasLayer.new()
	ui.name = "UI"
	add_child(ui)

	clicks_pill = Panel.new()
	clicks_pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sb := _sb(Color(0.09, 0.10, 0.14, 0.88), Color(1, 1, 1, 0.12), 14, 1)
	clicks_pill.add_theme_stylebox_override("panel", sb)
	ui.add_child(clicks_pill)
	clicks_label = Label.new()
	clicks_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	clicks_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	if _font_bold:
		clicks_label.add_theme_font_override("font", _font_bold)
	clicks_label.add_theme_font_size_override("font_size", 16)
	clicks_label.add_theme_color_override("font_color", Color(1, 1, 1, 1))
	clicks_pill.add_child(clicks_label)

	drop_ring = RingScript.new()
	ui.add_child(drop_ring)

	toggle = Button.new()
	toggle.text = "✦"
	toggle.focus_mode = Control.FOCUS_NONE
	toggle.custom_minimum_size = TOGGLE_SIZE
	toggle.tooltip_text = "Open the OverSummoned menu"
	var tsb := _sb(Color(0.12, 0.12, 0.16, 0.92), Color(0.95, 0.75, 0.3, 0.85), 22, 1)
	toggle.add_theme_stylebox_override("normal", tsb)
	toggle.add_theme_stylebox_override("hover", _sb(Color(0.22, 0.16, 0.30, 0.95), Color(1, 0.85, 0.4, 1), 22, 1))
	toggle.add_theme_color_override("font_color", Color(1, 0.92, 0.7, 1))
	if _font_bold:
		toggle.add_theme_font_override("font", _font_bold)
	toggle.add_theme_font_size_override("font_size", 18)
	toggle.pressed.connect(_toggle_drawer)
	ui.add_child(toggle)

	drawer = DrawerScript.new()
	drawer.visible = false
	drawer.request_summon.connect(func() -> void: GameState.trigger_summon(true))
	drawer.request_close.connect(_close_drawer)
	drawer.tab_changed.connect(func(_t: String) -> void: _apply_window(true))
	ui.add_child(drawer)

	bubble = BubbleScript.new()
	ui.add_child(bubble)

	banner = Panel.new()
	banner.visible = false
	banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	banner.add_theme_stylebox_override("panel", _sb(Color(0.08, 0.08, 0.1, 0.94), Color(1, 1, 1, 0.8), 10, 2))
	ui.add_child(banner)
	banner_label = Label.new()
	banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	if _font_bold:
		banner_label.add_theme_font_override("font", _font_bold)
	banner_label.add_theme_font_size_override("font_size", 15)
	banner.add_child(banner_label)

	_refresh_hud()


func _process(_delta: float) -> void:
	_place_bubble()
	if not _headless():
		_rebuild_passthrough()


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_EXIT_TREE:
		_remember_window()
		SaveManager.write_now()
		if what == NOTIFICATION_WM_CLOSE_REQUEST:
			get_tree().quit()


func _unhandled_input(event: InputEvent) -> void:
	if _headless():
		return
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		if drawer.visible and drawer.has_method("is_line_focused") and drawer.is_line_focused():
			return
		SaveManager.write_now()
		get_tree().quit()
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			if _point_inside(event.position) and not _over_ui(event.position):
				_dragging = true
				_moved = false
				_press_offset = DisplayServer.mouse_get_position() - DisplayServer.window_get_position()
		elif _dragging:
			if not _moved:
				InputTracker.register_local_click()
			else:
				_remember_window()
			_dragging = false
	elif event is InputEventMouseMotion and _dragging:
		var next := DisplayServer.mouse_get_position() - _press_offset
		if Vector2(DisplayServer.window_get_position()).distance_to(Vector2(next)) > 4.0:
			_moved = true
		if _moved:
			DisplayServer.window_set_position(_clamp_window(next, DisplayServer.window_get_size()))


func _over_ui(point: Vector2) -> bool:
	if toggle.get_global_rect().has_point(point):
		return true
	if drawer.visible and drawer.get_global_rect().has_point(point):
		return true
	return false


func _toggle_drawer() -> void:
	if drawer.visible:
		_close_drawer()
	else:
		drawer.visible = true
		drawer.open_tab(GameState.drawer_tab)
		GameState.drawer_open = true
		_apply_window(true)


func _close_drawer() -> void:
	drawer.visible = false
	GameState.drawer_open = false
	_apply_window(true)


func _apply_chrome() -> void:
	if _headless():
		return
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_BORDERLESS, true)
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_RESIZE_DISABLED, true)
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_TRANSPARENT, true)
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_ALWAYS_ON_TOP, GameState.flag("always_on_top"))


func _apply_window(anchor_corner: bool) -> void:
	var scale := GameState.scale_value
	var stage_px := STAGE_DESIGN * scale
	var pix := Vector2i(Vector2(maxi(int(stage_px.x) + 48, 200), int(BUBBLE_PAD * scale + stage_px.y) + HUD_BAND))
	if drawer.visible:
		pix.x = maxi(pix.x, int(stage_px.x) + int(DRAWER_SIZE.x) + 24 + 48)
		pix.y = maxi(pix.y, int(DRAWER_SIZE.y) + 16)
	pix.x = maxi(pix.x, 200)
	pix.y = maxi(pix.y, 240)
	if _headless():
		_layout_at(Vector2(pix))
		return
	var old := DisplayServer.window_get_size()
	var old_pos := DisplayServer.window_get_position()
	# Programmatic resize must be allowed or X11 will keep the launch size.
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_RESIZE_DISABLED, false)
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
	var win := get_window()
	if win:
		win.unresizable = false
		win.size = pix
	DisplayServer.window_set_size(pix)
	get_viewport().size = Vector2i(pix)
	if _is_capture():
		print("WINDOW_RESIZE want=", pix, " window=", DisplayServer.window_get_size(), " viewport=", get_viewport().size)
	if not _is_capture():
		DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_RESIZE_DISABLED, true)
		if win:
			win.unresizable = true
	if anchor_corner and _placed:
		var delta := pix - old
		# Grow/shrink from the bottom-right so the summoner stays put.
		DisplayServer.window_set_position(_clamp_window(old_pos - Vector2i(delta.x, delta.y), pix))
	_layout_at(Vector2(pix))
	_apply_chrome()
	_rebuild_passthrough()


func _layout_at(pix: Vector2) -> void:
	var scale := GameState.scale_value
	var stage_px := STAGE_DESIGN * scale
	var bubble_pad := BUBBLE_PAD * scale
	# Stage origin is the top-left of the diorama (summoner left, circle right).
	var right_pad := 48.0 * scale
	var stage_col_x := pix.x - stage_px.x - right_pad
	if not drawer.visible:
		stage_col_x = (pix.x - stage_px.x) * 0.5
	stage.scale = Vector2.ONE * scale
	stage.position = Vector2(stage_col_x, bubble_pad)

	# HUD along the bottom of the stage column.
	var hud_y := pix.y - 86.0
	clicks_pill.size = Vector2(minf(200.0, stage_px.x * 0.55), 44)
	clicks_pill.position = Vector2(stage_col_x + 8, hud_y + 8)
	clicks_label.position = Vector2(10, 0)
	clicks_label.size = clicks_pill.size - Vector2(20, 0)

	drop_ring.size = Vector2(88, 88)
	drop_ring.position = Vector2(stage_col_x + stage_px.x - 96, hud_y - 8)

	toggle.size = TOGGLE_SIZE
	toggle.position = Vector2(stage_col_x + stage_px.x - TOGGLE_SIZE.x - 6, 8)

	if drawer.visible:
		var drawer_h := maxf(280.0, pix.y - 16.0)
		drawer.size = Vector2(DRAWER_SIZE.x, drawer_h)
		drawer.position = Vector2(8, 8)
		drawer.clip_contents = true
		if drawer.has_method("fit_page_widths"):
			drawer.call_deferred("fit_page_widths")

	_refresh_hud()


func _refresh_hud() -> void:
	if clicks_label:
		clicks_label.text = "%s  CLICKS" % _comma(GameState.clicks)
	if drop_ring and drop_ring.has_method("set_values"):
		var full: float = GameState._full_drop_time()
		var left: float = GameState.drop_seconds_left
		var prog: float = 0.0 if full <= 0.0 else 1.0 - clampf(left / full, 0.0, 1.0)
		# Also show charge as a slight color shift when uncharged.
		var charged := GameState.click_charge >= Catalog.CHARGE_NEEDED
		var col := Color("#f5a623") if charged else Color("#9ca3af")
		var cap := "DROP IN" if charged else "CHARGE"
		var text := _fmt_time(left)
		if not charged:
			text = "%d/%d" % [GameState.click_charge, Catalog.CHARGE_NEEDED]
		drop_ring.set_values(prog if charged else float(GameState.click_charge) / float(Catalog.CHARGE_NEEDED), cap, text, col)


func _fmt_time(seconds: float) -> String:
	var s: int = maxi(0, int(ceil(seconds)))
	return "%d:%02d" % [s / 60, s % 60]


func _comma(n: int) -> String:
	var sign := "-" if n < 0 else ""
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3, 3) + out
		s = s.substr(0, s.length() - 3)
	return sign + s + out


func _on_line(text: String, _kind: String) -> void:
	if bubble and bubble.has_method("say"):
		bubble.say(text)


func _place_bubble() -> void:
	if bubble == null or not bubble.visible:
		return
	var top: Vector2 = stage.crown_top_global() if stage.has_method("crown_top_global") else stage.head_global()
	const BUBBLE_GAP := 24.0
	var pos := Vector2(top.x - bubble.size.x * 0.5, top.y - bubble.size.y - BUBBLE_GAP)
	var vs := get_viewport().get_visible_rect().size
	pos.x = clampf(pos.x, 8.0, maxf(8.0, vs.x - bubble.size.x - 8.0))
	pos.y = clampf(pos.y, 4.0, maxf(4.0, vs.y - bubble.size.y - 8.0))
	bubble.position = pos


func _on_drop_started(item_id: String) -> void:
	if _summon_busy:
		return
	_run_summon(item_id)


func _run_summon(item_id: String) -> void:
	_summon_busy = true
	# Open the drawer so the loot has somewhere satisfying to fly.
	if not drawer.visible:
		drawer.visible = true
		GameState.drawer_open = true
	drawer.open_tab("drops")
	_apply_window(true)
	await get_tree().process_frame

	if stage.has_method("play_summon_burst"):
		stage.play_summon_burst()

	var it: Dictionary = Catalog.item(item_id)
	var rarity := String(it.get("rarity", "common"))
	var col: Color = Catalog.rarity_color(rarity)
	if stage.has_method("show_sunburst"):
		stage.show_sunburst(col)

	fly_item.texture = Catalog.load_texture(String(it.get("texture", "")))
	fly_item.visible = true
	fly_item.modulate = Color(1, 1, 1, 1)
	fly_item.z_index = 40
	# Rise out of the wide-open circle on the RIGHT, not from the summoner.
	var start: Vector2 = stage.circle_center_global()
	fly_item.position = start
	fly_item.scale = Vector2(0.06, 0.06)
	fly_item.rotation = -0.3

	_show_banner("%s!  %s" % [Catalog.RARITY_LABEL[rarity], String(it.get("name", "Item"))], col, start + Vector2(0, -64))

	var pop := create_tween()
	pop.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	pop.tween_property(fly_item, "scale", Vector2(0.34, 0.34), 0.35)
	pop.parallel().tween_property(fly_item, "position", start + Vector2(0, -92), 0.35)
	pop.parallel().tween_property(fly_item, "rotation", 0.15, 0.35)
	await pop.finished
	await get_tree().create_timer(1.6).timeout

	# Arc into the Drops tab button.
	var dest: Vector2 = drawer.drops_target_global() if drawer.has_method("drops_target_global") else start + Vector2(-200, -40)
	# If dest is in viewport/UI space, that's the same as our Node2D space
	# because stretch mode is disabled and we didn't parent fly_item to the canvas.
	# Drawer is on a CanvasLayer, get_global_rect is in viewport coords, which match.
	var mid := (fly_item.position + dest) * 0.5 + Vector2(0, -80)
	var fly := create_tween()
	fly.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	var dur := 0.55
	# Approximate a curve with two tweens.
	fly.tween_property(fly_item, "position", mid, dur * 0.45)
	fly.parallel().tween_property(fly_item, "scale", Vector2(0.32, 0.32), dur * 0.45)
	fly.tween_property(fly_item, "position", dest, dur * 0.55)
	fly.parallel().tween_property(fly_item, "scale", Vector2(0.08, 0.08), dur * 0.55)
	fly.parallel().tween_property(fly_item, "rotation", 0.6, dur * 0.55)
	await fly.finished

	# Juicy bounce + sparkle + +1
	var bounce := create_tween()
	bounce.tween_property(fly_item, "scale", Vector2(0.18, 0.18), 0.08)
	bounce.tween_property(fly_item, "scale", Vector2(0.05, 0.05), 0.12)
	plus_label.visible = true
	plus_label.modulate.a = 1.0
	plus_label.position = dest + Vector2(-8, -24)
	var ptw := create_tween()
	ptw.tween_property(plus_label, "position", dest + Vector2(-8, -58), 0.45)
	ptw.parallel().tween_property(plus_label, "modulate:a", 0.0, 0.45)
	await bounce.finished
	fly_item.visible = false
	if stage.has_method("hide_sunburst"):
		stage.hide_sunburst()
	_hide_banner()
	await get_tree().create_timer(0.2).timeout
	plus_label.visible = false
	GameState.finish_summon()
	if stage.has_method("unlock_pose"):
		stage.unlock_pose()
	_summon_busy = false


func _show_banner(text: String, col: Color, world_pos: Vector2) -> void:
	banner_label.text = text
	banner_label.add_theme_color_override("font_color", col)
	banner.size = Vector2(280, 36)
	banner.position = world_pos + Vector2(-140, -96)
	var vs := get_viewport().get_visible_rect().size
	banner.position.x = clampf(banner.position.x, 8.0, maxf(8.0, vs.x - banner.size.x - 56.0))
	banner.position.y = clampf(banner.position.y, 8.0, maxf(8.0, vs.y - banner.size.y - 8.0))
	var sb := _sb(Color(0.08, 0.08, 0.1, 0.94), col, 10, 2)
	banner.add_theme_stylebox_override("panel", sb)
	banner_label.position = Vector2(8, 0)
	banner_label.size = banner.size - Vector2(16, 0)
	banner.visible = true
	banner.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(banner, "modulate:a", 1.0, 0.15)


func _hide_banner() -> void:
	if not banner.visible:
		return
	var tw := create_tween()
	tw.tween_property(banner, "modulate:a", 0.0, 0.2)
	tw.tween_callback(func() -> void: banner.visible = false)


func _rebuild_passthrough() -> void:
	if _headless():
		return
	var raw: Array = []
	raw.append_array(_rect_points(stage.global_hit_rect().grow(8.0)))
	raw.append_array(_rect_points(clicks_pill.get_global_rect().grow(4.0)))
	raw.append_array(_rect_points(drop_ring.get_global_rect().grow(4.0)))
	raw.append_array(_rect_points(toggle.get_global_rect().grow(4.0)))
	if drawer.visible:
		raw.append_array(_rect_points(drawer.get_global_rect().grow(4.0)))
	if bubble.visible:
		raw.append_array(_rect_points(Rect2(bubble.position, bubble.size).grow(4.0)))
	if fly_item.visible:
		raw.append_array(_rect_points(Rect2(fly_item.position - Vector2(40, 40), Vector2(80, 80))))
	_hit_poly = _hull(raw)
	if not GameState.flag("click_through"):
		DisplayServer.window_set_mouse_passthrough(PackedVector2Array())
		return
	var windowed := PackedVector2Array()
	for point in _hit_poly:
		windowed.append(_to_window(point))
	DisplayServer.window_set_mouse_passthrough(windowed)


func _remember_window() -> void:
	if _headless() or not _placed:
		return
	GameState.window_pos = DisplayServer.window_get_position()


func _headless() -> bool:
	return DisplayServer.get_name() == "headless"


func _point_inside(point: Vector2) -> bool:
	return _hit_poly.size() >= 3 and _contains(point, _hit_poly)


func _to_window(point: Vector2) -> Vector2:
	var view := get_viewport().get_visible_rect().size
	var window := Vector2(DisplayServer.window_get_size())
	if view.x <= 1.0 or view.y <= 1.0:
		return point
	return point * (window / view)


func _clamp_window(pos: Vector2i, pix: Vector2i) -> Vector2i:
	var screen := DisplayServer.screen_get_usable_rect()
	var x := clampi(pos.x, screen.position.x - pix.x + 48, screen.position.x + screen.size.x - 48)
	var y := clampi(pos.y, screen.position.y - pix.y + 48, screen.position.y + screen.size.y - 48)
	return Vector2i(x, y)


func _rect_points(rect: Rect2) -> Array:
	return [
		rect.position,
		Vector2(rect.end.x, rect.position.y),
		rect.end,
		Vector2(rect.position.x, rect.end.y),
	]


func _contains(point: Vector2, poly: PackedVector2Array) -> bool:
	var inside := false
	var previous := poly.size() - 1
	for index in poly.size():
		var a: Vector2 = poly[index]
		var b: Vector2 = poly[previous]
		var crosses := (a.y > point.y) != (b.y > point.y)
		if crosses and point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) + 0.00001) + a.x:
			inside = not inside
		previous = index
	return inside


func _hull(points: Array) -> PackedVector2Array:
	var unique: Array = []
	for point in points:
		if not (point is Vector2):
			continue
		var keep := true
		for existing in unique:
			if (existing as Vector2).distance_squared_to(point) < 0.25:
				keep = false
				break
		if keep:
			unique.append(point)
	if unique.size() < 3:
		return PackedVector2Array(unique)
	unique.sort_custom(func(a: Vector2, b: Vector2) -> bool:
		return a.x < b.x or (is_equal_approx(a.x, b.x) and a.y < b.y)
	)
	var lower: Array = []
	for point in unique:
		while lower.size() >= 2 and _cross(lower[lower.size() - 2], lower[lower.size() - 1], point) <= 0.0:
			lower.pop_back()
		lower.append(point)
	var upper: Array = []
	for index in range(unique.size() - 1, -1, -1):
		var point: Vector2 = unique[index]
		while upper.size() >= 2 and _cross(upper[upper.size() - 2], upper[upper.size() - 1], point) <= 0.0:
			upper.pop_back()
		upper.append(point)
	if not lower.is_empty():
		lower.pop_back()
	if not upper.is_empty():
		upper.pop_back()
	lower.append_array(upper)
	return PackedVector2Array(lower)


func _cross(origin: Vector2, a: Vector2, b: Vector2) -> float:
	return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)


func _sb(bg: Color, border: Color, radius: int, border_w: int) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.border_width_left = border_w
	sb.border_width_right = border_w
	sb.border_width_top = border_w
	sb.border_width_bottom = border_w
	sb.corner_radius_top_left = radius
	sb.corner_radius_top_right = radius
	sb.corner_radius_bottom_left = radius
	sb.corner_radius_bottom_right = radius
	return sb


func _capture_sequence() -> void:
	# Showcase loadout so the screenshots look like a real mid-game moment.
	GameState.chatter_freq = "off"
	GameState.flags["mute_chatter"] = true
	for id in ["hat_pirate", "weapon_neon_blade", "relic_rift_crystal"]:
		if GameState.count_of(id) <= 0:
			GameState.add_item(id, 1, false)
	GameState.equipped["hat"] = "hat_pirate"
	GameState.equipped["weapon"] = "weapon_neon_blade"
	GameState.equipped["relic"] = "relic_rift_crystal"
	GameState.equipment_changed.emit()
	GameState.set_hero("apprentice")
	GameState.clicks = 14280
	GameState.click_charge = Catalog.CHARGE_NEEDED
	GameState.drop_seconds_left = 11.0 * 60.0 + 42.0
	var dir := ProjectSettings.globalize_path("res://live_shots")
	DirAccess.make_dir_recursive_absolute(dir)

	# 1) Idle, collapsed overlay.
	drawer.visible = false
	GameState.drawer_open = false
	if stage.has_method("unlock_pose"):
		stage.unlock_pose()
	stage.set_pose("idle")
	stage.beam_power = 0.0
	if bubble:
		bubble.visible = false
	banner.visible = false
	fly_item.visible = false
	_apply_window(false)
	_refresh_hud()
	await _settle(0.55)
	await _shot(dir.path_join("01_idle.png"))

	# 2) Casting: pose, beam into the circle, speech bubble.
	stage.lock_pose("cast", 1.0)
	_apply_window(false)
	await _settle(0.2)
	if bubble and bubble.has_method("say"):
		await bubble.say("Click faster! Something weird is coming through!", 12.0)
	_place_bubble()
	await _settle(0.45)
	await _shot(dir.path_join("02_casting.png"))

	# 3) Mid-summon reveal: pillar + item rising from the open circle, celebrate pose.
	if stage.has_method("play_summon_burst"):
		stage.play_summon_burst()
	var it: Dictionary = Catalog.item("relic_rift_crystal")
	var col: Color = Catalog.rarity_color("unhinged")
	if stage.has_method("show_sunburst"):
		stage.show_sunburst(col)
	fly_item.texture = Catalog.load_texture(String(it.get("texture", "")))
	fly_item.visible = true
	fly_item.modulate = Color(1, 1, 1, 1)
	var cpos: Vector2 = stage.circle_center_global()
	fly_item.position = cpos + Vector2(0, -92)
	fly_item.scale = Vector2(0.34, 0.34)
	fly_item.rotation = 0.12
	if toggle:
		toggle.visible = false
	_show_banner("UNHINGED!  Rift Crystal", col, cpos + Vector2(0, -80))
	if bubble and bubble.has_method("say"):
		await bubble.say("UNHINGED! I am professionally unprepared for how cool that is!", 12.0)
		_place_bubble()
	await _settle(0.55)
	# play_summon_burst flips to celebrate after the blast — make sure we're there.
	if stage.pose != "celebrate":
		stage.lock_pose("celebrate", 0.55)
	await _settle(0.25)
	await _shot(dir.path_join("03_summon_reveal.png"))

	# 4) Drawer open, neatly beside the stage, no overlap.
	if toggle:
		toggle.visible = true
	fly_item.visible = false
	_hide_banner()
	if stage.has_method("hide_sunburst"):
		stage.hide_sunburst()
	if stage.has_method("unlock_pose"):
		stage.unlock_pose()
	stage.set_pose("idle")
	stage.beam_power = 0.0
	if bubble:
		bubble.visible = false
	drawer.visible = true
	GameState.drawer_open = true
	drawer.open_tab("drops")
	_apply_window(true)
	await _settle(0.6)
	await _shot(dir.path_join("04_drawer_open.png"))

	# 5) Cyber-Knight idle with the Spiked Club, same grounded layout.
	drawer.visible = false
	GameState.drawer_open = false
	if toggle:
		toggle.visible = true
	if bubble:
		bubble.visible = false
	banner.visible = false
	fly_item.visible = false
	GameState.set_hero("cyber_knight")
	for id in ["hat_visor", "weapon_club", "relic_rift_crystal"]:
		if GameState.count_of(id) <= 0:
			GameState.add_item(id, 1, false)
	GameState.equipped["hat"] = "hat_visor"
	GameState.equipped["weapon"] = "weapon_club"
	GameState.equipped["relic"] = "relic_rift_crystal"
	GameState.equipment_changed.emit()
	if stage.has_method("unlock_pose"):
		stage.unlock_pose()
	stage.set_pose("idle")
	stage.beam_power = 0.0
	_apply_window(false)
	await _settle(0.55)
	await _shot(dir.path_join("05_cyber_knight_idle.png"))
	print("CAPTURE_SEQUENCE_DONE")


func _settle(seconds: float) -> void:
	var start := Time.get_ticks_msec()
	while Time.get_ticks_msec() - start < int(seconds * 1000.0):
		await RenderingServer.frame_post_draw


func _shot(path: String) -> void:
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	var tex := get_viewport().get_texture()
	if tex == null:
		push_error("capture: viewport texture is null")
		return
	var img := tex.get_image()
	if img == null:
		push_error("capture: get_image() returned null")
		return
	var err := img.save_png(path)
	print("CAPTURED ", path, " ", img.get_width(), "x", img.get_height(), " err=", err)
