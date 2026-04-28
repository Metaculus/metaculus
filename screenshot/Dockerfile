# Based on this image:
# https://github.com/microsoft/playwright-python/blob/main/utils/docker/Dockerfile.focal

FROM python:3.12-slim-bookworm
ARG TZ=Etc/GMT
ARG DEBIAN_FRONTEND=noninteractive

COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /uvx /usr/local/bin/

# Install curl (needed for Heroku CLI) and Heroku CLI in a single layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg && \
    curl https://cli-assets.heroku.com/install-ubuntu.sh | sh && \
    apt-get purge -y --auto-remove curl && \
    rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos "" pwuser

WORKDIR /app

COPY pyproject.toml uv.lock ./

ENV PLAYWRIGHT_BROWSERS_PATH=/playwright-browsers/
ENV UV_PROJECT_ENVIRONMENT=/app/venv

RUN uv sync --frozen
RUN uv run playwright install chromium --with-deps

RUN chown -R pwuser:pwuser $PLAYWRIGHT_BROWSERS_PATH /app/venv

COPY app.py start.sh ./
RUN chown -R pwuser:pwuser /app

# This is not respected by Heroku, only used for local testing
# https://devcenter.heroku.com/articles/container-registry-and-runtime#dockerfile-commands-and-runtime
ENV PORT=9000
EXPOSE 9000

USER pwuser

CMD ["/app/start.sh"]
