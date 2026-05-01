import os
import json
import pytest
from sqlalchemy import create_engine, text

# Must precede api.main import — engine is a module-level singleton
os.environ["DATABASE_URL"] = "postgresql://admin:password123@localhost:5432/evaluation_test_db"

from fastapi.testclient import TestClient  # noqa: E402
import api.main as main_module             # noqa: E402
from api.main import app, engine, _DDL     # noqa: E402

SAMPLE_DATA = [
    {
        "interview_detail_id": 477,
        "interviewee_name": "Alice Smith",
        "job_name": "Jr. BI Analyst",
        "interviewer_name": "Bob Jones",
        "resume_local_path": "",
        "resume_file_path": "",
        "job_id": "jd_001",
    },
    {
        "interview_detail_id": 476,
        "interviewee_name": "Carlos Rivera",
        "job_name": "Sr Data Engineer",
        "interviewer_name": "Dana Lee",
        "resume_local_path": "",
        "resume_file_path": "",
        "job_id": "jd_002",
    },
    {
        # Not in allowed_ids — must be filtered out by load_all()
        "interview_detail_id": 999,
        "interviewee_name": "Excluded Candidate",
        "job_name": "Unknown Job",
        "interviewer_name": "",
        "resume_local_path": "",
        "resume_file_path": "",
        "job_id": "",
    },
]


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create evaluation_test_db and all star-schema tables once per session."""
    base = "postgresql://admin:password123@localhost:5432"
    admin_engine = create_engine(f"{base}/postgres", isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = 'evaluation_test_db'")
        ).fetchone()
        if not exists:
            conn.execute(text("CREATE DATABASE evaluation_test_db"))
    admin_engine.dispose()

    with engine.begin() as conn:
        for stmt in _DDL:
            conn.execute(stmt)


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all tables after every test to keep tests isolated."""
    yield
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM feedback"))
        conn.execute(text("DELETE FROM scores"))
        conn.execute(text("DELETE FROM evaluations"))
        conn.execute(text("DELETE FROM candidates"))


@pytest.fixture
def client(tmp_path, monkeypatch):
    """TestClient backed by a temp data file containing SAMPLE_DATA."""
    data_file = tmp_path / "test_data.json"
    data_file.write_text(json.dumps(SAMPLE_DATA))
    monkeypatch.setattr(main_module, "DATA_FILE", data_file)
    with TestClient(app) as c:
        yield c
