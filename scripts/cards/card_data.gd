extends Resource
class_name CardData
## Resource class defining a card's properties and effects

enum CardType { SHOT, READ, MENTAL }
enum CardRarity { COMMON, UNCOMMON, RARE, SPECIAL }
enum ShotCategory { NONE, TEE, APPROACH, SHORT_GAME, PUTT, BUNKER }

@export_group("Basic Info")
@export var id: String = ""
@export var card_name: String = ""
@export_multiline var description: String = ""
@export var card_type: CardType = CardType.SHOT
@export var rarity: CardRarity = CardRarity.COMMON
@export var confidence_cost: int = 1
@export var is_exhaust: bool = false  ## Remove from deck when played
@export var is_ethereal: bool = false  ## Remove at end of hole if not played

@export_group("Shot Properties")
@export var shot_category: ShotCategory = ShotCategory.NONE
@export var distance_effect: int = 0  ## Negative = yards toward hole
@export var accuracy_modifier: float = 0.0  ## Bonus/penalty to outcome
@export var miss_green_chance: float = 0.0  ## For approach shots
@export var close_chance: float = 0.0  ## Chance to be inside 10 feet
@export var ignores_wind: bool = false
@export var ignores_lie: bool = false
@export var rough_chance: float = 0.0  ## Chance to find rough on tee shot

@export_group("Read Properties")
@export var reveals_wind: bool = false
@export var reveals_break: bool = false
@export var reveals_lie: bool = false
@export var reveals_distance: bool = false
@export var accuracy_bonus_after_reveal: float = 0.0

@export_group("Mental Properties")
@export var confidence_gain: int = 0
@export var safe_play_gain: int = 0
@export var status_to_apply: String = ""
@export var status_to_remove: String = ""
@export var cards_to_draw: int = 0
@export var cards_to_discard: int = 0
@export var prevents_disaster: bool = false
@export var max_bogey: bool = false  ## Cannot go worse than bogey

@export_group("Upgrade")
@export var upgraded_version: CardData = null
@export var is_upgraded: bool = false

@export_group("Visuals")
@export var icon: Texture2D = null
@export var flavor_text: String = ""


func get_display_name() -> String:
	if is_upgraded:
		return card_name + "+"
	return card_name


func get_tooltip() -> String:
	var text = description
	if confidence_cost > 0:
		text += "\n\nCost: %d Confidence" % confidence_cost
	elif confidence_cost == 0:
		text += "\n\nCost: 0 (Free)"
	if is_exhaust:
		text += "\nExhaust"
	if is_ethereal:
		text += "\nEthereal"
	return text


func get_rarity_color() -> Color:
	match rarity:
		CardRarity.COMMON:
			return Color.WHITE
		CardRarity.UNCOMMON:
			return Color.CORNFLOWER_BLUE
		CardRarity.RARE:
			return Color.GOLD
		CardRarity.SPECIAL:
			return Color.MEDIUM_PURPLE
	return Color.WHITE


func get_type_color() -> Color:
	match card_type:
		CardType.SHOT:
			return Color(0.2, 0.6, 0.2)  # Green
		CardType.READ:
			return Color(0.2, 0.4, 0.8)  # Blue
		CardType.MENTAL:
			return Color(0.6, 0.2, 0.6)  # Purple
	return Color.WHITE


func duplicate_card() -> CardData:
	var copy = CardData.new()
	copy.id = id
	copy.card_name = card_name
	copy.description = description
	copy.card_type = card_type
	copy.rarity = rarity
	copy.confidence_cost = confidence_cost
	copy.is_exhaust = is_exhaust
	copy.is_ethereal = is_ethereal
	copy.shot_category = shot_category
	copy.distance_effect = distance_effect
	copy.accuracy_modifier = accuracy_modifier
	copy.miss_green_chance = miss_green_chance
	copy.close_chance = close_chance
	copy.ignores_wind = ignores_wind
	copy.ignores_lie = ignores_lie
	copy.rough_chance = rough_chance
	copy.reveals_wind = reveals_wind
	copy.reveals_break = reveals_break
	copy.reveals_lie = reveals_lie
	copy.reveals_distance = reveals_distance
	copy.accuracy_bonus_after_reveal = accuracy_bonus_after_reveal
	copy.confidence_gain = confidence_gain
	copy.safe_play_gain = safe_play_gain
	copy.status_to_apply = status_to_apply
	copy.status_to_remove = status_to_remove
	copy.cards_to_draw = cards_to_draw
	copy.cards_to_discard = cards_to_discard
	copy.prevents_disaster = prevents_disaster
	copy.max_bogey = max_bogey
	copy.upgraded_version = upgraded_version
	copy.is_upgraded = is_upgraded
	copy.icon = icon
	copy.flavor_text = flavor_text
	return copy
