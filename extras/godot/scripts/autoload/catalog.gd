extends Node
## Static game data: rarities, eras, heroes, items, sockets, drop weights.

const RARITY_ORDER: Array[String] = [
	"common", "uncommon", "rare", "epic", "legendary", "absurd", "unhinged"
]

const RARITY_COLOR := {
	"common": Color("#9ca3af"),
	"uncommon": Color("#22c55e"),
	"rare": Color("#3b82f6"),
	"epic": Color("#a855f7"),
	"legendary": Color("#f59e0b"),
	"absurd": Color("#dc2626"),
	"unhinged": Color("#ff2e93"),
}

const RARITY_LABEL := {
	"common": "Common",
	"uncommon": "Uncommon",
	"rare": "Rare",
	"epic": "Epic",
	"legendary": "Legendary",
	"absurd": "Absurd",
	"unhinged": "Unhinged",
}

## Era tint for rune modulate / particles (amber-magenta default, then era palettes).
const ERAS := {
	"bureau": {
		"id": "bureau",
		"name": "Aldermere Bureau",
		"tag": "Default",
		"outer": Color("#ffc45c"),
		"inner": Color("#ff4fd8"),
		"glow": Color("#ffd28a"),
		"particle": Color("#ffe08a"),
		"blurb": "Official Bureau issue. The paperwork is cursed, but at least it's filed.",
	},
	"stone": {
		"id": "stone",
		"name": "Stone Age",
		"tag": "Ember",
		"outer": Color("#ff7a3a"),
		"inner": Color("#ff3b1a"),
		"glow": Color("#ffb070"),
		"particle": Color("#ff8a40"),
		"blurb": "Fire-pit summoning. Very few safety runes. A surprising amount of mammoth.",
	},
	"pirate": {
		"id": "pirate",
		"name": "Pirate Cove",
		"tag": "Teal",
		"outer": Color("#2ee0c0"),
		"inner": Color("#1f8a8a"),
		"glow": Color("#7cffdf"),
		"particle": Color("#5eead4"),
		"blurb": "Salt, shot, and a circle scratched into the dock with a cutlass.",
	},
	"neon": {
		"id": "neon",
		"name": "Neon Ruins",
		"tag": "Cyan",
		"outer": Color("#22d3ee"),
		"inner": Color("#818cf8"),
		"glow": Color("#67e8f9"),
		"particle": Color("#22d3ee"),
		"blurb": "The future filed a complaint. We summoned it anyway.",
	},
	"glitch": {
		"id": "glitch",
		"name": "Unstable Glitch",
		"tag": "Violet",
		"outer": Color("#c084fc"),
		"inner": Color("#f0abfc"),
		"glow": Color("#e9d5ff"),
		"particle": Color("#d946ef"),
		"blurb": "Do not look directly at the runes. They will look back, and also sideways.",
	},
}

const ERA_ORDER: Array[String] = ["bureau", "stone", "pirate", "neon", "glitch"]

## Socket positions in the 1024×1024 hero canvas, per pose.
## All poses plant feet at ~ (430, 986) so the character stays grounded when poses swap.
const FEET := Vector2(430, 986)

const SOCKETS := {
	"apprentice": {
		"idle": {"hat": Vector2(559, 205), "weapon": Vector2(798, 452), "relic": Vector2(400, 370), "feet": Vector2(430, 986)},
		"cast": {"hat": Vector2(544, 245), "weapon": Vector2(816, 431), "relic": Vector2(360, 410), "feet": Vector2(222.5, 986)},
		"celebrate": {"hat": Vector2(354, 200), "weapon": Vector2(604, 462), "relic": Vector2(200, 360), "feet": Vector2(463.5, 986)},
	},
	"cyber_knight": {
		"idle": {"hat": Vector2(538, 148), "weapon": Vector2(802, 452), "relic": Vector2(385, 315), "feet": Vector2(429.5, 986)},
		"cast": {"hat": Vector2(710, 188), "weapon": Vector2(907, 489), "relic": Vector2(530, 365), "feet": Vector2(430, 986)},
		"celebrate": {"hat": Vector2(538, 148), "weapon": Vector2(802, 452), "relic": Vector2(385, 315), "feet": Vector2(429.5, 986)},
	},
}

