extends Node
## Manages the current run state

signal run_started()
signal hole_completed(hole_index: int, score: int)
signal run_completed(won: bool, final_score: int)
signal strokes_changed(new_total: int)
signal trinket_acquired(trinket: TrinketData)

var current_run_active: bool = false
var deck: Deck = null
var trinkets: Array[TrinketData] = []
var consumables: Array = []  # ConsumableData when implemented
var current_hole_index: int = 0
var strokes_over_par: int = 0
var max_strokes_over: int = 10
var gold: int = 0

# Map data
var course_map: Array = []  # Will be MapNode array when implemented
var current_map_position: int = 0

const HOLES_PER_RUN = 9
const STARTING_GOLD = 100


func _ready() -> void:
	pass


func start_new_run(starting_trinket: TrinketData = null) -> void:
	current_run_active = true
	current_hole_index = 0
	strokes_over_par = 0
	max_strokes_over = 10
	gold = STARTING_GOLD
	current_map_position = 0

	# Initialize deck with starter cards
	deck = Deck.new()

	# Add starting trinket
	trinkets.clear()
	if starting_trinket:
		trinkets.append(starting_trinket)
		apply_trinket_start_effects(starting_trinket)
		deck.add_starter_cards(starting_trinket.starter_deck_modifier)
	else:
		deck.add_starter_cards("")

	consumables.clear()

	# Generate map (simplified for now)
	# course_map = MapGenerator.generate_map()

	run_started.emit()


func get_deck() -> Deck:
	return deck


func get_trinkets() -> Array[TrinketData]:
	return trinkets


func add_trinket(trinket: TrinketData) -> void:
	trinkets.append(trinket)
	apply_trinket_start_effects(trinket)
	trinket_acquired.emit(trinket)


func add_card_to_deck(card: CardData) -> void:
	if deck:
		deck.add_card(card)


func remove_card_from_deck(card: CardData) -> void:
	if deck:
		deck.remove_card(card)


func upgrade_card(card: CardData) -> void:
	if deck and card.upgraded_version:
		deck.replace_card(card, card.upgraded_version)


func exhaust_card(card: CardData) -> void:
	if deck:
		deck.exhaust(card)


func discard_card(card: CardData) -> void:
	if deck:
		deck.discard(card)


func complete_hole(strokes: int, par: int) -> void:
	var score = strokes - par
	strokes_over_par += score
	current_hole_index += 1

	strokes_changed.emit(strokes_over_par)
	hole_completed.emit(current_hole_index, score)

	# Reset deck for next hole
	if deck:
		deck.end_hole()

	# Check for loss
	if strokes_over_par >= max_strokes_over:
		end_run(false)
	# Check for win
	elif current_hole_index >= HOLES_PER_RUN:
		end_run(true)


func end_run(won: bool) -> void:
	current_run_active = false
	var final_score = strokes_over_par

	# Save meta progress
	SaveManager.record_run(won, final_score, current_hole_index)

	run_completed.emit(won, final_score)
	GameManager.end_run(won)


func apply_trinket_start_effects(trinket: TrinketData) -> void:
	# Modify max strokes
	if trinket.max_strokes_modifier != 0:
		max_strokes_over += trinket.max_strokes_modifier

	# Other starting effects will be checked when needed


func heal_strokes(amount: int) -> void:
	var old_strokes = strokes_over_par
	strokes_over_par = max(0, strokes_over_par - amount)
	if strokes_over_par != old_strokes:
		strokes_changed.emit(strokes_over_par)


func add_gold(amount: int) -> void:
	gold += amount


func spend_gold(amount: int) -> bool:
	if gold >= amount:
		gold -= amount
		return true
	return false


func get_current_score_string() -> String:
	if strokes_over_par == 0:
		return "E"
	elif strokes_over_par > 0:
		return "+%d" % strokes_over_par
	else:
		return "%d" % strokes_over_par


func get_confidence_bonus() -> int:
	## Get total confidence bonus from trinkets
	var bonus = 0
	for trinket in trinkets:
		bonus += trinket.starting_confidence_bonus
		bonus += trinket.confidence_per_hole
	return bonus


func get_extra_card_draw() -> int:
	## Get extra cards to draw from trinkets
	var extra = 0
	for trinket in trinkets:
		extra += trinket.extra_card_draw
	return extra


func get_starting_safe_play() -> int:
	## Get starting safe play stacks from trinkets
	var stacks = 0
	for trinket in trinkets:
		stacks += trinket.safe_play_per_hole
	return stacks


func get_putt_bonus() -> float:
	## Get total putt bonus from trinkets
	var bonus = 0.0
	for trinket in trinkets:
		bonus += trinket.putt_bonus
	return bonus


func get_approach_bonus() -> float:
	## Get total approach bonus from trinkets
	var bonus = 0.0
	for trinket in trinkets:
		bonus += trinket.approach_bonus
	return bonus


func get_wind_reduction() -> float:
	## Get total wind reduction from trinkets (0.0 to 1.0)
	var reduction = 0.0
	for trinket in trinkets:
		reduction += trinket.wind_reduction
	return min(reduction, 1.0)


func has_auto_reveal(reveal_type: String) -> bool:
	## Check if any trinket auto-reveals information
	for trinket in trinkets:
		match reveal_type:
			"wind":
				if trinket.auto_reveal_wind:
					return true
			"distance":
				if trinket.auto_reveal_distance:
					return true
			"break":
				if trinket.auto_reveal_break:
					return true
			"lie":
				if trinket.auto_reveal_lie:
					return true
	return false


func get_hole_start_status() -> String:
	## Get status to apply at hole start from trinkets
	for trinket in trinkets:
		if trinket.on_hole_start_status != "":
			return trinket.on_hole_start_status
	return ""


func trigger_on_birdie() -> void:
	## Called when player gets a birdie
	for trinket in trinkets:
		if trinket.on_birdie_effect != "":
			_apply_trinket_effect(trinket.on_birdie_effect)


func trigger_on_par() -> void:
	## Called when player gets a par
	for trinket in trinkets:
		if trinket.on_par_effect != "":
			_apply_trinket_effect(trinket.on_par_effect)


func trigger_on_bogey() -> void:
	## Called when player gets a bogey or worse
	for trinket in trinkets:
		if trinket.on_bogey_effect != "":
			_apply_trinket_effect(trinket.on_bogey_effect)


func _apply_trinket_effect(effect: String) -> void:
	## Apply a trinket effect by name
	match effect:
		"gain_confidence":
			pass  # Will be handled in hole encounter
		"draw_card":
			pass  # Will be handled in hole encounter
		"gain_dialed_in":
			pass  # Will be handled in hole encounter
		# Add more effects as needed
