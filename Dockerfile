FROM node:24-bookworm-slim AS node
FROM oven/bun:1.3 AS bun

FROM python:3.12-slim-bookworm AS base

# Copy Node.js from official image (same Debian base, glibc compatible)
COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=bun /usr/local/bin/bun /usr/local/bin/

ARG NGINX_MIN_VERSION=1.30.1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gettext \
    gnupg \
    libpq5 \
    libjemalloc2 \
    && curl -fsSL https://nginx.org/keys/nginx_signing.key \
        | gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg \
    && printf "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] https://nginx.org/packages/debian bookworm nginx\n" \
        > /etc/apt/sources.list.d/nginx.list \
    && apt-get update && apt-get install -y --no-install-recommends nginx \
    && nginx_version="$(nginx -v 2>&1 | sed -E 's#^nginx version: nginx/##')" \
    && dpkg --compare-versions "$nginx_version" ge "$NGINX_MIN_VERSION" \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/*/libjemalloc.so.2 /usr/lib/libjemalloc.so.2

# ============================================================
# FRONTEND DEPENDENCIES
# ============================================================
FROM base AS frontend_deps
WORKDIR /app/front_end

COPY front_end/package.json front_end/bun.lock ./
ENV NODE_ENV=production
RUN bun install --frozen-lockfile

# ============================================================
# BACKEND DEPENDENCIES
# ============================================================
FROM base AS backend_deps
WORKDIR /app

# Install build dependencies for any packages that need compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /uvx /usr/local/bin/
COPY pyproject.toml uv.lock .python-version ./
ENV UV_PROJECT_ENVIRONMENT=/app/venv
RUN uv sync --frozen --no-dev

# ============================================================
# MJML EMAIL TEMPLATES
# ============================================================
FROM base AS mjml_build
WORKDIR /app

RUN npm install -g mjml@4.18.0 mjml-column@4.18.0

COPY . /app/
COPY --from=backend_deps /app/venv /app/venv

RUN . venv/bin/activate && python manage.py mjml_compose \
    && mkdir -p /mjml_output \
    && cd /app && find . -path '*/templates/emails/*.html' \
       -exec sh -c 'mkdir -p /mjml_output/$(dirname "$1") && cp "$1" /mjml_output/$1' _ {} \;

# ============================================================
# DJANGO STATIC FILES (runs in parallel with frontend build)
# ============================================================
FROM base AS backend_static
WORKDIR /app

COPY . /app/
COPY --from=backend_deps /app/venv /app/venv
COPY --from=mjml_build /mjml_output/ /app/

RUN . venv/bin/activate && ./manage.py collectstatic --noinput

# ============================================================
# FRONTEND BUILD
# ============================================================
FROM base AS frontend_build
WORKDIR /app

# Copy only frontend source files
COPY front_end/ /app/front_end/

# Copy node_modules from deps stage
COPY --from=frontend_deps /app/front_end/node_modules /app/front_end/node_modules

# Build frontend
ENV NODE_ENV=production
RUN cd front_end \
    && NODE_OPTIONS=--max-old-space-size=8192 bun run build \
    && rm -rf .next/cache

# Inject Sentry sourcemaps
RUN cd front_end && bun x sentry-cli sourcemaps inject .next

# ============================================================
# FINAL ENVIRONMENT
# ============================================================
FROM base AS final_env
RUN mkdir -p /app && chown 1001:0 /app
WORKDIR /app

# Configure nginx
COPY ./scripts/nginx/ /
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default /etc/nginx/conf.d/default.conf \
    && mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx \
    && touch /run/nginx.pid \
    && chown -R 1001:0 /var/cache/nginx /var/log/nginx /var/lib/nginx /run/nginx.pid /etc/nginx \
    && chmod -R 755 /var/lib/nginx /var/log/nginx

# Copy ALL source code (backend + frontend source, but .next is overwritten)
COPY --chown=1001:0 . /app/

# Copy MJML-compiled email templates (not committed to git, built in mjml_build stage)
COPY --chown=1001:0 --from=mjml_build /mjml_output/ /app/

# Copy dependencies from build stages
COPY --chown=1001:0 --from=backend_deps /app/venv /app/venv
COPY --chown=1001:0 --from=frontend_deps /app/front_end/node_modules /app/front_end/node_modules

# Copy pre-built frontend (overwrites the source-only front_end/.next)
COPY --chown=1001:0 --from=frontend_build /app/front_end/.next /app/front_end/.next

# Copy pre-collected Django static files
COPY --chown=1001:0 --from=backend_static /app/staticfiles /app/staticfiles

# Switch to non-root user
RUN mkdir -p /home/app && chown 1001:0 /home/app
USER 1001

# Runtime configuration
ENV HOME=/home/app \
    PORT=8080 \
    GUNICORN_WORKERS=4 \
    NODE_INSTANCES=1 \
    NODE_HEAP_SIZE=1024 \
    LD_PRELOAD=/usr/lib/libjemalloc.so.2 \
    MALLOC_CONF=background_thread:true,dirty_decay_ms:1000,muzzy_decay_ms:1000

EXPOSE 8080

# ============================================================
# FINAL TARGETS
# ============================================================
FROM final_env AS release
CMD ["scripts/prod/release.sh"]

FROM final_env AS web
CMD ["scripts/prod/startapp.sh"]

FROM final_env AS django_cron
CMD ["scripts/prod/django_cron.sh"]

FROM final_env AS dramatiq_worker
CMD ["scripts/prod/run_dramatiq.sh"]

FROM final_env AS all_runners
CMD ["scripts/prod/run_all.sh"]
