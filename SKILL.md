---
name: agent-continuity
description: |
  Scaffolds and maintains a self-documenting workspace. Load once at the start of a project to create AGENTS.md and a knowledge store structure, all consolidated inside a single HIDDEN folder `.agent-continuity/` (decisions/, learnings/, playbooks/, templates/, .local/). After scaffolding, future agents read AGENTS.md first and follow the embedded thinking chain. The user's project root stays clean — only the user-created project files and folders remain visible. Ensures continuity across AI agent sessions by recording decisions, learnings, and processes.
---

# Agent Continuity Skill

This skill scaffolds and maintains a self-documenting workspace. Load it once at the
start of a project. It creates `AGENTS.md` and the full store structure. After that,
every future agent reads `AGENTS.md` first and follows the embedded thinking chain
automatically.

> **Load this skill once per project.** After scaffolding, `AGENTS.md` governs all
> future sessions.

---

## 1. Bootstrap (run once)

When you load this skill for the first time in a workspace:

1. Check if `AGENTS.md` exists.
2. If **yes** → read it and follow its instructions. You are a succeeding agent.
3. If **no** → you are the founding agent. Create the entire scaffold below.

### 1.1 Create `AGENTS.md`

Create `AGENTS.md` with exactly this content. Do not paraphrase. Future agents will
read this verbatim and follow it as their primary directive.

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
2. **Load the matching playbook** in `playbooks/` *before* doing the work that playbook
   governs.
3. **Consult the store before acting** — search `learnings/` (and the symptom table in
   `learnings/_index.md`) before tackling a problem; read relevant decisions in
   `decisions/` before a cross-cutting choice.
4. **Write back when done** — record what you learned (a new decision, a lesson learned)
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

## Change Log

| Date | What changed | Agent |
|---|---|---|
| <TODAY> | Initial scaffold | Founding agent |
```

Replace `<PROJECT_NAME>` with the actual project name. Replace `<TODAY>` with today's date.

### 1.2 Create the store directories

Create a single hidden parent folder `.agent-continuity/` and the stores inside it:

```
.agent-continuity/          # hidden (dot-prefix); also flag with `chflags hidden`
  AGENTS.md                 # the directive created in 1.1
  decisions/
    README.md
  learnings/
    _index.md
  playbooks/
    (empty — populate as needed)
  templates/
    (empty — populate as needed)
  .local/
    (empty — add to .gitignore)
```

Do NOT create the continuity folders at the project root. Keep the root clean so that
only the user-created project files and folders are visible. Inside `.agent-continuity/`
you may keep a `.gitignore` with `.local/` listed.

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

Inside `.agent-continuity/`, add a `.gitignore` (or append to the root `.gitignore`) so
the agent-local scratch is never committed:

```
.local/
```

If not using git, ensure `.agent-continuity/.local/` is excluded from any sync or share
mechanism.

### 1.4 Hide the continuity folder

The entire continuity tree must be hidden so the user's project root stays clean:

- The dot-prefix (`.agent-continuity/`) already hides it in Finder/terminal by default.
- Also flag it explicitly for robustness:

  ```bash
  chflags hidden .agent-continuity
  ```

- Do NOT apply `chflags hidden` to the inner folders — keep them visible inside the hidden
  parent so agents can browse them normally once the parent is revealed.
- If the user later wants to see the continuity tree: `chflags nohidden .agent-continuity`.

### 1.5 Confirm completion

After scaffolding, read `.agent-continuity/AGENTS.md` aloud to yourself. If you are a
succeeding agent reading this skill file, stop here — `AGENTS.md` is your source of truth
now.

---

## 2. How to maintain the system

This section is for your reference while you work. `AGENTS.md` tells future agents
*what* to do; this section tells *you* how to do it.

### 2.1 Decision Records (`.agent-continuity/decisions/`)

- One file per hard-to-reverse decision: `.agent-continuity/decisions/NNNN-<slug>.md`
- Number sequentially, zero-padded, continue from highest existing.
- **Shape:** present-tense title, `## Considered options` (rejected alternatives + why),
  dated `## Addendum:` sections for refinements (never rewrite original rationale).
- **When to write:** scope changes, vendor selection, methodology choice, structural
  reorganization, rejected/postponed direction. **Not** for routine fixes.
- Update `.agent-continuity/decisions/README.md` index. Decision numbers must not be reused.

### 2.2 Learnings (`.agent-continuity/learnings/`)

- Each record: `# title`, `**Status**`, `**Created**`, `**Tags**`, then
  `## Symptoms` → `## Root Cause` → `## Resolution` → `## Prevention` (checkboxes).
- Registration is **manual**: add the file, then add a row to
  `.agent-continuity/learnings/_index.md`.
- Tag by domain (e.g., `#client-communication`, `#data-quality`, `#process`).

### 2.3 Playbooks (`.agent-continuity/playbooks/`)

- Numbered steps. Follow them; update when process changes.
- Write when you explain the same steps twice.

### 2.4 Templates (`.agent-continuity/templates/`)

- Sanitized starting points. Copy and adapt; do not edit in place unless improving the
  reusable version.

### 2.5 Updating `.agent-continuity/AGENTS.md`

- Update when terminology, state, invariants, priorities, or routing changes.
- Keep it under 2 minutes to read. Move details to other stores.
- Append to the Change Log. Do not let it become a changelog itself.

---

## 3. Summary for the founding agent

| Step | Action |
|---|---|
| 1 | Check if `.agent-continuity/AGENTS.md` exists |
| 2 | If no → create the hidden `.agent-continuity/` folder and all stores inside it using the templates above |
| 3 | If yes → read `.agent-continuity/AGENTS.md` and follow its thinking chain |
| 4 | Work |
| 5 | Write back to the appropriate store inside `.agent-continuity/` |
| 6 | Update `.agent-continuity/AGENTS.md` if state/terms changed |

After this skill runs once, `AGENTS.md` is the permanent governor. This skill file is
only a reference.
