extends Control
class_name CardHand
## Manages the player's hand of cards with fan layout and interactions

signal card_selected(card: Card)
signal card_deselected()
signal card_play_requested(card: Card)  # Emitted when clicking a selected card
signal card_played(card: Card, card_data: CardData)

@export var card_scene: PackedScene
@export var max_hand_size: int = 10
@export var card_spacing: float = 100.0
@export var card_arc_height: float = 30.0
@export var card_rotation_amount: float = 3.0
@export var hand_y_offset: float = 50.0

var cards: Array[Card] = []
var selected_card: Card = null
var hand_center: Vector2 = Vector2.ZERO


func _ready() -> void:
	# Load card scene if not set
	if card_scene == null:
		card_scene = preload("res://scenes/cards/card.tscn")

	# Calculate hand center position (bottom center of screen)
	_update_hand_center()
	get_viewport().size_changed.connect(_on_viewport_size_changed)


func _on_viewport_size_changed() -> void:
	_update_hand_center()
	arrange_cards()


func _update_hand_center() -> void:
	var viewport_size = get_viewport_rect().size
	hand_center = Vector2(viewport_size.x / 2, viewport_size.y - hand_y_offset)


func add_card(card_data: CardData) -> Card:
	if cards.size() >= max_hand_size:
		return null

	var card = card_scene.instantiate() as Card
	card.setup_card(card_data)
	card.card_clicked.connect(_on_card_clicked)
	card.card_hovered.connect(_on_card_hovered)
	card.card_unhovered.connect(_on_card_unhovered)
	add_child(card)
	cards.append(card)

	arrange_cards()
	AudioManager.play_card_draw()

	return card


func remove_card(card: Card) -> void:
	cards.erase(card)
	card.queue_free()
	arrange_cards()


func arrange_cards() -> void:
	var count = cards.size()
	if count == 0:
		return

	_update_hand_center()

	# Calculate total hand width
	var total_width = (count - 1) * card_spacing
	var start_x = hand_center.x - total_width / 2

	for i in range(count):
		var card = cards[i]
		card.hand_index = i

		# Calculate position with arc
		var x = start_x + i * card_spacing - card.size.x / 2
		var normalized_pos = float(i) / max(count - 1, 1)  # 0 to 1
		var arc_offset = sin(normalized_pos * PI) * card_arc_height
		var y = hand_center.y - card.size.y - arc_offset

		# Calculate rotation (cards fan out slightly)
		var rotation_offset = (normalized_pos - 0.5) * 2  # -1 to 1
		var card_rotation = rotation_offset * card_rotation_amount

		card.original_position = Vector2(x, y)
		card.position = card.original_position
		card.rotation_degrees = card_rotation
		card.z_index = i  # Cards stack properly


func _on_card_clicked(card: Card) -> void:
	if selected_card == card:
		# Clicking selected card = play it
		card_play_requested.emit(card)
	else:
		# Select new card
		if selected_card:
			selected_card.deselect()
		selected_card = card
		card.select()
		card_selected.emit(card)


func _on_card_hovered(card: Card) -> void:
	# Bring hovered card to front
	card.z_index = 100


func _on_card_unhovered(card: Card) -> void:
	# Restore z-index
	card.z_index = card.hand_index


func play_selected_card() -> void:
	if selected_card:
		var card = selected_card
		var data = card.card_data
		selected_card = null

		await card.play_animation()

		cards.erase(card)
		card.queue_free()
		arrange_cards()

		card_played.emit(card, data)


func get_selected_card() -> Card:
	return selected_card


func get_selected_card_data() -> CardData:
	if selected_card:
		return selected_card.card_data
	return null


func clear_hand() -> void:
	for card in cards:
		card.queue_free()
	cards.clear()
	selected_card = null


func set_cards_playable(confidence: int) -> void:
	for card in cards:
		card.set_playable(card.card_data.confidence_cost <= confidence)


func get_cards_of_type(card_type: CardData.CardType) -> Array[Card]:
	var result: Array[Card] = []
	for card in cards:
		if card.card_data.card_type == card_type:
			result.append(card)
	return result


func has_shot_card() -> bool:
	for card in cards:
		if card.card_data.card_type == CardData.CardType.SHOT:
			return true
	return false


func discard_random_card() -> CardData:
	if cards.is_empty():
		return null

	var index = randi() % cards.size()
	var card = cards[index]
	var data = card.card_data

	remove_card(card)
	return data
