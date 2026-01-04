extends Resource
class_name TrinketData
## Resource class defining a trinket (relic) and its effects

enum TrinketRarity { STARTER, COMMON, UNCOMMON, RARE, BOSS }

@export_group("Basic Info")
@export var id: String = ""
@export var trinket_name: String = ""
@export_multiline var description: String = ""
@export var rarity: TrinketRarity = TrinketRarity.COMMON
@export var flavor_text: String = ""

@export_group("Starting Trinket Properties")
@export var is_starting_trinket: bool = false
@export var starter_deck_modifier: String = ""  ## ID of card to add to starter deck
@export var starting_confidence_bonus: int = 0
@export var max_strokes_modifier: int = 0  ## Negative = harder (lose at fewer over par)

@export_group("Passive Effects")
@export var confidence_per_hole: int = 0  ## Extra confidence each hole
@export var extra_card_draw: int = 0  ## Extra cards in starting hand
@export var safe_play_per_hole: int = 0  ## Start with safe play stacks
@export var putt_bonus: float = 0.0  ## Percentage bonus to putt make chance
@export var approach_bonus: float = 0.0  ## Percentage bonus to approach accuracy
@export var wind_reduction: float = 0.0  ## Reduce wind effects (0.0 to 1.0)
@export var heal_bonus: int = 0  ## Extra healing at rest sites

@export_group("Reveal Effects")
@export var auto_reveal_wind: bool = false
@export var auto_reveal_distance: bool = false
@export var auto_reveal_break: bool = false
@export var auto_reveal_lie: bool = false

@export_group("Trigger Effects")
@export var on_birdie_effect: String = ""  ## Effect triggered on birdie
@export var on_par_effect: String = ""  ## Effect triggered on par
@export var on_bogey_effect: String = ""  ## Effect triggered on bogey
@export var on_hole_start_status: String = ""  ## Status applied at hole start

@export_group("Special Effects")
@export var card_reward_bonus: int = 0  ## See extra cards in rewards
@export var shop_discount: float = 0.0  ## Percentage discount (0.0 to 1.0)
@export var signature_hole_bonus: float = 0.0  ## Bonus on boss/signature holes

@export_group("Visuals")
@export var icon: Texture2D = null


func get_rarity_color() -> Color:
	match rarity:
		TrinketRarity.STARTER:
			return Color.LIGHT_GRAY
		TrinketRarity.COMMON:
			return Color.WHITE
		TrinketRarity.UNCOMMON:
			return Color.CORNFLOWER_BLUE
		TrinketRarity.RARE:
			return Color.GOLD
		TrinketRarity.BOSS:
			return Color.MEDIUM_PURPLE
	return Color.WHITE


func get_tooltip() -> String:
	var text = description
	if flavor_text != "":
		text += "\n\n\"%s\"" % flavor_text
	return text
