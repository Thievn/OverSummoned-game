extends Node
## Live run state. SaveManager writes this out; everyone else listens to signals.

signal clicks_changed(total: int)
signal charge_changed(charge: int, needed: int)
signal timer_changed(seconds_left: float, active: bool)
signal inventory_changed
signal equipment_changed
signal hero_changed(hero_id: String)
signal era_changed(era_id: String)
signal settings_changed
signal drop_started(item_id: String)
signal scale_changed(value: float)

var clicks: int = 0
var click_charge: int = 0
var drop_seconds_left: float = Catalog.DROP_SECONDS
var active_clock: float = 0.0
var since_tap: float = 999.0
var spin_energy: float = 0.0
var inventory: Dictionary = {}  # id -> count
var equipped: Dictionary = {"hat": "", "weapon": "weapon_staff", "relic": ""}
var hero_id: String = "apprentice"
var era_id: String = "bureau"
var window_pos: Vector2i = Vector2i(-1, -1)
var scale_value: float = 1.0
var drawer_open: bool = false
var drawer_tab: String = "drops"
var flags: Dictionary = {
	"always_on_top": true,
	"click_through": true,
	"global_input": true,
	"demo_timer": false,
	"mute_chatter": false,
	"sound": true,
}

# Settings (also in SaveManager cfg)
var chatter_mood: String = "mix"          # nice, vulgar, mix, sarcastic
var chatter_freq: String = "normal"       # off, low, normal, chatty
var api_provider: String = "builtin"      # builtin, xai, openai, anthropic, openrouter, custom
var api_key: String = ""
var api_model: String = ""
var api_base_url: String = ""
var api_persona: String = ""

var _summoning: bool = false
var _dirty: bool = false


func _ready() -> void:
	randomize()
	SaveManager.apply_to_state(self)
	# Starter wand so the pedestal isn't empty on first launch.
	if inventory.is_empty():
		add_item("weapon_staff", 1, false)
		equipped["weapon"] = "weapon_staff"
	if not flags.get("demo_timer", false):
		if drop_seconds_left <= 0.0:
			drop_seconds_left = Catalog.DROP_SECONDS
	set_process(true)


func _process(delta: float) -> void:
	since_tap += delta
	spin_energy = move_toward(spin_energy, 0.0, delta * 0.55)
	var active := since_tap < Catalog.ACTIVE_WINDOW
	if active and not _summoning:
		drop_seconds_left = maxf(0.0, drop_seconds_left - delta)
	timer_changed.emit(drop_seconds_left, active)
	if not _summoning and drop_seconds_left <= 0.0 and click_charge >= Catalog.CHARGE_NEEDED:
		trigger_summon(false)


func register_tap() -> void:
	clicks += 1
	click_charge = mini(click_charge + 1, Catalog.CHARGE_NEEDED)
	since_tap = 0.0
	spin_energy = minf(spin_energy + 0.22, 1.0)
	clicks_changed.emit(clicks)
	charge_changed.emit(click_charge, Catalog.CHARGE_NEEDED)
	_dirty = true


func trigger_summon(is_test: bool = true) -> void:
	if _summoning:
		return
	_summoning = true
	var item_id := Catalog.roll_drop(era_id)
	add_item(item_id, 1, false)
	if not is_test:
		click_charge = 0
		drop_seconds_left = _full_drop_time()
		charge_changed.emit(click_charge, Catalog.CHARGE_NEEDED)
	_dirty = true
	drop_started.emit(item_id)
	# Animation is responsible for calling finish_summon().


func finish_summon() -> void:
	_summoning = false
	inventory_changed.emit()
	SaveManager.write_now()


func is_summoning() -> bool:
	return _summoning


func _full_drop_time() -> float:
	return Catalog.DEMO_DROP_SECONDS if flags.get("demo_timer", false) else Catalog.DROP_SECONDS


func set_demo_timer(on: bool) -> void:
	flags["demo_timer"] = on
	drop_seconds_left = mini_float_time(drop_seconds_left, _full_drop_time())
	if drop_seconds_left <= 0.0:
		drop_seconds_left = _full_drop_time()
	settings_changed.emit()
	_dirty = true


func mini_float_time(current: float, cap: float) -> float:
	return minf(current, cap)


func add_item(id: String, amount: int = 1, notify: bool = true) -> void:
	if id.is_empty() or amount == 0:
		return
	inventory[id] = int(inventory.get(id, 0)) + amount
	if int(inventory[id]) <= 0:
		inventory.erase(id)
		for slot in equipped.keys():
			if String(equipped[slot]) == id:
				equipped[slot] = ""
				equipment_changed.emit()
	if notify:
		inventory_changed.emit()
	_dirty = true


func count_of(id: String) -> int:
	return int(inventory.get(id, 0))


func rarity_count(rarity: String) -> int:
	var total := 0
	for id in inventory.keys():
		var it: Dictionary = Catalog.item(String(id))
		if not it.is_empty() and String(it["rarity"]) == rarity:
			total += int(inventory[id])
	return total


