FROM jenkins/jenkins:lts-jdk17

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl jq \
  && rm -rf /var/lib/apt/lists/*

# Download static docker binary
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-24.0.9.tgz -o docker.tgz \
  && tar xzvf docker.tgz \
  && mv docker/docker /usr/local/bin/ \
  && rm -rf docker docker.tgz

# Allow the jenkins user to invoke the Docker CLI when the host socket is mounted.
ARG JENKINS_DOCKER_GID=999
RUN groupadd -g ${JENKINS_DOCKER_GID} docker-host || true \
  && usermod -aG docker-host jenkins

USER jenkins

# Install common Jenkins plugins at build time (pin versions in production).
COPY --chown=jenkins:jenkins docker/jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
