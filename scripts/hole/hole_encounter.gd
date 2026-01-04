extends Control
class_name HoleEncounter
## Main gameplay scene for playing a hole

signal hole_completed(strokes: int, par: int)
signal phase_completed(result: ShotResolver.ShotResult)

@export var hole_data: HoleData

var current_phase: ShotResolver.Phase = ShotResolver.Phase.TEE
var strokes_taken: int = 0
var distance_remaining: float = 0.0
var current_lie: String = "tee"
var on_green: bool = false
var putt_distance: float = 0.0

# Hidden info (revealed by Read cards)
var wind_revealed: bool = false
var break_revealed: bool = false
var lie_revealed: bool = false
var distance_revealed: bool = false

# Status effects
var player_statuses: Array[String] = []
var safe_play_stacks: int = 0
var prevents_disaster: bool = false
var max_bogey_active: bool = false

# Confidence
var confidence: int = 3
var max_confidence: int = 3

# Cards played this phase
var played_cards_this_phase: Array[CardData] = []

# UI References
@onready var card_hand: CardHand = $CardHand
@onready var hud_panel: Panel = $HUD
@onready var hole_info_label: Label = $HUD/HoleInfo
@onready var phase_label: Label = $HUD/PhaseLabel
@onready var distance_label: Label = $HUD/DistanceLabel
@onready var confidence_label: Label = $HUD/ConfidenceLabel
@onready var status_label: Label = $HUD/StatusLabel
@onready var strokes_label: Label = $HUD/StrokesLabel
@onready var score_label: Label = $HUD/ScoreLabel
@onready var wind_label: Label = $HUD/WindLabel
@onready var lie_label: Label = $HUD/LieLabel
@onready var end_phase_button: Button = $EndPhaseButton
@onready var played_cards_container: HBoxContainer = $PlayedCards
@onready var result_popup: Panel = $ResultPopup
@onready var result_label: Label = $ResultPopup/ResultLabel

# Hole layout display
var hole_layout_label: Label = null


func _ready() -> void:
	end_phase_button.pressed.connect(_on_end_phase)
	card_hand.card_selected.connect(_on_card_selected)
	card_hand.card_deselected.connect(_on_card_deselected)
	card_hand.card_play_requested.connect(_on_card_play_requested)

	result_popup.visible = false

	# Create basic UI if not in scene
	_ensure_ui_exists()


func _ensure_ui_exists() -> void:
	## Create UI elements programmatically if they don't exist
	if hud_panel == null:
		_create_ui()

	# Always create hole layout if it doesn't exist
	if hole_layout_label == null:
		_create_hole_layout_display()


