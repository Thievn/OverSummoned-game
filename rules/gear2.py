"""Era gear: for every hero, five pieces that came through the rift from the same time and place.
None of it is tied to the hero; anyone can wear it. Weapon, head, body, feet, charm.
Head + body + feet make a three-piece set (bonus at 2 and at 3). The weapon has its own special,
and so does the charm.

Each entry: hero id -> (set name, stat the 2-piece bonus raises, 3-piece effect, weapon effect, charm effect, pieces)
An effect is (kind, amount): speed / luck / ink / xp are fractions (work speed, luck at jobs, ink earned,
skill xp); raid is a fraction of extra damage in raids.
A piece is (slot, name, rarity letter, picture for the artist, flavour text).
Rarity letters: c u r e l a x = common uncommon rare epic legendary absurd unhinged.
"""
R = dict(c='common', u='uncommon', r='rare', e='epic', l='legendary', a='absurd', x='unhinged')

ERA = {
 'kevin': ('Open-Plan', 'defense', ('xp', .08), ('speed', .04), ('ink', .03), [
  ('weapon', 'Whiteboard Marker (Dry)', 'c', 'a black whiteboard marker pen with its cap off', 'Squeaks. Leaves no mark. Still somehow threatening in a meeting.'),
  ('head', 'Noise-Cancelling Headphones', 'u', 'big black over-ear headphones', 'Cancels noise, colleagues and three fire drills.'),
  ('body', 'Fleece Vest of Middle Management', 'r', 'a grey zip-up fleece vest with a small logo patch', 'Grants the power to schedule a meeting about meetings.'),
  ('feet', 'Sensible Loafers', 'c', 'a pair of brown leather loafers', 'Have walked to the printer and back nine thousand times.'),
  ('charm', 'Reply-All of Doom', 'e', 'a glowing red envelope icon with a tiny skull seal', 'Four hundred people now know about the missing yoghurt.')]),
 'marco': ('Gig Economy', 'speed', ('speed', .08), ('speed', .05), ('luck', .03), [
  ('weapon', 'Bent Bicycle Pump', 'c', 'a bent silver bicycle hand pump', 'Inflates tyres and, briefly, egos.'),
  ('head', 'Cracked Bike Helmet', 'u', 'a teal bicycle helmet with a crack down the side', 'It did its job once. It would like you to stop testing it.'),
  ('body', 'Hi-Vis Rain Poncho', 'c', 'a bright yellow rain poncho with reflective stripes', 'Visible from space. Still nobody yields.'),
  ('feet', 'Clip-In Cycling Shoes', 'r', 'a pair of sleek black and orange cycling shoes with cleats', 'You will fall over at a red light exactly once. Everyone does.'),
  ('charm', 'Phone at One Percent', 'e', 'a smartphone with a cracked screen showing a red empty battery icon', 'It has been at one percent for six hours. Nobody understands how.')]),
 'maya': ('First Responder', 'health', ('speed', .06), ('raid', .06), ('xp', .04), [
  ('weapon', 'Halligan Bar', 'r', 'a steel firefighter halligan pry bar', 'Opens doors, cars, and conversations nobody wanted to have.'),
  ('head', 'Scuffed Fire Helmet', 'u', 'a yellow firefighter helmet with scuff marks', 'Smells of smoke and somebody else\'s kitchen.'),
  ('body', 'Turnout Coat', 'r', 'a navy firefighter turnout coat with yellow reflective bands', 'Heavy, hot, and the only reason you still have eyebrows.'),
  ('feet', 'Steel-Toe Boots', 'c', 'a pair of black steel-toe work boots', 'You could drop a piano on these. Please do not.'),
  ('charm', 'Defibrillator Paddle of Enthusiasm', 'l', 'a single red defibrillator paddle crackling with a small blue spark', 'CLEAR. No, further back than that.')]),
 'brokk': ('Tundra', 'health', ('raid', .08), ('raid', .06), ('luck', .03), [
  ('weapon', 'A Really Good Rock', 'c', 'a smooth grey fist-sized rock', 'The original weapon. Zero moving parts. Never jams.'),
  ('head', 'Antler Headdress', 'r', 'a headdress made of deer antlers and fur', 'Very impressive until you meet a doorway. Doorways have not been invented.'),
  ('body', 'Woolly Mammoth Coat', 'u', 'a thick shaggy brown fur coat', 'The mammoth is no longer using it.'),
  ('feet', 'Hide Foot Wraps', 'c', 'a pair of rough leather hide foot wraps tied with cord', 'Shoes, version one. Mostly a suggestion.'),
  ('charm', 'Cave Painting of a Horse', 'e', 'a flat stone slab with a red ochre cave painting of a horse', 'The first art critic said the legs were wrong. He was eaten.')]),
 'gaius': ('Legion', 'defense', ('raid', .10), ('raid', .07), ('ink', .03), [
  ('weapon', 'Pilum Javelin', 'u', 'a Roman pilum javelin with a long iron shank', 'Designed to bend on impact so it cannot be thrown back. Rude.'),
  ('head', 'Crested Galea Helmet', 'r', 'a Roman legionary helmet with a red horsehair crest', 'The crest is so the centurion can find you to shout at.'),
  ('body', 'Lorica Segmentata', 'e', 'Roman banded steel segment armor chest piece', 'Forty-seven straps. One of them is always undone.'),
  ('feet', 'Caligae Sandals', 'c', 'a pair of Roman leather military sandals with hobnails', 'Marched across a continent. Smell like it.'),
  ('charm', 'Thumbs-Down of the Emperor', 'l', 'a golden statuette of a hand giving a thumbs down', 'Nobody is sure which way was bad. It worked out badly either way.')]),
 'edith': ('Workshop', 'speed', ('speed', .10), ('xp', .05), ('speed', .03), [
  ('weapon', 'Ball-Peen Hammer', 'c', 'a ball-peen hammer with a wooden handle', 'When it is your only tool, everything looks like a bridge.'),
  ('head', 'Brass Welding Goggles', 'u', 'round brass goggles with dark lenses and a leather strap', 'Make everything look like it is on fire. In her line of work, it usually is.'),
  ('body', 'Boiler Suit', 'c', 'a grey-blue boiler suit coverall with oil stains', 'More pockets than sense. A spanner in every one.'),
  ('feet', 'Hobnail Boots', 'u', 'a pair of sturdy brown leather hobnail boots', 'Announce your arrival two streets away.'),
  ('charm', 'Perpetual Motion Machine (Broken)', 'a', 'a small brass contraption of spinning wheels and weights with one wheel fallen off', 'Ran forever, for about a minute.')]),
 'albrecht': ('Pestilence', 'health', ('luck', .08), ('raid', .05), ('luck', .04), [
  ('weapon', 'Pointing Stick', 'c', 'a long thin wooden cane with a brass tip', 'For examining patients from a distance he considers reasonable.'),
  ('head', 'Beaked Mask', 'r', 'a black leather plague doctor beak mask with round glass eyes', 'Stuffed with lavender. Solves nothing. Smells lovely.'),
  ('body', 'Burial Shroud (Unused)', 'u', 'a folded pale linen burial shroud tied with a cord', 'Still in the wrapping. He is saving it.'),
  ('feet', 'Mud-Caked Clogs', 'c', 'a pair of wooden clogs caked in mud', 'The mud is the cleanest thing in the village.'),
  ('charm', 'Jar of Bad Air', 'e', 'a sealed glass jar with green swirling mist inside', 'Medieval science at its finest. Do not open. Do not ask.')]),
 'vincenzo': ('Prohibition', 'luck', ('luck', .10), ('raid', .06), ('ink', .04), [
  ('weapon', 'Baseball Bat (Negotiating)', 'u', 'a wooden baseball bat with a few dents', 'He has never played baseball. He has had many conversations.'),
  ('head', 'Flat Cap', 'c', 'a grey tweed flat cap', 'Worn low. Sees nothing. Heard nothing.'),
  ('body', 'Trench Coat With Too Many Pockets', 'r', 'a tan trench coat hanging open to show many inner pockets', 'Watches? Cutlery? A second, smaller coat?'),
  ('feet', 'Two-Tone Spats', 'u', 'a pair of black and white two-tone spat shoes', 'For leaving a room quickly but with style.'),
  ('charm', 'Cement Sample', 'l', 'a small grey cement block with a pair of shoe prints pressed into the top', 'A gift from a business associate. It is a hint.')]),
 'slapton': ('Red Carpet', 'luck', ('ink', .10), ('luck', .06), ('ink', .05), [
  ('weapon', 'Clapperboard', 'u', 'a black and white film clapperboard', 'Take forty-seven. He will get it this time.'),
  ('head', 'Director\'s Megaphone', 'r', 'a red cone megaphone', 'Not a hat. He wears it as a hat.'),
  ('body', 'Dressing Gown With His Own Face On', 'e', 'a silk dressing gown with a gold star pattern and a monogram', 'Monogrammed, embroidered, and for sale in the lobby.'),
  ('feet', 'Tap Shoes', 'c', 'a pair of shiny black tap shoes', 'He cannot tap. The shoes do not know that.'),
  ('charm', 'Acceptance Speech (Unused)', 'a', 'a crumpled sheet of paper covered in handwriting, held by a gold paperclip', 'Eleven pages. Thanks himself twice.')]),
 'napoleon': ('Grande Armée', 'attack', ('raid', .10), ('raid', .08), ('xp', .04), [
  ('weapon', 'Field Cannon (Pocket)', 'e', 'a tiny brass cannon on wooden wheels', 'Small, loud, and with a great deal to prove.'),
  ('head', 'Bearskin Cap', 'r', 'a tall black bearskin grenadier cap with a red plume', 'Adds a full foot of height. He owns nine.'),
  ('body', 'Grenadier Greatcoat', 'u', 'a long blue military greatcoat with red cuffs and brass buttons', 'Marched to Moscow. Regretted it around Smolensk.'),
  ('feet', 'Riding Boots With Lifts', 'r', 'a pair of tall black riding boots with thick heels', 'The lifts are a state secret.'),
  ('charm', 'Map With Everything Circled', 'l', 'an old map of Europe covered in red circles and arrows', 'He circled Russia twice. Nobody stopped him.')]),
 'cleocatra': ('Nile', 'luck', ('luck', .12), ('luck', .06), ('ink', .05), [
  ('weapon', 'Crook and Flail', 'r', 'a golden Egyptian crook and flail crossed', 'One is for guiding. One is for the other thing.'),
  ('head', 'Vulture Crown', 'e', 'a golden Egyptian vulture crown headdress with blue inlay', 'The vulture is decorative. She says.'),
  ('body', 'Linen Robe of Nine Pleats', 'u', 'a white pleated linen Egyptian robe with a gold collar', 'Ironed by forty servants. Sat on by one cat.'),
  ('feet', 'Papyrus Sandals', 'c', 'a pair of woven papyrus sandals', 'Have never touched the floor. That is what the litter is for.'),
  ('charm', 'Cursed Cat Statue', 'a', 'a black Egyptian cat statue with glowing green eyes and a gold earring', 'It is on the shelf. It was on the table. Nobody moved it.')]),
 'blackbear': ('Jolly Roger', 'attack', ('raid', .10), ('raid', .07), ('luck', .05), [
  ('weapon', 'Flintlock With a Bent Barrel', 'u', 'a flintlock pistol with a bent barrel', 'Shoots around corners. Not on purpose.'),
  ('head', 'Tricorne With a Parrot-Shaped Stain', 'r', 'a black tricorne pirate hat with a white feather', 'The parrot is gone. The memory remains.'),
  ('body', 'Striped Deckhand Shirt', 'c', 'a red and white striped sailor shirt', 'Washed annually, by rain.'),
  ('feet', 'Sea Boots Full of Water', 'u', 'a pair of tall brown leather sea boots with water sloshing out', 'Squelch. Squelch. Squelch.'),
  ('charm', 'Treasure Map Where X Is Everywhere', 'l', 'a treasure map covered in dozens of red X marks', 'He drew it himself after the rum. All of them are worth checking.')]),
 'astrid': ('Longship', 'attack', ('raid', .10), ('speed', .05), ('xp', .04), [
  ('weapon', 'Seax Knife', 'c', 'a Viking seax knife with a bone handle', 'For bread, rope, and settling disputes about bread.'),
  ('head', 'Helmet (No Horns, Actually)', 'r', 'a Viking iron helmet with a nose guard and no horns', 'Historians were very insistent about this.'),
  ('body', 'Ring Mail Byrnie', 'e', 'a Viking chain mail shirt', 'Ten thousand rings. She counted on a slow raid.'),
  ('feet', 'Fur-Lined Boots', 'u', 'a pair of leather boots lined with grey fur', 'Warm, quiet, and soaked with someone else\'s river.'),
  ('charm', 'Rune Stone That Says "Wet Paint"', 'a', 'a small grey standing stone carved with glowing blue runes', 'Scholars spent forty years translating it.')]),
 'kenji': ('Edo Road', 'speed', ('xp', .10), ('raid', .06), ('xp', .05), [
  ('weapon', 'Bamboo Training Sword', 'c', 'a bamboo shinai training sword', 'A thousand strikes a day. The bamboo is tired too.'),
  ('head', 'Topknot Ribbon', 'u', 'a white silk hair ribbon tied in a knot', 'Holds the hair. Holds the honour.'),
  ('body', 'Patched Travelling Kimono', 'c', 'a faded indigo kimono with visible patches', 'More patch than kimono now. Each one is a story he will not tell.'),
  ('feet', 'Straw Waraji Sandals', 'c', 'a pair of woven straw waraji sandals', 'Last about a week. He has walked through four hundred pairs.'),
  ('charm', 'Tea Whisk of Absolute Calm', 'l', 'a bamboo tea whisk glowing softly green', 'Nothing can disturb the one who holds it. Except a dropped rice ball.')]),
 'emu': ('Great Emu War', 'speed', ('speed', .12), ('raid', .10), ('speed', .06), [
  ('weapon', 'Rifle With a Bent Sight', 'u', 'a bolt-action rifle with a visibly bent front sight', 'Issued to the losing side. Explains a lot.'),
  ('head', 'Cork Hat', 'c', 'an Australian bush hat with corks dangling on strings from the brim', 'Keeps the flies off. Makes a noise like applause.'),
  ('body', 'Feather Camouflage', 'r', 'a cloak made of brown emu feathers', 'An emu wearing emu feathers. The army never stood a chance.'),
  ('feet', 'Sprinting Talons', 'e', 'a pair of huge clawed emu foot coverings in dark bronze', 'Fifty kilometres an hour and no idea where they are going.'),
  ('charm', 'Official Surrender of Australia', 'x', 'a formal parchment document with a red wax seal and a three-toed footprint signature', 'Signed by a major, a minister, and one confused farmer.')]),
 'troffea': ('Dancing Plague', 'speed', ('speed', .10), ('speed', .05), ('luck', .04), [
  ('weapon', 'Wooden Spoon', 'c', 'a large wooden cooking spoon', 'She was cooking when it started. She never put it down.'),
  ('head', 'Ribboned Kerchief', 'c', 'a white linen kerchief with coloured ribbons', 'Has not come loose in four days of dancing. Nobody knows how.'),
  ('body', 'Embroidered Bodice', 'u', 'a green embroidered medieval bodice with lacing', 'Stitched by her mother, who also could not stop.'),
  ('feet', 'Clogs That Will Not Stop', 'e', 'a pair of red wooden clogs with motion lines around them', 'They tap when nobody is in them. The priest has been informed.'),
  ('charm', 'Physician\'s Note: "More Dancing"', 'a', 'a medieval prescription scroll with a wax seal', 'The real cure the council actually tried. It did not work.')]),
 'joost': ('Tulip Mania', 'luck', ('ink', .10), ('luck', .05), ('ink', .06), [
  ('weapon', 'Bulb Dibber', 'c', 'a wooden garden dibber tool with a pointed tip', 'For planting. For pointing. For poking rival speculators.'),
  ('head', 'Tall Capotain Hat', 'u', 'a tall black Dutch capotain hat with a buckle', 'Height is confidence. Confidence is credit.'),
  ('body', 'Fur-Trimmed Merchant Coat', 'r', 'a black Dutch merchant coat with brown fur trim', 'Bought at the peak. Worth three radishes now.'),
  ('feet', 'Buckled Shoes', 'c', 'a pair of black leather shoes with large silver buckles', 'The buckles were silver until Tuesday.'),
  ('charm', 'Futures Contract for One Onion', 'l', 'a rolled contract with a ribbon beside a single onion', 'He was told it was a tulip. He has stopped checking.')]),
 'chad': ('To The Moon', 'luck', ('luck', .12), ('ink', .06), ('luck', .06), [
  ('weapon', 'Selfie Stick of Conviction', 'c', 'an extended silver selfie stick', 'For filming the apology video.'),
  ('head', 'VR Headset', 'r', 'a white VR headset with a glowing blue visor', 'He lives in there now. The rent is lower.'),
  ('body', 'Rocket Onesie', 'u', 'a grey onesie covered in little rocket prints', 'Formal wear, in his circles.'),
  ('feet', 'Limited-Edition Sneakers (Unboxed)', 'e', 'a pair of pristine white and neon sneakers still in an open shoebox', 'Never worn. Never will be. Somehow worth a car.'),
  ('charm', 'Picture of a Monkey', 'x', 'a framed picture of a bored cartoon ape wearing a party hat', 'He paid more for this than for his education. It was a screenshot.')]),
 'bella': ('Golden Hour', 'luck', ('luck', .10), ('speed', .05), ('ink', .05), [
  ('weapon', 'Hair Straightener (Hot)', 'u', 'a pink hair straightener glowing orange at the plates', 'Four hundred degrees and left on the bed.'),
  ('head', 'Oversized Sunglasses', 'c', 'huge black designer sunglasses', 'Cover most of the face. That is the look.'),
  ('body', 'Kaftan She Was Paid to Wear', 'r', 'a flowing pink and gold beach kaftan', 'Hashtag ad. Hashtag gifted. Hashtag please.'),
  ('feet', 'Six-Inch Wedges', 'u', 'a pair of tall cork wedge sandals', 'On sand. She has one leg and still makes it work.'),
  ('charm', 'Discount Code BELLA10', 'l', 'a shiny pink gift card with a percent sign', 'Ten percent off something nobody needed.')]),
 'florida': ('Sunshine State', 'attack', ('raid', .12), ('raid', .10), ('luck', .06), [
  ('weapon', 'Pool Noodle (Weaponised)', 'c', 'a bright green foam pool noodle', 'Police report describes it as "surprisingly effective".'),
  ('head', 'Airboat Fan Hat', 'r', 'a baseball cap with a small propeller fan mounted on top', 'Provides lift. Not enough. Yet.'),
  ('body', 'Tank Top From a Gas Station', 'c', 'a white sleeveless tank top with a sunset palm tree print', 'Came free with forty gallons.'),
  ('feet', 'One Flip-Flop', 'u', 'a single orange flip-flop sandal', 'The other one is with the alligator. They have an understanding.'),
  ('charm', 'Mugshot (Framed)', 'x', 'a framed police mugshot placard with a height chart and a grinning alligator silhouette', 'His third favourite. The other two are on the fridge.')]),
 'lola': ('Cabaret', 'speed', ('luck', .10), ('luck', .06), ('speed', .05), [
  ('weapon', 'Champagne Sabre', 'r', 'a short curved sabre with a champagne cork stuck on the tip', 'Opens bottles. Ends arguments. Usually in that order.'),
  ('head', 'Feathered Showgirl Headdress', 'e', 'a tall showgirl headdress of red and gold feathers and rhinestones', 'Weighs as much as a small dog. She has never once looked down.'),
  ('body', 'Velvet Opera Cloak', 'u', 'a deep red velvet opera cloak with gold lining', 'For arriving late on purpose.'),
  ('feet', 'Tap-Dance Spats', 'r', 'a pair of white spats over black heeled dance shoes', 'Every step is a drumroll.'),
  ('charm', 'Admirer\'s Letter (One of Hundreds)', 'c', 'a perfumed letter sealed with a lipstick kiss', 'She uses them to light the stove.')]),
 'morwenna': ('Hedgerow', 'luck', ('xp', .10), ('luck', .06), ('xp', .05), [
  ('weapon', 'Broom That Sulks', 'u', 'a twig broomstick with a frowning knot in the wood', 'Will fly, but will make a noise about it.'),
  ('head', 'Hat With a Bite Taken Out', 'r', 'a pointed black witch hat with a chunk bitten out of the brim', 'The cauldron did that. They do not talk about it.'),
  ('body', 'Shawl of Spider Silk', 'e', 'a grey shawl woven like a delicate spider web', 'The spiders want it back.'),
  ('feet', 'Curly-Toed Boots', 'c', 'a pair of black boots with curled-up toes', 'Curl more when she lies.'),
  ('charm', 'Frog (Formerly a Prince, He Says)', 'a', 'a small green frog wearing a tiny golden crown', 'She has no memory of doing it. He has paperwork.')]),
 'sable': ('Carnival', 'luck', ('luck', .12), ('luck', .07), ('ink', .04), [
  ('weapon', 'Gondola Oar', 'c', 'a long wooden gondola oar', 'Stolen. The gondolier is still going in circles.'),
  ('head', 'Plumed Tricorno', 'u', 'a black Venetian tricorn hat with a white plume', 'Tip it once for hello, twice for run.'),
  ('body', 'Harlequin Doublet', 'r', 'a diamond-patterned harlequin doublet in red, gold and black', 'So loud that nobody remembers the face above it.'),
  ('feet', 'Soft-Soled Thief Slippers', 'e', 'a pair of soft black velvet slippers', 'Silent on marble. Silent on tile. Silent on the Doge\'s bed.'),
  ('charm', 'The Doge\'s Spare Ring', 'l', 'a heavy gold signet ring with a red stone', 'He has not noticed. He has eleven.')]),
 'jacko': ('Surf Patrol', 'health', ('speed', .08), ('speed', .05), ('xp', .04), [
  ('weapon', 'Shark-Bitten Paddle', 'u', 'a wooden paddle with a large bite taken out of the blade', 'The shark apologised. Sort of.'),
  ('head', 'Zinc-Smeared Bucket Hat', 'c', 'a white bucket hat with stripes of coloured zinc cream', 'SPF one thousand.'),
  ('body', 'Rashie', 'c', 'a tight blue and yellow rash guard swim shirt', 'Worn in the surf, at the pub and to one wedding.'),
  ('feet', 'Swim Fins', 'r', 'a pair of yellow rubber swim fins', 'Magnificent in water. Tragic on stairs.'),
  ('charm', 'Whistle of Mild Disapproval', 'e', 'a silver lifeguard whistle on a red and yellow cord', 'One blast: swim between the flags. Two blasts: mate. Come on.')]),
 'raspawtin': ('Winter Palace', 'health', ('raid', .12), ('raid', .10), ('luck', .08), [
  ('weapon', 'Poisoned Wine (Already Drunk)', 'r', 'an empty crystal wine glass with a green drop at the bottom', 'It did nothing. He asked for the vintage.'),
  ('head', 'Bear-Fur Ushanka', 'u', 'a large brown fur ushanka hat with ear flaps', 'The bear had it coming.'),
  ('body', 'Peasant Tunic With Bullet Holes', 'e', 'a rough linen tunic with several round holes and a rope belt', 'He considers them ventilation.'),
  ('feet', 'Felt Valenki', 'c', 'a pair of grey felt valenki boots', 'Warm through a Russian winter and one frozen river.'),
  ('charm', 'Icon That Follows You Around the Room', 'x', 'a small gold-framed religious icon painting whose eyes glow pale blue', 'It is not a trick of the light. He checked.')]),
 'madjack': ('D-Day', 'attack', ('raid', .12), ('raid', .10), ('speed', .06), [
  ('weapon', 'Umbrella (Taken Into Battle)', 'e', 'a black rolled umbrella with a curved wooden handle', 'A real officer did this. The enemy assumed it was a new weapon.'),
  ('head', 'Tin Hat With a Dent', 'u', 'a British Brodie steel helmet with a big dent', 'The dent has a name and a regimental history.'),
  ('body', 'Denison Smock', 'r', 'a camouflage paratrooper Denison smock', 'Smells of cordite and marmalade.'),
  ('feet', 'Ammunition Boots', 'c', 'a pair of black hobnailed British army ammunition boots', 'Polished the night before the invasion. Obviously.'),
  ('charm', 'Strongly Worded Letter to the Enemy', 'x', 'a typed letter with a regimental crest and a furious red stamp', 'Dear Sir. I must protest in the strongest possible terms.')]),
}


