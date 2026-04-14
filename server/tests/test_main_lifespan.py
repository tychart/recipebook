import asyncio

from fastapi import FastAPI

import main


def test_lifespan_initializes_and_tears_down_runtime_state(monkeypatch):
    events: list[object] = []

    class FakeStorageService:
        def ensure_bucket_exists(self):
            events.append("ensure_bucket_exists")

    async def fake_init_pool():
        events.append("init_pool")

    async def fake_close_pool():
        events.append("close_pool")

    def fake_create_recipe_import_client(settings):
        events.append("create_recipe_import_client")
        return object()

    def fake_start_job_workers(manager, generate_service, worker_count):
        events.append(("start_workers", worker_count))
        return ["worker-task"]

    async def fake_stop_job_workers(tasks):
        events.append(("stop_workers", list(tasks)))

    def fake_start_scheduler(interval_seconds, callback):
        events.append(("start_scheduler", interval_seconds))
        return "scheduler-task"

    async def fake_stop_scheduler(task):
        events.append(("stop_scheduler", task))

    monkeypatch.setattr(main, "get_storage_service", lambda: FakeStorageService())
    monkeypatch.setattr(main, "init_pool", fake_init_pool)
    monkeypatch.setattr(main, "close_pool", fake_close_pool)
    monkeypatch.setattr(main, "create_recipe_import_client", fake_create_recipe_import_client)
    monkeypatch.setattr(main, "start_job_workers", fake_start_job_workers)
    monkeypatch.setattr(main, "stop_job_workers", fake_stop_job_workers)
    monkeypatch.setattr(main, "start_scheduler", fake_start_scheduler)
    monkeypatch.setattr(main, "stop_scheduler", fake_stop_scheduler)

    app = FastAPI(lifespan=main.lifespan)

    async def run():
        async with main.lifespan(app):
            assert hasattr(app.state, "job_manager")
            assert hasattr(app.state, "recipe_import_client")

    asyncio.run(run())

    assert "ensure_bucket_exists" in events
    assert "init_pool" in events
    assert ("stop_scheduler", "scheduler-task") in events
    assert ("stop_workers", ["worker-task"]) in events
    assert "close_pool" in events
