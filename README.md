![Metaculus logo-blue on transparent](https://github.com/user-attachments/assets/70edc5dd-f334-4d56-91a3-82b117572c30)

This is the codebase for the rewritten main [Metaculus website](https://metaculus.com), it's expected to be live in October.


# Contributing

**If you make a meaningful contribution to the Metaculus codebase, e.g. [solving an issue](https://github.com/Metaculus/metaculus/issues?q=is%3Aissue+is%3Aopen+label%3ASimple) we'll gift you a Metaculus hoodie (please email the shipping address to christian@metaculus.com)**

If you wish to contribute try to set up a local development environment using the instructions below, and [create an issue](https://github.com/Metaculus/metaculus/issues) if you are having problems doing so.

We curate a [list of issues suitable for newcomers](https://github.com/Metaculus/metaculus/issues?q=is%3Aissue+is%3Aopen+label%3ASimple), it's a great starting point.

Feel free to suggest your own changes and ideas as an issue, we'll discuss it and help you get started on implementing it.

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

# Bug Bounty

Our bug bounty system classifies vulnerabilities as one of the following:
- hard to exploit 
	- i.e. it would take hundreds of hours of expensive compute and luck
	- e.g. doing a DDOS attack and repeatedly accessing a specific endpoint leads to an error log being returned by the endpoint. In 1/100 cases that log might contain a user password. 

- easy to exploit 
	- i.e. it can be done reliably and in a short amount of time
	- e.g. the user admin with password admin can access the admin panel

- limited in scope 
	- i.e. it would have only minimal effects on privacy/security
	- e.g. you can see private first and last name data from all users that have created tournaments 

- broad in scope 
	- i.e. it would affect most users and leak significant amounts information—or give a lot of control to the attacker. 
	- e.g. you can inspect the HTML of user profile pages and see the user's password in plain text

Bounty payouts: 
- Vulnerabilities that are hard to exploit and limited in scope: $200
- Vulnerabilities that are hard to exploit, but broad in scope—or that are limited in scope, but easy to exploit: $400
- Vulnerabilities that are easy to exploit and broad in scope: $2000

Please email all such vulnerabilities to: engineering@metaculus.com with the subject `Security Vulnerability`

Note: This bug bounty system begins September 10th, 2024. Before that point we will still award $100 for security vulnerabilities, but we expect an internal audit to catch most of these.

Note: The first reporter receives the bounty. If multiple reports occur within a few minutes of each other, the prize will be split.

Note: Making the exploit public will annul the bounty.
