#!/bin/sh
# Smoke test for the tracker plugin — exercises the CLI surface and the live
# server against a throwaway workspace. Zero dependencies beyond node + sh.
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# The script always sits NEXT to tracker.js — both in this repo
# (plugins/tracker/) and when installed (e.g. .agents/tracker/).
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
PORT="${TEST_PORT:-4899}"
trap 'kill $SERVER_PID 2>/dev/null; rm -rf "$TMP"' EXIT

mkdir -p "$TMP/.agents/tracker"
cp "$PLUGIN_DIR/tracker.js" "$TMP/.agents/tracker/"
cp "$PLUGIN_DIR/board.html" "$TMP/.agents/tracker/"
cd "$TMP"

fail() { echo "FAIL: $1"; exit 1; }

echo "== seed =="
node .agents/tracker/tracker.js seed | grep -q "Seeded board" || fail "seed"
[ -f .agents/tracker/board.json ] || fail "board.json missing after seed"

echo "== create =="
node .agents/tracker/tracker.js create --title "Write the spec" --description "Acceptance: reviewed" --as "codex" | grep -q "Created TSK-1" || fail "create key sequencing"
node .agents/tracker/tracker.js create --title "Ship it" --as codex | grep -q "Created TSK-2" || fail "create second"

echo "== list =="
node .agents/tracker/tracker.js list | grep -q "TSK-1" || fail "list shows TSK-1"
node .agents/tracker/tracker.js list --status "not started" | grep -q "TSK-1" || fail "status filter is case-insensitive"
node .agents/tracker/tracker.js list --json | grep -q '"key": "TSK-2"' || fail "--json output"

echo "== update / move / comment =="
node .agents/tracker/tracker.js update TSK-1 --status "In Progress" --note "draft done" --as codex | grep -q "In Progress" || fail "update"
node .agents/tracker/tracker.js move TSK-2 --status done | grep -q "\[Done\]" || fail "move"
node .agents/tracker/tracker.js comment TSK-1 --body "please review section 2" --author marc | grep -q "TSK-1" || fail "comment"
node .agents/tracker/tracker.js show TSK-1 | grep -q "please review section 2" || fail "show renders comment"

echo "== agent + user attribution =="
grep -q '"author": "marc"' .agents/tracker/board.json || fail "comment attribution"
grep -q '"created_by": "codex"' .agents/tracker/board.json || fail "create attribution"

echo "== archive / restore / delete =="
node .agents/tracker/tracker.js archive TSK-2 | grep -q "Archived" || fail "archive"
node .agents/tracker/tracker.js list --open | grep -q "TSK-1" || fail "open filter"
node .agents/tracker/tracker.js restore TSK-2 | grep -q "Restored" || fail "restore"
node .agents/tracker/tracker.js delete TSK-2 | grep -q "Deleted" || fail "delete"
node .agents/tracker/tracker.js show TSK-2 2>/dev/null && fail "deleted ticket still resolvable" || true

echo "== concurrent-ish writes stay valid JSON =="
node .agents/tracker/tracker.js create --title a --as x >/dev/null &
node .agents/tracker/tracker.js create --title b --as y >/dev/null &
wait
node -e 'const b=require("./.agents/tracker/board.json"); if(b.cards.length!==3) process.exit(1)' || fail "parallel creates lost (expected 3 = TSK-1 + two parallel)"

echo "== key_prefix + session binding =="
mkdir -p ws2/.agents/tracker
cp .agents/tracker/tracker.js ws2/.agents/tracker/
cd ws2
node .agents/tracker/tracker.js seed --key-prefix dev | grep -q "Seeded board" || fail "seed with prefix"
node .agents/tracker/tracker.js create --title "Session-bound work" --as agent --session ses_abc | grep -q "DEV-1" || fail "DEV- prefix sequencing"
node .agents/tracker/tracker.js list --json --mine --session ses_abc | grep -q '"key": "DEV-1"' || fail "--mine session filter"
node .agents/tracker/tracker.js list --json --session ses_other | grep -q "DEV-1" && fail "session filter leaked" || true
node .agents/tracker/tracker.js update DEV-1 --session ses_new --json | grep -q '"session_id": "ses_new"' || fail "session restamp"
cd ..
node -e 'const b=require("./.agents/tracker/board.json"); if(b.cards[0].key !== "TSK-1") process.exit(1)' || fail "default prefix drifted"

echo "== ensure (session floor) =="
mkdir -p ws3/.agents/tracker
cp .agents/tracker/tracker.js ws3/.agents/tracker/
cd ws3
node .agents/tracker/tracker.js seed >/dev/null
node .agents/tracker/tracker.js ensure --session ses_run1 --title "First task" --json | grep -q '"created": true' || fail "ensure creates when missing"
node .agents/tracker/tracker.js ensure --session ses_run1 --title "Different title" --json | grep -q '"created": false' || fail "ensure not idempotent"
KEY1=$(node .agents/tracker/tracker.js ensure --session ses_run1 --json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).card.key))')
[ "$KEY1" = "TSK-1" ] || fail "ensure returned $KEY1, expected TSK-1 (no duplicate)"
node .agents/tracker/tracker.js move TSK-1 --status done >/dev/null
node .agents/tracker/tracker.js ensure --session ses_run1 --json | grep -q '"created": true' || fail "ensure after Done should floor a new ticket"
cd ..

echo "== live server =="
TRACKER_PORT=$PORT node .agents/tracker/tracker.js serve &
SERVER_PID=$!
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf "http://127.0.0.1:$PORT/api/board" >/dev/null 2>&1 && break
  sleep 0.4
done
curl -sf "http://127.0.0.1:$PORT/api/board" | grep -q '"workspace"' || fail "GET /api/board"
curl -sf "http://127.0.0.1:$PORT/" | grep -q "Tracker" || fail "board.html served"
curl -sf -X POST "http://127.0.0.1:$PORT/api/action" \
  -H 'content-type: application/json' \
  -d '{"action":"create","title":"From the browser","as":"user"}' | grep -q '"ok":true' || fail "POST /api/action"
curl -sf "http://127.0.0.1:$PORT/api/board" | grep -q "From the browser" || fail "server write landed on the board"
curl -s -X POST "http://127.0.0.1:$PORT/api/action" -H 'content-type: application/json' \
  -d '{"action":"bogus"}' | grep -q '"ok":false' || fail "bad action 400"

echo
echo "ALL SMOKE TESTS PASSED"
