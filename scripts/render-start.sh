#!/bin/sh
set -eu

npm run prisma:migrate:deploy --workspace @repo/api

node apps/api/dist/src/main.js &
api_pid=$!

node apps/worker/dist/src/main.js &
worker_pid=$!

wait "$api_pid" "$worker_pid"
