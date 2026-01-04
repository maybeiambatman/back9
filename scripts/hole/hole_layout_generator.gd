extends RefCounted
class_name HoleLayoutGenerator
## Generates ASCII art representations of golf holes

const LAYOUT_WIDTH = 40
const LAYOUT_HEIGHT = 25

# Characters for different terrain
const CHAR_FAIRWAY = "░"
const CHAR_ROUGH = "▒"
const CHAR_GREEN = "●"
const CHAR_TEE = "T"
const CHAR_PIN = "⚑"
const CHAR_WATER = "~"
const CHAR_BUNKER = "▓"
const CHAR_TREE = "♣"
const CHAR_BALL = "○"
const CHAR_EMPTY = " "


class HoleLayout:
	var grid: Array = []
	var width: int = LAYOUT_WIDTH
	var height: int = LAYOUT_HEIGHT
	var tee_pos: Vector2i
	var green_pos: Vector2i
	var pin_pos: Vector2i
	var ball_pos: Vector2i
	var hazards: Array[Dictionary] = []

	func _init(w: int = LAYOUT_WIDTH, h: int = LAYOUT_HEIGHT) -> void:
		width = w
		height = h
		_init_grid()

	func _init_grid() -> void:
		grid.clear()
		for y in range(height):
			var row = []
			for x in range(width):
				row.append(CHAR_EMPTY)
			grid.append(row)

	func set_cell(x: int, y: int, char: String) -> void:
		if x >= 0 and x < width and y >= 0 and y < height:
			grid[y][x] = char

	func get_cell(x: int, y: int) -> String:
		if x >= 0 and x < width and y >= 0 and y < height:
			return grid[y][x]
		return CHAR_EMPTY

	func to_string_array() -> Array[String]:
		var lines: Array[String] = []
		for row in grid:
			lines.append("".join(row))
		return lines

	func render() -> String:
		var lines = to_string_array()
		return "\n".join(lines)


static func generate_layout(hole_data: HoleData, ball_distance: float = -1, on_green: bool = false) -> HoleLayout:
	var layout = HoleLayout.new()
	var rng = RandomNumberGenerator.new()
	rng.seed = hash(hole_data.id)  # Consistent layout for same hole

	# Determine hole shape based on par
	match hole_data.par:
		3:
			_generate_par3(layout, hole_data, rng)
		4:
			_generate_par4(layout, hole_data, rng)
		5:
			_generate_par5(layout, hole_data, rng)
		_:
			_generate_par4(layout, hole_data, rng)

	# Add hazards
	_add_hazards(layout, hole_data, rng)

	# Place ball based on distance
	if ball_distance >= 0:
		_place_ball(layout, hole_data, ball_distance, on_green)

	return layout


static func _generate_par3(layout: HoleLayout, hole_data: HoleData, rng: RandomNumberGenerator) -> void:
	# Par 3: Short, tee to green
	var center_x = layout.width / 2

	# Tee at bottom
	layout.tee_pos = Vector2i(center_x, layout.height - 3)
	layout.set_cell(layout.tee_pos.x, layout.tee_pos.y, CHAR_TEE)

	# Green at top
	var green_y = 4
	var green_size = 4
	layout.green_pos = Vector2i(center_x, green_y)

	# Draw green (circular-ish)
	for dy in range(-green_size/2, green_size/2 + 1):
		for dx in range(-green_size/2, green_size/2 + 1):
			if dx*dx + dy*dy <= (green_size/2)*(green_size/2) + 1:
				layout.set_cell(center_x + dx, green_y + dy, CHAR_GREEN)

	# Pin position based on hole data
	var pin_offset = _get_pin_offset(hole_data.pin_position)
	layout.pin_pos = Vector2i(center_x + pin_offset.x, green_y + pin_offset.y)
	layout.set_cell(layout.pin_pos.x, layout.pin_pos.y, CHAR_PIN)

	# Fairway/approach area
	for y in range(green_y + green_size/2 + 1, layout.tee_pos.y):
		var width_at_y = 3 + int((layout.tee_pos.y - y) * 0.3)
		for dx in range(-width_at_y, width_at_y + 1):
			if layout.get_cell(center_x + dx, y) == CHAR_EMPTY:
				layout.set_cell(center_x + dx, y, CHAR_FAIRWAY)

	# Rough around fairway
	_add_rough_border(layout)


