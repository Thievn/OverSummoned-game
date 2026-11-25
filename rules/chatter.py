"""What the heroes say while they stand crew. Per hero: 'say' (things they come out with) and
'reply' (what they say back when somebody else has just spoken). Short, in their own voice.
python3 rules/chatter.py -> data/chatter.json. New heroes need an entry here."""
import json, os
C = {
 'kevin': (["Let's circle back on that fish.", "I'll put a pin in it.", "Per my last email, it is still Monday.", "Is this billable?", "I have a hard stop at five."], ["Let's take that offline.", "Great point. No notes."]),
 'marco': (["Estimated arrival: eventually.", "Five stars if he hurries up.", "No tip, I see.", "I did this route in a tornado once.", "Leave it at the door? Which century?"], ["Sign here.", "Not my postcode, mate."]),
 'maya': (["Everyone hydrated?", "Nobody lift with their back.", "I've seen worse. Much worse.", "That is a splinter waiting to happen.", "Good job, Smudge. Good boy. Sorry. Habit."], ["Deep breath. In, and out.", "That's not a medical opinion, but yes."]),
 'brokk': (["Wheel is a fad.", "Brokk hunt bigger with stick.", "Warm here. Suspicious.", "Where mammoth?", "Small water. Small fish. Small day."], ["Brokk not understand. Brokk agree.", "Hmm. Stick better."]),
 'gaius': (["The roads here are a disgrace.", "Twenty years. One bad knee.", "Hold the line. Any line.", "In the Ninth we'd have finished by now.", "Who is in command of this dock?"], ["Noted, citizen.", "That would not pass inspection."]),
 'edith': (["That wants a rivet.", "I could bridge this before lunch.", "Who built this? A gentleman, I suppose.", "Load-bearing? Barely.", "Give me a spanner and ten minutes."], ["Structurally unsound, but go on.", "I shall draw you a diagram."]),
 'albrecht': (["Have we tried leeches?", "The air here is bad. I can tell.", "Keep your distance. Further.", "He looks pale. Leeches.", "I have a pomander for that."], ["Leeches would fix that.", "Stand back when you say it."]),
 'vincenzo': (["Nice dock. Shame if something happened to it.", "I am a simple olive oil merchant.", "We never had this conversation.", "A friend of mine would like a word.", "Very polite, this otter. I respect that."], ["I didn't hear that.", "Careful. Walls have ears."]),
 'slapton': (["Is this my good side?", "I do my own stunts.", "Somebody get my trailer.", "And the award goes to: me.", "Cut! No. Keep rolling."], ["Was that about me?", "I'd like to thank myself."]),
 'napoleon': (["I could take this dock by Tuesday.", "Who moved my stepladder?", "An army marches on its snacks.", "From up here I can see nothing.", "History will remember this haul."], ["I am not short.", "Invade it."]),
 'cleocatra': (["Fetch me that. No. The other one.", "I do not walk. I am carried.", "Is that vase important?", "Bathe it in milk.", "I shall allow the otter to continue."], ["You may speak.", "Bored now."]),
 'blackbear': (["Arr. That's all. Just arr.", "My beard is on fire again.", "Where's me rum gone?", "X marks most things.", "I've buried better than that."], ["Arr.", "Dead men tell worse tales."]),
 'astrid': (["Six kingdoms. Bored by five.", "Is anyone going to fight?", "Good axe weather.", "I will raid something small while I wait.", "The otter has spirit."], ["Then we fight.", "Weak. Say it louder."]),
 'kenji': (["Honour. Discipline. Rice ball.", "Who has the rice ball?", "A still mind catches the fish.", "I walked four hundred sandals for this.", "Good boy? That is the sword's name."], ["...", "I will meditate on that."]),
 'emu': (["We never lost.", "Report: no humans advancing.", "They had machine guns. We had legs.", "At ease. Not you.", "Victory tastes of gravel."], ["Negative.", "That is how wars are won."]),
 'troffea': (["I can't stop. I've tried.", "Does anyone else hear music?", "Four days now. Send help.", "One-two-three, one-two-three.", "My feet have opinions."], ["Dance with me!", "Can't talk. Dancing."]),
 'joost': (["This bulb is worth a house.", "Buy now. Prices only go up.", "I had a boat once. And cows.", "The market is merely resting.", "Is that a tulip? No. Onion."], ["Buy the dip.", "I'll take forty."]),
 'chad': (["To the moon.", "This is the dip. Buy the dip.", "Wen fish?", "Not financial advice.", "Have fun staying poor, Smudge."], ["Bullish.", "Zoom out, bro."]),
 'bella': (["Hashtag blessed. Hashtag dock.", "Hold on, the light's perfect.", "Link in bio.", "My leg's asleep. It's fine. It's the brand.", "Smudge, look candid."], ["Obsessed.", "That's so real."]),
 'florida': (["Hold my slushie.", "That gator started it.", "I know a shortcut. It's illegal.", "Y'all hear sirens?", "Watch this."], ["Bet.", "Not the weirdest thing today."]),
 'lola': (["Darling, you're doing wonderfully.", "Has anyone seen my watch? Any watch.", "Encore!", "I've danced for dukes. This is better.", "Do keep your wallets where I can see them."], ["Oh, you flatterer.", "Buy me a drink and say that."]),
 'morwenna': (["The moon is wrong tonight.", "Oh! A light. No. Stay. Focus.", "I curse this fish. Kindly.", "Dark, brooding, slightly lost.", "The lantern is not warm. Stop asking."], ["Doom. Probably.", "The bones agree."]),
 'sable': (["I was never here.", "Whose is this? Mine now.", "I'm just rinsing it.", "The Doge sends his regards. He doesn't know.", "Nice pockets, everyone."], ["Shh.", "Didn't see a thing."]),
 'jacko': (["Swim between the flags!", "Sunscreen. All of you.", "No worries.", "That's a rip. Don't go in the rip.", "Legend, Smudge. Absolute legend."], ["Too easy.", "Yeah, nah."]),
 'raspawtin': (["I have been dead before. Overrated.", "Is there more cake?", "Look into my eyes. Good. Now fish.", "The river could not keep me.", "Poison? I assumed it was seasoning."], ["I foresaw that.", "It will not kill you. Trust me."]),
 'madjack': (["Any officer without a sword is improperly dressed.", "Shall I play something?", "Smashing weather for an invasion.", "I brought the bow. And the pipes.", "Jolly good show, otter."], ["Rather!", "Steady on, old chap."]),
}
if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json.dump({k: {'say': v[0], 'reply': v[1]} for k, v in C.items()}, open(os.path.join(root, 'data', 'chatter.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(C), 'heroes', sum(len(v[0]) + len(v[1]) for v in C.values()), 'lines')
