# <PROJECT_NAME>

> **AGENT DIRECTIVE — Read this first, every session.**
> This document governs how you work in this workspace. Do not skip it.
> Last updated: <TODAY>

---

## Thinking Chain (run before every task)

1. **Read this file (`AGENTS.md`)** — the canonical glossary, current state, and active
   priorities. This is the single most commonly skipped step and the biggest cause of
   drift. Read it now.
2. **Load the matching playbook** in `.agent-continuity/playbooks/` *before* doing the
   work that playbook governs.
3. **Consult the store before acting** — search `.agent-continuity/learnings/` (and the
   symptom table in `learnings/_index.md`) before tackling a problem; read relevant
   decisions in `.agent-continuity/decisions/` before a cross-cutting choice.
4. **Write back when done** — record what you learned (a new decision, a lesson learned)
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

- [ ]

---

## Quality Checkpoint Routing

| Work type | Checkpoint | Owner |
|---|---|---|
| | | |

---

## Knowledge System

All stores live inside the single hidden folder `.agent-continuity/`.

| Store | Path | Purpose | Consult before | Write after |
|---|---|---|---|---|
| `decisions/` | `.agent-continuity/decisions/` | Hard-to-reverse choices | Cross-cutting decisions | Making a hard choice |
| `learnings/` | `.agent-continuity/learnings/` | Solved problems & lessons | Debugging | Fixing a defect |
| `playbooks/` | `.agent-continuity/playbooks/` | Reusable procedures | Recurring work | Establishing a process |
| `templates/` | `.agent-continuity/templates/` | Reusable starting points | Creating new output | Creating a reusable format |

**Agent-local caveat:** Your session scratch (`.agent-continuity/.local/`) is private. Do
not commit it. It may contain drafts, tokens, keys, or half-formed ideas. Copy from
`templates/` into your private space; never move private material into shared stores.

---

## Folder Visibility Note

All agent-continuity scaffolding lives inside a **single hidden folder**:
`.agent-continuity/`. It is hidden on macOS by default (dot-prefix + `chflags hidden`),
so the user's project root stays clean — only the user-created project files and folders
are visible.

- To reveal the whole continuity tree in Finder: `chflags nohidden .agent-continuity`
- The folder still exists and is fully accessible even while hidden.

---

## Change Log

| Date | What changed | Agent |
|---|---|---|
| <TODAY> | Initial scaffold | Founding agent |