static func _generate_par4(layout: HoleLayout, hole_data: HoleData, rng: RandomNumberGenerator) -> void:
	# Par 4: Tee shot landing area, then approach
	var center_x = layout.width / 2
	var dogleg = rng.randf_range(-0.3, 0.3)  # Slight dogleg

	# Tee at bottom
	layout.tee_pos = Vector2i(center_x, layout.height - 3)
	layout.set_cell(layout.tee_pos.x, layout.tee_pos.y, CHAR_TEE)

	# Green position (with possible offset for dogleg)
	var green_y = 4
	var green_x = center_x + int(dogleg * 8)
	var green_size = 4
	layout.green_pos = Vector2i(green_x, green_y)

	# Draw green
	for dy in range(-green_size/2, green_size/2 + 1):
		for dx in range(-green_size/2, green_size/2 + 1):
			if dx*dx + dy*dy <= (green_size/2)*(green_size/2) + 1:
				layout.set_cell(green_x + dx, green_y + dy, CHAR_GREEN)

	# Pin
	var pin_offset = _get_pin_offset(hole_data.pin_position)
	layout.pin_pos = Vector2i(green_x + pin_offset.x, green_y + pin_offset.y)
	layout.set_cell(layout.pin_pos.x, layout.pin_pos.y, CHAR_PIN)

	# Landing zone (middle of hole)
	var landing_y = layout.height / 2
	var landing_x = center_x + int(dogleg * 4)

	# Fairway from tee to landing zone
	for y in range(landing_y, layout.tee_pos.y):
		var progress = float(layout.tee_pos.y - y) / float(layout.tee_pos.y - landing_y)
		var current_x = lerp(float(center_x), float(landing_x), progress)
		var width_at_y = 4 + int(sin(progress * PI) * 2)
		for dx in range(-width_at_y, width_at_y + 1):
			var x = int(current_x) + dx
			if layout.get_cell(x, y) == CHAR_EMPTY:
				layout.set_cell(x, y, CHAR_FAIRWAY)

	# Fairway from landing zone to green
	for y in range(green_y + green_size/2, landing_y + 1):
		var progress = float(landing_y - y) / float(landing_y - green_y)
		var current_x = lerp(float(landing_x), float(green_x), progress)
		var width_at_y = 3 + int((1.0 - progress) * 2)
		for dx in range(-width_at_y, width_at_y + 1):
			var x = int(current_x) + dx
			if layout.get_cell(x, y) == CHAR_EMPTY:
				layout.set_cell(x, y, CHAR_FAIRWAY)

	# Rough around fairway
	_add_rough_border(layout)


static func _generate_par5(layout: HoleLayout, hole_data: HoleData, rng: RandomNumberGenerator) -> void:
	# Par 5: Two doglegs possible, longer
	var center_x = layout.width / 2
	var dogleg1 = rng.randf_range(-0.3, 0.3)
	var dogleg2 = rng.randf_range(-0.2, 0.2)

	# Tee at bottom
	layout.tee_pos = Vector2i(center_x, layout.height - 2)
	layout.set_cell(layout.tee_pos.x, layout.tee_pos.y, CHAR_TEE)

	# Green position
	var green_y = 3
	var green_x = center_x + int((dogleg1 + dogleg2) * 6)
	green_x = clamp(green_x, 5, layout.width - 5)
	var green_size = 5
	layout.green_pos = Vector2i(green_x, green_y)

	# Draw green
	for dy in range(-green_size/2, green_size/2 + 1):
		for dx in range(-green_size/2, green_size/2 + 1):
			if dx*dx + dy*dy <= (green_size/2)*(green_size/2) + 2:
				layout.set_cell(green_x + dx, green_y + dy, CHAR_GREEN)

	# Pin
	var pin_offset = _get_pin_offset(hole_data.pin_position)
	layout.pin_pos = Vector2i(green_x + pin_offset.x, green_y + pin_offset.y)
	layout.set_cell(layout.pin_pos.x, layout.pin_pos.y, CHAR_PIN)

	# Two landing zones
	var landing1_y = int(layout.height * 0.65)
	var landing1_x = center_x + int(dogleg1 * 5)
	var landing2_y = int(layout.height * 0.35)
	var landing2_x = landing1_x + int(dogleg2 * 5)

	# Draw fairway segments
	_draw_fairway_segment(layout, center_x, layout.tee_pos.y - 1, landing1_x, landing1_y, 5)
	_draw_fairway_segment(layout, landing1_x, landing1_y, landing2_x, landing2_y, 4)
	_draw_fairway_segment(layout, landing2_x, landing2_y, green_x, green_y + green_size/2, 3)

	_add_rough_border(layout)


static func _draw_fairway_segment(layout: HoleLayout, x1: int, y1: int, x2: int, y2: int, base_width: int) -> void:
	var steps = abs(y1 - y2) + 1
	for i in range(steps):
		var t = float(i) / float(steps - 1) if steps > 1 else 0.0
		var x = int(lerp(float(x1), float(x2), t))
		var y = int(lerp(float(y1), float(y2), t))
		var width = base_width + int(sin(t * PI) * 2)
		for dx in range(-width, width + 1):
			if layout.get_cell(x + dx, y) == CHAR_EMPTY:
				layout.set_cell(x + dx, y, CHAR_FAIRWAY)


static func _add_rough_border(layout: HoleLayout) -> void:
	# Add rough around fairway
	for y in range(layout.height):
		for x in range(layout.width):
			if layout.get_cell(x, y) == CHAR_FAIRWAY:
				for dy in range(-1, 2):
					for dx in range(-1, 2):
						if layout.get_cell(x + dx, y + dy) == CHAR_EMPTY:
							layout.set_cell(x + dx, y + dy, CHAR_ROUGH)


