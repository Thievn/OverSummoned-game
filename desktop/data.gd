extends RefCounted
# OverSummoned desktop sample: all game data in one place.
# Locations, loot tables, heroes and Smudge's lines. Numbers here are first-pass
# tuning; test mode in Settings divides every tap requirement by 10.

# ------------------------------------------------------------ locations
# kind: "summon" fills the circle, "fish" lands catches, "lock" opens a safe pin by pin.
const LOCATIONS := [
	{
		"id": "archive", "name": "The Archive", "era": "Aldermere, home", "skill": "Summoning",
		"kind": "summon", "scene": "archive", "pose": "slap", "unlock": 1,
		"taps": 600,
		"blurb": "Slap the ledger. Fill the circle. Somebody falls out of history.",
	},
	{
		"id": "bathhouse", "name": "Roman Bathhouse", "era": "Rome, 79 AD", "skill": "Fishing",
		"kind": "fish", "scene": "bathhouse", "pose": "fish", "unlock": 1,
		"taps": 160,
		"blurb": "A rift pool under the mosaic. Everything that falls in Rome ends up here.",
	},
	{
		"id": "speakeasy", "name": "Speakeasy Safe", "era": "Chicago, 1927", "skill": "Lockpicking",
		"kind": "lock", "scene": "speakeasy", "pose": "pick", "unlock": 1,
		"taps": 70, "pins": 5,
		"blurb": "Five pins between Smudge and somebody else's money.",
	},
]

# ------------------------------------------------------------ loot
# name, icon file (art/loot/<id>.png), weight, coin value, rarity
const LOOT := {
	"bathhouse": [
		["Golden Carp", "bath_carp", 22, 6, "common"],
		["Rift Eel", "bath_eel", 22, 5, "common"],
		["Silver Denarius", "bath_coin", 16, 10, "common"],
		["Soggy Scroll", "bath_scroll", 14, 4, "common"],
		["Bronze Strigil", "bath_strigil", 9, 18, "uncommon"],
		["Oil Lamp", "bath_lamp", 8, 16, "uncommon"],
		["Perfume Vial", "bath_vial", 5, 30, "rare"],
		["Laurel Wreath", "bath_wreath", 3, 60, "rare"],
		["Marble Bust's Nose", "bath_nose", 1, 150, "epic"],
	],
	"speakeasy": [
		["Poker Chips", "easy_chips", 22, 6, "common"],
		["Moonshine", "easy_moonshine", 20, 8, "common"],
		["Banded Bills", "easy_bills", 16, 12, "common"],
		["Sealed Envelope", "easy_envelope", 12, 10, "common"],
		["Brass Knuckles", "easy_knuckles", 10, 20, "uncommon"],
		["Feathered Fedora", "easy_fedora", 8, 24, "uncommon"],
		["Gold Pocket Watch", "easy_watch", 6, 40, "rare"],
		["Pearl Necklace", "easy_pearls", 4, 70, "rare"],
		["Diamond Ring", "easy_ring", 2, 160, "epic"],
	],
	"archive": [
		["Card Shard", "arch_shard", 1, 5, "common"],
		["Teal Ink", "arch_ink", 1, 4, "common"],
		["Torn Ledger Page", "arch_page", 1, 3, "common"],
	],
}

# ------------------------------------------------------------ heroes (summons)
# id (art/heroes/<id>.png), name, title, era, species, rarity
const HEROES := [
	["kevin", "Kevin Latham", "Office Worker", "Today", "Sloth", "common"],
	["marco", "Marco Reyes", "Delivery Rider", "Today", "Greyhound", "common"],
	["maya", "Maya Washington", "Paramedic", "Today", "Golden Retriever", "uncommon"],
	["brokk", "Brokk", "Ice Age Hunter", "Ice Age", "Badger", "uncommon"],
	["gaius", "Gaius Marcellus", "Legionary", "Rome", "Bulldog", "rare"],
	["edith", "Edith Crane", "Engineer", "London, 1880s", "Beaver", "rare"],
	["albrecht", "Doctor Albrecht", "Plague Doctor", "1348", "Crow", "rare"],
	["vincenzo", "Vincenzo Moretti", "Gangster", "Chicago, 1927", "Weasel", "epic"],
	["slapton", "Will Slapton", "Leading Man", "Hollywood", "Peacock", "legendary"],
]
const RARITY_WEIGHT := {"common": 44, "uncommon": 28, "rare": 18, "epic": 8, "legendary": 2}
const RARITY_COLOR := {
	"common": Color("#8C94AA"), "uncommon": Color("#2EBE5A"), "rare": Color("#3478F6"),
	"epic": Color("#965AF0"), "legendary": Color("#FF8C1A"),
}