## Weapon tip offset from the 1024×1024 gear canvas center (grip). Y-down, up-right is negative Y.
const WEAPON_TIPS := {
	"weapon_neon_blade": Vector2(460.1, -457.3),
	"weapon_club": Vector2(350.8, -313.8),
	"weapon_staff": Vector2(308.4, -294.2),
}

## How large the gear should appear on the 1024 hero canvas (pixels).
const VIEW_PX := {
	"hat_pirate": 200.0,
	"hat_visor": 190.0,
	"hat_crown": 200.0,
	"weapon_neon_blade": 430.0,
	"weapon_club": 420.0,
	"weapon_staff": 410.0,
	"relic_rift_crystal": 100.0,
	"relic_ledger": 110.0,
	"relic_lantern": 110.0,
}

## Pedestal geometry in the 1024 canvas, sprite-centered at (512, 512).
const PED_BOTTOM_FROM_CENTER := 244.0
const PED_DISC_FROM_CENTER := -185.0

const HEROES := {
	"apprentice": {
		"id": "apprentice",
		"name": "Apprentice Summoner",
		"title": "OverSummoned Bureau",
		"unlocked": true,
		"texture": "res://assets/heroes/apprentice_idle.png",
		"cast": "res://assets/heroes/apprentice_cast.png",
		"celebrate": "res://assets/heroes/apprentice_celebrate.png",
		"blurb": "Cheeky, official, and only slightly on fire. Your starter summoner.",
	},
	"cyber_knight": {
		"id": "cyber_knight",
		"name": "Cyber-Knight",
		"title": "Neon Ruins",
		"unlocked": true,
		"texture": "res://assets/heroes/cyber_knight_idle.png",
		"cast": "res://assets/heroes/cyber_knight_cast.png",
		"celebrate": "res://assets/heroes/cyber_knight_idle.png",
		"blurb": "A time-lost knight running an illegal firmware patch called 'honor'.",
	},
	"caveman": {
		"id": "caveman",
		"name": "Cave Caller",
		"title": "Stone Age",
		"unlocked": false,
		"texture": "",
		"react": "",
		"blurb": "Coming soon. Invented fire, then tried to summon a bigger fire.",
	},
	"corsair": {
		"id": "corsair",
		"name": "Rift Corsair",
		"title": "Pirate Cove",
		"unlocked": false,
		"texture": "",
		"react": "",
		"blurb": "Coming soon. Keeps trying to make the rift walk the plank.",
	},
	"wraith": {
		"id": "wraith",
		"name": "Victorian Wraith",
		"title": "Aldermere After-Hours",
		"unlocked": false,
		"texture": "",
		"react": "",
		"blurb": "Coming soon. Polite, dead, and extremely disappointed in your typo rate.",
	},
}

const HERO_ORDER: Array[String] = ["apprentice", "cyber_knight", "caveman", "corsair", "wraith"]

## visual_scale is relative to the hero sprite scale (see SummoningStage).
var ITEMS: Dictionary = {}

const DROP_WEIGHTS := {
	"common": 40,
	"uncommon": 25,
	"rare": 16,
	"epic": 10,
	"legendary": 5,
	"absurd": 3,
	"unhinged": 1,
}

const CHARGE_NEEDED := 80
const DROP_SECONDS := 1800.0
const DEMO_DROP_SECONDS := 30.0
const MAX_TAPS_PER_SEC := 20.0
const ACTIVE_WINDOW := 60.0


func _ready() -> void:
	_build_items()


