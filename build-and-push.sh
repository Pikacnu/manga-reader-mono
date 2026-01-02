#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
IMAGE_NAME="manga-reader"
IMAGE_TAG="latest"
DOCKER_REGISTRY="localhost:5000"

# Build and Push Docker images
function build_and_push() {
  echo "Building Docker images locally..."
  
  # Build Web
  docker buildx build --platform linux/arm64 -t $DOCKER_REGISTRY/$IMAGE_NAME-web:$IMAGE_TAG ./apps/web --load
  echo "Pushing Web image..."
  docker push $DOCKER_REGISTRY/$IMAGE_NAME-web:$IMAGE_TAG

  # Build Image Processor
  docker buildx build --platform linux/arm64 -t $DOCKER_REGISTRY/$IMAGE_NAME-image-processor:$IMAGE_TAG ./apps/image-processer --load
  echo "Pushing Image Processor image..."
  docker push $DOCKER_REGISTRY/$IMAGE_NAME-image-processor:$IMAGE_TAG
}

# Main
build_and_push

echo "Docker images built and pushed successfully!"