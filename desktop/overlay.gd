extends Node2D
# Draws the per-location effects (summon circle fill, fishing line, lock pins)
# on top of the scene art. main.gd does the actual drawing.

var main = null   # main.gd, untyped so draw_overlay() resolves at runtime

func _draw() -> void:
	if main != null:
		main.draw_overlay(self)
