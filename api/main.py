from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import json
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from api.rubrics_content import RUBRICS

BASE_DIR = Path(__file__).parent.parent  # evaluation/
load_dotenv(BASE_DIR / ".env")

DATA_FILE = BASE_DIR / os.getenv("DATA_FILE", "data/result_v2.json")
ANNOTATIONS_DIR = BASE_DIR / "annotations"
ANNOTATIONS_DIR.mkdir(exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


app = FastAPI(title="IA Evaluation API")


@app.on_event("startup")
def startup_event():
    create_table_query = text("""
        CREATE TABLE IF NOT EXISTS evaluation_annotations (
            email VARCHAR(255) NOT NULL,
            dataset_idx INTEGER NOT NULL,
            data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (email, dataset_idx)
        );
    """)
    try:
        with engine.begin() as conn:
            conn.execute(create_table_query)
        print("Database initialized: evaluation_annotations table ready.")
    except Exception as e:
        print(f"Failed to initialize database table: {e}")


@app.middleware("http")
async def no_cache_static(request: Request, call_next):
    response = await call_next(request)
    # Prevent browser from caching JS/CSS so code changes take effect immediately
    if not request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/rubrics")
def get_rubrics():
    return RUBRICS


# ── helpers ───────────────────────────────────────────────────────────────────


def load_all() -> list[dict]:
    with open(DATA_FILE) as f:
        data = json.load(f)
    # Hardcoded allowed IDs for production deployment
    allowed_ids = [477, 476, 480, 458, 378]
    return [r for r in data if r.get("interview_detail_id") in allowed_ids]


def resolve_pdf(record: dict) -> Path | None:
    # Try resume_local_path relative to test/dataset/
    local = record.get("resume_local_path", "")
    if local:
        p = BASE_DIR.parent / local  # test/dataset/ + relative path
        if p.exists():
            return p
        p = Path(local)  # try as absolute
        if p.exists():
            return p
    # Try resume_file_path relative to data/ml_eval_data/data/
    rel = record.get("resume_file_path", "")
    if rel:
        p = BASE_DIR / "data" / "ml_eval_data" / "data" / rel
        if p.exists():
            return p
    return None
    

def resolve_jd_pdf(record: dict) -> Path | None:
    # Example logic: Look for PDF named by job_id in data/jds/
    job_id = record.get("job_id")
    if job_id:
        p = BASE_DIR / "data" / "jds" / f"{job_id}.pdf"
        if p.exists():
            return p
    return None


# ── dataset routes ─────────────────────────────────────────────────────────────


@app.get("/api/datasets")
def list_datasets():
    data = load_all()
    return [
        {
            "index": i,
            "candidate_name": r.get("interviewee_name") or f"Candidate {i + 1}",
            "job_name": r.get("job_name", "Unknown Job"),
            "interviewer_name": r.get("interviewer_name", ""),
            "interview_detail_id": r.get("interview_detail_id", ""),
            "pdf_available": resolve_pdf(r) is not None,
        }
        for i, r in enumerate(data)
    ]


@app.get("/api/datasets/{idx}")
def get_dataset(idx: int):
    data = load_all()
    if not (0 <= idx < len(data)):
        raise HTTPException(404, "Dataset not found")
    record = data[idx]
    pdf_path = resolve_pdf(record)
    return {
        **record,
        "pdf_available": pdf_path is not None,
        "pdf_url": f"/api/datasets/{idx}/pdf" if pdf_path else None,
    }


@app.get("/api/datasets/{idx}/pdf")
def stream_pdf(idx: int):
    data = load_all()
    if not (0 <= idx < len(data)):
        raise HTTPException(404, "Dataset not found")
    pdf_path = resolve_pdf(data[idx])
    if not pdf_path:
        raise HTTPException(404, "PDF not found")
    return FileResponse(str(pdf_path), media_type="application/pdf")


@app.get("/api/datasets/{idx}/jd-pdf")
def stream_jd_pdf(idx: int):
    data = load_all()
    if not (0 <= idx < len(data)):
        raise HTTPException(404, "Dataset not found")
    pdf_path = resolve_jd_pdf(data[idx])
    if not pdf_path:
        # Provide a more descriptive error to help debugging
        job_id = data[idx].get('job_id')
        raise HTTPException(status_code=404, detail=f"JD PDF not found for Job ID {job_id}. Looked in data/jds/{job_id}.pdf")
    return FileResponse(str(pdf_path), media_type="application/pdf")


# ── annotation routes ──────────────────────────────────────────────────────────


# @app.get("/api/annotations/{idx}")
# def get_annotations(idx: int):
#     f = ANNOTATIONS_DIR / f"{idx}.json"
#     if not f.exists():
#         return {}
#     with open(f) as fp:
#         return json.load(fp)


# @app.post("/api/annotations/{idx}")
# async def save_annotations(idx: int, request: Request):
#     body = await request.json()
#     f = ANNOTATIONS_DIR / f"{idx}.json"
#     with open(f, "w") as fp:
#         json.dump(body, fp, indent=2)
#     return {"ok": True}


@app.get("/api/annotations/{idx}")
def get_annotations(idx: int, email: str):
    """
    Fetch saved progress for a specific user and candidate.
    """
    query = text(
        "SELECT data FROM evaluation_annotations WHERE email = :email AND dataset_idx = :idx"
    )
    try:
        with engine.connect() as conn:
            row = conn.execute(query, {"email": email, "idx": idx}).fetchone()
        
        if row:
            data_raw = row[0]
            if isinstance(data_raw, str):
                return json.loads(data_raw)
            return data_raw
    except Exception as e:
        print(f"Database error in get_annotations: {e}")
        
    return {}


@app.post("/api/annotations/{idx}")
async def save_annotations(idx: int, request: Request):
    """Save/Update the progress for a specific user."""
    body = await request.json()
    email = body.get("email")
    ann_data = body.get("data")

    if not email:
        raise HTTPException(status_code=400, detail="User email missing")

    # This 'UPSERT' logic inserts new data or updates existing data if it exists
    upsert_query = text(
        """
        INSERT INTO evaluation_annotations (email, dataset_idx, data, updated_at)
        VALUES (:email, :idx, :data, NOW())
        ON CONFLICT (email, dataset_idx) 
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
    """
    )

    with engine.begin() as conn:
        conn.execute(
            upsert_query, {"email": email, "idx": idx, "data": json.dumps(ann_data)}
        )

    return {"ok": True}


@app.delete("/api/annotations/{idx}")
def reset_annotations(idx: int, email: str):
    """Delete the saved progress for a user and candidate."""
    query = text(
        "DELETE FROM evaluation_annotations WHERE email = :email AND dataset_idx = :idx"
    )
    try:
        with engine.begin() as conn:
            conn.execute(query, {"email": email, "idx": idx})
        return {"ok": True}
    except Exception as e:
        print(f"Database error in reset_annotations: {e}")
        raise HTTPException(status_code=500, detail="Could not reset evaluations")


# ── static files (must be last) ───────────────────────────────────────────────
app.mount("/", StaticFiles(directory=str(BASE_DIR / "web"), html=True), name="web")
