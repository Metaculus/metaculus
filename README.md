# Metaculus Rewrite

This is a very hectic work in progress, please do not expect things to make perfect sense until around June the 1st!

## Setup Backend
### Install
`poetry install`

### Migration of the old database
1. Create a postgres database called `metaculus`
2. Configure old db connection using `OLD_DATABASE_URL` env var to wherever you have your old metaculus database
3. Run `poetry run python manage.py migrate_old_db`


### Run
`poetry run python manage.py`

## Setup Frontend

### Install
Ensure to add `FONTAWESOME_PACKAGE_TOKEN=245F362C-B32D-4005-A655-4C47836E8068` to the environment variables.

```bash
cd front_end && npm install
```

### Run
```bash
cd front_end && npm run dev
```
