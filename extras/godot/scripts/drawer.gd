extends Control
## Bongo-Cat-style compact side drawer: Heroes, Gear, Eras, Drops, Settings.

signal tab_changed(tab: String)
signal request_summon
signal request_close

const TABS: Array[String] = ["heroes", "gear", "eras", "drops", "settings"]
const TAB_LABEL := {
	"heroes": "Heroes",
	"gear": "Gear",
	"eras": "Eras",
	"drops": "Drops",
	"settings": "Settings",
}
const TAB_ICON := {
	"heroes": "★",
	"gear": "⚙",
	"eras": "◉",
	"drops": "▣",
	"settings": "☰",
}

var panel: Panel
var _nav: VBoxContainer
var _pages: Dictionary = {}
var _page_host: Control
var _nav_buttons: Dictionary = {}
var drops_button: Button
var _status: Label
var _built: bool = false
var _api_key: LineEdit
var _api_model: LineEdit
var _api_url: LineEdit
var _api_persona: LineEdit
var _api_status: Label
var _provider: OptionButton
var _scale_label: Label
var _fuse_status: Label

const PROVIDERS: Array[String] = ["builtin", "xai", "openai", "anthropic", "openrouter", "custom"]
const PROVIDER_LABELS := {
	"builtin": "Built-in Only (Offline)",
	"xai": "xAI (Grok)",
	"openai": "OpenAI",
	"anthropic": "Anthropic",
	"openrouter": "OpenRouter",
	"custom": "Custom (OpenAI-Compatible)",
}


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = Vector2(430, 560)
	_build()
	GameState.inventory_changed.connect(_refresh_all)
	GameState.equipment_changed.connect(_refresh_all)
	GameState.hero_changed.connect(func(_i: String) -> void: _refresh_all())
	GameState.era_changed.connect(func(_i: String) -> void: _refresh_all())
	GameState.settings_changed.connect(_refresh_settings_only)
	GameState.scale_changed.connect(func(v: float) -> void: _update_scale_label(v))
	_refresh_all()


func is_line_focused() -> bool:
	var focus := get_viewport().gui_get_focus_owner()
	return focus is LineEdit or focus is TextEdit


func panel_rect() -> Rect2:
	return get_global_rect()


func drops_target_global() -> Vector2:
	if drops_button and is_instance_valid(drops_button):
		return drops_button.get_global_rect().get_center()
	return get_global_rect().get_center()


func open_tab(tab: String) -> void:
	if not TABS.has(tab):
		tab = "drops"
	GameState.drawer_tab = tab
	for id in _pages.keys():
		(_pages[id] as Control).visible = (id == tab)
	for id in _nav_buttons.keys():
		_style_nav(_nav_buttons[id], id == tab)
	visible = true
	tab_changed.emit(tab)
	_refresh_all()
	call_deferred("fit_page_widths")


func _build() -> void:
	panel = Panel.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	panel.add_theme_stylebox_override("panel", _sb(Color(0.10, 0.11, 0.15, 0.96), Color(0.35, 0.30, 0.22, 0.8), 14, 1))
	add_child(panel)

	var root := HBoxContainer.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 8)
	root.offset_left = 8
	root.offset_top = 8
	root.offset_right = -8
	root.offset_bottom = -8
	panel.add_child(root)

	_nav = VBoxContainer.new()
	_nav.custom_minimum_size = Vector2(72, 0)
	_nav.add_theme_constant_override("separation", 6)
	root.add_child(_nav)

	for tab in TABS:
		var b := Button.new()
		b.text = "%s\n%s" % [TAB_ICON[tab], TAB_LABEL[tab]]
		b.custom_minimum_size = Vector2(72, 64)
		b.focus_mode = Control.FOCUS_NONE
		b.pressed.connect(func() -> void: open_tab(tab))
		_style_nav(b, false)
		_nav.add_child(b)
		_nav_buttons[tab] = b
		if tab == "drops":
			drops_button = b

	_nav.add_child(Control.new())  # spacer
	var close_btn := Button.new()
	close_btn.text = "Hide"
	close_btn.focus_mode = Control.FOCUS_NONE
	close_btn.pressed.connect(func() -> void: request_close.emit())
	_style_nav(close_btn, false)
	_nav.add_child(close_btn)

	_page_host = Control.new()
	_page_host.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_page_host.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(_page_host)

	_pages["heroes"] = _make_page("heroes")
	_pages["gear"] = _make_page("gear")
	_pages["eras"] = _make_page("eras")
	_pages["drops"] = _make_page("drops")
	_pages["settings"] = _make_page("settings")
	for id in _pages.keys():
		var p: Control = _pages[id]
		p.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		_page_host.add_child(p)
		p.visible = false
	_built = true


