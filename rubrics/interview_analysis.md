# Interview Agent — Evaluation Rubric: Interview Analysis

**Scoring Manual for Human Reviewers & LM-as-a-Judge Pipeline**

---

## How to Use This Document

This rubric is a **scoring manual**, not an alignment document. Every dimension has four components:

- **Score Table** — what each level looks like (the flavor text).
- **Decision Rules** — if/then logic that forces a score. These override judgment calls.
- **Counting Method** — what to count, how to count it, and what thresholds map to what scores.
- **Anchor Example** — a real-ish input/output pair sitting at the hardest boundary (usually 3 vs 4).

**Veto Dimensions** are marked with ⚠. A score of 1–2 on a veto dimension means the entire stage output is considered failed regardless of other scores.

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

## Stage 9 — Interview Analysis

**Purpose:** After the interview concludes, the analysis synthesizes all per-question evaluations, the conversation transcript, the job description, and the planned skill coverage into a hiring report for the next interviewer (typically a senior engineer or hiring manager). This is not a re-scorer — per-question scores are already computed. The analysis aggregates that evidence into four outputs: a holistic performance summary, a skill-by-skill assessment with bands and scores, an overall hiring recommendation, and targeted discussion points with follow-up questions for the next round.

The agent receives: the parsed job description, the skill categories the role requires, which skills were planned for this session, per-question data (the question asked, the conversation, and the per-question evaluation), and the full raw transcript. It outputs a structured report.

---

### 9.1 Structural & Schema Integrity `VETO`

Does the output follow the mandatory structural rules that, if broken, produce a misleading or unusable report?

| 1 FAIL                                                                                                                                                                                                              | 2 POOR                                                                                                                                                  | 3 OK                                                                                                    | 4 GOOD                                                                                                                         | 5 EXCELLENT                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Any skill area appears more than once. OR a skill that was planned but not asked receives the wrong zero-score summary. OR the overall band does not match its score range (e.g., score 8, band "Not Recommended"). | "Misc" category used for skills that clearly belong in an existing category. OR a not-planned skill is labeled "planned but not asked" (or vice versa). | All structural rules followed. Minor inconsistency in how sub-skills are consolidated under a category. | All rules followed correctly. Zero-score cases handled with accurate labels and summaries. Misc not present or used sparingly. | Structurally clean. Every skill area unique, zero-score cases labeled precisely, band-score mapping correct, Misc only when genuinely necessary. |

**Decision Rules:**

- ▸ IF any skill area name appears more than once in the skill assessment → FAIL. The entire assessment is unreliable when a category is split or duplicated.
- ▸ IF a skill was planned but conversation was empty (not asked) → summary must state exactly "This question was planned but was not asked in the interview." Any other wording → cap at 3.
- ▸ IF a skill is in the required categories but was not part of the interview plan → summary must state exactly "This skill was not planned for this interview session." Any other wording → cap at 3.
- ▸ IF the overall band does not correspond to its score (0–3 → Not Recommended, 4–6 → Needs further review, 7–10 → Ready for next round) → FAIL. Band and score are displayed together; a mismatch is immediately visible to the hiring manager.
- ▸ IF "Misc" is used for a skill that logically fits an existing category → cap at 2.

**Anchor Example — FAIL:**

> *Skill categories include "Machine Learning" and "Model Deployment." The report emits two entries: one for "Machine Learning" covering training and evaluation, and a second for "Machine Learning" covering inference. Both entries exist in the output — duplicate skill_area. The hiring manager sees two "Machine Learning" rows with conflicting scores. → FAIL.*

---

### 9.2 Score Calibration & Synthesis `HIGH`

Do skill-level scores reflect the actual interview evidence, and does the overall score represent a meaningful weighted synthesis rather than a mechanical average?

| 1 FAIL                                                                                                                                                                        | 2 POOR                                                                                                                                        | 3 OK                                                                                                                 | 4 GOOD                                                                                                                                                    | 5 EXCELLENT                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill scores contradict the per-question evaluations (e.g., per-question score of 2, skill band "Proficient"). OR overall score is a plain average with no weighting visible. | Skill scores are directionally correct but significantly off in magnitude. Overall score does not reflect the JD's relative skill priorities. | Skill scores are reasonable. Overall score is in the right direction but under- or over-weights one area noticeably. | Skill scores align well with the per-question evidence. Overall score reflects the relative importance of skill areas as signaled by the job description. | Skill scores precisely calibrated to interview evidence. Overall score is a clearly defensible, weighted synthesis — a hiring manager could trace the reasoning from evidence to final number. |

