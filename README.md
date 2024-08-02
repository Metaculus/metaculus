# Metaculus Rewrite

This is a very hectic work in progress, please do not expect things to make perfect sense until around June the 1st!

## Setup Backend
### Install
`poetry install`

### Install [pgvector](https://github.com/pgvector/pgvector) database extension

#### Ubuntu
1. `sudo apt install postgresql-15-pgvector`\
**Note:** Replace 16 with your Postgres server version
2. Connect to psql and enable extension: `CREATE EXTENSION vector;`

#### MacOS
1. `git clone https://github.com/pgvector/pgvector.git`
2. `cd pgvector`
3. Find out your `pg_config` path\
A few common paths on Mac are:
   - EDB installer: `/Library/PostgreSQL/16/bin/pg_config`
   - Homebrew (arm64): `/opt/homebrew/opt/postgresql@16/bin/pg_config`
   - Homebrew (x86-64): `/usr/local/opt/postgresql@16/bin/pg_config`\
**Note:** Replace 16 with your Postgres server version
4. `export PG_CONFIG=path/to/pg_config`
5. `make`
6. `make install`
7. Connect to psql and enable extension: `CREATE EXTENSION vector;`

Other installations and detailed instructions - https://github.com/pgvector/pgvector

### Migration of the old database
1. Create a postgres database called `metaculus`
2. Configure old db connection using `OLD_DATABASE_URL` env var to wherever you have your old metaculus database
3. Run `poetry run python manage.py migrate_old_db`


### Run
`poetry run python manage.py`

## Setup Frontend

### Install

```bash
cd front_end && npm install
```

### Run
```bash
cd front_end && npm run dev
```

## Frontend pre-commit hooks

We use husky to run linter and typescript checks before commiting (see `front_end/.husky`).

If you want to skip this, you can use the `--no-verify` flag when commiting.


## Email
We use Django Anymail to integrate various email providers through a single library, simplifying our email management
By default, we use the Mailgun provider.

Env Configuration:
- `MAILGUN_API_KEY`
- `EMAIL_HOST_USER`


## Cache & Async Tasks
Start dramatiq worker:
```
python manage.py rundramatiq
``` 

Env Configuration:
- `REDIS_URL`

## Email templates
Compile MJML templates: `python manage.py mjml_compose`

## Restricted dev access
To enable restricted Dev access, you need to add `ALPHA_ACCESS_TOKEN=<token>` to the bot BE & FE env variables.
Then, be will validate all requests using `x-alpha-auth-token` from request headers