func _build_items() -> void:
	ITEMS = {
		"weapon_staff": _item("weapon_staff", "Apprentice Wand", "weapon", "common",
			"res://assets/gear/weapon_staff.png", "bureau",
			{"atk": 4, "def": 1, "spd": 2, "crit": 1, "luck": 2}, 0.78,
			"Standard Bureau issue. Still bites if you hold it wrong."),
		"item_rune_dust": _item("item_rune_dust", "Rune Dust", "material", "common",
			"res://assets/gear/item_rune_dust.png", "bureau",
			{"atk": 0, "def": 0, "spd": 0, "crit": 0, "luck": 1}, 0.42,
			"Sweepings from the circle. Officially 'residual miracle.'"),
		"item_sigil_coin": _item("item_sigil_coin", "Sigil Coin", "material", "uncommon",
			"res://assets/gear/item_sigil_coin.png", "bureau",
			{"atk": 0, "def": 1, "spd": 0, "crit": 0, "luck": 3}, 0.40,
			"A coin that lands on its edge more often than it should."),
		"item_ember_shard": _item("item_ember_shard", "Ember Shard", "material", "uncommon",
			"res://assets/gear/item_ember_shard.png", "stone",
			{"atk": 3, "def": 0, "spd": 1, "crit": 2, "luck": 0}, 0.42,
			"Still warm. The Stone Age does not believe in oven mitts."),
		"item_tide_charm": _item("item_tide_charm", "Tide Charm", "material", "uncommon",
			"res://assets/gear/item_tide_charm.png", "pirate",
			{"atk": 1, "def": 2, "spd": 3, "crit": 0, "luck": 2}, 0.42,
			"Smells like a dock at midnight. In a good way. Mostly."),
		"hat_visor": _item("hat_visor", "Cyber Visor", "hat", "rare",
			"res://assets/gear/hat_visor.png", "neon",
			{"atk": 2, "def": 3, "spd": 4, "crit": 3, "luck": 1}, 0.70,
			"Heads-up display, sarcastic commentary, 12% more swagger."),
		"relic_lantern": _item("relic_lantern", "Victorian Lantern", "relic", "rare",
			"res://assets/gear/relic_lantern.png", "bureau",
			{"atk": 1, "def": 4, "spd": 1, "crit": 1, "luck": 4}, 0.40,
			"Lights the way, and also the things that should not be lit."),
		"hat_crown": _item("hat_crown", "Iron Rune Crown", "hat", "epic",
			"res://assets/gear/hat_crown.png", "bureau",
			{"atk": 3, "def": 5, "spd": 1, "crit": 2, "luck": 3}, 0.72,
			"Heavy, official, and slightly humming in C-sharp."),
		"weapon_neon_blade": _item("weapon_neon_blade", "Neon Blade", "weapon", "epic",
			"res://assets/gear/weapon_neon_blade.png", "neon",
			{"atk": 8, "def": 1, "spd": 5, "crit": 5, "luck": 1}, 0.85,
			"Folds spacetime into a very fashionable edge."),
		"weapon_club": _item("weapon_club", "Spiked Caveman Club", "weapon", "legendary",
			"res://assets/gear/weapon_club.png", "stone",
			{"atk": 11, "def": 3, "spd": 1, "crit": 4, "luck": 2}, 0.82,
			"Diplomacy, if diplomacy is a rock with smaller rocks on it."),
		"item_clockwork_core": _item("item_clockwork_core", "Clockwork Core", "material", "legendary",
			"res://assets/gear/item_clockwork_core.png", "bureau",
			{"atk": 2, "def": 4, "spd": 6, "crit": 3, "luck": 3}, 0.44,
			"Ticks backwards on Tuesdays. That's how you know it's working."),
		"hat_pirate": _item("hat_pirate", "Pirate Tricorne", "hat", "absurd",
			"res://assets/gear/hat_pirate.png", "pirate",
			{"atk": 5, "def": 3, "spd": 4, "crit": 4, "luck": 8}, 0.74,
			"The Bureau filed it under 'unauthorized swagger.' It stayed on anyway."),
		"relic_ledger": _item("relic_ledger", "Cursed Ledger", "relic", "absurd",
			"res://assets/gear/relic_ledger.png", "bureau",
			{"atk": 2, "def": 6, "spd": 2, "crit": 2, "luck": 9}, 0.46,
			"Writes your name before you introduce yourself. Then underlines it."),
		"relic_rift_crystal": _item("relic_rift_crystal", "Rift Crystal", "relic", "unhinged",
			"res://assets/gear/relic_rift_crystal.png", "glitch",
			{"atk": 7, "def": 4, "spd": 6, "crit": 7, "luck": 10}, 0.40,
			"Do not lick it. Do not ask how we know."),
	}