static func _add_hazards(layout: HoleLayout, hole_data: HoleData, rng: RandomNumberGenerator) -> void:
	# Add water hazards
	if hole_data.has_water_off_tee:
		var side = -1 if rng.randf() < 0.5 else 1
		var water_x = layout.tee_pos.x + side * 8
		var water_y = layout.tee_pos.y - 5
		_draw_water(layout, water_x, water_y, 3, 4)

	if hole_data.has_water_by_green:
		var side = -1 if rng.randf() < 0.5 else 1
		var water_x = layout.green_pos.x + side * 5
		var water_y = layout.green_pos.y + 2
		_draw_water(layout, water_x, water_y, 4, 3)

	# Add bunkers
	if hole_data.has_greenside_bunker:
		for i in range(rng.randi_range(1, 3)):
			var angle = rng.randf() * TAU
			var dist = 4
			var bunk_x = layout.green_pos.x + int(cos(angle) * dist)
			var bunk_y = layout.green_pos.y + int(sin(angle) * dist * 0.5)
			_draw_bunker(layout, bunk_x, bunk_y, 2)

	if hole_data.has_fairway_bunker:
		var bunk_y = (layout.tee_pos.y + layout.green_pos.y) / 2
		var side = -1 if rng.randf() < 0.5 else 1
		var bunk_x = layout.width / 2 + side * 6
		_draw_bunker(layout, bunk_x, bunk_y, 2)

	# Add some trees for decoration
	for i in range(rng.randi_range(3, 8)):
		var tree_x = rng.randi_range(2, layout.width - 3)
		var tree_y = rng.randi_range(2, layout.height - 3)
		if layout.get_cell(tree_x, tree_y) == CHAR_EMPTY or layout.get_cell(tree_x, tree_y) == CHAR_ROUGH:
			layout.set_cell(tree_x, tree_y, CHAR_TREE)


static func _draw_water(layout: HoleLayout, cx: int, cy: int, w: int, h: int) -> void:
	for dy in range(-h/2, h/2 + 1):
		for dx in range(-w/2, w/2 + 1):
			var cell = layout.get_cell(cx + dx, cy + dy)
			if cell != CHAR_GREEN and cell != CHAR_PIN and cell != CHAR_TEE:
				layout.set_cell(cx + dx, cy + dy, CHAR_WATER)


static func _draw_bunker(layout: HoleLayout, cx: int, cy: int, radius: int) -> void:
	for dy in range(-radius, radius + 1):
		for dx in range(-radius, radius + 1):
			if dx*dx + dy*dy <= radius*radius:
				var cell = layout.get_cell(cx + dx, cy + dy)
				if cell != CHAR_GREEN and cell != CHAR_PIN and cell != CHAR_TEE and cell != CHAR_WATER:
					layout.set_cell(cx + dx, cy + dy, CHAR_BUNKER)


static func _get_pin_offset(pin_position: HoleData.PinPosition) -> Vector2i:
	match pin_position:
		HoleData.PinPosition.FRONT_LEFT: return Vector2i(-1, 1)
		HoleData.PinPosition.FRONT_CENTER: return Vector2i(0, 1)
		HoleData.PinPosition.FRONT_RIGHT: return Vector2i(1, 1)
		HoleData.PinPosition.CENTER_LEFT: return Vector2i(-1, 0)
		HoleData.PinPosition.CENTER: return Vector2i(0, 0)
		HoleData.PinPosition.CENTER_RIGHT: return Vector2i(1, 0)
		HoleData.PinPosition.BACK_LEFT: return Vector2i(-1, -1)
		HoleData.PinPosition.BACK_CENTER: return Vector2i(0, -1)
		HoleData.PinPosition.BACK_RIGHT: return Vector2i(1, -1)
	return Vector2i(0, 0)


static func _place_ball(layout: HoleLayout, hole_data: HoleData, distance: float, on_green: bool) -> void:
	if on_green:
		# Ball is on the green, near the pin
		layout.ball_pos = Vector2i(layout.pin_pos.x - 1, layout.pin_pos.y)
	else:
		# Calculate ball position based on distance from hole
		var total_distance = hole_data.total_distance
		var progress = 1.0 - (distance / total_distance)  # 0 = at tee, 1 = at green
		progress = clamp(progress, 0.0, 1.0)

		var ball_y = int(lerp(float(layout.tee_pos.y), float(layout.green_pos.y), progress))
		var ball_x = int(lerp(float(layout.tee_pos.x), float(layout.green_pos.x), progress))
		layout.ball_pos = Vector2i(ball_x, ball_y)

	layout.set_cell(layout.ball_pos.x, layout.ball_pos.y, CHAR_BALL)


static func get_legend() -> String:
	return """Legend: %s=Tee %s=Pin %s=Ball %s=Green %s=Fairway %s=Rough %s=Water %s=Bunker %s=Tree""" % [
		CHAR_TEE, CHAR_PIN, CHAR_BALL, CHAR_GREEN, CHAR_FAIRWAY, CHAR_ROUGH, CHAR_WATER, CHAR_BUNKER, CHAR_TREE
	]
