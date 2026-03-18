import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv


load_dotenv(Path("/app/frontend/.env"))


@pytest.fixture(scope="session")
def base_url() -> str:
    # Base public URL used by Expo/mobile preview integration tests
    url = os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    if not url:
        pytest.fail("EXPO_PUBLIC_BACKEND_URL is required in environment/frontend .env")
    return url.rstrip("/")


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    # Shared HTTP session for backend API tests
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
