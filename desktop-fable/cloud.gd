extends Node
# Talks to the OverSummoned server for a linked pet. The pet is never signed in: it holds one long secret that the website
# handed over when the player typed in a pairing code. One request at a time.
const URL := "https://eresamyqxarlrdgudgrw.supabase.co/rest/v1/rpc/"
const KEY := "sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF"   # the website's public key; it is not a secret

var token := ""
var username := ""
var fake = null          # tests put a Callable(fn, body) here instead of using the network
var _http: HTTPRequest
var _busy := false

func _ready() -> void:
	_http = HTTPRequest.new()
	_http.timeout = 12.0
	add_child(_http)

func linked() -> bool:
	return token != ""

func rpc_call(fn: String, body: Dictionary):
	if fake != null:
		return fake.call(fn, body)
	while _busy:
		await get_tree().process_frame
	_busy = true
	var headers := PackedStringArray(["apikey: " + KEY, "Authorization: Bearer " + KEY, "Content-Type: application/json"])
	var err := _http.request(URL + fn, headers, HTTPClient.METHOD_POST, JSON.stringify(body))
	if err != OK:
		_busy = false
		return null
	var res: Array = await _http.request_completed
	_busy = false
	if int(res[0]) != HTTPRequest.RESULT_SUCCESS or int(res[1]) != 200:
		return null
	return JSON.parse_string((res[3] as PackedByteArray).get_string_from_utf8())

func pet(op: String, args: Dictionary = {}):
	return await rpc_call("os2_pet", {"p_token": token, "p_op": op, "p_args": args})

func claim(code: String, device_name: String):
	return await rpc_call("os2_pair_claim", {"p_code": code, "p_name": device_name})

func poll(req: String):
	return await rpc_call("os2_link_poll", {"p_req": req})
