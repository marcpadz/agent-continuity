# agent-continuity

A self-documenting workspace scaffold skill for AI coding agents.

`agent-continuity` bootstraps a lightweight, durable knowledge system inside any
project so that context survives across agent sessions. After the first run, the
generated `AGENTS.md` becomes the permanent governor: every future agent reads it
first and follows its embedded thinking chain.

> **Load this skill once per project.** After scaffolding, `AGENTS.md` governs all
> future sessions.

---

## Why?

AI agents are great at a single task but forget everything between sessions. This
skill solves that by giving the workspace a memory:

- **Decisions** — hard-to-reverse choices, with rejected alternatives.
- **Learnings** — solved problems and lessons, searchable by symptom.
- **Playbooks** — reusable procedures for recurring work.
- **Templates** — sanitized starting points for new output.

The result: the second agent inherits the first agent's context instead of starting
blind.

---

## What it creates

All scaffolding lives inside a **single hidden folder** `.agents/`, so the
project root stays clean — only the user-created project files and folders are visible
(plus the optional `board` launcher):

```
AGENTS.md           # the directive — read this first, every session (project root)
.agents/
  decisions/
    README.md        # decision index
  learnings/
    _index.md        # symptom lookup table
  playbooks/         # (empty — populate as needed)
  templates/         # (empty — populate as needed)
  tracker/           # shared project board (tracker plugin — see below)
  .local/            # agent-private scratch (gitignored)
  .gitignore         # excludes .local/
board               # root launcher: opens the live tracker board in the browser
```

Hidden on macOS via dot-prefix + `chflags hidden`. To reveal:
`chflags nohidden .agents`.

---

## Plugins

### `tracker` — the shared project board

The tracker plugin adds a project-management layer that agents and users
collaborate on:

- **Every task is a ticket.** The thinking chain makes agents check the board at
  task start (`node .agents/tracker/tracker.js list --open`), create a ticket when
  none matches, keep its status and notes updated at every meaningful step, and
  move it to `For Review` when done.
- **Users get a live board in the browser.** The scaffold drops a `./board`
  launcher in the project root:
  ```sh
  ./board            # starts the board server and opens http://127.0.0.1:4870
  ```
  Tickets agents create or move via the CLI appear in the open browser within a
  second (file-watch + server-sent events). Drag cards between columns, click to
  edit, comment, reassign — every user edit is immediately visible to agents.
- **Zero dependencies.** One Node script (`tracker.js`) and one HTML file
  (`board.html`), copied into `.agents/tracker/` at scaffold time. Node ≥ 18, no
  `npm install`, no build step.
- **Concurrent-safe.** All writes go through the script: atomic tmp+rename under
  a stale-tolerant lockfile, so multiple agents can't corrupt or clobber the
  board.

The board file itself (`.agents/tracker/board.json`) is committed with the
workspace — it is the project's durable task memory, exactly like the other
stores.

See [`plugins/tracker/SKILL.md`](plugins/tracker/SKILL.md) for the full agent
contract and command surface.

---

## Install

This skill is designed for agent runtimes that load skills from a local folder
(e.g. `~/.agents/skills/`).

```bash
# Create the skill directory and copy SKILL.md into it
mkdir -p ~/.agents/skills/agent-continuity
cp SKILL.md ~/.agents/skills/agent-continuity/SKILL.md
```

Then trigger the skill from your agent in a project workspace:

> Run the `agent-continuity` skill.

The agent will detect there is no `AGENTS.md`, scaffold the structure, hide the
folder, and leave your project root untouched.

---

## How it works

1. **Bootstrap (run once).** If `AGENTS.md` doesn't exist, the founding agent creates
   it plus the full store structure inside `.agent-continuity/`.
2. **Succeeding agents.** If `AGENTS.md` exists, the agent reads it and follows the
   embedded thinking chain — no re-scaffolding.
3. **Write back.** After any non-trivial work, the agent records what it learned in the
   appropriate store (a decision, a learning, a playbook, or a template).

### The thinking chain

Every session runs:

1. Read `AGENTS.md` (glossary, current state, priorities).
2. Load the matching playbook before governed work.
3. Check the tracker — every task gets a ticket on the shared board, kept live.
4. Consult the store before acting (learnings index, decisions).
5. Write back when done.

---

## Repository layout

| Path | Purpose |
|---|---|
| `SKILL.md` | The skill definition — bootstrap + maintenance instructions |
| `plugins/tracker/` | The tracker plugin — shared board CLI, live board UI, agent contract, smoke tests |
| `README.md` | This file |
| `LICENSE` | MIT license |
| `examples/AGENTS.md` | A ready-to-use `AGENTS.md` template |
| `examples/decisions/README.md` | Decision index template |
| `examples/learnings/_index.md` | Learnings index template |
| `examples/tracker/board.json` | Seed board template |

---

## License

MIT — see [LICENSE](LICENSE).
