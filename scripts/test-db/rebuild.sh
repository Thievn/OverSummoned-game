#!/bin/bash
# Builds a throwaway local copy of the game database for test/server.test.mjs.
# Usage: scripts/test-db/rebuild.sh [dir]   then   PGURL="host=<dir>/sock port=5499 user=postgres dbname=t" node --test test/
set -e
HERE=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$HERE/../.." && pwd)
DIR=${1:-/workspace/os-testdb}
BIN=$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)
if [ -f "$DIR/data/postmaster.pid" ]; then "$BIN/pg_ctl" -D "$DIR/data" stop -m fast >/dev/null || true; fi
rm -rf "$DIR"; mkdir -p "$DIR/sock"
"$BIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"$BIN/pg_ctl" -D "$DIR/data" -o "-k $DIR/sock -p 5499 -c listen_addresses=''" -l "$DIR/log" start >/dev/null
sleep 1
P="psql -X -q -h $DIR/sock -p 5499 -U postgres -v ON_ERROR_STOP=1"
$P -d postgres -c "create database t" >/dev/null
for r in anon authenticated service_role; do $P -d t -c "do \$\$ begin create role $r; exception when duplicate_object then null; end \$\$" >/dev/null; done
$P -d t -f "$HERE/stub.sql" >/dev/null
# The den owner (owned cards are seeded for this address).
$P -d t -c "insert into auth.users(id, email) values ('00000000-0000-4000-8000-00000000d0e0', 'thievnsden@gmail.com'); insert into den_allow(email, is_admin) values ('thievnsden@gmail.com', true)" >/dev/null
for f in 20261123120100_os_rpcs 20261123120200_os_admin 20261123130000_os_username_taken 20261124100000_os_gear_fight 20261124101000_os_act_hero 20261124120000_os_anticheat_patch $(ls "$REPO/supabase/migrations" | sed 's/\.sql$//' | awk '$0 > "20261125"'); do
  $P -d t -f "$REPO/supabase/migrations/$f.sql" >/dev/null 2>"$DIR/err" || { echo "failed on $f"; cat "$DIR/err"; exit 1; }
done
$P -d t -c "insert into auth.users values ('11111111-1111-1111-1111-111111111111','dean@example.com') on conflict do nothing; insert into den_allow values ('dean@example.com', true) on conflict do nothing" >/dev/null
# Same row security as live on the catalog tables.
$P -d t -c "alter table os_hero_def enable row level security; alter table os_item_def enable row level security; alter table os_set enable row level security; grant usage on schema public to authenticated; grant select on os_hero_def, os_item_def, os_set to authenticated" >/dev/null
echo "ready: PGURL=\"host=$DIR/sock port=5499 user=postgres dbname=t\""
