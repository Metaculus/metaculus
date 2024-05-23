## Install instructions

`poetry install`

**Database:**
Use a postgres database called `metac_rw`

## Run instructions
**Backend:**
`poetry run python manage.py`

**Frontend:**
TBD

### Schemas for graphs:

**Binary**
```
{
    "timestamps": [
        13140214,
        13140514,
        13143516,
    ],
    "values_mean": [
        0.4,
        0.5,
        0.44,
    ],
    "values_max": [
        0.5,
        0.55,
        0.5,
    ],
    "values_min": [
        0.4,
        0.3,
        0.42,
    ],
    "nr_forecasters": [
        1,
        5,
        20
    ]
}
```

**Numeric Ramge**
```
{
    "timestamps": [
        13140214,
        13140514,
        13143516,
    ],
    "values_mean": [
        104,
        105,
        104.4,
    ],
    "values_max": [
        120,
        130,
        110,
    ],
    "values_min": [
        80,
        102,
        105,
    ],
    "nr_forecasters": [
        1,
        5,
        20
    ]
}
```

**Multiple Choice**

```
{
    "timestamps": [
        13140214,
        13140514,
        13143516,
    ],
    "values_choice_1": [
        0.4,
        0.5,
        0.44,
    ],
    "values_choice_2": [
        0.1,
        0.05,
        0.5,
    ],
    "values_choice_3": [
        0.5,
        0.4,
        0.06,
    ],
    "nr_forecasters": [
        1,
        5,
        20
    ]
}
```

**Date Range**
Same as numeric range but values are interpreted as unix timesamps


**Question groups**
This is just going to be the schemas above but an array thereof for each question and the graphs will be different


### Migration of the old database
1. Configure old db connection using `OLD_DATABASE_URL` env var 
2. Run `python manage.py migrate_old_db`