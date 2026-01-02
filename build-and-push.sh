#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
IMAGE_NAME="manga-reader"
IMAGE_TAG="latest"
DOCKER_REGISTRY="localhost:5000"

# Build Docker images with multi-architecture support
function build_images() {
  echo "Building Docker images with multi-architecture support..."
  # Create a new builder that supports insecure registries if needed
  # docker buildx create --use --driver-opt network=host --buildkitd-flags '--allow-insecure-entitlement security.insecure'
  docker buildx create --use || true
  docker buildx build --platform linux/arm64 -t $DOCKER_REGISTRY/$IMAGE_NAME-web:$IMAGE_TAG ./apps/web --push
  docker buildx build --platform linux/arm64 -t $DOCKER_REGISTRY/$IMAGE_NAME-image-processor:$IMAGE_TAG ./apps/image-processer --push
}

# Main
build_images

echo "Docker images built and pushed successfully!"