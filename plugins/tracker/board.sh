#!/bin/sh
# Live tracker board — users + agents collaborate in the browser.
# The founding agent copies this to the project root during scaffold:
#   cp .agents/tracker/board.sh ./board && chmod +x ./board
# Usage: ./board [--port 4870]   (opens the browser automatically)
exec node ".agents/tracker/tracker.js" serve --open "$@"
