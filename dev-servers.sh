#!/usr/bin/env bash

set -euo pipefail

ACTION=${1:-}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/timeticking/backend"
FRONTEND_DIR="$ROOT_DIR/timeticking/frontend"
PID_FILE="$ROOT_DIR/.dev-servers.pids"
BACKEND_LOG="$BACKEND_DIR/dev-server.log"
FRONTEND_LOG="$FRONTEND_DIR/dev-server.log"
DEFAULT_PORT=4000

usage() {
  cat <<'EOF'
Usage: ./dev-servers.sh <start|stop|status>

  start   Launch backend (port 4000) and frontend (port 3000) in the background.
  stop    Stop the running dev servers started by this script.
  status  Show PID information for running dev servers.
EOF
  exit 1
}

ensure_dependencies() {
  local dir="$1"
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "Installing dependencies in $dir ..."
    (cd "$dir" && npm install >/dev/null)
  fi
}

start_servers() {
  if [[ -f "$PID_FILE" ]]; then
    echo "Looks like the dev servers are already running (see $PID_FILE)."
    exit 1
  fi

  ensure_dependencies "$BACKEND_DIR"
  ensure_dependencies "$FRONTEND_DIR"

  local backend_port="${PORT:-$DEFAULT_PORT}"

  echo "Starting backend on port $backend_port ..."
  (
    cd "$BACKEND_DIR"
    PORT="$backend_port" npm run dev
  ) >"$BACKEND_LOG" 2>&1 &
  local backend_pid=$!

  echo "Starting frontend on port 3000 ..."
  (
    cd "$FRONTEND_DIR"
    npm run dev
  ) >"$FRONTEND_LOG" 2>&1 &
  local frontend_pid=$!

  cat <<EOF >"$PID_FILE"
BACKEND_PID=$backend_pid
FRONTEND_PID=$frontend_pid
BACKEND_PORT=$backend_port
EOF

  echo "Backend log:   $BACKEND_LOG"
  echo "Frontend log:  $FRONTEND_LOG"
  echo "Use ./dev-servers.sh stop to stop both processes."
}

stop_servers() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "No running dev servers found."
    exit 0
  fi

  # shellcheck source=/dev/null
  source "$PID_FILE"

  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping backend (PID $BACKEND_PID) ..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "Stopping frontend (PID $FRONTEND_PID) ..."
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "Dev servers stopped."
}

status_servers() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "Dev servers are not running."
    exit 0
  fi

  # shellcheck source=/dev/null
  source "$PID_FILE"

  echo "Backend PID: ${BACKEND_PID:-unknown} (log: $BACKEND_LOG)"
  echo "Frontend PID: ${FRONTEND_PID:-unknown} (log: $FRONTEND_LOG)"
}

case "$ACTION" in
start)
  start_servers
  ;;
stop)
  stop_servers
  ;;
status)
  status_servers
  ;;
*)
  usage
  ;;
esac
