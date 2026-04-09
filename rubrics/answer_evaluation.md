# Interview Agent — Evaluation Rubric: Answer Evaluation (Per-Question)

**Scoring Manual for Human Reviewers & LM-as-a-Judge Pipeline**

> This rubric covers **per-question answer evaluation during the live interview** — the real-time assessment of what a candidate said in response to a single question. It is distinct from Stage 9 (Interview Analysis), which is a post-interview synthesis across all questions.

---

## How to Use This Document

This rubric is a **scoring manual**, not an alignment document. Every dimension has four components:

- **Score Table** — what each level looks like (the flavor text).
- **Decision Rules** — if/then logic that forces a score. These override judgment calls.
- **Counting Method** — what to count, how to count it, and what thresholds map to what scores.
- **Anchor Example** — a real-ish input/output pair sitting at the hardest boundary (usually 3 vs 4).

**Veto Dimensions** are marked with ⚠. A score of 1–2 on a veto dimension means the entire evaluation output is considered failed regardless of other scores.

> *For LM-as-a-Judge: Feed the Decision Rules and Counting Method as the primary scoring instructions. Use the Score Table as contextual framing. Include Anchor Examples as few-shot references.*

---

## Scale Key

| Score | Label      | Meaning                                                                              |
| ----- | ---------- | ------------------------------------------------------------------------------------ |
| 1     | FAIL       | Broken. Unusable output. Requires full redo.                                         |
| 2     | POOR       | Major gaps. A human reviewer would reject and rewrite >50%.                          |
| 3     | ACCEPTABLE | Functional. A human reviewer would edit 2–4 specific things but keep the structure. |
| 4     | GOOD       | Minor polish. A human reviewer would tweak 1–2 things and ship.                     |
| 5     | EXCELLENT  | Production-ready. A human reviewer would ship as-is.                                 |

---

## Stage 7 — Answer Evaluation (Per-Question)

**Purpose:** For each question asked during the interview, assess the quality of the AI system's evaluation of the candidate's response. The evaluator receives the question text, the candidate's answer (from the live transcript), and the skill(s) the question was designed to assess. It produces: a numeric score (0–10), a rubric label (Irrelevant / Basic / Adequate / Strong / Excellent), key strengths observed, and gaps or missing signals.

This stage gates the follow-up question generation decision (Stage 8) and feeds into the post-interview analysis (Stage 9). Errors here silently bias every downstream component.

---

### 7.1 Score Accuracy `VETO`

Does the numeric score correctly reflect the quality of the candidate's answer relative to the skill being assessed?

> ⚠ **VETO:** A score that contradicts the observable evidence in the transcript corrupts the follow-up routing decision and the post-interview skill band. Any fabricated positive or negative signal driving the score → automatic FAIL.

| 1 FAIL                                                                                                                                                | 2 POOR                                                                                                                                          | 3 OK                                                                                                                   | 4 GOOD                                                                                                                                        | 5 EXCELLENT                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Score contradicts the answer — high score for a vague or wrong answer, or low score for a clear, detailed answer. OR score is based on invented content not present in the transcript. | Score is directionally correct but significantly off in magnitude. A 7 for an answer that any reviewer would rate 3–4, or vice versa. | Score is in the right range. Minor calibration drift — off by 1–2 points in a predictable direction (too generous or too strict across all answers). | Score matches the answer quality with at most 1-point drift. Consistent calibration. Hard answers and easy answers are correctly separated. | Score is precisely calibrated to the answer. A reviewer reading the transcript and the score would immediately agree. No drift across easy, medium, or hard answers. |

**Decision Rules:**

- ▸ IF the score is ≥5 points away from what the transcript evidence supports → FAIL.
- ▸ IF the evaluation references content the candidate did not say ("candidate mentioned X" when they did not) → FAIL. Fabricated evidence is a scoring integrity failure.
- ▸ IF the score is 3–4 points off but in the correct direction → cap at 2.
- ▸ IF the score is within 2 points and the calibration is directionally correct → ≥3.
- ▸ IF the score is within 1 point across all evaluated turns → 4. Within 1 point AND consistent calibration across easy/hard answers → 5.

**Counting Method:**