func _create_ui() -> void:
	## Create the UI structure
	# HUD Panel
	hud_panel = Panel.new()
	hud_panel.name = "HUD"
	hud_panel.position = Vector2(20, 20)
	hud_panel.size = Vector2(400, 300)
	add_child(hud_panel)

	var hud_style = StyleBoxFlat.new()
	hud_style.bg_color = Color(0.1, 0.1, 0.1, 0.9)
	hud_style.corner_radius_top_left = 10
	hud_style.corner_radius_top_right = 10
	hud_style.corner_radius_bottom_left = 10
	hud_style.corner_radius_bottom_right = 10
	hud_panel.add_theme_stylebox_override("panel", hud_style)

	# Hole info
	hole_info_label = Label.new()
	hole_info_label.name = "HoleInfo"
	hole_info_label.position = Vector2(10, 10)
	hole_info_label.size = Vector2(380, 30)
	hole_info_label.add_theme_font_size_override("font_size", 20)
	hud_panel.add_child(hole_info_label)

	# Phase label
	phase_label = Label.new()
	phase_label.name = "PhaseLabel"
	phase_label.position = Vector2(10, 45)
	phase_label.size = Vector2(380, 25)
	phase_label.add_theme_font_size_override("font_size", 16)
	hud_panel.add_child(phase_label)

	# Distance label
	distance_label = Label.new()
	distance_label.name = "DistanceLabel"
	distance_label.position = Vector2(10, 75)
	distance_label.size = Vector2(380, 25)
	distance_label.add_theme_font_size_override("font_size", 16)
	hud_panel.add_child(distance_label)

	# Wind label
	wind_label = Label.new()
	wind_label.name = "WindLabel"
	wind_label.position = Vector2(10, 105)
	wind_label.size = Vector2(380, 25)
	wind_label.add_theme_font_size_override("font_size", 14)
	hud_panel.add_child(wind_label)

	# Lie label
	lie_label = Label.new()
	lie_label.name = "LieLabel"
	lie_label.position = Vector2(10, 130)
	lie_label.size = Vector2(380, 25)
	lie_label.add_theme_font_size_override("font_size", 14)
	hud_panel.add_child(lie_label)

	# Confidence label
	confidence_label = Label.new()
	confidence_label.name = "ConfidenceLabel"
	confidence_label.position = Vector2(10, 165)
	confidence_label.size = Vector2(380, 25)
	confidence_label.add_theme_font_size_override("font_size", 16)
	confidence_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.2))
	hud_panel.add_child(confidence_label)

	# Strokes label
	strokes_label = Label.new()
	strokes_label.name = "StrokesLabel"
	strokes_label.position = Vector2(10, 195)
	strokes_label.size = Vector2(380, 25)
	strokes_label.add_theme_font_size_override("font_size", 14)
	hud_panel.add_child(strokes_label)

	# Status label
	status_label = Label.new()
	status_label.name = "StatusLabel"
	status_label.position = Vector2(10, 225)
	status_label.size = Vector2(380, 50)
	status_label.add_theme_font_size_override("font_size", 12)
	status_label.add_theme_color_override("font_color", Color(0.7, 0.9, 0.7))
	hud_panel.add_child(status_label)

	# Score label (top right)
	score_label = Label.new()
	score_label.name = "ScoreLabel"
	score_label.position = Vector2(get_viewport_rect().size.x - 200, 20)
	score_label.size = Vector2(180, 40)
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	score_label.add_theme_font_size_override("font_size", 24)
	add_child(score_label)

	# End Phase button
	end_phase_button = Button.new()
	end_phase_button.name = "EndPhaseButton"
	end_phase_button.text = "END PHASE"
	end_phase_button.position = Vector2(get_viewport_rect().size.x - 200, get_viewport_rect().size.y - 150)
	end_phase_button.size = Vector2(180, 50)
	end_phase_button.pressed.connect(_on_end_phase)
	add_child(end_phase_button)

	# Played cards container
	played_cards_container = HBoxContainer.new()
	played_cards_container.name = "PlayedCards"
	played_cards_container.position = Vector2(440, 100)
	played_cards_container.size = Vector2(600, 100)
	add_child(played_cards_container)

	# Result popup
	result_popup = Panel.new()
	result_popup.name = "ResultPopup"
	result_popup.size = Vector2(400, 150)
	result_popup.position = (get_viewport_rect().size - result_popup.size) / 2
	result_popup.visible = false
	add_child(result_popup)

	var popup_style = StyleBoxFlat.new()
	popup_style.bg_color = Color(0.1, 0.1, 0.15, 0.95)
	popup_style.corner_radius_top_left = 15
	popup_style.corner_radius_top_right = 15
	popup_style.corner_radius_bottom_left = 15
	popup_style.corner_radius_bottom_right = 15
	popup_style.border_width_left = 3
	popup_style.border_width_right = 3
	popup_style.border_width_top = 3
	popup_style.border_width_bottom = 3
	popup_style.border_color = Color.WHITE
	result_popup.add_theme_stylebox_override("panel", popup_style)

	result_label = Label.new()
	result_label.name = "ResultLabel"
	result_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	result_label.add_theme_font_size_override("font_size", 24)
	result_popup.add_child(result_label)

	# Card hand (at bottom)
	if card_hand == null:
		card_hand = preload("res://scenes/cards/card_hand.tscn").instantiate()
		card_hand.name = "CardHand"
		add_child(card_hand)
		card_hand.card_selected.connect(_on_card_selected)
		card_hand.card_deselected.connect(_on_card_deselected)


