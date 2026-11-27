# Landing page rework (Fable, 27 Nov). Opus builds: steps L1 to L5.

## What is wrong with index.html today
- **It never says what the game is.** The headline is "He stamped the wrong name. Now history keeps showing up." and the label is "A desktop pet with a filing problem". A new visitor cannot tell this is a free game where you collect hero cards, and the game is web-first, not a desktop pet.
- **No picture of the actual game anywhere.** Five images on the whole page, none a screenshot.
- **It is far too long:** about 9,400px on desktop and 16,200px on a phone, ten sections.
- **The sign-up line contradicts itself:** "The beta is closed. Smudge will let you in anyway."
- **The wording is roundabout** almost everywhere (most of it written by Fable). The wording rule in PLAN.md now applies here too.
- Sections only appear when scrolled into view, so anything that does not run the scroll script (previews, some crawlers, full-page screenshots) sees a mostly blank page.
- Duels and raids, the most exciting parts, are barely mentioned.

## The new page, top to bottom (target: 4 screens on desktop, 7 on a phone)

**1. Hero.** Left: the words and the sign-up form. Right: the live Smudge scene that is there now (keep it, it is the best thing on the page).
- Label: FREE BROWSER GAME · CLOSED BETA
- Headline: **Collect heroes from all the wrong centuries.**
- Under it: Smudge the otter keeps summoning the wrong people from history. Collect them as cards, send them to work while you are away, and battle bosses with your best team. Free, on your phone or computer.
- NO HERO COUNT anywhere on the site (Dean, 25 Nov and again 27 Nov: the roster keeps growing, so a number goes stale and sounds like a limit). Say "heroes", "new heroes added regularly", never "50".
- Form, right here, not a section later: email box + button **Get my invite**
- Small line: Free. Your invite arrives by email in about a minute.
- Smudge's speech bubble keeps his jokes. That is where his voice belongs.

**2. See the game.** Three real screenshots in phone frames (hero cards, a raid, the home screen), captured from the live game at 390x844. One short caption each: "Collect hero cards", "Fight bosses in raids", "They keep working while you are away". Add the duel table as a fourth when Duels opens to everyone.

**3. How it works.** Three steps, one line each:
1. **Summon heroes.** Every summon is a new character card: a Roman soldier, a pirate, a corgi who conquered Europe.
2. **Put them to work.** Send heroes fishing, digging and safecracking. They earn loot even when the game is closed.
3. **Gear up and fight.** Equip what they find, train them, and take on bosses.

**4. Meet a few heroes.** Keep the five flip cards. Heading: "Meet a few of them. New heroes are added regularly." Button: See all heroes.

**5. What you can do.** Four tiles, plain: Jobs, Raids, Workshop and Training, Desktop pet (optional: a small Smudge on your taskbar who reacts when you type. He counts key presses and never sees what you type.)

**6. Questions.** Is it free? (Yes. No ads. Nothing you can buy makes you stronger.) What do I need? (A browser. Works on phone and computer.) Is the beta open? (It is invite-only, and everyone who signs up gets an invite right away.) Does the desktop pet read my typing? (No. It only counts key presses.) Is my progress saved? (Yes, to your account, across devices.)

**7. Last call.** The form again, same wording as the hero, and the footer.

**Cut from the page** (they stay on their own pages, linked from the nav): the long story text, Lost property, Where he works, the mood picker.

## Steps for Opus
- **L1.** Back up to the secondary repo. Rebuild index.html to the outline above using the existing styles and the wording given here word for word. Keep the nav, the Smudge scene, the form's existing sign-up call (js/wish.js) and the receipt.
- **L2.** Capture the screenshots from the real game on a seeded test account; save as webp under `assets/v2/site/`; lazy-load everything below the hero.
- **L3.** Content must be visible without the scroll script: sections start visible, the reveal animation is an extra, and it is off for reduced motion.
- **L4.** Page title: "OverSummoned: a free idle card game with heroes from all of history". Meta description in plain words. Share image that shows the game, not only the logo. Check the page at 360, 390 and 1366 wide and look at the screenshots before shipping.
- **L5.** Send a `sign_up` event to the analytics already on the page when the form succeeds, and one for each "Get my invite" click, so the next change can be judged by numbers.

## Decided (Dean, 27 Nov)
- Smudge is not named in the headline; he is introduced in the sentence under it, and shown in the scene beside it.
- No hero count.
