from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import json
from api.rubrics_content import RUBRICS

BASE_DIR = Path(__file__).parent.parent          # evaluation/
print("BASE_DIR: ",BASE_DIR)
DATA_DIR = BASE_DIR / "data"              # test/dataset/data/
DATA_FILE = DATA_DIR / "result_v2.json"
ANNOTATIONS_DIR = BASE_DIR / "annotations"
ANNOTATIONS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="IA Evaluation API")


@app.get("/api/rubrics")
def get_rubrics():
    return RUBRICS


# ── helpers ───────────────────────────────────────────────────────────────────

def load_all() -> list[dict]:
    with open(DATA_FILE) as f:
        return json.load(f)


def resolve_pdf(record: dict) -> Path | None:
    # Try resume_local_path relative to test/dataset/
    local = record.get("resume_local_path", "")
    if local:
        p = BASE_DIR.parent / local   # test/dataset/ + relative path
        if p.exists():
            return p
        p = Path(local)               # try as absolute
        if p.exists():
            return p
    # Try resume_file_path relative to data/ml_eval_data/data/
    rel = record.get("resume_file_path", "")
    if rel:
        p = BASE_DIR / "data" / "ml_eval_data" / "data" / rel
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


# ── annotation routes ──────────────────────────────────────────────────────────

@app.get("/api/annotations/{idx}")
def get_annotations(idx: int):
    f = ANNOTATIONS_DIR / f"{idx}.json"
    if not f.exists():
        return {}
    with open(f) as fp:
        return json.load(fp)


@app.post("/api/annotations/{idx}")
async def save_annotations(idx: int, request: Request):
    body = await request.json()
    f = ANNOTATIONS_DIR / f"{idx}.json"
    with open(f, "w") as fp:
        json.dump(body, fp, indent=2)
    return {"ok": True}


# ── static files (must be last) ───────────────────────────────────────────────
app.mount("/", StaticFiles(directory=str(BASE_DIR / "web"), html=True), name="web")
