extends RefCounted
class_name ShotResolver
## Resolves shot outcomes based on cards played and conditions

enum Phase { TEE, APPROACH, SHORT_GAME, PUTT }
enum ShotQuality { PERFECT, GOOD, OKAY, POOR, DISASTER }

class ShotResult:
	var strokes: int = 1
	var new_distance: float = 0.0
	var new_lie: String = "fairway"
	var on_green: bool = false
	var putt_distance: float = 0.0
	var holed_out: bool = false
	var quality: ShotQuality = ShotQuality.OKAY
	var penalty: int = 0
	var gained_status: String = ""
	var lost_status: String = ""
	var message: String = ""

	func get_quality_name() -> String:
		match quality:
			ShotQuality.PERFECT: return "Perfect!"
			ShotQuality.GOOD: return "Good shot"
			ShotQuality.OKAY: return "Okay"
			ShotQuality.POOR: return "Poor shot"
			ShotQuality.DISASTER: return "Disaster!"
		return ""


static func resolve_phase(
	phase: Phase,
	played_cards: Array[CardData],
	hole_data: HoleData,
	state: Dictionary
) -> ShotResult:

	var result = ShotResult.new()
	result.new_distance = state.get("distance", 0.0)

	# Find the primary shot card played
	var shot_card: CardData = null
	var total_accuracy_bonus: float = 0.0
	var ignores_wind: bool = false
	var prevents_disaster: bool = false

	for card in played_cards:
		if card.card_type == CardData.CardType.SHOT:
			shot_card = card
		# Accumulate bonuses from all cards
		total_accuracy_bonus += card.accuracy_modifier
		if card.ignores_wind:
			ignores_wind = true
		if card.prevents_disaster:
			prevents_disaster = true
		if card.accuracy_bonus_after_reveal > 0:
			var wind_known = state.get("wind_known", false)
			var break_known = state.get("break_known", false)
			var distance_known = state.get("distance_known", false)
			if wind_known or break_known or distance_known:
				total_accuracy_bonus += card.accuracy_bonus_after_reveal

	# Check for status bonuses
	var statuses: Array = state.get("statuses", [])
	if "focused" in statuses:
		total_accuracy_bonus += 0.20
	if "dialed_in" in statuses:
		total_accuracy_bonus += 0.10
	if "rattled" in statuses:
		total_accuracy_bonus -= 0.15
	if "hot_putter" in statuses and phase == Phase.PUTT:
		total_accuracy_bonus += 0.15
	if "the_zone" in statuses:
		total_accuracy_bonus += 0.25

	# Add trinket bonuses
	total_accuracy_bonus += RunManager.get_approach_bonus() if phase == Phase.APPROACH else 0.0
	total_accuracy_bonus += RunManager.get_putt_bonus() if phase == Phase.PUTT else 0.0

	# If no shot card played, it's a disaster
	if shot_card == null:
		result.quality = ShotQuality.DISASTER
		result.new_lie = "rough"
		result.gained_status = "rattled"
		result.message = "No shot card played!"
		return result

	# Calculate outcome based on phase
	match phase:
		Phase.TEE:
			result = _resolve_tee_shot(shot_card, hole_data, state, total_accuracy_bonus, ignores_wind, prevents_disaster)
		Phase.APPROACH:
			result = _resolve_approach(shot_card, hole_data, state, total_accuracy_bonus, ignores_wind, prevents_disaster)
		Phase.SHORT_GAME:
			result = _resolve_short_game(shot_card, hole_data, state, total_accuracy_bonus, prevents_disaster)
		Phase.PUTT:
			result = _resolve_putt(shot_card, hole_data, state, total_accuracy_bonus)

	# Use safe play to reduce penalties
	var safe_play = state.get("safe_play", 0)
	if result.penalty > 0 and safe_play > 0:
		var reduction = min(safe_play, result.penalty)
		result.penalty -= reduction
		# Note: caller should reduce safe_play stacks

	return result


