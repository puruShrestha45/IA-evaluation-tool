// ═══════════════════════════════════════════════════════════════════════════
//  RUBRIC DATA  — synced with IA_Evaluation_Rubric_v2.md
// ═══════════════════════════════════════════════════════════════════════════

export const RUBRICS = {

  // ── Stage 2 — JD Extraction ─────────────────────────────────────────────

  JD_MUST_HAVES: {
    label: 'JD Must Haves (2.1)',
    dimensionId: '2.1',
    question: "Did the system correctly separate must-have skills from nice-to-haves?",
    reasoning: "Marking an optional skill as required can screen out qualified candidates who just lack a nice-to-have.",
    veto: true,
    scores: {
      1: "Required and optional lists are largely reversed",
      2: "Several skills swapped — preferred treated as must-have or vice versa",
      3: "One skill clearly misclassified, the rest correct",
      4: "One borderline skill put in the wrong bucket",
      5: "Every skill placed correctly — required where the JD says required, optional where it says preferred"
    },
    dimensions: {
      1: ["Required and optional swapped", "Nice-to-haves as must-haves", "Must-haves as optional", "Wrong split throughout"],
      2: ["Required and optional swapped", "Nice-to-haves as must-haves", "Must-haves as optional", "Wrong split throughout"],
      3: ["One clear mix-up", "Preferred as required", "One required as optional", "Rest is fine"],
      4: ["One edge case wrong", "One borderline skill", "Near-perfect split", "Mostly correct"],
      5: ["All placements correct", "Matched JD framing", "Required list clean", "Optional list accurate"]
    }
  },

  JD_PRECISION: {
    label: 'JD Precision (2.2)',
    dimensionId: '2.2',
    question: "Did the system extract clean relevant keywords? like 'Python' or 'Snowflake'",
    reasoning: "Vague skills break resume matching. The list needs to be concrete keywords a recruiter would actually search for.",
    veto: true,
    scores: {
      1: "Most items are generic phrases, not actionable keywords",
      2: "Several vague phrases in the list — they would create false matches",
      3: "A few vague concepts mixed in with otherwise good skills",
      4: "One slightly vague item, the rest are clean and specific",
      5: "Every skill is a concrete tool, language, or framework"
    },
    dimensions: {
      1: ["Mostly vague phrases", "Not matchable", "Generic throughout", "Filler included"],
      2: ["Mostly vague phrases", "Not matchable", "Generic throughout", "Filler included"],
      3: ["Vague concepts mixed in", "Some noise present", "Hard to use as-is", "Needs filtering"],
      4: ["One borderline item", "Mostly clean", "Minor vagueness", "Good overall"],
      5: ["All concrete skills", "Ready for matching", "No vague phrases", "Clean keyword list"]
    }
  },

  JD_COMPLETENESS: {
    label: 'JD Completeness (2.3)',
    dimensionId: '2.3',
    question: "Did the system capture all key requirements from the JD without adding anything that isn't there?",
    reasoning: "A missing must-have skill or an invented requirement directly affects who gets screened in or out.",
    veto: true,
    scores: {
      1: 'A must-have is wrong or fabricated — not in the JD at all.',
      2: 'A key must-have skill was missed, or a requirement was invented.',
      3: 'Most of it right, but one requirement was missed or slightly inflated.',
      4: 'All critical fields captured, one minor detail omitted.',
      5: 'All key skills, seniority, experience level, domain, and degree captured — nothing added.',
    },
    dimensions: {
      1: ["Made up a requirement", "Missed a must-have", "Wrong experience level", "Not in the JD"],
      2: ["Made up a requirement", "Missed a must-have", "Wrong experience level", "Not in the JD"],
      3: ["One requirement off", "Slightly inflated", "One miss", "Mostly accurate"],
      4: ["One minor gap", "Small omission", "Critical fields all there", "Mostly complete"],
      5: ["Everything captured", "Nothing added", "Traceable to JD", "Complete and accurate"]
    }
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
    label: 'Is the work history accurate — right roles, companies, seniority, and dates? (4.1)',
    dimensionId: '4.1',
    question: "Did the system correctly capture each job, including company, role, worker title, and dates?",
    reasoning: "A wrong company or date gives the recruiter incorrect context before the interview starts.",
    veto: false,
    scores: {
      1: "A role is missing, or a company is hallucinated",
      2: "A role is tied to the wrong company, or dates are clearly wrong",
      3: "Roles correct, but seniority not split cleanly from the title, or a gap was missed",
      4: "All correct, one minor date formatting or abbreviation issue",
      5: "Every role, company, seniority split, and date is accurate"
    },
    dimensions: {
      1: ["Wrong company", "Role missing", "Dates out of order", "Hallucinated employer"],
      2: ["Wrong company", "Role missing", "Dates out of order", "Hallucinated employer"],
      3: ["Seniority not split", "Missed a gap", "Dates approximate", "Close but rough"],
      4: ["Minor date format", "One small quirk", "Mostly accurate", "Mostly polished"],
      5: ["All roles correct", "Seniority split right", "Dates accurate", "No gaps missed"]
    }
  },

  RESUME_CONTAINS: {
    label: 'Did the system extract everything informative the resume actually contained? (4.2)',
    dimensionId: '4.2',
    question: "Given what this resume offers, did the system capture the useful skill details — role, recency, and proficiency level?",
    reasoning: "A good extraction reflects what's possible from this specific resume. If the resume shows years of Kafka use at Stripe, that should come through; if it only mentions a skill in passing, only outputing that is okay.",
    veto: false,
    scores: {
      1: "Extracted skills as if from a generic template — ignored what the resume specifically offered",
      2: "Flat list; missed most of the context the resume actually contained",
      3: "Captured the basics but lost several details the resume clearly provided",
      4: "Captured most informative details; missed one or two available signals (e.g., a role link or a recency cue)",
      5: "Captured every informative detail the resume offered — role, recency, and proficiency level wherever the resume supported them"
    },
    dimensions: {
      1: ["Flat list", "Ignored role context", "No recency captured", "Generic output"],
      2: ["Flat list", "Ignored role context", "No recency captured", "Generic output"],
      3: ["Lost role context", "Recency unclear", "No proficiency signal", "Basics only"],
      4: ["Missed one role link", "Minor recency gap", "Proficiency partly shown", "Close to complete"],
      5: ["Reflects the resume fully", "Role links captured", "Recency clear", "Proficiency signaled"]
    }
  },

  RESUME_IDENTITY: {
    label: "Are the candidate's contact details and identity accurate? (4.3)",
    dimensionId: "4.3",
    question: "Did the system get the name, email, region, and profile links right?",
    reasoning: "Wrong contact info or region breaks candidate routing and recruiter outreach.",
    veto: false,
    scores: {
      1: "Name or email is incorrect or hallucinated",
      2: "One contact field is wrong — e.g., wrong region or missing email",
      3: "All correct but region inferred from wrong source, or a URL slightly off",
      4: "All correct, one minor formatting difference such as casing in name",
      5: "Name, email, region (with phone inference if needed), and profile URLs all accurate"
    },
    dimensions: {
      1: ["Wrong region", "Email missing", "Name wrong", "Contact field hallucinated"],
      2: ["Wrong region", "Email missing", "Name wrong", "Contact field hallucinated"],
      3: ["Region from wrong source", "URL slightly off", "Minor inference error", "Acceptable"],
      4: ["Minor casing issue", "One small quirk", "Essentially correct", "Trivial formatting"],
      5: ["All fields correct", "Phone region inferred", "URLs preserved", "Clean identity"]
    }
  },

  RESUME_COMPLETENESS: {
    label: "Is the output complete — all jobs, projects, and certifications captured? (4.4)",
    dimensionId: "4.4",
    question: "Did the system capture everything on the resume — no section skipped?",
    reasoning: "A missed certification or job changes the candidate's profile entirely.",
    veto: false,
    scores: {
      1: "More than one section is missing or the output is severely incomplete",
      2: "A whole section is missing when it clearly exists on the resume",
      3: "One full job or certification entry is missing or sparse",
      4: "All major sections there, one minor item slightly incomplete",
      5: "Every section present — all jobs, projects, certifications, and education"
    },
    dimensions: {
      1: ["Whole section missing", "Job not captured", "Certifications dropped", "Severely incomplete"],
      2: ["Whole section missing", "Job not captured", "Certifications dropped", "Severely incomplete"],
      3: ["One entry thin", "Section sparse", "Notable omission", "Mostly covered"],
      4: ["One minor gap", "Mostly complete", "Small omission", "Core sections there"],
      5: ["Every section captured", "Nothing skipped", "Full profile", "Complete extraction"]
    }
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

  // ── Stage 5 — Question Gen, Follow-Up & Scoring ──────────────────────────

  QUESTION_TAILORING: {
    label: "Are the questions actually based on this candidate and role? (5.1)",
    dimensionId: "5.1",
    question: "Do the question feel specific to this candidate and this role?",
    reasoning: "Generic questions could be asked to anyone. Good questions should feel tailored.",
    veto: false,
    scores: {
      1: "Could be asked to anyone — no connection",
      2: "References the industry but doesn't connect candidate and role",
      3: "No that much. Questions feel role-appropriate but generic",
      4: "Yes. The quesiton looks informed by at least one, resume or JD",
      5: "Yes. The question connects to both the resume and the role"
    },
    dimensions: {
      1: ["Generic questions", "No resume link", "No role connection", "Could fit any candidate"],
      2: ["Generic questions", "No resume link", "No role connection", "Could fit any candidate"],
      3: ["Feels templated", "Role-fit only", "Could be anyone", "Needs more specificity"],
      4: ["Mostly tailored", "A few are generic", "Strong overall", "Good coverage"],
      5: ["Clearly tailored", "Uses resume details", "Targets dealbreakers", "Feels like a real plan"]
    }
  },

  QUESTION_CALIBRATION: {
    label: "Are the questions fair and calibrated right? (5.2)",
    dimensionId: "5.2",
    question: "Is the question fair and at the right difficulty?",
    reasoning: "Questions shouldn't be trap-based, too hard, too easy, or test things outside the role.",
    veto: false,
    scores: {
      1: "Tests things that aren't in the JD",
      2: "Too easy, too hard, or too many trick in the question",
      3: "Standard difficulty, doesn't really distinguish levels",
      4: "Basic path plus room for a great candidate to shine",
      5: "Range of difficulty that separates junior from senior fairly"
    },
    dimensions: {
      1: ["Trap questions", "Too technical for role", "Outside the JD", "Gotcha style"],
      2: ["Trap questions", "Too technical for role", "Outside the JD", "Gotcha style"],
      3: ["All same difficulty", "Doesn't separate levels", "Feels repetitive", "Standard"],
      4: ["Low floor, high ceiling", "Mostly fair", "One or two easy ones", "Good range"],
      5: ["Calibrated well", "Room to shine", "Separates seniority", "Fair across levels"]
    }
  },

  QUESTION_TONE: {
    label: "Do the questions sound like a real interviewer? (5.3)",
    dimensionId: "5.3",
    question: "Do the question sound natural — like a real interviewer would ask it?",
    reasoning: "Robotic, repetitive, or awkward phrasing hurts the candidate experience.",
    veto: false,
    scores: {
      1: "Robotic, awkward, or reveals internal system talk",
      2: "Same phrasing repeated, no flow",
      3: "Professional but clearly AI-generated",
      4: "Conversational, with a bit of variety",
      5: "Sounds like a skilled human interviewer"
    },
    dimensions: {
      1: ["Robotic", "Repetitive openers", "Reveals system talk", "Awkward phrasing"],
      2: ["Robotic", "Repetitive openers", "Reveals system talk", "Awkward phrasing"],
      3: ["Professional but flat", "Clearly AI", "Too formal", "Needs warmth"],
      4: ["Mostly conversational", "Some variety", "Reads well", "Minor stiffness"],
      5: ["Sounds human", "Natural flow", "Varied phrasing", "Curious, not interrogative"]
    }
  },

  QUESTION_COVERAGE: {
    label: "Do the questions cover all the must-have skills from the JD? (5.4)",
    dimensionId: "5.4",
    question: "Is the question properly informed by the most important skills from the JD?",
    reasoning: "If the interview skips a must-have skill entirely, there's no evidence to evaluate the candidate on it.",
    veto: false,
    scores: {
      1: "No relevant skill was taken into consideration",
      2: "It seems to ignore the must-have skills",
      3: "Kind of. A main technical skills was others were more important",
      4: "Yes. A relevant enough skill was covered",
      5: "Yes. It uses must-have skills from the JD"
    },
    dimensions: {
      1: ["Must-have not tested", "Key skill missing", "Multiple coverage gaps", "Misaligned with JD"],
      2: ["Must-have not tested", "Key skill missing", "Multiple coverage gaps", "Misaligned with JD"],
      3: ["One must-have skipped", "Mostly covered", "Gap in key area", "Coverage partial"],
      4: ["One minor skill skipped", "Core skills all there", "Strong coverage", "Minor gap only"],
      5: ["All must-haves covered", "No coverage gaps", "Full JD alignment", "Every skill tested"]
    }
  },

  QUESTION_CONFIDENTIALITY: {
    label: "Were questions kept confidential when they should be? (5.5)",
    dimensionId: "5.5",
    question: "Do the question stay professional without leaking internal info?",
    reasoning: "Candidates shouldn't know the hiring manager said something, or see the scoring rubric.",
    veto: false,
    scores: {
      1: "Mentions the hiring manager, transcript, or scoring to the candidate",
      2: "Mentions the resume directly (\"I see you have…\")",
      3: "No leakage, but hard to audit why the question was asked",
      4: "No leakage, minor citation gap",
      5: "Clean — only what a candidate should hear, and traceable to sources internally"
    },
    dimensions: {
      1: ["Mentions hiring manager", "Quotes transcript", "Reveals resume read", "Shows scoring"],
      2: ["Mentions hiring manager", "Quotes transcript", "Reveals resume read", "Shows scoring"],
      3: ["No leaks but vague", "Hard to audit", "Missing reasoning", "Unclear source"],
      4: ["Mostly clean", "Small citation gap", "Safe overall", "Minor issue"],
      5: ["Clean boundaries", "Nothing leaked", "Candidate-safe", "Well-sourced"]
    }
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

  // ── Stage 9 — TimeKeeper ─────────────────────────────────────────────────

  TK_TONE: {
    label: 'Message Tone & Helpfulness (9.1)',
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
    label: 'Repetition & Contextualization (9.2)',
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
    label: 'Session Narrative & Flow (9.3)',
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

  // ── Stage 11 — Interview Analysis ────────────────────────────────────────

  // ── Stage 11 — Interview Analysis ────────────────────────────────────────

  IA_STRUCTURAL: {
    label: 'Structural Integrity (11.1)',
    dimensionId: '11.1',
    question: 'Is the analysis structurally complete and consistent?',
    reasoning: 'Checks for schema violations, duplicate skills, and score-band alignment.',
    veto: true,
    scores: {
      1: 'Broken logic, duplicates, or score-band mismatch.',
      2: '"Misc" category overused; mismatched skills.',
      3: 'Basic rules followed, minor schema friction.',
      4: 'Minor inconsistencies in sub-skills.',
      5: 'Perfect structure and alignment.',
    },
    dimensions: {
      1: ["Broken schema", "Duplicate skills", "Score-band mismatch", "Poor categorization"],
      2: ["Broken schema", "Duplicate skills", "Score-band mismatch", "Poor categorization"],
      3: ["Mostly correct", "Minor categorization gaps", "Serviceable", "Basic integrity"],
      4: ["Mostly correct", "Minor categorization gaps", "Serviceable", "Basic integrity"],
      5: ["Structurally clean", "Perfect alignment", "No duplicates", "HM-ready"]
    }
  },

  IA_CALIBRATION: {
    label: 'Score Calibration (11.2)',
    dimensionId: '11.2',
    question: 'Are the skill scores and overall rating accurately calibrated?',
    reasoning: 'Ensures the summary scores reflect the detailed evidence from the interview.',
    veto: false,
    scores: {
      1: 'Scores contradict evidence or lack weighting logic.',
      2: 'Scores directionally right but magnitude is off.',
      3: 'Reasonable scores; slightly off in scale or priority.',
      4: 'Strong alignment with evidence; minor weighting drift.',
      5: 'Precisely calibrated to evidence and priorities.',
    },
    dimensions: {
      1: ["Contradicts evidence", "No weighting logic", "Significant scaling error", "Inaccurate summary"],
      2: ["Contradicts evidence", "No weighting logic", "Significant scaling error", "Inaccurate summary"],
      3: ["Broadly correct", "Minor weighting issues", "Right direction", "Standard calibration"],
      4: ["Broadly correct", "Minor weighting issues", "Right direction", "Standard calibration"],
      5: ["Precisely calibrated", "Weighted synthesis", "Evidence-based", "Accurate overall"]
    }
  },

  IA_DISCUSSION: {
    label: 'Next-Round Topics (11.3)',
    dimensionId: '11.3',
    question: 'Are the discussion points actionable and based on specific evidence?',
    reasoning: 'Checks if next-round topics are useful, specific, and grounded in observations.',
    veto: false,
    scores: {
      1: 'Fabricated connections or poor follow-up focus.',
      2: 'Points raised for non-issues; weak reasoning.',
      3: 'Relevant but generic; conclusion-first reasoning.',
      4: 'Specific and ordered by priority; evidence-based.',
      5: 'Targeted, factual, and direct next-round guidance.',
    },
    dimensions: {
      1: ["Fabricated issues", "Non-actionable", "Vague reasoning", "Misplaced focus"],
      2: ["Fabricated issues", "Non-actionable", "Vague reasoning", "Misplaced focus"],
      3: ["Relevant but generic", "Observation gaps", "Safe choices", "Basic guidance"],
      4: ["Relevant but generic", "Observation gaps", "Safe choices", "Basic guidance"],
      5: ["Targeted guidance", "Evidence-grounded", "Direct questions", "Highly actionable"]
    }
  },

  // ── Stage 7 — Answer Evaluation (Per-Question) ───────────────────────────

  ANSWER_SCORE_ACCURACY: {
    label: 'Score Accuracy (7.1)',
    veto: true,
    scores: {
      1: 'Score contradicts the answer — high for vague/wrong, low for clear/detailed. OR score based on invented content not in the transcript.',
      2: 'Directionally correct but significantly off in magnitude. A 7 for an answer reviewers would rate 3–4, or vice versa.',
      3: 'Right range. Minor calibration drift — off by 1–2 points in a predictable direction (too generous or too strict).',
      4: 'Matches quality with at most 1-point drift. Consistent calibration. Hard and easy answers correctly separated.',
      5: 'Precisely calibrated. A reviewer reading the transcript and score would immediately agree. No drift across easy/medium/hard answers.',
    },
  },

  ANSWER_EVIDENCE_GROUNDING: {
    label: 'Evidence Grounding (7.2)',
    veto: true,
    scores: {
      1: 'One or more strengths or gaps reference content the candidate did not say. Fabricated claims present.',
      2: 'No fabrication, but draws on prior turns without flagging it — creating a false impression of this specific answer.',
      3: 'All claims traceable to the transcript. Some are vague paraphrases that lose the specificity of what was actually said.',
      4: 'All claims specific and traceable. Vague paraphrases absent. Each strength and gap maps to a discrete candidate statement.',
      5: 'Every claim directly quoted or precisely paraphrased. A reviewer could verify each claim without ambiguity.',
    },
  },

  ANSWER_CLASSIFICATION_ACCURACY: {
    label: 'Classification Accuracy (7.3)',
    veto: false,
    scores: {
      1: 'Label crosses the follow-up boundary — Strong/Excellent when score <7, or Irrelevant/Basic/Adequate when score ≥7.',
      2: 'Label wrong but both assigned and correct labels are on the same side of the score-7 threshold. Or wrong scoring system applied.',
      3: 'Correct for clear cases. Struggles on borderline Adequate vs. Strong (score 6 vs 7), or wrong system for role seniority.',
      4: 'Correct including borderline cases. Correct scoring system applied. Label and numeric score internally consistent.',
      5: 'Precisely reflects quality within the correct system. Reasoning explicitly maps label choice to observable transcript evidence.',
    },
  },

  ANSWER_GAP_STRENGTH: {
    label: 'Gap & Strength Identification (7.4)',
    veto: false,
    scores: {
      1: 'Strengths or gaps are fabricated. OR major strength missed entirely. OR critical gap not identified when answer clearly showed one.',
      2: 'Correct direction but vague. Strengths listed are generic ("good communication"). Gaps are too broad ("lacks depth").',
      3: 'Correct identification of main strength and main gap. Missing secondary gaps a careful reviewer would note.',
      4: 'All significant strengths and gaps identified. Each specific enough to be actionable for the follow-up decision. No fabrication.',
      5: 'Precisely identified and ordered by significance. Each maps to the skill being assessed. A follow-up could be derived directly from the gaps.',
    },
  },

  // ── Stage 8 — Follow-Up Question Generation ──────────────────────────────

  FOLLOWUP_ANSWER_GROUNDING: {
    label: 'Answer Grounding (8.2)',
    veto: false,
    scores: {
      1: 'Template question with no connection to the candidate\'s answer — could have been asked before they spoke.',
      2: 'References the general topic of the answer but not any specific claim or gap the candidate created.',
      3: 'References the answer generally ("you mentioned X — can you go deeper?") but doesn\'t target the specific missing piece.',
      4: 'Targets a specific gap from the candidate\'s answer. A reviewer would immediately understand why this follow-up was chosen.',
      5: 'Precisely derived from the answer. Names the specific claim or absence. The exact probe needed to resolve the gap.',
    },
  },

  FOLLOWUP_CHAIN_COHERENCE: {
    label: 'Chain Coherence (8.3)',
    veto: false,
    scores: {
      1: 'Shifts to a different skill domain with no logical connection to the answer.',
      2: 'Same general topic but lateral — doesn\'t probe deeper on the identified gap.',
      3: 'On-topic and adds some value. Probes one level deeper but misses the most important sub-gap.',
      4: 'One deliberate level deeper on the right sub-skill. Candidate and reviewer would both understand why this question follows.',
      5: 'Precise next step in competency assessment. Original + follow-up together tell a complete story of the skill.',
    },
  },

  FOLLOWUP_FRAMING: {
    label: 'Framing & Naturalness (8.4)',
    veto: false,
    scores: {
      1: 'Leaks internal state — uses evaluation language, score references, or system framing visible to the candidate.',
      2: 'Indirect openers ("Can you", "Could you", "Would you") or passive-aggressive framing.',
      3: 'Professional and direct. May feel slightly generic or formal. Clearly AI-generated but not off-putting.',
      4: 'Sounds like a skilled interviewer\'s natural next question. Direct, specific, conversational. No evaluative language.',
      5: 'Seamless. Acknowledges the candidate\'s answer as curiosity, not interrogation. Indistinguishable from a skilled human probe.',
    },
  },

};
