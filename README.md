# Metaculus Rewrite

This is a very hectic work in progress, please do not expect things to make perfect sense until around June the 1st!

## Setup Backend
### Install
`poetry install`

### Install pgvector database extension
1. Install pgvector: https://github.com/pgvector/pgvector
2. Connect to the psql and enable psql extension: `CREATE EXTENSION vector;`

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

## Restricted dev access
To enable restricted Dev access, you need to add `ALPHA_ACCESS_TOKEN=<token>` to the bot BE & FE env variables.
Then, be will validate all requests using `x-alpha-auth-token` from request headers