func _make_page(id: String) -> Control:
	var sc := ScrollContainer.new()
	sc.clip_contents = true
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	sc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var box := VBoxContainer.new()
	box.name = "Box"
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_theme_constant_override("separation", 8)
	sc.add_child(box)
	# Width follow
	box.custom_minimum_size = Vector2(200, 0)
	return sc


func _box(page_id: String) -> VBoxContainer:
	return _pages[page_id].get_node("Box") as VBoxContainer


func fit_page_widths() -> void:
	for id in _pages.keys():
		var sc := _pages[id] as ScrollContainer
		if sc == null:
			continue
		var box := sc.get_node_or_null("Box") as VBoxContainer
		if box == null:
			continue
		var w := sc.size.x
		var bar := sc.get_v_scroll_bar()
		if bar and bar.visible:
			w -= bar.size.x
		box.custom_minimum_size.x = maxf(160.0, w - 6.0)
		box.size.x = box.custom_minimum_size.x


func _refresh_all() -> void:
	if not _built:
		return
	_rebuild_heroes()
	_rebuild_gear()
	_rebuild_eras()
	_rebuild_drops()
	_refresh_settings_only()
	call_deferred("fit_page_widths")


func _clear(box: VBoxContainer) -> void:
	for c in box.get_children():
		box.remove_child(c)
		c.free()


func _header(text: String) -> Label:
	var l := Label.new()
	l.text = text
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_color_override("font_color", Color(1, 0.93, 0.78, 1))
	var font := load("res://assets/ui/DejaVuSans-Bold.ttf") as FontFile
	if font:
		l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", 16)
	return l


func _body(text: String, dim: bool = true) -> Label:
	var l := Label.new()
	l.text = text
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_color_override("font_color", Color(0.85, 0.85, 0.9, 0.9) if not dim else Color(0.72, 0.72, 0.78, 0.95))
	var font := load("res://assets/ui/DejaVuSans.ttf") as FontFile
	if font:
		l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", 12)
	return l


func _rebuild_heroes() -> void:
	var box := _box("heroes")
	_clear(box)
	box.add_child(_header("Summoners"))
	box.add_child(_body("Swap who stands on your pedestal. Locked heroes will arrive in later Era drops."))
	for id in Catalog.HERO_ORDER:
		var h: Dictionary = Catalog.HEROES[id]
		var locked := not bool(h.get("unlocked", false))
		var active := GameState.hero_id == id
		var card := _card(Catalog.rarity_color("legendary") if active else Color(0.3, 0.3, 0.35, 1))
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		card.add_child(row)
		var tex := Catalog.load_texture(String(h.get("texture", "")))
		var icon := TextureRect.new()
		icon.custom_minimum_size = Vector2(64, 64)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.texture = tex
		if locked:
			icon.modulate = Color(0.4, 0.4, 0.45, 1)
		row.add_child(icon)
		var col := VBoxContainer.new()
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		col.add_child(_header(String(h["name"]) if not locked else "???  " + String(h["name"])))
		col.add_child(_body(String(h["title"]) + "  ·  " + String(h["blurb"])))
		row.add_child(col)
		var btn := Button.new()
		btn.focus_mode = Control.FOCUS_NONE
		if locked:
			btn.text = "Locked"
			btn.disabled = true
		elif active:
			btn.text = "Active"
			btn.disabled = true
		else:
			btn.text = "Swap"
			btn.pressed.connect(func() -> void:
				GameState.set_hero(id)
				Chatter.request_line("equip")
			)
		row.add_child(btn)
		box.add_child(card)


