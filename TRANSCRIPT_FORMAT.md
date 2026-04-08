# `prcoessed_interview_transcript` — Data Format Reference

> Note: The field name has a typo (`prcoessed`) — this is intentional and matches the database/API output exactly.

---

## Overview

`prcoessed_interview_transcript` is a **chronological flat array** that mixes two categories of entries:

1. **Transcript entries** — raw speech from the interviewer or interviewee
2. **System entries** — AI pipeline outputs (classification, evaluation, follow-up)

All entries are in chronological order as they were produced during the live interview.

---

## Entry Types

### 1. Transcription (`message_type: "transcription"`)

Raw speech from a participant.

```json
{
  "user_name": "Christian Isernia",
  "message_text": "My routine was to execute Power BI dashboards and SQL queries…",
  "message_type": "transcription",
  "role": "interviewee",
  "question_index": null,
  "is_follow_up": null,
  "follow_up_question": null,
  "answer_context": null,
  "evaluation": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_name` | string | Display name of the speaker |
| `message_text` | string | Transcribed speech |
| `message_type` | `"transcription"` | Discriminator |
| `role` | `"interviewee"` \| `"interviewer"` | Speaker role |
| all other fields | null | Unused for transcription entries |

---

### 2. Classification (`role: "system"`, `task: "classification"`)

Runs after each **interviewer** turn. Classifies what the interviewer said.

```json
{
  "role": "system",
  "task": "classification",
  "input": {
    "interview_progress_context": "- Technical Interview Started: Yes\n- Main Questions Asked So Far: 1 out of 3\n…",
    "conversation_history": [
      { "candidate": "My daily routine was…" },
      { "recruiter": "Okay. Can you describe a specific instance where you used SQL…" }
    ],
    "questions": {
      "main_questions": ["Describe a specific instance where…", "Walk me through…", "Elaborate on…"],
      "follow_up_questions": []
    }
  },
  "output": {
    "classification": "New Question",
    "is_follow_up": false,
    "matched_question_index": 0,
    "matched_question": "Describe a specific instance where you used SQL…"
  }
}
```

**Output classification values:**

| Value | Meaning |
|-------|---------|
| `"New Question"` | Recruiter asked a planned question |
| `"Continuation"` | Conversation continuing, no new question |
| `"Interview End"` | Interview is wrapping up |
| `"Out of Plan New Question"` | Improvised question, new topic |
| `"Out of Plan Follow-up Question"` | Improvised question, same topic as active Q |

**Input fields:**
- `interview_progress_context` — multi-line string with current interview state
- `conversation_history` — last few turns, each object has `candidate` or `recruiter` key
- `questions.main_questions` — planned question list
- `questions.follow_up_questions` — follow-ups asked so far

**Output fields:**
- `classification` — one of the 5 labels above
- `is_follow_up` — true if a follow-up question was detected
- `matched_question_index` — 0-based index into question list (-1 if no match)
- `matched_question` — text of matched question (empty if no match)

---

### 3. Evaluation (`role: "system"`, `task: "evaluation"`)

Rates the candidate's answer to a question. Generated when a "New Question" or "Interview End" classification is detected (evaluates the **previous** question's answer).

```json
{
  "role": "system",
  "task": "evaluation",
  "input": {
    "conversation": "recruiter: Can you describe a specific instance…\ncandidate: My daily routine…",
    "question_details": {
      "question": "Describe a specific instance where you used SQL…",
      "expected_answer_context": "A strong answer would include specific SQL queries…",
      "skills_to_be_assessed": ["SQL", "Data Management"]
    },
    "role_context": {
      "seniority_level": null,
      "years_of_experience_required": null
    }
  },
  "output": {
    "what_was_answered": "Candidate mentioned using SQL to investigate anomalies in KPIs…",
    "what_was_missed": "Candidate missed providing specific SQL query details…",
    "rating": {
      "rubric": "Adequate",
      "score": 5,
      "reasoning": "The candidate provided a relevant scenario… however lacked specific technical details…"
    }
  }
}
```

**Input fields:**
- `conversation` — full multi-line Q+A string with `recruiter:` and `candidate:` prefixes
- `question_details.question` — the question being evaluated
- `question_details.expected_answer_context` — what a strong answer looks like
- `question_details.skills_to_be_assessed` — list of skill strings

**Output fields:**
- `what_was_answered` — summary of what the candidate covered
- `what_was_missed` — summary of gaps
- `rating.rubric` — label: Excellent / Good / Adequate / Inadequate / Poor
- `rating.score` — integer 1–10
- `rating.reasoning` — detailed explanation

---

### 4. Follow-up (`role: "system"`, `task: "follow-up"`)

Generates a follow-up question based on the evaluation. Always follows an evaluation entry in the array.

```json
{
  "role": "system",
  "task": "follow-up",
  "input": {
    "conversation": "recruiter: Can you describe…\ncandidate: My daily routine…",
    "question_details": { "…": "…" },
    "role_context": { "…": "…" },
    "evaluation_output": {
      "what_was_answered": "…",
      "what_was_missed": "…",
      "rating": { "rubric": "Adequate", "score": 5, "reasoning": "…" }
    }
  },
  "output": {
    "follow_up_question": "Could you elaborate on a specific SQL query you've written…",
    "time": 5,
    "expected_answer_context": "A strong answer should describe a specific SQL query…"
  }
}
```

**Input fields:** Same as evaluation, plus `evaluation_output` (the result of the paired evaluation)

**Output fields:**
- `follow_up_question` — the generated follow-up question text
- `time` — suggested answer time in minutes
- `expected_answer_context` — what a strong follow-up answer looks like

---

## Chronological Ordering

The array is ordered chronologically. The key ordering rule to understand:

**Evaluation and follow-up entries appear AFTER the "New Question" classification that triggered them, even though they evaluate the PREVIOUS question.**

```
[transcripts — pre-interview or Q1 answer...]
classification: "New Question" Q2        ← Q2 detected here
evaluation: Q1                           ← evaluates Q1's answer
follow-up: Q1                            ← follow-up for Q1
[transcripts — Q2 answer...]
classification: "New Question" Q3
evaluation: Q2
follow-up: Q2
[transcripts — Q3 answer...]
classification: "Interview End"
evaluation: Q3
follow-up: Q3
```

**Special cases:**
- **First question**: No evaluation/follow-up before Q1's classification (nothing to evaluate yet)
- **Interview End**: Triggers evaluation+follow-up for the last question, same as New Question
- **Continuation**: Most frequent classification — conversation is still on the same question, no eval triggered

---

## Top-Level Record Fields

The record containing `prcoessed_interview_transcript` also provides:

| Field | Description |
|-------|-------------|
| `interviewee_name` | Candidate's display name |
| `interviewer_name` | Recruiter's display name |
| `job_name` | Job title being interviewed for |
| `interview_detail_id` | Unique interview identifier |

These are used to resolve speaker names in transcription entries.
