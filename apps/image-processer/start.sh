#!/bin/bash

# Apply migrations
bun run migrate

# Start the application
bun run start