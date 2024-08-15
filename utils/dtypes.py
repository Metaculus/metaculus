from dataclasses import is_dataclass, fields
from itertools import chain
from typing import Iterable, get_type_hints


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


def dataclass_from_dict(cls, data: dict):
    """
    Convert a dictionary into a dataclass, including nested dataclasses
    """
    if not is_dataclass(cls):
        raise ValueError(f"{cls} is not a dataclass")

    kwargs = {}
    type_hints = get_type_hints(cls)

    for field in fields(cls):
        field_value = data.get(field.name)
        field_type = type_hints.get(field.name)

        if is_dataclass(field_type) and isinstance(field_value, dict):
            # Recursively convert nested dataclass
            kwargs[field.name] = dataclass_from_dict(field_type, field_value)
        elif (
            isinstance(field_value, list)
            and hasattr(field_type, "__origin__")
            and field_type.__origin__ is list
        ):
            # Handle lists of dataclasses
            list_type = field_type.__args__[0]
            if is_dataclass(list_type):
                kwargs[field.name] = [
                    (
                        dataclass_from_dict(list_type, item)
                        if isinstance(item, dict)
                        else item
                    )
                    for item in field_value
                ]
            else:
                kwargs[field.name] = field_value
        else:
            kwargs[field.name] = field_value

    return cls(**kwargs)
