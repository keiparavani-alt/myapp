#!/bin/bash
set -e

# Ensure target dir exists
mkdir -p /opt/myapp

# Install production deps
cd /opt/myapp
npm ci --omit=dev || npm install --production

