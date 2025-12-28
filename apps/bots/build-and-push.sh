#!/usr/bin/env sh
set -euo pipefail

# build-and-push.sh
# Builds the Docker image and optionally pushes it to a registry.
# Usage:
#   # Build local image only
#   IMAGE=manga-bots TAG=latest ./build-and-push.sh
#
#   # Build and push to registry (REGISTRY required)
#   IMAGE=manga-bots TAG=1.0.0 REGISTRY=my-registry PUSH=true ./build-and-push.sh
#
# Optional env vars:
#   IMAGE (default: manga-bots)
#   TAG   (default: latest)
#   REGISTRY (optional; if provided image is REGISTRY/IMAGE:TAG)
#   DOCKER_USERNAME / DOCKER_PASSWORD (optional, used for `docker login` if provided)
#   BUILD_CONTEXT (default: apps/bots)
#   DOCKERFILE (default: $BUILD_CONTEXT/Dockerfile)
#   PUSH (default: true)

IMAGE=${IMAGE:-manga-reader}
TAG=${TAG:-latest}
REGISTRY=${REGISTRY:-localhost:5000}
BUILD_CONTEXT=${BUILD_CONTEXT:-apps/bots}
DOCKERFILE=${DOCKERFILE:-$BUILD_CONTEXT/Dockerfile}
DOCKER_USERNAME=${DOCKER_USERNAME:-}
DOCKER_PASSWORD=${DOCKER_PASSWORD:-}
PUSH=${PUSH:-true}

if [ -n "$REGISTRY" ]; then
  FULL_IMAGE="$REGISTRY/$IMAGE:$TAG"
else
  FULL_IMAGE="$IMAGE:$TAG"
fi

echo "Building image: $FULL_IMAGE"

command -v docker >/dev/null 2>&1 || { echo "docker not found in PATH" >&2; exit 1; }

docker build -t "$FULL_IMAGE" -f "$DOCKERFILE" "$BUILD_CONTEXT"

if [ "$PUSH" = "true" ]; then
  if [ -n "$DOCKER_USERNAME" ] && [ -n "$DOCKER_PASSWORD" ]; then
    echo "Logging in to registry: ${REGISTRY:-docker.io}"
    echo "$DOCKER_PASSWORD" | docker login ${REGISTRY:-} -u "$DOCKER_USERNAME" --password-stdin
  fi

  if [ -z "$REGISTRY" ]; then
    echo "Warning: REGISTRY is empty — pushing to default registry (Docker Hub)"
  fi

  echo "Pushing image: $FULL_IMAGE"
  docker push "$FULL_IMAGE"
fi

echo "Done."
