extends Node2D
# Draws the per-location effects (summon circle fill, fishing line, lock pins,
# flying loot) on top of the scene art. main.gd does the actual drawing.
# layer 0 sits under Smudge, layer 1 above him.

var main = null   # main.gd, untyped so draw_overlay() resolves at runtime
var layer := 0

func _draw() -> void:
	if main != null:
		main.draw_overlay(self, layer)
