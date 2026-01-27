FROM node:24-bookworm-slim AS node

FROM python:3.12-slim-bookworm AS base

# Copy Node.js from official image (same Debian base, glibc compatible)
COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/bin/corepack /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gettext \
    libpq5 \
    nginx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# FRONTEND DEPENDENCIES
# ============================================================
FROM base AS frontend_deps
WORKDIR /app/front_end

COPY front_end/package*.json ./
ENV NODE_ENV=production
RUN npm ci

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

COPY poetry.lock pyproject.toml ./

RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false \
    && python -m venv venv \
    && . venv/bin/activate \
    && poetry install --without dev --no-interaction --no-ansi

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
    && NODE_OPTIONS=--max-old-space-size=4096 npm run build \
    && rm -rf .next/cache

# Inject Sentry sourcemaps
RUN cd front_end && npx sentry-cli sourcemaps inject .next

# ============================================================
# FINAL ENVIRONMENT
# ============================================================
FROM base AS final_env
WORKDIR /app

# Configure nginx
COPY ./scripts/nginx/ /
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default /etc/nginx/conf.d/default.conf \
    && mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx \
    && touch /run/nginx.pid \
    && chown -R 1001:0 /var/cache/nginx /var/log/nginx /var/lib/nginx /run/nginx.pid /etc/nginx \
    && chmod -R 755 /var/lib/nginx /var/log/nginx

# Install pm2 globally
RUN npm install -g pm2@6

# Copy ALL source code (backend + frontend source, but .next is overwritten)
COPY . /app/

# Copy dependencies from build stages
COPY --from=backend_deps /app/venv /app/venv
COPY --from=frontend_deps /app/front_end/node_modules /app/front_end/node_modules

# Copy pre-built frontend (overwrites the source-only front_end/.next)
COPY --from=frontend_build /app/front_end/.next /app/front_end/.next

# Collect Django static files
RUN . venv/bin/activate && ./manage.py collectstatic --noinput

# Set ownership and switch to non-root user
RUN mkdir -p /home/app && chown -R 1001:0 /app /home/app
USER 1001

# Runtime configuration
ENV HOME=/home/app \
    PORT=8080 \
    GUNICORN_WORKERS=4 \
    NODE_INSTANCES=1 \
    NODE_HEAP_SIZE=1024

EXPOSE 8080

# Cache test
RUN echo "cache-bust-v1" > /tmp/.cache-test

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
