#!/bin/bash
set -e
systemctl daemon-reload
systemctl enable myapp
systemctl restart myapp
systemctl status myapp --no-pager -l

