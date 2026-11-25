# Server-rolled loot and summons

Applied to Supabase as migrations `os2_server_rolls` and `os2_summon_core_fix` (24 Nov). The SQL lives in the project's migration history.

- `os2_loot(place, item, weight)` and `os2_cfg(key, value)` are filled from `data/rules.json` (fable branch). Reload both, and `os2_item`, whenever rules change.
- `os2_save_core(u, data, rev)` is the save check; `os2_save_put` is the signed-in wrapper.
- `os2_roll(rolls, cost)` draws loot on the server: `rolls` is `[{place, n, luck, gear}]`, `cost` may be `{item:'x_crate'}`. Allowance: one find a second, 200 in a burst, 12 hours banked.
- `os2_summon(n)` takes the ink, draws the card by rarity weight, updates roster, shards and Summoning xp.
- The `_core` versions take a user id and cannot be called by players; they exist so the logic can be tested inside a rolled-back block.

Tested 24 Nov in a rolled-back block: first save accepted, gold cheat refused, stale page refused, unknown item refused, crate + rolls added to the bag,
50,000 rolls refused, summon drew a card and took the ink, a save straight after server changes accepted.

Still to do once the live game uses these: refuse any save that adds items or cards the server did not hand out (today the old limits still apply, because the live game still rolls in the browser).

## Strict ledger (migrations `os2_strict_ledger`, `os2_roll_hauls_fix`, 25 Nov)
- A save marked `v >= 3` (the current game) may not add gear, junk, treasure or cards. Those only come from `os2_roll`, `os2_summon`, `os2_call`, trades, mail and guild rewards.
- Small allowances remain for things still made in the game: timer/contract crates, bench and contract shards, brewed tonics, restored relics, and gold from crates and raids (0.2 a second, 3,000 in a burst).
- `os2_roll` entries may carry `hauls` and `dbl`: the server decides which hauls find something. Raid prizes (`gear: true`) are capped at 3 banked, one more every two hours.
- `os2_sell(items)` sells spares at the server's price. `os2_call(hero)` spends shards to call a missing hero.
- To hold every client to the strict rules (after the old game is gone from everyone's cache): `insert into os2_cfg values ('strict', 'true') on conflict (key) do update set value = 'true'`.

Tested 25 Nov in a rolled-back block: adding gear by save refused, adding a card by save refused, small allowances accepted, 200 hauls gave 105 finds,
5 raid prizes refused, 4 rolls incl. one raid prize accepted, selling 4 spares paid 78, selling something not owned refused, call without shards refused,
call with shards worked, a normal save afterwards accepted, a 50,000 gold jump refused.
