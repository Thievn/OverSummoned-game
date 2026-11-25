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
		"link":
			main.cloud.fake = _fake_server
			main.cloud.token = "test"
			main.cloud.username = "DevOtter"
			main._cloud_load()
		"linkb":
			main.cloud.fake = _fake_server
			main.link_req = "ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12"
			main.link_left = 600.0
			main._refresh_link()
		"cloudsave":
			main._cloud_save()
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


# a pretend server for the linked path: same answers the real one gives
var srv := {"rev": 3, "data": {"v": 3, "ink": 9000.0, "gold": 12.0, "xp": {"Fishing": 5000000.0, "Summoning": 100.0}, "bag": {"bath_carp": 2.0, "x_shard": 1.0}, "roster": {"kevin": 1.0, "lola": 2.0}, "actions": 10.0, "crew": ["lola", null, null]}}
func _fake_server(fn: String, body: Dictionary):
	if fn == "os2_link_poll":
		print("FAKE poll")
		return {"r": "ok", "token": "test", "username": "DevOtter"}
	if fn != "os2_pet":
		return {"r": "ok", "token": "test", "username": "DevOtter"}
	var a: Dictionary = body["p_args"]
	match str(body["p_op"]):
		"load":
			return {"r": "ok", "data": srv["data"], "rev": srv["rev"], "username": "DevOtter"}
		"save":
			if int(a["rev"]) != int(srv["rev"]):
				return {"r": "ok", "ok": false, "why": "stale", "data": srv["data"], "rev": srv["rev"]}
			srv["data"] = a["data"]
			srv["rev"] = int(srv["rev"]) + 1
			print("FAKE save ok rev ", srv["rev"], " bag ", (a["data"]["bag"] as Dictionary).size(), " crew kept ", a["data"].has("crew"))
			return {"r": "ok", "ok": true, "rev": srv["rev"]}
		"roll":
			var add := {}
			for e in a["rolls"]:
				add["bath_eel" if str(e["place"]) == "dock" else "archive_7"] = int(e["n"])
			srv["rev"] = int(srv["rev"]) + 1
			print("FAKE roll ", a["rolls"])
			return {"r": "ok", "add": add, "list": [], "rev": srv["rev"]}
		"summon":
			srv["rev"] = int(srv["rev"]) + 1
			print("FAKE summon")
			return {"r": "ok", "got": [{"id": "vesper", "had": 0, "cost": 3800, "rarity": "epic"}], "set": {"ink": 5200, "roster": {"kevin": 1, "lola": 2, "vesper": 1}, "summons": 1, "shards": 1, "sxp": 1050}, "rev": srv["rev"]}
		"sell":
			srv["rev"] = int(srv["rev"]) + 1
			print("FAKE sell ", a["items"])
			return {"r": "ok", "earned": 8, "set": {"bag": {"bath_eel": 1}, "gold": 20}, "rev": srv["rev"]}
	return {"r": "bad"}
