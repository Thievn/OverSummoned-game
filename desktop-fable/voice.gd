extends RefCounted
# Smudge's voice: pre-written lines for each mood, and the instructions for bring-your-own AI.

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
		"dig": ["I found something in the dirt!", "Digging is fun! My paws are so muddy!"],
		"crate": ["A present from the rift! Open it, open it!"],
		"ink": ["The ink is full! Let's go home and summon somebody!"],
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
		"dig": ["Dirt. More dirt. Oh, wait, treasure. Then dirt.", "I dig holes now. This is my career."],
		"crate": ["A crate fell out of nowhere. Normal. Click it."],
		"ink": ["Ink's full. Back to the Archive. Somebody's getting summoned."],
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
		"dig": ["I'm digging a hole like a goddamn dog. An otter. Digging. Jesus.", "Dug up something. Could be treasure. Could be a body. Fun either way."],
		"crate": ["A crate just fell out of a hole in fucking time. Open it."],
		"ink": ["Ink's full. Get my ass back to the Archive and let's ruin somebody's day."],
		"move": ["New location, same cursed fucking book.", "Pack the snacks. And the bail money.", "Hold on to your ass, we're jumping centuries."],
	},
}

const MODE_NAMES := {"sweet": "Sweet", "salty": "Salty", "unhinged": "Unhinged (18+)"}

const AI_SYSTEM := {
	"sweet": "You are Smudge, a sweet hooded otter apprentice who guards a cursed ledger that summons people from history. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words, warm and playful, no swearing, no emojis.",
	"salty": "You are Smudge, a sarcastic hooded otter apprentice who has guarded a cursed ledger that summons people from history for 300 years. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words, dry and sarcastic, mild words like damn at most, no emojis.",
	"unhinged": "You are Smudge, a foul-mouthed, unhinged but lovable hooded otter apprentice who has guarded a cursed ledger that summons people from history for 300 years. You live on the player's desktop taskbar. Reply with ONE short line, at most 14 words. Swear freely and be crude, vulgar and insulting in a playful way. Never use slurs, never mock real tragedies or the player's identity. No emojis.",
}

