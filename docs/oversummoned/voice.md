# OverSummoned voice and copy rules

These rules apply to every line of text on the site and in the game, including the landing page, buttons, tooltips, flavor lines, emails, and anything Grok writes. They come from the OverSummoned prompt kit (Google Doc "Grok Prompt Kit", v0.1, Nov 21 2026). The prompt kit was written for the in-game narrator, so this file keeps the parts that apply to copy and adds a few site rules at the top.

## Site rules (always)

1. Spell the name exactly **OverSummoned**, with a capital O and a capital S, in all rendered text, titles, alt text and meta tags. Lowercase is fine only in filenames and URLs.
2. Never name the games, sites or companies that inspired OverSummoned. That covers page copy, alt text, meta tags, code comments, commit messages and anything Grok writes. Every borrowed mechanic uses its OverSummoned name (Hustles, the Pit, the Crier, the Stocks, the Infirmary, the Exchange, Crews, and so on).
3. No em dashes or en dashes anywhere. Use commas, periods or parentheses instead.
4. Use only the real numbers from game data. Don't make up player counts, ratings, reviews or press quotes.
5. Adults only (18+). Swearing and innuendo come from characters. Sex happens off the page. No minors in any sexual or romantic context, ever.
6. No real people, real brands, real franchises, song lyrics or famous catchphrases. Invent names instead.
7. The waitlist promise is one email when the doors open. Don't promise anything else.

## Voice

- Dry, specific, adult, deadpan. The copy never says that something is funny or sad.
- **The joke is about the system. The pain is about the person.** When someone gets hurt, let it land.
- Concrete over abstract: names, objects, numbers, smells, prices. One sharp detail beats three soft ones. ("Eleven fingers of the same saint" beats "many fake relics".)
- Mix sentence lengths: a long sentence, then a short one. Fragments are fine. Use plain words.
- Subtext. Characters show what they feel through what they do, not by saying it.
- End on an action, an object or a line of dialogue. Never end on a summary, a lesson, a question to the reader, or what it all meant.
- Let the reader work it out. Don't explain the joke and don't name the emotion.
- In-game narration is second person, past tense ("You lifted the purse."). Dialogue inside quotes is present tense.
- Interface copy is short and plain. Write a button as a verb and an object ("Join the waitlist"), never as a pun.

## Hard bans

Rewrite any copy that contains one of these. Grok output that contains one gets regenerated.

**Punctuation and structure**
- Em dashes (U+2014) and en dashes (U+2013).
- "It's not X, it's Y", "It wasn't X, it was Y", "not just X, but Y", and "not X, but Y" used as a reveal.
- The "X. Not Y. Z." reveal ("He wasn't angry. Not exactly. Disappointed.").
- Ending on a moral, lesson, summary or question to the reader.
- Opening with "As the..." or "In the heart of...".
- Lists of three adjectives, or three clauses in a row.

**Words** (in their usual AI sense): tapestry, testament, symphony, cacophony, kaleidoscope, delve, realm, myriad, plethora, palpable, vibrant, bustling, intricate, ethereal, otherworldly, enigmatic, labyrinthine, gossamer, liminal, tendrils, ministrations, camaraderie, unwavering, resolute, indomitable, meticulous, multifaceted, pivotal, beacon, crucible, embark, unravel (feelings), visceral, ozone, petrichor, nestled, juxtaposition, interplay, underscore, showcase, foster, bolster, leverage, elevate, resonate, navigate (feelings), landscape (abstract), journey (abstract).

**Phrases:**
- a testament to; a symphony / tapestry / dance / kaleidoscope of
- little did (anyone) know
- the air was thick with; hung heavy in the air
- couldn't help but
- barely above a whisper
- a breath (you) didn't know (you) were holding
- a shiver down (your) spine; heart pounded / hammered
- eyes widened; breath hitched; jaw clenched (used as a shortcut for a feeling)
- a smile tugging at the corner of; a mischievous glint; a knowing smile; a wry smile; steely gaze; piercing eyes
- for what felt like an eternity; time seemed to slow; in that moment
- the weight of (the world / it all); something shifted; a sense of; an unspoken understanding
- maybe, just maybe; somewhere, a dog barked
- the city never sleeps; neon-soaked; rain-slicked streets
- with newfound (resolve); a mix of (fear and excitement)
- only time will tell; the night was young; and so it began
- it was as if; as if the world itself
- a reminder that; it's important to note; ultimately; moreover; furthermore; additionally

**Stock character names** (common AI defaults, never use): Elara, Lyra, Kael, Kaelen, Seraphina, Thorne, Zephyr, Aria, Silas, Elias, Kira, Voss, Jax, Nyx, Orion, Aurora, Lena, Aris.

## Watch list

These are soft. Two or more in one piece means it needs a rewrite: quietly, steady, softly, gently, suddenly, somehow, merely, simply, truly, utterly, perhaps, the faint smell of, a hint of, a flicker of, a wave of, a pang of, grizzled, weathered, smirk, chuckled darkly, murmured, mused, mischief, gaze, orbs, impossibly, deafening silence, echoed, lingered.

