from itertools import chain
from typing import Iterable


def flatten(lst: Iterable[Iterable]) -> list:
    return list(chain.from_iterable(lst))
