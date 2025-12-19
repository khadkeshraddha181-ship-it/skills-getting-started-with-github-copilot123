import sys
from pathlib import Path

# Ensure src is importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from fastapi.testclient import TestClient
from app import app, activities

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # basic sanity: known activity present
    assert "Soccer Team" in data


def test_signup_and_unregister_flow():
    activity = "Programming Class"
    email = "testuser+signup@example.com"

    # ensure clean start
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # signup
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    assert f"Signed up {email}" in res.json()["message"]

    # verify present in listing
    res2 = client.get("/activities")
    assert res2.status_code == 200
    assert email in res2.json()[activity]["participants"]

    # unregister
    res3 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert res3.status_code == 200
    assert f"Removed {email}" in res3.json()["message"]

    # verify removal
    res4 = client.get("/activities")
    assert res4.status_code == 200
    assert email not in res4.json()[activity]["participants"]