func add_test_items(amount_each: int = 10) -> void:
	for id in Catalog.ITEMS.keys():
		add_item(String(id), amount_each, false)
	inventory_changed.emit()
	SaveManager.write_now()


func fuse_rarity(rarity: String) -> Dictionary:
	## Spend 10 items of this rarity (duplicates first) and roll one of the next rarity.
	var nxt := Catalog.next_rarity(rarity)
	if nxt.is_empty():
		return {"ok": false, "reason": "Nothing fuses higher than Unhinged. The Bureau is already crying."}
	if rarity_count(rarity) < 10:
		return {"ok": false, "reason": "Need 10 %s items to fuse." % Catalog.RARITY_LABEL[rarity]}
	var remaining := 10
	var pool: Array[String] = Catalog.items_of_rarity(rarity)
	pool.sort_custom(func(a: String, b: String) -> bool:
		return count_of(a) > count_of(b)
	)
	for id in pool:
		if remaining <= 0:
			break
		var have := count_of(id)
		if have <= 0:
			continue
		var take: int = mini(have, remaining)
		add_item(id, -take, false)
		remaining -= take
	var gained := ""
	var nxt_pool: Array[String] = Catalog.items_of_rarity(nxt)
	if nxt_pool.is_empty():
		# Shouldn't happen; refund is messy so give rune dust as a last resort.
		gained = "item_rune_dust"
	else:
		gained = nxt_pool[randi() % nxt_pool.size()]
	add_item(gained, 1, false)
	inventory_changed.emit()
	SaveManager.write_now()
	var gained_item: Dictionary = Catalog.item(gained)
	return {"ok": true, "item_id": gained, "name": String(gained_item.get("name", gained)), "rarity": nxt}


func equip_item(id: String) -> void:
	var it: Dictionary = Catalog.item(id)
	if it.is_empty():
		return
	var slot := String(it["slot"])
	if slot not in ["hat", "weapon", "relic"]:
		return
	if count_of(id) <= 0:
		return
	if String(equipped.get(slot, "")) == id:
		equipped[slot] = ""
	else:
		equipped[slot] = id
	equipment_changed.emit()
	_dirty = true
	SaveManager.write_now()


func unequip_slot(slot: String) -> void:
	if equipped.has(slot):
		equipped[slot] = ""
		equipment_changed.emit()
		_dirty = true


func set_hero(id: String) -> void:
	var h: Dictionary = Catalog.HEROES.get(id, {})
	if h.is_empty() or not bool(h.get("unlocked", false)):
		return
	hero_id = id
	hero_changed.emit(id)
	_dirty = true
	SaveManager.write_now()


func set_era(id: String) -> void:
	if not Catalog.ERAS.has(id):
		return
	era_id = id
	era_changed.emit(id)
	_dirty = true
	SaveManager.write_now()


func set_scale(value: float) -> void:
	scale_value = clampf(value, 0.5, 2.0)
	scale_changed.emit(scale_value)
	_dirty = true


func set_flag(key: String, value: bool) -> void:
	flags[key] = value
	settings_changed.emit()
	_dirty = true
	SaveManager.write_now()


func flag(key: String) -> bool:
	return bool(flags.get(key, false))


func equipped_stats() -> Dictionary:
	return Catalog.stat_total([equipped.get("hat", ""), equipped.get("weapon", ""), equipped.get("relic", "")])


func to_save() -> Dictionary:
	return {
		"clicks": clicks,
		"click_charge": click_charge,
		"drop_seconds_left": drop_seconds_left,
		"inventory": inventory,
		"equipped": equipped,
		"hero_id": hero_id,
		"era_id": era_id,
		"window_pos": {"x": window_pos.x, "y": window_pos.y},
		"scale_value": scale_value,
		"flags": flags,
		"chatter_mood": chatter_mood,
		"chatter_freq": chatter_freq,
	}


func from_save(data: Dictionary) -> void:
	clicks = int(data.get("clicks", 0))
	click_charge = int(data.get("click_charge", 0))
	drop_seconds_left = float(data.get("drop_seconds_left", Catalog.DROP_SECONDS))
	inventory = {}
	var inv: Dictionary = data.get("inventory", {})
	for k in inv.keys():
		inventory[String(k)] = int(inv[k])
	var eq: Dictionary = data.get("equipped", {})
	for slot in ["hat", "weapon", "relic"]:
		equipped[slot] = String(eq.get(slot, equipped.get(slot, "")))
	hero_id = String(data.get("hero_id", "apprentice"))
	era_id = String(data.get("era_id", "bureau"))
	var wp: Dictionary = data.get("window_pos", {})
	window_pos = Vector2i(int(wp.get("x", -1)), int(wp.get("y", -1)))
	scale_value = clampf(float(data.get("scale_value", 1.0)), 0.5, 2.0)
	var f: Dictionary = data.get("flags", {})
	for k in f.keys():
		flags[String(k)] = bool(f[k])
	chatter_mood = String(data.get("chatter_mood", chatter_mood))
	chatter_freq = String(data.get("chatter_freq", chatter_freq))