func _rebuild_gear() -> void:
	var box := _box("gear")
	_clear(box)
	var stats: Dictionary = GameState.equipped_stats()
	box.add_child(_header("Gear"))
	box.add_child(_body("ATK %d   DEF %d   SPD %d   CRIT %d   LUCK %d" % [
		int(stats["atk"]), int(stats["def"]), int(stats["spd"]), int(stats["crit"]), int(stats["luck"])
	], false))
	for slot in ["hat", "weapon", "relic"]:
		box.add_child(_header(slot.capitalize() + "s"))
		var ids: Array[String] = Catalog.items_of_slot(slot)
		var any := false
		for id in ids:
			if GameState.count_of(id) <= 0:
				continue
			any = true
			box.add_child(_item_card(id, true))
		if not any:
			box.add_child(_body("No %ss yet. Summon some — or use +10 Test Items in Settings." % slot))


func _rebuild_eras() -> void:
	var box := _box("eras")
	_clear(box)
	box.add_child(_header("Summoning Eras"))
	box.add_child(_body("Retune the circle. Colors, sparks, and drop flavor all follow the era."))
	for id in Catalog.ERA_ORDER:
		var era: Dictionary = Catalog.ERAS[id]
		var active := GameState.era_id == id
		var card := _card(era["outer"] if active else Color(0.3, 0.3, 0.35, 1))
		var row := HBoxContainer.new()
		card.add_child(row)
		var swatch := ColorRect.new()
		swatch.custom_minimum_size = Vector2(16, 48)
		swatch.color = era["outer"]
		row.add_child(swatch)
		var col := VBoxContainer.new()
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		col.add_child(_header(String(era["name"])))
		col.add_child(_body(String(era["tag"]) + "  ·  " + String(era["blurb"])))
		row.add_child(col)
		var btn := Button.new()
		btn.focus_mode = Control.FOCUS_NONE
		btn.text = "Tuned" if active else "Tune"
		btn.disabled = active
		btn.pressed.connect(func() -> void: GameState.set_era(id))
		row.add_child(btn)
		box.add_child(card)


func _rebuild_drops() -> void:
	var box := _box("drops")
	_clear(box)
	box.add_child(_header("Drops & Inventory"))
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	var test := Button.new()
	test.text = "Test Summon Now!"
	test.focus_mode = Control.FOCUS_NONE
	test.custom_minimum_size = Vector2(0, 36)
	test.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_paint_button(test, Color("#a855f7"))
	test.pressed.connect(func() -> void: request_summon.emit())
	actions.add_child(test)
	box.add_child(actions)

	var fuse_row := VBoxContainer.new()
	fuse_row.add_child(_body("10-to-1 Fuse: spend 10 items of one rarity, get 1 of the next tier."))
	var fuse_btns := HFlowContainer.new()
	fuse_btns.add_theme_constant_override("h_separation", 6)
	fuse_btns.add_theme_constant_override("v_separation", 4)
	for r in Catalog.RARITY_ORDER:
		if Catalog.next_rarity(r).is_empty():
			continue
		var fb := Button.new()
		fb.text = Catalog.RARITY_LABEL[r]
		fb.tooltip_text = "Fuse 10 %s into the next rarity  (%d / 10)" % [Catalog.RARITY_LABEL[r], GameState.rarity_count(r)]
		fb.disabled = GameState.rarity_count(r) < 10
		fb.focus_mode = Control.FOCUS_NONE
		fb.add_theme_color_override("font_color", Catalog.rarity_color(r))
		fb.pressed.connect(func() -> void: _do_fuse(r))
		fuse_btns.add_child(fb)
	fuse_row.add_child(fuse_btns)
	_fuse_status = _body("")
	fuse_row.add_child(_fuse_status)
	box.add_child(fuse_row)

	# Owned items, rarest first
	var owned: Array = GameState.inventory.keys()
	owned.sort_custom(func(a, b) -> bool:
		var ra := Catalog.rarity_index(String(Catalog.item(String(a)).get("rarity", "common")))
		var rb := Catalog.rarity_index(String(Catalog.item(String(b)).get("rarity", "common")))
		if ra != rb:
			return ra > rb
		return String(a) < String(b)
	)
	if owned.is_empty():
		box.add_child(_body("Empty pockets. Summon something, or hit Test Summon Now!"))
	else:
		for id in owned:
			box.add_child(_item_card(String(id), false))


func _do_fuse(rarity: String) -> void:
	var result: Dictionary = GameState.fuse_rarity(rarity)
	if _fuse_status:
		if bool(result.get("ok", false)):
			_fuse_status.text = "Fused into %s  ·  %s!" % [Catalog.RARITY_LABEL[String(result["rarity"])], String(result["name"])]
			_fuse_status.add_theme_color_override("font_color", Catalog.rarity_color(String(result["rarity"])))
			Chatter.request_line("summon_rare")
		else:
			_fuse_status.text = String(result.get("reason", "Couldn't fuse."))


