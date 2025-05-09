#!/usr/bin/env bash
# exit on error
set -o errexit

# Install npm dependencies
npm install

# Install Playwright browsers with system dependencies
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install --with-deps chromium

# Optional: Clean up to reduce deployment size
npm cache clean --force 