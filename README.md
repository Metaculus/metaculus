![Metaculus logo-blue on transparent](https://github.com/user-attachments/assets/70edc5dd-f334-4d56-91a3-82b117572c30)

This is the codebase for the open source [Metaculus website](https://metaculus.com).
This readme is a work in progress. Feel free to suggest edits or [open an issue](https://github.com/Metaculus/metaculus/issues) if you have any questions.


# Contributing

**If you make a meaningful contribution to the Metaculus codebase, e.g. [solving an issue](https://github.com/Metaculus/metaculus/issues?q=is%3Aissue+is%3Aopen+label%3ASimple) we'll send you a Metaculus hoodie (please email the shipping address to christian@metaculus.com)**

If you want to contribute, set up a local development environment using the instructions below. [Create an issue](https://github.com/Metaculus/metaculus/issues) if you are having problems doing so.

We curate a [list of issues suitable for newcomers](https://github.com/Metaculus/metaculus/issues?q=is%3Aissue+is%3Aopen+label%3ASimple). It's a great place to start.

Feel free to suggest your own changes and ideas as an issue. We'll discuss it and help you get started on implementing it.

# Setup

To run this project locally, you'll need python, poetry, django, postgres, redis, and npm/node. This will be a 
quick rundown of the setup process.
(Note: all commands written for a unix bash shell)

If you're on a Mac, we recommend using [Homebrew](https://brew.sh/) as your package manager.

## .env file
Create a `.env` file in the front_end directory of the project by copying the `.env.example` file.
This will hold all of the environment variables that are used by the project. For example, adding `DEBUG=true` will give you access to the django debug toolbar in browser.

**Optional:** Set `APP_DOMAIN` to restrict Nginx access to a specific domain (e.g., `APP_DOMAIN=www.metaculus.com`). Localhost (127.0.0.1) is always allowed. If unset, all hosts are allowed.

## Database
Install Postgres - your database manager:
>`sudo apt install postgresql`

If on Mac, you can instead do
>`brew install postgresql`

Create a database:
You'll need to create a database for the data. The default name will be `metaculus` which is how it is referenced throughout this codebase, but if you name yours differently you may have to change some commands and a few instances within files. (TODO: list locations in codebase to change)
```bash
sudo -u postgres psql # start up postgres
```
If on Mac, you can instead do `brew services start postgresql` to start up postgres.

If this doesn't put you into a postgres shell, use `psql postgres`.

Then in the postgres shell:
```sql
CREATE DATABASE metaculus;
```
You may have to give metaculus a superuser as an owner, which if not done automatically you can do with:
```sql
CREATE USER postgres WITH SUPERUSER;
ALTER USER postgres WITH PASSWORD 'postgres';
ALTER DATABASE metaculus OWNER TO postgres;
```
Note: to leave psql, type `\q`.

Next, add the database name to your `.env` file:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/metaculus
```
You may have to start postgresql manually when starting your server. You can do this by running `sudo service postgresql start`

The last step in getting your database ready is adding the [pgvector](https://github.com/pgvector/pgvector) database extension:
**Note:** Replace 16 with your Postgres server version
```bash
sudo apt install postgresql-16-pgvector
```

If on a Mac and using a [supported postgres version](https://github.com/pgvector/pgvector#homebrew), you can use `brew install pgvector`. Oherwise:

>1. `git clone https://github.com/pgvector/pgvector.git`
>2. `cd pgvector`
>3. Find out your `pg_config` path\
>A few common paths on Mac are:
>   - EDB installer: `/Library/PostgreSQL/16/bin/pg_config`
>   - Homebrew (arm64): `/opt/homebrew/opt/postgresql@16/bin/pg_config`
>   - Homebrew (x86-64): `/usr/local/opt/postgresql@16/bin/pg_config`\
>**Note:** Replace 16 with your Postgres server version
>4. `export PG_CONFIG=path/to/pg_config`
>5. `make`
>6. `make install`
>Other installations and detailed instructions - https://github.com/pgvector/pgvector

Then enable the extension by running the following in your Postgres shell:
```sql
CREATE EXTENSION vector;
```

## Redis
You'll need redis for caching and some background tasks.
Install redis:
```bash
sudo apt install redis-server
```
You can start redis with `sudo service redis-server start`
That should be it for redis.

If on Mac, you can instead do `brew install redis` to install redis, and `brew services start redis` to start redis.

## Pyenv, Poetry, and Python & Dependencies
You'll need to install python version 3.12.3 (or higher), and we use poetry for dependency management.
We recommend using pyenv to manage python versions.
Install pyenv:
```bash
curl https://pyenv.run | bash
```

Or `brew install pyenv` on Mac.

Then, install python 3.12.3:
```bash
pyenv install 3.12.3
pyenv global 3.12.3
```
Install poetry:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```
And follow any install directions it gives you. (You may need to reload your shell afterwards.) If all is installed properly, you should be able to run `poetry --version`.
It is also useful to know that you can run `poetry env use 3.12.3` to switch to a specific python version. And to use `poetry shell` to enter a poetry shell so you won't have to prefix all of the python commands with `poetry run`.

With that, you should be good to start installing the python dependencies.
```bash
poetry install
```

## Nvm/Node & Frontend
You'll need node to build the frontend. We use nvm for managing node versions.
Install nvm with:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```
Then, install node 18.18.0:
```bash
nvm install 18.18.0
nvm use 18.18.0
```
To install the frontend dependencies, run:
```bash
cd front_end
npm install
```
Note: you have to switch to the front_end directory to run the npm commands as they are all nested there.

## Running the server
The first time you're booting up the server, make sure postgres is running (`sudo service postgresql start`), then you'll need to run the migrations and collect static files. Start by navigating to the root directory.
Running migrations:
```bash
poetry run python manage.py migrate
```
Collecting static files:
```bash
poetry run python manage.py collectstatic
```
Then you can run the server with:
```bash
poetry run python manage.py runserver
```

## Running the frontend
Running the front end is pretty easy. Note that you'll have to navigate to the `front_end` directory first.
```bash
cd front_end
npm run dev
```

## Running the task broker
We use dramatiq for our task broker. To run it, you'll need to run the following command:
```bash
poetry run python manage.py rundramatiq
```
This will handle asynchronous tasks such as scoring questions, evaluating metrics like "movement", and processing notifications.


# Misc
Here are some other useful things to know about

## MJML Email Templates

We use **MJML** to generate HTML emails. To edit email templates, you'll work with MJML files. Follow these steps to
ensure the HTML updates automatically after changes:

1. **Install MJML Dependencies**\
   Use the following command to globally install MJML and related dependencies:
   ```bash
   npm install -g mjml mjml-column
	```
2. **Compose MJML Templates**\
   Run the following command to process and update the MJML templates:

   ```bash
   poetry run python manage.py mjml_compose
   ```

## Setup a test database
If you want to populate your database with some example data, you can load our testing database dump (available as a [release](https://github.com/Metaculus/metaculus/releases/latest) artifact).
```
wget https://github.com/Metaculus/metaculus/releases/tag/v0.0.1-alpha/test_metaculus.sql.zip
unzip test_metaculus.sql.zip
pg_restore -d metaculus test_metaculus.sql
```
If on Mac, you can replace the wget command with 
```
curl -O https://github.com/Metaculus/metaculus/releases/tag/v0.0.1-alpha/test_metaculus.sql.zip
```

Then run migrations to make sure the database is up to date:
```bash
poetry run python manage.py migrate
```

## Testing
To run the backend tests, you can run:
```bash
poetry run pytest
```
If you get an error that the playwright executable doesn't exist, run `poetry run python -m playwright install`.


(TODO: add front end testing)
When contributing to the project, adding tests is highly encouraged and will increase the likelihood of your PR being merged.

## Linting
We use Husky to run linter and typescript checks before committing (see `front_end/.husky`).

## Restricted Dev Access
To enable restricted Dev access, you need to add `ALPHA_ACCESS_TOKEN=<token>` as an env variable for both the BE and the FE (both the FE server & the env where the FE is compiled, which should be the same in most cases)


## Email
We use Django Anymail to integrate various email providers through a single library, simplifying our email management
By default, we use the Mailgun provider.

`.env` Configuration:
- `MAILGUN_API_KEY`
- `EMAIL_HOST_USER`
- `EMAIL_NOTIFICATIONS_USER`


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
	- i.e. it would affect most users and leak significant amounts of information—or give a lot of control to the attacker. 
	- e.g. you can inspect the HTML of user profile pages and see the user's password in plain text

Bounty payouts: 
- Vulnerabilities that are hard to exploit and limited in scope: $200
- Vulnerabilities that are hard to exploit, but broad in scope—or that are limited in scope, but easy to exploit: $400
- Vulnerabilities that are easy to exploit and broad in scope: $2000

Please email all such vulnerabilities to: `support [at] metaculus [.com]` with the subject `Security Vulnerability`

Note: This bug bounty system begins September 10th, 2024. Before that point we will still award $100 for security vulnerabilities, but we expect an internal audit to catch most of these.

Note: The first reporter receives the bounty. If multiple reports occur within a few minutes of each other, the prize will be split.

Note: Making the exploit public will annul the bounty.
