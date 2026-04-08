# IA Pipeline Human Evaluation Tool

A lightweight human annotation tool for evaluating the AI Interview Agent (IA) pipeline at Fusemachines. Hiring managers and ML reviewers use this tool to score each stage of the pipeline against a structured rubric and produce ground-truth labels for model improvement.

## What this tool is

The IA pipeline processes a candidate interview end-to-end:
1. Classifies the incoming document (JD vs. resume)
2. Parses the job description (JD) into structured requirements
3. Parses the candidate's resume into structured data
4. Generates a tailored interview question plan
5. During the live interview: classifies conversational flow, evaluates each answer, decides whether to ask a follow-up

This tool lets a human reviewer look at every stage's inputs and outputs for a given interview record and rate the AI's performance. Annotations are saved as JSON files and will eventually be written to a PostgreSQL database.

## Evaluation tabs

| Tab | Pipeline stage | What you evaluate |
|-----|---------------|-------------------|
| **JD Parsing** | S1 Document Classification, S2 JD Extraction | Was the right document type identified? Were all JD requirements extracted faithfully and completely? |
| **Resume** | S4 Resume Parsing | Is the parsed resume data accurate — entities, work history order, quantitative claims, skill classification? |
| **Interview Questions** | S5 Question Generation | Does the pre-interview question plan fit the role and candidate? Is each question fair? |
| **During Interview** | S6 Flow Classification, Answer Evaluation, Follow-up | Was each turn classified correctly? Did the AI evaluate the answer accurately? Was the follow-up decision right? |

## Rubric

Scores use a 1–5 scale. Dimensions marked **VETO** mean a score ≤ 2 signals the entire stage failed regardless of other scores. Full rubric definitions are in `IA_Evaluation_Rubric_v2.md`.

## Data

- Dataset: `test/dataset/data/result_v2.json` (17 interview records)
- Annotations: saved per-record in `annotations/{idx}.json`
- Future: annotations will migrate to a `human_annotations` table in PostgreSQL 16, keyed by `interview_detail_id + reviewer_id`

## Running locally

```bash
cd test/dataset/evaluation
python3 -m venv .venv
.venv/bin/pip install -r api/requirements.txt
.venv/bin/uvicorn api.main:app --reload --port 8080
# Open http://localhost:8080
```

## Project structure

```
evaluation/
  api/
    main.py           # FastAPI backend — serves dataset records, PDFs, annotations
    requirements.txt
  web/
    index.html        # App shell
    style.css         # Design tokens, layout, component styles
    app.js            # SPA: state, tab renderers, event delegation, auto-save
  annotations/        # Per-record annotation JSON files (auto-created)
  data/               # (legacy) 15-record eval dataset copy
  IA_Evaluation_Rubric_v2.md
  EVAL_APP_DESIGN.md  # Functional design specification
  README.md           # This file
```

## Architecture notes

- **No framework** — vanilla JS SPA with event delegation. Score/binary button clicks update annotation state in-place (no tab re-render) to preserve scroll position.
- **Guide system** — each evaluation component type (Classification, Evaluation, Follow-up) has a collapsible reference guide. Hide state is stored in `localStorage` per component type and persists across records.
- **Auto-save** — 700 ms debounce after any annotation change; status shown in header.
- **PDF serving** — backend streams resume PDFs; paths resolved from `resume_local_path` relative to `test/dataset/`.
