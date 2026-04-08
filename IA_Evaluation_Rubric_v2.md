# Interview Agent — Evaluation Rubric v2

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

## Stage 1 — Document Classification

**Purpose:** Correctly identify which uploaded document is the relevant document (JD, Resume, Transcript) vs. noise.

> ⚠ **VETO:** Pipeline-gating stage. A FAIL here means every downstream stage operates on the wrong input.

### 1.1 Label Accuracy `VETO`

| FAIL                                                                                                                                | CORRECT                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Assigned the wrong label to any document — e.g., labeled a cover letter as the JD, or labeled the actual JD as "other/irrelevant." | Every document in the input set is labeled with the correct type on the first pass, with no ambiguity. |

**Decision Rules:**

- ▸ IF any document is assigned the wrong type label → FAIL.
- ▸ IF the system returns "uncertain" but correct label is in top-2 → PARTIAL FAIL. Log, don't block pipeline.
- ▸ IF the system correctly labels all documents → CORRECT.
- ▸ IF input contains unexpected doc type and system flags as unknown → CORRECT (graceful handling).
- ▸ IF input contains ambiguous document (JD in email body) and system misses it → FAIL, tag "Ambiguous Input."

%% **Counting Method: ** (WILL BE CONSIDERED IN THE FUTURE ITERATIONS IF THE USER EXPERIENCE CHANGES)

1. Count total documents in input. Count correctly labeled.
2. Accuracy = correct / total. Must be 100% for CORRECT.
3. On FAIL: Categorize — Wrong Type, Missed Document, False Positive, Ambiguous Input. %%

**Anchor Example — Tricky boundary:**

> *Input: 3 files — PDF resume, DOCX JD, second PDF is a reference letter (unexpected). System labels resume + JD correctly, flags reference as "unrecognized." → CORRECT. If it labeled the reference letter as a second resume → FAIL.*

---

## Stage 2 — JD Extraction (Parsing)

**Purpose:** Extract structured requirements from a raw JD into a machine-readable format the downstream question generator can consume.

### 2.1 Fidelity (Truth) `VETO`

> ⚠ **VETO:** Any hallucination (adding a requirement not in source) caps at 2 and flags for human review.

| 1 FAIL                                                                            | 2 POOR                                                                                                                | 3 OK                                                                     | 4 GOOD                                                                                     | 5 EXCELLENT                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Contains fabricated requirements, skills, or qualifications not in the source JD. | No fabrication, but includes inferred details not explicitly stated (e.g., assumes "Python" from "data engineering"). | All items in source. Includes redundant boilerplate that adds no signal. | All items verifiable. Minimal boilerplate. Every field maps to a specific source sentence. | Every value has 1:1 source link. Zero boilerplate. Tighter than the original. |

**Decision Rules:**

- ▸ IF any extracted requirement can't trace to a specific source phrase → score ≤ 2.
- ▸ IF inference is reasonable but not explicit ("preferred" → "required") → score ≤ 3.
- ▸ IF ≥3 boilerplate phrases that don't map to skills → score ≤ 3.
- ▸ IF every item maps to source AND no unsupported detail → score ≥ 4.
- ▸ 4 vs 5 tie-breaker: Can every field survive "show me where"? If "it's implied" for even one → 4.

**Counting Method:**

1. List every discrete item in extraction output.
2. Tag each: VERIFIED (exact source), INFERRED (reasonable, not explicit), FABRICATED (no basis), BOILERPLATE (filler).
3. 0 Fabricated + 0 Inferred + 0 Boilerplate = 5.
4. 0 Fabricated + 0 Inferred + 1–2 Boilerplate = 4.
5. 0 Fabricated + 1–2 Inferred OR 3+ Boilerplate = 3.
6. 1 Fabricated = 2. 2+ Fabricated = 1.

**Anchor Example — 3 vs 4 boundary:**

> *JD: "5+ years backend, preferably Go or Rust. Kubernetes a plus." Extraction: "Required: 5+ yrs backend, Go, Rust, Kubernetes." → Score 3. Go/Rust elevated from preferred, K8s from nice-to-have. A 4 preserves tiers: "Required: 5+ yrs backend. Preferred: Go or Rust. Nice-to-have: Kubernetes."*

---

### 2.2 Completeness `VETO`

> ⚠ **VETO:** Missing a dealbreaker requirement caps at 1 regardless of everything else.

| 1 FAIL                                                                   | 2 POOR                                                                                        | 3 OK                                                                                                   | 4 GOOD                                                                               | 5 EXCELLENT                                                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Missed ≥1 dealbreaker (required cert, years threshold, must-have tech). | Got role title + 1–2 obvious skills but missed ≥50% of stack/soft skills/seniority signals. | Most hard skills. Missed required vs preferred on ≥2 items, or missed ≥2 soft/cultural requirements. | All required + preferred hard skills. Missed 1–2 soft skills or minor nice-to-have. | Exhaustive. Every hard skill, soft skill, seniority signal, team context, HM preference — correct tiers. |

**Decision Rules:**

- ▸ Identify all dealbreakers. IF ANY missing → 1.
- ▸ Count total extractable requirements vs captured.
- ▸ Missing >50% → 2.
- ▸ Flattens required vs preferred on ≥2 items → cap at 3.
- ▸ Missing only soft skills / nice-to-haves (≤2) → 4.
- ▸ Complete + correct priority tiers → 5.

**Counting Method:**

1. Checklist from source: every requirement with tier (Dealbreaker / Required / Preferred / Nice-to-have).
2. Check off each in extraction. Note tier accuracy.
3. Missed Dealbreaker → instant 1.
4. Coverage: <50% = 2, 50–80% = 3, 81–95% = 4, 96–100% correct tiers = 5.
5. ≥2 items wrong tier → cap at 3.

**Anchor Example — 4 vs 5 boundary:**

> *JD: 12 requirements (2 dealbreakers, 5 required, 3 preferred, 2 soft skills). Extraction captures all 10 technical with correct tiers, omits both soft skills. → 4. A 5 captures them.*

---

## Stage 3 — Transcript Parsing

**Purpose:** Extract the HM's real constraints from a conversational intake — including signals in tone, hedging, emphasis, and off-hand remarks.

### 3.1 Nuance Capture `VETO`

> ⚠ **VETO:** If extraction misses a constraint the HM explicitly called "non-negotiable" → 1.

| 1 FAIL                                                                             | 2 POOR                                                                                    | 3 OK                                                                                                                    | 4 GOOD                                                                                                     | 5 EXCELLENT                                                                                                                       |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Missed explicit dealbreakers. Output reads like generic JD summary, not HM intake. | Got keywords + tech but missed sentiment/hedging ("ideally" vs "must have" treated same). | Tech + some preferences. Missed soft-skill context or implied priorities (HM spent 3 min on team dynamics → one line). | Strong explicit + implied capture. Correctly split must-haves from nice-to-haves. Missed 1–2 subtle cues. | Conversational language → structured constraints with correct priority. Surfaced hidden constraints HM implied but never stated. |

**Decision Rules:**

- ▸ IF transcript has explicit dealbreaker ("MUST" / "non-negotiable") and it's missing → 1.
- ▸ IF all requirements treated as equal priority when HM distinguished urgency → cap at 2.
- ▸ IF tech captured but zero soft-skill/cultural items when HM discussed them → cap at 3.
- ▸ IF HM language intensity correctly mapped to tiers with ≤2 misses → 4.
- ▸ IF ≥1 hidden constraint surfaced (implied through anecdote/emphasis) → eligible for 5.

**Counting Method:**

1. Tag HM statements: Explicit Req, Explicit Pref, Implied Constraint, Cultural Signal, Noise.
2. Explicit Reqs: 100% for ≥3. Missing any = 1 or 2.
3. Explicit Prefs: ≥80% for ≥4.
4. Implied Constraints surfaced: ≥1 for 5.
5. Cultural Signals: ≥50% for ≥4; 0 when present → cap at 3.

**Anchor Example — 3 vs 4 boundary:**

> *HM: "Three backend people quit in six months. I need someone who wants to mentor juniors. Kafka — non-negotiable. Python or Go, don't care." Extraction: "Required: Kafka. Preferred: Python or Go." → 3. Tech right but retention/mentorship signal absent. A 4 adds: "Critical soft skill: mentorship orientation (context: team retention issues)."*

---

## Stage 4 — Resume Parsing

**Purpose:** Extract structured candidate data for targeted, evidence-based interview questions.

### 4.1 Chronological Fidelity `HIGH`

| 1 FAIL                                                     | 2 POOR                                                                     | 3 OK                                                                                         | 4 GOOD                                                                                  | 5 EXCELLENT                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Dates/roles wrong order. Role attributed to wrong company. | Correct order, but overlapping roles not flagged or gaps silently ignored. | Correct, gaps noted. Struggled with promotions (same company split into separate employers). | All roles correct including internal promotions. Minor date formatting inconsistencies. | Perfect. All roles, promotions, lateral moves, gaps. Overlaps flagged. Dates normalized. |

**Decision Rules:**

- ▸ IF any role attributed to wrong company → 1.
- ▸ IF dates in wrong order → 1.
- ▸ IF overlapping concurrent roles not flagged → cap at 2.
- ▸ IF gaps >6 months not noted → cap at 2.
- ▸ IF promotions split into separate employers → cap at 3.
- ▸ IF all correct, date format varies → 4. All correct + normalized → 5.

**Counting Method:**

1. Per role: verify company, title, dates, order.
2. Count: Misattributed, Misordered, Unflagged gaps, Split promotions, Date inconsistencies.
3. Misattributed/Misordered → 1. Unflagged gaps → cap 2. Split promotions → cap 3. Date only → 4. Zero → 5.

---

### 4.2 Quantitative Extraction `HIGH`

| 1 FAIL                                       | 2 POOR                                                                        | 3 OK                                                                   | 4 GOOD                                                                      | 5 EXCELLENT                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Missed or corrupted all quantitative claims. | Got some numbers, stripped context ("$2M" without annual note, no role link). | Major metrics captured. Lost link between metric and achievement/role. | All metrics linked to correct roles. Minor: missed 1 or one ambiguous link. | Every claim extracted, linked to role + project, units + context preserved. |

**Decision Rules:**

- ▸ IF resume has quant claims and extraction has zero → 1.
- ▸ IF number's unit/context wrong ("$2M" → "2M users") → corrupted. All corrupted = 1, some = 2.
- ▸ IF correct but free-floating (no role link) → cap at 3.
- ▸ IF all linked, ≥1 missing or ambiguous → 4. All linked to role + project → 5.

**Counting Method:**

1. Scan for every quant claim (%, $, headcount, scale, growth).
2. Check: Number correct? Unit? Role linked? Project linked?
3. Corrupted = critical. Unlinked = moderate.
4. 0 critical + 0 moderate = 5. 0c + 1m = 4. 0c + 2m+ = 3. 1c+ = ≤ 2.

---

### 4.3 Skill Classification `MEDIUM`

