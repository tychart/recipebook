import asyncio

from services.generate_service import GenerateService
from services.job_service import JobManager


async def worker_loop(manager: JobManager, generate_service: GenerateService, worker_name: str) -> None:
    while True:
        job_id = await manager.queue.get()
        try:
            state = await manager.get_job_state(job_id)
            await manager.mark_running(job_id, f"{worker_name}: started attempt {state.attempt_count + 1}")
            result = await generate_service.process_job(state.source, state.payload)
            await manager.mark_succeeded(job_id, result, f"{worker_name}: finished")
        except asyncio.CancelledError:
            await manager.append_log(job_id, f"{worker_name}: cancelled")
            raise
        except Exception as exc:
            partial_result = getattr(exc, "partial_result", None)
            if partial_result is not None and partial_result.raw_text.strip():
                await manager.append_log(
                    job_id,
                    f"{worker_name}: captured intermediate recipe markdown before failure\n{partial_result.raw_text}",
                )
            should_retry = await manager.schedule_automatic_retry(
                job_id,
                str(exc),
                f"{worker_name}: retrying automatically",
            )
            if should_retry:
                continue
            await manager.mark_failed(
                job_id,
                str(exc),
                f"{worker_name}: failed",
                result=partial_result,
            )
        finally:
            manager.queue.task_done()


def start_job_workers(manager: JobManager, generate_service: GenerateService, worker_count: int) -> list[asyncio.Task]:
    tasks: list[asyncio.Task] = []
    for index in range(worker_count):
        task = asyncio.create_task(
            worker_loop(manager, generate_service, f"job-worker-{index + 1}"),
            name=f"job-worker-{index + 1}",
        )
        tasks.append(task)
    return tasks


async def stop_job_workers(tasks: list[asyncio.Task]) -> None:
    for task in tasks:
        task.cancel()
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
