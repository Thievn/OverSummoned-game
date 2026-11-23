# Update log: how to add an entry

Every deploy that players can notice gets one entry in `updates.json`. The game reads it to show the
"New update! Tap to see what's new" bar, and `/updates` lists every entry.

1. Add a new entry at the **top** of `entries` in `updates.json`:
   - `v`: `YYYY.MM.DD.N` (date of the deploy, N counts up within the day). Must be new.
   - `date`: `YYYY-MM-DD`.
   - `title`: a few words.
   - `items`: one to four short, friendly sentences about what changed in the game.
2. Run `node scripts/build-updates.mjs` to rebuild the list in `updates.html`.
3. Run `python3 scripts/apply_seo.py` (or `/workspace/os-seo-work/apply_seo.py`) from the repo root.
4. Run `node --test test/*.test.mjs`. `test/updates.test.mjs` checks the rules below.
5. Deploy, then run the SEO check: `python3 scripts/validate_seo.py https://oversummoned.com`.

## Writing rules

- Game things only, and keep them vague: "More loot added", "New gear sets to find". Never name an item or a card.
- Never mention people on the team, admin tools, owned or private cards, the server, the database,
  security, payments or money.
- Short, human sentences. No tech words, no deadpan one-liners.
- Always spell it **OverSummoned**.
- A deploy with no player-visible change (a fix behind the scenes) does not need an entry.