def expand(budget):
    """-> list of item dicts for build.py, and the set table."""
    SPREAD = {'weapon': (('attack', .75), ('speed', .25)), 'head': (('defense', .6), ('luck', .4)), 'body': (('defense', .5), ('health', .5)),
              'feet': (('speed', .7), ('luck', .3)), 'charm': (('luck', .6), ('health', .4))}
    items, sets = [], {}
    for hid, (sname, stat2, eff3, weff, ceff, pieces) in ERA.items():
        sid = 'set_' + hid
        sets[sid] = dict(id=sid, name=sname, hero=hid, two={stat2: 6}, three=dict(kind=eff3[0], amount=eff3[1]), pieces=[])
        for slot, name, rl, desc, flavor in pieces:
            rar = R[rl]; b = budget[rar] * (1.1 if slot == 'weapon' else 0.8)
            st = {k: max(1, round(b * f)) for k, f in SPREAD[slot]}
            it = dict(id=f'e_{hid}_{slot}', name=name, kind='gear', slot=slot, rarity=rar, icon=f'e_{hid}_{slot}', flavor=flavor, stats=st, era=hid, desc=desc)
            if slot in ('head', 'body', 'feet'): it['set'] = sid; sets[sid]['pieces'].append(it['id'])
            if slot == 'weapon': it['special'] = dict(kind=weff[0], amount=weff[1])
            if slot == 'charm': it['special'] = dict(kind=ceff[0], amount=ceff[1])
            items.append(it)
    return items, sets
