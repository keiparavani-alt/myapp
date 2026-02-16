#!/bin/bash
set -e

# ensure directory exists
mkdir -p /opt/myapp

# copy files from deployment-archive to /opt/myapp
cp -r ./* /opt/myapp/

cd /opt/myapp

/usr/bin/npm install --omit=dev