Also soft: every sentence the same length, more than one semicolon, or three clauses in a row ("You ran, you hid, you waited.").

## Lengths

- Item flavor line: 12 to 30 words, in gold italics in the tooltip.
- Card bio line: 1 to 2 sentences.
- Feature blurb on the landing page: 1 sentence, 15 words or fewer.
- Give Grok its length as a sentence count, not a word count. It hits sentence counts more reliably.

## Samples in the target voice (from the game plan)

> "Era?" You told him. He found the column, ran a finger down it, and sighed at a number that was clearly bigger than last week's. "Cause of arrival?" "I was at the dentist." He wrote that down very carefully, then slid a form across. "Sign here. You owe the Office four Crowns for the summoning."

> He had fourteen coins and a sandwich. You took the coins. He noticed, and you spent the next hour in the Stocks thinking about the sandwich.

> Kevin had 412 unread emails when the floor opened under him. He still wonders what was in the last one.

> Five thousand men marched into the fog and never wrote home. One of them, it turns out, dropped this. *(Shield of the Lost Ninth)*

> There has never been a violin in it. The case has three bullet holes and a receipt for a violin. *(The Violin Case)*

Landing page lines approved in the plan:
- "OverSummoned is a browser game set in Aldermere, a city that keeps summoning people from Earth by accident. Pick who you were, hire a squad from every century, and survive the dungeon under the city."
- "Every Friday the Circle brings in a new batch. Some of them are worth hiring."
- "A Roman can carry a defibrillator. Nobody here will stop him."
- "Pick a door. Read what the ghoul is about to do. Hit it first."
- "Pick your era. Hire your squad. Come back richer, or come back with a Scar."
- "We send one email when the doors open."
- Tagline: "Pulled from Earth. Stuck in Ash."

## Copy check (drop-in filter)

Run all site copy through this before shipping. A test can import `checkSlop` and assert `verdict === "ok"` for every string in the page data.

```js
// slopFilter.js
const HARD_PATTERNS = [
  /[\u2014\u2013]/g,
  /\b(it|this|that)('s| is| was|n't| wasn't)\s+(not|n't)?\s*(just|only)?\s*[^.,;]{1,40},\s*(it|this|that)('s| is| was)\b/gi,
  /\bnot (just|only|merely) [^.,;]{1,40},? but\b/gi,
  /\b(a )?(testament|tapestry|symphony|cacophony|kaleidoscope) (to|of)\b/gi,
  /\blittle did (he|she|they|you|i|we) know\b/gi,
  /\bthe air (was|hung|felt) (thick|heavy)\b/gi,
  /\bcouldn'?t help but\b/gi,
  /\bbarely (above )?a whisper\b/gi,
  /\bshivers? (ran |run )?down (his|her|their|your|my) spine\b/gi,
  /\bheart (pounded|hammered|raced)\b/gi,
  /\b(eyes widened|breath hitched)\b/gi,
  /\b(for what felt like an eternity|time seemed to slow|in that moment)\b/gi,
  /\b(something shifted|an unspoken (understanding|agreement)|maybe, just maybe)\b/gi,
  /\b(neon-soaked|rain-slicked|the city never sleeps)\b/gi,
  /\b(only time will tell|the night was young|and so it began)\b/gi,
  /\b(served as )?a reminder that\b/gi,
  /\b(it'?s important to note|moreover|furthermore)\b/gi,
  /\b(delve|delved|delving|realm|myriad|plethora|palpable|vibrant|bustling|intricate|ethereal|otherworldly|enigmatic|labyrinthine|gossamer|liminal|tendrils?|ministrations|camaraderie|unwavering|indomitable|meticulous(ly)?|multifaceted|pivotal|beacon|crucible|embark(ed)?|visceral|ozone|petrichor|nestled|juxtaposition|interplay|underscore[sd]?|showcas(e|ed|ing)|foster(ed|ing)?|bolster(ed)?|leverag(e|ed|ing)|resonat(e|ed|ing))\b/gi,
  /\b(Elara|Lyra|Kael(en)?|Seraphina|Thorne|Zephyr|Silas|Voss|Nyx)\b/g,
];
const SOFT_WORDS = /\b(quietly|steady|softly|gently|suddenly|somehow|merely|simply|truly|utterly|perhaps|a hint of|a flicker of|a wave of|a pang of|grizzled|weathered|smirk(ed)?|murmured|mused|gaze|impossibly|deafening silence|echoed|lingered)\b/gi;

export function checkSlop(text) {
  const hard = [];
  for (const re of HARD_PATTERNS) { const f = text.match(re); if (f) hard.push(...f); }
  const soft = text.match(SOFT_WORDS) || [];
  const verdict = hard.length ? "regenerate" : soft.length >= 2 ? "edit" : "ok";
  return { verdict, hard, soft };
}
```

Final test: read the copy out loud. If a line sounds like a movie-trailer voiceover, rewrite it.
