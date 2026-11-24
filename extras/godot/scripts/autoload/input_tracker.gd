extends Node
## Counts clicks and key-downs. On Windows, a count-only helper watches the whole
## desktop (no key identities, no text). Everywhere else — and if that helper
## can't start — we fall back to focused Godot input plus clicks on the pedestal.

signal tap_registered

const POLL := 0.05

var _budget: float = Catalog.MAX_TAPS_PER_SEC
var _pid: int = -1
var _count_path: String = ""
var _last_count: int = 0
var _helper_alive: bool = false
var _helper_seen: float = 0.0
var _poll_acc: float = 0.0
var _use_local: bool = true


func _ready() -> void:
	_count_path = OS.get_user_data_dir().path_join("oversummoned_input_count.txt")
	GameState.settings_changed.connect(_on_settings)
	_on_settings()
	set_process(true)


func _process(delta: float) -> void:
	_budget = minf(Catalog.MAX_TAPS_PER_SEC, _budget + delta * Catalog.MAX_TAPS_PER_SEC)
	if not _helper_alive:
		return
	_poll_acc += delta
	if _poll_acc < POLL:
		return
	_poll_acc = 0.0
	_poll_helper()


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_EXIT_TREE:
		_stop_helper()


func _on_settings() -> void:
	var want := OS.get_name() == "Windows" and GameState.flag("global_input")
	if want and not _helper_alive:
		_start_helper()
	elif (not want) and _helper_alive:
		_stop_helper()
	_use_local = not _helper_alive


func is_using_global() -> bool:
	return _helper_alive


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F8:
		GameState.trigger_summon(true)
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.pressed:
		if event.ctrl_pressed and (event.button_index == MOUSE_BUTTON_WHEEL_UP or event.button_index == MOUSE_BUTTON_WHEEL_DOWN):
			var step := 0.1 if event.button_index == MOUSE_BUTTON_WHEEL_UP else -0.1
			GameState.set_scale(GameState.scale_value + step)
			get_viewport().set_input_as_handled()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F8 or event.keycode == KEY_ESCAPE:
			return
		if _use_local:
			register_tap()


func register_local_click() -> void:
	## Pedestal clicks always count, even when the Windows helper is also running
	## (the helper will also see that click — we accept a tiny chance of +1 extra
	## rather than skip local feedback on Linux/this box).
	if _helper_alive:
		return
	register_tap()


func register_tap() -> void:
	if _budget < 1.0:
		return
	_budget -= 1.0
	GameState.register_tap()
	tap_registered.emit()


func _start_helper() -> void:
	if OS.get_name() != "Windows":
		_helper_alive = false
		_use_local = true
		return
	var script := ProjectSettings.globalize_path("res://tools/windows_input_counter.ps1")
	if not FileAccess.file_exists(script):
		push_warning("OverSummoned: Windows input helper script missing; using focused input.")
		_helper_alive = false
		_use_local = true
		return
	_stop_helper()
	# Reset the count file so we only see deltas from this session.
	var rf := FileAccess.open(_count_path, FileAccess.WRITE)
	if rf:
		rf.store_string("0 0")
		rf.close()
	_last_count = 0
	var args := PackedStringArray([
		"-NoProfile",
		"-WindowStyle", "Hidden",
		"-ExecutionPolicy", "Bypass",
		"-File", script,
		_count_path,
	])
	_pid = OS.create_process("powershell.exe", args, false)
	if _pid <= 0:
		push_warning("OverSummoned: could not start Windows input helper; using focused input.")
		_helper_alive = false
		_use_local = true
		return
	_helper_alive = true
	_use_local = false
	_helper_seen = Time.get_ticks_msec() / 1000.0


func _stop_helper() -> void:
	if _pid > 0:
		OS.kill(_pid)
	_pid = -1
	_helper_alive = false
	_use_local = true


func _poll_helper() -> void:
	if not FileAccess.file_exists(_count_path):
		_maybe_timeout()
		return
	var f := FileAccess.open(_count_path, FileAccess.READ)
	if f == null:
		_maybe_timeout()
		return
	var text := f.get_as_text().strip_edges()
	f.close()
	if text.is_empty():
		_maybe_timeout()
		return
	var parts := text.split(" ")
	var count := int(parts[0])
	_helper_seen = Time.get_ticks_msec() / 1000.0
	if count > _last_count:
		var delta: int = mini(count - _last_count, 8)
		_last_count = count
		for _i in delta:
			register_tap()
	elif count < _last_count:
		_last_count = count


func _maybe_timeout() -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if now - _helper_seen > 3.0:
		# Helper went silent — fall back without crashing.
		_stop_helper()
