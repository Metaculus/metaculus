# Based on this image:
# https://github.com/microsoft/playwright-python/blob/main/utils/docker/Dockerfile.focal

FROM ubuntu:focal
ARG TZ=Etc/GMT
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y curl  make build-essential libssl-dev zlib1g-dev libbz2-dev \
    libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
    xz-utils tk-dev libffi-dev liblzma-dev python-openssl git vim

RUN  adduser --disabled-password --gecos "" pwuser

# pyenv is needed to have the precise version of python installed, as that's fixed in the
# pyproject.toml file.
RUN curl https://pyenv.run | bash && \
    chmod -R 777 "/root/.pyenv/bin"

ENV PATH="/root/.pyenv/bin/:/root/.local/bin/:/root/.pyenv/shims/:${PATH}"

RUN pyenv install 3.12.3 && pyenv global 3.12.3

RUN chmod -R 777 "/root/.pyenv/shims"

RUN curl -sSL https://install.python-poetry.org | python - && \
    chmod -R 777 "/root/.local/bin"

WORKDIR /app

COPY pyproject.toml poetry.lock ./

ENV PLAYWRIGHT_BROWSERS_PATH=/playwright-browsers/

RUN poetry config virtualenvs.create false && \
    python -m venv venv && \
    . venv/bin/activate && \
    poetry install && \
    poetry run playwright install chromium --with-deps

RUN chmod -R 777 $PLAYWRIGHT_BROWSERS_PATH && \
    chmod -R 777 /app/venv/bin

# Install Herokuy CLI, as it will be needed to renew the certificates for this service
#RUN curl https://cli-assets.heroku.com/install.sh | sh
RUN curl https://cli-assets.heroku.com/install-ubuntu.sh | sh && \
    rm -rf /var/lib/apt/lists/*

# This is not respected by Heroku, only used for local testing
# https://devcenter.heroku.com/articles/container-registry-and-runtime#dockerfile-commands-and-runtime
ENV PORT=9000
EXPOSE 9000

COPY app.py start.sh ./

CMD ["/app/start.sh"]