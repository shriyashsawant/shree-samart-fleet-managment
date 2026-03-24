#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Update package list and install Tesseract + English training data
# Note: Render allows 'apt-get install' in some environments or via buildpacks
# But the most reliable way on Render is using the Tesseract Buildpack:
# https://github.com/heroku/heroku-buildpack-tesseract.git
# Or just ensure it's in the PATH if pre-installed.

echo "--- INSTALLING Python DEPENDENCIES ---"
pip install --upgrade pip
pip install -r requirements.txt

echo "--- DEPLOYMENT READY ---"
