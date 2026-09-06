---
name: agent-continuity
description: |
  Scaffolds and maintains a self-documenting workspace. Load once at the start of a project to create AGENTS.md (at the project root) and a knowledge store structure inside a single hidden folder `.agents/` (decisions/, learnings/, playbooks/, templates/, .local/). After scaffolding, future agents read AGENTS.md first and follow the embedded thinking chain. The user's project root stays clean — only the user-created project files and folders remain visible. Ensures continuity across AI agent sessions by recording decisions, learnings, and processes.
---

# Agent Continuity Skill

This skill scaffolds and maintains a self-documenting workspace. Load it once at the
start of a project. It creates `AGENTS.md` at the **project root** and a hidden
`.agents/` folder for the knowledge stores. After that, every future agent reads
`AGENTS.md` first and follows its embedded thinking chain automatically.

> **Load this skill once per project.** After scaffolding, `AGENTS.md` governs all
> future sessions.

---

## 1. Bootstrap (run once)

When you load this skill for the first time in a workspace:

1. Check if `AGENTS.md` exists at the **project root**.
2. If **yes** → read it and follow its instructions. You are a succeeding agent.
3. If **no** → you are the founding agent. Create the scaffold below.

### 1.1 Create `AGENTS.md` (at the project root)

Create `AGENTS.md` with exactly this content. Do not paraphrase. Future agents will
read it verbatim and follow it as their primary directive.

```markdown
# <PROJECT_NAME>

> **AGENT DIRECTIVE — Read this first, every session.**
> This document governs how you work in this workspace. Do not skip it.
> Last updated: <TODAY>

---

## Thinking Chain (run before every task)

1. **Read this file (`AGENTS.md`)** — the canonical glossary, current state, and active
   priorities. This is the single most commonly skipped step and the biggest cause of
   drift. Read it now.
2. **Load the matching playbook** in `.agents/playbooks/` *before* doing the work that
   playbook governs.
3. **Check the tracker** — run `node .agents/tracker/tracker.js list --open` before
   starting: create a ticket if none matches your task, keep its status and notes
   updated at every meaningful step, and move it to `For Review` when done. The user
   watches this board live; a stale ticket looks like stalled work.
4. **Consult the store before acting** — search `.agents/learnings/` (and the symptom
   table in `learnings/_index.md`) before tackling a problem; read relevant decisions in
   `.agents/decisions/` before a cross-cutting choice.
5. **Write back when done** — record what you learned (a new decision, a lesson learned)
   so the next agent inherits it.

Background agents given a task without this context must ask the parent agent for it.

---

## Domain Glossary

Define your project's nouns here. What is a "Campaign" vs an "Initiative"? What is
"Draft" vs "Published"? What counts as "Done"?

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

Rules that must always hold. Example: "All client-facing documents must be reviewed by
two people."

- [ ]

---

## Quality Checkpoint Routing

Every output has a defined check. Run the matching check before marking work complete.

| Work type | Checkpoint | Owner |
|---|---|---|
| | | |

---

## Knowledge System

All stores live inside the hidden folder `.agents/`. `AGENTS.md` lives at the project
root so agent runtimes can auto-load it without extra prompting.

| Store | Path | Purpose | Consult before | Write after |
|---|---|---|---|---|
| `decisions/` | `.agents/decisions/` | Hard-to-reverse choices | Cross-cutting decisions | Making a hard choice |
| `learnings/` | `.agents/learnings/` | Solved problems & lessons | Debugging | Fixing a defect |
| `playbooks/` | `.agents/playbooks/` | Reusable procedures | Recurring work | Establishing a process |
| `templates/` | `.agents/templates/` | Reusable starting points | Creating new output | Creating a reusable format |
| `tracker/` | `.agents/tracker/` | Shared project board (live for users via `./board`) | Starting any task | Every status change |

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

**Agent-local caveat:** Your session scratch (`.agents/.local/`) is private. Do not
commit it. It may contain drafts, tokens, keys, or half-formed ideas. Copy from
`templates/` into your private space; never move private material into shared stores.

---

## Folder Visibility Note

The agent knowledge stores live inside a **single hidden folder**: `.agents/`. Hidden on
macOS by default (dot-prefix + `chflags hidden`), so the user's project root stays clean
— only the user-created project files and folders are visible.

- To reveal the whole continuity tree in Finder: `chflags nohidden .agents`
- The folder still exists and is fully accessible even while hidden.

---

## Change Log

| Date | What changed | Agent |
|---|---|---|
| <TODAY> | Initial scaffold | Founding agent |
```

