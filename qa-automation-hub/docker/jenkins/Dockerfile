FROM jenkins/jenkins:lts-jdk17

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends docker.io ca-certificates curl jq \
  && rm -rf /var/lib/apt/lists/*

# Allow the jenkins user to invoke the Docker CLI when the host socket is mounted.
ARG JENKINS_DOCKER_GID=999
RUN groupadd -g ${JENKINS_DOCKER_GID} docker-host || true \
  && usermod -aG docker-host jenkins

USER jenkins

# Install common Jenkins plugins at build time (pin versions in production).
COPY --chown=jenkins:jenkins docker/jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
