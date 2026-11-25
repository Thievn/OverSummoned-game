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
