extends RefCounted
class_name Deck
## Manages the player's deck of cards including draw pile, discard pile, and exhaust pile

signal deck_shuffled()
signal card_drawn(card: CardData)
signal card_discarded(card: CardData)
signal card_exhausted(card: CardData)

var draw_pile: Array[CardData] = []
var discard_pile: Array[CardData] = []
var exhaust_pile: Array[CardData] = []
var hand: Array[CardData] = []

var _rng: RandomNumberGenerator = RandomNumberGenerator.new()


func _init() -> void:
	_rng.randomize()


func add_starter_cards(modifier: String = "") -> void:
	## Add the default starter deck cards
	var card_db = CardDatabase if CardDatabase else null
	if card_db == null:
		push_warning("CardDatabase not available, cannot add starter cards")
		return

	# Default starter deck
	var starter_card_ids = [
		"driver",
		"safe_drive",
		"stock_iron",
		"stock_iron",
		"smart_play",
		"bump_and_run",
		"lag_putt",
		"lag_putt",
		"check_wind",
		"stay_calm",
	]

	for card_id in starter_card_ids:
		var card = card_db.get_card(card_id)
		if card:
			draw_pile.append(card.duplicate_card())

	# Add modifier card from starting trinket
	if modifier != "":
		var bonus_card = card_db.get_card(modifier)
		if bonus_card:
			draw_pile.append(bonus_card.duplicate_card())

	shuffle_draw_pile()


func add_card(card: CardData) -> void:
	## Add a card to the deck (goes to discard pile)
	discard_pile.append(card)


func remove_card(card: CardData) -> bool:
	## Permanently remove a card from the deck
	# Check draw pile
	for i in range(draw_pile.size() - 1, -1, -1):
		if draw_pile[i].id == card.id:
			draw_pile.remove_at(i)
			return true
	# Check discard pile
	for i in range(discard_pile.size() - 1, -1, -1):
		if discard_pile[i].id == card.id:
			discard_pile.remove_at(i)
			return true
	return false


func replace_card(old_card: CardData, new_card: CardData) -> bool:
	## Replace a card with another (used for upgrades)
	# Check draw pile
	for i in range(draw_pile.size()):
		if draw_pile[i].id == old_card.id:
			draw_pile[i] = new_card
			return true
	# Check discard pile
	for i in range(discard_pile.size()):
		if discard_pile[i].id == old_card.id:
			discard_pile[i] = new_card
			return true
	return false


func draw_cards(count: int) -> Array[CardData]:
	## Draw cards from the draw pile into hand
	var drawn: Array[CardData] = []

	for i in range(count):
		if draw_pile.is_empty():
			if discard_pile.is_empty():
				break  # No cards left to draw
			shuffle_discard_into_draw()

		if not draw_pile.is_empty():
			var card = draw_pile.pop_back()
			hand.append(card)
			drawn.append(card)
			card_drawn.emit(card)

	return drawn


func discard(card: CardData) -> void:
	## Move a card from hand to discard pile
	var index = hand.find(card)
	if index != -1:
		hand.remove_at(index)
	discard_pile.append(card)
	card_discarded.emit(card)


func discard_hand() -> void:
	## Discard all cards in hand
	for card in hand:
		discard_pile.append(card)
		card_discarded.emit(card)
	hand.clear()


func exhaust(card: CardData) -> void:
	## Move a card to exhaust pile (removed for rest of combat/hole)
	var index = hand.find(card)
	if index != -1:
		hand.remove_at(index)
	exhaust_pile.append(card)
	card_exhausted.emit(card)


func shuffle_draw_pile() -> void:
	## Shuffle the draw pile
	for i in range(draw_pile.size() - 1, 0, -1):
		var j = _rng.randi_range(0, i)
		var temp = draw_pile[i]
		draw_pile[i] = draw_pile[j]
		draw_pile[j] = temp
	deck_shuffled.emit()


func shuffle_discard_into_draw() -> void:
	## Move discard pile to draw pile and shuffle
	draw_pile.append_array(discard_pile)
	discard_pile.clear()
	shuffle_draw_pile()


func reset_for_new_hole() -> void:
	## Reset deck state for a new hole (exhaust pile stays exhausted for the hole)
	# Move hand and discard back to draw
	draw_pile.append_array(hand)
	draw_pile.append_array(discard_pile)
	hand.clear()
	discard_pile.clear()
	shuffle_draw_pile()


func end_hole() -> void:
	## Called at end of hole - restore exhausted cards
	draw_pile.append_array(hand)
	draw_pile.append_array(discard_pile)
	draw_pile.append_array(exhaust_pile)
	hand.clear()
	discard_pile.clear()
	exhaust_pile.clear()
	shuffle_draw_pile()


func get_all_cards() -> Array[CardData]:
	## Get all cards in the deck (for viewing deck contents)
	var all_cards: Array[CardData] = []
	all_cards.append_array(draw_pile)
	all_cards.append_array(discard_pile)
	all_cards.append_array(hand)
	# Don't include exhaust pile as those are temporarily removed
	return all_cards


func get_full_deck() -> Array[CardData]:
	## Get complete deck including exhausted cards (for between-hole viewing)
	var all_cards: Array[CardData] = []
	all_cards.append_array(draw_pile)
	all_cards.append_array(discard_pile)
	all_cards.append_array(hand)
	all_cards.append_array(exhaust_pile)
	return all_cards


func get_draw_pile_size() -> int:
	return draw_pile.size()


func get_discard_pile_size() -> int:
	return discard_pile.size()


func get_hand_size() -> int:
	return hand.size()


func get_exhaust_pile_size() -> int:
	return exhaust_pile.size()