# ------------------------------------------------------------ Smudge's voice
# Modes: sweet, salty, unhinged. Unhinged is opt-in and adults only. Swearing is
# shown with the first letters and symbols so the sample stays safe to stream;
# the full uncensored pack can ship as a separate toggle.
const LINES := {
	"sweet": {
		"idle": ["The ledger is quiet today. I like quiet.", "Want to see a trick? I can spin a quill. Mostly.", "Tobias said never read the ledger out loud. Oops.", "I polished the circle. It's very shiny now.", "Do you think Romans like otters?"],
		"busy": ["You type so fast! My paws can barely keep up!", "Slap, slap, slap! We make a great team.", "The ink is flying! This is the best day."],
		"sleep": ["Zzz... five more pages..."],
		"wake": ["I'm up! I'm up! I was resting my eyes."],
		"summon": ["Somebody's coming through! Hello, friend!", "A new friend for the city! Welcome!", "Oh! Hello! Please don't be mad, it was an accident."],
		"summon_rare": ["Wow, look at them! The ledger likes you!", "A rare one! I'm telling everybody!"],
		"catch": ["Got one! Look how shiny!", "Fishy! Well, mostly fishy.", "The pool gave us a present!"],
		"pin": ["Click! One pin down!", "Gentle, gentle... got it!"],
		"unlock": ["The safe is open! Let's peek inside!", "We did it! I barely broke anything!"],
		"move": ["New place! Let's explore!", "I packed snacks. And the ledger."],
	},
	"salty": {
		"idle": ["Three hundred years guarding a book. Great career move, Smudge.", "If one more Roman asks me for directions, I'm biting him.", "Tobias left me in charge. Tobias is a jerk.", "My hood itches. Nobody cares. Cool.", "You could type. Just a suggestion. A strong one."],
		"busy": ["Look at you, actually working. Weird. Keep going.", "Faster. The ledger can smell weakness.", "Yes. Yes. Feed the book."],
		"sleep": ["Wake me when something explodes."],
		"wake": ["I was not asleep. I was auditing the inside of my eyelids."],
		"summon": ["Great. Another one. Where am I supposed to put him?", "Welcome to the future. It's damn weird here, get used to it.", "No refunds. No returns. Good luck, pal."],
		"summon_rare": ["Okay, that one's actually cool. Don't tell the others.", "Rare pull. Act natural. Act like we meant it."],
		"catch": ["Something from Rome. Smells like Rome.", "A fish. From two thousand years ago. Still fresher than your fridge.", "Caught it. Don't clap, it encourages me."],
		"pin": ["Click. One down. The safe is crying.", "Pin. Easy. I've picked tougher sandwiches."],
		"unlock": ["We're in. Act casual. Whistle or something.", "Safe's open. Finders keepers, Chicago."],
		"move": ["Fine, we'll go there. I'm bringing my complaints.", "New place, same otter, same damn ledger."],
	},
	"unhinged": {
		"idle": ["Three hundred years. Three HUNDRED. And not one f*cking thank-you card.", "I swear on Tobias' grave, if this book summons one more goat...", "Type something or I start reading names at random. Don't test me.", "This hood smells like the 1400s. Because it IS from the 1400s. Sh*t.", "I'm an apprentice. Apprentice of WHAT. Of suffering, that's what."],
		"busy": ["YES. MORE. Feed the cursed d*mn book!", "Faster, you magnificent keyboard goblin!", "That's it, slap that sh*t into existence!"],
		"sleep": ["...wake me and you die... zzz..."],
		"wake": ["WHO TOUCHED THE LEDGER. Oh. You. Fine."],
		"summon": ["Oh hell, it's another one. Hi. Welcome. Don't touch my snacks.", "Congratulations, you're in the future. It sucks. Grab a mop.", "Another poor b*stard yanked out of history. My bad."],
		"summon_rare": ["HOLY SH*T, look at this absolute legend.", "Rare one. I'm framing this. I'm framing it and you can't stop me."],
		"catch": ["Some Roman dropped this in 79 AD and I'm KEEPING it.", "A fish! An ancient, crusty, beautiful d*mn fish!", "Got it. Rome can cry about it."],
		"pin": ["Click. Suck it, Chicago.", "One pin. The safe is begging for mercy."],
		"unlock": ["We're in! Grab everything, the cops are 98 years away!", "Safe's open. Somebody call a lawyer. A 1927 lawyer."],
		"move": ["New location, same cursed f*cking book.", "Pack the snacks. And the bail money."],
	},
}

const MODE_NAMES := {"sweet": "Sweet", "salty": "Salty", "unhinged": "Unhinged (18+)"}

const AI_SYSTEM := {
	"sweet": "You are Smudge, a sweet hooded otter apprentice who guards a cursed ledger that summons people from history. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words, warm and playful, no swearing, no emojis.",
	"salty": "You are Smudge, a sarcastic hooded otter apprentice who has guarded a cursed ledger that summons people from history for 300 years. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words, dry and sarcastic, mild words like damn at most, no emojis.",
	"unhinged": "You are Smudge, a foul-mouthed, unhinged but lovable hooded otter apprentice who has guarded a cursed ledger that summons people from history for 300 years. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words. Swearing is allowed, but never slurs, never anything sexual, never real tragedies, never insult the player's identity. No emojis.",
}

# ------------------------------------------------------------ levels (Melvor-style curve)
static func xp_for_level(level: int) -> int:
	var total := 0.0
	for l in range(1, level):
		total += floor(l + 300.0 * pow(2.0, l / 7.0))
	return int(floor(total / 4.0))

static func level_for_xp(xp: int) -> int:
	var lvl := 1
	while lvl < 99 and xp >= xp_for_level(lvl + 1):
		lvl += 1
	return lvl
