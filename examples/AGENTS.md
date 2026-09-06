# <PROJECT_NAME>

> **AGENT DIRECTIVE — Read this first, every session.**
> This document governs how you work in this workspace. Do not skip it.
> Last updated: <TODAY>

---

## Thinking Chain (run before every task)

1. **Read this file (`AGENTS.md`)** — the canonical glossary, current state, and active
   priorities. This is the single most commonly skipped step and the biggest cause of
   drift. Read it now.
2. **Load the matching playbook** in `.agents/playbooks/` *before* doing the
   work that playbook governs.
3. **Check the tracker** — run `node .agents/tracker/tracker.js list --open` before
   starting: create a ticket if none matches your task, keep its status and notes
   updated at every meaningful step, and move it to `For Review` when done. The user
   watches this board live; a stale ticket looks like stalled work.
4. **Consult the store before acting** — search `.agents/learnings/` (and the
   symptom table in `learnings/_index.md`) before tackling a problem; read relevant
   decisions in `.agents/decisions/` before a cross-cutting choice.
5. **Write back when done** — record what you learned (a new decision, a lesson learned)
   so the next agent inherits it.

Background agents given a task without this context must ask the parent agent for it.

---

## Domain Glossary

| Term | Definition |
|---|---|
| | |

---

## Current State

- **Phase:**
- **Blocked by:**
- **Next milestone:**
- **Active priorities:** (2–3 things that matter right now)

---

## Invariants

- [ ] Every task has a tracker ticket, kept current while it is worked.

---

## Quality Checkpoint Routing

| Work type | Checkpoint | Owner |
|---|---|---|
| | | |

---

## Project Tracker

Every task lives on the shared board at `.agents/tracker/board.json`, managed only
through the tracker script (never hand-edit the JSON). The user sees the same board
live in the browser via the root `./board` launcher.

- **Start of a task:** `node .agents/tracker/tracker.js list --open` — create a
  ticket with `node .agents/tracker/tracker.js create --title "…" --as "<your-name>"`
  when none matches. These are the exact commands; there is no other tool name.
- **While working:** keep it truthful —
  `node .agents/tracker/tracker.js update TSK-<n> --status "In Progress" --note "…"`
- **Done:** `node .agents/tracker/tracker.js move TSK-<n> --status "For Review"` —
  the user closes the ticket.
- One ticket per distinct task; always pass `--as <your-name>` on writes.

---

## Knowledge System

All stores live inside the single hidden folder `.agents/`.

| Store | Path | Purpose | Consult before | Write after |
|---|---|---|---|---|
| `decisions/` | `.agents/decisions/` | Hard-to-reverse choices | Cross-cutting decisions | Making a hard choice |
| `learnings/` | `.agents/learnings/` | Solved problems & lessons | Debugging | Fixing a defect |
| `playbooks/` | `.agents/playbooks/` | Reusable procedures | Recurring work | Establishing a process |
| `templates/` | `.agents/templates/` | Reusable starting points | Creating new output | Creating a reusable format |
| `tracker/` | `.agents/tracker/` | Shared project board (live for users via `./board`) | Starting any task | Every status change |

**Agent-local caveat:** Your session scratch (`.agents/.local/`) is private. Do
not commit it. It may contain drafts, tokens, keys, or half-formed ideas. Copy from
`templates/` into your private space; never move private material into shared stores.

---

## Folder Visibility Note

All agent-continuity scaffolding lives inside a **single hidden folder**:
`.agents/`. It is hidden on macOS by default (dot-prefix + `chflags hidden`),
so the user's project root stays clean — only the user-created project files and folders
are visible (plus the `board` launcher).

- To reveal the whole continuity tree in Finder: `chflags nohidden .agents`
- The folder still exists and is fully accessible even while hidden.

---

## Change Log

| Date | What changed | Agent |
|---|---|---|
| <TODAY> | Initial scaffold | Founding agent |
