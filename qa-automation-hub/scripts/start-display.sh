#!/usr/bin/env bash
set -euo pipefail

# Start Xvfb + fluxbox + x11vnc + noVNC inside the current container so
# Playwright runs with a visible browser, watchable from the host at
# http://localhost:6080/vnc.html.
#
# Idempotent: safe to call multiple times (kills lingering processes first).
# Used by the Jenkinsfile when HEADED=true.

NUM="${DISPLAY_NUM:-99}"
export DISPLAY=":${NUM}"
VNC_PORT="${VNC_PORT:-5900}"
NOVNC_PORT="${NOVNC_PORT:-6080}"

pkill -f "Xvfb :${NUM}\b" 2>/dev/null || true
pkill -f "x11vnc.*-rfbport ${VNC_PORT}\b" 2>/dev/null || true
pkill -f "novnc_proxy.*--listen ${NOVNC_PORT}\b" 2>/dev/null || true
pkill -f "websockify.*${NOVNC_PORT}\b" 2>/dev/null || true
pkill -f "fluxbox" 2>/dev/null || true

rm -f "/tmp/.X${NUM}-lock" "/tmp/.X11-unix/X${NUM}" 2>/dev/null || true
mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

nohup Xvfb ":${NUM}" -screen 0 1920x1080x24 -ac +extension RANDR +render -noreset \
  >/tmp/xvfb.log 2>&1 &
sleep 1

nohup fluxbox -display ":${NUM}" >/tmp/fluxbox.log 2>&1 &
sleep 0.5

nohup x11vnc -display ":${NUM}" -forever -shared -nopw -listen 0.0.0.0 \
  -rfbport "${VNC_PORT}" >/tmp/x11vnc.log 2>&1 &
sleep 0.5

if [[ -x /usr/share/novnc/utils/novnc_proxy ]]; then
  nohup /usr/share/novnc/utils/novnc_proxy --vnc "localhost:${VNC_PORT}" \
    --listen "${NOVNC_PORT}" >/tmp/novnc.log 2>&1 &
else
  nohup websockify --web=/usr/share/novnc "${NOVNC_PORT}" "localhost:${VNC_PORT}" \
    >/tmp/novnc.log 2>&1 &
fi
sleep 1

echo "Virtual display ready on DISPLAY=:${NUM}"
echo "Watch the browser at: http://localhost:${NOVNC_PORT}/vnc.html"
echo "Raw VNC (optional):    127.0.0.1:${VNC_PORT}  (no password)"