func _item(id: String, item_name: String, slot: String, rarity: String, texture: String, era: String, stats: Dictionary, visual_scale: float, flavor: String) -> Dictionary:
	return {
		"id": id,
		"name": item_name,
		"slot": slot,
		"rarity": rarity,
		"texture": texture,
		"era": era,
		"stats": stats,
		"visual_scale": visual_scale,
		"flavor": flavor,
	}


func item(id: String) -> Dictionary:
	return ITEMS.get(id, {})


func rarity_color(rarity: String) -> Color:
	return RARITY_COLOR.get(rarity, Color.WHITE)


func rarity_index(rarity: String) -> int:
	return RARITY_ORDER.find(rarity)


func next_rarity(rarity: String) -> String:
	var i := rarity_index(rarity)
	if i < 0 or i >= RARITY_ORDER.size() - 1:
		return ""
	return RARITY_ORDER[i + 1]


func items_of_rarity(rarity: String) -> Array[String]:
	var out: Array[String] = []
	for id in ITEMS.keys():
		if String(ITEMS[id]["rarity"]) == rarity:
			out.append(String(id))
	return out


func items_of_slot(slot: String) -> Array[String]:
	var out: Array[String] = []
	for id in ITEMS.keys():
		if String(ITEMS[id]["slot"]) == slot:
			out.append(String(id))
	return out


func roll_drop(era_id: String) -> String:
	var rarity := _roll_rarity()
	var pool: Array[String] = items_of_rarity(rarity)
	if pool.is_empty():
		pool = items_of_rarity("common")
	# Era-flavored reroll: 40% chance to pick an era-matching item of that rarity if one exists.
	var era_pool: Array[String] = []
	for id in pool:
		if String(ITEMS[id]["era"]) == era_id:
			era_pool.append(id)
	if not era_pool.is_empty() and randf() < 0.4:
		return era_pool[randi() % era_pool.size()]
	return pool[randi() % pool.size()]


func _roll_rarity() -> String:
	var total := 0
	for r in RARITY_ORDER:
		total += int(DROP_WEIGHTS[r])
	var roll := randi() % maxi(1, total)
	var acc := 0
	for r in RARITY_ORDER:
		acc += int(DROP_WEIGHTS[r])
		if roll < acc:
			return r
	return "common"


func stat_total(ids: Array) -> Dictionary:
	var tot := {"atk": 0, "def": 0, "spd": 0, "crit": 0, "luck": 0}
	for id in ids:
		var it: Dictionary = item(String(id))
		if it.is_empty():
			continue
		var st: Dictionary = it.get("stats", {})
		for k in tot.keys():
			tot[k] = int(tot[k]) + int(st.get(k, 0))
	return tot


func load_texture(path: String) -> Texture2D:
	if path.is_empty() or not ResourceLoader.exists(path):
		return null
	return load(path) as Texture2D


func pose_sockets(hero_id: String, pose: String) -> Dictionary:
	var pack: Dictionary = SOCKETS.get(hero_id, SOCKETS["apprentice"])
	if pack.has(pose):
		return pack[pose]
	return pack.get("idle", {})


func hero_texture_path(hero_id: String, pose: String) -> String:
	var h: Dictionary = HEROES.get(hero_id, {})
	var path := String(h.get(pose, ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		path = String(h.get("texture", "res://assets/heroes/apprentice_idle.png"))
	return path


func weapon_tip(id: String) -> Vector2:
	return WEAPON_TIPS.get(id, Vector2(300, -300))


func view_px(id: String, fallback: float = 200.0) -> float:
	return float(VIEW_PX.get(id, fallback))