static func _resolve_tee_shot(
	card: CardData,
	hole: HoleData,
	state: Dictionary,
	accuracy_bonus: float,
	ignores_wind: bool,
	prevents_disaster: bool
) -> ShotResult:

	var result = ShotResult.new()
	result.strokes = 1
	result.new_distance = state.get("distance", hole.total_distance)
	result.new_lie = "fairway"

	# Base distance from card
	var distance_hit = abs(card.distance_effect)
	result.new_distance = max(0, result.new_distance - distance_hit)

	# Wind effect (if not ignored)
	var wind_known = state.get("wind_known", false)
	var wind_reduction = RunManager.get_wind_reduction()

	if not ignores_wind and hole.wind_strength > 0:
		var effective_wind = hole.wind_strength * (1.0 - wind_reduction)
		var wind_penalty = effective_wind * 0.5  # yards
		if not wind_known:
			wind_penalty *= 1.5  # Extra penalty for not knowing
		result.new_distance += wind_penalty * randf_range(-1, 1)

	# Accuracy roll
	var accuracy_roll = randf()
	var base_accuracy = 0.7 + accuracy_bonus

	# Lie penalty from previous shot
	var current_lie = state.get("lie", "tee")
	match current_lie:
		"rough", "light_rough":
			base_accuracy -= 0.1
		"heavy_rough":
			base_accuracy -= 0.2
		"bunker":
			base_accuracy -= 0.15

	# Card-specific rough chance
	var rough_chance = card.rough_chance

	# Determine outcome
	if accuracy_roll < base_accuracy * 0.15:
		result.quality = ShotQuality.PERFECT
		result.new_lie = "fairway"
		result.new_distance -= 10  # Extra distance on perfect
		result.message = "Striped it down the middle!"
	elif accuracy_roll < base_accuracy * 0.5:
		result.quality = ShotQuality.GOOD
		result.new_lie = "fairway"
		result.message = "Solid drive, in the fairway."
	elif accuracy_roll < base_accuracy * (1.0 - rough_chance):
		result.quality = ShotQuality.OKAY
		result.new_lie = "light_rough" if randf() < 0.3 else "fairway"
		result.message = "Playable lie." if result.new_lie == "light_rough" else "Found the short grass."
	elif accuracy_roll < base_accuracy + 0.15:
		if prevents_disaster:
			result.quality = ShotQuality.POOR
			result.new_lie = "rough"
			result.new_distance += 20
			result.message = "In the rough, but could be worse."
		else:
			result.quality = ShotQuality.POOR
			result.new_lie = "rough"
			result.new_distance += 20  # Lost distance
			result.message = "Deep in the rough."
	else:
		if prevents_disaster:
			result.quality = ShotQuality.POOR
			result.new_lie = "heavy_rough"
			result.new_distance += 30
			result.message = "Avoided disaster, but not great."
		else:
			result.quality = ShotQuality.DISASTER
			# Check hazards
			if hole.has_water_off_tee and randf() < 0.4:
				result.new_lie = "water"
				result.strokes += 1  # Penalty stroke
				result.new_distance = state.get("distance", hole.total_distance) - distance_hit + 50  # Drop zone
				result.penalty = 1
				result.message = "In the water! Penalty stroke."
			else:
				result.new_lie = "heavy_rough"
				result.gained_status = "rattled"
				result.message = "Way off line!"

	# Par 3: might hit green off tee
	if result.new_distance <= 0 and hole.par == 3:
		result.on_green = true
		result.new_distance = 0
		match result.quality:
			ShotQuality.PERFECT:
				result.putt_distance = randf_range(3, 10)
				result.message = "On the green, birdie putt!"
			ShotQuality.GOOD:
				result.putt_distance = randf_range(15, 30)
				result.message = "On the green, good look."
			_:
				result.putt_distance = randf_range(25, 45)
				result.message = "On the green, long putt."

	return result


