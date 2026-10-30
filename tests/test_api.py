import sys
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, "services", "api"))

import pytest
from starlette.testclient import TestClient
from app.main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

def test_auth_twitch_login():
    with TestClient(app) as client:
        response = client.get("/api/v1/auth/twitch/login")
        assert response.status_code == 200
        assert "login_url" in response.json()

def test_list_streams_and_cameras():
    with TestClient(app) as client:
        # Create a stream
        create_res = client.post("/api/v1/streams", json={
            "title": "Hackathon Demo Stream",
            "description": "Multi-POV and AI Sentinel Test",
            "max_cameras": 3
        })
        assert create_res.status_code == 200
        stream_data = create_res.json()
        stream_id = stream_data["id"]

        # Register cameras: Host and Guest
        cam1 = client.post(f"/api/v1/streams/{stream_id}/cameras", json={
            "name": "cam_host",
            "label": "Host POV",
            "source_id": "obs_host",
            "is_primary": True
        })
        assert cam1.status_code == 200

        cam2 = client.post(f"/api/v1/streams/{stream_id}/cameras", json={
            "name": "cam_guest",
            "label": "Guest POV",
            "source_id": "obs_guest",
            "is_primary": False
        })
        assert cam2.status_code == 200

        # List cameras
        list_res = client.get(f"/api/v1/streams/{stream_id}/cameras")
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 2