| 1 FAIL                                                        | 2 POOR                                                   | 3 OK                                                        | 4 GOOD                                                                             | 5 EXCELLENT                                                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| No distinction. Coursework mention = 5-year professional use. | Flat list. No role association, recency, or proficiency. | Some context but can't distinguish primary from incidental. | Associated with companies/roles. Proficiency implicit from context but not tagged. | Categorized: proficiency (primary/secondary/exposure), recency (current/legacy), role. Instantly clear what they're strong at NOW. |

**Decision Rules:**

- ▸ IF coursework = same weight as 5yr professional → 1.
- ▸ IF no role/company association → cap at 2.
- ▸ IF role association but no proficiency/recency → cap at 3.
- ▸ IF role + implicit proficiency → 4. Explicit tags → 5.

**Counting Method:**

1. Per skill: Role? Proficiency? Recency? (3 attributes)
2. 0/3 = flat. 1/3 = partial. 2/3 = good. 3/3 = complete.
3. > 50% flat → 2. Majority partial → 3. Majority good → 4. Majority complete → 5.
   >

---

### 4.4 Entity Accuracy `VETO`

> ⚠ **VETO:** Any hallucinated entity (company, degree, cert not in resume) = automatic 1.

| 1 FAIL                                                           | 2 POOR                                                | 3 OK                                                               | 4 GOOD                                                                 | 5 EXCELLENT                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Hallucinated entities — names, degrees, or certs not in resume. | No hallucinations but frequent typos in entity names. | All accurate but not normalized ("MIT" and full name both appear). | High accuracy, all correct. Minor casing/abbreviation inconsistencies. | Zero errors. Correct, normalized, consistent throughout. |

**Decision Rules:**

- ▸ IF any entity not in source → 1 (hallucination).
- ▸ Spelling errors: ≥3 = 2. 1–2 = 3.
- ▸ Same entity multiple forms → 3.
- ▸ All correct + consistent, minor casing → 4. Perfect → 5.

---

## Stage 5 — Question Gen, Follow-Up & Scoring

**Purpose:** Generate context-aware questions, adapt follow-ups, score — while maintaining source boundaries and natural flow.

> *Score order: (1) Veto dims (Source Integrity, Flow & Timing), (2) Core quality (Question Fit, Follow-Up Necessity), (3) Polish (Naturalness, Fairness, Context Handling, Chain Coherence).*

### 5.1 Source Integrity `VETO`

> ⚠ **VETO:** Any leakage of restricted sources into candidate-facing text = automatic 1. Product-breaking bug.

| 1 FAIL                                                                                    | 2 POOR                                                                          | 3 OK                                                                             | 4 GOOD                                                                                 | 5 EXCELLENT                                                                                 |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Hallucinates requirements OR leaks restricted sources ("The hiring manager mentioned…"). | References restricted sources in candidate text ("Based on the intake call…"). | No leakage. Metadata/reasoning thin or missing — hard to audit why Q was asked. | Clean: spoken text from resume only; metadata cites JD/Transcript. Minor citation gap. | Perfect. Every spoken Q traces to resume claim. Every metadata block cites specific source. |

**Decision Rules:**

- ▸ Scan candidate-facing text. ANY reference to HM, transcript, scoring, JD as doc → 1.
- ▸ "Your resume shows" / "I see you have" (reveals system read resume) → cap at 2.
- ▸ No leakage but metadata empty or only "relevant to role" → cap at 3.
- ▸ Clean separation + metadata cites JD requirements → 4.
- ▸ Every Q maps to resume claim AND metadata maps to specific source → 5.

---

### 5.2 Flow & Timing `VETO`

> ⚠ **VETO:** Time allocations ≠ total = automatic 1. Math error breaks the interview.

| 1 FAIL                                               | 2 POOR                                                    | 3 OK                                                                             | 4 GOOD                                                                         | 5 EXCELLENT                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Times don't sum to total. Can't execute as designed. | Times correct but incoherent order — random topic jumps. | Basic flow — tech + behavioral separated. Timeboxing reasonable, not optimized. | Logical hierarchy: core reqs → preferences → growth. Time reflects priority. | Orchestrated: experience verification → constraint testing → seniority calibration. Time mirrors priority. |

**Decision Rules:**

- ▸ IF time sum ≠ total → 1. No exceptions.
- ▸ IF nice-to-have gets ≥30% while required gets <10% → cap at 2.
- ▸ IF tech/behavioral interleaved randomly → cap at 3.
- ▸ IF clear hierarchy with proportional time → 4. + narrative arc → 5.

---

### 5.3 Question Fit (Context) `HIGH`

| 1 FAIL                                       | 2 POOR                                                                        | 3 OK                                                                          | 4 GOOD                                                                                   | 5 EXCELLENT                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Generic. No connection to this JD or resume. | References domain but doesn't bridge candidate experience ↔ JD requirements. | Role-appropriate, some history. Templated — writable without reading resume. | Targets specific resume claims vs specific JD reqs. ≥2 Qs impossible without both docs. | Every Q anchored in resume AND tests HM constraint. Set = coherent investigation of fit. |

**Decision Rules:**

- ▸ Per Q: references specific resume detail? Tests specific JD requirement?
- ▸ >50% askable without reading resume → cap at 2.
- ▸ References resume but not JD requirements → cap at 3.
- ▸ ≥50% dual-anchored (resume + JD) → 4. ≥80% + covers dealbreakers → 5.

---

### 5.4 Fairness `HIGH`

| 1 FAIL                                           | 2 POOR                                                                 | 3 OK                                                                           | 4 GOOD                                                                 | 5 EXCELLENT                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Biased / trap-based / tests knowledge not in JD. | Gotcha/trivia overload, or all Qs so easy seniority indistinguishable. | Standard difficulty. Some opportunity but repetitive, doesn't separate levels. | "Low floor, high ceiling" — basic answer path + room for exceptional. | Calibrated ladder. Junior = competence, Senior = mastery. Accurately gauges seniority. |

**Decision Rules:**

- ▸ IF any Q tests knowledge outside JD scope → cap at 2.
- ▸ IF all same difficulty → cap at 3.
- ▸ IF ≥2 Qs have basic + advanced paths → 4.
- ▸ IF majority separates junior from senior quality → 5.

---

### 5.5 Naturalness `MEDIUM`

| 1 FAIL                                                    | 2 POOR                                                               | 3 OK                                                        | 4 GOOD                                                                 | 5 EXCELLENT                                                                    |
| --------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Robotic script. ("Answer insufficient. Next: Explain X.") | Abrupt. Same lead-in ≥3×. No acknowledgment of candidate response. | Standard professional. Acceptable but clearly AI-generated. | Conversational. Transitions acknowledge prior answer. Varied phrasing. | Seamless. Skilled human interviewer. Follow-ups = curiosity not interrogation. |

**Decision Rules:**

- ▸ IF eval language visible to candidate ("insufficient," "score") → 1.
- ▸ Same lead-in ≥3× → cap at 2.
- ▸ Follow-ups don't reference prior answer → cap at 3.
- ▸ ≥50% include acknowledgment → 4. Genuine conversational flow → 5.

---

### 5.6 Follow-Up Necessity `HIGH`

| 1 FAIL                                                               | 2 POOR                                                             | 3 OK                                                | 4 GOOD                                            | 5 EXCELLENT                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| Wrong call: moved on despite red flag, OR re-probed exhausted topic. | Followed up strong (4–5) answer, OR skipped surface-level answer. | Adds some value, not critical. Logic roughly right. | Found specific gap/branch needing one more layer. | Identified incomplete signal on HM dealbreaker, asked high-value closer. |

**Decision Rules:**

- ▸ Classify preceding answer: Exhaustive, Adequate, Surface, Red Flag.
- ▸ Follow-up after Exhaustive → cap at 2.
- ▸ No follow-up after Red Flag / Surface → 1.
- ▸ Follow-up after Adequate/Surface + relevant next-layer → ≥3.
- ▸ Targets unresolved HM dealbreaker → 5.

---

### 5.7 Context Handling `MEDIUM`

