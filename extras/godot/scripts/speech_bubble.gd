extends Control
## Comic speech bubble that pops in above the summoner and fades out.

var _panel: Panel
var _label: Label
var _tween: Tween
var _lifetime: float = 0.0
const WRAP_W := 252.0
const LINE_H := 18.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false
	size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	_panel = Panel.new()
	_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.clip_contents = true
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 1, 1, 0.96)
	sb.border_color = Color(0.12, 0.12, 0.16, 1)
	sb.border_width_left = 3
	sb.border_width_right = 3
	sb.border_width_top = 3
	sb.border_width_bottom = 3
	sb.corner_radius_top_left = 16
	sb.corner_radius_top_right = 16
	sb.corner_radius_bottom_left = 16
	sb.corner_radius_bottom_right = 16
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	sb.shadow_color = Color(0, 0, 0, 0.25)
	sb.shadow_size = 6
	_panel.add_theme_stylebox_override("panel", sb)
	add_child(_panel)
	_label = Label.new()
	_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.add_theme_color_override("font_color", Color(0.12, 0.12, 0.16, 1))
	var font := load("res://assets/ui/DejaVuSans-Bold.ttf") as FontFile
	if font:
		_label.add_theme_font_override("font", font)
	_label.add_theme_font_size_override("font_size", 13)
	_panel.add_child(_label)
	set_process(true)


func _process(delta: float) -> void:
	if not visible:
		return
	_lifetime -= delta
	if _lifetime <= 0.0:
		_fade_out()


func say(text: String, linger: float = 3.2) -> void:
	_label.text = text
	_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_label.custom_minimum_size = Vector2(WRAP_W, 0)
	_label.size = Vector2(WRAP_W, 0)
	await get_tree().process_frame
	var lines := maxi(1, _label.get_line_count())
	var w: float = WRAP_W + 32.0
	var h: float = clampf(24.0 + float(lines) * (LINE_H + 2.0) + 8.0, 52.0, 120.0)
	_panel.position = Vector2.ZERO
	_panel.size = Vector2(w, h)
	_label.position = Vector2(16, 10)
	_label.custom_minimum_size = Vector2(WRAP_W, h - 20.0)
	_label.size = Vector2(WRAP_W, h - 20.0)
	custom_minimum_size = Vector2(w, h + 12.0)
	size = Vector2(w, h + 12.0)
	pivot_offset = Vector2(w * 0.5, h)
	visible = true
	modulate = Color(1, 1, 1, 1)
	scale = Vector2(0.6, 0.6)
	_lifetime = linger
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_tween.tween_property(self, "scale", Vector2.ONE, 0.28)
	queue_redraw()


func _fade_out() -> void:
	if not visible:
		return
	_lifetime = 999.0
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(self, "modulate:a", 0.0, 0.28)
	_tween.tween_callback(func() -> void: visible = false)


func _draw() -> void:
	if _panel == null:
		return
	var mid := _panel.size.x * 0.5
	var y := _panel.size.y - 1.0
	var pts := PackedVector2Array([
		Vector2(mid - 9, y),
		Vector2(mid + 9, y),
		Vector2(mid, y + 12),
	])
	draw_colored_polygon(pts, Color(1, 1, 1, 0.96))
	draw_polyline(PackedVector2Array([pts[0], pts[2], pts[1]]), Color(0.12, 0.12, 0.16, 1), 3.0)
