extends SceneTree
# Test harness: loads the game, drives it, saves screenshots to /tmp/os_shots.
var main
var frame := 0
var plan := []
var step := 0
var wait := 0

func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("/tmp/os_shots")
	Engine.max_fps = 30
	main = load("res://main.tscn").instantiate()
	root.add_child(main)
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
	var p: PackedStringArray = plan[step].split(":")
	step += 1
	match p[0]:
		"loc":
			main.place_index = int(p[1])
			main.progress = 0.0
			main.asleep = false
			main._enter_place(false)
		"tap":
			for i in int(p[1]):
				main.tap_budget = 99.0
				main.anim_gap = 0.0
				main._tap()
		"wait":
			wait = int(p[1])
		"prog":
			if main._skill() == "Summoning":
				main.ink = main._summon_cost() * float(p[1]) - 1.0
			else:
				main.progress = main._need() * float(p[1]) - 1.0
		"xp":
			for s in main.xp:
				main.xp[s] = int(p[1])
			main._refresh_places()
		"sleep":
			main.asleep = true
			main._set_pose()
		"wake":
			main.asleep = false
			main._set_pose()
		"say":
			main._say("idle")
		"cheer":
			main.smudge.cheer(2.0)
		"blink":
			main.smudge.blink = 1.0
		"crate":
			main.crate_ready = true
		"opencrate":
			main._open_crate()
		"all":
			for h in main.R["heroes"]:
				main.roster[str(h["id"])] = 1
			main.bag["x_crate"] = 3
			main._refresh_roster()
		"menu":
			main.menu.visible = true
			main._show_tab(p[1])
		"loot":
			main._open_loot(p[1])
		"tipitem":
			main._show_tip(main._item_tip(p[1]), main.bag_grid)
		"tiphero":
			main._show_tip(main._hero_tip(main.heroes_by_id[p[1]]), main.roster_grid)
		"nomenu":
			main._close_menu()
		"travel":
			main._travel(int(p[1]))
		"dbg":
			print("DBG pose=", main.smudge.pose, " springs=", main.smudge.springs, " fps=", Engine.get_frames_per_second(), " parts=", main.smudge.poses[main.smudge.pose]["parts"].keys())
		"shot":
			root.get_texture().get_image().save_png("/tmp/os_shots/%s.png" % p[1])
	return false
