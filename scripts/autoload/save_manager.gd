extends Node
## Manages saving and loading game data

const SAVE_PATH = "user://back_nine_save.json"
const META_PATH = "user://back_nine_meta.json"

# Meta progression data (persists between runs)
var total_runs: int = 0
var total_wins: int = 0
var best_score: int = 999  # Lower is better (strokes over par)
var total_birdies: int = 0
var total_eagles: int = 0
var holes_played: int = 0
var unlocked_trinkets: Array[String] = []
var unlocked_cards: Array[String] = []


func _ready() -> void:
	load_meta()


func record_run(won: bool, final_score: int, holes_completed: int) -> void:
	## Record the results of a completed run
	total_runs += 1
	holes_played += holes_completed

	if won:
		total_wins += 1
		if final_score < best_score:
			best_score = final_score

	save_meta()


func record_birdie() -> void:
	total_birdies += 1


func record_eagle() -> void:
	total_eagles += 1


func unlock_trinket(trinket_id: String) -> bool:
	## Unlock a trinket. Returns true if newly unlocked.
	if trinket_id in unlocked_trinkets:
		return false
	unlocked_trinkets.append(trinket_id)
	save_meta()
	return true


func unlock_card(card_id: String) -> bool:
	## Unlock a card. Returns true if newly unlocked.
	if card_id in unlocked_cards:
		return false
	unlocked_cards.append(card_id)
	save_meta()
	return true


func is_trinket_unlocked(trinket_id: String) -> bool:
	# All starting trinkets are unlocked by default
	var starting_trinkets = ["veteran_looper", "aggressive_caddie", "conservative_caddie", "putting_specialist", "rookie_caddie"]
	if trinket_id in starting_trinkets:
		return true
	return trinket_id in unlocked_trinkets


func save_meta() -> void:
	## Save meta progression data
	var data = {
		"total_runs": total_runs,
		"total_wins": total_wins,
		"best_score": best_score,
		"total_birdies": total_birdies,
		"total_eagles": total_eagles,
		"holes_played": holes_played,
		"unlocked_trinkets": unlocked_trinkets,
		"unlocked_cards": unlocked_cards
	}

	var file = FileAccess.open(META_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()


func load_meta() -> void:
	## Load meta progression data
	if not FileAccess.file_exists(META_PATH):
		return

	var file = FileAccess.open(META_PATH, FileAccess.READ)
	if not file:
		return

	var json_string = file.get_as_text()
	file.close()

	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		push_warning("Failed to parse meta save file")
		return

	var data = json.get_data()
	if data is Dictionary:
		total_runs = data.get("total_runs", 0)
		total_wins = data.get("total_wins", 0)
		best_score = data.get("best_score", 999)
		total_birdies = data.get("total_birdies", 0)
		total_eagles = data.get("total_eagles", 0)
		holes_played = data.get("holes_played", 0)

		var trinkets = data.get("unlocked_trinkets", [])
		unlocked_trinkets.clear()
		for t in trinkets:
			unlocked_trinkets.append(t)

		var cards = data.get("unlocked_cards", [])
		unlocked_cards.clear()
		for c in cards:
			unlocked_cards.append(c)


func save_run(run_data: Dictionary) -> void:
	## Save current run state (for continuing later)
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(run_data, "\t"))
		file.close()


func load_run() -> Dictionary:
	## Load saved run state
	if not FileAccess.file_exists(SAVE_PATH):
		return {}

	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return {}

	var json_string = file.get_as_text()
	file.close()

	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		return {}

	var data = json.get_data()
	if data is Dictionary:
		return data
	return {}


func has_saved_run() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func delete_saved_run() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)


func get_stats_text() -> String:
	## Get formatted stats text for display
	var win_rate = 0.0
	if total_runs > 0:
		win_rate = float(total_wins) / float(total_runs) * 100.0

	var score_text = "N/A"
	if best_score < 999:
		if best_score == 0:
			score_text = "E"
		elif best_score > 0:
			score_text = "+%d" % best_score
		else:
			score_text = "%d" % best_score

	return """Runs: %d
Wins: %d (%.1f%%)
Best Score: %s
Birdies: %d
Eagles: %d
Holes Played: %d""" % [total_runs, total_wins, win_rate, score_text, total_birdies, total_eagles, holes_played]
