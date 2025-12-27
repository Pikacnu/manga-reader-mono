#!/bin/sh
set -e

. /app/env.example
bun run build
bun run generate