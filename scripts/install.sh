#!/bin/bash
set -e

cd /opt/myapp

# Use full paths to avoid PATH issues
/usr/bin/npm ci --omit=dev || /usr/bin/npm install --omit=dev
