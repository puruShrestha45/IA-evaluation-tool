# Interview Agent — Evaluation Rubric: Flow Classification

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

All dimensions in this stage use discrete labels rather than a 1–5 scale, since classification outputs are either correct or not.

| Scale   | Labels                    | Used in     |
| ------- | ------------------------- | ----------- |
| Binary  | FAIL / CORRECT            | 6.1, 6.2, 6.4 |
| 3-level | FAIL / PARTIAL / CORRECT  | 6.3         |

---

## Stage 6 — Interview Flow Classification

**Purpose:** Classify each recruiter statement during a live interview into one of five categories — New Question, Continuation, Interview End, Out of Plan New Question, or Out of Plan Follow-up Question — and, when a new question is detected, identify which question from the planned list was asked. This classification drives downstream state: question tracking, timer resets, answer evaluation routing, and the decision to stop processing transcriptions. Errors here propagate immediately and silently into every component that depends on interview state.

The classifier receives: the last few conversation turns with speaker labels, the list of planned main and follow-up questions, the current interview progress (whether the technical round has started, how many questions have been asked, which question is currently active, and the skills being assessed by the active question). It outputs one of the five labels. For New Question it also returns the matched question text and a main/follow-up flag. For Out of Plan outputs it returns the skills the recruiter's improvised question appears to be assessing.

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

| FAIL                                                                                                                                                                                                                                                    | PARTIAL                                                                                                                         | CORRECT                                                                                                                                                                                           |
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
