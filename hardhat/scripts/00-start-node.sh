#!/usr/bin/env bash
set -euo pipefail

# Start a local Hardhat node with a mainnet fork
# Usage: ./hardhat/scripts/00-start-node.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ ! -f "../.env" ]; then
  echo "[i] .env not found. Copying from .env.example"
  cp ../.env.example ../.env
fi

source ../.env

echo "[i] Starting Hardhat node (fork: $MAINNET_RPC_URL, block: ${FORK_BLOCK:-latest})"

npx hardhat node --config ./hardhat.config.js | cat
