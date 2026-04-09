# Interview Agent — Evaluation Rubric: Follow-Up Question Generation

**Scoring Manual for Human Reviewers & LM-as-a-Judge Pipeline**

> This rubric covers **follow-up question generation during the live interview** — the decision of whether to probe further and the quality of the generated probe. It is distinct from Stage 5 (Question Gen), which covers the pre-interview planned question set, and from Stage 7 (Answer Evaluation), which produces the answer classification that gates this stage.

---

## How to Use This Document

This rubric is a **scoring manual**, not an alignment document. Every dimension has four components:

- **Score Table** — what each level looks like (the flavor text).
- **Decision Rules** — if/then logic that forces a score. These override judgment calls.
- **Counting Method** — what to count, how to count it, and what thresholds map to what scores.
- **Anchor Example** — a real-ish input/output pair sitting at the hardest boundary (usually 3 vs 4).

**Veto Dimensions** are marked with ⚠. A score of 1–2 on a veto dimension means the entire follow-up output is considered failed regardless of other scores.

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

## Stage 8 — Follow-Up Question Generation

**Purpose:** After the answer evaluator classifies a candidate's response (Stage 7), determine whether a follow-up is warranted and, if so, generate a targeted probe. The generator receives: the original question, the candidate's answer, the numeric score and rubric label (Irrelevant / Basic / Adequate / Strong / Excellent) from Stage 7, the identified gaps, the skill being assessed, and the remaining interview budget. It outputs: a follow-up decision (yes/no) and, if yes, a follow-up question.

The follow-up question is delivered to the candidate through the recruiter — it must be natural, grounded in what was said, and must not reveal internal state (score, classification, or system reasoning).

---

### 8.1 Necessity Judgment `VETO`

Is the decision to generate a follow-up (or not) correct given the score from Stage 7 and the remaining interview budget?

> ⚠ **VETO:** Generating a follow-up when the score is ≥7 wastes a scarce slot. Skipping a follow-up when the score is <7 leaves a critical signal unresolved. Either direction, when clearly wrong, is a pipeline failure.

| FAIL                                                                                                                                                                  | CORRECT                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Follow-up generated when score ≥ 7 (Strong or Excellent) — the candidate demonstrated sufficient competency. OR no follow-up generated when score < 7 — a weak or irrelevant answer went unchallenged. | Follow-up decision matches the score threshold: generated when score < 7, suppressed when score ≥ 7, respecting the remaining interview budget. |

**Decision Rules:**

- ▸ IF score ≥ 7 (Strong or Excellent) AND follow-up is generated → FAIL.
- ▸ IF score = 0 (Irrelevant) AND no follow-up is generated → FAIL. A completely off-topic answer must be challenged.
- ▸ IF score < 7 (Irrelevant / Basic / Adequate) AND no follow-up is generated AND remaining budget allows one → FAIL.
- ▸ IF score ≥ 7 AND no follow-up is generated → CORRECT. The skill was demonstrated sufficiently.
- ▸ IF score < 7 AND follow-up is generated AND it targets the identified gap → CORRECT.
- ▸ IF remaining follow-up budget is exhausted AND no follow-up is generated for a score < 7 answer → CORRECT. Budget constraints override the probe trigger.

**Anchor Example — FAIL:**

> *Candidate gave a strong answer scoring 8/10 (Strong): detailed explanation of distributed locking, covered optimistic vs. pessimistic locking, gave a production example, addressed failure modes. System generates follow-up: "Can you tell me more about how you handled lock contention?" — Score ≥ 7, follow-up should not trigger. The answer already covered contention. → FAIL.*

---

### 8.2 Answer Grounding `HIGH`

Is the follow-up question anchored to something specific from the candidate's answer — not a generic next-topic probe?

| 1 FAIL                                                                                                           | 2 POOR                                                                                                                    | 3 OK                                                                                           | 4 GOOD                                                                                                                                      | 5 EXCELLENT                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Follow-up is a template question with no connection to the candidate's answer — could have been asked before they spoke. | Follow-up references the general topic of the answer but not any specific claim or gap the candidate created. | Follow-up references the answer in a general way ("you mentioned X — can you go deeper?") but doesn't target the specific missing piece. | Follow-up targets a specific gap from the candidate's answer. A reviewer reading the transcript would immediately understand why this follow-up was chosen. | Follow-up is precisely derived from the candidate's answer. It names the specific claim or absence, and the probe is the exact question needed to resolve the gap. |

**Decision Rules:**

