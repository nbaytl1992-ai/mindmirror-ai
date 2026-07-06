#!/usr/bin/env bash
# Use Windows Clash/V2Ray from WSL (default mixed port 7897).
set -euo pipefail
PORT="${CLASH_PORT:-7897}"
HOST="$(ip route | awk '/default/ {print $3; exit}')"
export http_proxy="http://${HOST}:${PORT}"
export https_proxy="http://${HOST}:${PORT}"
export HTTP_PROXY="$http_proxy"
export HTTPS_PROXY="$https_proxy"
export ALL_PROXY="$https_proxy"
echo "Proxy: $https_proxy"
exec "$@"
