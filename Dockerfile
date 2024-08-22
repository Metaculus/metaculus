FROM python:3.12.3-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    redis-server \
    nodejs \
    npm \
    curl \
    build-essential \
    libpq-dev \
    postgresql-server-dev-all \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="${PATH}:/root/.local/bin"

COPY . ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

RUN cd /app/front_end && npm ci

EXPOSE 8000 3000

ENTRYPOINT ["/app/entrypoint.sh"]
