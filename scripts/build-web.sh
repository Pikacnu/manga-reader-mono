#!/bin/bash
set -e

# Change to the root directory of the project
cd "$(dirname "$0")/.."

echo "🚀 Starting web build process..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed."
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install --frozen-lockfile
fi

# Build Next.js
echo "🏗️ Building Next.js application (Web)..."
bun web:build

echo "✅ Web build completed successfully."