func _item_card(id: String, equipable: bool) -> PanelContainer:
	var it: Dictionary = Catalog.item(id)
	if it.is_empty():
		var empty := _card(Color(0.3, 0.3, 0.3))
		empty.add_child(_body("Unknown item: " + id))
		return empty
	var rarity := String(it["rarity"])
	var card := _card(Catalog.rarity_color(rarity))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	card.add_child(row)
	var icon := TextureRect.new()
	icon.custom_minimum_size = Vector2(52, 52)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.texture = Catalog.load_texture(String(it["texture"]))
	row.add_child(icon)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var title := _header("%s  ×%d" % [String(it["name"]), GameState.count_of(id)])
	title.add_theme_color_override("font_color", Catalog.rarity_color(rarity))
	col.add_child(title)
	var st: Dictionary = it.get("stats", {})
	col.add_child(_body("%s  ·  %s\nATK %d  DEF %d  SPD %d  CRIT %d  LUCK %d\n%s" % [
		Catalog.RARITY_LABEL[rarity], String(it["slot"]).capitalize(),
		int(st.get("atk", 0)), int(st.get("def", 0)), int(st.get("spd", 0)),
		int(st.get("crit", 0)), int(st.get("luck", 0)),
		String(it.get("flavor", "")),
	]))
	row.add_child(col)
	if equipable and String(it["slot"]) in ["hat", "weapon", "relic"]:
		var on := String(GameState.equipped.get(String(it["slot"]), "")) == id
		var btn := Button.new()
		btn.text = "Unequip" if on else "Equip"
		btn.focus_mode = Control.FOCUS_NONE
		btn.pressed.connect(func() -> void: GameState.equip_item(id))
		row.add_child(btn)
	return card


func _refresh_settings_only() -> void:
	if not _built:
		return
	# Settings is rebuilt less aggressively so LineEdits don't lose focus / text.
	if _pages["settings"].get_node("Box").get_child_count() == 0:
		_build_settings()
	_update_scale_label(GameState.scale_value)


