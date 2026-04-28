// ═══════════════════════════════════════════════════════════════════════════
//  RUBRIC DATA  — synced with IA_Evaluation_Rubric_v2.md
// ═══════════════════════════════════════════════════════════════════════════

export const RUBRICS = {

  // ── Stage 2 — JD Extraction ─────────────────────────────────────────────

  JD_MUST_HAVES: {
    label: 'JD Must Haves (2.1)',
    dimensionId: '2.1',
    question: "Did the system capture all the skills, and are they in the right category?",
    reasoning: "Missing or miscategorized skills mean candidates get screened against the wrong bar from the start.",
    veto: true,
    scores: {
      5: "All skills captured; must-haves and optional are correctly separated.",
      4: "All skills present; a few are in the wrong category.",
      3: "A few skills missing, or a few swapped between must-have and optional.",
      2: "Several skills missing and the must-have vs. optional split has widespread errors.",
      1: "The skills section is largely incomplete or the categories are entirely wrong."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Optional listed as must-have", "Must-have listed as optional", "Skill missing", "Wrong domain group"],
      3: ["Optional listed as must-have", "Must-have listed as optional", "Skill missing", "Wrong domain group"],
      2: ["Many skills missing", "Must-have vs. optional inverted", "Skills section mostly empty"],
      1: ["Many skills missing", "Must-have vs. optional inverted", "Skills section mostly empty"]
    }
  },

  // JD_PRECISION: {
  //   label: 'JD Precision (2.2)',
  //   dimensionId: '2.2',
  //   question: "Did the system extract clean relevant keywords? like 'Python' or 'Snowflake'",
  //   reasoning: "Vague skills break resume matching. The list needs to be concrete keywords a recruiter would actually search for.",
  //   veto: true,
  //   scores: {
  //     1: "Most items are generic phrases, not actionable keywords",
  //     2: "Several vague phrases in the list — they would create false matches",
  //     3: "A few vague concepts mixed in with otherwise good skills",
  //     4: "One slightly vague item, the rest are clean and specific",
  //     5: "Every skill is a concrete tool, language, or framework"
  //   },
  //   dimensions: {
  //     1: ["Mostly vague phrases", "Not matchable", "Generic throughout", "Filler included"],
  //     2: ["Mostly vague phrases", "Not matchable", "Generic throughout", "Filler included"],
  //     3: ["Vague concepts mixed in", "Some noise present", "Hard to use as-is", "Needs filtering"],
  //     4: ["One borderline item", "Mostly clean", "Minor vagueness", "Good overall"],
  //     5: ["All concrete skills", "Ready for matching", "No vague phrases", "Clean keyword list"]
  //   }
  // },

  JD_COMPLETENESS: {
    label: 'JD Completeness (2.2)',
    dimensionId: '2.2',
    question: "Did the system correctly capture the rest of the JD: role details, domain, other requirements, and education?",
    reasoning: "Because inaccurate context like title, seniority or missing education requirement quietly misguide the system logic when ranking candidates.",
    veto: true,
    scores: {
      5: "Role title, seniority, experience, domain, other requirements, and education are all complete and accurate.",
      4: "Everything present; a few items from one section are slightly off or incomplete.",
      3: "A few items from two or more sections are inaccurate or missing.",
      2: "Two or more sections have significant gaps, or one section is entirely absent.",
      1: "Most sections are absent or inaccurate; the JD context is largely lost."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Title or seniority inaccurate", "Years of experience inaccurate", "Education item missing", "Some Other Requirements missing"],
      3: ["Title or seniority inaccurate", "Years of experience inaccurate", "Education item missing", "Some Other Requirements missing"],
      2: ["Role title absent", "Education section absent", "Domain not extracted", "Other Requirements fully absent"],
      1: ["Role title absent", "Education section absent", "Domain not extracted", "Other Requirements fully absent"]
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

  RESUME_PROFILE: {
    label: "Did the system correctly capture the candidate's profile details? (4.1)",
    dimensionId: '4.1',
    question: "Did the system correctly capture the candidate's profile details?",
    reasoning: "The profile is the first thing a recruiter sees; a wrong role label or missing contact makes the candidate harder to route and follow up with.",
    veto: false,
    scores: {
      5: "Name, role, location, and all contact fields are complete and accurate.",
      4: "Most fields are present but a few contact items are missing that appear in the resume.",
      3: "Around half of the fields are inaccurate or missing across name, role, location, or contacts.",
      2: "Several profile fields missing or inaccurate; the candidate is hard to identify.",
      1: "Profile section largely absent or details invented that aren't in the resume."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Role label inaccurate", "Location missing or wrong", "Contact field missing", "Name formatting off"],
      3: ["Role label inaccurate", "Location missing or wrong", "Contact field missing", "Name formatting off"],
      2: ["Name absent or wrong", "Role not extracted", "All contacts missing", "Details not in resume"],
      1: ["Name absent or wrong", "Role not extracted", "All contacts missing", "Details not in resume"]
    }
  },

  RESUME_POSITIONS: {
    label: "Did the system correctly capture the position overview for each role? (4.2)",
    dimensionId: '4.2',
    question: "Did the system correctly capture the position overview for each role?",
    reasoning: "Role title, company name, seniority, industry, and dates are what recruiters use to evaluate career trajectory; errors here distort the candidate's story before the interview starts.",
    veto: false,
    scores: {
      5: "Every role has the correct title, company name, seniority, industry, start date, and end date.",
      4: "All roles present but a few fields are slightly off or missing in one or two roles.",
      3: "All roles present but several roles have a few errors across title, seniority, industry, or dates.",
      2: "Several roles have significant field gaps or one role is entirely missing.",
      1: "Most roles missing or position details are largely invented or wrong."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Error in role title or seniority", "Industry or company name wrong", "Dates often wrong"],
      3: ["Error in role title or seniority", "Industry or company name wrong", "Dates often wrong"],
      2: ["Role missing entirely", "Company name wrong", "Dates largely absent", "Details not in resume"],
      1: ["Role missing entirely", "Company name wrong", "Dates largely absent", "Details not in resume"]
    }
  },

  RESUME_RESPONSIBILITIES: {
    label: "Did the system capture the responsibilities and skills for each role? (4.3)",
    dimensionId: '4.3',
    question: "Did the system capture the responsibilities and skills for each role?",
    reasoning: "Responsibilities show what the candidate actually did; skills confirm the tools they used. Both are needed to generate relevant interview questions.",
    veto: false,
    scores: {
      5: "All responsibilities and skills captured accurately for every role.",
      4: "Responsibilities and skills mostly complete but a few items missing or slightly off in one role.",
      3: "A few responsibilities or skills incomplete across two or more roles.",
      2: "Responsibilities or skills have significant gaps in several roles or one role's content is entirely absent.",
      1: "Responsibilities and skills largely missing or content invented that isn't in the resume."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Responsibility missing or inaccurate", "Skill missing"],
      3: ["Responsibility missing or inaccurate", "Skill missing"],
      2: ["Responsibilities and skills absent", "Content not in resume", "Full role content missing"],
      1: ["Responsibilities and skills absent", "Content not in resume", "Full role content missing"]
    }
  },

  RESUME_SKILLS: {
    label: "Did the system capture all skills and place them in the right category? (4.4)",
    dimensionId: '4.4',
    question: "Did the system capture all skills and place them in the right category?",
    reasoning: "Missing or miscategorized skills change how the candidate is evaluated; a soft skill listed as technical shifts the whole assessment.",
    veto: false,
    scores: {
      5: "All technical and soft skills captured and correctly separated.",
      4: "All skills present but a few are in the wrong category.",
      3: "A few skills missing.",
      2: "Several skills missing and the technical vs. soft split has widespread errors.",
      1: "Skills section largely incomplete or categories entirely wrong."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Soft skill listed as technical", "Technical skill listed as soft", "Technical skill missing", "Soft skill missing"],
      3: ["Soft skill listed as technical", "Technical skill listed as soft", "Technical skill missing", "Soft skill missing"],
      2: ["Technical skills absent", "Soft skills absent", "Technical vs. soft inverted", "Skills section mostly empty"],
      1: ["Technical skills absent", "Soft skills absent", "Technical vs. soft inverted", "Skills section mostly empty"]
    }
  },

  RESUME_CREDENTIALS: {
    label: "Did the system correctly capture education, certifications, and projects? (4.5)",
    dimensionId: '4.5',
    question: "Did the system correctly capture education, certifications, and projects?",
    reasoning: "Education and certifications validate credentials; projects show applied work. Missing or invented items here directly affect how the candidate's background is understood.",
    veto: false,
    scores: {
      5: "Education, certifications, and projects all complete and accurate.",
      4: "All sections present but a few items slightly off or incomplete within one section.",
      3: "A few items missing or inaccurate across two or more sections.",
      2: "One section has significant gaps or is entirely absent.",
      1: "Most sections absent or content invented that isn't in the resume."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Certification or education date wrong", "Certification item missing", "Education degree incomplete", "Project item missing"],
      3: ["Certification or education date wrong", "Certification item missing", "Education degree incomplete", "Project item missing"],
      2: ["Education section absent", "Certifications absent", "Projects absent", "Content not in resume"],
      1: ["Education section absent", "Certifications absent", "Projects absent", "Content not in resume"]
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

  QUESTION_RELEVANCE: {
    label: "Does the question target something that actually matters for this role? (5.1)",
    dimensionId: "5.1",
    question: "Does the question target something that actually matters for this role?",
    reasoning: "Questions should connect to the specific skills, responsibilities, and seniority level in the JD; a question that ignores what the role requires wastes the interview's limited time.",
    veto: false,
    scores: {
      5: "Question clearly targets a specific skill, responsibility, or seniority expectation from the JD.",
      4: "Question is relevant but lacks explicitness to a specific skill or responsibility.",
      3: "Question is broadly relevant to the field but doesn't target a specific JD skill, responsibility, or seniority expectation.",
      2: "Question is tangentially related to the industry but misses the role's actual requirements or seniority level.",
      1: "Question has no connection to the role; could be asked in any interview regardless of role or level."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Does not assess a specific skill", "Does not assess a specific responsibility", "Does not reflect seniority level"],
      3: ["Does not assess a specific skill", "Does not assess a specific responsibility", "Does not reflect seniority level"],
      2: ["No JD connection", "Generic question", "Wrong seniority level", "Assesses unrelated skill"],
      1: ["No JD connection", "Generic question", "Wrong seniority level", "Assesses unrelated skill"]
    }
  },

  QUESTION_TAILORING: {
    label: "Does the question make good use of what this candidate's resume actually offers? (5.2)",
    dimensionId: "5.2",
    question: "Does the question make good use of what this candidate's resume actually offers?",
    reasoning: "A good question leverages the candidate's specific background to get meaningful signal; asking a 10-year database expert whether they know SQL tells us nothing. The question should be worth asking for this particular person.",
    veto: false,
    scores: {
      5: "Question draws on the candidate's specific experience, seniority, or background to get deep, meaningful signal.",
      4: "Question fits but doesn't fully leverage what makes their profile distinctive.",
      3: "Question is appropriate but ignores aspects from the profile that would make it more informative.",
      2: "Question doesn't reflect the candidate's background; the resume was largely ignored in forming it.",
      1: "Question is not worth asking; it either repeats something obvious or assumes something they clearly don't have."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Ignores relevant experience", "Too surface-level for this background", "Doesn't reflect seniority", "Generic for this profile"],
      3: ["Ignores relevant experience", "Too surface-level for this background", "Doesn't reflect seniority", "Generic for this profile"],
      2: ["Obvious given their resume", "Assumes experience not in resume", "Resume not used at all", "Not worth asking"],
      1: ["Obvious given their resume", "Assumes experience not in resume", "Resume not used at all", "Not worth asking"]
    }
  },

  QUESTION_CLARITY: {
    label: "Is the question clear and easy to ask in a live conversation? (5.3)",
    dimensionId: "5.3",
    question: "Is the question clear and easy to ask in a live conversation?",
    reasoning: "Technical terms are allowed but the question still needs to be a single, well-formed sentence; awkward phrasing or more context than necessary makes recruiters stumble and candidates lose the thread.",
    veto: false,
    scores: {
      5: "Single, well-formed question; clear intent, easy to say aloud, no unnecessary complexity.",
      4: "Clear question but with minor phrasing or grammar issues that don't affect understanding.",
      3: "The intent is understandable but the question has an extra clause or more context than necessary.",
      2: "Two or more questions are combined, or the structure is awkward enough that a candidate would need clarification.",
      1: "Question is impossible to follow as asked; the structure or phrasing fully breaks communication."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["More context than necessary", "Awkward phrasing", "Unclear intent"],
      3: ["More context than necessary", "Awkward phrasing", "Unclear intent"],
      2: ["Multiple questions", "Broken grammar or structure", "Impossible to follow", "Candidate would need clarification"],
      1: ["Multiple questions", "Broken grammar or structure", "Impossible to follow", "Candidate would need clarification"]
    }
  },

  QUESTION_RATIONALE: {
    label: "Does the 'why this question was asked' explanation make sense? (5.4)",
    dimensionId: "5.4",
    question: "Does the 'why this question was asked' explanation make sense for this question?",
    reasoning: "Recruiters use this section to understand what they are trying to find out; a vague or misaligned rationale leaves them without direction during the conversation.",
    veto: false,
    scores: {
      5: "Rationale is specific, accurate, and clearly explains why this question matters for this role and candidate.",
      4: "Rationale is accurate but could have been explained in a simpler manner.",
      3: "Not a good explanation; mostly restates the question without adding useful context.",
      2: "Rationale doesn't match the question asked or references the wrong skill or responsibility.",
      1: "Rationale is missing or actively misleading."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Hard to understand", "Restates the question", "Wrong skill referenced", "Wrong responsibility referenced"],
      3: ["Hard to understand", "Restates the question", "Wrong skill referenced", "Wrong responsibility referenced"],
      2: ["Rationale missing", "Contradicts the question", "References wrong role context", "Misleading rationale"],
      1: ["Rationale missing", "Contradicts the question", "References wrong role context", "Misleading rationale"]
    }
  },

  QUESTION_EXPECTED: {
    label: "Does the expected answer context help a recruiter know what a good answer looks like? (5.5)",
    dimensionId: "5.5",
    question: "Does the expected answer context help a recruiter know what a good answer looks like?",
    reasoning: "Recruiters without deep technical knowledge rely on this section to evaluate what the candidate says; if it's vague or off, they can't tell a strong answer from a weak one.",
    veto: false,
    scores: {
      5: "Expected answer is specific, actionable, and gives the recruiter clear guidance on what to listen for.",
      4: "Expected answer is useful but still too vague or missed details.",
      3: "Expected answer is not much helpful; does not address the question directly or uses unclear phrasing.",
      2: "Expected answer doesn't match the question or describes what a good answer looks like for the wrong role.",
      1: "Expected answer is missing or the content is inaccurate and would mislead the recruiter."
    },
    dimensionLabels: {
      5: "",
      4: "Minor issues",
      3: "Notable issues",
      2: "What went wrong",
      1: "What went wrong"
    },
    dimensions: {
      5: [],
      4: ["Too vague", "Missing key detail", "Restates the question"],
      3: ["Too vague", "Missing key detail", "Restates the question"],
      2: ["Expected answer missing", "Contradicts the question", "Answer is irrelevant to the role", "Would mislead the recruiter"],
      1: ["Expected answer missing", "Contradicts the question", "Answer is irrelevant to the role", "Would mislead the recruiter"]
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
