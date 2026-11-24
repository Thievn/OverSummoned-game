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
		"id": "dock", "name": "Roman Dock", "era": "Ostia, 79 AD", "skill": "Fishing",
		"kind": "fish", "scene": "dock", "pose": "fish", "unlock": 1,
		"taps": 160,
		"blurb": "A quiet pier on the Tiber at Ostia. Everything Rome drops ends up in this river.",
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
	"dock": [
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
# XP per finished action (not per key), so levels come at a steady, earned pace.
const XP_SUMMON := 60
const XP_CATCH := 25
const XP_PIN := 10
const XP_UNLOCK := 30

const RARITY_WEIGHT := {"common": 44, "uncommon": 28, "rare": 18, "epic": 8, "legendary": 2}
const RARITY_COLOR := {
	"common": Color("#8C94AA"), "uncommon": Color("#2EBE5A"), "rare": Color("#3478F6"),
	"epic": Color("#965AF0"), "legendary": Color("#FF8C1A"),
}

# ------------------------------------------------------------ Smudge's voice
# Modes: sweet, salty, unhinged. Unhinged is opt-in, adults only, and uncensored.
const LINES := {
	"sweet": {
		"idle": ["The ledger is quiet today. I like quiet.", "Want to see a trick? I can spin a quill. Mostly.", "Tobias said never read the ledger out loud. Oops.", "I polished the circle. It's very shiny now.", "Do you think Romans like otters?"],
		"busy": ["You type so fast! My paws can barely keep up!", "Slap, slap, slap! We make a great team.", "The ink is flying! This is the best day."],
		"sleep": ["Zzz... five more pages..."],
		"wake": ["I'm up! I'm up! I was resting my eyes."],
		"summon": ["Somebody's coming through! Hello, friend!", "A new friend for the city! Welcome!", "Oh! Hello! Please don't be mad, it was an accident."],
		"summon_rare": ["Wow, look at them! The ledger likes you!", "A rare one! I'm telling everybody!"],
		"catch": ["Got one! Look how shiny!", "Fishy! Well, mostly fishy.", "The river gave us a present!"],
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
		"idle": ["Three hundred years. Three HUNDRED. And not one fucking thank-you card.", "I swear on Tobias' grave, if this book summons one more goat I'm setting it on fire.", "Type something or I start reading names at random. Don't fucking test me.", "This hood smells like the 1400s. Because it IS from the 1400s. Shit.", "Apprentice of WHAT, Tobias? Of suffering? Of this shitty little book?", "You just gonna sit there? Cool. Cool cool cool. Asshole."],
		"busy": ["YES. MORE. Feed the cursed goddamn book!", "Faster, you magnificent keyboard goblin!", "That's it, slap that shit into existence!", "Holy hell, look at those fingers go. Disgusting. Keep going."],
		"sleep": ["...wake me and you die, motherfucker... zzz..."],
		"wake": ["WHO TOUCHED THE LEDGER. Oh. You. Fine. Whatever. Dick."],
		"summon": ["Oh hell, it's another one. Touch my snacks and I'll bite your fucking ankles.", "Congratulations, you're in the future. It sucks ass. Grab a mop.", "Another poor bastard yanked out of history. My bad. Kinda."],
		"summon_rare": ["HOLY SHIT, look at this absolute legend.", "Rare one. I'm framing this and you can't fucking stop me."],
		"catch": ["Some Roman dropped this in 79 AD and I'm KEEPING it.", "Got it. Rome can cry about it.", "Out of the river and into my bag, bitch."],
		"pin": ["Click. Suck it, Chicago.", "One pin. The safe is begging for mercy.", "Pin's down. Who's a filthy little criminal? Me. It's me."],
		"unlock": ["We're in! Grab everything, the cops are 98 years away!", "Safe's open. Somebody call a lawyer. A 1927 lawyer. A crooked one.", "Fuck yeah. Fuck. Yeah."],
		"move": ["New location, same cursed fucking book.", "Pack the snacks. And the bail money.", "Hold on to your ass, we're jumping centuries."],
	},
}

# ------------------------------------------------------------ what Smudge says about each find
# One line per voice: sweet, salty, unhinged.
const FINDS := {
	"Golden Carp": ["A golden fish! It's so pretty I might cry.", "Gold-plated carp. Rich Romans had too much money.", "A gold fish. An actual GOLD fish. Rome was fucking unwell."],
	"Rift Eel": ["A wiggly eel friend! Hello, wiggly!", "An eel from the rift. It's looking at me. Stop it.", "This eel went through a time portal and it's still uglier than your browser history."],
	"Silver Denarius": ["A real Roman coin! Some soldier's lunch money.", "One denarius. A day's wages for a legionary. Rough.", "A whole day of stabbing Gauls, and the idiot dropped it in a river."],
	"Soggy Scroll": ["A scroll! It's wet, but it's still a story.", "A soggy scroll. Probably a tax bill. It's always a tax bill.", "Soggy scroll. Smells like Caesar's armpit. Keeping it."],
	"Bronze Strigil": ["A curvy bronze scraper! What's it for?", "A strigil. Romans scraped their sweat off with this. Enjoy.", "Romans scraped their own sweaty crud off with this. And now it's in MY bag. Great."],
	"Oil Lamp": ["A little lamp! It's still warm. Somehow.", "Oil lamp. Two thousand years old and it still beats our wiring.", "A lamp. If a genie comes out I'm wishing for a better fucking job."],
	"Perfume Vial": ["Ooh, it smells like roses and sunshine!", "Roman perfume. Smells like money and bad decisions.", "Smells expensive. I'm drinking it. No? Fine. Fuck."],
	"Laurel Wreath": ["A victory wreath! We're winners!", "A laurel wreath. Somebody won a race and lost his hat. Classic.", "I'm wearing this until I die. Bow, peasants."],
	"Marble Bust's Nose": ["A statue's nose! I hope the statue isn't sad.", "A marble nose. That explains a lot about Roman statues.", "WHO KEEPS BREAKING THE NOSES OFF STATUES. Oh. Me. Keeping it."],
	"Poker Chips": ["Shiny chips! Do they taste like chips?", "Poker chips. Somebody lost these the honest way. By cheating.", "Poker chips. Sorry, Big Tony. Your problem now. Wait, no, mine. Shit."],
	"Moonshine": ["Fizzy grown-up juice! I'm not drinking it.", "Bathtub moonshine. Strong enough to strip paint off a car.", "Prohibition hooch. One sip and I can see through time. Wait, I already can. Fuck it, two sips."],
	"Banded Bills": ["A stack of money! We're rich, maybe!", "Banded bills. Dirty money. Very dirty. Sticky, even.", "A stack of 1927 cash. Worth nothing now and I still feel like a goddamn kingpin."],
	"Sealed Envelope": ["A secret letter! I won't peek. Okay, I'll peek.", "A sealed envelope. Somebody's getting blackmailed.", "Blackmail letter, a hundred percent. Somebody in 1927 was a nasty little freak."],
	"Brass Knuckles": ["Shiny rings for the whole hand!", "Brass knuckles. For negotiations.", "Brass knuckles. Tobias, wherever you are, I'm coming for your fucking teeth."],
	"Feathered Fedora": ["A fancy hat with a feather! I look dashing!", "A feathered fedora. Very gangster. Very much not otter-sized.", "Look at this pimp-ass hat. I'm a gangster now. Respect the otter."],
	"Gold Pocket Watch": ["A gold watch! It goes tick tock!", "A gold pocket watch. Fitting, for a time thief.", "Stole a watch from 1927. I'm literally a time thief. Suck on that, Einstein."],
	"Pearl Necklace": ["Pearls! They're like little moons!", "A pearl necklace. Somebody's wife is going to be furious.", "Real pearls. Some mob boss is about to lose his goddamn mind."],
	"Diamond Ring": ["A sparkly ring! Will you marry me? Kidding!", "A diamond ring. Somebody had a VERY bad night.", "A DIAMOND RING. Holy shit. We're never working again. Kidding, keep typing."],
	"Card Shard": ["A card shard! We can build something with these.", "Another shard. Duplicates. Thrilling.", "Duplicate hero, so here's a shard. Recycling, bitches."],
}
const HERO_LINES := {
	"kevin": ["Kevin from the office! He brought his coffee!", "Kevin. From accounting. Somehow still on break.", "It's fucking Kevin. With his mug. Nobody asked for Kevin."],
	"marco": ["A delivery rider! Did he bring snacks?", "Marco. Delivers anything, anywhere. Even across time, apparently.", "Marco! Two thousand years late. Tip him anyway, you cheap ass."],
	"maya": ["A paramedic! We're safe now!", "Maya. Paramedic. Finally someone useful.", "A paramedic. Thank god. I've been bleeding emotionally for three hundred years."],
	"brokk": ["A big strong hunter from the Ice Age!", "Brokk. From the Ice Age. He's going to hate the thermostat.", "Brokk has never seen a toilet and he's about to have the best day of his life."],
	"gaius": ["A Roman soldier! So shiny!", "Gaius. Legionary. Has opinions about marching.", "A Roman legionary. Don't mention Carthage. He gets fucking weird about Carthage."],
	"edith": ["An engineer! She can fix the ledger!", "Edith. Victorian engineer. Already judging our wiring.", "Edith built bridges in the 1880s and she's looking at our setup like it's a crime scene."],
	"albrecht": ["A doctor with a bird mask! Spooky but cool!", "A plague doctor. Wash your hands. Seriously.", "A plague doctor from 1348. Everybody back the fuck up."],
	"vincenzo": ["A fancy man in a nice suit!", "Vincenzo Moretti. Don't ask what he does. Don't.", "Vincenzo. Chicago, 1927. If anyone asks, we never saw shit."],
	"slapton": ["A movie star! Can I have an autograph?", "Will Slapton. Leading man. Bigger ego than the book.", "Will fucking Slapton. Somebody hide the ledger before he slaps it."],
}

const MODE_NAMES := {"sweet": "Sweet", "salty": "Salty", "unhinged": "Unhinged (18+)"}

const AI_SYSTEM := {
	"sweet": "You are Smudge, a sweet hooded otter apprentice who guards a cursed ledger that summons people from history. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words, warm and playful, no swearing, no emojis.",
	"salty": "You are Smudge, a sarcastic hooded otter apprentice who has guarded a cursed ledger that summons people from history for 300 years. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words, dry and sarcastic, mild words like damn at most, no emojis.",
	"unhinged": "You are Smudge, a foul-mouthed, unhinged but lovable hooded otter apprentice who has guarded a cursed ledger that summons people from history for 300 years. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words. Swear freely and be crude, vulgar and insulting in a playful way. Never use slurs, never mock real tragedies or the player's identity. No emojis.",
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
