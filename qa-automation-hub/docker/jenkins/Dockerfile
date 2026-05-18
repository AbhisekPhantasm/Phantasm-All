FROM jenkins/jenkins:lts-jdk17

# All system-level setup runs as root.
USER root

# Base utilities + git (already on the image but pin explicitly).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       ca-certificates curl jq git bash xz-utils gnupg procps \
  && rm -rf /var/lib/apt/lists/*

# Node 20 (NodeSource). Playwright needs a recent Node.
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && node -v && npm -v

# Pre-install Playwright system libraries so test runs don't need apt-get
# every build. Browsers themselves are downloaded per-build into
# /var/jenkins_home/.cache/ms-playwright (persistent named volume).
# Pin to the version used by the sibling project package.jsons.
ARG PLAYWRIGHT_VERSION=1.59.1
RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install-deps \
  && rm -rf /root/.npm /tmp/* /var/lib/apt/lists/*

# Virtual display stack for HEADED Playwright runs. The Jenkinsfile starts
# these on demand (HEADED=true), so the browser is watchable at
# http://localhost:6080/vnc.html while the build runs.
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       xvfb fluxbox x11vnc novnc websockify \
  && rm -rf /var/lib/apt/lists/*

# Cache browsers in jenkins_home so they survive container restarts.
ENV PLAYWRIGHT_BROWSERS_PATH=/var/jenkins_home/.cache/ms-playwright

USER jenkins

# Install Jenkins plugins at build time.
COPY --chown=jenkins:jenkins docker/jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
