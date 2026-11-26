"""Expedition stories (F5). Builds data/expeditions.json. Edit this script, not the JSON.
The engine (expStory in js/game.js) shows one `open`, one `turn` and one `end` from the place the hero went to,
then, if the hero has any, one line in their own voice (shown as "Name: line"), then one closing `tone` line.
So every line must stand on its own: an end never refers to a turn, and a voice line never says how the haul went.
The narrator is not Smudge. It is a dry, even voice that never names the hero as he or she: {name} only.
Placeholders: {name} {place} {era} {n} {ink}."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BEATS = {
 'dock': {
  'open': [
   "Ostia, and the tide on its way out. {name} steps onto the quay between a wine merchant and the smell of the wine merchant's last voyage.",
   "The harbour at Ostia unloads half the world every morning and loses a little of it over the side. {name} has come about the little.",
   "Nobody on the dock looks twice at {name}. In a port this size, a stranger is only cargo that walks.",
   "{name} arrives with the grain fleet, which is the best way to arrive at Ostia: two hundred ships, and every official in town counting sacks.",
   "The Tiber comes down brown and slow, carrying everything Rome has dropped in it since breakfast. {name} picks a spot on the pier and waits for it to arrive.",
   "A harbour clerk asks {name} for a name, a cargo and a port of origin, and writes down all three answers without believing one.",
  ],
  'turn': [
   "A crane rope parts over the deep end of the quay. The amphora goes in whole, and so, shortly afterwards, does most of the argument about whose fault it was.",
   "The customs man wants a word. {name} gives him several, in an order he will still be sorting out at supper.",
   "Something large rolls over in the water under the pier. The dockers do not mention it, in the careful way of people who have mentioned it before.",
   "Two captains start a fight over a berth, and the whole waterfront stops work to watch. Nobody is watching the cargo.",
   "A diver comes up from the harbour floor with a full net, sees a crowd, and goes back down to find somewhere quieter to surface.",
   "A senator's barge runs aground on the bar, and for an hour every boat in Ostia is busy being helpful at him.",
   "A sack splits on the gangplank and the quay is ankle deep in lentils. In the time it takes to sweep them up, a good deal else goes missing.",
   "A sailor offers to sell {name} the one true map of where the treasure fleet sank. He has nine more under his cloak, all different.",
  ],
  'end': {
   'good': [
    "{name} leaves the quay walking carefully, the way anyone walks with that much tucked away.",
    "By the time the harbour clerk looks up from his tablet, {name} is gone, and so is rather more of Ostia than he will ever account for.",
    "The tide comes back in to find its pickings already gone. {name} got there first.",
    "{name} comes home smelling of the Tiber, which takes a week to fade, and carrying enough to make the week worthwhile.",
   ],
   'poor': [
    "{name} comes home with wet feet and a low opinion of the Tiber, which gave up very little.",
    "The river was in a mean mood. {name} comes back with what it could be talked out of, which was not much.",
    "Ostia kept nearly all of it. {name} comes back with the rest.",
    "{name} returns with one sandal's worth of mud and a short list of things that got away.",
   ]}},
 'bondi': {
  'open': [
   "Bondi at noon. The sand is too hot to stand on and too crowded to lie on, and {name} crosses it at the brisk hop the beach requires.",
   "The tide at the rock pool has just gone out, leaving behind everything the morning's swimmers thought was safe in a pocket.",
   "{name} arrives between the flags, where the lifeguards can see, and then drifts steadily to where they can't.",
   "A southerly has flattened the surf and filled the pool with clear water. Things glint on the bottom.",
   "The beach is four thousand towels and one thin path between them. {name} takes the path, apologising in advance.",
   "The rock pool has been here longer than Sydney. It has been given wedding rings, car keys and one piano, and it has kept most of them.",
  ],
  'turn': [
   "A seagull takes something straight out of {name}'s hands. What follows covers most of the beach and is filmed by several people.",
   "Someone shouts about a shark. It is a towel. By the time this is established the water is empty and nobody is minding their things.",
   "A wave bigger than its neighbours comes over the rocks, takes the pool apart, and puts it back with different contents.",
   "A small child with a bucket has been working this pool since morning and regards {name} as a trespasser. Terms are negotiated. They are not cheap.",
   "A bluebottle drifts into the shallows and the swimmers leave the water in one motion. {name} stays in the pool and keeps an eye on it.",
   "A film crew arrives to shoot an advertisement and moves everybody along. {name} is mistaken for part of it and left alone.",
   "The ice cream van breaks down at the top of the steps. Half the beach goes up to grieve, and their towels stay behind unattended.",
   "An octopus in the deep corner of the pool is holding something shiny and has no intention of trading.",
  ],
  'end': {
   'good': [
    "{name} comes back salt-crusted and pink at the edges, with the look of someone who beat the tide to it.",
    "The tide comes in over a pool that has been thoroughly gone through. {name} is already on the way home, clinking.",
    "{name} leaves Bondi with sand in everything and plenty wrapped in a towel that was somebody else's this morning.",
    "It takes {name} two trips up the steps. That is the good kind of problem.",
   ],
   'poor': [
    "{name} comes back sunburnt on one side and not much richer on either.",
    "The pool had been picked over before {name} got there. The child with the bucket, probably.",
    "{name} leaves Bondi with a great deal of sand and very little else, and the sand was not on the list.",
    "The tide came in early and took the best of it back. {name} got the rest, and a jellyfish sting.",
   ]}},
 'fjord': {
  'open': [
   "The fjord is frozen flat and white to the far shore. {name} walks out onto it in the grey before morning, listening to the ice think.",
   "The village cut this hole in the ice a week ago and has been losing things down it ever since. {name} kneels at the edge and looks in.",
   "It is cold enough in Lofoten that words freeze on the way out. {name} says nothing and keeps the line moving.",
   "The cod under the Lofoten ice are the size of rowing boats, and they are not the largest thing down there. {name} sets a line anyway.",
   "A row of drying racks, a row of sod roofs, and then nothing but ice. {name} walks past the last of the houses and keeps going.",
   "The fishermen of Lofoten nod at {name} once, which here counts as a speech of welcome, and go back to staring down their holes.",
  ],
  'turn': [
   "Something under the ice follows {name}'s shadow for a while. It has antlers. It loses interest, or decides to wait.",
   "The line goes tight, and whatever is on the other end is strong and in no hurry. It is a long conversation.",
   "A storm comes in sideways off the sea, and for an hour there is no fjord, no sky and no village. Afterwards the hole is somewhere slightly different.",
   "The ice groans from one shore to the other. Every fisherman on the fjord stands up at once, waits, and sits down again without a word.",
   "A longship is frozen into the bay by its keel, cargo and all. Its crew have gone to the hall to drink until spring. Nobody is watching it.",
   "The northern lights come out green overhead, and the whole village stands outside to look up. Nobody looks down.",
   "A seal hauls out of the hole, looks at {name}, looks at the catch, and takes the larger share as a toll.",
   "An old man two holes over hauls up a sea chest, decides it is not a fish, and drops it straight back. {name} marks the spot.",
  ],
  'end': {
   'good': [
    "{name} comes back off the ice stiff as a plank and heavily laden, leaving a trail of drips that freeze behind.",
    "The hole gave generously. {name} drags the lot home on a borrowed sledge and does not look back at what is watching from the water.",
    "{name} walks in off the fjord with frost in every seam and a load that took both arms.",
    "By the time feeling returns to {name}'s fingers, the catch has been counted twice. It is a good count.",
   ],
   'poor': [
    "{name} comes back off the ice with blue hands and very little in them.",
    "The fjord kept its secrets and most of its fish. {name} comes home cold and light.",
    "Whatever lives under the ice ate better than {name} did today.",
    "{name} returns with one small catch, frozen solid, and an account of the cold that takes longer to deliver than the trip did.",
   ]}},
 'speakeasy': {
  'open': [
   "Down the alley, down the steps, three knocks and a word. The word changes daily. {name} has today's.",
   "The band at the speakeasy plays loud on purpose. Under a trumpet solo, nobody hears a safe being talked to.",
   "{name} takes a table near the back office, orders something that is officially tea, and watches the door that everyone else is careful not to watch.",
   "Chicago, 1927. The drink is illegal, the police are regulars, and the safe in the back holds the only honest accounts in the building.",
   "The doorman looks {name} up and down, finds nothing he recognises, and decides that is a point in favour.",
   "It is the hour when the first crowd has gone home and the second has not got brave yet. {name} goes in with the quiet.",
  ],
  'turn': [
   "A card game two tables over becomes a discussion, and the discussion becomes furniture. The back office empties to help.",
   "Someone important arrives, and for four minutes every eye in the room points the same way. Four minutes is a long time near a safe.",
   "The lookout rings the raid bell. It is a false alarm, but the room clears through three doors, and it is a while before anyone trusts it again.",
   "The singer reaches the long note at the end of the second set and holds it. The room holds its breath with her. One click goes entirely unheard.",
   "The owner's nephew is minding the office tonight. He has been told to stay by the safe. He has also been told about the piano player's sister.",
   "A man in a good coat sits down across from {name} and explains, pleasantly, who owns this block. He is wrong by one block. {name} lets him finish.",
   "The police arrive, hang up their hats, and order the usual. The whole staff is suddenly very attentive, at the front of the house.",
   "The lights go out. In a room like this, everyone has a plan for the dark. {name}'s is better than most.",
  ],
  'end': {
   'good': [
    "{name} goes up the steps before the milk carts, with a full coat and an unhurried walk.",
    "The band is still playing when {name} leaves. Nobody will open that safe until Friday, and Friday will be interesting.",
    "{name} tips the doorman on the way out, generously, with his employer's money.",
    "{name} comes home smelling of cigar smoke and somebody else's good fortune.",
   ],
   'poor': [
    "{name} goes up the steps with a thin coat and a thinner story.",
    "The safe kept nearly all of it. {name} got the tea, which was gin, and a few things off the floor.",
    "{name} leaves by the alley with light pockets. Some nights the band stops at the wrong moment.",
    "Five pins, and {name} got to four. The fifth is still down there, pleased with itself.",
   ]}},
 'vault': {
  'open': [
   "Venice does everything by water, including trouble. {name} arrives by gondola and pays the boatman to forget the address.",
   "The lock on the Doge's vault was made by a genius. The guard was hired by a nephew. {name} has come to see which of them wins.",
   "The palace is holding a reception for three hundred, and one more guest in the corridors is nobody's business.",
   "{name} crosses the square with the pigeons, in the hour when the palace changes its guard and nobody is quite on duty.",
   "Every clerk in Venice knows there is a vault under the Doge's palace. Only the Doge believes it is safe.",
   "Fog on the lagoon, and the palace floating in it like something not fully decided on. {name} goes in by the water gate.",
  ],
  'turn': [
   "The guard goes for his supper. He is a slow eater and comes of a long line of slow eaters.",
   "A masked ball fills the corridors with people who each assume {name} is someone else's guest. One of them asks for a dance.",
   "A ledger goes missing upstairs and every servant in the palace is questioned. The questions stop well short of the cellar.",
   "The tide comes up through the floor, as it does in Venice. The guard goes to fetch a mop. The mop is at the other end of the palace.",
   "The lock has eleven wards and a false keyhole. The genius who built it left his initials inside, where only the right sort of visitor would ever see them.",
   "Two ambassadors meet on a narrow stair and neither will give way. Half the household is sent for, to witness that neither gave way.",
   "A second thief is already in the corridor, working the same door. There is a short professional conversation and an agreement about halves.",
   "The Doge himself comes down in his nightshirt to look at his money. He does this most nights. {name} learns a good deal about curtains.",
  ],
  'end': {
   'good': [
    "{name} leaves Venice by a window and a boat, in that order, sitting low in the water.",
    "By morning the vault is locked again and looks untouched. The lock was never the problem. It was the nephew.",
    "{name} drifts out across the lagoon with a full sack, and the bells of San Marco ringing for something else entirely.",
    "The gondolier asks no questions about the weight. He has carried heavier, he says, and from the same address.",
   ],
   'poor': [
    "{name} leaves Venice by the front door, politely, carrying very little.",
    "The genius won this one. {name} comes home with what was lying outside the door.",
    "{name} gets as far as the ninth ward before the guard finishes eating. It is not far enough.",
    "Venice gave up a handful and kept the rest, and charged for the gondola both ways.",
   ]}},
 'closet': {
  'open': [
   "{name} signs in at reception as a contractor and is given a badge that opens the front door and the kitchen.",
   "The supply closet is on the fourth floor, between the server room and a meeting that has been running since nine. {name} takes the stairs.",
   "Brenda from Facilities is on leave, and the only key is on leave with her. The office speaks of the closet the way old sailors speak of the sea.",
   "The office is open plan, so everyone can see everything and nobody looks at anything. {name} walks straight through the middle of it.",
   "{name} arrives in the dead hour after lunch, when the whole floor is staring at one spreadsheet and thinking about another job.",
   "There is a sign on the closet door. It says to see Brenda. Under it, in three different inks, people have written when she is back. No two agree.",
  ],
  'turn': [
   "The printer jams, and for twenty minutes the entire floor is about the printer.",
   "A fire drill empties the building into the car park. {name} goes down one flight with the crowd and comes back up alone.",
   "Someone has brought in a cake. The floor gathers at the far end to sing, badly, and for the length of one song the corridor is empty.",
   "An all-hands meeting is called with no agenda. Every desk on the floor is abandoned by people expecting the worst.",
   "A man from IT asks {name} to turn it off and on again. There is no it. {name} agrees, and he goes away satisfied.",
   "Brenda has left an out-of-office reply. It is four paragraphs long, and the third, read carefully, says where the spare key is.",
   "The lock is a cheap one. That is the cruelty of it. It has defeated the whole building for a month by being slightly sticky.",
   "Someone reheats fish in the kitchen. The inquiry that follows occupies two departments and most of the afternoon.",
  ],
  'end': {
   'good': [
    "{name} walks out through reception with a full tote bag and a visitor badge that was due back at the desk.",
    "By the time anyone notices the closet is open, {name} is gone, and the good staplers with it.",
    "{name} leaves with more than one contractor should be carrying, and holds the lift for someone on the way.",
    "Brenda will come back from leave to a closet that looks untouched and is forty percent lighter.",
   ],
   'poor': [
    "{name} leaves through reception with a lanyard, a biro and a strong sense of Brenda.",
    "The closet held. {name} comes home with what was loose in the kitchen.",
    "{name} is asked to sit in on the meeting, and by the time it ends, so has the opportunity.",
    "The lock stuck, as it sticks for everyone. {name} comes back with the little that was outside it.",
   ]}},
 'outback': {
  'open': [
   "The trench runs straight across a wheat field in Western Australia, and the army that dug it has not been back. {name} climbs down with a shovel.",
   "Red dust, white sky, and wheat to the horizon. {name} finds the trench by falling into it, as the army did.",
   "The army left this trench in a hurry in 1932, and left most of what it brought. The emus have not touched it. It is beneath them.",
   "It is forty in the shade, and the nearest shade is in another district. {name} starts digging before the heat gets its second wind.",
   "A farmer leaning on a fence tells {name} where the soldiers camped, what they lost, and how many birds they got. The last number is very small.",
   "Three emus watch {name} arrive from the far side of the field. They do not approach. They do not leave either.",
  ],
  'turn': [
   "The shovel hits a crate of machine-gun ammunition, most of it unfired. The report to Canberra said they ran out.",
   "A mob of emus comes through the wheat at a stroll, forty or fifty of them. {name} lies flat in the trench until the war has passed over.",
   "A willy-willy spins across the paddock, lifts the top inch off everything, and sets it down again rearranged. The dig is suddenly easier.",
   "One emu stands at the lip of the trench and looks down for a long time, as at a mistake someone else is about to make.",
   "{name} digs up an officer's field diary. The last entry reads, in full: the birds are organised.",
   "A dust storm rolls in the colour of rust, and the day goes dark at two in the afternoon. {name} keeps digging by feel.",
   "The farmer's dog arrives to help, and digs up more in ten minutes than {name} has in an hour, none of it where it would be useful.",
   "Under the duckboards there is a tin trunk, and under the trunk there is a snake that has lived there, undisturbed and content, since the retreat.",
  ],
  'end': {
   'good': [
    "{name} climbs out of the trench at sundown, red to the eyebrows, hauling more than the army took home.",
    "The emus watch {name} go, loaded down. It is not their concern. They have already won.",
    "{name} comes back caked in dust, and when the dust is knocked off there is a great deal underneath.",
    "It was a good dig. {name} leaves the trench deeper than the army left it, and emptier.",
   ],
   'poor': [
    "{name} comes back with a blistered hand and a tin of bully beef older than the trench.",
    "The trench gave up dust, mostly. {name} brings home the best of the dust.",
    "The emus stood on the good end of the trench all day. {name} did not ask them to move. Nobody has ever asked twice.",
    "{name} comes home red, dry and nearly empty-handed, having lost the afternoon to the same birds the army did.",
   ]}},
 'blackforest': {
  'open': [
   "The path into the Black Forest gives out after an hour. The clearing is a further hour past where the path gives out.",
   "Nothing grows in the witch's clearing, and the trees around it lean back a little. {name} walks to the middle and puts a shovel in.",
   "The villagers will sell {name} a shovel, a lantern and a blessing, and would rather not be told what any of them is for.",
   "It is midday on the road and dusk under the trees. {name} lights the lantern and goes in among the firs.",
   "There is a ring of mushrooms around the clearing, quite unbroken. {name} steps over it and feels the day get a little quieter.",
   "A raven watches {name} into the clearing, flies off, and comes back with two more ravens.",
  ],
  'turn': [
   "The shovel strikes a box. The box knocks back.",
   "A candle is burning in the window of the cottage. There is no cottage. {name} digs on the side of the clearing away from the window.",
   "Every bird in the forest stops singing at once. {name} stops digging. After a while the birds start again, and so, more quietly, does {name}.",
   "Someone has buried a jar of teeth here with great care, and under it something they cared about rather more.",
   "The roots have grown around the thing in the ground as fingers do around a coin. It takes patience and an apology to get them off.",
   "A little old woman comes down the path with a basket and asks what {name} is digging for. She is told turnips. She says that is what the last one said.",
   "The hole fills with fog from the bottom up. {name} works on by touch, and declines to think about what else might be.",
   "Something walks around the edge of the clearing, just past the lantern light, for most of an hour. It keeps to the far side of the mushrooms.",
  ],
  'end': {
   'good': [
    "{name} walks out of the trees with a full sack, a lantern burned down to the socket, and no wish to describe the afternoon.",
    "The clearing gave up a good deal. {name} fills the hole in afterwards, carefully, and says thank you to nobody in particular.",
    "{name} comes home heavy laden and smelling of woodsmoke, although nothing in the forest was on fire.",
    "By the time {name} reaches the road, the sack has stopped moving. It is a good, full sack.",
   ],
   'poor': [
    "{name} comes out of the forest with dirt to the elbows and little else. Some things chose to stay buried.",
    "The clearing kept what it had. {name} comes home with the shovel, the lantern and most of the blessing.",
    "Whatever is under the clearing went deeper as {name} dug. It can do that all day, and did.",
    "{name} returns with a light sack and one boot full of mushrooms, neither of which was the aim.",
   ]}},
 # nobody is sent here today; it is the fallback if a place is ever added without beats of its own
 'archive': {
  'open': [
   "{name} goes down the cellar stairs of the Archive, past the shelves that are catalogued, to the ones that are not.",
   "The Archive is larger underneath than its outside admits. {name} takes a candle and a ball of string.",
  ],
  'turn': [
   "A book on a low shelf clears its throat.",
   "The string runs out. {name} ties it off and goes on a little further, as everyone does.",
   "A draught turns three hundred pages at once, all to the same word.",
  ],
  'end': {
   'good': ["{name} comes back up the stairs with an armful, following the string."],
   'poor': ["{name} comes back up with dust and the end of the string. The shelves had moved."],
  }},
}

TONE = {
 'rich': [
  "{n} things on the Archive floor. Smudge has started a fresh page for them.",
  "A good trip. The ledger entry runs to a second line.",
  "Smudge counts the haul twice, and it comes out the same both times, which is rare.",
  "It all goes into the ledger, and {ink} ink with it.",
  "The pile takes a while to sort. Nobody is complaining.",
 ],
 'thin': [
  "Smudge writes it down anyway. A thin page is still a page.",
  "Not every trip is a saga. This one is a footnote.",
  "The ledger takes it without comment. The ledger has seen worse.",
  "There is always next time. The place is not going anywhere. Most of it is in the past.",
  "{n} in the ledger. Small, but honestly come by. Well. Come by.",
 ],
 'early': [
  "Called home before the end. The rest of the story stays where it was.",
  "Recalled early, with the job half done and the good part still ahead.",
  "The stamp came down early, and that was that. What was in hand came home.",
  "Home ahead of time. Somewhere back there, a moment is still waiting for someone to walk into it.",
 ],
 'rare': [
  "One of these is worth more than the rest of the pile together. Smudge has stamped it twice.",
  "There is something in this haul that people cross centuries for.",
  "Smudge holds one of them up to the candle for a long time before writing anything.",
  "Most of it is good. One of it is extraordinary.",
 ],
 'junk': [
  "Junk. Some of it interesting junk, and Smudge has ruled that this counts.",
  "Nothing here that anyone will miss. That is the one advantage.",
  "The ledger has a column for this sort of haul. It is a wide column.",
  "Junk, top to bottom. Even junk gets a line in the ledger.",
 ],
}

# One hero, one place: each of them always goes to the same door, so these are about that place.
# Shown as "Name: line" after the ending, whether the haul was good or bad. Never mention the haul.
VOICE = {
 # --- the supply closet
 'kevin': ["I was in that building four hours and attended two meetings. I don't work there.",
           "Someone asked if I had capacity. I said I'd circle back. I will not.",
           "Their kitchen had a mug tree. I kept hold of mine. You don't know those people."],
 'marco': ["Fourth floor, no lift, nobody at the desk. I've had worse drops. Nobody signed for it, though.",
           "I left a card. Sorry we missed you. Habit.",
           "In and out in under thirty minutes. Still no tip."],
 'chad': ["A whole office of people on salaries. Salaries! In this market. I felt sorry for them. Out loud.",
          "I pitched the guy at reception. He's thinking about it. He blocked my number, but he's thinking.",
          "That closet is a store of value. Staplers only go up."],
 'pam': ["Their vending machine eats coins on the third row. I know its pattern now. It will never eat again.",
         "The lock's a timing puzzle. Two frames of give on the left. Baby stuff.",
         "I put my initials on the visitor log. Top line. It's a board, isn't it."],
 'doug': ["There is no sign-out sheet on that closet. None. Anyone could take anything. We did, and I've itemised it.",
          "Their stationery budget is forty percent over. I left a note. Unsigned. I'm calm about it.",
          "Someone there had claimed a lunch as client development. Not my company. I rejected it anyway."],
 'beep': ["I served tea to the fourth floor. It was well received. The sprinklers came on shortly afterwards. I do apologise.",
          "A gentleman from IT suggested I turn myself off and on again. I thanked him. I am not certain I would come back on.",
          "The smoke alarm and I have come to know one another. It has a great deal to say."],
 'zorp': ["Greg attended the human workplace. Greg said 'living the dream' at the water device. The humans accepted Greg completely.",
          "They hold a meeting every Tuesday. EVERY Tuesday. It is worse than I feared. I have moved it to Wednesday. It begins.",
          "A human asked Greg which department. Greg said Earth. This was apparently a joke. Greg is very funny."],
 # --- Roman dock
 'brokk': ["Big water. Wooden beasts float on it with men inside. Brokk asks no questions now. Brokk just nods.",
           "Brokk hit river with stick. River gave fish. Rome very clever, but stick still works.",
           "Men here have warm floors. WARM FLOORS. Brokk lay down on one. Was asked to leave."],
 'gaius': ["The road to Ostia is a disgrace. Ruts a hand deep. I know the man who laid it, and I know where he drinks.",
           "Marched there, marched back. The knee held. Don't tell the knee I said so.",
           "Good to see home. Nobody on that dock salutes properly any more."],
 'cleocatra': ["I was carried to the dock, carried along the dock, and carried home. It was exhausting.",
               "A crate was sitting on the edge of the quay. I looked at it. Then it was in the harbour. These things happen around me.",
               "Rome's own port. A general once promised it to me. I should have kept the receipt."],
 'ajolote': ["A docker challenged me. Then eight more. I did not remove the mask. I did not need the second arm.",
             "The river took a finger. No matter. By Sunday I will have it back, and the river will have learned nothing.",
             "I slept one hour in the harbour. The best tank I have known."],
 'gladius': ["I flexed at the harbour. A crane man dropped his load. I take none of the blame and all of the credit.",
             "The dockers wanted a bout. I oiled the mane. By the time I had finished, they had conceded.",
             "Salt air is murder on a mane. The things I do for the people."],
 'tut': ["The dock men fell on their faces when I arrived. People do. I have stopped asking them to get up. It only takes longer.",
         "My antlers do not fit along the quay. Three awnings and a sail are now part of the royal procession.",
         "They offered me grain. I ate the grain. Being a god is mostly this."],
 # --- Bondi
 'bella': ["The light at four was unreal. I got the shot. I also got whatever we went for, probably.",
           "Somebody's towel was in my frame, so now it's my towel.",
           "I stood in the rock pool on one leg for an hour. For me that's just standing."],
 'florida': ["They got signs up says no swimmin' past the flags. Didn't see no flags where I was. I was under the pier.",
             "Lifeguard asked me to put that back. I asked him which one. We left it there.",
             "Nice beach. Only got asked to leave it the once."],
 'jacko': ["Home turf, mate. Pulled two out of the rip while I was at it. Both needed more sunscreen.",
           "Tide was easy, pool was calm, and everyone on that beach is now wearing a hat. Good day.",
           "Seagull had a go at me. Fair enough. It's his beach too."],
 'jazzmin': ["And FOUR sets of beach sprints! The sand fights back, people! That's free resistance!",
             "I got the whole lifeguard tower doing lunges. They don't know why. They feel amazing.",
             "I rested. For one full second. I did not care for it."],
 'dolly': ["A lifeguard proposed. Lovely boy. That's forty-two. I kept the ring. It would've been rude not to.",
           "I sang on the promenade for a minute, and the whole beach looked the wrong way. You're welcome, darl.",
           "I watched the clock on the pavilion the entire time. Old habit. It's a good clock."],
 # --- Lofoten
 'blackbear': ["No rum north of anywhere. A man could weep. I didn't. It froze first.",
               "There were gulls. On the ICE. Sat there, looking. We'll say no more about it.",
               "Whatever's under that ice has antlers and the good sense to stay clear of me. I return the favour."],
 'astrid': ["Home. Still cold, still dull. They have not put in a single chair.",
            "Something under the ice wanted a fight. I knelt there an hour. It never came up. Coward.",
            "The village remembered me. They hid the silver. That was sweet of them."],
 'kenji': ["I sat by the hole in perfect stillness for three hours. Then a man walked past with dried fish, and I am ashamed of what followed.",
           "The cold is a teacher. Today's lesson was the cold.",
           "A warrior endures. A warrior also notes, for the record, that it was extremely cold."],
 'raspawtin': ["I fell through the ice. I was under some time. It was restful. I recommend it.",
               "The thing beneath the fjord looked into my eyes. It apologised and withdrew.",
               "They say this cold can kill a man. People say so many things."],
 'flap': ["Came in at two hundred feet. The ice makes a perfectly good runway, and I would say so even if I had meant to use it.",
          "Thirty years I watched gulls cross that fjord. Today I passed one. I didn't look back. Couldn't, in the helmet.",
          "The landing was a success, in that I am here to describe it."],
 'bjorn': ["Went through the ice again. Third time. The gods looked at me, sighed, and pointed at the hole.",
           "Same hole I've fished for forty years. Same fish, I think. We've an understanding. He's winning.",
           "The antlered one came up to look at me. We're both still waiting on something. I nodded. It nodded."],
 # --- the speakeasy
 'vincenzo': ["A fine establishment. I know the owner. He doesn't know that I know him, which is how I like to know a person.",
              "Nobody saw me there. I was very polite about making sure.",
              "I left a bottle of olive oil on the bar. As a courtesy. It lets a man know you were thinking of him."],
 'slapton': ["The room recognised me at once. They pretended not to, out of respect.",
             "I did all my own sneaking. Ask me about it. No, sit down. Ask me properly.",
             "A man there looked at me wrong. I've dealt with it. You'll read about it."],
 'lola': ["A gentleman bought me champagne all evening. He has since discovered what he paid with.",
          "I did one number with the band. By the second verse, nobody in that room was minding a thing.",
          "Chicago men keep their wallets in the same pocket as Paris men. It is a comfort, when one travels."],
 'vesper': ["Too much brass. Too many people enjoying themselves. I stood in the corner and it improved.",
            "The doorman knew me. They all do. It was 1927 and he still knew me. I don't ask.",
            "I danced. Nobody saw. If you tell anyone, I will deny it for a hundred years."],
 'roxy': ["Band could all play. Properly. Scales and everything. Disgusting.",
          "I asked to sit in. They asked what key. I asked what's a key. We left it there.",
          "Borrowed a trumpet mute. No idea what it's for. It's mine now."],
 'sterling': ["I have been undercover in that very room since 1921. They have named a drink after me. It rather defeats the point.",
              "My report on the evening runs to nine pages. Eight concern the martini.",
              "Not a mark on the jacket. There was a moment, by the safe, with the ink. But no."],
 'eagleton': ["I shook every hand in that establishment. Some of them twice. One of them was a coat stand, and it has my vote.",
              "My friends, I gave the victory speech from the top of the piano. It was my tenth. The band played through it, which I call bipartisan.",
              "I promised that room a fish in every pot. A man asked what office I was running for. I said yes."],
 # --- the Doge's vault
 'napoleon': ["The lock was mounted very high on the door. This was deliberate. Venice will answer for it.",
              "I took the palace in under an hour. I gave it back. There was nowhere to put it.",
              "A footman offered to fetch me a stool. I have his name."],
 'joost': ["A vault full of gold, and not one bulb in it. Venice has no idea what wealth is.",
           "I offered the guard a share in a tulip. He said no. He'll regret it by spring.",
           "Gold only ever goes up a little. A tulip can go up forty times in a week. I explained this to the Doge's door."],
 'sable': ["Fourth time through that door. I gave everything a rinse on the way out. You don't know where the Doge has been.",
           "Lovely lock. I'd have taken it too, but it wouldn't fit in the canal bag.",
           "If it's a little damp, that's the washing. Clean hands, clean goods."],
 'stella': ["Death trap number forty-two. Rising water, locked door, slow guard. I looked for the switch marked ESCAPE. There's always one.",
            "No Martians. No ray guns. One nephew with a mop. Frankly, a holiday.",
            "Eleven wards and a false keyhole. I've been tied to rockets with better security."],
 'rex': ["The damp in Venice, man. The HAIR. I went through two cans before the second canal.",
         "I sang to the lock. Opened right up. Could've been the guard's key, but I felt a connection.",
         "That was the last heist. The farewell heist. I'll probably add dates."],
 'mona': ["I stood beside the vault door for an hour. Three guards walked past me. One hung his coat on me.",
          "I painted the Doge once. He looked at the portrait all afternoon, and not once at his rings.",
          "I came out of the palace the colour of gold leaf. It took a while to fade. I enjoyed the walk home."],
 'hootsworth': ["I looked at the lock for four minutes. It opened. They usually do.",
                "The guard confessed to eleven things before I had said a word. None of them were our business. I have written them down regardless.",
                "There was someone behind me the whole time. I had been watching him. He did not like that."],
 'selene': ["I went in through the front door. The Doge kissed my hand. It's lighter now.",
            "There's a window in that palace nobody knows can open. Several, actually. I keep a list.",
            "They've invited me back for dinner on Thursday. I'll bring something. It will be theirs."],
 # --- the emu trench
 'maya': ["Forty degrees, no shade, and everybody's hydrated, because I checked. Twice.",
          "I took the trench's pulse. Force of habit. It's been dead since 1932.",
          "One emu had a limp. I did what I could. It wasn't grateful, which is fine. They never are."],
 'edith': ["That trench was dug by men, in a straight line, with no drainage. I have added it to the list.",
           "I shored up the east wall while I was down there. It was going to bother me.",
           "A gentleman at the fence asked who was supervising me. He is on the list now. It is a long way to come to be on the list."],
 'emu': ["I inspected the old battlefield. The enemy has not returned. They know better.",
         "My troops hold the field still. I took the salute. Standards are being kept.",
         "They left their guns behind in 1932. I leave them where they lie. As a lesson."],
 'madjack': ["Capital trench. Bit shallow. I played the pipes from the parapet, and the emus formed up beautifully.",
             "Charged the far end with the sword. Nothing there. Felt marvellous anyway.",
             "Lost a war to birds, those fellows. Should have brought a longbow. I did."],
 'max': ["Forecast said dry. It was dry.",
         "I told myself I was done with trenches. Then they took my boat. This one's got nothing to do with the boat. I just want the boat on record.",
         "Forty emus. One of me. I let them walk. Knee."],
 'dusty': ["Army dug that trench in a week and walked off. I've been on mine eleven years. Don't talk to me about that trench.",
           "Found more in their hole in one afternoon than in mine since '21. I'm not upset. Who's upset.",
           "The birds remember me. I sat on my step for their whole war. They respect a woman who minds her own business."],
 # --- the witch's clearing
 'albrecht': ["The forest air is thick with ill humours. I prescribed it leeches. I had only forty with me.",
              "Something in the clearing was unwell. I could not find where to put the leeches, so I left some near it.",
              "A raven looked at my mask for some time. I believe it took me for a colleague."],
 'troffea': ["I danced all the way round the mushroom ring, and something inside it kept time. Lovely manners.",
             "The trees wouldn't join in. Trees never do. The roots, though. The roots had rhythm.",
             "I haven't stopped since we left. I didn't stop there either. The digging was done on the off-beat."],
 'morwenna': ["My own forest. The clearing knows me. We do not speak of what happened with the lantern.",
              "I walked in the dark as one born to it, straight and silent, until some fool lit a lamp. Then there was a short delay.",
              "The old woman on the path is a neighbour. We nod. She has never forgiven me the candle shop."],
 'gorm': ["GORM! I announced myself to the forest. The forest went very quiet. Respect.",
          "I ruled that clearing. All of it that I could see. A good four feet.",
          "Something moved beyond the lantern light. I could not see it. Therefore it did not concern Gorm."],
 'quack': ["No lightning all day. Not a flicker. A deeply disappointing forest. I shall return in worse weather.",
           "Something buried in that clearing is not entirely dead. Promising! Very promising!",
           "I held my rod over the tallest fir for an hour. The villagers watched from a distance. They've stopped bringing torches. It's sandwiches now."],
}

ABOUT = ("Expedition stories, written by Fable (F5). Built by tools/exped_text.py: edit that, not this file. "
         "The engine reads beats[placeId] = {open, turn, end:{good,poor}}, tone = {rich,thin,early,rare,junk} and "
         "voice[heroId] = lines in that hero's own voice, shown as 'Name: line'. {name} is the hero's short name, "
         "{place}, {era}, {n} things brought back, {ink} ink earned.")

def check():
    rules = json.load(open(os.path.join(ROOT, 'data', 'rules.json')))
    heroes = {h['id']: h for h in rules['heroes']}; places = {p['id'] for p in rules['places']}
    bad = []
    for pid in places:
        if pid not in BEATS: bad.append(f'no beats for place {pid}')
    for hid, h in heroes.items():
        if hid not in VOICE: bad.append(f'no voice for {hid}')
        elif h['place'] not in BEATS: bad.append(f'{hid} goes to {h["place"]}, which has no beats')
    for hid in VOICE:
        if hid not in heroes: bad.append(f'voice for unknown hero {hid}')
    every = [l for b in BEATS.values() for k in ('open', 'turn') for l in b[k]] + [l for b in BEATS.values() for e in b['end'].values() for l in e] \
          + [l for t in TONE.values() for l in t] + [l for v in VOICE.values() for l in v]
    for l in every:
        for ph in re.findall(r'\{(\w+)\}', l):
            if ph not in ('name', 'place', 'era', 'n', 'ink'): bad.append(f'unknown placeholder {{{ph}}}: {l[:50]}')
        if '—' in l or '–' in l: bad.append('dash: ' + l[:50])
    for v in VOICE.values():
        for l in v:
            if '{name}' in l: bad.append('voice line uses {name}: ' + l[:50])
    if len(set(every)) != len(every): bad.append('a line is repeated')
    return bad, len(every)

if __name__ == '__main__':
    bad, n = check()
    if bad: print('\n'.join(bad)); raise SystemExit(1)
    out = {'_about': ABOUT, 'beats': BEATS, 'tone': TONE, 'voice': VOICE}
    json.dump(out, open(os.path.join(ROOT, 'data', 'expeditions.json'), 'w'), indent=1, ensure_ascii=False)
    combos = {p: len(b['open']) * len(b['turn']) for p, b in BEATS.items()}
    print(n, 'lines;', len(VOICE), 'heroes with a voice; open x turn per place:', combos)
