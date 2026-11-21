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
  for (const re of HARD_PATTERNS) {
    const found = text.match(re);
    if (found) hard.push(...found);
  }
  const soft = text.match(SOFT_WORDS) || [];
  const verdict = hard.length ? 'regenerate' : soft.length >= 2 ? 'edit' : 'ok';
  return { verdict, hard, soft };
}
