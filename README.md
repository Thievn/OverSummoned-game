# OverSummoned

Idle craft, delves, and collector cards in Aldermere. The site is static files at the repository root. There is no build step.

## Ship it on the existing project

Connect this repo to the Vercel project **thievns-den** (team **thievns-projects**). Do not create a second project. Output directory is the repository root. Framework preset is Other. `oversummoned.com` stays on that project.

`vercel.json` keeps the `/gm` rewrite. The game is `/` and `/play`. The owner books are `/ledger` and are not linked in the city.

## Database

Apply `supabase/migrations` in the order in [SUPABASE.md](SUPABASE.md). The live waitlist, allow list, and Google sign-in stay as they are.

## Look around before the books are applied

`/play?preview=1` opens a full city with the sample squad. It does not write to the database. Add `&shot=1` to hold the bars still.

## Adding a hero (or a place, or gear)

The site's hero and place pages, their schema and the sitemap are all generated
from `data/rules.json`. They are never edited by hand.

After any change to the rulebook:

```sh
python3 tools/build_pages.py
```

That rewrites `heroes/`, `places/`, both index pages and `sitemap.xml`, then
warns about any hero missing card art. Commit the result and deploy.

A new hero therefore needs exactly three things:

1. the entry in `data/rules.json` (with its three gear items in `items`),
2. the card art at `assets/v2/heroes/<id>.webp`,
3. a run of the script above.

Optional: add a `history` entry for the hero in `data/lore.json` to give their
page a section on the real history behind them.

After deploying, request indexing for the new URL in Google Search Console.
