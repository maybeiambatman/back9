extends Control
class_name Card
## Visual representation of a card that can be played

signal card_clicked(card: Card)
signal card_hovered(card: Card)
signal card_unhovered(card: Card)
signal card_played(card: Card)

@export var card_data: CardData

# Node references (set up in _ready based on scene structure)
var card_panel: Panel
var card_name_label: Label
var card_description: RichTextLabel
var cost_label: Label
var type_indicator: ColorRect
var rarity_border: Panel
var hover_highlight: Panel
var card_art: TextureRect

var is_playable: bool = true
var is_selected: bool = false
var is_dragging: bool = false
var original_position: Vector2
var hand_index: int = 0

const CARD_WIDTH = 180
const CARD_HEIGHT = 250


func _ready() -> void:
	custom_minimum_size = Vector2(CARD_WIDTH, CARD_HEIGHT)
	_setup_card_visuals()

	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	gui_input.connect(_on_gui_input)


func _setup_card_visuals() -> void:
	## Create the card visual structure programmatically
	# Main card panel
	card_panel = Panel.new()
	card_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(card_panel)

	# Create card style
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
	style.border_color = Color.WHITE
	card_panel.add_theme_stylebox_override("panel", style)

	# Type indicator (colored bar at top)
	type_indicator = ColorRect.new()
	type_indicator.position = Vector2(10, 10)
	type_indicator.size = Vector2(CARD_WIDTH - 20, 8)
	type_indicator.color = Color(0.2, 0.6, 0.2)
	card_panel.add_child(type_indicator)

	# Card name
	card_name_label = Label.new()
	card_name_label.position = Vector2(10, 22)
	card_name_label.size = Vector2(CARD_WIDTH - 20, 30)
	card_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card_name_label.add_theme_font_size_override("font_size", 16)
	card_name_label.add_theme_color_override("font_color", Color.WHITE)
	card_panel.add_child(card_name_label)

	# Card art placeholder
	card_art = TextureRect.new()
	card_art.position = Vector2(15, 55)
	card_art.size = Vector2(CARD_WIDTH - 30, 80)
	card_art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	card_panel.add_child(card_art)

	# Art background
	var art_bg = ColorRect.new()
	art_bg.position = Vector2(15, 55)
	art_bg.size = Vector2(CARD_WIDTH - 30, 80)
	art_bg.color = Color(0.1, 0.1, 0.1)
	art_bg.z_index = -1
	card_panel.add_child(art_bg)

	# Description
	card_description = RichTextLabel.new()
	card_description.position = Vector2(10, 140)
	card_description.size = Vector2(CARD_WIDTH - 20, 70)
	card_description.bbcode_enabled = true
	card_description.fit_content = false
	card_description.scroll_active = false
	card_description.add_theme_font_size_override("normal_font_size", 12)
	card_description.add_theme_color_override("default_color", Color(0.9, 0.9, 0.9))
	card_panel.add_child(card_description)

	# Cost indicator
	var cost_bg = ColorRect.new()
	cost_bg.position = Vector2(CARD_WIDTH - 40, CARD_HEIGHT - 40)
	cost_bg.size = Vector2(30, 30)
	cost_bg.color = Color(0.8, 0.6, 0.2)
	card_panel.add_child(cost_bg)

	cost_label = Label.new()
	cost_label.position = Vector2(CARD_WIDTH - 40, CARD_HEIGHT - 40)
	cost_label.size = Vector2(30, 30)
	cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cost_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	cost_label.add_theme_font_size_override("font_size", 18)
	cost_label.add_theme_color_override("font_color", Color.WHITE)
	card_panel.add_child(cost_label)

	# Hover highlight (initially hidden)
	hover_highlight = Panel.new()
	hover_highlight.set_anchors_preset(Control.PRESET_FULL_RECT)
	hover_highlight.visible = false
	var highlight_style = StyleBoxFlat.new()
	highlight_style.bg_color = Color(1, 1, 1, 0.1)
	highlight_style.corner_radius_top_left = 10
	highlight_style.corner_radius_top_right = 10
	highlight_style.corner_radius_bottom_left = 10
	highlight_style.corner_radius_bottom_right = 10
	hover_highlight.add_theme_stylebox_override("panel", highlight_style)
	add_child(hover_highlight)

	# Rarity border (overlays card panel)
	rarity_border = Panel.new()
	rarity_border.set_anchors_preset(Control.PRESET_FULL_RECT)
	rarity_border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var rarity_style = StyleBoxFlat.new()
	rarity_style.bg_color = Color(0, 0, 0, 0)  # Transparent
	rarity_style.corner_radius_top_left = 10
	rarity_style.corner_radius_top_right = 10
	rarity_style.corner_radius_bottom_left = 10
	rarity_style.corner_radius_bottom_right = 10
	rarity_style.border_width_left = 3
	rarity_style.border_width_right = 3
	rarity_style.border_width_top = 3
	rarity_style.border_width_bottom = 3
	rarity_style.border_color = Color.WHITE
	rarity_border.add_theme_stylebox_override("panel", rarity_style)
	add_child(rarity_border)

	if card_data:
		setup_card(card_data)