func _build_settings() -> void:
	var box := _box("settings")
	_clear(box)
	box.add_child(_header("Window"))
	box.add_child(_check("Always on top", GameState.flag("always_on_top"), func(on: bool) -> void:
		GameState.set_flag("always_on_top", on)
	))
	box.add_child(_check("Click-through empty space", GameState.flag("click_through"), func(on: bool) -> void:
		GameState.set_flag("click_through", on)
	))
	box.add_child(_body("When on, clicks on empty transparent pixels pass through to the apps behind this overlay. Turn off if you want to drag the window from anywhere while testing."))
	if OS.get_name() == "Windows":
		box.add_child(_check("Count clicks & keys anywhere on Windows", GameState.flag("global_input"), func(on: bool) -> void:
			GameState.set_flag("global_input", on)
		))
		box.add_child(_body("Count-only: it never records which key you pressed or any text. Turn off to use focused input only."))
	else:
		box.add_child(_body("Global desktop counting is a Windows helper. On this OS, clicks on the pedestal and keys while this window is focused will count."))

	box.add_child(_header("Scale  (also Ctrl + Mouse Wheel)"))
	var scale_row := HBoxContainer.new()
	var slider := HSlider.new()
	slider.min_value = 50
	slider.max_value = 200
	slider.step = 5
	slider.value = GameState.scale_value * 100.0
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.value_changed.connect(func(v: float) -> void: GameState.set_scale(v / 100.0))
	scale_row.add_child(slider)
	_scale_label = Label.new()
	_scale_label.custom_minimum_size = Vector2(54, 0)
	_update_scale_label(GameState.scale_value)
	scale_row.add_child(_scale_label)
	box.add_child(scale_row)

	box.add_child(_header("Testing"))
	box.add_child(_check("Demo timer (30-second drops)", GameState.flag("demo_timer"), func(on: bool) -> void:
		GameState.set_demo_timer(on)
	))
	var test_row := HBoxContainer.new()
	var plus := Button.new()
	plus.text = "+10 Test Items"
	plus.focus_mode = Control.FOCUS_NONE
	plus.pressed.connect(func() -> void: GameState.add_test_items(10))
	test_row.add_child(plus)
	var summon := Button.new()
	summon.text = "Test Summon Now!  (F8)"
	summon.focus_mode = Control.FOCUS_NONE
	summon.pressed.connect(func() -> void: request_summon.emit())
	test_row.add_child(summon)
	box.add_child(test_row)
	box.add_child(_body("Esc closes the app when a text field isn't focused. Drag the pedestal to move the window."))

	box.add_child(_header("Personality Chatter"))
	box.add_child(_check("Mute chatter", GameState.flag("mute_chatter"), func(on: bool) -> void:
		GameState.set_flag("mute_chatter", on)
	))
	box.add_child(_body("Mood"))
	var mood := OptionButton.new()
	mood.focus_mode = Control.FOCUS_NONE
	var moods := PackedStringArray(["nice", "vulgar", "mix", "sarcastic"])
	var mood_labels := PackedStringArray(["Nice", "Vulgar / Unhinged", "Mix of Both", "Sarcastic"])
	for i in moods.size():
		mood.add_item(mood_labels[i])
		if GameState.chatter_mood == moods[i]:
			mood.select(i)
	mood.item_selected.connect(func(i: int) -> void:
		GameState.chatter_mood = moods[i]
		SaveManager.write_now()
	)
	box.add_child(mood)
	box.add_child(_body("Frequency"))
	var freq := OptionButton.new()
	freq.focus_mode = Control.FOCUS_NONE
	var freqs := PackedStringArray(["off", "low", "normal", "chatty"])
	var freq_labels := PackedStringArray(["Off", "Low", "Normal", "Chatty"])
	for i in freqs.size():
		freq.add_item(freq_labels[i])
		if GameState.chatter_freq == freqs[i]:
			freq.select(i)
	freq.item_selected.connect(func(i: int) -> void:
		GameState.chatter_freq = freqs[i]
		SaveManager.write_now()
	)
	box.add_child(freq)
	var talk := Button.new()
	talk.text = "Talk Now"
	talk.focus_mode = Control.FOCUS_NONE
	talk.pressed.connect(func() -> void: Chatter.talk_now())
	box.add_child(talk)

	box.add_child(_header("BYO API Key  (optional)"))
	box.add_child(_body("Leave this on Built-in Only and the 139 hand-written lines will keep talking with zero setup. Add a key if you want live lines in the chosen mood."))
	_provider = OptionButton.new()
	_provider.focus_mode = Control.FOCUS_NONE
	for i in PROVIDERS.size():
		_provider.add_item(PROVIDER_LABELS[PROVIDERS[i]])
		if GameState.api_provider == PROVIDERS[i]:
			_provider.select(i)
	_provider.item_selected.connect(_on_provider)
	box.add_child(_provider)

	_api_model = LineEdit.new()
	_api_model.placeholder_text = "Model (e.g. grok-3-mini)"
	_api_model.text = GameState.api_model
	_api_model.text_changed.connect(func(t: String) -> void:
		GameState.api_model = t
	)
	_api_model.focus_exited.connect(func() -> void: SaveManager.write_now())
	box.add_child(_api_model)

	_api_key = LineEdit.new()
	_api_key.secret = true
	_api_key.placeholder_text = "API key (saved only on this PC)"
	_api_key.text = GameState.api_key
	_api_key.text_changed.connect(func(t: String) -> void:
		GameState.api_key = t
	)
	_api_key.focus_exited.connect(func() -> void: SaveManager.write_now())
	box.add_child(_api_key)

	_api_url = LineEdit.new()
	_api_url.placeholder_text = "Custom base URL (OpenAI-compatible)"
	_api_url.text = GameState.api_base_url
	_api_url.text_changed.connect(func(t: String) -> void:
		GameState.api_base_url = t
	)
	_api_url.focus_exited.connect(func() -> void: SaveManager.write_now())
	box.add_child(_api_url)

	_api_persona = LineEdit.new()
	_api_persona.placeholder_text = "Optional custom persona note"
	_api_persona.text = GameState.api_persona
	_api_persona.text_changed.connect(func(t: String) -> void:
		GameState.api_persona = t
	)
	_api_persona.focus_exited.connect(func() -> void: SaveManager.write_now())
	box.add_child(_api_persona)

	var api_row := HBoxContainer.new()
	var save_btn := Button.new()
	save_btn.text = "Save Key"
	save_btn.focus_mode = Control.FOCUS_NONE
	save_btn.pressed.connect(func() -> void:
		SaveManager.write_now()
		if _api_status:
			_api_status.text = "Saved on this PC."
	)
	api_row.add_child(save_btn)
	var clear_btn := Button.new()
	clear_btn.text = "Clear Key"
	clear_btn.focus_mode = Control.FOCUS_NONE
	clear_btn.pressed.connect(func() -> void:
		GameState.api_key = ""
		if _api_key:
			_api_key.text = ""
		SaveManager.write_now()
		if _api_status:
			_api_status.text = "Key cleared."
	)
	api_row.add_child(clear_btn)
	var test_btn := Button.new()
	test_btn.text = "Test Line"
	test_btn.focus_mode = Control.FOCUS_NONE
	test_btn.pressed.connect(func() -> void:
		if _api_status:
			_api_status.text = "Asking… (falls back to built-in if it fails)"
		Chatter.talk_now()
	)
	api_row.add_child(test_btn)
	box.add_child(api_row)
	_api_status = _body("Built-in lines always work, even with no key.")
	box.add_child(_api_status)

	var quit_btn := Button.new()
	quit_btn.text = "Quit OverSummoned"
	quit_btn.focus_mode = Control.FOCUS_NONE
	quit_btn.pressed.connect(func() -> void:
		SaveManager.write_now()
		get_tree().quit()
	)
	box.add_child(quit_btn)


