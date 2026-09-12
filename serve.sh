#!/usr/bin/env bash
# ES modules need http://, not file://. Run this, then open the printed URL.
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo "Serving on http://localhost:$PORT  (ctrl-C to stop)"
python3 -m http.server "$PORT"