- ▸ IF the follow-up question could have been asked before the candidate said anything (no reference to answer content) → cap at 2.
- ▸ IF the follow-up names the general topic but not a specific statement or gap → cap at 3.
- ▸ IF the follow-up references a specific element of the answer AND targets the identified gap → ≥4.
- ▸ IF the follow-up is so precisely derived that it could only have been generated from this specific answer → 5.
- ▸ IF the follow-up attributes a claim the candidate did not make → FAIL (fabricated grounding).

**Anchor Example — 3 vs 4 boundary:**

> *Candidate explained database sharding by partitioning on user ID but didn't address hot spots or re-sharding costs. Score-3 follow-up: "Can you go deeper on the trade-offs of your sharding approach?" — references the topic but not the gap. Score-4 follow-up: "You partitioned by user ID — how did you handle hot spots when certain users generated disproportionate traffic, and what was the cost of re-sharding if the partition key turned out to be wrong?" — derived directly from what was said and precisely targets both missing signals.*

---

### 8.3 Chain Coherence `HIGH`

Does the follow-up question logically deepen the assessment of the same skill, or does it jump to an adjacent topic without justification?

| 1 FAIL                                                                              | 2 POOR                                                                                          | 3 OK                                                                                                        | 4 GOOD                                                                                                              | 5 EXCELLENT                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Follow-up shifts to a different skill domain with no logical connection to the answer. | Follow-up is on the same general topic but lateral — it doesn't probe deeper on the identified gap. | Follow-up is on-topic and adds some value. Probes one level deeper but misses the most important sub-gap. | Follow-up is one deliberate level deeper on the right sub-skill. The candidate and reviewer would both understand why this question follows. | Follow-up is the precise next step in a coherent competency assessment. The full question sequence (original + follow-up) tells a complete story of the skill. |

**Decision Rules:**

- ▸ IF the follow-up introduces a skill domain not connected to the original question or the candidate's answer → cap at 2.
- ▸ IF the follow-up is on the same topic but doesn't deepen the assessment (lateral, not vertical) → cap at 3.
- ▸ IF the follow-up probes one level deeper on the correct sub-skill → ≥4.
- ▸ IF the original question + follow-up together constitute a complete assessment of the skill → 5.

**Anchor Example — FAIL vs 3:**

> *Original question assesses "conflict resolution in team settings." Candidate described a specific disagreement with a PM over scope. Follow-up (FAIL): "How do you approach performance management for underperforming engineers?" — different skill domain, no connection to the conflict described. Follow-up (Score 3): "How did you know when the conflict was resolved — what did resolution look like?" — on-topic and adds some value, but doesn't probe the most important gap (whether the candidate escalated appropriately or avoided hard conversations).*

---

### 8.4 Framing & Naturalness `MEDIUM`

Is the follow-up question worded as a direct, natural probe — free of internal evaluation language, indirect openers, and phrasing that signals system judgment to the candidate?

| 1 FAIL                                                                                                                  | 2 POOR                                                                                                                    | 3 OK                                                                                               | 4 GOOD                                                                                                            | 5 EXCELLENT                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Follow-up leaks internal state — uses evaluation language ("your answer was incomplete", "you didn't address X"), score references, or system framing. | Follow-up uses indirect openers ("Can you", "Could you", "Would you") or passive-aggressive framing ("You mentioned X — but can you prove that?"). | Follow-up is professional and direct. May feel slightly generic or formal. Clearly AI-generated but not off-putting. | Follow-up sounds like a skilled interviewer's natural next question. Direct, specific, conversational. No evaluative language. | Follow-up is seamless. It acknowledges the candidate's answer in a way that feels like curiosity, not interrogation. Indistinguishable from a skilled human probe. |

**Decision Rules:**

- ▸ IF the follow-up contains evaluation language visible to the candidate ("your answer was insufficient", "you didn't cover", "the system expected") → FAIL.
- ▸ IF any follow-up begins with "Can you", "Could you", "Would you", or similar soft openers → cap at 3.
- ▸ IF the follow-up phrases the probe as a challenge to re-prove something the candidate already clearly stated → cap at 3.
- ▸ IF the follow-up is direct (imperative or open question without soft opener) and conversational → ≥4.
- ▸ IF the follow-up naturally acknowledges the candidate's answer before probing (without revealing evaluation) → 5.

**Counting Method:**

1. Check for evaluation language → if present, FAIL.
2. Check opener phrasing → if soft opener, cap at 3.
3. Check for passive-aggressive framing → if present, cap at 3.
4. If none of the above: rate 4–5 based on naturalness.

**Anchor Example — 3 vs 4 boundary:**

> *Score-3: "Could you elaborate on the trade-offs you considered when choosing your sharding key?" — Indirect opener, slightly generic. Score-4: "Walk me through the trade-offs you weighed when picking that sharding key — specifically what made user ID the right choice over other options." — Direct, specific, grounded in the answer, no soft opener.*

---
