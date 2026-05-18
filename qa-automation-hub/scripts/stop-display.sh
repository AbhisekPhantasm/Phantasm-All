#!/usr/bin/env bash
set +e

# Tear down the Xvfb / x11vnc / noVNC stack started by start-display.sh.
# Tolerant of "already stopped" - always exits 0.

NUM="${DISPLAY_NUM:-99}"
VNC_PORT="${VNC_PORT:-5900}"
NOVNC_PORT="${NOVNC_PORT:-6080}"

pkill -f "novnc_proxy.*--listen ${NOVNC_PORT}\b" 2>/dev/null
pkill -f "websockify.*${NOVNC_PORT}\b" 2>/dev/null
pkill -f "x11vnc.*-rfbport ${VNC_PORT}\b" 2>/dev/null
pkill -f "fluxbox" 2>/dev/null
pkill -f "Xvfb :${NUM}\b" 2>/dev/null
rm -f "/tmp/.X${NUM}-lock" "/tmp/.X11-unix/X${NUM}" 2>/dev/null

echo "Virtual display stopped"
exit 0
