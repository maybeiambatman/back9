extends Node
## Manages audio playback for music and sound effects

# Audio buses
const MASTER_BUS = "Master"
const MUSIC_BUS = "Music"
const SFX_BUS = "SFX"

# Audio players
var _music_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
const MAX_SFX_PLAYERS = 8

# Volume settings (0.0 to 1.0)
var master_volume: float = 1.0
var music_volume: float = 0.8
var sfx_volume: float = 1.0

# Current music
var _current_music: AudioStream = null
var _music_fade_tween: Tween = null


func _ready() -> void:
	# Create music player
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = MUSIC_BUS
	add_child(_music_player)

	# Create SFX player pool
	for i in range(MAX_SFX_PLAYERS):
		var player = AudioStreamPlayer.new()
		player.bus = SFX_BUS
		add_child(player)
		_sfx_players.append(player)

	# Load volume settings
	_load_settings()


func play_music(stream: AudioStream, fade_in: float = 1.0) -> void:
	## Play background music with optional fade in
	if stream == _current_music and _music_player.playing:
		return

	_current_music = stream

	if _music_fade_tween:
		_music_fade_tween.kill()

	if fade_in > 0 and _music_player.playing:
		# Crossfade
		_music_fade_tween = create_tween()
		_music_fade_tween.tween_property(_music_player, "volume_db", -80, fade_in * 0.5)
		await _music_fade_tween.finished

	_music_player.stream = stream
	_music_player.volume_db = -80 if fade_in > 0 else 0
	_music_player.play()

	if fade_in > 0:
		_music_fade_tween = create_tween()
		_music_fade_tween.tween_property(_music_player, "volume_db", 0, fade_in * 0.5)


func stop_music(fade_out: float = 1.0) -> void:
	## Stop background music with optional fade out
	if not _music_player.playing:
		return

	if _music_fade_tween:
		_music_fade_tween.kill()

	if fade_out > 0:
		_music_fade_tween = create_tween()
		_music_fade_tween.tween_property(_music_player, "volume_db", -80, fade_out)
		await _music_fade_tween.finished

	_music_player.stop()
	_current_music = null


func play_sfx(stream: AudioStream, volume_db: float = 0.0, pitch_variation: float = 0.0) -> void:
	## Play a sound effect
	if stream == null:
		return

	# Find available player
	var player: AudioStreamPlayer = null
	for p in _sfx_players:
		if not p.playing:
			player = p
			break

	# If all players busy, use the first one (interrupt)
	if player == null:
		player = _sfx_players[0]

	player.stream = stream
	player.volume_db = volume_db

	if pitch_variation > 0:
		player.pitch_scale = 1.0 + randf_range(-pitch_variation, pitch_variation)
	else:
		player.pitch_scale = 1.0

	player.play()


func play_sfx_by_name(sfx_name: String) -> void:
	## Play a sound effect by name (loads from assets/audio/sfx/)
	var path = "res://assets/audio/sfx/%s.wav" % sfx_name
	if not ResourceLoader.exists(path):
		path = "res://assets/audio/sfx/%s.ogg" % sfx_name
	if not ResourceLoader.exists(path):
		path = "res://assets/audio/sfx/%s.mp3" % sfx_name

	if ResourceLoader.exists(path):
		var stream = load(path)
		play_sfx(stream)


# Common sound effects
func play_card_draw() -> void:
	play_sfx_by_name("card_draw")


func play_card_play() -> void:
	play_sfx_by_name("card_play")


func play_card_hover() -> void:
	play_sfx_by_name("card_hover")


func play_shot_good() -> void:
	play_sfx_by_name("shot_good")


func play_shot_bad() -> void:
	play_sfx_by_name("shot_bad")


func play_putt_make() -> void:
	play_sfx_by_name("putt_make")


func play_putt_miss() -> void:
	play_sfx_by_name("putt_miss")


func play_button_click() -> void:
	play_sfx_by_name("button_click")


func play_birdie() -> void:
	play_sfx_by_name("birdie")


func play_bogey() -> void:
	play_sfx_by_name("bogey")


# Volume control
func set_master_volume(value: float) -> void:
	master_volume = clamp(value, 0.0, 1.0)
	var db = linear_to_db(master_volume)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MASTER_BUS), db)
	_save_settings()


func set_music_volume(value: float) -> void:
	music_volume = clamp(value, 0.0, 1.0)
	var db = linear_to_db(music_volume)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MUSIC_BUS), db)
	_save_settings()


func set_sfx_volume(value: float) -> void:
	sfx_volume = clamp(value, 0.0, 1.0)
	var db = linear_to_db(sfx_volume)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(SFX_BUS), db)
	_save_settings()


func _save_settings() -> void:
	var config = ConfigFile.new()
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "music_volume", music_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.save("user://audio_settings.cfg")


func _load_settings() -> void:
	var config = ConfigFile.new()
	if config.load("user://audio_settings.cfg") == OK:
		master_volume = config.get_value("audio", "master_volume", 1.0)
		music_volume = config.get_value("audio", "music_volume", 0.8)
		sfx_volume = config.get_value("audio", "sfx_volume", 1.0)

		set_master_volume(master_volume)
		set_music_volume(music_volume)
		set_sfx_volume(sfx_volume)
