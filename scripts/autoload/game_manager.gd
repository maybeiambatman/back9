extends Node
## Global game state manager

signal game_state_changed(new_state: GameState)

enum GameState {
	MAIN_MENU,
	STARTING_RUN,
	IN_HOLE,
	MAP_SCREEN,
	REST_SITE,
	SHOP,
	EVENT,
	CARD_REWARD,
	RUN_COMPLETE
}

var current_state: GameState = GameState.MAIN_MENU

# Scene paths
const MAIN_MENU_SCENE = "res://scenes/main/main_menu.tscn"
const GAME_SCENE = "res://scenes/main/game.tscn"
const MAP_SCENE = "res://scenes/main/map.tscn"


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


func change_state(new_state: GameState) -> void:
	current_state = new_state
	game_state_changed.emit(new_state)


func go_to_main_menu() -> void:
	change_state(GameState.MAIN_MENU)
	get_tree().change_scene_to_file(MAIN_MENU_SCENE)


func start_new_run() -> void:
	change_state(GameState.STARTING_RUN)
	get_tree().change_scene_to_file(GAME_SCENE)


func go_to_map() -> void:
	change_state(GameState.MAP_SCREEN)


func start_hole() -> void:
	change_state(GameState.IN_HOLE)


func show_card_reward() -> void:
	change_state(GameState.CARD_REWARD)


func go_to_rest_site() -> void:
	change_state(GameState.REST_SITE)


func go_to_shop() -> void:
	change_state(GameState.SHOP)


func go_to_event() -> void:
	change_state(GameState.EVENT)


func end_run(won: bool) -> void:
	change_state(GameState.RUN_COMPLETE)
