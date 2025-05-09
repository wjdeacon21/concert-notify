#!/usr/bin/env bash
# exit on error
set -o errexit

# Install npm dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium

# Optional: Clean up to reduce deployment size
npm cache clean --force 