#!/bin/bash
cd "$(dirname "$0")/.."
timeout 60 /home/claude/godot --headless --path . --check-only --script res://main.gd 2>&1 | grep -E "Parse Error|SCRIPT ERROR|at:.*main.gd|puppet.gd" | head -8
