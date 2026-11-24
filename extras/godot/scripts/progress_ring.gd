extends Control
## Circular drop-countdown ring with a label in the middle.

var progress: float = 1.0
var caption: String = "DROP IN"
var time_text: String = "30:00"
var ring_color: Color = Color("#f5a623")

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(88, 88)


func set_values(p: float, caption_in: String, time_in: String, col: Color) -> void:
	progress = clampf(p, 0.0, 1.0)
	caption = caption_in
	time_text = time_in
	ring_color = col
	queue_redraw()


func _draw() -> void:
	var c := size * 0.5
	var r: float = minf(size.x, size.y) * 0.42
	draw_arc(c, r, 0, TAU, 48, Color(0.08, 0.08, 0.1, 0.85), 8.0, true)
	var start := -PI / 2.0
	var sweep := TAU * progress
	if progress > 0.001:
		draw_arc(c, r, start, start + sweep, 48, ring_color, 8.0, true)
	var font := load("res://assets/ui/DejaVuSans-Bold.ttf") as FontFile
	if font == null:
		return
	var cap_size := 8
	var time_size := 12
	var cap_s := font.get_string_size(caption, HORIZONTAL_ALIGNMENT_LEFT, -1, cap_size)
	draw_string(font, c + Vector2(-cap_s.x * 0.5, -6), caption, HORIZONTAL_ALIGNMENT_LEFT, -1, cap_size, Color(1, 0.92, 0.7, 0.95))
	var t_s := font.get_string_size(time_text, HORIZONTAL_ALIGNMENT_LEFT, -1, time_size)
	draw_string(font, c + Vector2(-t_s.x * 0.5, 12), time_text, HORIZONTAL_ALIGNMENT_LEFT, -1, time_size, Color(1, 1, 1, 1))
