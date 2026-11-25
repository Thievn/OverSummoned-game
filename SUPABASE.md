# Apply these to the live project

Project ref `eresamyqxarlrdgudgrw`. Run the files in this order. They are idempotent. They do not drop objects. They do not touch `shop_*`, `story_*`, or `creature_*`. They do not replace `den_block_signup`.

1. `supabase/migrations/20261123120000_os_extend.sql`
   Adds columns on `os_player`, `os_delve`, and `os_feed`. Adds `is_admin` on `den_allow` and sets it for `thievnsden@gmail.com` (inserted only if missing). Adds Will Slapton and the material items. Creates `os_config`, `os_event`, `os_listing`, `os_trade`, `os_crew`, `os_crew_member`, `os_chat`, `os_infirmary`, `os_hustle_log`. Seeds the Crier and the city stall. Publishes `os_feed` and `os_chat` for live updates.

2. `supabase/migrations/20261123120100_os_rpcs.sql`
   `CREATE OR REPLACE` for the live signatures:
   - `os_state()` returns jsonb (same keys as today, plus crier, welcome, market, config, crew, infirmary)
   - `os_set_party(p text[])` returns void
   - `os_set_rules(r jsonb)` returns void
   - `os_start_delve(f integer, m integer)` returns void
   - `os_claim()` returns jsonb with `gold`, `loot`, `hero`, `floor`, `minutes`
   - `os_sell(i text, q integer)` returns integer
   - `os_sellval(r text)` and `os_ok()` and `os_grant_hero(u uuid, h text)` stay compatible
   New: `os_act(op text, payload jsonb)` for skills, hustles, travel, bail, summon, packs, forge, crew, and the welcome collect.

3. `supabase/migrations/20261123120200_os_admin.sql`
   `os_is_admin()` is true when `den_allow.is_admin` is set for the signed-in email, or when `app_metadata.den_owner` is true. `os_admin(op text, payload jsonb)` serves the books and writes `den_admin_log`.

4. `supabase/migrations/20261123130000_os_username_taken.sql`
   `os_username_taken(p_name text)` returns boolean. It is granted to `anon` and `authenticated`. It checks `os_player.name` and a reserved list. The front page calls it while someone types a name. It does not create a row.

The waitlist page keeps calling the existing `waitlist` edge function, which inserts into `den_waitlist`. New accounts are still stopped by `den_block_signup`. The front page offers email and password, and Google. The Create Account button does not call `signUp`.

Hero finds are stored on the player and counted in `os_event` for the books. They are not inserted into `os_feed`. `os_feed_post` drops a line that names a hero. The first time a hero is met, `os_grant_hero` still opens that hero's things into the loot pool and does not print it.

The books are at `/ledger`. That address is not linked from the city or the front page.

If a replace fails because a live function has a different argument type, stop and paste the error. Do not drop the live function.

## What the client does before these run

The city still opens. Skills, hustles, and delves run on this device and stay in the browser until `os_state` succeeds. After the files are applied, the live row wins.

## Art notes

Sign lettering on the modern street and the Chicago awning was painted out of the backgrounds and the three card-back loops that used them. Maya's delve sprite is turned to face the fight. Edith's mining scene still plays her attack cycle. There is no pickaxe animation in the sheets, so that pose is the one the screens were drawn with.

## Closed beta (25 Nov)

`supabase/os2_beta.sql` (applied). The gate is unchanged: `den_allow` is still what `den_block_signup` and `os2_allowed()` read.

- `os2_beta_code`, `os2_beta_invite`, `os2_feedback`: RLS on, no policies, reached only through functions.
- `os2_admin_beta(op, payload)`: owner only. Lists the wishlist, invites, codes and feedback; makes and switches off codes; marks feedback.
- `os2_feedback_send(kind, body)`: any allowed player, ten a day.
- `os2_profile.founder`: set by a trigger when a profile is made while `os2_open` is not true; cannot be changed from the client.
- Edge function `beta`: `redeem` (anyone, rate limited) turns a code into a `den_allow` row; `invite` and `check` are owner only and decided by the caller's own sign-in.
- Edge function `waitlist`: unchanged behaviour, plus a confirmation to the person and a notice to `BETA_NOTIFY_TO` on a first signup.
- Mail goes through Resend and needs the `RESEND_API_KEY` Edge Function secret. `BETA_MAIL_FROM` and `BETA_NOTIFY_TO` are optional and default to hello@oversummoned.com. A missing key never breaks a signup; the Beta tab says so.
