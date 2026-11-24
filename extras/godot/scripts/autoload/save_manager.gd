extends Node
## Persists play data to user://save_data.json and settings (including API key) to user://oversummoned_settings.cfg.

const SAVE_PATH := "user://save_data.json"
const SETTINGS_PATH := "user://oversummoned_settings.cfg"

var _timer: Timer


func _ready() -> void:
	_timer = Timer.new()
	_timer.wait_time = 4.0
	_timer.one_shot = false
	_timer.timeout.connect(write_now)
	add_child(_timer)
	_timer.start()


func apply_to_state(state: Node) -> void:
	var data := _read_json(SAVE_PATH)
	if not data.is_empty() and state.has_method("from_save"):
		state.from_save(data)
	var cfg := ConfigFile.new()
	if cfg.load(SETTINGS_PATH) != OK:
		return
	state.chatter_mood = String(cfg.get_value("chatter", "mood", state.chatter_mood))
	state.chatter_freq = String(cfg.get_value("chatter", "freq", state.chatter_freq))
	state.api_provider = String(cfg.get_value("api", "provider", state.api_provider))
	state.api_key = String(cfg.get_value("api", "key", state.api_key))
	state.api_model = String(cfg.get_value("api", "model", state.api_model))
	state.api_base_url = String(cfg.get_value("api", "base_url", state.api_base_url))
	state.api_persona = String(cfg.get_value("api", "persona", state.api_persona))
	if cfg.has_section_key("window", "x"):
		state.window_pos = Vector2i(int(cfg.get_value("window", "x", -1)), int(cfg.get_value("window", "y", -1)))
	if cfg.has_section_key("window", "scale"):
		state.scale_value = clampf(float(cfg.get_value("window", "scale", 1.0)), 0.5, 2.0)


func write_now() -> void:
	if not has_node("/root/GameState"):
		return
	var state := get_node("/root/GameState")
	var payload := JSON.stringify(state.to_save(), "\t")
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(payload)
		f.close()
	var cfg := ConfigFile.new()
	cfg.set_value("chatter", "mood", state.chatter_mood)
	cfg.set_value("chatter", "freq", state.chatter_freq)
	cfg.set_value("api", "provider", state.api_provider)
	cfg.set_value("api", "key", state.api_key)
	cfg.set_value("api", "model", state.api_model)
	cfg.set_value("api", "base_url", state.api_base_url)
	cfg.set_value("api", "persona", state.api_persona)
	cfg.set_value("window", "x", state.window_pos.x)
	cfg.set_value("window", "y", state.window_pos.y)
	cfg.set_value("window", "scale", state.scale_value)
	cfg.save(SETTINGS_PATH)


func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return {}
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if parsed is Dictionary:
		return parsed
	return {}
