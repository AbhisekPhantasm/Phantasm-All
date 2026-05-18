#!/usr/bin/env bash
set -euo pipefail

# Local dev only: virtual display + VNC + noVNC in browser.
# Do not expose 6080/5900 beyond localhost without a VNC password.

D="${DISPLAY:-:99}"
if [[ "${D}" != :* ]]; then D=":${D}"; fi
export DISPLAY="${D}"
NUM="${D#:}"

XVFB_PID=""
VNC_PID=""
NOVNC_PID=""

cleanup() {
  [[ -n "${NOVNC_PID}" ]] && kill "${NOVNC_PID}" 2>/dev/null || true
  [[ -n "${VNC_PID}" ]] && kill "${VNC_PID}" 2>/dev/null || true
  [[ -n "${XVFB_PID}" ]] && kill "${XVFB_PID}" 2>/dev/null || true
  rm -f "/tmp/.X${NUM}-lock" "/tmp/.X11-unix/X${NUM}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

rm -f "/tmp/.X${NUM}-lock" "/tmp/.X11-unix/X${NUM}" 2>/dev/null || true
mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

Xvfb "${DISPLAY}" -screen 0 1920x1080x24 -ac +extension RANDR +render -noreset &
XVFB_PID=$!
sleep 0.8

fluxbox &
sleep 0.4

x11vnc -display "${DISPLAY}" -forever -shared -nopw -listen 0.0.0.0 -rfbport 5900 &
VNC_PID=$!
sleep 0.3

if [[ -x /usr/share/novnc/utils/novnc_proxy ]]; then
  /usr/share/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080 &
else
  websockify --web=/usr/share/novnc 6080 localhost:5900 &
fi
NOVNC_PID=$!
sleep 0.3

echo ""
echo "== QA Hub Playwright VNC =="
echo "Open in your host browser: http://127.0.0.1:6080/vnc.html"
echo "Raw VNC (optional):          127.0.0.1:5900   (no password — dev only)"
echo "Run tests (headed) example:"
echo "  docker compose exec playwright-vnc bash -lc \\"
echo "    'cd /mono/qa-automation-hub && export PHANTASM_MONO_ROOT=/mono HEADED=1 PROJECT_ID=flavor-boys && bash scripts/run-project.sh'"
echo ""

if [[ "$#" -eq 0 ]]; then
  set -- sleep infinity
fi

"$@" &
wait $!