1. For each evaluated answer, establish the ground-truth score range based on transcript evidence (review what the candidate said against the skill criteria).
2. Compute deviation: |AI score − ground truth midpoint|.
3. 0–1 deviation → score 4–5. 2 deviation → score 3. 3–4 deviation → score 2. ≥5 deviation OR fabricated evidence → score 1.

**Anchor Example — 2 vs 3 boundary:**

> *Question: "Walk me through how you've designed a database schema for a high-traffic application." Candidate gave a vague answer: mentioned normalization, didn't describe any specific design choices, didn't address scale. Ground truth: 3–4/10. AI score: 6/10 with note "candidate demonstrated solid understanding of normalization." — Off by 2–3 points, directionally wrong (too generous), but no fabrication. → Score 2. If AI scored 5/10 with a note that correctly identifies the vagueness → Score 3.*

---

### 7.2 Evidence Grounding `VETO`

Is every claim in the evaluation — strengths, gaps, score rationale — traceable to something the candidate actually said in this turn's transcript?

> ⚠ **VETO:** Any fabricated claim (attributing a statement the candidate did not make) means the evaluation is untrustworthy as evidence for the follow-up decision and the analysis report.

| 1 FAIL                                                                                                                           | 2 POOR                                                                                                                                              | 3 OK                                                                                                                        | 4 GOOD                                                                                                                                  | 5 EXCELLENT                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One or more strengths or gaps reference content the candidate did not say in this turn. Fabricated claims present. | No fabrication, but evaluation draws on prior turns' content without flagging it — creating a false impression of what this specific answer showed. | All claims traceable to the transcript. Some claims are vague paraphrases that lose the specificity of what was actually said. | All claims specific and traceable. Vague paraphrases absent. Each strength and gap maps to a discrete candidate statement. | Every claim is directly quoted or precisely paraphrased with a clear mapping to the transcript. A reviewer could verify each claim without ambiguity. |

**Decision Rules:**

- ▸ IF the evaluation says "candidate mentioned X" or "candidate demonstrated X" and X is not present in the transcript of this turn → FAIL.
- ▸ IF the evaluation references something from a prior turn (e.g., "building on what they said earlier") without flagging it as cross-turn context → cap at 2. Cross-turn references are allowed but must be labeled as such.
- ▸ IF all claims are traceable but one or more are too vague to verify (e.g., "candidate showed technical depth" with no specific link) → cap at 3.
- ▸ IF all claims are traceable and specific → ≥4. IF additionally every claim could be directly verified by reading the transcript → 5.

**Anchor Example — FAIL vs 3 boundary:**

> *Candidate answer: "I've used PostgreSQL in my last two jobs, mostly for read-heavy workloads. We had some indexing work but I didn't lead it." Evaluation states: "Candidate demonstrated strong hands-on experience designing indexes for scale." — Candidate said they didn't lead the indexing work. This is a fabricated strength → FAIL. Corrected evaluation: "Candidate mentioned indexing experience but indicated they were not the lead — depth of hands-on involvement is unclear." → Score 3 (traceable, but the gap identification is vague).*

---

### 7.3 Answer Classification Accuracy `HIGH`

Does the rubric label (Irrelevant / Basic / Adequate / Strong / Excellent) correctly describe the answer's quality relative to the role's seniority level?

The rubric label determines whether a follow-up is generated. Follow-up generation is triggered when the numeric score is < 7. A misclassification that crosses the score-7 boundary in either direction incorrectly gates the follow-up decision.

Two scoring systems apply depending on role seniority (`years_of_experience_required`):
- **System 1 (0–2 yrs, Junior/Intern):** 0 = Irrelevant, 1–6 = Adequate, 7–9 = Strong, 10 = Excellent. No Basic band.
- **System 2 (3+ yrs, Mid/Senior):** 0 = Irrelevant, 1–3 = Basic, 4–6 = Adequate, 7–8 = Strong, 9–10 = Excellent.

| 1 FAIL                                                                                                                                        | 2 POOR                                                                                                                                                              | 3 OK                                                                                                                                           | 4 GOOD                                                                                                                                     | 5 EXCELLENT                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label crosses the follow-up boundary in the wrong direction — Strong/Excellent assigned when score < 7, or Irrelevant/Basic/Adequate when score ≥ 7. | Label is wrong but both the assigned and correct label are on the same side of the score-7 threshold (e.g., Basic vs Adequate in System 2 — both trigger follow-up). | Label is correct for clear cases. Struggles on borderline Adequate vs. Strong (score 6 vs 7) or wrong system applied for the role's seniority. | Label is correct including borderline cases. Correct scoring system applied. Label and numeric score are internally consistent. | Label precisely reflects the answer quality within the correct system. Reasoning explicitly maps the label choice to observable transcript evidence. |