func _create_hole_layout_display() -> void:
	## Create the ASCII hole layout display
	var layout_panel = Panel.new()
	layout_panel.name = "HoleLayoutPanel"
	layout_panel.position = Vector2(450, 20)
	layout_panel.size = Vector2(500, 420)
	add_child(layout_panel)

	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.05, 0.08, 0.05, 0.95)
	panel_style.corner_radius_top_left = 10
	panel_style.corner_radius_top_right = 10
	panel_style.corner_radius_bottom_left = 10
	panel_style.corner_radius_bottom_right = 10
	panel_style.border_width_left = 2
	panel_style.border_width_right = 2
	panel_style.border_width_top = 2
	panel_style.border_width_bottom = 2
	panel_style.border_color = Color(0.3, 0.5, 0.3)
	layout_panel.add_theme_stylebox_override("panel", panel_style)

	hole_layout_label = Label.new()
	hole_layout_label.name = "HoleLayoutLabel"
	hole_layout_label.position = Vector2(10, 10)
	hole_layout_label.size = Vector2(480, 400)
	hole_layout_label.add_theme_font_size_override("font_size", 14)
	hole_layout_label.add_theme_color_override("font_color", Color(0.8, 0.9, 0.8))
	hole_layout_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layout_panel.add_child(hole_layout_label)


func _update_hole_layout() -> void:
	## Update the ASCII hole layout display
	if hole_layout_label == null or hole_data == null:
		return

	var layout = HoleLayoutGenerator.generate_layout(hole_data, distance_remaining, on_green)
	var layout_text = layout.render()
	layout_text += "\n\n" + HoleLayoutGenerator.get_legend()
	hole_layout_label.text = layout_text


func start_hole(data: HoleData) -> void:
	hole_data = data
	distance_remaining = data.total_distance
	strokes_taken = 0
	current_phase = ShotResolver.Phase.TEE
	current_lie = "tee"
	on_green = false
	putt_distance = 0.0

	# Reset info based on trinkets
	wind_revealed = RunManager.has_auto_reveal("wind")
	break_revealed = RunManager.has_auto_reveal("break")
	lie_revealed = RunManager.has_auto_reveal("lie") or data.lie_always_visible
	distance_revealed = RunManager.has_auto_reveal("distance")

	# Reset status
	player_statuses.clear()
	var start_status = RunManager.get_hole_start_status()
	if start_status != "":
		player_statuses.append(start_status)

	# Reset confidence
	max_confidence = 3 + RunManager.get_confidence_bonus()
	confidence = max_confidence

	# Reset safe play
	safe_play_stacks = RunManager.get_starting_safe_play()

	# Reset flags
	prevents_disaster = false
	max_bogey_active = false

	# Clear played cards
	played_cards_this_phase.clear()
	_clear_played_cards_display()

	# Apply hole start trinket effects
	_apply_hole_start_effects()

	# Update UI
	update_ui()

	# Draw starting hand
	draw_hand()


func draw_hand() -> void:
	card_hand.clear_hand()
	var deck = RunManager.get_deck()
	if deck == null:
		push_warning("No deck available!")
		return

	var draw_count = 5 + RunManager.get_extra_card_draw()
	var hand = deck.draw_cards(draw_count)
	for card_data in hand:
		card_hand.add_card(card_data)
	card_hand.set_cards_playable(confidence)


func _on_card_selected(card: Card) -> void:
	# Show card info or preview
	pass


func _on_card_deselected() -> void:
	pass


func _on_card_play_requested(_card: Card) -> void:
	# When clicking a selected card, play it
	play_selected_card()


func play_selected_card() -> void:
	var card = card_hand.get_selected_card()
	if card == null:
		return

	var data = card.card_data

	# Check cost
	if data.confidence_cost > confidence:
		return

	# Pay cost
	confidence -= data.confidence_cost

	# Apply immediate effects
	_apply_card_effects(data)

	# Track for phase resolution
	played_cards_this_phase.append(data)

	# Add to played cards display
	_add_played_card_display(data)

	# Handle exhaust vs discard
	if data.is_exhaust:
		RunManager.exhaust_card(data)
	else:
		RunManager.discard_card(data)

	# Remove from hand and animate
	await card_hand.play_selected_card()

	# Update UI
	update_ui()
	card_hand.set_cards_playable(confidence)


