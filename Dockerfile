FROM python:3.12.3-slim

COPY . /app

RUN chmod +x /app/start.sh

RUN apt-get update && apt-get install -y \
    curl \
    build-essential

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
apt-get install -y nodejs

RUN curl -sSL https://install.python-poetry.org | python3 -

ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

RUN poetry install --no-root
RUN cd front_end && npm run build

# CMD ["poetry run gunicorn metaculus_web.wsgi:application --workers 8 --bind 0.0.0.0:8000"]
CMD ["/bin/bash", "/app/start.sh"]