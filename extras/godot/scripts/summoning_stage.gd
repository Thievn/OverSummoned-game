extends Node2D
## Grounded side-by-side diorama: summoner on the LEFT, open circle on the RIGHT.

signal stage_rect_changed

const RING_SQUASH := 0.36
const HERO_TEX_SCALE := 0.36
const PED_SCALE := 0.44
const DESIGN_SIZE := Vector2(840, 430)
const GROUND_Y := 348.0
const HERO_FEET_X := 150.0
const CIRCLE_X := 630.0
const CAST_HOLD := 0.45

var pedestal: Sprite2D
var ring_pivot: Node2D
var rune_outer: Sprite2D
var rune_inner: Sprite2D
var glow_orb: Sprite2D
var pillar: Sprite2D
var shockwave: Sprite2D
var sunburst: Sprite2D
var hero_root: Node2D
var hero_sprite: Sprite2D
var hat_sprite: Sprite2D
var weapon_sprite: Sprite2D
var relic_sprite: Sprite2D
var weapon_tip: Marker2D
var circle_center: Marker2D
var hero_shadow: Sprite2D
var ped_shadow: Sprite2D
var sparks: CPUParticles2D
var impact: CPUParticles2D
var burst: CPUParticles2D
var beam_core: Line2D
var beam_glow: Line2D
var beam_glow2: Line2D

var pose: String = "idle"
var beam_power: float = 0.0
var _spin_outer: float = 0.0
var _spin_inner: float = 0.0
var _cast_hold: float = 0.0
var _relic_t: float = 0.0
var _lunge_tween: Tween
var _locked_pose: bool = false  # true during a staged summon / capture


func _ready() -> void:
	_build()
	GameState.hero_changed.connect(func(_id: String) -> void: _refresh_hero())
	GameState.equipment_changed.connect(_refresh_gear)
	GameState.era_changed.connect(func(_id: String) -> void: _refresh_era())
	InputTracker.tap_registered.connect(_on_tap)
	_refresh_hero()
	_refresh_gear()
	_refresh_era()
	set_process(true)


