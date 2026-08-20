"""
Progress reporting shared by the comment text archive commands.

Django's command discovery skips modules whose name starts with an
underscore, so this sits alongside the commands without becoming one.
"""

import time


def format_duration(seconds: float) -> str:
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours:
        return f"{hours}h{minutes:02d}m"
    if minutes:
        return f"{minutes}m{seconds:02d}s"

    return f"{seconds}s"


class ProgressWriter:
    """
    Prints a running one-line summary with a rate and an ETA.

    These commands process hundreds of thousands of rows over hours, so the
    point is to make a long run observable rather than to look pretty. Output
    is one line per batch, not a redrawn line, so it survives being piped to
    a log file.
    """

    def __init__(self, stdout, total: int = 0):
        self.stdout = stdout
        self.total = total
        self.started = time.monotonic()

    @property
    def elapsed(self) -> float:
        return time.monotonic() - self.started

    def write(self, line: str) -> None:
        self.stdout.write(line)
        self.stdout.flush()

    def update(self, done: int, summary: str, detail: str = "") -> None:
        elapsed = self.elapsed
        rate = done / elapsed if elapsed else 0
        percent = (done / self.total * 100) if self.total else 0
        remaining = max(self.total - done, 0)
        eta = format_duration(remaining / rate) if rate else "?"

        line = (
            f"  {done:,}/{self.total:,} ({percent:.1f}%)  {summary}  "
            f"{rate:.1f}/s  elapsed {format_duration(elapsed)}  eta {eta}"
        )

        if detail:
            line += f"  [{detail}]"

        self.write(line)