static func _resolve_approach(
	card: CardData,
	hole: HoleData,
	state: Dictionary,
	accuracy_bonus: float,
	ignores_wind: bool,
	prevents_disaster: bool
) -> ShotResult:

	var result = ShotResult.new()
	result.strokes = 1
	result.new_distance = 0
	result.new_lie = "green"
	result.on_green = false

	var accuracy_roll = randf()
	var base_accuracy = 0.65 + accuracy_bonus

	# Club selection matters
	var ideal_distance = state.get("distance", 150)
	var card_distance = abs(card.distance_effect)
	var club_fit = 1.0 - (abs(ideal_distance - card_distance) / 50.0)
	club_fit = clamp(club_fit, 0.5, 1.0)
	base_accuracy *= club_fit

	# Lie penalty
	var current_lie = state.get("lie", "fairway")
	match current_lie:
		"light_rough":
			base_accuracy -= 0.05
		"rough":
			base_accuracy -= 0.1
		"heavy_rough":
			base_accuracy -= 0.2
		"bunker":
			base_accuracy -= 0.15

	# Miss green chance from card
	var miss_chance = card.miss_green_chance

	# Determine outcome
	if accuracy_roll < base_accuracy * 0.15:
		result.quality = ShotQuality.PERFECT
		result.on_green = true
		result.putt_distance = randf_range(2, 8)  # Gimme range
		result.message = "Stiffed it! Inside 10 feet."
	elif accuracy_roll < base_accuracy * 0.5:
		result.quality = ShotQuality.GOOD
		result.on_green = true
		result.putt_distance = randf_range(10, 25)
		result.message = "Good shot, on the green."
	elif accuracy_roll < base_accuracy * (1.0 - miss_chance):
		result.quality = ShotQuality.OKAY
		result.on_green = true
		result.putt_distance = randf_range(25, 50)
		result.message = "On the green, long putt."
	elif accuracy_roll < base_accuracy + 0.1:
		if prevents_disaster:
			result.quality = ShotQuality.POOR
			result.on_green = false
			result.new_lie = "fringe"
			result.new_distance = randf_range(5, 15)
			result.message = "Just off the green."
		else:
			result.quality = ShotQuality.POOR
			result.on_green = false
			result.new_lie = "fringe"
			result.new_distance = randf_range(5, 20)
			result.message = "Missed the green."
	else:
		if prevents_disaster:
			result.quality = ShotQuality.POOR
			result.on_green = false
			result.new_lie = "rough"
			result.new_distance = randf_range(15, 30)
			result.message = "Avoided the worst, but missed badly."
		else:
			result.quality = ShotQuality.DISASTER
			# Check hazards
			if hole.has_greenside_bunker and randf() < 0.5:
				result.new_lie = "bunker"
				result.new_distance = randf_range(15, 30)
				result.message = "In the bunker!"
			elif hole.has_water_by_green and randf() < 0.3:
				result.new_lie = "water"
				result.strokes += 1
				result.new_distance = randf_range(30, 50)
				result.penalty = 1
				result.message = "In the water! Penalty stroke."
			else:
				result.new_lie = "rough"
				result.new_distance = randf_range(20, 40)
				result.message = "Way off target!"
			result.gained_status = "rattled"

	return result


