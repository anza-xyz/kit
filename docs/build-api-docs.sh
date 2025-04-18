#!/usr/bin/env bash
set -euo pipefail

cd ..
pnpm turbo compile:docs --output-logs=hash-only

API_DIR="$(pwd)/docs/content/api"
find $API_DIR -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
mkdir -p "$API_DIR"

for DOC_PATH in packages/*/.docs; do
    (cd $DOC_PATH && rsync -a . $API_DIR/ --exclude "index.mdx")
done
