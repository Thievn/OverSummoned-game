extends SceneTree
# Test harness: loads the game, drives it, and saves screenshots to /tmp/os_shots.
var main
var frame := 0
var plan := []
var step := 0
var wait := 0

func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("/tmp/os_shots")
	var scene = load("res://main.tscn").instantiate()
	root.add_child(scene)
	main = scene
	var args := OS.get_cmdline_user_args()
	plan = (args[0] if args.size() > 0 else "shot:a").split(",")

func _process(_d: float) -> bool:
	frame += 1
	if frame < 5:
		return false
	if wait > 0:
		wait -= 1
		return false
	if step >= plan.size():
		return true
	var cmd: String = plan[step]
	step += 1
	var p := cmd.split(":")
	match p[0]:
		"loc":
			main.loc_index = int(p[1])
			main._enter_location(false)
		"tap":
			for i in int(p[1]):
				main.tap_budget = 99.0
				main.anim_gap = 0.0
				main._tap()
		"wait":
			wait = int(p[1])
		"prog":
			main.progress[main._loc_id()] = main._need() * float(p[1]) - (1.0 if float(p[1]) >= 1.0 else 0.0)
		"sleep":
			main.asleep = true
		"wake":
			main.asleep = false
		"menu":
			main.menu.visible = true
			main._show_tab(p[1])
		"nomenu":
			main.menu.visible = false
		"travel":
			main._travel(int(p[1]))
		"size":
			main._set_size(int(p[1]))
		"shot":
			var img: Image = root.get_texture().get_image()
			img.save_png("/tmp/os_shots/%s.png" % p[1])
	return false
