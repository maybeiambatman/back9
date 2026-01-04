extends Control
## Main game controller scene

@onready var hole_encounter: HoleEncounter = $HoleEncounter
@onready var card_reward_screen: Control = $CardRewardScreen
@onready var map_screen: Control = $MapScreen
@onready var run_complete_screen: Control = $RunCompleteScreen

var current_hole_data: HoleData = null


func _ready() -> void:
	_connect_signals()
	_hide_all_screens()

	# Start first hole
	_start_first_hole()


func _connect_signals() -> void:
	hole_encounter.hole_completed.connect(_on_hole_completed)
	RunManager.run_completed.connect(_on_run_completed)


func _hide_all_screens() -> void:
	card_reward_screen.visible = false
	map_screen.visible = false
	run_complete_screen.visible = false


func _start_first_hole() -> void:
	# Create a test hole
	current_hole_data = _create_test_hole(1)
	hole_encounter.visible = true
	hole_encounter.start_hole(current_hole_data)


func _create_test_hole(hole_number: int) -> HoleData:
	var hole = HoleData.new()
	hole.id = "hole_%d" % hole_number
	hole.hole_name = "Hole %d" % hole_number
	hole.hole_number = hole_number

	# Vary hole properties based on number
	match hole_number % 3:
		0:  # Par 3
			hole.par = 3
			hole.total_distance = 150 + randi() % 50
		1:  # Par 4
			hole.par = 4
			hole.total_distance = 350 + randi() % 100
		2:  # Par 5
			hole.par = 5
			hole.total_distance = 500 + randi() % 80

	# Random hazards
	hole.has_water_off_tee = randf() < 0.2
	hole.has_water_by_green = randf() < 0.3
	hole.has_greenside_bunker = randf() < 0.7
	hole.has_fairway_bunker = randf() < 0.4

	# Random wind
	var wind_directions = ["helping", "hurting", "left", "right", "calm"]
	hole.wind_direction = wind_directions[randi() % wind_directions.size()]
	hole.wind_strength = randf() * 15.0

	# Random pin
	hole.pin_position = randi() % HoleData.PinPosition.size() as HoleData.PinPosition

	# Difficulty scales with hole number
	hole.difficulty = min(5, 1 + hole_number / 2)

	return hole


func _on_hole_completed(strokes: int, par: int) -> void:
	var score = strokes - par

	# Update run manager
	RunManager.complete_hole(strokes, par)

	# Check if run ended
	if not RunManager.current_run_active:
		return

	# Show card reward if par or better
	if score <= 0:
		_show_card_reward()
	else:
		# Just show map for next hole
		_show_map_or_next_hole()


func _show_card_reward() -> void:
	hole_encounter.visible = false
	card_reward_screen.visible = true

	# Populate card reward options
	_populate_card_rewards()


func _populate_card_rewards() -> void:
	# Clear existing
	for child in card_reward_screen.get_children():
		if child.name.begins_with("RewardCard"):
			child.queue_free()

	# Get random cards
	var bonus = 0
	for trinket in RunManager.get_trinkets():
		bonus += trinket.card_reward_bonus

	var cards = CardDatabase.get_random_card_reward(3 + bonus)

	var x_start = 560
	var x_spacing = 280

	for i in range(cards.size()):
		var card_button = _create_card_reward_button(cards[i], i)
		card_button.position = Vector2(x_start + i * x_spacing, 300)
		card_reward_screen.add_child(card_button)

	# Skip button
	var skip_button = Button.new()
	skip_button.name = "SkipButton"
	skip_button.text = "Skip"
	skip_button.position = Vector2(860, 700)
	skip_button.size = Vector2(200, 50)
	skip_button.pressed.connect(_on_skip_reward)
	card_reward_screen.add_child(skip_button)


func _create_card_reward_button(card_data: CardData, index: int) -> Button:
	var button = Button.new()
	button.name = "RewardCard%d" % index
	button.size = Vector2(250, 350)

	var text = "%s\n\n%s\n\nCost: %d" % [card_data.get_display_name(), card_data.description, card_data.confidence_cost]
	if card_data.is_exhaust:
		text += "\nExhaust"
	button.text = text

	button.pressed.connect(_on_card_reward_selected.bind(card_data))

	# Color based on rarity
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.15, 0.15)
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_left = 10
	style.corner_radius_bottom_right = 10
	style.border_width_left = 3
	style.border_width_right = 3
	style.border_width_top = 3
	style.border_width_bottom = 3
	style.border_color = card_data.get_rarity_color()
	button.add_theme_stylebox_override("normal", style)

	return button


func _on_card_reward_selected(card_data: CardData) -> void:
	# Add card to deck
	RunManager.add_card_to_deck(card_data.duplicate_card())

	_close_card_reward()


func _on_skip_reward() -> void:
	_close_card_reward()


func _close_card_reward() -> void:
	# Clear reward screen
	for child in card_reward_screen.get_children():
		if child.name.begins_with("RewardCard") or child.name == "SkipButton":
			child.queue_free()

	card_reward_screen.visible = false
	_show_map_or_next_hole()


func _show_map_or_next_hole() -> void:
	# For now, just start the next hole directly
	# TODO: Implement map system
	var next_hole_num = RunManager.current_hole_index + 1
	current_hole_data = _create_test_hole(next_hole_num)
	hole_encounter.visible = true
	hole_encounter.start_hole(current_hole_data)


func _on_run_completed(won: bool, final_score: int) -> void:
	hole_encounter.visible = false
	card_reward_screen.visible = false
	map_screen.visible = false
	run_complete_screen.visible = true

	_show_run_complete(won, final_score)


func _show_run_complete(won: bool, final_score: int) -> void:
	# Clear existing content
	for child in run_complete_screen.get_children():
		if child.name != "Background":
			child.queue_free()

	# Background
	var bg = ColorRect.new()
	bg.name = "Background"
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.05, 0.08, 0.05, 0.98)
	run_complete_screen.add_child(bg)

	# Title
	var title = Label.new()
	title.position = Vector2(660, 200)
	title.size = Vector2(600, 100)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 48)

	if won:
		title.text = "VICTORY!"
		title.add_theme_color_override("font_color", Color.GOLD)
		AudioManager.play_birdie()
	else:
		title.text = "RUN OVER"
		title.add_theme_color_override("font_color", Color.INDIAN_RED)
		AudioManager.play_bogey()

	run_complete_screen.add_child(title)

	# Score
	var score_label = Label.new()
	score_label.position = Vector2(660, 320)
	score_label.size = Vector2(600, 50)
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score_label.add_theme_font_size_override("font_size", 32)

	var score_text = ""
	if final_score == 0:
		score_text = "Final Score: Even Par"
	elif final_score > 0:
		score_text = "Final Score: +%d" % final_score
	else:
		score_text = "Final Score: %d" % final_score

	score_label.text = score_text
	run_complete_screen.add_child(score_label)

	# Holes completed
	var holes_label = Label.new()
	holes_label.position = Vector2(660, 380)
	holes_label.size = Vector2(600, 40)
	holes_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	holes_label.add_theme_font_size_override("font_size", 24)
	holes_label.text = "Holes Completed: %d / 9" % RunManager.current_hole_index
	run_complete_screen.add_child(holes_label)

	# Return to menu button
	var menu_button = Button.new()
	menu_button.text = "Return to Menu"
	menu_button.position = Vector2(810, 600)
	menu_button.size = Vector2(300, 60)
	menu_button.pressed.connect(_on_return_to_menu)
	run_complete_screen.add_child(menu_button)


func _on_return_to_menu() -> void:
	GameManager.go_to_main_menu()