func _build() -> void:
	# Ground contact shadows first (behind everything).
	ped_shadow = _sprite("res://assets/fx/contact_shadow.png", 1.0)
	ped_shadow.name = "PedestalShadow"
	ped_shadow.z_index = 0
	add_child(ped_shadow)

	hero_shadow = _sprite("res://assets/fx/contact_shadow.png", 1.0)
	hero_shadow.name = "HeroShadow"
	hero_shadow.z_index = 0
	add_child(hero_shadow)

	pedestal = _sprite("res://assets/circle/pedestal.png", PED_SCALE)
	pedestal.name = "Pedestal"
	pedestal.z_index = 1
	add_child(pedestal)

	circle_center = Marker2D.new()
	circle_center.name = "CircleCenterMarker"
	add_child(circle_center)

	ring_pivot = Node2D.new()
	ring_pivot.name = "RingPivot"
	ring_pivot.scale = Vector2(1.0, RING_SQUASH)
	ring_pivot.z_index = 2
	add_child(ring_pivot)

	glow_orb = _sprite("res://assets/circle/glow_orb.png", 0.70)
	glow_orb.modulate = Color(1, 1, 1, 0.7)
	ring_pivot.add_child(glow_orb)

	rune_outer = _sprite("res://assets/circle/rune_outer.png", 0.50)
	ring_pivot.add_child(rune_outer)

	rune_inner = _sprite("res://assets/circle/rune_inner.png", 0.32)
	ring_pivot.add_child(rune_inner)

	pillar = _sprite("res://assets/fx/rift_beam.png", 1.0)
	pillar.centered = false
	if pillar.texture:
		pillar.offset = Vector2(-pillar.texture.get_width() * 0.5, -pillar.texture.get_height())
	pillar.visible = false
	pillar.z_index = 6
	add_child(pillar)

	shockwave = _sprite("res://assets/fx/shockwave.png", 0.2)
	shockwave.visible = false
	shockwave.z_index = 7
	add_child(shockwave)

	sunburst = _sprite("res://assets/fx/sunburst.png", 0.35)
	sunburst.visible = false
	sunburst.z_index = 8
	add_child(sunburst)

	# Casting energy beam (updated every frame from weapon tip → circle).
	beam_glow2 = _make_beam_line(26.0, Color(1, 0.7, 1, 0.18))
	beam_glow2.z_index = 9
	add_child(beam_glow2)
	beam_glow = _make_beam_line(12.0, Color(1, 0.85, 1, 0.45))
	beam_glow.z_index = 10
	add_child(beam_glow)
	beam_core = _make_beam_line(4.0, Color(1, 1, 1, 0.95))
	beam_core.z_index = 11
	add_child(beam_core)

	hero_root = Node2D.new()
	hero_root.name = "HeroRoot"
	hero_root.z_index = 12
	add_child(hero_root)

	hero_sprite = Sprite2D.new()
	hero_sprite.name = "Hero"
	hero_sprite.centered = false
	hero_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	hero_root.add_child(hero_sprite)

	hat_sprite = Sprite2D.new()
	hat_sprite.name = "Hat"
	hat_sprite.centered = true
	hat_sprite.z_index = 3
	hero_root.add_child(hat_sprite)

	relic_sprite = Sprite2D.new()
	relic_sprite.name = "Relic"
	relic_sprite.centered = true
	relic_sprite.z_index = 1
	hero_root.add_child(relic_sprite)

	weapon_sprite = Sprite2D.new()
	weapon_sprite.name = "Weapon"
	weapon_sprite.centered = true
	weapon_sprite.z_index = 4
	hero_root.add_child(weapon_sprite)

	weapon_tip = Marker2D.new()
	weapon_tip.name = "WeaponTipMarker"
	weapon_sprite.add_child(weapon_tip)

	sparks = _particles("CastSparks", 22, 0.55, false)
	sparks.z_index = 13
	sparks.emitting = false
	add_child(sparks)

	impact = _particles("ImpactSparks", 28, 0.5, false)
	impact.z_index = 13
	impact.emitting = false
	impact.direction = Vector2(0, -1)
	impact.spread = 70.0
	impact.initial_velocity_min = 50.0
	impact.initial_velocity_max = 170.0
	add_child(impact)

	burst = _particles("Burst", 56, 0.75, true)
	burst.z_index = 14
	burst.emitting = false
	add_child(burst)

	_layout()


func _layout() -> void:
	# Pedestal sits on the shared ground plane, circle unobstructed on the right.
	var ped_bottom := Catalog.PED_BOTTOM_FROM_CENTER * PED_SCALE
	var ped_disc := Catalog.PED_DISC_FROM_CENTER * PED_SCALE
	pedestal.position = Vector2(CIRCLE_X, GROUND_Y - ped_bottom)
	circle_center.position = Vector2(CIRCLE_X, GROUND_Y - ped_bottom + ped_disc)
	ring_pivot.position = circle_center.position
	pillar.position = circle_center.position
	shockwave.position = circle_center.position
	sunburst.position = circle_center.position + Vector2(0, -70)
	burst.position = circle_center.position
	impact.position = circle_center.position

	ped_shadow.position = Vector2(CIRCLE_X, GROUND_Y - 8)
	ped_shadow.scale = Vector2(1.05, 0.48)
	ped_shadow.modulate = Color(0, 0, 0, 0.80)

	hero_root.position = Vector2(HERO_FEET_X, GROUND_Y)
	hero_shadow.position = Vector2(HERO_FEET_X, GROUND_Y - 6)
	hero_shadow.scale = Vector2(0.70, 0.36)
	hero_shadow.modulate = Color(0, 0, 0, 0.90)

	stage_rect_changed.emit()


func _sprite(path: String, sc: float) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = Catalog.load_texture(path)
	s.centered = true
	s.scale = Vector2.ONE * sc
	s.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	return s


func _make_beam_line(width: float, color: Color) -> Line2D:
	var l := Line2D.new()
	l.width = width
	l.default_color = color
	l.joint_mode = Line2D.LINE_JOINT_ROUND
	l.begin_cap_mode = Line2D.LINE_CAP_ROUND
	l.end_cap_mode = Line2D.LINE_CAP_ROUND
	l.antialiased = true
	l.visible = false
	l.points = PackedVector2Array([Vector2.ZERO, Vector2.ZERO])
	return l


