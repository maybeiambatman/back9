extends Resource
class_name HoleData
## Resource class defining a golf hole's properties

enum HoleType { STANDARD, ELITE, BOSS }
enum PinPosition { FRONT_LEFT, FRONT_CENTER, FRONT_RIGHT, CENTER_LEFT, CENTER, CENTER_RIGHT, BACK_LEFT, BACK_CENTER, BACK_RIGHT }

@export_group("Basic Info")
@export var id: String = ""
@export var hole_name: String = ""
@export var hole_number: int = 1
@export var par: int = 4
@export var total_distance: int = 400  ## yards
@export var hole_type: HoleType = HoleType.STANDARD
@export var difficulty: int = 1  ## 1-5 stars

@export_group("Layout")
@export var pin_position: PinPosition = PinPosition.CENTER
@export var green_size: float = 1.0  ## Multiplier (1.0 = standard)
@export var fairway_width: float = 1.0  ## Multiplier (1.0 = standard)

@export_group("Hazards")
@export var has_water_off_tee: bool = false
@export var has_water_by_green: bool = false
@export var has_greenside_bunker: bool = true
@export var has_fairway_bunker: bool = false
@export var hazard_positions: Array[String] = []  ## "left", "right", "front", "back"

@export_group("Conditions")
@export var wind_direction: String = "calm"  ## "helping", "hurting", "left", "right", "calm"
@export var wind_strength: float = 0.0  ## 0-20 mph
@export var green_speed: String = "medium"  ## "slow", "medium", "fast", "very_fast"
@export var lie_always_visible: bool = false

@export_group("Signature Hole Properties")
@export var is_signature: bool = false
@export_multiline var signature_description: String = ""
@export var special_mechanics: Array[String] = []  ## Special rules for this hole

@export_group("Visuals")
@export var background: Texture2D = null
@export var hole_layout_image: Texture2D = null


func get_par_name() -> String:
	match par:
		3: return "Par 3"
		4: return "Par 4"
		5: return "Par 5"
		_: return "Par %d" % par


func get_difficulty_string() -> String:
	var stars = ""
	for i in range(difficulty):
		stars += "★"
	for i in range(5 - difficulty):
		stars += "☆"
	return stars


func get_pin_description() -> String:
	match pin_position:
		PinPosition.FRONT_LEFT: return "Front left"
		PinPosition.FRONT_CENTER: return "Front center"
		PinPosition.FRONT_RIGHT: return "Front right"
		PinPosition.CENTER_LEFT: return "Center left"
		PinPosition.CENTER: return "Center"
		PinPosition.CENTER_RIGHT: return "Center right"
		PinPosition.BACK_LEFT: return "Back left, tucked"
		PinPosition.BACK_CENTER: return "Back center"
		PinPosition.BACK_RIGHT: return "Back right, tucked"
	return "Unknown"


func get_hazard_description() -> String:
	var hazards = []
	if has_water_off_tee:
		hazards.append("Water off tee")
	if has_water_by_green:
		hazards.append("Water by green")
	if has_greenside_bunker:
		hazards.append("Greenside bunker")
	if has_fairway_bunker:
		hazards.append("Fairway bunker")
	if hazards.is_empty():
		return "None"
	return ", ".join(hazards)


func get_wind_description(revealed: bool = true) -> String:
	if not revealed:
		return "???"
	if wind_strength == 0:
		return "Calm"
	var direction_text = ""
	match wind_direction:
		"helping": direction_text = "helping"
		"hurting": direction_text = "into"
		"left": direction_text = "left to right"
		"right": direction_text = "right to left"
		_: direction_text = wind_direction
	return "%d mph %s" % [int(wind_strength), direction_text]
