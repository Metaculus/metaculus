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