func setup_card(data: CardData) -> void:
	card_data = data

	if card_name_label:
		card_name_label.text = data.get_display_name()

	if card_description:
		card_description.text = data.description

	if cost_label:
		cost_label.text = str(data.confidence_cost)

	if card_art and data.icon:
		card_art.texture = data.icon

	# Color by type
	if type_indicator:
		type_indicator.color = data.get_type_color()

	# Update rarity border color
	_update_rarity_border()

	# Upgraded indicator
	if data.is_upgraded and card_name_label:
		card_name_label.modulate = Color.GOLD


func _update_rarity_border() -> void:
	if not card_data or not rarity_border:
		return

	var style = rarity_border.get_theme_stylebox("panel") as StyleBoxFlat
	if style:
		style.border_color = card_data.get_rarity_color()


func set_playable(playable: bool) -> void:
	is_playable = playable
	modulate = Color.WHITE if playable else Color(0.5, 0.5, 0.5)


func _on_mouse_entered() -> void:
	if is_playable:
		hover_highlight.visible = true
		# Raise card slightly
		var tween = create_tween()
		tween.tween_property(self, "position:y", original_position.y - 30, 0.1)
		card_hovered.emit(self)
		AudioManager.play_card_hover()


func _on_mouse_exited() -> void:
	hover_highlight.visible = false
	if not is_selected:
		var tween = create_tween()
		tween.tween_property(self, "position:y", original_position.y, 0.1)
	card_unhovered.emit(self)


func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			if is_playable:
				card_clicked.emit(self)
				AudioManager.play_button_click()


func select() -> void:
	is_selected = true
	# Move card up more to indicate selection
	var tween = create_tween()
	tween.tween_property(self, "position:y", original_position.y - 60, 0.1)


func deselect() -> void:
	is_selected = false
	var tween = create_tween()
	tween.tween_property(self, "position:y", original_position.y, 0.1)


func return_to_hand() -> void:
	var tween = create_tween()
	tween.tween_property(self, "position", original_position, 0.2)
	is_selected = false


func play_animation() -> void:
	## Card flies to center and fades
	AudioManager.play_card_play()

	var tween = create_tween()
	tween.set_parallel(true)

	var center = get_viewport_rect().size / 2 - size / 2
	tween.tween_property(self, "position", center, 0.3).set_trans(Tween.TRANS_QUAD)
	tween.tween_property(self, "scale", Vector2(1.3, 1.3), 0.2)
	tween.tween_property(self, "modulate:a", 0.0, 0.3).set_delay(0.2)

	await tween.finished
	card_played.emit(self)


func get_card_tooltip() -> String:
	if card_data:
		return card_data.get_tooltip()
	return ""