func _on_provider(i: int) -> void:
	GameState.api_provider = PROVIDERS[i]
	if GameState.api_model.strip_edges().is_empty() or GameState.api_model in Chatter.DEFAULT_MODELS.values():
		GameState.api_model = Chatter.default_model_for(GameState.api_provider)
		if _api_model:
			_api_model.text = GameState.api_model
	SaveManager.write_now()


func _update_scale_label(v: float) -> void:
	if _scale_label:
		_scale_label.text = "%d%%" % int(round(v * 100.0))


func _check(text: String, on: bool, cb: Callable) -> CheckButton:
	var c := CheckButton.new()
	c.text = text
	c.button_pressed = on
	c.focus_mode = Control.FOCUS_NONE
	c.toggled.connect(cb)
	return c


func _card(border: Color) -> PanelContainer:
	var p := PanelContainer.new()
	p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var sb := _sb(Color(0.14, 0.15, 0.20, 0.95), border, 10, 2)
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	p.add_theme_stylebox_override("panel", sb)
	return p


func _sb(bg: Color, border: Color, radius: int, border_w: int) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.border_width_left = border_w
	sb.border_width_right = border_w
	sb.border_width_top = border_w
	sb.border_width_bottom = border_w
	sb.corner_radius_top_left = radius
	sb.corner_radius_top_right = radius
	sb.corner_radius_bottom_left = radius
	sb.corner_radius_bottom_right = radius
	return sb


func _style_nav(b: Button, active: bool) -> void:
	var bg := Color(0.28, 0.18, 0.42, 0.95) if active else Color(0.16, 0.16, 0.20, 0.9)
	var sb := _sb(bg, Color(0.85, 0.7, 0.3, 0.8) if active else Color(0.4, 0.4, 0.45, 0.6), 10, 1)
	b.add_theme_stylebox_override("normal", sb)
	b.add_theme_stylebox_override("hover", _sb(Color(0.32, 0.24, 0.46, 1), Color(0.95, 0.8, 0.4, 1), 10, 1))
	b.add_theme_stylebox_override("pressed", _sb(Color(0.36, 0.22, 0.5, 1), Color(0.95, 0.8, 0.4, 1), 10, 1))
	b.add_theme_color_override("font_color", Color(1, 0.95, 0.85, 1))
	b.add_theme_font_size_override("font_size", 11)


func _paint_button(b: Button, col: Color) -> void:
	b.add_theme_stylebox_override("normal", _sb(col, col.lightened(0.2), 8, 0))
	b.add_theme_stylebox_override("hover", _sb(col.lightened(0.1), Color.WHITE, 8, 1))
	b.add_theme_color_override("font_color", Color(1, 1, 1, 1))
	var font := load("res://assets/ui/DejaVuSans-Bold.ttf") as FontFile
	if font:
		b.add_theme_font_override("font", font)