func _apply_card_effects(data: CardData) -> void:
	# Confidence gain
	if data.confidence_gain > 0:
		confidence = min(confidence + data.confidence_gain, max_confidence)

	# Safe play
	if data.safe_play_gain > 0:
		safe_play_stacks += data.safe_play_gain

	# Prevents disaster
	if data.prevents_disaster:
		prevents_disaster = true

	# Max bogey
	if data.max_bogey:
		max_bogey_active = true

	# Draw cards
	if data.cards_to_draw > 0:
		var deck = RunManager.get_deck()
		var drawn = deck.draw_cards(data.cards_to_draw)
		for card_data in drawn:
			card_hand.add_card(card_data)

	# Reveal information
	if data.reveals_wind:
		wind_revealed = true
	if data.reveals_break:
		break_revealed = true
	if data.reveals_lie:
		lie_revealed = true
	if data.reveals_distance:
		distance_revealed = true

	# Status effects
	if data.status_to_apply != "":
		if data.status_to_apply not in player_statuses:
			player_statuses.append(data.status_to_apply)
	if data.status_to_remove != "" and data.status_to_remove in player_statuses:
		player_statuses.erase(data.status_to_remove)


func _on_end_phase() -> void:
	# Must have played at least one shot card (except for putt phase where lag is optional)
	var has_shot = false
	for card in played_cards_this_phase:
		if card.card_type == CardData.CardType.SHOT:
			has_shot = true
			break

	if not has_shot:
		# Show warning
		_show_message("Play a shot card first!")
		return

	# Build state dictionary
	var state = {
		"distance": distance_remaining,
		"putt_distance": putt_distance,
		"lie": current_lie,
		"wind_known": wind_revealed,
		"break_known": break_revealed,
		"distance_known": distance_revealed,
		"statuses": player_statuses,
		"safe_play": safe_play_stacks
	}

	# Resolve the phase
	var result = ShotResolver.resolve_phase(
		current_phase,
		played_cards_this_phase,
		hole_data,
		state
	)

	# Apply result
	strokes_taken += result.strokes
	distance_remaining = result.new_distance
	current_lie = result.new_lie
	on_green = result.on_green
	putt_distance = result.putt_distance

	# Handle status changes
	if result.gained_status != "":
		if result.gained_status not in player_statuses:
			player_statuses.append(result.gained_status)
	if result.lost_status != "":
		player_statuses.erase(result.lost_status)

	# Consume "focused" after use
	if "focused" in player_statuses:
		player_statuses.erase("focused")

	# Use safe play stacks
	if result.penalty > 0 and safe_play_stacks > 0:
		var reduction = min(safe_play_stacks, result.penalty)
		safe_play_stacks -= reduction

	# Reset phase-specific flags
	prevents_disaster = false

	# Clear played cards
	played_cards_this_phase.clear()
	_clear_played_cards_display()

	# Show result
	await _show_shot_result(result)

	# Emit phase completed
	phase_completed.emit(result)

	# Check if hole is complete
	if result.holed_out:
		_complete_hole()
	else:
		# Move to next phase
		_advance_phase()


func _advance_phase() -> void:
	if on_green:
		current_phase = ShotResolver.Phase.PUTT
	elif distance_remaining <= 50:
		current_phase = ShotResolver.Phase.SHORT_GAME
	else:
		current_phase = ShotResolver.Phase.APPROACH

	# Confidence carries over!
	# But we draw new cards
	var deck = RunManager.get_deck()
	if deck:
		deck.discard_hand()

	draw_hand()
	update_ui()


func _complete_hole() -> void:
	var score = strokes_taken - hole_data.par

	# Check max bogey
	if max_bogey_active and score > 1:
		score = 1
		strokes_taken = hole_data.par + 1

	# Trigger trinket effects
	if score < 0:
		RunManager.trigger_on_birdie()
		if score < -1:
			SaveManager.record_eagle()
		else:
			SaveManager.record_birdie()
	elif score == 0:
		RunManager.trigger_on_par()
	else:
		RunManager.trigger_on_bogey()

	# End hole in deck
	var deck = RunManager.get_deck()
	if deck:
		deck.end_hole()

	hole_completed.emit(strokes_taken, hole_data.par)


