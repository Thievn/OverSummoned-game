# OverSummoned

Idle craft, delves, and collector cards in Aldermere. The site is static files at the repository root. There is no build step.

## Ship it on the existing project

Connect this repo to the Vercel project **thievns-den** (team **thievns-projects**). Do not create a second project. Output directory is the repository root. Framework preset is Other. `oversummoned.com` stays on that project.

`vercel.json` keeps the `/gm` rewrite. The game is `/` and `/play`. The owner books are `/ledger` and are not linked in the city.

## Database

Apply `supabase/migrations` in the order in [SUPABASE.md](SUPABASE.md). The live waitlist, allow list, and Google sign-in stay as they are.

## Look around before the books are applied

`/play?preview=1` opens a full city with the sample squad. It does not write to the database. Add `&shot=1` to hold the bars still.
