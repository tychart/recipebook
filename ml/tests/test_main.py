import asyncio

from httpx import ASGITransport, AsyncClient

from ml.app import main


def test_health_reports_service_name():
    async def run():
        async with AsyncClient(
            transport=ASGITransport(app=main.app),
            base_url="http://testserver",
        ) as client:
            response = await client.get("/health")

        assert response.status_code == 200
        assert response.json()["service"] == "recipebook-ml"

    asyncio.run(run())


def test_ocr_route_requires_non_empty_upload():
    async def run():
        async with AsyncClient(
            transport=ASGITransport(app=main.app),
            base_url="http://testserver",
        ) as client:
            response = await client.post(
                "/ocr",
                files={"image": ("empty.png", b"", "image/png")},
            )

        assert response.status_code == 400
        assert response.json()["detail"] == "Image upload is required"

    asyncio.run(run())
