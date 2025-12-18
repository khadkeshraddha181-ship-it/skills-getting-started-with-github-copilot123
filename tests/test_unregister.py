import sys
from pathlib import Path

# Ensure src is importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from app import app, activities
from fastapi.testclient import TestClient

client = TestClient(app)


def test_unregister_existing_participant():
    # Ensure the participant is present to start
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    assert email in activities[activity_name]["participants"]

    res = client.delete(f"/activities/{activity_name}/signup?email={email}")

    assert res.status_code == 200
    assert f"Removed {email}" in res.json()["message"]
    assert email not in activities[activity_name]["participants"]


def test_unregister_nonexistent_participant():
    activity_name = "Chess Club"
    email = "nonexistent@example.com"

    res = client.delete(f"/activities/{activity_name}/signup?email={email}")

    assert res.status_code == 404
    assert res.json()["detail"] == "Participant not found"