func _particles(p_name: String, amount: int, lifetime: float, one_shot: bool) -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.name = p_name
	p.amount = amount
	p.lifetime = lifetime
	p.one_shot = one_shot
	p.explosiveness = 0.85 if one_shot else 0.15
	p.direction = Vector2(0, -1)
	p.spread = 80.0
	p.gravity = Vector2(0, 50)
	p.initial_velocity_min = 40.0
	p.initial_velocity_max = 150.0
	p.scale_amount_min = 0.4
	p.scale_amount_max = 1.2
	p.texture = Catalog.load_texture("res://assets/fx/spark.png")
	p.emitting = false
	return p


func _process(delta: float) -> void:
	var energy: float = maxf(GameState.spin_energy, beam_power * 0.85)
	var base_o := 0.40 + energy * 4.8
	var base_i := -0.62 - energy * 5.6
	_spin_outer += delta * base_o
	_spin_inner += delta * base_i
	rune_outer.rotation = _spin_outer
	rune_inner.rotation = _spin_inner
	var pulse := 1.0 + 0.08 * sin(Time.get_ticks_msec() / 280.0) + energy * 0.28
	glow_orb.scale = Vector2.ONE * (0.70 * pulse)
	glow_orb.modulate.a = 0.42 + energy * 0.50

	# Wind the beam down if we're not actively casting.
	if not _locked_pose:
		if pose == "cast":
			_cast_hold -= delta
			if _cast_hold <= 0.0:
				set_pose("idle")
		if pose != "cast" and not GameState.is_summoning():
			beam_power = move_toward(beam_power, 0.0, delta * 2.4)
		else:
			beam_power = move_toward(beam_power, 1.0, delta * 8.0)
	_update_beam()

	# Idle breathing / relic orbit — don't fight a lunge tween.
	_relic_t += delta
	if relic_sprite.visible:
		var base := _canvas_to_root(_socks()["relic"])
		relic_sprite.position = base + Vector2(sin(_relic_t * 1.5) * 5.0, sin(_relic_t * 2.2) * 6.0)
		relic_sprite.rotation = sin(_relic_t * 1.05) * 0.12
	if pose == "idle" and _lunge_tween == null:
		var b := 1.0 + sin(Time.get_ticks_msec() / 500.0) * 0.012
		hero_root.scale = Vector2(b, 2.0 - b)
		hero_root.position.y = GROUND_Y + sin(Time.get_ticks_msec() / 500.0) * 1.2

	impact.emitting = beam_power > 0.15
	sparks.emitting = beam_power > 0.15


func _update_beam() -> void:
	var on := beam_power > 0.04
	beam_core.visible = on
	beam_glow.visible = on
	beam_glow2.visible = on
	if not on:
		return
	var a: Vector2 = to_local(weapon_tip_global())
	var b: Vector2 = circle_center.position
	# Subtle lightning crackle.
	var mid := (a + b) * 0.5
	if beam_power > 0.4:
		var n := (b - a).orthogonal().normalized()
		mid += n * sin(Time.get_ticks_msec() / 35.0) * (3.0 + beam_power * 5.0)
	var pts := PackedVector2Array([a, mid, b])
	beam_core.points = pts
	beam_glow.points = pts
	beam_glow2.points = pts
	beam_core.width = 3.0 + beam_power * 4.0
	beam_glow.width = 10.0 + beam_power * 10.0
	beam_glow2.width = 22.0 + beam_power * 18.0
	var era: Dictionary = Catalog.ERAS.get(GameState.era_id, Catalog.ERAS["bureau"])
	var glow_c: Color = era["glow"]
	beam_core.default_color = Color(1, 1, 1, 0.55 + beam_power * 0.45)
	beam_glow.default_color = Color(glow_c.r, glow_c.g, glow_c.b, 0.25 + beam_power * 0.45)
	beam_glow2.default_color = Color(glow_c.r, glow_c.g * 0.6, 1.0, 0.10 + beam_power * 0.22)
	sparks.position = a
	impact.position = b


