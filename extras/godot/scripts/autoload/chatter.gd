extends Node
## Personality lines + optional BYO API. Always works offline.

signal line_ready(text: String, kind: String)

const LINES_PATH := "res://data/chatter_lines.json"
const FREQ_WAIT := {
	"off": Vector2(0, 0),
	"low": Vector2(45, 75),
	"normal": Vector2(22, 40),
	"chatty": Vector2(10, 18),
}
const DEFAULT_MODELS := {
	"builtin": "",
	"xai": "grok-3-mini",
	"openai": "gpt-4o-mini",
	"anthropic": "claude-3-5-haiku-latest",
	"openrouter": "openai/gpt-4o-mini",
	"custom": "gpt-4o-mini",
}
const PROVIDER_URLS := {
	"xai": "https://api.x.ai/v1/chat/completions",
	"openai": "https://api.openai.com/v1/chat/completions",
	"anthropic": "https://api.anthropic.com/v1/messages",
	"openrouter": "https://openrouter.ai/api/v1/chat/completions",
}

var _lines: Dictionary = {}
var _http: HTTPRequest
var _busy: bool = false
var _idle_in: float = 8.0
var _last_kind: String = ""
var _streak_cool: float = 0.0


func _ready() -> void:
	_load_lines()
	_http = HTTPRequest.new()
	_http.timeout = 12
	add_child(_http)
	_http.request_completed.connect(_on_http)
	InputTracker.tap_registered.connect(_on_tap)
	GameState.drop_started.connect(_on_drop)
	GameState.equipment_changed.connect(func() -> void: request_line("equip"))
	GameState.era_changed.connect(func(_e: String) -> void: request_line("era"))
	_idle_in = _next_idle()
	set_process(true)


func _process(delta: float) -> void:
	if GameState.flag("mute_chatter") or GameState.chatter_freq == "off":
		return
	_streak_cool = maxf(0.0, _streak_cool - delta)
	_idle_in -= delta
	if _idle_in <= 0.0:
		var kind := "idle"
		if GameState.drop_seconds_left < 20.0 and GameState.click_charge >= Catalog.CHARGE_NEEDED * 0.5:
			kind = "warning"
		request_line(kind)
		_idle_in = _next_idle()


func _on_tap() -> void:
	if GameState.spin_energy > 0.82 and _streak_cool <= 0.0:
		_streak_cool = 10.0
		request_line("streak")


func _on_drop(item_id: String) -> void:
	var it: Dictionary = Catalog.item(item_id)
	var rarity := String(it.get("rarity", "common"))
	var kind := "summon_common"
	if rarity in ["rare", "epic"]:
		kind = "summon_rare"
	elif rarity in ["legendary", "absurd"]:
		kind = "summon_absurd"
	elif rarity == "unhinged":
		kind = "summon_unhinged"
	request_line(kind)


func _next_idle() -> float:
	var w: Vector2 = FREQ_WAIT.get(GameState.chatter_freq, FREQ_WAIT["normal"])
	if w.x <= 0.0:
		return 99999.0
	return randf_range(w.x, w.y)


func talk_now() -> void:
	request_line("idle", true)


func request_line(kind: String, force: bool = false) -> void:
	if not force and (GameState.flag("mute_chatter") or GameState.chatter_freq == "off"):
		# Event lines (drops, equip) still show even if frequency is off? 
		# Off means mute idle; force or important events still go through unless muted.
		if kind in ["idle"] and not force:
			return
		if GameState.flag("mute_chatter") and not force:
			return
	if _busy and not force:
		return
	_last_kind = kind
	if GameState.api_provider != "builtin" and not GameState.api_key.strip_edges().is_empty():
		_busy = true
		if not _kick_api(kind):
			_busy = false
			_emit_builtin(kind)
	else:
		_emit_builtin(kind)


func _mood_pool() -> String:
	var mood := GameState.chatter_mood
	if mood == "mix":
		return "nice" if randf() < 0.5 else "vulgar"
	if mood == "vulgar":
		return "vulgar"
	if mood == "sarcastic":
		return "sarcastic"
	return "nice"


func _pick(kind: String) -> String:
	var mood := _mood_pool()
	var bank: Dictionary = _lines.get(mood, {})
	var arr: Array = bank.get(kind, [])
	if arr.is_empty():
		arr = bank.get("idle", [])
	if arr.is_empty():
		# fall across moods
		for m in _lines.keys():
			var alt: Array = _lines[m].get(kind, [])
			if not alt.is_empty():
				arr = alt
				break
	if arr.is_empty():
		return "The rift coughed. I'm choosing to take that as encouragement."
	return String(arr[randi() % arr.size()])


func _emit_builtin(kind: String) -> void:
	line_ready.emit(_pick(kind), kind)


