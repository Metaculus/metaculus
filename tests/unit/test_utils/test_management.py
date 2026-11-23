import os

from utils.management import parallel_command_executor

handler_calls = []


def _record_call(items, worker_idx):
    handler_calls.append((os.getpid(), list(items), worker_idx))


def test_parallel_command_executor_single_process_runs_in_caller_process():
    handler_calls.clear()

    parallel_command_executor([1, 2, 3], _record_call, num_processes=1)

    assert handler_calls == [(os.getpid(), [1, 2, 3], 0)]
    assert [type(item) for item in handler_calls[0][1]] == [int, int, int]


def test_parallel_command_executor_single_process_skips_empty_items():
    handler_calls.clear()

    parallel_command_executor([], _record_call, num_processes=1)

    assert handler_calls == []
