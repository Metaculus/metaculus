FROM node:20.11.1-bookworm AS base

RUN apt update && apt install -y \
    python3 \
    python3-pip \
    bash \
    curl \
    git \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    wget \
    curl \
    llvm \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libffi-dev \
    python3-dev \
    liblzma-dev \
    vim \
    chromium


RUN npx -y playwright@1.46.1 install --with-deps

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
COPY . /app/
COPY --from=backend_deps /app/venv /app/venv
COPY --from=frontend_deps /app/front_end/node_modules /app/front_end/node_modules

ENV NODE_ENV=production
RUN --mount=type=secret,id=frontend_env,target=/app/front_end/.env cd front_end && npm run build

SHELL ["/bin/bash", "-c"]
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