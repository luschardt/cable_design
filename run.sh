#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8000}"
HOST="${HOST:-127.0.0.1}"

exec env PORT="${PORT}" HOST="${HOST}" npm start
