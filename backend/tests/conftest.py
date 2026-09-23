import os
import pytest
import requests

BASE_URL = "https://elaya-role-dispatch.preview.emergentagent.com"

ADMIN = {"email": "admin@elaya.ph", "password": "Admin123!"}
OWNER = {"email": "owner@elaya.ph", "password": "Owner123!"}
OWNER2 = {"email": "owner2@elaya.ph", "password": "Owner123!"}
CUSTOMER = {"email": "customer@elaya.ph", "password": "Customer123!"}


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(api_client, creds):
    r = api_client.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"Login failed for {creds['email']}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def admin_auth(api_client):
    return _login(api_client, ADMIN)


@pytest.fixture(scope="session")
def owner_auth(api_client):
    return _login(api_client, OWNER)


@pytest.fixture(scope="session")
def owner2_auth(api_client):
    return _login(api_client, OWNER2)


@pytest.fixture(scope="session")
def customer_auth(api_client):
    return _login(api_client, CUSTOMER)


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
