import logging
from multiprocessing import Pool, Manager
from typing import Callable

import django

logger = logging.getLogger(__name__)


def parallel_command_executor(
    items: list, handler: Callable[[list, int], None], num_processes: int = 1
):
    total = len(items)
    chunk_size = total // num_processes

    if not chunk_size:
        return

    # Split post_ids into chunks for each process
    item_chunks = [items[i : i + chunk_size] for i in range(0, total, chunk_size)]

    with Manager() as manager:
        with Pool(processes=num_processes, initializer=django.setup) as pool:
            pool.starmap(
                handler,
                [(chunk, worker_idx) for worker_idx, chunk in enumerate(item_chunks)],
            )