func _on_tap() -> void:
	if _locked_pose:
		# Still throw energy at the circle even during a hold.
		beam_power = 1.0
		return
	set_pose("cast")
	_cast_hold = CAST_HOLD
	beam_power = 1.0
	_lunge(1.0)


func _lunge(power: float) -> void:
	if _lunge_tween:
		_lunge_tween.kill()
	# Punchy forward lean toward the circle, then settle.
	hero_root.scale = Vector2(1.08, 0.90)
	_lunge_tween = create_tween()
	_lunge_tween.tween_property(hero_root, "scale", Vector2(0.96, 1.06), 0.07).set_trans(Tween.TRANS_BACK)
	_lunge_tween.parallel().tween_property(hero_root, "position:x", HERO_FEET_X + 10.0 * power, 0.07)
	_lunge_tween.tween_property(hero_root, "scale", Vector2.ONE, 0.14).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_lunge_tween.parallel().tween_property(hero_root, "position:x", HERO_FEET_X, 0.14)
	_lunge_tween.tween_callback(func() -> void: _lunge_tween = null)


func set_pose(p: String) -> void:
	if p == pose and hero_sprite.texture != null:
		_refresh_gear()
		return
	pose = p
	_refresh_hero()


func lock_pose(p: String, with_beam: float) -> void:
	_locked_pose = true
	set_pose(p)
	beam_power = with_beam
	hero_root.position = Vector2(HERO_FEET_X, GROUND_Y)
	hero_root.scale = Vector2.ONE


func unlock_pose() -> void:
	_locked_pose = false
	_cast_hold = 0.0
	set_pose("idle")


func play_summon_burst() -> void:
	lock_pose("cast", 1.0)
	_lunge(1.3)
	burst.position = circle_center.position
	burst.restart()
	burst.emitting = true
	pillar.visible = true
	pillar.modulate.a = 0.0
	# Origin is the disc surface; scale.y grows the column upward only.
	pillar.scale = Vector2(0.55, 0.12)
	shockwave.visible = true
	shockwave.scale = Vector2(0.18, 0.18 * RING_SQUASH)
	shockwave.modulate.a = 1.0
	var tw := create_tween()
	tw.tween_property(pillar, "modulate:a", 1.0, 0.12)
	tw.parallel().tween_property(pillar, "scale", Vector2(0.95, 0.58), 0.28)
	tw.parallel().tween_property(shockwave, "scale", Vector2(1.8, 1.8 * RING_SQUASH), 0.48)
	tw.parallel().tween_property(shockwave, "modulate:a", 0.0, 0.48)
	tw.tween_interval(0.2)
	# After the initial blast, swap to the celebrate pose on the left.
	tw.tween_callback(func() -> void:
		lock_pose("celebrate", 0.55)
	)
	tw.tween_property(pillar, "modulate:a", 0.35, 0.4)
	GameState.spin_energy = 1.0


func show_sunburst(color: Color) -> void:
	sunburst.visible = true
	sunburst.modulate = color
	sunburst.position = circle_center.position + Vector2(0, -80)
	sunburst.scale = Vector2(0.16, 0.16)
	sunburst.rotation = 0.0
	var tw := create_tween()
	tw.tween_property(sunburst, "scale", Vector2(0.95, 0.95), 0.35).set_trans(Tween.TRANS_BACK)
	tw.parallel().tween_property(sunburst, "rotation", 0.8, 1.8)


func hide_sunburst() -> void:
	if pillar.visible:
		var twp := create_tween()
		twp.tween_property(pillar, "modulate:a", 0.0, 0.25)
		twp.tween_callback(func() -> void: pillar.visible = false)
	if not sunburst.visible:
		return
	var tw := create_tween()
	tw.tween_property(sunburst, "modulate:a", 0.0, 0.2)
	tw.tween_callback(func() -> void:
		sunburst.visible = false
		sunburst.modulate.a = 1.0
	)


