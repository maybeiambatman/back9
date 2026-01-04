extends Node
## Database of all cards in the game

var _cards: Dictionary = {}  # id -> CardData
var _cards_by_type: Dictionary = {
	CardData.CardType.SHOT: [],
	CardData.CardType.READ: [],
	CardData.CardType.MENTAL: []
}
var _cards_by_rarity: Dictionary = {
	CardData.CardRarity.COMMON: [],
	CardData.CardRarity.UNCOMMON: [],
	CardData.CardRarity.RARE: [],
	CardData.CardRarity.SPECIAL: []
}


func _ready() -> void:
	_load_all_cards()
	_create_default_cards()


func _load_all_cards() -> void:
	## Load all card resources from the resources/cards directories
	var paths = [
		"res://resources/cards/shots/",
		"res://resources/cards/reads/",
		"res://resources/cards/mental/"
	]

	for path in paths:
		var dir = DirAccess.open(path)
		if dir:
			dir.list_dir_begin()
			var file_name = dir.get_next()
			while file_name != "":
				if file_name.ends_with(".tres"):
					var card = load(path + file_name) as CardData
					if card:
						register_card(card)
				file_name = dir.get_next()


func _create_default_cards() -> void:
	## Create default cards if they don't exist in resources
	# This ensures the game works even without resource files

	# Shot cards - Tee shots
	if not has_card("driver"):
		var driver = CardData.new()
		driver.id = "driver"
		driver.card_name = "Driver"
		driver.description = "-250 yards. 20% chance to find rough."
		driver.card_type = CardData.CardType.SHOT
		driver.shot_category = CardData.ShotCategory.TEE
		driver.confidence_cost = 2
		driver.distance_effect = -250
		driver.rough_chance = 0.20
		driver.flavor_text = "Grip it and rip it."
		register_card(driver)

	if not has_card("safe_drive"):
		var safe_drive = CardData.new()
		safe_drive.id = "safe_drive"
		safe_drive.card_name = "Safe Drive"
		safe_drive.description = "-220 yards. Always finds fairway."
		safe_drive.card_type = CardData.CardType.SHOT
		safe_drive.shot_category = CardData.ShotCategory.TEE
		safe_drive.confidence_cost = 1
		safe_drive.distance_effect = -220
		safe_drive.rough_chance = 0.0
		safe_drive.flavor_text = "Position over power."
		register_card(safe_drive)

	if not has_card("power_fade"):
		var power_fade = CardData.new()
		power_fade.id = "power_fade"
		power_fade.card_name = "Power Fade"
		power_fade.description = "-240 yards. Avoids left hazards."
		power_fade.card_type = CardData.CardType.SHOT
		power_fade.shot_category = CardData.ShotCategory.TEE
		power_fade.confidence_cost = 2
		power_fade.distance_effect = -240
		power_fade.rough_chance = 0.15
		power_fade.flavor_text = "Shape it away from trouble."
		register_card(power_fade)

	if not has_card("stinger"):
		var stinger = CardData.new()
		stinger.id = "stinger"
		stinger.card_name = "Stinger"
		stinger.description = "-200 yards. Ignores wind effects."
		stinger.card_type = CardData.CardType.SHOT
		stinger.shot_category = CardData.ShotCategory.TEE
		stinger.confidence_cost = 2
		stinger.distance_effect = -200
		stinger.ignores_wind = true
		stinger.flavor_text = "Under the wind."
		register_card(stinger)

	# Shot cards - Approach
	if not has_card("stock_iron"):
		var stock_iron = CardData.new()
		stock_iron.id = "stock_iron"
		stock_iron.card_name = "Stock Iron"
		stock_iron.description = "-150 yards. Standard accuracy."
		stock_iron.card_type = CardData.CardType.SHOT
		stock_iron.shot_category = CardData.ShotCategory.APPROACH
		stock_iron.confidence_cost = 1
		stock_iron.distance_effect = -150
		stock_iron.miss_green_chance = 0.25
		stock_iron.flavor_text = "Bread and butter."
		register_card(stock_iron)

	if not has_card("attack_pin"):
		var attack_pin = CardData.new()
		attack_pin.id = "attack_pin"
		attack_pin.card_name = "Attack the Pin"
		attack_pin.description = "-150 yards. If green hit, ball is 'close'. 30% chance to miss green."
		attack_pin.card_type = CardData.CardType.SHOT
		attack_pin.shot_category = CardData.ShotCategory.APPROACH
		attack_pin.confidence_cost = 2
		attack_pin.distance_effect = -150
		attack_pin.miss_green_chance = 0.30
		attack_pin.close_chance = 0.60
		attack_pin.flavor_text = "Fire at the flag."
		register_card(attack_pin)

	if not has_card("smart_play"):
		var smart_play = CardData.new()
		smart_play.id = "smart_play"
		smart_play.card_name = "Smart Play"
		smart_play.description = "-140 yards. Always hits green, center position."
		smart_play.card_type = CardData.CardType.SHOT
		smart_play.shot_category = CardData.ShotCategory.APPROACH
		smart_play.confidence_cost = 1
		smart_play.distance_effect = -140
		smart_play.miss_green_chance = 0.0
		smart_play.flavor_text = "Middle of the green, every time."
		register_card(smart_play)

	if not has_card("knockdown"):
		var knockdown = CardData.new()
		knockdown.id = "knockdown"
		knockdown.card_name = "Knockdown"
		knockdown.description = "-130 yards. Ignores wind. Cannot go long."
		knockdown.card_type = CardData.CardType.SHOT
		knockdown.shot_category = CardData.ShotCategory.APPROACH
		knockdown.confidence_cost = 1
		knockdown.distance_effect = -130
		knockdown.ignores_wind = true
		knockdown.flavor_text = "Control shot."
		register_card(knockdown)

	# Shot cards - Short Game
	if not has_card("bump_and_run"):
		var bump = CardData.new()
		bump.id = "bump_and_run"
		bump.card_name = "Bump and Run"
		bump.description = "Get on green. 40% close, 60% mid-range putt."
		bump.card_type = CardData.CardType.SHOT
		bump.shot_category = CardData.ShotCategory.SHORT_GAME
		bump.confidence_cost = 1
		bump.close_chance = 0.40
		bump.flavor_text = "Let it roll out."
		register_card(bump)

	if not has_card("flop_shot"):
		var flop = CardData.new()
		flop.id = "flop_shot"
		flop.card_name = "Flop Shot"
		flop.description = "60% close, 30% mid, 10% stays off green."
		flop.card_type = CardData.CardType.SHOT
		flop.shot_category = CardData.ShotCategory.SHORT_GAME
		flop.confidence_cost = 2
		flop.close_chance = 0.60
		flop.miss_green_chance = 0.10
		flop.flavor_text = "High risk, high reward."
		register_card(flop)

	if not has_card("bunker_splash"):
		var bunker = CardData.new()
		bunker.id = "bunker_splash"
		bunker.card_name = "Bunker Splash"
		bunker.description = "From bunker, get on green. 30% close, 50% mid, 20% far."
		bunker.card_type = CardData.CardType.SHOT
		bunker.shot_category = CardData.ShotCategory.BUNKER
		bunker.confidence_cost = 1
		bunker.close_chance = 0.30
		bunker.flavor_text = "Explosion shot."
		register_card(bunker)

	if not has_card("up_and_down"):
		var up_down = CardData.new()
		up_down.id = "up_and_down"
		up_down.card_name = "Up and Down"
		up_down.description = "Within 30 yards: automatic 2-putt save. 20% chance to hole it. Exhaust."
		up_down.card_type = CardData.CardType.SHOT
		up_down.shot_category = CardData.ShotCategory.SHORT_GAME
		up_down.confidence_cost = 2
		up_down.is_exhaust = true
		up_down.close_chance = 0.80
		up_down.flavor_text = "Clutch short game."
		register_card(up_down)

	# Shot cards - Putting
	if not has_card("lag_putt"):
		var lag = CardData.new()
		lag.id = "lag_putt"
		lag.card_name = "Lag Putt"
		lag.description = "From any distance, guaranteed 2-putt."
		lag.card_type = CardData.CardType.SHOT
		lag.shot_category = CardData.ShotCategory.PUTT
		lag.confidence_cost = 0
		lag.flavor_text = "Just get it close."
		register_card(lag)

	if not has_card("aggressive_putt"):
		var agg_putt = CardData.new()
		agg_putt.id = "aggressive_putt"
		agg_putt.card_name = "Aggressive Putt"
		agg_putt.description = "+30% make chance. If miss, may have 4-footer coming back."
		agg_putt.card_type = CardData.CardType.SHOT
		agg_putt.shot_category = CardData.ShotCategory.PUTT
		agg_putt.confidence_cost = 1
		agg_putt.accuracy_modifier = 0.30
		agg_putt.flavor_text = "Charge it."
		register_card(agg_putt)

	if not has_card("read_the_line"):
		var read_line = CardData.new()
		read_line.id = "read_the_line"
		read_line.card_name = "Read the Line"
		read_line.description = "Reveal break. Next putt has +20% make chance."
		read_line.card_type = CardData.CardType.READ
		read_line.confidence_cost = 1
		read_line.reveals_break = true
		read_line.accuracy_bonus_after_reveal = 0.20
		read_line.flavor_text = "Trust your read."
		register_card(read_line)

	if not has_card("drain_it"):
		var drain = CardData.new()
		drain.id = "drain_it"
		drain.card_name = "Drain It"
		drain.description = "+50% make chance on this putt. Exhaust."
		drain.card_type = CardData.CardType.SHOT
		drain.shot_category = CardData.ShotCategory.PUTT
		drain.confidence_cost = 2
		drain.is_exhaust = true
		drain.accuracy_modifier = 0.50
		drain.flavor_text = "This is for birdie."
		register_card(drain)

	# Read cards
	if not has_card("check_wind"):
		var check_wind = CardData.new()
		check_wind.id = "check_wind"
		check_wind.card_name = "Check the Wind"
		check_wind.description = "Reveal wind direction and strength for this hole."
		check_wind.card_type = CardData.CardType.READ
		check_wind.confidence_cost = 1
		check_wind.reveals_wind = true
		check_wind.flavor_text = "Toss some grass."
		register_card(check_wind)

	if not has_card("walk_the_hole"):
		var walk = CardData.new()
		walk.id = "walk_the_hole"
		walk.card_name = "Walk the Hole"
		walk.description = "Reveal all hazard positions and distances."
		walk.card_type = CardData.CardType.READ
		walk.confidence_cost = 1
		walk.reveals_distance = true
		walk.flavor_text = "Know the layout."
		register_card(walk)

	if not has_card("study_lie"):
		var study = CardData.new()
		study.id = "study_lie"
		study.card_name = "Study the Lie"
		study.description = "Reveal your current lie quality before choosing shot."
		study.card_type = CardData.CardType.READ
		study.confidence_cost = 0
		study.reveals_lie = true
		study.flavor_text = "How's it sitting?"
		register_card(study)

	if not has_card("read_green"):
		var read_green = CardData.new()
		read_green.id = "read_green"
		read_green.card_name = "Read the Green"
		read_green.description = "Reveal break direction and severity. +10% putt make chance."
		read_green.card_type = CardData.CardType.READ
		read_green.confidence_cost = 1
		read_green.reveals_break = true
		read_green.accuracy_bonus_after_reveal = 0.10
		read_green.flavor_text = "See the line."
		register_card(read_green)

	if not has_card("caddie_intuition"):
		var intuition = CardData.new()
		intuition.id = "caddie_intuition"
		intuition.card_name = "Caddie Intuition"
		intuition.description = "Reveal one random piece of hidden information."
		intuition.card_type = CardData.CardType.READ
		intuition.confidence_cost = 0
		intuition.flavor_text = "Something feels off..."
		register_card(intuition)

	if not has_card("yardage_book"):
		var yardage = CardData.new()
		yardage.id = "yardage_book"
		yardage.card_name = "Yardage Book"
		yardage.description = "Know exact distance. Next shot has +15% accuracy."
		yardage.card_type = CardData.CardType.READ
		yardage.confidence_cost = 1
		yardage.reveals_distance = true
		yardage.accuracy_bonus_after_reveal = 0.15
		yardage.flavor_text = "Trust the numbers."
		register_card(yardage)

	# Mental cards
	if not has_card("stay_calm"):
		var calm = CardData.new()
		calm.id = "stay_calm"
		calm.card_name = "Stay Calm"
		calm.description = "Gain 1 Confidence."
		calm.card_type = CardData.CardType.MENTAL
		calm.confidence_cost = 0
		calm.confidence_gain = 1
		calm.flavor_text = "One shot at a time."
		register_card(calm)

	if not has_card("trust_process"):
		var trust = CardData.new()
		trust.id = "trust_process"
		trust.card_name = "Trust the Process"
		trust.description = "Next shot cannot have a 'disaster' outcome."
		trust.card_type = CardData.CardType.MENTAL
		trust.confidence_cost = 1
		trust.prevents_disaster = true
		trust.flavor_text = "Commit to the shot."
		register_card(trust)

	if not has_card("shake_it_off"):
		var shake = CardData.new()
		shake.id = "shake_it_off"
		shake.card_name = "Shake It Off"
		shake.description = "Remove 1 'Rattled'. Gain 1 Confidence."
		shake.card_type = CardData.CardType.MENTAL
		shake.confidence_cost = 0
		shake.confidence_gain = 1
		shake.status_to_remove = "rattled"
		shake.flavor_text = "Short memory."
		register_card(shake)

	if not has_card("deep_breath"):
		var breath = CardData.new()
		breath.id = "deep_breath"
		breath.card_name = "Deep Breath"
		breath.description = "Gain 2 Confidence. Exhaust."
		breath.card_type = CardData.CardType.MENTAL
		breath.confidence_cost = 0
		breath.is_exhaust = true
		breath.confidence_gain = 2
		breath.flavor_text = "Reset."
		register_card(breath)

	if not has_card("positive_self_talk"):
		var positive = CardData.new()
		positive.id = "positive_self_talk"
		positive.card_name = "Positive Self-Talk"
		positive.description = "Gain 'Focused' - next shot has +20% good outcome chance."
		positive.card_type = CardData.CardType.MENTAL
		positive.confidence_cost = 1
		positive.status_to_apply = "focused"
		positive.flavor_text = "You've got this."
		register_card(positive)

	if not has_card("course_management"):
		var management = CardData.new()
		management.id = "course_management"
		management.card_name = "Course Management"
		management.description = "Draw 2 cards. Discard 1 card."
		management.card_type = CardData.CardType.MENTAL
		management.confidence_cost = 1
		management.cards_to_draw = 2
		management.cards_to_discard = 1
		management.flavor_text = "Think it through."
		register_card(management)

	if not has_card("accept_bogey"):
		var accept = CardData.new()
		accept.id = "accept_bogey"
		accept.card_name = "Accept the Bogey"
		accept.description = "This hole cannot go worse than bogey. Exhaust."
		accept.card_type = CardData.CardType.MENTAL
		accept.confidence_cost = 0
		accept.is_exhaust = true
		accept.max_bogey = true
		accept.flavor_text = "Take your medicine."
		register_card(accept)

	if not has_card("play_safe"):
		var safe = CardData.new()
		safe.id = "play_safe"
		safe.card_name = "Play It Safe"
		safe.description = "Gain 2 'Safe Play' - reduces penalty on bad outcomes."
		safe.card_type = CardData.CardType.MENTAL
		safe.confidence_cost = 1
		safe.safe_play_gain = 2
		safe.flavor_text = "Protect the score."
		register_card(safe)

	if not has_card("birdie_mindset"):
		var birdie = CardData.new()
		birdie.id = "birdie_mindset"
		birdie.card_name = "Birdie Mindset"
		birdie.description = "All shots this hole have +15% good outcome. Lose 1 Safe Play."
		birdie.card_type = CardData.CardType.MENTAL
		birdie.confidence_cost = 2
		birdie.status_to_apply = "dialed_in"
		birdie.flavor_text = "Go low."
		register_card(birdie)


func register_card(card: CardData) -> void:
	_cards[card.id] = card
	_cards_by_type[card.card_type].append(card)
	_cards_by_rarity[card.rarity].append(card)


func has_card(id: String) -> bool:
	return _cards.has(id)


func get_card(id: String) -> CardData:
	if _cards.has(id):
		return _cards[id]
	return null


func get_cards_by_type(card_type: CardData.CardType) -> Array:
	return _cards_by_type[card_type]


func get_cards_by_rarity(rarity: CardData.CardRarity) -> Array:
	return _cards_by_rarity[rarity]


func get_random_card_reward(count: int = 3, exclude_ids: Array = []) -> Array[CardData]:
	## Get random cards for reward selection
	var available: Array[CardData] = []
	for card in _cards.values():
		if card.id not in exclude_ids and card.rarity != CardData.CardRarity.SPECIAL:
			available.append(card)

	available.shuffle()

	var result: Array[CardData] = []
	for i in range(min(count, available.size())):
		result.append(available[i])

	return result


func get_all_cards() -> Array:
	return _cards.values()
