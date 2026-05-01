from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import json
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from api.rubrics_content import RUBRICS

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_FILE = BASE_DIR / os.getenv("DATA_FILE", "data/result_v2.json")
ANNOTATIONS_DIR = BASE_DIR / "annotations"
ANNOTATIONS_DIR.mkdir(exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


app = FastAPI(title="IA Evaluation API")


# ── Schema ────────────────────────────────────────────────────────────────────

_DDL = [
    text("""
        CREATE TABLE IF NOT EXISTS candidates (
            interview_detail_id  INTEGER PRIMARY KEY,
            candidate_name       VARCHAR(255) NOT NULL,
            job_name             VARCHAR(255) NOT NULL,
            interviewer_name     VARCHAR(255)
        )
    """),
    text("""
        CREATE TABLE IF NOT EXISTS evaluations (
            id                   SERIAL PRIMARY KEY,
            email                VARCHAR(255) NOT NULL,
            interview_detail_id  INTEGER NOT NULL
                                     REFERENCES candidates(interview_detail_id),
            is_complete          BOOLEAN DEFAULT FALSE,
            created_at           TIMESTAMP DEFAULT NOW(),
            updated_at           TIMESTAMP DEFAULT NOW(),
            UNIQUE (email, interview_detail_id)
        )
    """),
    text("""
        CREATE TABLE IF NOT EXISTS scores (
            id              SERIAL PRIMARY KEY,
            evaluation_id   INTEGER NOT NULL
                                REFERENCES evaluations(id) ON DELETE CASCADE,
            tab             VARCHAR(100) NOT NULL,
            metric_key      VARCHAR(255) NOT NULL,
            question_index  INTEGER,
            score           INTEGER,
            dims            TEXT[]
        )
    """),
    text("""
        CREATE TABLE IF NOT EXISTS feedback (
            id              SERIAL PRIMARY KEY,
            evaluation_id   INTEGER NOT NULL
                                REFERENCES evaluations(id) ON DELETE CASCADE,
            tab             VARCHAR(100) NOT NULL,
            text            TEXT,
            UNIQUE (evaluation_id, tab)
        )
    """),
]


@app.on_event("startup")
def startup_event():
    try:
        with engine.begin() as conn:
            for stmt in _DDL:
                conn.execute(stmt)
        print("Database initialized: star schema tables ready.")
    except Exception as e:
        print(f"Failed to initialize database tables: {e}")


@app.middleware("http")
async def no_cache_static(request: Request, call_next):
    response = await call_next(request)
    if not request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/rubrics")
def get_rubrics():
    return RUBRICS


# ── Data helpers ───────────────────────────────────────────────────────────────


def load_all() -> list[dict]:
    with open(DATA_FILE) as f:
        data = json.load(f)
    allowed_ids = [477, 476, 480, 458, 378]
    return [r for r in data if r.get("interview_detail_id") in allowed_ids]


def resolve_pdf(record: dict) -> Path | None:
    local = record.get("resume_local_path", "")
    if local:
        p = BASE_DIR.parent / local
        if p.exists():
            return p
        p = Path(local)
        if p.exists():
            return p
    rel = record.get("resume_file_path", "")
    if rel:
        p = BASE_DIR / "data" / "ml_eval_data" / "data" / rel
        if p.exists():
            return p
    return None


def resolve_jd_pdf(record: dict) -> Path | None:
    job_id = record.get("job_id")
    if job_id:
        p = BASE_DIR / "data" / "jds" / f"{job_id}.pdf"
        if p.exists():
            return p
    return None


# ── Annotation helpers: flatten state.ann → rows / reconstruct rows → state.ann

def flatten_annotations(ann_data: dict) -> tuple[list[dict], list[dict]]:
    """Convert the frontend state.ann blob into (score_rows, feedback_rows)."""
    score_map: dict[tuple, dict] = {}

    def upsert(tab, key, q_idx, value):
        k = (tab, key, q_idx)
        if key.endswith("_dims"):
            base = key[:-5]
            bk = (tab, base, q_idx)
            score_map.setdefault(bk, {"tab": tab, "metric_key": base,
                                      "question_index": q_idx, "score": None, "dims": []})
            score_map[bk]["dims"] = value if isinstance(value, list) else []
        elif isinstance(value, (int, float)):
            score_map.setdefault(k, {"tab": tab, "metric_key": key,
                                     "question_index": q_idx, "score": None, "dims": []})
            score_map[k]["score"] = int(value)

    # Tab-level sections (no question index)
    for tab in ("jd_parsing", "resume_parsing", "interview_analysis"):
        for k, v in (ann_data.get(tab) or {}).items():
            upsert(tab, k, None, v)

    # Per-question: question_plan
    for q_str, q_data in (ann_data.get("question_plan", {}).get("questions") or {}).items():
        for k, v in q_data.items():
            upsert("question_plan", k, int(q_str), v)

    # Per-question: answer_eval and followup_decision  (e0, e1, …)
    for tab in ("answer_eval", "followup_decision"):
        for e_key, e_data in (ann_data.get(tab) or {}).items():
            idx = int(e_key[1:])
            for k, v in e_data.items():
                upsert(tab, k, idx, v)

    # Free-text feedback
    feedbacks = [
        {"tab": t, "text": txt}
        for t, txt in (ann_data.get("feedback") or {}).items()
        if isinstance(txt, str) and txt.strip()
    ]

    return list(score_map.values()), feedbacks


def reconstruct_annotations(score_rows: list, feedback_rows: list) -> dict:
    """Rebuild a state.ann blob from database rows."""
    ann: dict = {}

    for row in score_rows:
        tab, key, q_idx, value, dims = (
            row["tab"], row["metric_key"], row["question_index"],
            row["score"], row["dims"] or [],
        )

        if tab == "question_plan":
            q_str = str(q_idx)
            (ann.setdefault("question_plan", {})
                .setdefault("questions", {})
                .setdefault(q_str, {}))
            if value is not None:
                ann["question_plan"]["questions"][q_str][key] = value
            if dims:
                ann["question_plan"]["questions"][q_str][f"{key}_dims"] = dims

        elif tab in ("answer_eval", "followup_decision"):
            e_key = f"e{q_idx}"
            ann.setdefault(tab, {}).setdefault(e_key, {})
            if value is not None:
                ann[tab][e_key][key] = value
            if dims:
                ann[tab][e_key][f"{key}_dims"] = dims

        else:
            ann.setdefault(tab, {})
            if value is not None:
                ann[tab][key] = value
            if dims:
                ann[tab][f"{key}_dims"] = dims

    for row in feedback_rows:
        ann.setdefault("feedback", {})[row["tab"]] = row["text"]

    return ann


# ── Dataset routes ─────────────────────────────────────────────────────────────


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
        job_id = data[idx].get("job_id")
        raise HTTPException(404, f"JD PDF not found for Job ID {job_id}.")
    return FileResponse(str(pdf_path), media_type="application/pdf")


# ── Annotation routes ──────────────────────────────────────────────────────────


@app.get("/api/annotations/{idx}")
def get_annotations(idx: int, email: str):
    data = load_all()
    if not (0 <= idx < len(data)):
        raise HTTPException(404, "Dataset not found")
    iid = data[idx]["interview_detail_id"]

    try:
        with engine.connect() as conn:
            eval_row = conn.execute(
                text("SELECT id FROM evaluations WHERE email = :e AND interview_detail_id = :iid"),
                {"e": email, "iid": iid},
            ).fetchone()
            if not eval_row:
                return {}
            eid = eval_row[0]

            score_rows = conn.execute(
                text("SELECT tab, metric_key, question_index, score, dims "
                     "FROM scores WHERE evaluation_id = :eid"),
                {"eid": eid},
            ).mappings().all()

            feedback_rows = conn.execute(
                text("SELECT tab, text FROM feedback WHERE evaluation_id = :eid"),
                {"eid": eid},
            ).mappings().all()

        return reconstruct_annotations(list(score_rows), list(feedback_rows))
    except Exception as e:
        print(f"Database error in get_annotations: {e}")
        return {}


@app.post("/api/annotations/{idx}")
async def save_annotations(idx: int, request: Request):
    body = await request.json()
    email = body.get("email")
    ann_data = body.get("data") or {}

    if not email:
        raise HTTPException(status_code=400, detail="User email missing")

    data = load_all()
    if not (0 <= idx < len(data)):
        raise HTTPException(404, "Dataset not found")

    record = data[idx]
    iid = record["interview_detail_id"]
    scores, feedbacks = flatten_annotations(ann_data)

    with engine.begin() as conn:
        # Upsert candidate metadata
        conn.execute(text("""
            INSERT INTO candidates (interview_detail_id, candidate_name, job_name, interviewer_name)
            VALUES (:iid, :name, :job, :interviewer)
            ON CONFLICT (interview_detail_id) DO UPDATE
                SET candidate_name   = EXCLUDED.candidate_name,
                    job_name         = EXCLUDED.job_name,
                    interviewer_name = EXCLUDED.interviewer_name
        """), {
            "iid":         iid,
            "name":        record.get("interviewee_name", ""),
            "job":         record.get("job_name", ""),
            "interviewer": record.get("interviewer_name", ""),
        })

        # Upsert evaluation row
        conn.execute(text("""
            INSERT INTO evaluations (email, interview_detail_id, updated_at)
            VALUES (:email, :iid, NOW())
            ON CONFLICT (email, interview_detail_id)
            DO UPDATE SET updated_at = NOW()
        """), {"email": email, "iid": iid})

        eid = conn.execute(
            text("SELECT id FROM evaluations WHERE email = :email AND interview_detail_id = :iid"),
            {"email": email, "iid": iid},
        ).fetchone()[0]

        # Replace scores and feedback wholesale
        conn.execute(text("DELETE FROM scores   WHERE evaluation_id = :eid"), {"eid": eid})
        conn.execute(text("DELETE FROM feedback WHERE evaluation_id = :eid"), {"eid": eid})

        for s in scores:
            conn.execute(text("""
                INSERT INTO scores (evaluation_id, tab, metric_key, question_index, score, dims)
                VALUES (:eid, :tab, :key, :qidx, :score, :dims)
            """), {
                "eid":   eid,
                "tab":   s["tab"],
                "key":   s["metric_key"],
                "qidx":  s["question_index"],
                "score": s["score"],
                "dims":  s["dims"] or [],
            })

        for f in feedbacks:
            conn.execute(text("""
                INSERT INTO feedback (evaluation_id, tab, text)
                VALUES (:eid, :tab, :text)
            """), {"eid": eid, "tab": f["tab"], "text": f["text"]})

    return {"ok": True}


@app.delete("/api/annotations/{idx}")
def reset_annotations(idx: int, email: str):
    data = load_all()
    if not (0 <= idx < len(data)):
        raise HTTPException(404, "Dataset not found")
    iid = data[idx]["interview_detail_id"]

    try:
        with engine.begin() as conn:
            conn.execute(
                text("DELETE FROM evaluations WHERE email = :e AND interview_detail_id = :iid"),
                {"e": email, "iid": iid},
            )
        return {"ok": True}
    except Exception as e:
        print(f"Database error in reset_annotations: {e}")
        raise HTTPException(status_code=500, detail="Could not reset evaluations")


# ── Static files (must be last) ────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=str(BASE_DIR / "web"), html=True), name="web")