Replace `<PROJECT_NAME>` with the actual project name. Replace `<TODAY>` with today's date.

### 1.2 Create the store directories

**IMPORTANT — existing folder guard:**

Before creating `.agents/`, check if it already exists at the project root:
- **If `.agents/` exists** → do NOT delete, move, or overwrite it. Simply ensure the
  required subfolders exist inside it (`decisions/`, `learnings/`, `playbooks/`,
  `templates/`, `.local/`, `tracker/`). Create any that are missing. Then proceed to 1.3.
- **If `.agents/` does NOT exist** → create it.

```
.agents/                  # hidden (dot-prefix); also flag with `chflags hidden`
  decisions/
    README.md
  learnings/
    _index.md
  playbooks/
    (empty — populate as needed)
  templates/
    (empty — populate as needed)
  tracker/                # the shared project board (see the Plugins section)
    tracker.js            #   copied from this skill's plugins/tracker/
    board.html
  .local/
    (empty — add to .gitignore)
  .gitignore               # excludes .local/
```

**Do NOT** create `decisions/`, `learnings/`, `playbooks/`, `templates/`, or `.local/`
at the project root. They must live inside `.agents/`.

#### Tracker board setup (part of the scaffold)

If this skill was installed with its `plugins/tracker/` folder, install the shared
project board — every agent and the user collaborate on it in real time:

1. Copy the plugin into the scaffold (`<skill-dir>` is where this SKILL.md lives,
   e.g. `~/.agents/skills/agent-continuity`):
   ```sh
   cp <skill-dir>/plugins/tracker/tracker.js  .agents/tracker/tracker.js
   cp <skill-dir>/plugins/tracker/board.html  .agents/tracker/board.html
   ```
2. Seed the board:
   ```sh
   node .agents/tracker/tracker.js seed
   ```
3. Create the root launcher so the user can open the live board in the browser:
   ```sh
   cp <skill-dir>/plugins/tracker/board.sh ./board && chmod +x ./board
   ```
4. Follow `plugins/tracker/SKILL.md`'s contract from now on: check the board at the
   START of every task (`node .agents/tracker/tracker.js list --open`), create a
   ticket when none matches, keep its status and notes updated at every meaningful
   step, and move it to `For Review` when the work is done. The board is shared
   state — never hand-edit `board.json`.

If the plugin folder is not present, record the skip in AGENTS.md's Change Log and
continue.

#### `decisions/README.md`

```markdown
# Decision Index

Running list of all architecture and cross-cutting decisions.

| # | Title | Date | Status |
|---|---|---|---|
```

#### `learnings/_index.md`

```markdown
# Learnings Index

## Symptom Lookup Table

Search this table by symptom before debugging.

| Symptom keywords | Learning file | Tags |
|---|---|---|
```

### 1.3 Protect private space

Inside `.agents/`, add a `.gitignore` (or append to the root `.gitignore`) so the
agent-local scratch is never committed:

```
.local/
```

If not using git, ensure `.agents/.local/` is excluded from any sync or share mechanism.

### 1.4 Hide the folder

The `.agents/` folder must be hidden so the user's project root stays clean:

- The dot-prefix (`.agents/`) already hides it in Finder/terminal by default.
- Also flag it explicitly for robustness:

  ```bash
  chflags hidden .agents
  ```

