import dataclasses
from itertools import chain
from typing import Iterable


def flatten(lst: Iterable[Iterable]) -> list:
    return list(chain.from_iterable(lst))


def setdefaults_not_null(d: dict, **kwargs):
    """
    Set default non-nullable values for the dict
    Example:
        >> d = {"foo": "bar"}
        >> defaults = {"foo": None, "var1": "value", "var2": None}
        >> {"foo": "bar", "var1": "value"}
    """

    return {**{k: v for k, v in kwargs.items() if v is not None}, **d}


def dataclass_from_dict(cls: type, data):
    """
    Initializes nested dataclasses from a dict
    """

    field_types = {f.name: f.type for f in dataclasses.fields(cls)}

    return cls(
        **{
            f: (
                dataclass_from_dict(field_types[f], data[f])
                if dataclasses.is_dataclass(field_types[f])
                else data[f]
            )
            for f in data
            if f in field_types
        }
    )
