extends Control
## Main menu screen

signal start_game_requested(trinket: TrinketData)

@onready var title_label: Label = $TitleLabel
@onready var new_game_button: Button = $MenuContainer/NewGameButton
@onready var continue_button: Button = $MenuContainer/ContinueButton
@onready var stats_button: Button = $MenuContainer/StatsButton
@onready var quit_button: Button = $MenuContainer/QuitButton
@onready var trinket_select: Control = $TrinketSelect
@onready var stats_panel: Panel = $StatsPanel
@onready var stats_label: Label = $StatsPanel/StatsLabel


func _ready() -> void:
	_setup_ui()
	_connect_signals()
	_update_continue_button()


func _setup_ui() -> void:
	trinket_select.visible = false
	stats_panel.visible = false


func _connect_signals() -> void:
	new_game_button.pressed.connect(_on_new_game)
	continue_button.pressed.connect(_on_continue)
	stats_button.pressed.connect(_on_stats)
	quit_button.pressed.connect(_on_quit)


func _update_continue_button() -> void:
	continue_button.disabled = not SaveManager.has_saved_run()


func _on_new_game() -> void:
	_show_trinket_select()


func _on_continue() -> void:
	# Load saved run
	var run_data = SaveManager.load_run()
	if run_data.is_empty():
		_update_continue_button()
		return

	# TODO: Restore run state and continue
	GameManager.start_new_run()


func _on_stats() -> void:
	stats_panel.visible = not stats_panel.visible
	if stats_panel.visible:
		stats_label.text = SaveManager.get_stats_text()


func _on_quit() -> void:
	get_tree().quit()


func _show_trinket_select() -> void:
	trinket_select.visible = true
	_populate_trinket_select()


func _populate_trinket_select() -> void:
	# Clear existing buttons
	for child in trinket_select.get_children():
		if child is Button:
			child.queue_free()

	var starting_trinkets = TrinketDatabase.get_starting_trinkets()
	var button_y = 100

	for trinket in starting_trinkets:
		if not SaveManager.is_trinket_unlocked(trinket.id):
			continue

		var button = Button.new()
		button.text = trinket.trinket_name + "\n" + trinket.description
		button.position = Vector2(50, button_y)
		button.size = Vector2(600, 80)
		button.pressed.connect(_on_trinket_selected.bind(trinket))
		trinket_select.add_child(button)
		button_y += 90

	# Back button
	var back_button = Button.new()
	back_button.text = "Back"
	back_button.position = Vector2(50, button_y + 20)
	back_button.size = Vector2(100, 40)
	back_button.pressed.connect(_on_trinket_back)
	trinket_select.add_child(back_button)


func _on_trinket_selected(trinket: TrinketData) -> void:
	trinket_select.visible = false
	RunManager.start_new_run(trinket)
	GameManager.start_new_run()


func _on_trinket_back() -> void:
	trinket_select.visible = false
