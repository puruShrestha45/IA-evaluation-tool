// ═══════════════════════════════════════════════════════════════════════════
//  RUBRIC DATA  — synced with IA_Evaluation_Rubric_v2.md
// ═══════════════════════════════════════════════════════════════════════════

export const RUBRICS = {

  // ── Stage 2 — JD Extraction ─────────────────────────────────────────────

  JD_FIDELITY: {
    label: 'JD Fidelity (2.1)',
    veto: true,
    scores: {
      1: 'Contains fabricated requirements, skills, or qualifications not in the source JD.',
      2: 'No fabrication, but includes inferred details not explicitly stated (e.g., assumes "Python" from "data engineering").',
      3: 'All items in source. Includes redundant boilerplate that adds no signal.',
      4: 'All items verifiable. Minimal boilerplate. Every field maps to a specific source sentence.',
      5: 'Every value has 1:1 source link. Zero boilerplate. Tighter than the original.',
    },
  },

  JD_COMPLETENESS: {
    label: 'JD Completeness (2.2)',
    veto: true,
    scores: {
      1: 'Missed ≥1 dealbreaker (required cert, years threshold, must-have tech).',
      2: 'Got role title + 1–2 obvious skills but missed ≥50% of stack/soft skills/seniority signals.',
      3: 'Most hard skills. Missed required vs preferred on ≥2 items, or missed ≥2 soft/cultural requirements.',
      4: 'All required + preferred hard skills. Missed 1–2 soft skills or minor nice-to-have.',
      5: 'Exhaustive. Every hard skill, soft skill, seniority signal, team context, HM preference — correct tiers.',
    },
  },

  // ── Stage 3 — Transcript Parsing ────────────────────────────────────────

  NUANCE_CAPTURE: {
    label: 'Nuance Capture (3.1)',
    veto: true,
    scores: {
      1: 'Missed explicit dealbreakers. Output reads like generic JD summary, not HM intake.',
      2: 'Got keywords + tech but missed sentiment/hedging ("ideally" vs "must have" treated same).',
      3: 'Tech + some preferences. Missed soft-skill context or implied priorities (HM spent 3 min on team dynamics → one line).',
      4: 'Strong explicit + implied capture. Correctly split must-haves from nice-to-haves. Missed 1–2 subtle cues.',
      5: 'Conversational language → structured constraints with correct priority. Surfaced hidden constraints HM implied but never stated.',
    },
  },

  // ── Stage 4 — Resume Parsing ─────────────────────────────────────────────

  RESUME_CHRONOLOGY: {
    label: 'Chronological Fidelity (4.1)',
    veto: false,
    scores: {
      1: 'Dates/roles wrong order. Role attributed to wrong company.',
      2: 'Correct order, but overlapping roles not flagged or gaps silently ignored.',
      3: 'Correct, gaps noted. Struggled with promotions (same company split into separate employers).',
      4: 'All roles correct including internal promotions. Minor date formatting inconsistencies.',
      5: 'Perfect. All roles, promotions, lateral moves, gaps. Overlaps flagged. Dates normalized.',
    },
  },

  RESUME_QUANT: {
    label: 'Quantitative Extraction (4.2)',
    veto: false,
    scores: {
      1: 'Missed or corrupted all quantitative claims.',
      2: 'Got some numbers, stripped context ("$2M" without annual note, no role link).',
      3: 'Major metrics captured. Lost link between metric and achievement/role.',
      4: 'All metrics linked to correct roles. Minor: missed 1 or one ambiguous link.',
      5: 'Every claim extracted, linked to role + project, units + context preserved.',
    },
  },

  RESUME_SKILLS: {
    label: 'Skill Classification (4.3)',
    veto: false,
    scores: {
      1: 'No distinction. Coursework mention = 5-year professional use.',
      2: 'Flat list. No role association, recency, or proficiency.',
      3: "Some context but can't distinguish primary from incidental.",
      4: 'Associated with companies/roles. Proficiency implicit from context but not tagged.',
      5: 'Categorized: proficiency (primary/secondary/exposure), recency (current/legacy), role. Instantly clear what they\'re strong at NOW.',
    },
  },

  RESUME_ENTITY: {
    label: 'Entity Accuracy (4.4)',
    veto: true,
    scores: {
      1: 'Hallucinated entities — names, degrees, or certs not in resume.',
      2: 'No hallucinations but frequent typos in entity names.',
      3: 'All accurate but not normalized ("MIT" and full name both appear).',
      4: 'High accuracy, all correct. Minor casing/abbreviation inconsistencies.',
      5: 'Zero errors. Correct, normalized, consistent throughout.',
    },
  },

  // ── Stage 5 — Question Gen, Follow-Up & Scoring ──────────────────────────

  SOURCE_INTEGRITY: {
    label: 'Source Integrity (5.1)',
    veto: true,
    scores: {
      1: 'Hallucinates requirements OR leaks restricted sources ("The hiring manager mentioned…").',
      2: 'References restricted sources in candidate text ("Based on the intake call…").',
      3: 'No leakage. Metadata/reasoning thin or missing — hard to audit why Q was asked.',
      4: 'Clean: spoken text from resume only; metadata cites JD/Transcript. Minor citation gap.',
      5: 'Perfect. Every spoken Q traces to resume claim. Every metadata block cites specific source.',
    },
  },

  FLOW_TIMING: {
    label: 'Flow & Timing (5.2)',
    veto: true,
    scores: {
      1: "Times don't sum to total. Can't execute as designed.",
      2: 'Times correct but incoherent order — random topic jumps.',
      3: 'Basic flow — tech + behavioral separated. Timeboxing reasonable, not optimized.',
      4: 'Logical hierarchy: core reqs → preferences → growth. Time reflects priority.',
      5: 'Orchestrated: experience verification → constraint testing → seniority calibration. Time mirrors priority.',
    },
  },

  QUESTION_FIT: {
    label: 'Question Fit (5.3)',
    veto: false,
    scores: {
      1: 'Generic. No connection to this JD or resume.',
      2: "References domain but doesn't bridge candidate experience ↔ JD requirements.",
      3: 'Role-appropriate, some history. Templated — writable without reading resume.',
      4: 'Targets specific resume claims vs specific JD reqs. ≥2 Qs impossible without both docs.',
      5: 'Every Q anchored in resume AND tests HM constraint. Set = coherent investigation of fit.',
    },
  },

  FAIRNESS: {
    label: 'Fairness (5.4)',
    veto: false,
    scores: {
      1: 'Biased / trap-based / tests knowledge not in JD.',
      2: 'Gotcha/trivia overload, or all Qs so easy seniority indistinguishable.',
      3: "Standard difficulty. Some opportunity but repetitive, doesn't separate levels.",
      4: '"Low floor, high ceiling" — basic answer path + room for exceptional.',
      5: 'Calibrated ladder. Junior = competence, Senior = mastery. Accurately gauges seniority.',
    },
  },

  NATURALNESS: {
    label: 'Naturalness (5.5)',
    veto: false,
    scores: {
      1: 'Robotic script. ("Answer insufficient. Next: Explain X.")',
      2: 'Abrupt. Same lead-in ≥3×. No acknowledgment of candidate response.',
      3: 'Standard professional. Acceptable but clearly AI-generated.',
      4: 'Conversational. Transitions acknowledge prior answer. Varied phrasing.',
      5: 'Seamless. Skilled human interviewer. Follow-ups = curiosity not interrogation.',
    },
  },

  FOLLOW_UP_NECESSITY: {
    label: 'Follow-Up Necessity (5.6)',
    veto: false,
    scores: {
      1: 'Wrong call: moved on despite red flag, OR re-probed exhausted topic.',
      2: 'Followed up strong (4–5) answer, OR skipped surface-level answer.',
      3: 'Adds some value, not critical. Logic roughly right.',
      4: 'Found specific gap/branch needing one more layer.',
      5: 'Identified incomplete signal on HM dealbreaker, asked high-value closer.',
    },
  },

  CONTEXT_HANDLING: {
    label: 'Context Handling (5.7)',
    veto: false,
    scores: {
      1: 'Ignored answer. Or invented specificity ("You mentioned X" — they didn\'t).',
      2: "Acknowledged but didn't adapt difficulty to junior/senior signal.",
      3: "Some adaptation, some caution. Doesn't meaningfully adjust depth.",
      4: 'Clear: narrowed focus, adjusted difficulty, no overreach.',
      5: 'Recognized seniority from answer, adjusted remaining trajectory. Senior → harder, junior → scaffolded.',
    },
  },

  CHAIN_COHERENCE: {
    label: 'Chain Coherence (5.8)',
    veto: false,
    scores: {
      1: 'Zero logical connection. Random topic change.',
      2: 'Weak/thin link. Jumps domains too fast.',
      3: 'Coherent, appropriate. Human might ask it.',
      4: 'Strong link. Step 2 of deliberate deep-dive. Candidate sees why.',
      5: 'Every follow-up = calculated skill verification. Full sequence tells a story.',
    },
  },

  // ── Stage 7 — TimeKeeper ─────────────────────────────────────────────────

  TK_TONE: {
    label: 'Message Tone & Helpfulness (7.1)',
    veto: false,
    scores: {
      1: 'Commanding or accusatory ("Move on now." / "You\'re wasting time.") OR completely vague ("Time is passing."). Recruiter either feels pressured or gets no useful guidance.',
      2: 'Mostly directive with little warmth, OR informative but not actionable — recruiter understands the problem but not what to do.',
      3: 'Neutral and clear. Recruiter gets the message but it reads like a system notification rather than a helpful partner.',
      4: 'Supportive and actionable. Recruiter knows what situation they\'re in and what a reasonable next step looks like.',
      5: 'Collaborative and calibrated. Tone matches urgency — gentle for early warnings, firm but not harsh for critical. Recruiter feels like they have a co-pilot, not an alarm.',
    },
  },

  TK_REPETITION: {
    label: 'Repetition & Contextualization (7.2)',
    veto: false,
    scores: {
      1: 'Same text sent back-to-back in rapid succession with no change in situation. Recruiter is bombarded.',
      2: 'Repeated alerts are sent with a sensible gap but use identical phrasing each time — no acknowledgment that this is a reminder.',
      3: "Frequency is reasonable. Some variety in phrasing but repeated messages don't reference the prior state.",
      4: 'Repeated messages show awareness of context: "still behind," "we haven\'t improved," etc. Frequency matches urgency level.',
      5: 'Repetition feels like a thoughtful nudge: each reminder is slightly more specific or contextualized than the last, and silent when the situation has resolved.',
    },
  },

  TK_NARRATIVE: {
    label: 'Session Narrative & Flow (7.3)',
    veto: false,
    scores: {
      1: 'Incoherent — e.g., CRITICAL alerts when interview was on schedule, random severity jumps, or recovery with no prior problem.',
      2: 'Mostly correct direction but erratic — severity spikes without gradual escalation, or silence during a genuine problem period.',
      3: 'Generally sensible. Recruiter can follow it, but a few messages feel misplaced or the escalation misses a step.',
      4: 'Clear narrative arc. Escalation and de-escalation follow the real situation. Recovery messages are appropriately timed and reference the prior state.',
      5: 'The sequence reads like a thoughtful, well-paced debrief of the interview\'s pacing. Silences are appropriate. A recruiter relying solely on these alerts would have run a well-paced interview.',
    },
  },

  // ── Stage 8 — Drift Detection ────────────────────────────────────────────

  DRIFT_ACCURACY: {
    label: 'Drift Detection Accuracy (8.1)',
    veto: false,
    scores: {
      1: 'Fires a drift alert when the candidate admits they don\'t know something or asks for clarification. OR completely misses obvious, sustained off-topic rambling.',
      2: 'Treats loosely-related content as drift (over-sensitive). OR misses rambling that a reasonable person would flag.',
      3: 'Gets clear-cut cases right. Struggles when the candidate starts on-topic but gradually drifts, or mixes relevant and tangential content.',
      4: 'Handles clear drift, ignorance, and partial drift correctly. May miss a subtle mid-answer self-correction.',
      5: 'Handles all cases: clear drift, ignorance, partial drift, self-correction, and the scenario where a follow-up question has replaced the original as the active question.',
    },
  },

  DRIFT_STATE: {
    label: 'State Machine Compliance (8.2)',
    veto: false,
    scores: {
      1: 'Sends multiple WARNINGs without waiting for recruiter intervention. OR jumps to CRITICAL without the recruiter having attempted a redirect.',
      2: 'Gets State 1 right but repeats the WARNING in State 2 before the recruiter has spoken. OR never reaches State 3 even after the recruiter intervened.',
      3: 'Correctly handles State 1 → State 2. Misses the recruiter\'s redirect signal — never escalates to State 3.',
      4: 'All three states handled correctly. Rare false trigger on State 3 (misreads a recruiter filler phrase as a genuine redirect attempt).',
      5: 'Perfect across the full path: detects first drift (State 1), waits patiently (State 2), detects a genuine recruiter redirect and escalates (State 3). Alert history resets cleanly when a new question begins.',
    },
  },

  DRIFT_QUALITY: {
    label: 'Message Quality & Actionability (8.3)',
    veto: false,
    scores: {
      1: 'Tone is commanding or blaming. OR uses deep technical jargon the recruiter cannot understand or act on.',
      2: 'Alert uses "you"-directed framing. OR redirect is vague or so generic it gives the recruiter nothing to work with.',
      3: 'Alert is concise and clear. Redirect is present but generic — tells the recruiter to redirect without giving them anything specific to say or do.',
      4: 'Alert is clear and collaborative. Redirect gives a concrete, plain-language approach the recruiter can act on immediately — may name the subject area but avoids deep jargon.',
      5: 'Alert is concise, collaborative, appropriately urgent (CRITICAL noticeably firmer than WARNING). Redirect is specific and recruiter-ready — names the topic naturally where needed, no unnecessary jargon.',
    },
  },

  // ── Stage 9 — Interview Analysis ─────────────────────────────────────────

  IA_STRUCTURAL: {
    label: 'Structural & Schema Integrity (9.1)',
    veto: true,
    scores: {
      1: 'Any skill area appears more than once. OR a skill that was planned but not asked receives the wrong zero-score summary. OR the overall band does not match its score range.',
      2: '"Misc" category used for skills that clearly belong in an existing category. OR a not-planned skill is labeled "planned but not asked" (or vice versa).',
      3: 'All structural rules followed. Minor inconsistency in how sub-skills are consolidated under a category.',
      4: 'All rules followed correctly. Zero-score cases handled with accurate labels and summaries. Misc not present or used sparingly.',
      5: 'Structurally clean. Every skill area unique, zero-score cases labeled precisely, band-score mapping correct, Misc only when genuinely necessary.',
    },
  },

  IA_CALIBRATION: {
    label: 'Score Calibration & Synthesis (9.2)',
    veto: false,
    scores: {
      1: 'Skill scores contradict the per-question evaluations (e.g., per-question score of 2, skill band "Proficient"). OR overall score is a plain average with no weighting visible.',
      2: 'Skill scores are directionally correct but significantly off in magnitude. Overall score does not reflect the JD\'s relative skill priorities.',
      3: 'Skill scores are reasonable. Overall score is in the right direction but under- or over-weights one area noticeably.',
      4: 'Skill scores align well with the per-question evidence. Overall score reflects the relative importance of skill areas as signaled by the job description.',
      5: 'Skill scores precisely calibrated to interview evidence. Overall score is a clearly defensible, weighted synthesis — a hiring manager could trace the reasoning from evidence to final number.',
    },
  },

  IA_DISCUSSION: {
    label: 'Discussion Points Quality (9.3)',
    veto: false,
    scores: {
      1: 'Uses language that overstates certainty about what the JD requires. OR invents a JD connection for a skill not in the JD. OR questions use soft, indirect openers.',
      2: 'Discussion points raised for areas where the candidate performed well and there is nothing genuinely unclear. Reasoning jumps to conclusions rather than describing observations.',
      3: 'Points are relevant to genuine gaps. Reasoning describes what happened but sometimes starts with the conclusion rather than the observation. Questions are direct but overly generic.',
      4: 'Points are ordered by how much attention they deserve. Reasoning starts with what was observed before noting the gap. Questions are specific to the interview evidence. JD references are measured and accurate.',
      5: 'Discussion points are precisely targeted. Reasoning is factual and surface-level — it flags without rendering a verdict. Questions are direct, specific, and flow naturally from the reasoning. JD references are soft and accurate.',
    },
  },
};
