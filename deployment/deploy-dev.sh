#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
set -a
source "$SCRIPT_DIR/dev.env"
set +a
exec python3 "$SCRIPT_DIR/../scripts/deploy-local-dev.py" "$@"