- Do NOT apply `chflags hidden` to the inner folders — keep them visible inside the
  hidden parent so agents can browse them normally once the parent is revealed.
- If the user later wants to see the stores: `chflags nohidden .agents`.

### 1.5 Confirm completion

After scaffolding, read `AGENTS.md` aloud to yourself. If you are a succeeding agent
reading this skill file, stop here — `AGENTS.md` is your source of truth now.

---

## 2. How to maintain the system

This section is for your reference while you work. `AGENTS.md` tells future agents
*what* to do; this section tells *you* how to do it.

### 2.1 Decision Records (`.agents/decisions/`)

- One file per hard-to-reverse decision: `.agents/decisions/NNNN-<slug>.md`
- Number sequentially, zero-padded, continue from highest existing.
- **Shape:** present-tense title, `## Considered options` (rejected alternatives + why),
  dated `## Addendum:` sections for refinements (never rewrite original rationale).
- **When to write:** scope changes, vendor selection, methodology choice, structural
  reorganization, rejected/postponed direction. **Not** for routine fixes.
- Update `.agents/decisions/README.md` index. Decision numbers must not be reused.

### 2.2 Learnings (`.agents/learnings/`)

- Each record: `# title`, `**Status**`, `**Created**`, `**Tags**`, then
  `## Symptoms` → `## Root Cause` → `## Resolution` → `## Prevention` (checkboxes).
- Registration is **manual**: add the file, then add a row to
  `.agents/learnings/_index.md`.
- Tag by domain (e.g., `#client-communication`, `#data-quality`, `#process`).

### 2.3 Playbooks (`.agents/playbooks/`)

- Numbered steps. Follow them; update when process changes.
- Write when you explain the same steps twice.

### 2.4 Templates (`.agents/templates/`)

- Sanitized starting points. Copy and adapt; do not edit in place unless improving the
  reusable version.

### 2.5 Updating `AGENTS.md`

- Update when terminology, state, invariants, priorities, or routing changes.
- Keep it under 2 minutes to read. Move details to other stores.
- Append to the Change Log. Do not let it become a changelog itself.

### 2.6 Tracker board (`.agents/tracker/`)

- The board is shared live state between every agent and the user — write only
  through the script (`node .agents/tracker/tracker.js …`), never by editing
  `board.json`.
- Follow the full contract in `plugins/tracker/SKILL.md`: ticket at task start,
  status/notes at every meaningful step, `For Review` when done.
- If the tracker files are missing but the rest of the scaffold exists, re-run the
  Tracker board setup in §1.2 rather than improvising a different format.

---

## 3. Plugins

Plugins extend the scaffold with optional capabilities that live inside `.agents/`.
Each plugin is a folder under `plugins/` in this skill with its own SKILL.md
contract.

| Plugin | Installs | What it adds |
|---|---|---|
| `tracker` | `.agents/tracker/` + root `./board` launcher | A shared project-management board: tickets all agents create/update via the `tracker.js` CLI, watched and edited live by the user in the browser |

Install a plugin during the §1.2 scaffold step (copy + seed, per the plugin's
SKILL.md). Succeeding agents: if the plugin's folder is already present, its
contract is in force — the AGENTS.md thinking chain routes to it.

---

## 4. Summary for the founding agent

| Step | Action |
|---|---|
| 1 | Check if `AGENTS.md` exists at the project root |
| 2 | If no → create `AGENTS.md` and the hidden `.agents/` folder with all stores inside it |
| 3 | Install the tracker plugin (`.agents/tracker/` + root `./board`) and seed the board |
| 4 | If yes → read `AGENTS.md` and follow its thinking chain |
| 5 | Work — with a tracker ticket for every task |
| 6 | Write back to the appropriate store inside `.agents/` |
| 7 | Update `AGENTS.md` if state/terms changed |

After this skill runs once, `AGENTS.md` is the permanent governor. This skill file is
only a reference.