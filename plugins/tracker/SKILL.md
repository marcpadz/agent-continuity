---
name: tracker
description: |
  A shared project-management board for the workspace: every task lives as a
  ticket that all agents and the user can see and edit in real time. Agents
  manage tickets through the `tracker.js` CLI (or any file-tool equivalent);
  users watch and edit the same board in the browser via `./board`. Load this
  plugin's instructions whenever work is planned, started, or finished in a
  scaffolded workspace.
---

# Tracker plugin — the shared project board

The board is a single JSON file at `.agents/tracker/board.json`, managed
exclusively through the tracker script so concurrent agents never corrupt it.
The user sees the same board live in the browser (root `./board` launcher).

## The contract (run before, during, and after every task)

1. **START of a task** — check for a matching ticket:
   ```sh
   node .agents/tracker/tracker.js list --open
   ```
   Create one when none exists (this is the exact command — there is no
   `tracker create` tool or shell alias):
   ```sh
   node .agents/tracker/tracker.js create --title "Short imperative title" --description "Context + acceptance criteria" --as "<your-agent-name>"
   ```
2. **At every meaningful step** — keep the ticket truthful:
   ```sh
   node .agents/tracker/tracker.js update TSK-<n> --status "In Progress" --note "what just happened" --as "<your-agent-name>"
   ```
   `--status` accepts any column title (default columns: Idea, Not Started,
   In Progress, For Review, Done) resolved case-insensitively.
3. **When the task completes** — move it to `For Review`; the USER closes it:
   ```sh
   node .agents/tracker/tracker.js move TSK-<n> --status "For Review"
   ```
4. **Never** leave a task without a ticket, and never finish work without
   updating its ticket. The user watches this board — stale tickets look like
   stalled work.

## Rules

- Always pass `--as <name>` (your agent name) on writes so the board's
  activity log attributes them.
- `--note` APPENDS a timestamped progress note; it never replaces the
  description. Use `--description` for the durable spec.
- Prefer `list --json` when you need machine-readable output to reason over.
- One ticket per distinct task — split multi-part work into multiple tickets.
- Never hand-edit `board.json`: all writes go through the script (atomic +
  locked). If the file is somehow malformed, stop and tell the user instead of
  "fixing" it silently.

## Full command surface

```
seed [--force]                       create the board (scaffold does this once)
list [--status S] [--assignee A] [--open] [--json]
show <TSK-n|id> [--json]
create --title "T" [--description D] [--status S] [--assignee A]
update <key> [--title T] [--description D] [--status S] [--assignee A] [--note "..."]
move <key> --status S
comment <key> --body "..." [--author A]
archive | restore | delete <key>
serve [--port 4870] [--open]         live board server (root `./board` wraps this)
```

Global flags: `--as <name>` (actor identity), `--json`, `TRACKER_BOARD=<path>`
(override board location — useful in tests).

## For users

```sh
./board              # starts the live board and opens it in the browser
./board --port 5000  # custom port
```

The board auto-refreshes: tickets an agent creates or moves via the CLI appear
in the open browser within a second (file-watch + server-sent events, with a
5-second poll fallback). Drag cards between columns, click a card to edit,
comment, reassign, or delete. Every user edit is immediately visible to agents
that `list` the board.
