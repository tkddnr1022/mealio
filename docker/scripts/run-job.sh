#!/usr/bin/env bash
# Run a Mealio batch job in an ephemeral Docker container using the consumer image.
# The container joins mealio-net, loads env vars from MEALIO_ENV_FILE, and is removed on exit.
#
# Usage:
#   run-job.sh <job-name> [job-args...]
#
# Required environment:
#   DOCKERHUB_USERNAME  Docker Hub username (image: <username>/mealio-consumer:latest)
#   MEALIO_ENV_FILE     Path to the env file
#
# Examples:
#   run-job.sh kpi-rollup
#   run-job.sh kpi-rollup 2026-05-22
#   run-job.sh kpi-rollup --backfill 7
#   run-job.sh recipe-ingestion-fetch --fetch-limit 100
#   run-job.sh recipe-ingestion-parse-retrieve

set -euo pipefail

JOB="${1:?Usage: $0 <job-name> [job-args...]}"
shift

ENV_FILE="${MEALIO_ENV_FILE:?MEALIO_ENV_FILE must be set}"
IMAGE="${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME must be set}/mealio-consumer:latest"
CONTAINER_NAME="mealio-job-${JOB}-$(date +%s)"
LOG_DIR="/var/log/mealio"

mkdir -p "${LOG_DIR}"

case "${JOB}" in
  kpi-rollup)
    LOG_FILE="${LOG_DIR}/kpi-rollup.log"
    ;;
  recipe-ingestion-*)
    LOG_FILE="${LOG_DIR}/recipe-ingestion.log"
    ;;
  *)
    LOG_FILE="${LOG_DIR}/${JOB}.log"
    ;;
esac

docker run --rm \
  --name "${CONTAINER_NAME}" \
  --network mealio-net \
  --env-file "${ENV_FILE}" \
  "${IMAGE}" \
  node "dist/jobs/${JOB}/run-${JOB}.js" "$@" >> "${LOG_FILE}" 2>&1
