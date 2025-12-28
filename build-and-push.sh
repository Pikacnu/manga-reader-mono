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
  docker buildx create --use
  docker buildx build --platform linux/amd64,linux/arm64 -t $DOCKER_REGISTRY/$IMAGE_NAME-web:$IMAGE_TAG ./apps/web --push
  docker buildx build --platform linux/amd64,linux/arm64 -t $DOCKER_REGISTRY/$IMAGE_NAME-image-processor:$IMAGE_TAG ./apps/image-processer --push
}

# Push Docker images to registry
function push_images() {
  echo "Pushing Docker images to registry..."
  docker push $DOCKER_REGISTRY/$IMAGE_NAME-web:$IMAGE_TAG
  docker push $DOCKER_REGISTRY/$IMAGE_NAME-image-processor:$IMAGE_TAG
}

# Main
build_images
push_images

echo "Docker images built and pushed successfully!"