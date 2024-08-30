![Metaculus logo-blue on transparent](https://github.com/user-attachments/assets/70edc5dd-f334-4d56-91a3-82b117572c30)

This is the codebase for the rewritten main [Metaculus website](https://metaculus.com), it's expected to be live by the start of September.

[Feel free to suggest changes and report bugs](https://github.com/Metaculus/metaculus/issues)

# Setup dev env.

### 0. Setup environment
- Install Postgres
- Install redis
- Install poetry and python 3.12
- Install node
- Install [pgvector](https://github.com/pgvector/pgvector) database extension

### 1. Setup Backend
`poetry install`
(optional) `poetry run python manage.py mjml_compose`

### 2. Setup test database
Create a database called `metaculus` and then load our testing database dump (available as a [release](https://github.com/Metaculus/metaculus/releases/latest) artefact)
```
wget https://github.com/Metaculus/metaculus/releases/latest/download/test_metaculus.sql.zip
unzip test_metaculus.sql.zip
psql -d $DATABASE_URL < test_metaculus.sql
```
(where DATABASE_URL should be of this format: `postgres://postgres:postgres@localhost:5432/test_metaculus`).

and then:

`poetry run python3 manage.py migrate`


### 3. Setup Frontend
`cd front_end && npm install`
`cd front_end && npm run dev`

### 4. Cache & Async Tasks
`python manage.py rundramatiq`

### 5. Run tests
`@TODO`


## Misc
- We use Husky to run linter and typescript checks before committing (see `front_end/.husky`).
- To enable restricted Dev access, you need to add `ALPHA_ACCESS_TOKEN=<token>` as an env variable for both the BE and the FE (both the FE server & the env where the FE is compiled, which should be the same in most cases)


### Email
We use Django Anymail to integrate various email providers through a single library, simplifying our email management
By default, we use the Mailgun provider.

Env Configuration:
- `MAILGUN_API_KEY`
- `EMAIL_HOST_USER`

### How to install PG vectors

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
