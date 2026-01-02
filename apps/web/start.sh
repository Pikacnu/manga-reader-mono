#!/bin/sh
set -e

#bun run build
bun run migrate
bun run start -- --hostname 0.0.0.0