FROM alpine:latest

RUN apk add --no-cache --update python3 py3-pip bash curl git


# Needed for installing/compiling python via pyenv (so we have the right python version)
RUN apk add --no-cache --update build-base

RUN apk add --no-cache --update openssl-dev \
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


  # This is done to copy only the source code from HEAD into the image
RUN --mount=type=bind,source=.git/,target=/tmp/app/.git/ \
    git clone /tmp/app/.git/ /app/

WORKDIR /app

# Needed so the env created by poetry is saved after the build phase. Don't know of another way
RUN poetry config virtualenvs.create false \
    && python -m venv venv \
    && . venv/bin/activate \
    && poetry install --without dev

RUN cd front_end  && npm ci

RUN source venv/bin/activate && ./manage.py collectstatic

ADD scripts/prod/entry_point.sh /app/entry_point.sh


ENV PORT 3000
EXPOSE 3000

CMD ["/app/entry_point.sh"]