**Decision Rules:**

- ▸ IF a skill's band and score contradict its per-question evaluation (e.g., a per-question score of 2 resulting in a skill band of "Proficient") → cap at 2. The per-question scores are the primary evidence; the analysis must not drift from them without justification.
- ▸ IF the overall score appears to be a simple average of skill scores with no weighting → cap at 3. Skills mentioned prominently in the job description should carry more weight.
- ▸ IF a skill area has multiple questions, the skill score should synthesize across all of them — not just reflect the last one. Single-question bias → cap at 3.
- ▸ IF the overall score band does not match the score value → FAIL (also scored in 9.1 — both dimensions penalize this).

**Anchor Example — 3 vs 4 boundary:**

> *A candidate scored 2/10 on a database question and 8/10 on a general coding question. The job description heavily emphasizes database design. Score-3 report: skill scores are correct, but overall score is 5 (simple average), treating both skills equally. Score-4 report: overall score is 3–4, reflecting that the low performance on the higher-priority skill pulls the recommendation down more than the coding strength offsets it.*

---

### 9.3 Discussion Points Quality `HIGH`

Are the discussion points targeted, well-reasoned, and genuinely useful to the next interviewer — and are the follow-up questions direct, specific, and free of problematic framing?

| 1 FAIL                                                                                                                                                                                                                                             | 2 POOR                                                                                                                                                                                                                                                            | 3 OK                                                                                                                                                                                                                                                             | 4 GOOD                                                                                                                                                                                                           | 5 EXCELLENT                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uses language that overstates certainty about what the JD requires (e.g., framing a skill as mandatory or essential when the JD does not say that). OR invents a JD connection for a skill not in the JD. OR questions use soft, indirect openers. | Discussion points are raised for areas where the candidate performed well and there is nothing genuinely unclear — the questions would not surface new information. Reasoning jumps to conclusions about the candidate rather than describing what was observed. | Points are relevant to genuine gaps. Reasoning describes what happened in the interview but sometimes starts with the conclusion rather than the observation. Questions are direct but overly generic when the interview provided specific evidence to build on. | Points are ordered by how much attention they deserve. Reasoning starts with what was observed before noting the gap. Questions are specific to the interview evidence. JD references are measured and accurate. | Discussion points are precisely targeted. Reasoning is factual and surface-level — it flags without rendering a verdict. Questions are direct, specific, and flow naturally from the reasoning. JD references are soft and accurate. |

**Decision Rules:**

- ▸ **Overconfident JD framing:** IF reasoning describes a skill as mandatory, critical, or essential based on the JD — when the JD itself does not use that language — → cap at 2. The report should reflect what the JD says, not assert its own priority judgments.
- ▸ **Fabricated JD connection:** IF reasoning references the JD for a skill that is not actually in the job description → cap at 2. JD context may only appear when the skill genuinely exists in the JD.
- ▸ **JD reference strength:** IF the JD is mentioned, the phrasing must be measured (e.g., "the JD mentions this" or "the JD lists this as a relevant skill"). Phrasing that implies the JD ranks or prioritizes the skill ("the JD emphasizes", "the JD requires") → cap at 3.
- ▸ **Question openers:** IF any question begins with "Can you", "Could you", "Would you", or similar indirect openers → cap at 3. Questions should be direct.
- ▸ **Passive-aggressive framing:** IF a question asks the candidate to prove or re-demonstrate something they already stated clearly in the interview → cap at 3.
- ▸ **Relevance:** IF a discussion point is raised for an area where the candidate performed well and the question would not surface anything new → cap at 3. Discussion points should only exist where there is genuine ambiguity or an unexplored gap.
- ▸ **Reasoning direction:** IF the reasoning opens with a conclusion about the candidate (e.g., "the candidate lacks depth in X") before describing what was actually observed → cap at 3. Observation must come before judgment.

**Anchor Example — 2 vs 3 boundary:**

> *Score-2 reasoning: "Kubernetes is a critical requirement for this role and the candidate failed to demonstrate it." — Overstates JD priority and frames the gap as a verdict rather than an observation. → cap at 2. Score-3 reasoning: "The candidate did not discuss container orchestration in depth. The JD lists Kubernetes as a relevant skill. It would be worth exploring their hands-on experience in the next round." — Observational tone, measured JD reference, correct direction. Minor issue: the follow-up question is generic and doesn't incorporate any specific evidence from the interview.*

---
