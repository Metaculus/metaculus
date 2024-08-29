import logging
from multiprocessing import Pool, Manager
from typing import Callable

import django
import numpy as np

logger = logging.getLogger(__name__)


def parallel_command_executor(
    items: list, handler: Callable[[list, int], None], num_processes: int = 1
):
    # Split post_ids into chunks for each process
    item_chunks = [list(x) for x in np.array_split(items, num_processes) if x.size]

    with Manager():
        with Pool(processes=num_processes, initializer=django.setup) as pool:
            pool.starmap(
                handler,
                [(chunk, worker_idx) for worker_idx, chunk in enumerate(item_chunks)],
            )
