#!/usr/bin/env node
/**
 * agent-continuity tracker — a file-based project board that agents and users
 * share. Zero dependencies; Node >= 18.
 *
 * The board lives at `.agents/tracker/board.json` (run `seed` to create it).
 * Every write goes through this script (CLI or the `serve` HTTP API), so the
 * JSON never needs hand-editing and concurrent agents don't clobber each
 * other (atomic tmp+rename writes under a stale-tolerant lockfile).
 *
 * Agent contract (also in plugins/tracker/SKILL.md):
 *   list / show / create / update / move / comment / archive / restore / delete
 *
 * Users: `serve` starts the live board and opens it in the browser — the
 * root-level `board` launcher wraps this (`./board [--port N]`).
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");

const DEFAULT_COLUMNS = ["Idea", "Not Started", "In Progress", "For Review", "Done"];

// The board lives inside the scaffold's hidden store. Resolve relative to the
// CURRENT working directory so the same script works from any workspace that
// scaffolded its own copy — and from this repo when hacking on the plugin.
function boardPath() {
  const custom = process.env.TRACKER_BOARD;
  if (custom) return path.resolve(custom);
  return path.resolve(process.cwd(), ".agents", "tracker", "board.json");
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `tsk_${crypto.randomBytes(6).toString("hex")}`;
}

// ── Storage: lock + atomic write ────────────────────────────────────────────

function lockPath(board) {
  return board + ".lock";
}

function acquireLock(board, timeoutMs = 5000) {
  const lock = lockPath(board);
  const start = Date.now();
  for (;;) {
    try {
      // O_EXCL creates the lock atomically — the loser retries.
      const fd = fs.openSync(lock, "wx");
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      return () => fs.rmSync(lock, { force: true });
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      // Steal a stale lock (holder died) after 5s.
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 5000) {
          fs.rmSync(lock, { force: true });
          continue;
        }
      } catch {
        /* lock vanished — retry */
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(`timed out waiting for the board lock (${lock})`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
}

function loadBoard(boardFile) {
  if (!fs.existsSync(boardFile)) {
    throw new Error(
      `no tracker board at ${boardFile} — run: node ${__filename} seed`
    );
  }
  const board = JSON.parse(fs.readFileSync(boardFile, "utf8"));
  if (!Array.isArray(board.columns) || !Array.isArray(board.cards)) {
    throw new Error(`malformed board at ${boardFile}: columns/cards missing`);
  }
  return board;
}

function writeBoardLocked(boardFile, board) {
  const tmp = `${boardFile}.${process.pid}.${crypto.randomBytes(3).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(board, null, 2) + "\n");
  fs.renameSync(tmp, boardFile); // atomic on POSIX — readers never see a half file
}

function saveBoard(boardFile, board) {
  const release = acquireLock(boardFile);
  try {
    writeBoardLocked(boardFile, board);
  } finally {
    release();
  }
}

// Load → mutate → write under ONE lock hold, so two concurrent agents can
// never interleave read-modify-write and drop each other's cards.
function mutateBoard(boardFile, fn) {
  const release = acquireLock(boardFile);
  try {
    const board = loadBoard(boardFile);
    const result = fn(board);
    board.updated_at = nowIso();
    writeBoardLocked(boardFile, board);
    return result === undefined ? board : result;
  } finally {
    release();
  }
}

// ── Core actions (shared by CLI and the serve HTTP API) ─────────────────────

function nextKey(board) {
  let max = 0;
  for (const c of board.cards) {
    const m = /^TSK-(\d+)$/.exec(c.key || "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `TSK-${max + 1}`;
}

function findCard(board, keyOrId) {
  const needle = String(keyOrId).trim();
  const card = board.cards.find(
    (c) => c.key === needle || c.id === needle || `#${c.key}` === needle
  );
  if (!card) {
    throw new Error(`no ticket '${needle}' on the board — run "list" to see keys`);
  }
  return card;
}

function resolveStatus(board, status) {
  const hit = board.columns.find(
    (c) => c.toLowerCase() === String(status).trim().toLowerCase()
  );
  if (!hit) {
    throw new Error(
      `unknown status '${status}' — valid columns: ${board.columns.join(", ")}`
    );
  }
  return hit;
}