func _show_shot_result(result: ShotResolver.ShotResult) -> void:
	# Show result popup
	result_popup.visible = true

	var quality_color = Color.WHITE
	match result.quality:
		ShotResolver.ShotQuality.PERFECT:
			quality_color = Color.GOLD
			AudioManager.play_shot_good()
		ShotResolver.ShotQuality.GOOD:
			quality_color = Color.GREEN
			AudioManager.play_shot_good()
		ShotResolver.ShotQuality.OKAY:
			quality_color = Color.WHITE
		ShotResolver.ShotQuality.POOR:
			quality_color = Color.ORANGE
			AudioManager.play_shot_bad()
		ShotResolver.ShotQuality.DISASTER:
			quality_color = Color.RED
			AudioManager.play_shot_bad()

	result_label.text = result.get_quality_name() + "\n" + result.message
	result_label.add_theme_color_override("font_color", quality_color)

	await get_tree().create_timer(1.5).timeout
	result_popup.visible = false


func _show_message(text: String) -> void:
	result_popup.visible = true
	result_label.text = text
	result_label.add_theme_color_override("font_color", Color.YELLOW)
	await get_tree().create_timer(1.0).timeout
	result_popup.visible = false


func update_ui() -> void:
	if hole_data == null:
		return

	# Hole info
	if hole_info_label:
		hole_info_label.text = "%s - %s" % [hole_data.hole_name if hole_data.hole_name != "" else "Hole %d" % hole_data.hole_number, hole_data.get_par_name()]

	# Phase
	if phase_label:
		var phase_names = ["TEE SHOT", "APPROACH", "SHORT GAME", "PUTTING"]
		phase_label.text = "Phase: %s" % phase_names[current_phase]

	# Distance
	if distance_label:
		if on_green:
			distance_label.text = "Distance: %d feet" % int(putt_distance)
		else:
			distance_label.text = "Distance: %d yards" % int(distance_remaining)

	# Wind
	if wind_label:
		wind_label.text = "Wind: %s" % hole_data.get_wind_description(wind_revealed)

	# Lie
	if lie_label:
		var lie_text = current_lie if lie_revealed or current_lie == "tee" or current_lie == "green" else "???"
		lie_label.text = "Lie: %s" % lie_text.capitalize()

	# Confidence
	if confidence_label:
		var conf_display = ""
		for i in range(max_confidence):
			if i < confidence:
				conf_display += "●"
			else:
				conf_display += "○"
		confidence_label.text = "Confidence: %s (%d/%d)" % [conf_display, confidence, max_confidence]

	# Strokes
	if strokes_label:
		strokes_label.text = "Strokes: %d (Par %d)" % [strokes_taken, hole_data.par]

	# Status
	if status_label:
		var status_text = ""
		if safe_play_stacks > 0:
			status_text += "Safe Play: %d  " % safe_play_stacks
		for status in player_statuses:
			status_text += "[%s] " % status.capitalize()
		if prevents_disaster:
			status_text += "[No Disaster] "
		if max_bogey_active:
			status_text += "[Max Bogey] "
		status_label.text = status_text

	# Score
	if score_label:
		score_label.text = "Score: %s" % RunManager.get_current_score_string()

	# Update hole layout visualization
	_update_hole_layout()


func _add_played_card_display(card_data: CardData) -> void:
	if played_cards_container == null:
		return

	var label = Label.new()
	label.text = "[%s]" % card_data.card_name
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", card_data.get_type_color())
	played_cards_container.add_child(label)


func _clear_played_cards_display() -> void:
	if played_cards_container == null:
		return

	for child in played_cards_container.get_children():
		child.queue_free()


func _apply_hole_start_effects() -> void:
	# Apply trinket effects at hole start
	pass


func _input(event: InputEvent) -> void:
	# Space bar or Enter to play selected card
	if event.is_action_pressed("ui_accept"):
		if card_hand.get_selected_card():
			play_selected_card()
