extends Node
## Database of all trinkets in the game

var _trinkets: Dictionary = {}  # id -> TrinketData
var _starting_trinkets: Array[TrinketData] = []
var _trinkets_by_rarity: Dictionary = {
	TrinketData.TrinketRarity.STARTER: [],
	TrinketData.TrinketRarity.COMMON: [],
	TrinketData.TrinketRarity.UNCOMMON: [],
	TrinketData.TrinketRarity.RARE: [],
	TrinketData.TrinketRarity.BOSS: []
}


func _ready() -> void:
	_load_all_trinkets()
	_create_default_trinkets()


func _load_all_trinkets() -> void:
	## Load all trinket resources from the resources/trinkets directories
	var paths = [
		"res://resources/trinkets/starting/",
		"res://resources/trinkets/found/"
	]

	for path in paths:
		var dir = DirAccess.open(path)
		if dir:
			dir.list_dir_begin()
			var file_name = dir.get_next()
			while file_name != "":
				if file_name.ends_with(".tres"):
					var trinket = load(path + file_name) as TrinketData
					if trinket:
						register_trinket(trinket)
				file_name = dir.get_next()


func _create_default_trinkets() -> void:
	## Create default trinkets if they don't exist in resources

	# Starting Trinkets (Caddie Archetypes)
	if not has_trinket("veteran_looper"):
		var veteran = TrinketData.new()
		veteran.id = "veteran_looper"
		veteran.trinket_name = "Veteran Looper"
		veteran.description = "Start with 'Yardage Book' card in hand each hole. Start with 4 Confidence instead of 3."
		veteran.rarity = TrinketData.TrinketRarity.STARTER
		veteran.is_starting_trinket = true
		veteran.starter_deck_modifier = "yardage_book"
		veteran.starting_confidence_bonus = 1
		veteran.flavor_text = "30 years on the bag."
		register_trinket(veteran)

	if not has_trinket("aggressive_caddie"):
		var aggressive = TrinketData.new()
		aggressive.id = "aggressive_caddie"
		aggressive.trinket_name = "Aggressive Caddie"
		aggressive.description = "Start with 'Attack the Pin' in deck. +20% make chance on birdie putts. Lose at +9 instead of +10."
		aggressive.rarity = TrinketData.TrinketRarity.STARTER
		aggressive.is_starting_trinket = true
		aggressive.starter_deck_modifier = "attack_pin"
		aggressive.putt_bonus = 0.20
		aggressive.max_strokes_modifier = -1
		aggressive.flavor_text = "Birdie or bust."
		register_trinket(aggressive)

	if not has_trinket("conservative_caddie"):
		var conservative = TrinketData.new()
		conservative.id = "conservative_caddie"
		conservative.trinket_name = "Conservative Caddie"
		conservative.description = "Start with 'Smart Play' in deck. 'Safe Play' effects are 50% stronger."
		conservative.rarity = TrinketData.TrinketRarity.STARTER
		conservative.is_starting_trinket = true
		conservative.starter_deck_modifier = "smart_play"
		conservative.flavor_text = "Par is your friend."
		register_trinket(conservative)

	if not has_trinket("putting_specialist"):
		var putting = TrinketData.new()
		putting.id = "putting_specialist"
		putting.trinket_name = "Putting Specialist"
		putting.description = "Start with 'Read the Line' in deck. All putts inside 10 feet: +25% make chance."
		putting.rarity = TrinketData.TrinketRarity.STARTER
		putting.is_starting_trinket = true
		putting.starter_deck_modifier = "read_the_line"
		putting.putt_bonus = 0.25
		putting.flavor_text = "Make everything inside 10 feet."
		register_trinket(putting)

	if not has_trinket("rookie_caddie"):
		var rookie = TrinketData.new()
		rookie.id = "rookie_caddie"
		rookie.trinket_name = "Rookie Caddie"
		rookie.description = "Start with no bonus cards. See 4 cards instead of 3 after each hole."
		rookie.rarity = TrinketData.TrinketRarity.STARTER
		rookie.is_starting_trinket = true
		rookie.card_reward_bonus = 1
		rookie.flavor_text = "Still learning."
		register_trinket(rookie)

	# Common Trinkets
	if not has_trinket("worn_yardage_book"):
		var worn = TrinketData.new()
		worn.id = "worn_yardage_book"
		worn.trinket_name = "Worn Yardage Book"
		worn.description = "Reveal distance to pin automatically each hole."
		worn.rarity = TrinketData.TrinketRarity.COMMON
		worn.auto_reveal_distance = true
		register_trinket(worn)

	if not has_trinket("lucky_ball_marker"):
		var lucky = TrinketData.new()
		lucky.id = "lucky_ball_marker"
		lucky.trinket_name = "Lucky Ball Marker"
		lucky.description = "+5% putt make chance."
		lucky.rarity = TrinketData.TrinketRarity.COMMON
		lucky.putt_bonus = 0.05
		register_trinket(lucky)

	if not has_trinket("extra_glove"):
		var glove = TrinketData.new()
		glove.id = "extra_glove"
		glove.trinket_name = "Extra Glove"
		glove.description = "Start each hole with 1 'Safe Play'."
		glove.rarity = TrinketData.TrinketRarity.COMMON
		glove.safe_play_per_hole = 1
		register_trinket(glove)

	if not has_trinket("granola_bar"):
		var granola = TrinketData.new()
		granola.id = "granola_bar"
		granola.trinket_name = "Granola Bar"
		granola.description = "At rest sites, heal 1 additional stroke."
		granola.rarity = TrinketData.TrinketRarity.COMMON
		granola.heal_bonus = 1
		register_trinket(granola)

	# Uncommon Trinkets
	if not has_trinket("rangefinder"):
		var range_finder = TrinketData.new()
		range_finder.id = "rangefinder"
		range_finder.trinket_name = "Rangefinder"
		range_finder.description = "All distances revealed. +10% accuracy on approach shots."
		range_finder.rarity = TrinketData.TrinketRarity.UNCOMMON
		range_finder.auto_reveal_distance = true
		range_finder.approach_bonus = 0.10
		register_trinket(range_finder)

	if not has_trinket("wind_shirt"):
		var wind_shirt = TrinketData.new()
		wind_shirt.id = "wind_shirt"
		wind_shirt.trinket_name = "Wind Shirt"
		wind_shirt.description = "Reduce wind effects by 50%."
		wind_shirt.rarity = TrinketData.TrinketRarity.UNCOMMON
		wind_shirt.wind_reduction = 0.50
		register_trinket(wind_shirt)

	if not has_trinket("mental_coach_notes"):
		var coach = TrinketData.new()
		coach.id = "mental_coach_notes"
		coach.trinket_name = "Mental Coach Notes"
		coach.description = "Start each hole with 'Focused'."
		coach.rarity = TrinketData.TrinketRarity.UNCOMMON
		coach.on_hole_start_status = "focused"
		register_trinket(coach)

	if not has_trinket("putting_mirror"):
		var mirror = TrinketData.new()
		mirror.id = "putting_mirror"
		mirror.trinket_name = "Putting Mirror"
		mirror.description = "Reveal green break automatically."
		mirror.rarity = TrinketData.TrinketRarity.UNCOMMON
		mirror.auto_reveal_break = true
		register_trinket(mirror)

	if not has_trinket("caddie_bib"):
		var bib = TrinketData.new()
		bib.id = "caddie_bib"
		bib.trinket_name = "Caddie Bib"
		bib.description = "+1 Confidence per hole."
		bib.rarity = TrinketData.TrinketRarity.UNCOMMON
		bib.confidence_per_hole = 1
		register_trinket(bib)

	if not has_trinket("hot_streak"):
		var streak = TrinketData.new()
		streak.id = "hot_streak"
		streak.trinket_name = "Player's Hot Streak"
		streak.description = "After a birdie, next hole starts with 'Dialed In'."
		streak.rarity = TrinketData.TrinketRarity.UNCOMMON
		streak.on_birdie_effect = "gain_dialed_in"
		register_trinket(streak)

	# Rare Trinkets
	if not has_trinket("tour_experience"):
		var tour = TrinketData.new()
		tour.id = "tour_experience"
		tour.trinket_name = "Tour Caddie Experience"
		tour.description = "Start combat with 1 extra card drawn."
		tour.rarity = TrinketData.TrinketRarity.RARE
		tour.extra_card_draw = 1
		register_trinket(tour)

	if not has_trinket("the_zone"):
		var zone = TrinketData.new()
		zone.id = "the_zone"
		zone.trinket_name = "The Zone"
		zone.description = "After 3 pars in a row, gain 'The Zone' - all shots +25% until bogey."
		zone.rarity = TrinketData.TrinketRarity.RARE
		register_trinket(zone)

	if not has_trinket("sunrise_practice"):
		var sunrise = TrinketData.new()
		sunrise.id = "sunrise_practice"
		sunrise.trinket_name = "Sunrise Practice"
		sunrise.description = "First shot of each hole has +30% good outcome."
		sunrise.rarity = TrinketData.TrinketRarity.RARE
		register_trinket(sunrise)

	if not has_trinket("grinder_mentality"):
		var grinder = TrinketData.new()
		grinder.id = "grinder_mentality"
		grinder.trinket_name = "Grinder's Mentality"
		grinder.description = "Whenever you bogey, gain 1 Confidence and draw 1 card."
		grinder.rarity = TrinketData.TrinketRarity.RARE
		grinder.on_bogey_effect = "gain_confidence"
		register_trinket(grinder)

	if not has_trinket("course_record"):
		var record = TrinketData.new()
		record.id = "course_record"
		record.trinket_name = "Course Record Holder"
		record.description = "Your player has won here before. All distances revealed, +15% on signature holes."
		record.rarity = TrinketData.TrinketRarity.RARE
		record.auto_reveal_distance = true
		record.signature_hole_bonus = 0.15
		register_trinket(record)

	# Boss Trinkets
	if not has_trinket("green_jacket"):
		var jacket = TrinketData.new()
		jacket.id = "green_jacket"
		jacket.trinket_name = "Green Jacket"
		jacket.description = "Start each hole with 2 extra Confidence."
		jacket.rarity = TrinketData.TrinketRarity.BOSS
		jacket.starting_confidence_bonus = 2
		jacket.flavor_text = "You've won here before."
		register_trinket(jacket)

	if not has_trinket("major_belief"):
		var belief = TrinketData.new()
		belief.id = "major_belief"
		belief.trinket_name = "Major Champion Belief"
		belief.description = "Cannot go worse than double bogey on any hole."
		belief.rarity = TrinketData.TrinketRarity.BOSS
		register_trinket(belief)


func register_trinket(trinket: TrinketData) -> void:
	_trinkets[trinket.id] = trinket
	_trinkets_by_rarity[trinket.rarity].append(trinket)
	if trinket.is_starting_trinket:
		_starting_trinkets.append(trinket)


func has_trinket(id: String) -> bool:
	return _trinkets.has(id)


func get_trinket(id: String) -> TrinketData:
	if _trinkets.has(id):
		return _trinkets[id]
	return null


func get_starting_trinkets() -> Array[TrinketData]:
	return _starting_trinkets


func get_trinkets_by_rarity(rarity: TrinketData.TrinketRarity) -> Array:
	return _trinkets_by_rarity[rarity]


func get_random_trinket(exclude_ids: Array = [], rarity: TrinketData.TrinketRarity = TrinketData.TrinketRarity.COMMON) -> TrinketData:
	var available: Array = []
	for trinket in _trinkets_by_rarity[rarity]:
		if trinket.id not in exclude_ids and not trinket.is_starting_trinket:
			available.append(trinket)

	if available.is_empty():
		return null

	return available[randi() % available.size()]


func get_all_trinkets() -> Array:
	return _trinkets.values()