const Actions = {
  seed(board, args) {
    if (board.cards.length && !args.force) {
      throw new Error("board already exists (use --force to re-seed columns)");
    }
    board.version = board.version || 1;
    board.workspace = board.workspace || path.basename(process.cwd());
    board.columns = DEFAULT_COLUMNS.slice();
    if (!Array.isArray(board.cards)) board.cards = [];
    return "Seeded board with columns: " + board.columns.join(", ");
  },

  list(board, args) {
    let cards = board.cards.slice();
    if (args.status) cards = cards.filter((c) => c.status === resolveStatus(board, args.status));
    if (args.assignee)
      cards = cards.filter(
        (c) => (c.assignee || "").toLowerCase() === args.assignee.toLowerCase()
      );
    if (args.open) cards = cards.filter((c) => c.status !== "Done" && !c.archived_at);
    if (!args.json) {
      if (cards.length === 0) return "No tickets match.";
      return cards
        .map((c) => renderCardLine(c, board))
        .join("\n");
    }
    return { board: { workspace: board.workspace, columns: board.columns }, cards };
  },

  show(board, args) {
    const card = findCard(board, args.key);
    if (args.json) return { card };
    const lines = [
      `${card.key} — ${card.title}`,
      `  status:    ${card.status}${card.archived_at ? " (archived)" : ""}`,
      `  assignee:  ${card.assignee || "—"}`,
      `  created:   ${card.created_at} by ${card.created_by}`,
      `  updated:   ${card.updated_at}`,
    ];
    if (card.description) lines.push(`  description: ${card.description}`);
    for (const cm of card.comments || []) {
      lines.push(`  · [${cm.at}] ${cm.author}: ${cm.body}`);
    }
    return lines.join("\n");
  },

  create(board, args) {
    const title = (args.title || "").trim();
    if (!title) throw new Error("create requires --title");
    const status = args.status ? resolveStatus(board, args.status) : board.columns[1] || board.columns[0];
    const card = {
      id: newId(),
      key: nextKey(board),
      title,
      description: (args.description || "").trim(),
      status,
      assignee: (args.assignee || "").trim() || null,
      created_by: args.as || "agent",
      created_at: nowIso(),
      updated_at: nowIso(),
      archived_at: null,
      comments: [],
    };
    board.cards.push(card);
    return args.json ? { card } : `Created ${card.key}: ${card.title} [${card.status}]`;
  },

  update(board, args) {
    const card = findCard(board, args.key);
    if (args.title !== undefined) {
      const t = args.title.trim();
      if (!t) throw new Error("title must not be empty");
      card.title = t;
    }
    if (args.description !== undefined) card.description = args.description.trim();
    if (args.assignee !== undefined)
      card.assignee = args.assignee.trim() || null;
    if (args.status) card.status = resolveStatus(board, args.status);
    if (args.note) {
      card.comments = card.comments || [];
      card.comments.push({
        author: args.as || "agent",
        kind: "note",
        body: args.note.trim(),
        at: nowIso(),
      });
    }
    card.updated_at = nowIso();
    return args.json
      ? { card }
      : `Updated ${card.key}: ${card.title} [${card.status}]`;
  },

  move(board, args) {
    if (!args.status) throw new Error("move requires --status");
    return Actions.update(board, { ...args });
  },

  comment(board, args) {
    if (!args.body) throw new Error("comment requires --body");
    return Actions.update(board, { ...args, as: args.author || args.as, note: args.body });
  },

  archive(board, args) {
    const card = findCard(board, args.key);
    card.archived_at = nowIso();
    card.updated_at = nowIso();
    return args.json ? { card } : `Archived ${card.key}`;
  },

  restore(board, args) {
    const card = findCard(board, args.key);
    card.archived_at = null;
    card.updated_at = nowIso();
    return args.json ? { card } : `Restored ${card.key}`;
  },

  delete(board, args) {
    const card = findCard(board, args.key);
    board.cards = board.cards.filter((c) => c !== card);
    return args.json ? { deleted: card.key } : `Deleted ${card.key}`;
  },
};

// ── Rendering (the terminal "inline card") ──────────────────────────────────

function statusDot(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("progress")) return "●"; // blue in the UI; terminal keeps mono
  if (s.includes("review")) return "◐";
  if (s === "done" || s.includes("complet")) return "✓";
  if (s === "idea") return "○";
  return "○";
}

function renderCardLine(card, board) {
  const who = card.assignee ? ` @${card.assignee}` : "";
  const notes = (card.comments || []).length;
  const noteTag = notes ? ` (${notes} note${notes > 1 ? "s" : ""})` : "";
  return `${statusDot(card.status)} [${card.status}] ${card.key}  ${card.title}${who}${noteTag}${
    card.archived_at ? " [archived]" : ""
  }`;
}