func _kick_api(kind: String) -> bool:
	var provider := GameState.api_provider
	var url := String(PROVIDER_URLS.get(provider, ""))
	if provider == "custom":
		url = GameState.api_base_url.strip_edges()
	if url.is_empty():
		return false
	var model := GameState.api_model.strip_edges()
	if model.is_empty():
		model = String(DEFAULT_MODELS.get(provider, "gpt-4o-mini"))
	var mood := GameState.chatter_mood
	var mood_instruction := _mood_instruction(mood)
	var persona := GameState.api_persona.strip_edges()
	var sys := "You are the OverSummoned apprentice (or the currently displayed summoner) standing on a desktop summoning circle. Speak in one short line, 6 to 18 words, like a real person with a specific personality. No hashtags, no emojis unless the mood is vulgar and a single one would actually land, no 'As an AI', no intro. %s" % mood_instruction
	if not persona.is_empty():
		sys += " Extra persona note from the player: " + persona
	var user := _prompt_for(kind)
	var headers := PackedStringArray()
	var body := ""
	if provider == "anthropic":
		headers.append("content-type: application/json")
		headers.append("x-api-key: " + GameState.api_key)
		headers.append("anthropic-version: 2023-06-01")
		body = JSON.stringify({
			"model": model,
			"max_tokens": 80,
			"system": sys,
			"messages": [{"role": "user", "content": user}],
		})
	else:
		headers.append("content-type: application/json")
		headers.append("Authorization: Bearer " + GameState.api_key)
		if provider == "openrouter":
			headers.append("HTTP-Referer: https://oversummoned.com")
			headers.append("X-Title: OverSummoned Desktop")
		body = JSON.stringify({
			"model": model,
			"max_tokens": 80,
			"temperature": 0.9,
			"messages": [
				{"role": "system", "content": sys},
				{"role": "user", "content": user},
			],
		})
	var err := _http.request(url, headers, HTTPClient.METHOD_POST, body)
	return err == OK


func _mood_instruction(mood: String) -> String:
	match mood:
		"nice":
			return "Mood: warm, hyped, cheering the player on, a little Bureau-official, never mean."
		"vulgar":
			return "Mood: spicy trash-talk, unhinged panic about cursed stuff crawling out of the rift, insults about slow clicking. Keep it sharp and funny, no slurs, no sexual content."
		"mix":
			return "Mood: unpredictable mix — sometimes wholesome support, sometimes a sudden feral insult. Pick one tone for this line, don't blend mid-sentence."
		"sarcastic":
			return "Mood: witty Bureau banter, dry commentary on typing speed and mid drops, never mean-spirited, always clever."
		_:
			return "Mood: playful and in-character."


func _prompt_for(kind: String) -> String:
	var era: Dictionary = Catalog.ERAS.get(GameState.era_id, {})
	var hero: Dictionary = Catalog.HEROES.get(GameState.hero_id, {})
	var bits := "Hero: %s. Era: %s. Clicks: %d. Drop in %d seconds." % [
		String(hero.get("name", "Apprentice")),
		String(era.get("name", "Bureau")),
		GameState.clicks,
		int(GameState.drop_seconds_left),
	]
	match kind:
		"streak":
			return bits + " The player is clicking or typing very fast. React in one line."
		"insult":
			return bits + " The player has been slow. Tease them in one line, matching the mood."
		"warning":
			return bits + " A summon is about to pop out of the circle. One excited or panicked line."
		"summon_common":
			return bits + " A common item just appeared. One line."
		"summon_rare":
			return bits + " A rare or epic item just appeared. One line."
		"summon_absurd":
			return bits + " An Absurd (blood-red) item just appeared. One hyped line."
		"summon_unhinged":
			return bits + " An Unhinged (hot-pink) item just appeared. One unhinged line."
		"equip":
			return bits + " The player just changed gear. One comment."
		"era":
			return bits + " The player just swapped the summoning era. One comment."
		_:
			return bits + " Idle chatter about the circle, the job, or whatever might crawl out. One line."


func _on_http(result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	_busy = false
	if result != HTTPRequest.RESULT_SUCCESS or code < 200 or code >= 300:
		_emit_builtin(_last_kind)
		return
	var parsed: Variant = JSON.parse_string(body.get_string_from_utf8())
	var text := _extract_text(parsed)
	text = text.strip_edges().trim_prefix("\"").trim_suffix("\"")
	if text.is_empty():
		_emit_builtin(_last_kind)
		return
	# Keep it to one short bubble.
	if text.length() > 140:
		text = text.substr(0, 137) + "..."
	line_ready.emit(text, _last_kind)


func _extract_text(parsed: Variant) -> String:
	if not (parsed is Dictionary):
		return ""
	var d: Dictionary = parsed
	# OpenAI / xAI / OpenRouter
	if d.has("choices"):
		var choices: Array = d["choices"]
		if not choices.is_empty() and choices[0] is Dictionary:
			var c: Dictionary = choices[0]
			var msg: Variant = c.get("message", {})
			if msg is Dictionary and msg.has("content"):
				return String(msg["content"])
			if c.has("text"):
				return String(c["text"])
	# Anthropic
	if d.has("content") and d["content"] is Array:
		var blocks: Array = d["content"]
		if not blocks.is_empty() and blocks[0] is Dictionary:
			return String(blocks[0].get("text", ""))
	return ""


func _load_lines() -> void:
	if not FileAccess.file_exists(LINES_PATH):
		return
	var f := FileAccess.open(LINES_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if parsed is Dictionary:
		_lines = parsed


func default_model_for(provider: String) -> String:
	return String(DEFAULT_MODELS.get(provider, ""))
