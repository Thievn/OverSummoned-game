#!/bin/bash
# usage: _test/run.sh "plan"   -> screenshots in /tmp/os_shots
cd "$(dirname "$0")/.."
rm -rf /tmp/os_shots; rm -f ~/.local/share/godot/app_userdata/*/oversummoned_desk.cfg
timeout 120 xvfb-run -a -s "-screen 0 1280x800x24" /home/claude/godot --path . --rendering-driver opengl3 -s res://_test/shots.gd -- "$1" 2>&1 | grep -E "ERROR|SCRIPT|Parse|error" | grep -v "ALSA\|audio_driver\|status < 0\|resources still in use\|resource.cpp"
ls /tmp/os_shots