// ── CLI arg parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      if (name === "json" || name === "force" || name === "open" || name === "mine" || name === "open-only") {
        args[name === "open-only" ? "open" : name] = true;
      } else {
        args[name] = argv[++i];
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function usage() {
  return `agent-continuity tracker

  node tracker.js seed [--force]                     create the board (.agents/tracker/board.json)
  node tracker.js list [--status S] [--assignee A] [--open] [--json]
  node tracker.js show <TSK-n|id> [--json]
  node tracker.js create --title "T" [--description "D"] [--status S] [--assignee A]
  node tracker.js update <key> [--title T] [--description D] [--status S] [--assignee A] [--note "..."]
  node tracker.js move <key> --status S
  node tracker.js comment <key> --body "..." [--author A]
  node tracker.js archive|restore|delete <key>
  node tracker.js serve [--port 4870] [--open]       live board for users + agents

  --as <name>        who is acting (defaults "agent"; the server passes "user")
  --json             machine-readable output
  TRACKER_BOARD=...  override the board file path`;
}

function runAction(action, args) {
  const boardFile = boardPath();
  fs.mkdirSync(path.dirname(boardFile), { recursive: true });
  if (!fs.existsSync(boardFile) && action === "seed") {
    saveBoard(boardFile, {
      version: 1,
      workspace: path.basename(process.cwd()),
      columns: DEFAULT_COLUMNS.slice(),
      cards: [],
    });
  }
  if (action === "serve") return serve(boardFile, args);
  const out = mutateBoard(boardFile, (board) => {
    if (!board.columns) board.columns = DEFAULT_COLUMNS.slice();
    const fn = Actions[action];
    if (!fn) throw new Error(`unknown action '${action}'\n\n${usage()}`);
    return fn(board, args);
  });
  if (typeof out === "string") return out;
  return JSON.stringify(out, null, 2);
}

// ── serve: the live board (users + agents collaborate) ──────────────────────

function serve(boardFile, args) {
  const port = Number(args.port || process.env.TRACKER_PORT || 4870);
  const clients = new Set();
  let debounce = null;

  // Broadcast a "changed" tick whenever the file lands on disk — covers CLI
  // writes from any agent, not just UI edits.
  try {
    fs.watch(path.dirname(boardFile), (_event, filename) => {
      if (filename && filename !== path.basename(boardFile)) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        for (const res of clients) res.write("event: changed\ndata: {}\n\n");
      }, 120);
    });
  } catch {
    // fs.watch is best-effort (network mounts); the UI also polls.
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/board")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(path.join(__dirname, "board.html")));
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/board") {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(fs.readFileSync(boardFile, "utf8"));
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      res.write("retry: 2000\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/action") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const action = payload.action;
          const fn = Actions[action];
          if (!fn) throw new Error(`unknown action '${action}'`);
          const args2 = { ...payload, as: payload.as || "user", json: true };
          delete args2.action;
          const out = mutateBoard(boardFile, (board) => {
            if (!board.columns) board.columns = DEFAULT_COLUMNS.slice();
            return fn(board, args2);
          });
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true, result: out }));
          for (const c of clients) c.write("event: changed\ndata: {}\n\n");
        } catch (e) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
        }
      });
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`Tracker board live at ${url}  (board: ${boardFile})`);
    console.log("Ctrl+C to stop. Every agent CLI write appears here in real time.");
    if (args.open) openBrowser(url);
  });
  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.error(`Port ${port} is in use — is a board already running? Try --port.`);
      process.exit(1);
    }
    throw e;
  });
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd /c start"
        : "xdg-open";
  try {
    spawn(cmd, [url], { stdio: "ignore", shell: process.platform === "win32" });
  } catch {
    console.log(`Open ${url} manually.`);
  }
}

// ── main ────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help") {
    console.log(usage());
    return;
  }
  const action = argv[0];
  const args = parseArgs(argv.slice(1));
  // First positional (e.g. `TSK-3` in `update TSK-3 --status …`) is the key.
  if (args.key === undefined && args._ && args._[0] !== undefined) {
    args.key = args._[0];
  }
  try {
    const out = runAction(action, args);
    if (out !== undefined && action !== "serve") console.log(out);
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { Actions, loadBoard, saveBoard, boardPath, DEFAULT_COLUMNS };
