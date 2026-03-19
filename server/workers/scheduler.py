import asyncio
from collections.abc import Awaitable, Callable


async def scheduler_loop(interval_seconds: int, callback: Callable[[], Awaitable[object]]) -> None:
    while True:
        await asyncio.sleep(interval_seconds)
        try:
            await callback()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            print(f"Scheduler task failed: {exc}")


def start_scheduler(interval_seconds: int, callback: Callable[[], Awaitable[object]]) -> asyncio.Task:
    return asyncio.create_task(
        scheduler_loop(interval_seconds, callback),
        name="backend-scheduler",
    )


async def stop_scheduler(task: asyncio.Task | None) -> None:
    if task is None:
        return
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)