static func _resolve_short_game(
	card: CardData,
	hole: HoleData,
	state: Dictionary,
	accuracy_bonus: float,
	prevents_disaster: bool
) -> ShotResult:

	var result = ShotResult.new()
	result.strokes = 1
	result.new_distance = 0
	result.new_lie = "green"
	result.on_green = true

	var accuracy_roll = randf()
	var base_accuracy = 0.6 + accuracy_bonus

	# Close chance from card
	var close_chance = card.close_chance

	# Lie affects short game too
	var current_lie = state.get("lie", "fringe")
	match current_lie:
		"rough":
			base_accuracy -= 0.1
		"heavy_rough":
			base_accuracy -= 0.15
		"bunker":
			base_accuracy -= 0.10  # Bunker shots with bunker card are okay

	# Determine outcome
	if accuracy_roll < close_chance + accuracy_bonus * 0.5:
		result.quality = ShotQuality.PERFECT
		result.putt_distance = randf_range(1, 5)
		# Chance to hole out
		if randf() < 0.05:
			result.holed_out = true
			result.strokes = 1
			result.message = "Holed it from off the green!"
		else:
			result.message = "Beautiful chip, tap-in range!"
	elif accuracy_roll < base_accuracy * 0.6:
		result.quality = ShotQuality.GOOD
		result.putt_distance = randf_range(5, 12)
		result.message = "Good chip, makeable putt."
	elif accuracy_roll < base_accuracy:
		result.quality = ShotQuality.OKAY
		result.putt_distance = randf_range(12, 25)
		result.message = "Decent chip."
	elif accuracy_roll < base_accuracy + 0.15:
		result.quality = ShotQuality.POOR
		result.putt_distance = randf_range(25, 40)
		result.message = "Chunked it."
	else:
		if prevents_disaster:
			result.quality = ShotQuality.POOR
			result.putt_distance = randf_range(30, 45)
			result.message = "Not great, but on the green."
		else:
			result.quality = ShotQuality.DISASTER
			result.on_green = false
			result.new_lie = "fringe"
			result.new_distance = randf_range(5, 15)
			result.gained_status = "rattled"
			result.message = "Bladed it over the green!"

	return result


static func _resolve_putt(
	card: CardData,
	hole: HoleData,
	state: Dictionary,
	accuracy_bonus: float
) -> ShotResult:

	var result = ShotResult.new()
	result.strokes = 0  # Will be set based on outcome
	result.new_distance = 0
	result.new_lie = "green"
	result.on_green = true

	var putt_distance = state.get("putt_distance", 20.0)

	# Base make percentage by distance
	var make_chance = _get_make_chance(putt_distance)
	make_chance += accuracy_bonus

	# Break knowledge bonus
	var break_known = state.get("break_known", false)
	if break_known:
		make_chance += 0.10

	# Card bonuses already in accuracy_bonus

	var roll = randf()

	if roll < make_chance:
		# Made it!
		result.holed_out = true
		result.strokes = 1
		result.quality = ShotQuality.PERFECT
		if putt_distance > 20:
			result.message = "Drains the long putt!"
		elif putt_distance > 10:
			result.message = "Makes it!"
		else:
			result.message = "In the hole!"
	else:
		# Missed - how bad?
		var miss_roll = randf()
		var is_lag = card.id.contains("lag")

		if is_lag or miss_roll < 0.7:
			# Good miss, tap-in
			result.strokes = 2
			result.quality = ShotQuality.GOOD
			result.holed_out = true  # 2-putt complete
			result.message = "Good lag, easy tap-in."
		elif miss_roll < 0.9:
			# Okay miss, shortish putt left
			result.strokes = 1
			result.putt_distance = randf_range(3, 6)
			result.quality = ShotQuality.OKAY
			result.message = "Left a tester."
		else:
			# Bad miss, possible 3-putt
			result.strokes = 1
			result.putt_distance = randf_range(5, 10)
			result.quality = ShotQuality.POOR
			result.message = "Poor pace, tricky comebacker."

	return result


static func _get_make_chance(distance_feet: float) -> float:
	## Approximate tour make percentages
	if distance_feet <= 3:
		return 0.95
	elif distance_feet <= 5:
		return 0.75
	elif distance_feet <= 10:
		return 0.40
	elif distance_feet <= 15:
		return 0.25
	elif distance_feet <= 20:
		return 0.15
	elif distance_feet <= 30:
		return 0.08
	else:
		return 0.03
