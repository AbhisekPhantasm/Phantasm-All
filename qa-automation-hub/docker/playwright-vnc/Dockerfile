# Playwright + virtual framebuffer + noVNC (browser-based viewer).
# Pin the base tag to match @playwright/test / Jenkins runner.
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

USER root

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    xvfb \
    fluxbox \
    x11vnc \
    novnc \
    websockify \
  && rm -rf /var/lib/apt/lists/*

COPY docker/playwright-vnc/entrypoint.sh /usr/local/bin/qa-vnc-entrypoint.sh
RUN chmod +x /usr/local/bin/qa-vnc-entrypoint.sh

ENV DISPLAY=:99

LABEL org.opencontainers.image.title="qa-hub-playwright-vnc" \
      org.opencontainers.image.description="Playwright + noVNC for headed test viewing (local dev)"

ENTRYPOINT ["/usr/local/bin/qa-vnc-entrypoint.sh"]
CMD ["sleep", "infinity"]
