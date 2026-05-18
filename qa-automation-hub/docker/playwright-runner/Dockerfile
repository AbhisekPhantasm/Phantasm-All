# Playwright runner used by Jenkins (docker.inside) or local CI.
# Pin the tag to match the highest @playwright/test version used across sibling projects.
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

LABEL org.opencontainers.image.title="qa-hub-playwright-runner" \
      org.opencontainers.image.description="Phantasm QA hub - Playwright test runtime (align tag with @playwright/test in sibling suites)"

WORKDIR /workspace

ENV CI=1 \
    NODE_ENV=test

USER pwuser