func _refresh_hero() -> void:
	hero_sprite.texture = Catalog.load_texture(Catalog.hero_texture_path(GameState.hero_id, pose))
	var feet: Vector2 = _socks().get("feet", Catalog.FEET)
	hero_sprite.scale = Vector2.ONE * HERO_TEX_SCALE
	hero_sprite.position = -feet * HERO_TEX_SCALE
	_refresh_gear()


func _socks() -> Dictionary:
	return Catalog.pose_sockets(GameState.hero_id, pose)


func _canvas_to_root(canvas_pt: Vector2) -> Vector2:
	var feet: Vector2 = _socks().get("feet", Catalog.FEET)
	return (canvas_pt - feet) * HERO_TEX_SCALE


func _refresh_gear() -> void:
	_apply_slot("hat", hat_sprite)
	_apply_slot("weapon", weapon_sprite)
	_apply_slot("relic", relic_sprite)
	# Weapon tip in the weapon sprite's local (unscaled texture) space.
	var id := String(GameState.equipped.get("weapon", ""))
	weapon_tip.position = Catalog.weapon_tip(id) if not id.is_empty() else Vector2(300, -300)


func _apply_slot(slot: String, spr: Sprite2D) -> void:
	var id := String(GameState.equipped.get(slot, ""))
	var it: Dictionary = Catalog.item(id)
	if it.is_empty() or not ResourceLoader.exists(String(it.get("texture", ""))):
		spr.visible = false
		spr.texture = null
		return
	spr.texture = Catalog.load_texture(String(it["texture"]))
	spr.visible = true
	var tex_w := float(spr.texture.get_width()) if spr.texture else 1024.0
	var view := Catalog.view_px(id, 200.0)
	# Size on the 1024 hero canvas, then apply the hero sprite scale.
	spr.scale = Vector2.ONE * ((view / tex_w) * HERO_TEX_SCALE * (1024.0 / 1024.0) / HERO_TEX_SCALE * HERO_TEX_SCALE)
	# view is "pixels on the 1024 hero canvas". spr.scale = view / tex_w * HERO_TEX_SCALE
	spr.scale = Vector2.ONE * ((view / tex_w) * HERO_TEX_SCALE)
	var pt: Vector2 = _socks().get(slot, Catalog.FEET)
	spr.position = _canvas_to_root(pt)


func _refresh_era() -> void:
	var era: Dictionary = Catalog.ERAS.get(GameState.era_id, Catalog.ERAS["bureau"])
	rune_outer.modulate = era["outer"]
	rune_inner.modulate = era["inner"]
	glow_orb.modulate = Color(era["glow"].r, era["glow"].g, era["glow"].b, glow_orb.modulate.a)
	sparks.color = era["particle"]
	impact.color = era["particle"]
	burst.color = era["particle"]
	pillar.modulate = Color(era["glow"].r, era["glow"].g, era["glow"].b, pillar.modulate.a)


func weapon_tip_global() -> Vector2:
	return weapon_tip.global_position


func circle_center_global() -> Vector2:
	return circle_center.global_position


func head_global() -> Vector2:
	return hero_root.to_global(_canvas_to_root(_socks()["hat"]))


func crown_top_global() -> Vector2:
	# Highest on-screen point of the hero body or equipped hat, so the
	# speech bubble can sit clearly above the tallest hat brim.
	var best := head_global()
	var best_y := best.y
	for s in [hero_sprite, hat_sprite]:
		if s == null or not is_instance_valid(s) or not s.visible or s.texture == null:
			continue
		var r: Rect2 = s.get_rect()
		var corners := [
			r.position,
			Vector2(r.end.x, r.position.y),
			Vector2(r.position.x, r.end.y),
			r.end,
		]
		for c in corners:
			var g: Vector2 = s.to_global(c)
			if g.y < best_y:
				best_y = g.y
				best = g
	return Vector2(best.x, best_y)


func hit_rect() -> Rect2:
	# Generous box covering summoner (left) + open circle (right) + beam + headroom for bubbles.
	return Rect2(-20, -40, DESIGN_SIZE.x + 20, DESIGN_SIZE.y + 20)


func global_hit_rect() -> Rect2:
	var r := hit_rect()
	var pos := to_global(r.position)
	var endp := to_global(r.position + r.size)
	return Rect2(pos, endp - pos)
