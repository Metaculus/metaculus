FROM alpine:latest AS base

RUN apk add --no-cache --update python3 py3-pip bash curl git \
    build-base \
    openssl-dev \
    zlib-dev \
    bzip2-dev \
    readline-dev \
    sqlite-dev \
    wget \
    curl \
    llvm \
    ncurses-dev \
    xz \
    tk-dev \
    libffi-dev \
    xz-dev \
    python3-dev \
    py3-openssl \
    vim

RUN curl https://pyenv.run | bash && \
    chmod -R 777 "/root/.pyenv/bin"

ENV PATH="/root/.pyenv/bin/:/root/.local/bin/:/root/.pyenv/shims/:${PATH}"

ADD .python-version /tmp/.python-version

RUN pyenv install -v $(cat /tmp/.python-version) && pyenv global $(cat /tmp/.python-version)

RUN curl -sSL https://install.python-poetry.org | python - && \
    chmod -R 777 "/root/.local/bin"

ADD front_end/.nvmrc /tmp/.nvmrc
# Install Nodejs
# Inspired from: https://github.com/nodejs/docker-node/blob/main/Dockerfile-alpine.template
ENV ARCH=x64
RUN export NODE_VERSION=$(cat /tmp/.nvmrc) && cd /tmp/ && curl -fsSLO --compressed "https://unofficial-builds.nodejs.org/download/release/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH-musl.tar.xz" \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH-musl.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

FROM base AS backend_deps
WORKDIR /app

ADD poetry.lock poetry.lock
ADD pyproject.toml pyproject.toml
# Needed so the env created by poetry is saved after the build phase. Don't know of another way
RUN poetry config virtualenvs.create false \
    && python -m venv venv \
    && . venv/bin/activate \
    && poetry install --without dev


FROM base AS frontend_deps
WORKDIR /app/front_end/

ADD front_end/package*.json .
ENV NODE_ENV=production
RUN npm ci


FROM base AS final_env
WORKDIR /app

# This is done to copy only the source code from HEAD into the image to avoid a COPY . and managing a long .dockerignore
RUN --mount=type=bind,source=.git/,target=/tmp/app/.git/ \
git clone /tmp/app/.git/ /app/

# Copy the backkend and frontend deps
COPY --from=backend_deps /app/venv /app/venv
COPY --from=frontend_deps /app/front_end/node_modules /app/front_end/node_modules

ENV NODE_ENV=production
RUN --mount=type=secret,id=frontend_env,target=/app/front_end/.env cd front_end && npm run build

RUN source venv/bin/activate && ./manage.py collectstatic --noinput

ENV PORT=3000
EXPOSE 3000

FROM final_env AS release
CMD ["sh", "-c", "scripts/prod/release.sh"]

FROM final_env AS web
CMD ["sh", "-c", "scripts/prod/startapp.sh"]

FROM final_env AS django_cron
CMD ["sh", "-c", "scripts/prod/django_cron.sh"]

FROM final_env AS dramatiq_worker
CMD ["sh", "-c", "scripts/prod/run_dramatiq.sh"]