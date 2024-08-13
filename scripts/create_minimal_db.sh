#! /bin/bash
set -x
set -e

DB_NAME=test_metaculus
DB_URL=postgres://postgres:postgres@localhost:5432/$DB_NAME

poetry run ./manage.py create_minimal_db_subset --new_db_name $DB_NAME --drop_table

pg_dump -O -f $DB_NAME.sql $DB_URL

zip $DB_NAME.sql.zip $DB_NAME.sql