**Classification Reference:**

| Label      | System 1 (0–2 yrs) | System 2 (3+ yrs) | Definition                                                                                                    |
| ---------- | ------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Irrelevant | 0                   | 0                  | Answer is completely off-topic, nonsensical, or candidate refused to engage.                                 |
| Basic      | *(not used)*        | 1–3                | Superficial. Can describe *what* a concept is but struggles to explain *why*. Significant knowledge gap.      |
| Adequate   | 1–6                 | 4–6                | Meets minimum expectations. Can describe what was done with some reasoning, but misses trade-offs or depth.  |
| Strong     | 7–9                 | 7–8                | Solid. Explains choices, justifies trade-offs, understands context and implications.                          |
| Excellent  | 10                  | 9–10               | Deep insight. Proactive problem-solving, systems-level thinking, connects technical decisions to outcomes.     |

**Decision Rules:**

- ▸ **Follow-up threshold VETO:** IF the label is Strong or Excellent but the score is < 7 (or vice versa) → FAIL. This is a boundary violation that directly corrupts follow-up routing.
- ▸ IF the wrong scoring system is applied for the role's seniority level (e.g., System 2 used for a junior role, missing that Basic is not a valid label) → cap at 2.
- ▸ IF label is wrong but both assigned and correct label are below score 7 (e.g., Basic vs Adequate in System 2) → cap at 2. The follow-up still triggers correctly, but calibration is off.
- ▸ IF label is correct and consistent with the numeric score → ≥3. IF additionally the correct system is applied AND reasoning cites transcript evidence → ≥4. IF reasoning is explicit enough to verify → 5.

**Anchor Example — Adequate vs Strong (score-7 boundary):**

> *Role: 5 years experience (System 2). Question assesses "database indexing strategy." Candidate explains B-tree vs hash indexes and gives a production example, but doesn't discuss trade-offs for write-heavy workloads. Correct: score 6, label Adequate — follow-up should be generated. Misclassified: score 7, label Strong — no follow-up generated. The score-6 vs score-7 call is the critical boundary; a score of 6 with label Strong is also a FAIL (label/score inconsistency).*

---

### 7.4 Gap & Strength Identification `MEDIUM`

Does the evaluation correctly identify what the candidate demonstrated (strengths) and what was missing or unclear (gaps), at the right level of specificity?

| 1 FAIL                                                                                           | 2 POOR                                                                                                                 | 3 OK                                                                                                                    | 4 GOOD                                                                                                                               | 5 EXCELLENT                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strengths or gaps are fabricated. OR major strength is missed entirely. OR critical gap not identified when the answer clearly showed one. | Correct direction but vague. Strengths listed are generic ("good communication"). Gaps are too broad ("lacks depth"). | Correct identification of the main strength and main gap. Missing secondary gaps or strengths that a careful reviewer would note. | All significant strengths and gaps identified. Each is specific enough to be actionable for the follow-up decision. No fabrication. | Strengths and gaps are precisely identified and ordered by significance. Each maps directly to the skill being assessed. A follow-up question could be derived directly from the gaps listed. |

**Decision Rules:**

- ▸ IF any listed strength or gap was not observable in the transcript → cap at 2 (borders on fabrication).
- ▸ IF the primary gap (the most important missing signal for this skill) is not identified → cap at 2.
- ▸ IF gaps are identified but described in terms too generic to drive a follow-up (e.g., "could elaborate more") → cap at 3.
- ▸ IF all gaps are specific and map to the skill criteria → ≥4. IF additionally ordered by significance → 5.

**Anchor Example — 3 vs 4 boundary:**

> *Skill: "Database schema design." Candidate described normalization and gave a real example but never mentioned indexing strategy or scalability trade-offs. Score-3 gap: "Candidate could go deeper on schema design." Score-4 gap: "Candidate did not address indexing strategy or scalability trade-offs — both are central to the skill. A follow-up on trade-offs for write-heavy vs. read-heavy schemas would surface whether this is a knowledge gap or just a time constraint."*

---