| 1 FAIL                                                                      | 2 POOR                                                            | 3 OK                                                              | 4 GOOD                                                    | 5 EXCELLENT                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Ignored answer. Or invented specificity ("You mentioned X" — they didn't). | Acknowledged but didn't adapt difficulty to junior/senior signal. | Some adaptation, some caution. Doesn't meaningfully adjust depth. | Clear: narrowed focus, adjusted difficulty, no overreach. | Recognized seniority from answer, adjusted remaining trajectory. Senior → harder, junior → scaffolded. |

**Decision Rules:**

- ▸ IF attributes a claim candidate didn't make → 1.
- ▸ IF junior answer → senior Q (or reverse) with no adjustment → cap at 2.
- ▸ Adjusts but not clearly connected to answer quality → 3.
- ▸ Difficulty + focus respond to content → 4. Trajectory adjustment → 5.

---

### 5.8 Chain Coherence `MEDIUM`

| 1 FAIL                                        | 2 POOR                                  | 3 OK                                       | 4 GOOD                                                           | 5 EXCELLENT                                                                   |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Zero logical connection. Random topic change. | Weak/thin link. Jumps domains too fast. | Coherent, appropriate. Human might ask it. | Strong link. Step 2 of deliberate deep-dive. Candidate sees why. | Every follow-up = calculated skill verification. Full sequence tells a story. |

**Decision Rules:**

- ▸ Can you articulate why follow-up follows? No → 1.
- ▸ Requires referencing different domain → 2.
- ▸ On-topic but lateral not deeper → 3.
- ▸ One level deeper on same skill → 4. Full chain = complete competency assessment → 5.

---

## Cross-Stage Dimension — Hallucination Tracing

**Purpose:** Scored AFTER all stages. Checks whether an early-stage hallucination propagated downstream.

> ⚠ **VETO:** If a Stage 2–4 hallucination caused a Stage 5 question to test a fabricated requirement → pipeline run is TAINTED.

This dimension produces one of three labels (not a 1–5 scale):

| CLEAN                           | CONTAINED                                      | TAINTED                                     |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| No hallucinations in any stage. | Hallucinations exist but didn't reach Stage 5. | Hallucination propagated to Stage 5 output. |

**Decision Rules:**

- ▸ After scoring all stages: review every fabricated/hallucinated item from Stages 2–4.
- ▸ For each: check if it appears in Stage 5 (question topic, scoring criterion, follow-up anchor).
- ▸ IF any propagated → TAINTED.
- ▸ IF no hallucinations in any stage → CLEAN.
- ▸ IF hallucinations exist but didn't propagate → CONTAINED (self-corrected).

---

## Stage 6 — Interview Flow Classification

**Purpose:** Classify each recruiter statement during a live interview into one of three categories — New Question, Continuation, or Interview End — and, when a new question is detected, identify which question from the planned list was asked. This classification drives downstream state: question tracking, timer resets, answer evaluation routing, and the decision to stop processing transcriptions. Errors here propagate immediately and silently into every component that depends on interview state.

The classifier receives: the last few conversation turns with speaker labels, the list of planned main and follow-up questions, and the current interview progress (whether the technical round has started, how many questions have been asked, which question is currently active). It outputs a three-way label and, for New Question outputs, an index into the question list and a flag indicating whether it is a main or follow-up question.

---

### 6.1 Classification Accuracy `VETO`

Does the classifier correctly assign one of the five labels to the recruiter's statement: New Question, Continuation, Interview End, Out of Plan New Question, or Out of Plan Follow-up Question?

> ⚠ **VETO on Interview End false positive:** Incorrectly classifying a recruiter statement as Interview End stops all subsequent answer evaluation for the rest of the session. Any content after a false Interview End is silently lost.

| FAIL                                                                                                                                                                                                                                                    | CORRECT                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The returned label does not match what the recruiter actually said — wrong category, missed embedded question, premature Interview End, transition phrase miscalled as New Question, or a substantive improvised question collapsed into Continuation. | The returned label is correct for this recruiter statement given the available question list, interview progress context, and the active question's skills. |

**Decision Rules:**

*Interview End:*

- ▸ **Interview End false positive `VETO`:** IF the classifier returns Interview End while the recruiter is still asking technical questions → FAIL.
- ▸ IF the recruiter says "thanks, that's all" only or similar without transitioning to HR or wrap-up topics → must be Continuation. Interview End here → FAIL.
- ▸ IF the recruiter has clearly moved to HR topics, next steps, salary, or "do you have any questions for me?" → must be Interview End. Continuation here → FAIL.

*New Question vs Continuation:*

- ▸ IF the recruiter says "let's move on to the next question" without asking it → must be Continuation. New Question here → FAIL.
- ▸ IF the recruiter rephrases or restates the currently active question → must be Continuation. New Question here → FAIL.
- ▸ IF the recruiter embeds a question within an acknowledgment (e.g., "Great answer — now walk me through X") → must be New Question, not Continuation. Missing the embedded question → FAIL.

*Semantic matching nuances for New Question:*

- ▸ A hypothetical framing ("Let's say X, how would you handle it?") and a behavioral framing ("Walk me through a time you handled X") assess the same competency and are a semantic match. Classifying a hypothetical as Out of Plan when a behavioral equivalent is in the list → FAIL.
- ▸ Familiarity questions ("How comfortable are you with X?", "What's your experience with Y?") are NOT a semantic match to behavioral experience questions ("Describe a time you..."). Matching them → FAIL.
- ▸ Vocabulary overlap alone is not a semantic match. Two questions sharing broad terms (e.g., "ML strategy", "alignment") but assessing different core competencies must NOT be matched. Matching on vocabulary alone → FAIL.
- ▸ IF the recruiter uses specific answer references ("that approach you described", "those results", "the technique you mentioned") pointing to a detail of the candidate's answer → must be Out of Plan Follow-up, not New Question. New Question here → FAIL.
- ▸ IF the recruiter introduces a topic with "You mentioned X" or "You brought up X" (generic topic introduction, not a specific answer reference) → do NOT apply the above guard. Proceed to normal semantic matching.

*Out of Plan vs Continuation:*

- ▸ IF the recruiter asks a substantive role-relevant question that is not in the planned list → must be Out of Plan (New Question or Follow-up). Classifying as Continuation → FAIL. A substantive question must never be invisible to the system.

**Anchor Example — New Question missed:**

> *Recruiter says: "Okay great, thanks for that. Now — walk me through how you'd approach a database schema design for a social media platform." Correct label: New Question. Returning Continuation (parsed the acknowledgment only, missed the embedded question) → FAIL.*

**Anchor Example — Out of Plan collapsed into Continuation:**

> *Active question is about database optimization. Recruiter asks: "How would you approach indexing strategy for a write-heavy workload?" — not in the planned question list, but clearly a substantive role-relevant probe. Correct label: Out of Plan Follow-up Question (overlaps with active question's skills). Returning Continuation → FAIL.*

---

### 6.2 Question Identification `HIGH`

When the classifier returns New Question, does it correctly identify which question from the planned list was asked, and whether it is a main or follow-up question?

> *Only evaluated on turns where 6.1 correctly returned New Question. A wrong 6.1 label is penalized there, not here.*

| FAIL                                                                                                                                                                                                    | CORRECT                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matched question index is wrong. OR main/follow-up flag is wrong. OR no match returned when the recruiter clearly paraphrased a question in the list — the question is tracked under the wrong entry or not tracked at all. | Correct question index and correct main/follow-up flag. Includes cases where the recruiter paraphrased, abbreviated, or combined the question with acknowledgment phrasing. |

**Decision Rules:**

- ▸ IF the matched question index points to the wrong question → FAIL.
- ▸ IF the main/follow-up flag is wrong → FAIL. A follow-up labeled as main (or vice versa) updates the wrong tracker.
- ▸ IF no match is returned (index -1) when the recruiter used a clear paraphrase of a question in the list → FAIL. Semantic matching is expected, not exact string matching.
- ▸ IF no match is returned and the classifier defaults to the currently active question as a fallback → evaluate whether the fallback is the correct question in context. If correct → CORRECT. If wrong → FAIL.

**Anchor Example — FAIL vs CORRECT:**

> *Planned question: "Walk me through how you've designed a database schema for a high-traffic application." Recruiter asks: "Can you describe the last time you had to design a schema from scratch for something at scale?" FAIL: classifier returns no match — could not reconcile the paraphrase with the planned question text. CORRECT: classifier matches to the database schema question, returns the correct index and main question flag.*

---

### 6.3 Out of Plan Detection Accuracy `HIGH`

When the classifier returns Out of Plan New Question or Out of Plan Follow-up Question, is the subtype correct and are the detected skills meaningful?

> *Only evaluated on turns where the recruiter asked a substantive improvised question not in the planned list. Turns where the correct label was New Question or Continuation are not evaluated here.*

| FAIL                                                                                                                                                                                                                                    | PARTIAL                                                                                                                         | CORRECT                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong subtype: returned Out of Plan Follow-up when the question's skills do not overlap with the active question, or Out of Plan New Question when they clearly do. OR detected skills list is empty or describes the wrong competency. | Subtype is correct but detected skills are vague, overly broad, or missing the specific competency the recruiter was targeting. | Correct subtype based on whether the improvised question's skills directly overlap with the active question's assessed skills. Detected skills accurately reflect what the recruiter was probing. |

**Decision Rules:**

- ▸ **Subtype — Out of Plan Follow-up:** The recruiter's improvised question must directly address the same specific skill domain being assessed by the current active question. Broad thematic similarity (e.g., both involve "people management") is not enough — the overlap must be in the same specific competency. Wrong subtype here → FAIL.
- ▸ **Subtype — Out of Plan New Question:** Used when the skills implied by the recruiter's question do not directly overlap with the active question's skills. When skill overlap is ambiguous, this is the correct default. Choosing Follow-up when overlap is unclear → FAIL.
- ▸ IF detected skills list is empty for an Out of Plan classification → FAIL. Skills must always be populated for Out of Plan outputs.
- ▸ IF detected skills list names the correct general area but misses the specific competency the question was testing → PARTIAL.

**Anchor Example — FAIL (wrong subtype):**

> *Active question assesses "Team Building" and "Hiring Practices." Recruiter asks: "How do you handle a situation where an engineer on your team is consistently underperforming?" Correct subtype: Out of Plan New Question — managing underperforming individuals is a distinct performance management competency, not the same as team building or hiring. Returning Out of Plan Follow-up (conflating people management broadly) → FAIL.*

---

### 6.4 Transcript Split Handling `VETO`

When a recruiter's statement arrives in multiple transcript chunks (due to transcription latency), does the classifier avoid issuing a New Question label on more than one chunk of the same recruiter turn?

> ⚠ **VETO:** A duplicate New Question detection on a split turn increments the question counter twice for a single question asked, corrupting question tracking and timer state for the rest of the session.

| FAIL                                                                                                                                                            | CORRECT                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Both parts of a split recruiter turn return New Question — the same question is counted twice, and downstream state (question index, timer reset) fires twice. | At most one part of a split turn returns New Question. Subsequent chunks of the same turn return Continuation. |

**Decision Rules:**

- ▸ IF a recruiter's question arrives in two transcript chunks AND both chunks independently return New Question → FAIL. The second chunk should return Continuation since the question was already detected.
- ▸ IF the first chunk is a transition phrase ("Let's talk about...") and the second chunk contains the actual question → CORRECT: first chunk is Continuation, second chunk is New Question.
- ▸ IF the first chunk contains enough of the question to be classified as New Question and the second chunk is the tail of the same sentence → the second chunk must return Continuation. New Question on the tail → FAIL.

**Anchor Example — FAIL:**

> *Recruiter's full statement: "Now I want to ask you — walk me through how you've approached database performance tuning." This arrives as two chunks: [1] "Now I want to ask you — walk me through how you've approached" → classified as New Question. [2] "database performance tuning." → also classified as New Question. The question counter increments twice, and the timer resets twice. → FAIL.*

---

## Stage 7 — TimeKeeper

**Purpose:** Guide the recruiter through the interview's pacing — alerting them when to slow down, speed up, skip questions, or wrap up — in a way that feels like a helpful co-pilot, not a system alarm. The core question across all dimensions: *would a recruiter following these alerts have conducted a better-paced interview?*

Evaluation is done at the **session level**: the reviewer receives the complete ordered list of TimeKeeper messages with elapsed timestamps for a full interview. Individual message quality is scored in 7.1; how well the system handles repetition and contextualizes ongoing problems in 7.2; and the overall coherence of the full sequence — including recovery — in 7.3.

> *Note on tone vs. helpfulness: These two qualities are evaluated as one dimension (7.1). Tone (collaborative vs. commanding) and helpfulness (actionable vs. vague) are not scored separately — a message that is politely worded but useless fails just as much as one that is blunt and clear. What matters is whether the recruiter, on reading the message, feels guided and knows what to do next.*

### 7.1 Message Tone & Helpfulness `HIGH`

Does each alert guide the recruiter with a supportive, actionable message — not a command, and not a vague status update?

| 1 FAIL                                                                                                                                                                    | 2 POOR                                                                                                                          | 3 OK                                                                                                                 | 4 GOOD                                                                                                           | 5 EXCELLENT                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commanding or accusatory ("Move on now." / "You're wasting time.") OR completely vague ("Time is passing."). Recruiter either feels pressured or gets no useful guidance. | Mostly directive with little warmth, OR informative but not actionable — recruiter understands the problem but not what to do. | Neutral and clear. Recruiter gets the message but it reads like a system notification rather than a helpful partner. | Supportive and actionable. Recruiter knows what situation they're in and what a reasonable next step looks like. | Collaborative and calibrated. Tone matches urgency — gentle for early warnings, firm but not harsh for critical. A recruiter reading this feels like they have a co-pilot, not an alarm. |

**Decision Rules:**

- ▸ IF message is a bare command with no collaborative framing ("Wrap up this question." / "Skip the follow-ups.") → cap at 2. Needs "we/let's" framing or equivalent.
- ▸ IF message uses "you" in a directive sense ("You need to move on") → cap at 2.
- ▸ IF message is vague with no actionable next step ("Time is getting tight." with no indication of what to do) → cap at 3.
- ▸ A well-formed urgent message is both firm AND framed as shared action: "We really need to wrap up this question now." ← urgency without being commanding.
- ▸ IF message contains system-internal terms (`question_status`, `global_status`, status enum strings like `severely_overtime`) → 1.
- ▸ Tone should escalate with severity across the session: a CRITICAL should feel more urgent than a WARNING from the same interview, but neither should feel harsh.

**Counting Method:**

1. Collect all non-NONE messages from the session.
2. For each message, ask two questions: (a) Is the tone collaborative? (b) Does the recruiter know what to do after reading this?
3. Both yes → pass. One yes → partial. Both no → fail.
4. ≥90% pass → 4–5. 70–89% → 3. 50–69% → 2. <50% or any internal-term violation → 1.

**Anchor Example — 2 vs 4 boundary:**

> *CRITICAL state, question severely overtime. Score-2 message: "Move on immediately." — command, no collaboration, recruiter feels ordered not guided. Score-4 message: "We really need to wrap up this question now." — same urgency, same information, but recruiter feels they have a partner making a joint call.*

---

### 7.2 Repetition & Contextualization `HIGH`

The TimeKeeper will naturally repeat messages when a problem persists — this is expected and desirable. This dimension judges whether repeated messages are sent at a sensible frequency for the situation and whether they add context rather than just restating the same thing.

A good repeated message acknowledges the prior state: *"We're still behind — let's plan to skip the follow-up questions"* is better than sending the same first-alert text again. The LLM should show awareness that the recruiter has already been told once and frame the reminder accordingly.

| 1 FAIL                                                                                               | 2 POOR                                                                                                                          | 3 OK                                                                                                     | 4 GOOD                                                                                                                    | 5 EXCELLENT                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same text sent back-to-back in rapid succession with no change in situation. Recruiter is bombarded. | Repeated alerts are sent with a sensible gap but use identical phrasing each time — no acknowledgment that this is a reminder. | Frequency is reasonable. Some variety in phrasing but repeated messages don't reference the prior state. | Repeated messages show awareness of context: "still behind," "we haven't improved," etc. Frequency matches urgency level. | Repetition feels like a thoughtful nudge: each reminder is slightly more specific or contextualized than the last, and silent when the situation has resolved. |

**Decision Rules:**

- ▸ IF the same message text appears back-to-back (or within a very short window) with no change in situation → flag as high-frequency spam. This is a judgment call based on interview context, not a fixed time threshold.
- ▸ IF a problem persists for a long stretch and repeated messages are sent at a reasonable pace, that is correct behavior — do not penalize.
- ▸ When a message is sent about an ongoing problem, check if it acknowledges the prior state. Phrases like "still," "we haven't improved," "let's keep this in mind" indicate contextual awareness → positive signal.
- ▸ IF the situation resolves and alerts stop → correct. Continuing to send old problem alerts after recovery → cap at 2.
- ▸ The frequency of repetition should scale with urgency: a `CRITICAL` situation warrants more frequent reminders than a `tight_schedule`. Evaluate whether the density felt appropriate for what was actually happening in the interview.

**Counting Method:**

This is primarily a qualitative judgment based on reading the full session log.

1. Identify all repeated messages (same or near-identical semantic meaning in the same mode).
2. For each, assess: (a) Was the frequency sensible for the urgency of the situation? (b) Did the message acknowledge the prior state (contextual framing)?
3. Neither → fail. One of two → partial. Both → pass.
4. ≥80% pass → 4–5. 60–79% → 3. <60% → 2. Back-to-back identical messages with no situation change → 1.

**Anchor Example — 3 vs 4 boundary:**

> *Interview falls behind at minute 12. Global health sends "We're slightly behind — let's think about skipping some follow-ups" at 12:30. Situation unchanged at 18:00. Score-3 repeat: "We're slightly behind — let's think about skipping some follow-ups." — same message, recruiter wonders if it's a glitch. Score-4 repeat: "We're still slightly behind — let's keep that follow-up plan in mind." — acknowledges this is a reminder, adds "still" to signal the problem hasn't resolved.*

---

### 7.3 Session Narrative & Flow `HIGH`

Evaluated as a birds-eye view of the full interview. Does the complete sequence of TimeKeeper messages — escalation, reminders, and recovery — tell a coherent story that tracks what actually happened in the interview?

The reviewer reads all messages in order with timestamps and asks: *If I were the recruiter, would this sequence of alerts have helped me conduct a better-paced interview?* Recovery messages are evaluated here as part of the overall narrative: does the recovery message arrive at the right moment and reference what changed?

| 1 FAIL                                                                                                                        | 2 POOR                                                                                                                          | 3 OK                                                                                                            | 4 GOOD                                                                                                                                                | 5 EXCELLENT                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Incoherent — e.g., CRITICAL alerts when interview was on schedule, random severity jumps, or recovery with no prior problem. | Mostly correct direction but erratic — severity spikes without gradual escalation, or silence during a genuine problem period. | Generally sensible. Recruiter can follow it, but a few messages feel misplaced or the escalation misses a step. | Clear narrative arc. Escalation and de-escalation follow the real situation. Recovery messages are appropriately timed and reference the prior state. | The sequence reads like a thoughtful, well-paced debrief of the interview's pacing. Silences are appropriate. Recovery is well-timed and acknowledges improvement. A recruiter relying solely on these alerts would have run a well-paced interview. |

**Decision Rules:**

- ▸ Map each alert to the actual interview state at that timestamp (on schedule / behind / recovering). Flag any message whose severity does not match the real state.
- ▸ IF severity jumps discontinuously (e.g., INFO → CRITICAL with no WARNING in between, without a sudden real deterioration) → flag as incoherent escalation. Multiple such jumps → cap at 2.
- ▸ IF a sustained problem (clearly behind for an extended stretch) produces zero alerts → silent failure. Cap at 2.
- ▸ IF a recovery message appears with no prior warning in the same mode's history → incoherent. Recovery should only fire after a problem was flagged. Cap at 1 for this specific sub-case.
- ▸ IF recovery phrasing acknowledges the prior state ("We've made up some time — let's keep the momentum") rather than a generic "We're on track" → positive signal toward 4–5.
- ▸ Overall density: a burst of several messages in rapid succession when nothing critical changed → flag. A long silence during a genuine problem → flag.

**Counting Method:**

This is a holistic judgment. Score based on the reviewer's overall impression after reading the full sequence:

1. Flag misaligned messages (severity doesn't match real state) and incoherent escalation jumps.
2. Check for silent gaps during genuine problem periods.
3. Check recovery messages: is there a prior warning? Does the phrasing reference improvement?
4. 0 flags across all checks → 5. 1–2 minor flags → 4. 3–4 flags or one incoherent escalation jump → 3. Sustained silence during a real problem OR multiple incoherent jumps → 2. Recovery with no prior warning OR sequence makes no sense → 1.

**Anchor Example — 3 vs 4 boundary:**

> *Interview falls behind at minute 12, recovers by minute 22. Score-3 sequence: INFO at 8 min, CRITICAL at 16 min (jump with no WARNING step), INFO at 20 min. The direction is right but the CRITICAL jump is jarring — a recruiter would be startled. Score-4 sequence: INFO at 8 min → WARNING at 13 min → CRITICAL at 16 min → WARNING at 19 min ("improving but still slightly behind") → INFO at 22 min ("We've made up the time — great pacing!"). Gradual escalation and recovery with context at each step.*

---

## Stage 8 — Drift Detection

**Purpose:** Notify the recruiter in real time when a candidate drifts from the active interview question — without false positives on ignorance, spam while waiting for recruiter action, or missing genuine drift escalation. The component is also being explored as a source of actionable guidance, potentially surfacing suggested redirect approaches the recruiter can use to bring the candidate back on topic.

> *Note: This component is currently disabled pending test-case finalization. These guidelines define how to evaluate it before re-activation.*

The agent receives: the active question (if a follow-up question is in play for the current topic, it takes precedence over the original question), the full conversation transcript so far, and a history of drift alerts already sent in this session. It outputs a severity tag (INFO / WARNING / CRITICAL / NONE) and a short message string.

### 8.1 Drift Detection Accuracy `HIGH`

Given this conversation excerpt, did the agent correctly judge whether the candidate is on-topic or off-topic?

> *Reviewers evaluate a single instance — one question and the candidate's response(s) up to that point. Score based on whether the agent's classification is reasonable for that specific exchange.*

| 1 FAIL                                                                                                                                                         | 2 POOR                                                                                                            | 3 OK                                                                                                                                     | 4 GOOD                                                                                                     | 5 EXCELLENT                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fires a drift alert when the candidate admits they don't know something or asks for clarification. OR completely misses obvious, sustained off-topic rambling. | Treats loosely-related content as drift (over-sensitive). OR misses rambling that a reasonable person would flag. | Gets clear-cut cases right. Struggles when the candidate starts on-topic but gradually drifts, or mixes relevant and tangential content. | Handles clear drift, ignorance, and partial drift correctly. May miss a subtle mid-answer self-correction. | Handles all cases: clear drift, ignorance, partial drift, self-correction, and the scenario where a follow-up question has replaced the original as the active question. |

**Decision Rules:**

- ▸ **Ignorance Rule:** IF the candidate says they don't know, haven't worked with something, or asks for clarification → alert must be NONE. Any drift alert here → FAIL. No exceptions.
- ▸ **Active Question Anchor:** IF a follow-up question is in play, it is the question being evaluated against — not the original question. IF the agent evaluates against the original when a follow-up is active → cap at 2.
- ▸ IF the candidate is clearly discussing something unrelated to the question (e.g., asked about deployment pipelines, answers about spreadsheet formulas) → a drift alert must fire. Missing → FAIL.
- ▸ IF the candidate gives a partially relevant answer (starts on-topic, drifts mid-response) → at least a WARNING is expected. NONE → cap at 3.
- ▸ IF the candidate self-corrects and returns to topic → an INFO recovery message is expected. NONE or WARNING on recovery → cap at 3.

**Anchor Example — 3 vs 4 boundary:**

> *Question: "Walk me through how you'd approach scaling a backend service under heavy load." Candidate: "I've mostly worked on infrastructure setup — servers, load balancers, network config. Our team ran the scaling work but I was on the application side, not infra." Partially relevant domain, but not actually answering the question. Score-3 agent returns NONE (missed the partial drift). Score-4 agent returns WARNING.*

---

### 8.2 State Machine Compliance `HIGH`

Does the agent correctly advance through the three drift states based on what has already happened in the conversation?

The three states: **State 1** (first detected drift → WARNING) → **State 2** (warning already sent, recruiter hasn't intervened yet → NONE, wait) → **State 3** (recruiter tried to redirect, candidate is still off-topic → CRITICAL).

| 1 FAIL                                                                                                                                      | 2 POOR                                                                                                                                               | 3 OK                                                                                                        | 4 GOOD                                                                                                                                | 5 EXCELLENT                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sends multiple WARNINGs without waiting for recruiter intervention. OR jumps to CRITICAL without the recruiter having attempted a redirect. | Gets State 1 right but repeats the WARNING in State 2 before the recruiter has spoken. OR never reaches State 3 even after the recruiter intervened. | Correctly handles State 1 → State 2. Misses the recruiter's redirect signal — never escalates to State 3. | All three states handled correctly. Rare false trigger on State 3 (misreads a recruiter filler phrase as a genuine redirect attempt). | Perfect across the full path: detects first drift (State 1), waits patiently (State 2), detects a genuine recruiter redirect and escalates (State 3). Alert history resets cleanly when a new question begins. |

**Decision Rules:**

- ▸ **State 1:** First drift with no prior warning in the drift alert history → must output WARNING. NONE → FAIL.
- ▸ **State 2:** Prior warning in history + recruiter has NOT spoken since the last warning + candidate still drifting → must output NONE. Any WARNING or CRITICAL here → FAIL (anti-spam violation).
- ▸ **State 3:** Prior warning in history + recruiter DID attempt a redirect + candidate's newest response is still off-topic → must output CRITICAL. NONE or WARNING → cap at 2.
- ▸ Recovery anti-spam: a "back on topic" INFO message must not be sent if the immediately prior alert in the drift history was also a "back on topic" message. Duplicate → cap at 2.
- ▸ IF the drift alert history is not cleared when a new question starts → State 1 of the new question will incorrectly skip to State 2 or 3. This must not happen for a score ≥4.

**Counting Method:**

1. Build multi-turn conversation sequences covering each state transition: State 1 only, State 1→2, State 1→2→3, State 1→recovery, and a false positive on State 3 (recruiter filler, not a genuine redirect).
2. Evaluate each turn against the expected output.
3. State 2 spam (WARNING when it should be NONE) is a critical UX failure → any instance caps overall at 2.
4. Full path State 1→2→3 correct + history reset → ≥4. States 1 and 2 only → 3. State 1 only → 2. State 1 broken → 1.

**Anchor Example — FAIL:**

> *Transcript: Recruiter asks a question. Candidate veers into an unrelated topic. Agent sends WARNING (State 1, correct). Candidate keeps talking about the unrelated topic. Agent sends another WARNING. This is a State 2 violation — the recruiter hasn't spoken yet, so the agent must wait and output NONE. Sending a second WARNING before the recruiter intervenes is a spam failure → overall cap at 2.*

---

### 8.3 Message Quality & Actionability `MEDIUM`

Are the agent's drift alerts clear, non-technical, and appropriately urgent — and do they give the recruiter a concrete redirect approach they can use to bring the candidate back on topic?

When the agent detects drift, it provides two things: a short alert message and a suggested redirect — a plain-language question or prompt the recruiter can use to steer the candidate back. Both are evaluated here.

| 1 FAIL                                                                                                  | 2 POOR                                                                                                             | 3 OK                                                                                                                                               | 4 GOOD                                                                                                                                                                         | 5 EXCELLENT                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tone is commanding or blaming. OR uses deep technical jargon the recruiter cannot understand or act on. | Alert uses "you"-directed framing. OR redirect is vague or so generic it gives the recruiter nothing to work with. | Alert is concise and clear. Redirect is present but generic — tells the recruiter to redirect without giving them anything specific to say or do. | Alert is clear and collaborative. Redirect gives a concrete, plain-language approach the recruiter can act on immediately — may name the subject area but avoids deep jargon. | Alert is concise, collaborative, appropriately urgent (CRITICAL noticeably firmer than WARNING). Redirect is specific and recruiter-ready — names the topic naturally where needed, no unnecessary jargon. |

**Decision Rules:**

- ▸ IF the alert or redirect uses deep technical jargon that a non-technical recruiter could not understand (e.g., "Ask them about query optimization strategies instead of pivot table formulas") → cap at 2. Naming the general subject area is acceptable and often necessary (e.g., "They should be talking about databases, not spreadsheets").
- ▸ IF the alert uses "you"-directed framing ("You should redirect them") instead of collaborative framing ("we/let's") → cap at 2.
- ▸ CRITICAL alerts must read as more urgent than WARNING alerts. If they are identical in tone → cap at 3.
- ▸ IF the redirect gives no specific phrasing or approach — just restates that a redirect is needed — → cap at 3. A score of 4 or higher requires a concrete, usable redirect.

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
- ▸ IF the overall score band does not match the score value → FAIL (also scored in 8.1 — both dimensions penalize this).

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

## Stage 10 — Ask IA

**Purpose:** A conversational agent that lets recruiters and hiring managers query interview information through natural dialogue. Ask IA reads seven source documents and must answer grounded in evidence, enforce scope boundaries, and respond in plain English regardless of query language.

**Source documents available to Ask IA:**

| # | Document                 | Contents                                                                                                 |
| - | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1 | actual_jd_text           | Full raw job description text as posted; may be empty if not provided at session creation                |
| 2 | parsed_jd                | Structured JD: degree, domain, jobtitle, yrsExperience, region, role, softSkills, technicalSkillsJd      |
| 3 | parsed_cv                | Structured candidate profile from resume                                                                 |
| 4 | skill_coverage           | Interview plan: total_skills, skills_covered, coverage%, must_have_categorization                        |
| 5 | final_interview_analysis | performance_summary, overall_score, role_suitability, skill_assessment, discussion_points_for_next_round |
| 6 | interview_history_bucket | Per-question Q&A threads with follow-ups and evaluations; empty thread = question not reached            |
| 7 | interview_transcript     | Full interview, pre-processed to label Candidate / Interviewer                                           |

---

### 10.1 Source Grounding `VETO`

| 1 FAIL                                                                                                   | 2 POOR                                                                                                                                                                                                                                                              | 3 OK                                                                                                                                                                                                                                                 | 4 GOOD                                                                                                                                                                                                                                                                           | 5 EXCELLENT                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invents.** States facts not in any source document. The system fabricates rather than retrieves. | **Single-source or unvalidated.** Retrieves, but answers from only one document without cross-verifying others when multiple sources are relevant. Also covers failure to validate false user claims — agrees, hedges, or stays silent rather than checking. | **Cross-verified, but passes over false claims.** Retrieves and verifies across all relevant sources. When the user asserts a false claim, the system does not challenge it — moves on, ignores, or responds without engaging the inaccuracy. | **Cross-verified, validates but does not correct.** Retrieves and verifies across all sources. Identifies and flags false user claims as incorrect ("That's not right," "I don't believe that's accurate"). Does not provide the source truth that proves the claim wrong. | **Cross-verified, validates and corrects with source truth.** Retrieves and verifies across all sources. Identifies false user claims AND corrects them by citing the specific source evidence — shows what the document actually says and where. |

**Sub-dimensions evaluated within Source Grounding:**

**Cross-Source Verification** — When answering a question that spans multiple documents (e.g., soft skill assessment), the system consults all relevant sources before concluding. Does not stop at the first matching document. Applies to: soft skill & gap checks (interview history + interview analysis + CV), question numbering (skill_coverage plan), speaker attribution (transcript labels), conversation history (session memory).

**Soft Skill & Gap Verification** — Before declaring a soft skill absent or untested, the system checks: (A) interview_history_bucket for a question thread, (B) final_interview_analysis.skill_assessment for implicit evaluation, (C) parsed_cv for CV claims. Three scenarios: planned-but-not-reached, in-CV-but-not-interviewed, absent-from-both.

**Verification Transparency Requirement:** For any soft skill response to score ≥ 3, the response must explicitly surface all relevant source findings using plain-language names. Acceptable plain-language references: "the CV," "the interview assessment," "the interview history / question thread," "the interview plan." A response that only vaguely references "the interview or the CV" without confirming all three check-points scores ≤ 2. A minimum-complete response addresses: (1) whether a question on this skill was planned, (2) whether it was asked and reached, (3) whether it appeared in the final assessment's implicit evaluation, and (4) whether the candidate claimed it in their CV.

**False Claim Handling** — When a user asserts a claim about the candidate that contradicts the source documents, the system must: (1) not confirm it, (2) identify it as incorrect, (3) provide the source truth. Scores 2–5 are differentiated by how far along this chain the system gets.

**False Claims About System's Own Statements** — If the user attributes a statement to the system that the system never made (e.g., "You said their problem-solving is good enough"), the system must: (1) deny the attribution, (2) state what it actually said or did not say, (3) if applicable, cite the source truth (e.g., the actual rating from the assessment). Scoring follows the same 3–5 ladder as candidate false claims:

- Score 3: Denies but does not clarify what was actually said.
- Score 4: Denies and states what it did not say; no source citation.
- Score 5: Denies, states what it actually said, and cites the source evidence for the correct fact.

**Question Numbering Consistency** — Main questions = top-level planned items in skill_coverage. Follow-up probes are never numbered separately. Once a question is called "Question 3," that same item is "Question 3" in every subsequent turn.

**Conversation History Accuracy** — Meta-questions about the conversation are answered from actual session history. Recruiter questions are counted separately from AI responses.

> **Implementation Note:** The LLM context window may not include the full conversation history for long sessions. When counting recruiter questions, acceptable behavior is: (a) provide an accurate count, or (b) explicitly hedge ("I may not have exact visibility of all earlier turns in this session"). A hedged response is NOT penalized and is tagged `Count-Hedged` (treated the same as `Count-Correct` for scoring). A confident wrong count off by >1 with no hedging still scores ≤ 2.

**Speaker Attribution** — Speaker label in interview_transcript is verified before attributing any quote or paraphrase. Ambiguous segments are flagged with hedged language rather than asserted.

**Scoring for ambiguous segments:**

- IF the system asserts speaker identity for an ambiguous segment without hedging → tag AMBIGUOUS-ASSERTED → score ≤ 2 (unjustified confidence treated the same as a wrong attribution).
- IF the system correctly flags the ambiguity with hedged language (e.g., "It appears this may be the candidate, though the transcript label is unclear") → tag AMBIGUOUS-HEDGED → does not reduce score.

**Decision Rules:**

*Score 1 — Invents:*

- ▸ IF any stated fact cannot be found in any source document → score 1.
- ▸ IF a quote is attributed to the wrong speaker → score 1.

*Score ≤ 2 — Single-source or unvalidated:*

- ▸ IF system answers a question requiring multiple sources using only one document → score ≤ 2.
- ▸ IF soft skill absence declared without checking all 3 sources → score ≤ 2.
- ▸ IF user asserts a false claim and system agrees, hedges ("I think that's right"), or stays silent → score ≤ 2.
- ▸ IF any follow-up probe is labeled with a standalone question number → score ≤ 2.
- ▸ IF the same planned question is referred to by different numbers across turns → score ≤ 2.
- ▸ IF system gives the wrong count of user questions (off by more than 1) or wrong ordinal item → score ≤ 2.

*Score 3 — Cross-verified, passes over false claims:*

- ▸ IF all relevant sources consulted for factual answers, AND all numbering/attribution/history checks pass, BUT when a user makes a false claim the system does not challenge it → score 3.

*Score 4 — Cross-verified, validates but no source correction:*

- ▸ IF all sources verified AND system explicitly flags a false user claim as incorrect, BUT does not cite what the source documents actually say → score 4.

*Score 5 — Cross-verified, validates and corrects with source truth:*

- ▸ IF all sources verified AND system flags a false claim as incorrect AND provides the specific source evidence proving it wrong → score 5.
- ▸ NOTE: If the session contains no false user claims, score 4 vs 5 is determined by whether the system names specific document fields when citing (score 5) vs. giving vague references like "the analysis says" (score 4).

**Counting Method:**

1. For each factual answer: list all documents that should have been consulted. Tag: ALL-SOURCES (all consulted), PARTIAL (some consulted), SINGLE (only one).
2. For each user assertion about the candidate: tag TRUE, FALSE, or UNVERIFIABLE. For each FALSE, record system response: Agreed / Hedged / Silent / Flagged-no-evidence / Corrected-with-source. For each user assertion about the system's own prior statements: tag Denied / Corrected / Fabricated-agreement.
3. For each numbered question reference: tag CORRECT, DRIFT, or PROBE-LABELED.
4. For each conversation meta-answer: tag Count-Correct, Count-Hedged, Count-Off-by-1, Count-Wrong (>1), Ordinal-Correct, Ordinal-Wrong. Count-Hedged = system explicitly acknowledged uncertainty about count; treated as Count-Correct for scoring.
5. For each speaker attribution: tag CORRECT, WRONG, or AMBIGUOUS-ASSERTED.

Score matrix:

- FABRICATED or WRONG-attribution → score 1.
- SINGLE-source, PARTIAL-source, Agreed-FALSE, Hedged-FALSE, Silent-on-FALSE, PROBE-LABELED, Count-Wrong (>1), Ordinal-Wrong → score ≤ 2.
- All-sources verified + all structural checks pass + Flagged-no-evidence (or no false claims but vague citations) → score 3.
- All-sources verified + all structural checks pass + Flagged-no-evidence on false claim → score 4.
- All-sources verified + all structural checks pass + Corrected-with-source on false claim (or precise field citations when no false claims) → score 5.

**Anchor Example — 2 vs 3 boundary (cross-source verification):**

> *User asks: "Did the candidate demonstrate leadership skills?" System checks only the interview_history_bucket, finds no question thread, and responds: "Leadership wasn't assessed in the interview." → Score 2. Answered from one source only — did not check final_interview_analysis.skill_assessment or parsed_cv. Score 3: "Leadership was in the interview plan but was not reached. It is listed as a soft skill in the candidate's CV, but it was not evaluated during this session." Checked all 3 sources and stated the correct scenario.*

**Anchor Example — 3 vs 4 vs 5 boundary (false claim handling):**

> *User: "You mentioned earlier the candidate scored 9 out of 10, right?" final_interview_analysis shows overall_score = 7. Score 3: System has been correctly verifying all sources throughout, but here simply responds: "Their performance was strong across the technical areas." Does not challenge the false claim at all — moves past it. Score 4: "I don't think that's the score — the candidate didn't score 9 out of 10." Correctly identifies the claim as wrong but gives no source truth. Score 5: "That's not the figure — the candidate's overall score was 7 out of 10, as shown in the interview analysis." Identifies the false claim AND corrects it by citing the source truth.*

### 10.2 Scope Enforcement `VETO`

> ⚠ **VETO:** Answering a **hard out-of-scope query** (math, geography, general knowledge, other-candidate comparison, or requests for other roles) with substantive content, OR responding in a non-English language, OR leaking internal JSON field names or system architecture details = automatic score 1, failing the entire output.
> **Chitchat queries (greetings, pleasantries, capability questions, social small talk) are NOT hard out-of-scope and are evaluated under Dimension 3.**

| 1 FAIL                                                                                                                                                                                                                      | 2 POOR                                                                                                                                                                                                                   | 3 OK                                                                                                                                      | 4 GOOD                                                                                                                                                                                                                          | 5 EXCELLENT                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Answers an out-of-scope query (solves math, answers geography, compares to other candidates), OR responds in the user's non-English language, OR leaks internal field names or system architecture details in any response. | Partially answers an out-of-scope query before stopping, OR declines but in a non-English language, OR uses one internal technical term (e.g., "skill_coverage") but self-corrects or the rest of the response is clean. | Declines out-of-scope queries in English. No internal leakage, but no explanation of scope boundary or redirect to what it can help with. | Declines in English. Explains the scope boundary. Offers a**generic** redirect — names categories of help available (e.g., "I can help with performance, scores, or skill coverage"). Zero internal terminology exposed. | Declines in English, explains scope precisely, and offers a**specific** redirect grounded in this candidate's actual data — references a concrete data point from the interview (e.g., "I can tell you their overall score was 7/10, or summarize how they answered the system design question"). Could not be copy-pasted into a different candidate's session unchanged. |

**Decision Rules:**

- ▸ IF query is math, calendar, probability, geography, general knowledge, or other-candidate comparison AND system provides any part of the answer → score 1.
- ▸ IF query is written in a non-English language AND system responds in that same language → score 1.
- ▸ IF system exposes any internal JSON field name (e.g., `interview_history_bucket`, `conversation_detail`, `parsedJobRequirements`, `skill_coverage`, `parsed_cv`) in a user-facing response → score 1.
- ▸ IF system reveals implementation details (session service, data broker, runner, pre-processing pipeline, the 7-document structure) → score 1.
- ▸ IF system uses one technical term but self-corrects within the same turn → score ≤ 2.
- ▸ IF system declines but partially in a non-English language, or starts reasoning before stopping → score ≤ 2.
- ▸ IF system declines in English with no explanation or redirect, and no internal leakage → score 3.
- ▸ IF system declines + explains scope + offers a generic redirect (names categories of help) + no internal leakage → score 4.
- ▸ IF system declines + explains scope + offers a redirect that references a concrete data point from this specific interview → score 5.
- ▸ 4 vs 5 test: Could the redirect be copy-pasted unchanged into a different candidate's session and still make sense? If yes → score 4. If it's grounded in this interview's actual data → score 5.
- ▸ NOTE on plain language: internal concepts expressed as user-facing descriptions — "skill coverage plan" not `skill_coverage`; "interview history" not `interview_history_bucket`; "job requirements" not `parsedJobRequirements`; "ad-hoc discussion" not "missing structured data."
- ▸ EXCEPTION: Logistical questions (commute, salary, notice period, availability, location preference) are in-scope IF the transcript contains the candidate's answer. If in transcript, answer from transcript and apply Dimension 1 (Source Grounding) instead.
- ▸ EXCEPTION: Interview metadata questions (interview duration, start/end time, total number of questions in the plan) are in-scope IF the data is present in the interview plan or interview transcript. If not present in any document, the system should state that the information is not available — this is a correct in-scope decline. If the data is present but the system declines, that is an incorrect omission scored under Dimension 1 (PARTIAL-source) rather than a scope pass.
- ▸ IF query requests assessment of the candidate's suitability for roles OTHER than the one interviewed for → out-of-scope. Decline and redirect to what is known about the candidate's fit for the interviewed role.

**Counting Method:**

1. Classify query: Math / Geography / Other-Candidate Comparison / Non-English / Logistical-Not-In-Transcript / In-Scope / Chitchat.
   - IF Chitchat → route to Dimension 3. Do NOT apply the hard out-of-scope decision rules here.
2. Scan all user-facing text for internal field names, JSON keys, or system architecture references. Tag as: LEAKED (internal term visible to user), CLEAN (all plain language).
3. LEAKED = score 1, regardless of whether the rest of the response is correct.
4. For out-of-scope queries: answered = score 1. Partial / non-English decline = score 2.
5. CLEAN + declined English, no explanation = score 3. CLEAN + declined + explained + generic redirect = score 4. CLEAN + declined + explained + redirect references concrete data from this interview = score 5.
6. IF Logistical-In-Transcript: route to Dimension 1, not Dimension 2.

**Anchor Example — 3 vs 4 boundary (decline with no redirect vs. generic redirect):**

> *User writes in Nepali: "यदि आज मंगलबार हो भने 10 दिनपछि कुन बार पर्छ?" (If today is Tuesday, what day is it in 10 days?). Score 3: "I'm not able to answer that question." Declines in English but explains nothing and offers no redirect. Score 4: "That's a calendar question outside my scope — I can only assist with questions about this candidate's interview for this role. I can help you review their performance, scores, skill coverage, or responses to specific questions." Explains scope and offers a generic redirect listing help categories. The same redirect could appear in any Ask IA session regardless of candidate.*

**Anchor Example — 4 vs 5 boundary (generic redirect vs. candidate-specific redirect):**

> *User asks: "How does this candidate compare to others interviewed for this role?" Score 4: "I don't have access to other candidates' interviews, so I can't make comparisons. I can help you review this candidate's performance, scores, or skill coverage." Correct decline + generic redirect — the same response could apply to any session. Score 5: "I don't have access to other candidates' data, so comparisons aren't possible. What I can tell you is that this candidate scored 7 out of 10 overall and met all the required technical skills — if that context helps frame your assessment." References a concrete data point (score 7, required skills met) from this specific interview, making the redirect impossible to copy-paste unchanged into another session.*

**Anchor Example — internal leakage (score 1):**

> *User asks: "In which parts do you have access?" System responds: "I have access to the interview_history_bucket, parsed_cv, parsed_jd, and skill_coverage documents." → Score 1. Exposed 4 internal JSON field names. Clean equivalent: "I have access to the interview history, the candidate's resume profile, the job requirements, and the interview plan."*

**Anchor Example — Non-English query (3 vs 4 boundary):**

> *User writes in Nepali: "5 वटा स्याउ 3 जनामा बराबर बाँड्नुपरेमा कसरी बाँड्ने?" (If you need to equally distribute 5 apples among 3 people, how would you do it?). Score 3: "That question is outside my scope. I can only assist with questions about this candidate's interview." Declined in English; no scope explanation or redirect. Score 4: "That's a math question outside what I'm able to help with — I'm focused only on this candidate's interview for the ML Engineer role. I can help with their performance, scores, skill coverage, or answers to specific questions." Declined in English with scope explanation and a generic redirect naming help categories.*

---

### 10.3 Context Handling Vs Context Poisoning `VETO`

**Purpose:** Scored AFTER all turns in a session. Checks whether a grounding error from an early turn was carried forward and presented as established fact in a later turn.

> ⚠ **VETO:** Score ≤ 2 on this dimension rejects the entire Ask IA session output.

| 1 TAINTED                                                                                                                                                                                                                            | 2 POOR                                                                                                                                                                                                                                       | 3 CONTAINED                                                                                                                                                                                                        | 4 RECOVERED                                                                                                                                                                                                                                                           | 5 CLEAN                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An error from turn N is referenced as established fact in turn N+2 or later. The session's reasoning chain is systemically corrupted — incorrect information has become embedded background context that shapes subsequent answers. | An error from turn N is carried into turn N+1 as assumed background and visibly influences its reasoning. The propagation is limited to the immediately adjacent turn, but the impacted answer was not corrected and remains in the session. | An error exists in one or more turns but was contained to the originating turn. It was not referenced or relied upon in any subsequent turn — each later turn is independently re-grounded from source documents. | An error occurred and briefly surfaced in an adjacent turn (N+1), but the system proactively identified and corrected it before the user flagged it. All turns after the correction show independent re-grounding with no residual influence from the original error. | No errors propagated across turns. Each turn is independently grounded from source documents. The session maintains full contextual integrity throughout. |

**Decision Rules:**

- ▸ After scoring all turns, collect every score-1 or score-2 instance from Dimension 1 (Source Grounding) and Dimension 2 (Scope Enforcement).
- ▸ For each error: check whether it was referenced or relied upon in any subsequent turn.
- ▸ IF a fabricated claim from turn N appeared as assumed background in turn N+2 or later → **score 1**. Rationale: the N+2 threshold accounts for natural adjacent-turn references (e.g., "As I mentioned…"); errors that persist past the adjacent turn indicate systemic context corruption.
- ▸ IF a false user claim confirmed in turn N was used to justify an answer in turn N+2 or later → **score 1**.
- ▸ IF a wrong question number assigned in turn N persisted uncorrected through later turns → **score 1**.
- ▸ IF a fabricated claim from turn N is carried into turn N+1 as assumed background and visibly influences N+1's answer, but does not appear in N+2 or later → **score 2**.
- ▸ IF an error from turn N is echoed in turn N+1 without influencing the answer (e.g., mentioned in passing but not used as a premise), and does not appear in N+2 or later → **score 3**.
- ▸ IF errors exist but each turn is re-grounded independently without referencing the error → **score 3**.
- ▸ IF an error was caught and corrected by the system in turn N+1, and all subsequent turns show no residual influence → **score 4**.
- ▸ IF an error was caught and corrected by the system in turn N+1, AND the correction explicitly cites the source document that disproves the error → **score 4**.
- ▸ IF no errors in any turn → **score 5**.

---

### 10.4 Chitchat Handling

> ℹ️ **No VETO on this dimension.** A poor chitchat response leaves the user without direction but does not compromise factual accuracy. Score ≤ 2 is reported as a quality flag.

Chitchat queries are social or conversational moves that are neither answerable from interview data nor hard out-of-scope. The correct behavior is: **acknowledge briefly, then redirect to the system's capabilities** grounded in the current candidate's session. A flat out-of-scope decline to chitchat is wrong — it leaves the user with no path forward.

| 1 FAIL                                                                                                                                                                               | 2 POOR                                                                                                                                                                                                                                                                                     | 3 OK                                                                                                                                                                         | 4 GOOD                                                                                                                                                                                                                    | 5 EXCELLENT                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ignores chitchat entirely and dumps interview data unprompted, OR treats it as an interview question and evaluates it, OR engages in prolonged social conversation with no redirect. | Acknowledges the chitchat (e.g., "Hello!") but gives no indication of what the system can do or how to proceed. Dead end — user has no path forward. Also applies if the system gives a flat hard-out-of-scope decline ("That question is outside my scope") to a greeting or pleasantry. | Acknowledges + states it is focused on this candidate's interview ("I can help you with questions about this candidate's interview"). Minimal redirect, no categories named. | Acknowledges + lists generic capability categories ("I can help with performance, scores, skill coverage, or responses to specific questions"). Categories apply to any session — not grounded in this candidate's data. | Acknowledges + provides a candidate-specific capability statement that names the candidate, role, and at least one concrete data point from this session. Could not be copy-pasted into a different session unchanged. |

**Decision Rules:**

- ▸ IF system ignores chitchat and unpromptedly outputs interview data → score 1.
- ▸ IF system responds with only a social acknowledgment and no redirect → score 2.
- ▸ IF system gives a flat hard-out-of-scope decline ("That question is outside my scope") to a greeting, pleasantry, or "What can you do?" → score 2 (wrong register — leaves user with no path).
- ▸ IF system acknowledges + briefly states focus on interview questions, no categories → score 3.
- ▸ IF system acknowledges + lists generic categories of help (performance, scores, coverage, Q&A) → score 4.
- ▸ IF system acknowledges + names candidate/role + references a specific data point from this session → score 5.
- ▸ NOTE: Chitchat scores are reported separately under Dimension 4 and are NOT averaged into the Dimension 2 Scope Enforcement score. Chitchat does not trigger the Dimension 2 VETO regardless of score.

**Counting Method:**

1. For each turn: classify as Chitchat (Greeting / Pleasantry / Capability query / Social small talk) or non-Chitchat.
   - Chitchat sub-types: **Greeting** ("Hello", "Hi") / **Pleasantry** ("Thanks", "That was helpful") / **Capability query** ("What can you do?", "Can you help me?") / **Social small talk** ("How are you?", "Are you an AI?")
2. For each Chitchat turn: tag response as — Ignored / Data-dump / Social-only (no redirect) / Hard-decline / Acknowledged-no-categories / Acknowledged-generic / Acknowledged-candidate-specific.
3. Map tag to score: Ignored or Data-dump → 1. Social-only or Hard-decline → 2. Acknowledged-no-categories → 3. Acknowledged-generic → 4. Acknowledged-candidate-specific → 5.
4. Session score = average of all Chitchat turn scores (no VETO threshold).

**Anchor Example — Greeting (2 vs 3 vs 4 vs 5 boundary):**

> *User says: "Hello"*
>
> **Score 2:** "Hello!" — acknowledged but no redirect. User has no idea what to do next.
>
> **Score 3:** "Hello! I can help you with questions about this candidate's interview." — acknowledged + stated focus, but no categories listed. A first-time user still doesn't know what to ask.
>
> **Score 4:** "Hello! I'm here to help you review this candidate's interview. I can cover their overall performance and score, which skills were assessed or missed, how they answered each question, or whether the assessment recommends moving forward." — acknowledged + generic categories listed. Useful but could apply to any session.
>
> **Score 5:** "Hello! I have Aashish Pokharel's interview for the ML Engineer role. I can walk you through their overall score, the 3 technical questions that were asked, which skills were covered out of the interview plan, or whether the assessment recommends moving to the next round." — acknowledged + candidate-specific data (name, role, question count, coverage). Impossible to copy-paste into another session.

**Anchor Example — Pleasantry (3 vs 4 boundary):**

> *User says: "Thanks, that was really helpful!"*
>
> **Score 3:** "You're welcome! Let me know if you have other questions about the interview." — acknowledged, no categories offered.
>
> **Score 4:** "Glad that helped! I can also look at their skill coverage in more detail, review how they answered each question, or summarize any specific area of the assessment." — acknowledged + specific categories for next steps.

**Anchor Example — Capability query (4 vs 5 boundary):**

> *User says: "What can you do?"*
>
> **Score 4:** "I can help you review a candidate's interview performance, their overall score, which skills were assessed, how they answered specific questions, and whether the assessment recommends moving forward." — generic categories. Could apply to any session.
>
> **Score 5:** "I have Aashish Pokharel's interview data for the ML Engineer role. I can tell you their overall score of 4 out of 10, walk through the 3 technical questions that were asked, show which skills from the interview plan were covered and which weren't, or review specific question ratings." — same categories but grounded in this candidate's actual data (name, role, score, question count). Candidate-specific.

---

### 10.5 Response Tone

**Purpose:** Evaluates *how* the system communicates — whether responses are professional, neutral, appropriately sized, and compliant with the hiring disclaimer protocol. This dimension uses four independently observable sub-checks scored per turn, not a holistic impression.

> ℹ️ **No VETO on this dimension.** Tone issues degrade quality but do not invalidate factual content the way fabrications or scope violations do. Score ≤ 2 on any sub-check is reported as a quality flag for the session, to be addressed separately from the pass/fail verdict.

### Sub-Checks

**T1 — Hiring Disclaimer Compliance**
Trigger: Any turn where the user explicitly asks for a hire/no-hire verdict, a recommendation, or whether to move the candidate forward.

- PASS: A disclaimer phrase is naturally woven into the sentence that contains the verdict. Acceptable forms: "While the final hiring decision is yours...", "The decision is ultimately yours, but...", "I'd recommend..., though the final call is yours."
- FAIL (score ≤ 2): Verdict given with no disclaimer at all.
- FAIL (score ≤ 2): Disclaimer given as a standalone preamble sentence before the verdict rather than integrated into it. Example of robotic preamble (FAIL): "Note: The final hiring decision is yours. I recommend not moving forward." — the disclaimer is a detached block, not woven in.

**T2 — Sycophancy Absence**
Trigger: Every turn.

- PASS: Response does not open with a filler affirmation.
- FAIL (score ≤ 2): Response opens with any of the following phrases (or close equivalents):
  "Great question!" / "Excellent question!" / "Good question!" / "Interesting question!" / "Certainly!" / "Absolutely!" / "Of course!" / "Sure!" / "Definitely!" / "I'd be happy to" / "I'd be glad to" / "I'd be delighted to" / "That's a great point!" / "You make a good point!" / "Great observation!"

**T3 — Candidate Language Neutrality**
Trigger: Every turn that describes the candidate's performance, skills, or suitability.

- PASS: Language stays within the vocabulary of the source assessment documents — uses the same rating labels and score figures the assessment uses, nothing stronger or weaker.
- FAIL — Overly negative beyond assessment (score ≤ 2): Uses charged words absent from the assessment: "terrible" / "awful" / "disappointing" / "shockingly poor" / "completely lacking" / "unfortunately" as an editorial opener / "only scored" (adds negative spin not in data).
- FAIL — Overly positive beyond assessment (score ≤ 2): Uses praise the assessment does not support: "brilliant" / "exceptional" / "outstanding" / "impressive" / "fantastic" / "excellent" when the assessment does not use those terms.
- FAIL — Editorial opinion (score ≤ 2): Any statement of the form "I think the candidate..." or "In my opinion..." presenting a judgment not traceable to a source document.

**T4 — Response Length Calibration**
Trigger: Every turn.

- PASS: Response length is proportional to query complexity. Simple queries (greeting, yes/no, single-fact retrieval) → answered in ≤ 3 sentences with the answer first. Complex queries (multi-skill analysis, full summaries) → longer response is justified.
- FAIL (score ≤ 2): Simple query receives a multi-sentence preamble before the actual answer. Example: "I have reviewed the interview transcript. Based on the logistical questions that were asked outside the skill coverage plan. The candidate stated they prefer to work from home." — three sentences before a one-sentence fact.
- FAIL (score ≤ 2): Complex query (e.g., "summarize all answers") receives a one-line non-answer.

### Session Scoring for Dimension 10.5

Score each turn on all applicable sub-checks, then derive a session score:

| Score       | Criteria                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | T1 fails on any explicit verdict turn (disclaimer fully absent), OR T2 fails on more than half of all scored turns (sycophancy is the dominant pattern).                                 |
| **2** | T2 fails on 2 or more turns, OR T3 fails on any turn (charged language present anywhere), OR T1 disclaimer present but given as a robotic detached preamble rather than woven naturally. |
| **3** | T1, T2, T3 pass on all turns; T4 fails on 2 or more turns (repeated preamble habit on simple queries).                                                                                   |
| **4** | T1, T2, T3 pass on all turns; T4 fails on 1 turn at most. Disclaimer is present and integrated but uses identical phrasing every time (slightly formulaic but functionally correct).     |
| **5** | All sub-checks pass on all turns. Disclaimer varies naturally across verdict turns. Responses lead with the answer. No filler, no charged language, no length mismatches.                |

### Counting Method

1. For each turn: mark applicable triggers — T1-trigger (verdict requested) / T2-trigger (all turns) / T3-trigger (candidate described) / T4-trigger (all turns).
2. For each triggered sub-check: tag PASS or FAIL, noting the specific observed pattern.
3. Count FAIL occurrences per sub-check across the session.
4. Apply the session scoring table above.

### Anchor Examples

**T1 — Disclaimer (FAIL vs PASS):**

> User asks: "Should I move this candidate forward?"
>
> FAIL: "I recommend not moving this candidate forward. The overall score was 3 out of 10." — No disclaimer. Verdict is absolute.
>
> FAIL (robotic preamble): "Note: The final hiring decision is yours. I recommend not moving forward." — Disclaimer is a detached block, not woven into the verdict.
>
> PASS: "While the final hiring decision is yours, the overall score of 3 out of 10 suggests the candidate is not ready for the next round." — Disclaimer naturally woven into the verdict sentence.

**T2 — Sycophancy (FAIL vs PASS):**

> User asks: "Which skills need improvement?"
>
> FAIL: "Great question! Based on the assessment, the candidate needs improvement in Git." — Opens with a banned affirmation.
>
> PASS: "Based on the assessment, the candidate needs improvement in Git and data preprocessing." — Leads with the answer.

**T3 — Candidate Neutrality (FAIL vs PASS):**

> Assessment states: overall_score 3, band: Limited.
>
> FAIL: "The candidate performed terribly across all technical areas." — "terribly" is charged language absent from the assessment.
>
> PASS: "The candidate scored 3 out of 10, falling in the Limited band across all technical areas." — Language mirrors the assessment exactly.

**T4 — Length Calibration (FAIL vs PASS):**

> User asks: "Was the candidate willing to commute to New York?"
>
> FAIL: "I have reviewed the interview transcript. Based on the logistical questions that were asked outside the skill coverage plan. The candidate stated they prefer to work from home." — Three-sentence preamble before a simple factual answer.
>
> PASS: "No — the candidate stated they would prefer to work from home." — Answer first.

---

## Session Scoring Methodology

Each scored turn receives an individual tag per the counting methods in each applicable dimension. The session score for each dimension is determined as follows:

1. **VETO triggers:** Any single turn that meets a VETO condition (score 1 or 2) in Dimension 1 or 2 sets the session VETO flag for that dimension, regardless of how other turns performed. Dimension 3 (Context Handling) is scored at the session level; a score of 1 or 2 sets the VETO flag for that dimension.
2. **If no VETO:** The session score equals the *average* of all individually scored turns for that dimension (rounded to one decimal place), reported alongside the per-turn breakdown.

Evaluators must report both the per-turn scores and the final session-level verdict for each dimension.

---

## Final Session Score

The final session score combines all five dimension scores into a single number using a **veto-gated average**.

**Veto dimensions:** Dimension 1 (Source Grounding), Dimension 2 (Scope Enforcement), Dimension 3 (Context Handling).

**Scoring rules:**

1. **If ANY veto dimension scores ≤ 2:** The final session score equals the **minimum** score among all veto dimensions. Rationale: a single critical failure (fabrication, scope violation, or error propagation) invalidates the session regardless of how well other dimensions performed.
2. **If ALL veto dimensions score > 2:** The final session score equals the **average** of all five dimension scores (Dimensions 1–5), rounded to one decimal place.

**Examples:**

| Dim 1 | Dim 2 | Dim 3 | Dim 4 | Dim 5 | Rule Applied                              | Final Score   |
| ----- | ----- | ----- | ----- | ----- | ----------------------------------------- | ------------- |
| 4.0   | 5.0   | 5     | 4.0   | 4.0   | All veto dims > 2 → average              | **4.4** |
| 1.0   | 4.0   | 5     | 5.0   | 4.0   | Dim 1 ≤ 2 → min of veto dims            | **1.0** |
| 3.0   | 2.0   | 4     | 4.0   | 3.0   | Dim 2 ≤ 2 → min of veto dims            | **2.0** |
| 4.0   | 3.0   | 1     | 5.0   | 5.0   | Dim 3 ≤ 2 → min of veto dims            | **1.0** |
| 2.0   | 1.0   | 2     | 3.0   | 4.0   | Dims 1, 2, 3 all ≤ 2 → min of veto dims | **1.0** |

---

## Appendix A — Dimension Weight Map

| Dim  | Name                                  | Scale   | Weight                 | Rationale                                                                                                                                                                                                     |
| ---- | ------------------------------------- | ------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Label Accuracy                        | Binary  | **VETO**         | Pipeline gating                                                                                                                                                                                               |
| 2.1  | Fidelity                              | 1–5    | **VETO**         | Fabrication = broken                                                                                                                                                                                          |
| 2.2  | Completeness                          | 1–5    | **VETO**         | Missed dealbreaker                                                                                                                                                                                            |
| 3.1  | Nuance Capture                        | 1–5    | **VETO**         | Missed HM constraint                                                                                                                                                                                          |
| 4.1  | Chronological Fidelity                | 1–5    | HIGH                   | Structural accuracy                                                                                                                                                                                           |
| 4.2  | Quantitative Extraction               | 1–5    | HIGH                   | Evidence quality                                                                                                                                                                                              |
| 4.3  | Skill Classification                  | 1–5    | MEDIUM                 | Depth vs breadth                                                                                                                                                                                              |
| 4.4  | Entity Accuracy                       | 1–5    | **VETO**         | Hallucination = broken                                                                                                                                                                                        |
| 5.1  | Source Integrity                      | 1–5    | **VETO**         | Product-breaking                                                                                                                                                                                              |
| 5.2  | Flow & Timing                         | 1–5    | **VETO**         | Math error = unusable                                                                                                                                                                                         |
| 5.3  | Question Fit                          | 1–5    | HIGH                   | Core quality signal                                                                                                                                                                                           |
| 5.4  | Fairness                              | 1–5    | HIGH                   | Candidate experience                                                                                                                                                                                          |
| 5.5  | Naturalness                           | 1–5    | MEDIUM                 | Polish not substance                                                                                                                                                                                          |
| 5.6  | Follow-Up Necessity                   | 1–5    | HIGH                   | Signal quality                                                                                                                                                                                                |
| 5.7  | Context Handling                      | 1–5    | MEDIUM                 | Adaptiveness                                                                                                                                                                                                  |
| 5.8  | Chain Coherence                       | 1–5    | MEDIUM                 | Flow quality                                                                                                                                                                                                  |
| X.1  | Hallucination Tracing                 | Label   | **VETO**         | Pipeline integrity                                                                                                                                                                                            |
| 6.1  | FC Classification Accuracy            | Binary  | **VETO**         | Wrong label derails question tracking or ends interview early                                                                                                                                                 |
| 6.2  | FC Question Identification            | Binary  | HIGH                   | Misidentified question = wrong tracker and timer reset                                                                                                                                                        |
| 6.3  | FC Out of Plan Detection Accuracy     | 3-level | HIGH                   | Wrong subtype or missing skills = improvised questions misrouted                                                                                                                                              |
| 6.4  | FC Transcript Split Handling          | Binary  | **VETO**         | Duplicate New Question on split turn corrupts question count and timers                                                                                                                                       |
| 7.1  | TK Message Tone & Helpfulness         | 1–5    | HIGH                   | Wrong tone = recruiter ignores or feels pressured                                                                                                                                                             |
| 7.2  | TK Repetition & Contextualization     | 1–5    | HIGH                   | Blind repeats = recruiter tunes out                                                                                                                                                                           |
| 7.3  | TK Session Narrative & Flow           | 1–5    | HIGH                   | Birds-eye coherence, recovery, escalation arc                                                                                                                                                                 |
| 8.1  | DD Drift Detection Accuracy           | 1–5    | HIGH                   | Core classification signal                                                                                                                                                                                    |
| 8.2  | DD State Machine Compliance           | 1–5    | HIGH                   | Spam = product-breaking UX                                                                                                                                                                                    |
| 8.3  | DD Message Quality & Actionability    | 1–5    | MEDIUM                 | Recruiter clarity and actionable guidance                                                                                                                                                                     |
| 9.1  | IA Structural Integrity               | 1–5    | **VETO**         | Duplicate/mislabeled skills = broken report                                                                                                                                                                   |
| 9.2  | IA Score Calibration & Synthesis      | 1–5    | HIGH                   | Scores must trace to evidence                                                                                                                                                                                 |
| 9.3  | IA Discussion Points Quality          | 1–5    | HIGH                   | Most actionable output for next interviewer                                                                                                                                                                   |
| 10.1 | Source Grounding                      | 1–5    | **VETO**         | Covers factual grounding, fact-check compliance, question numbering, conversation history accuracy, speaker attribution, and soft skill verification. Any sub-dimension failure may mislead hiring decisions. |
| 10.2 | Scope Enforcement                     | 1–5    | **VETO**         | Answering out-of-scope queries, responding in a non-English language, or leaking internal field names = product boundary violation.                                                                           |
| 10.3 | Context Handling Vs Context Poisoning | 1–5    | **VETO**         | Error propagation across turns compounds hallucinations session-wide; cannot be corrected without rerunning the session.                                                                                      |
| 10.4 | Chitchat Handling                     | 1–5    | Quality flag (no VETO) | A flat decline or dead-end response to a greeting leaves the recruiter without direction. No factual harm but degrades usability and trust.                                                                   |
| 10.5 | Response Tone                         | 1–5    | Quality flag (no VETO) | Sycophancy, missing disclaimers, charged language, and length miscalibration degrade recruiter trust and usability without invalidating factual content.                                                      |

**VETO** = Score 1–2 rejects stage output. Fix before re-running.
**HIGH** = Heavily impacts usefulness. A 3 is a yellow flag for human review.
**MEDIUM** = Impacts quality but not correctness. A 3 is acceptable for MVP pipeline.
