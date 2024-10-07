from collections import defaultdict
from dataclasses import is_dataclass, fields
from itertools import chain, zip_longest
from typing import Iterable, get_type_hints, Callable
from typing import List, TypeVar


def flatten(lst: Iterable[Iterable]) -> list:
    return list(chain.from_iterable(lst))


T = TypeVar("T")
K = TypeVar("K")


def generate_map_from_list(objects: list[T], key: Callable[[T], K]) -> dict[K, list[T]]:
    """
    Generate a dictionary of lists from a given list of objects using a provided key function.

    :param objects: List of objects to be transformed into a map.
    :param key: Callable that takes an object and returns a value to be used as the dictionary key.
    :return: Dictionary where each key maps to a list of objects that correspond to that key.
    """
    result: dict[K, list[T]] = defaultdict(list)

    for obj in objects:
        result[key(obj)].append(obj)

    return dict(result)


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


U = TypeVar("U")


def evenly_distribute_items(items_per_source: List[List[U]], n: int) -> List[U]:
    """
    Evenly distribute items from multiple lists.

    :param items_per_source: List[List[U]] - A list of lists containing items of any type.
    :param n: int - The number of items to return.
    :return: List[U] - A list of items evenly distributed.
    """
    n = min(n, sum(len(lst) for lst in items_per_source))
    zipped = zip_longest(*items_per_source)
    result = [item for item in chain.from_iterable(zipped) if item is not None]
    return result[:n]
