// ═══════════════════════════════════════════════════════════════════════════
//  TAB — During Interview
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel } from './utils.js';

export const CLASSIF_LABELS = [
  'New Question',
  'Continuation',
  'Interview End',
  'Out of Plan New Question',
  'Out of Plan Follow-up Question',
];
export const EVAL_RUBRICS = ['Excellent', 'Good', 'Adequate', 'Inadequate', 'Poor'];

// ── Data helpers ──────────────────────────────────────────────────────────

export function isNewQOrEnd(e) {
  if (e.role !== 'system' || e.task !== 'classification') return false;
  const c = e.output?.classification;
  return c === 'New Question' || c === 'Interview End';
}

function isEvalOrFollowup(e) {
  return e.role === 'system' && (e.task === 'evaluation' || e.task === 'follow-up');
}

// Eval+followup for a previous question appear in the raw data AFTER the next
// new-question classification. Reorder so they display BEFORE that classification
// (they close out the prior question). Single forward pass with lookahead.
export function buildDisplayOrder(pit) {
  const result = [];
  let i = 0;
  while (i < pit.length) {
    const entry = pit[i];
    if (isNewQOrEnd(entry)) {
      const evalGroup = [];
      let j = i + 1;
      while (j < pit.length && isEvalOrFollowup(pit[j])) {
        evalGroup.push(pit[j]);
        j++;
      }
      result.push(...evalGroup);
      result.push(entry);
      i = j;
    } else {
      result.push(entry);
      i++;
    }
  }
  return result;
}

// ── Tab renderer ──────────────────────────────────────────────────────────

export function renderDuringInterviewTab() {
  const d   = state.data;
  const pit = d.processed_interview_transcript;
  const intervieweeName = d.interviewee_name || 'Candidate';
  const interviewerName = d.interviewer_name || 'Interviewer';

  if (!pit || !pit.length) {
    return '<div class="empty-state">No live interview transcript found for this record.</div>';
  }

  let html = '';
  const ordered = buildDisplayOrder(pit);

  // ── Pre-scan helpers ──────────────────────────────────────────────────────
  // Returns true if all annotation fields before the classification at endCi
  // are fully filled in (evals + classification cards, in display order).
  function isAllCompleteBeforeClassif(endCi) {
    let ci = 0;
    let ei = 0;
    for (let i = 0; i < ordered.length; i++) {
      const e = ordered[i];
      if (e.role !== 'system') continue;

      if (e.task === 'classification') {
        if (ci === endCi) return true;
        const ab6 = `flow_classification.c${ci}`;
        const correct = getScore(`${ab6}.classification`);
        if (!correct) return false;
        const effectiveGt = correct === 'FAIL'
          ? getScore(`${ab6}.ground_truth`)
          : (e.output?.classification || '');
        if (correct === 'FAIL' && !effectiveGt) return false;
        if (effectiveGt === 'New Question') {
          if (!getScore(`${ab6}.transcript_split`) || !getScore(`${ab6}.question_id`)) return false;
        } else if (effectiveGt?.startsWith('Out of Plan')) {
          if (!getScore(`${ab6}.oop_detection`)) return false;
        }
        ci++;
        continue;
      }

      if (e.task === 'evaluation') {
        // Stage 7 — all four dimensions must be scored
        if (!getScore(`answer_eval.e${ei}.score_accuracy`)        || !getScore(`answer_eval.e${ei}.evidence_grounding`) ||
            !getScore(`answer_eval.e${ei}.classification_accuracy`) || !getScore(`answer_eval.e${ei}.gap_strength`)) return false;
        // Stage 8.1 — necessity judgment (binary)
        if (!getScore(`followup_decision.e${ei}.necessity`)) return false;
        // Stage 8.2–8.4 — required when a follow-up was generated
        const next = ordered[i + 1];
        if (next && next.task === 'follow-up') {
          if (!getScore(`followup_decision.e${ei}.answer_grounding`) || !getScore(`followup_decision.e${ei}.chain_coherence`) ||
              !getScore(`followup_decision.e${ei}.framing`)) return false;
          i++;
        }
        ei++;
        continue;
      }
      // follow-up entries already consumed above; transcriptions skipped
    }
    return true;
  }

  // Pre-scan: find ci of "Interview End" marked CORRECT with all prior work done
  let interviewEndCorrectCi = -1;
  let totalClassifCount = 0;
  {
    let tempCi = 0;
    for (const e of ordered) {
      if (e.role === 'system' && e.task === 'classification') {
        if (e.output?.classification === 'Interview End' &&
            getScore(`flow_classification.c${tempCi}.classification`) === 'CORRECT' &&
            isAllCompleteBeforeClassif(tempCi)) {
          interviewEndCorrectCi = tempCi;
        }
        tempCi++;
      }
    }
    totalClassifCount = tempCi;
  }

  html += '<div class="di-stream">';

  let classifCounter = 0;
  let evalCounter    = 0;

  for (let i = 0; i < ordered.length; i++) {
    const entry = ordered[i];

    // ── Transcription ────────────────────────────────────────────────────
    if (entry.message_type === 'transcription') {
      const isIr = entry.role === 'interviewer';
      const cls  = isIr ? 'di-msg--interviewer' : 'di-msg--interviewee';
      const name = isIr ? interviewerName : intervieweeName;
      html += `<div class="di-msg ${cls}">
        <span class="di-msg-name">${esc(name)}</span>
        <span class="di-msg-text">${esc(entry.message_text || '')}</span>
      </div>`;
      continue;
    }

    if (entry.role !== 'system') continue;

    // ── Evaluation (+ optional paired follow-up) ─────────────────────────
    if (entry.task === 'evaluation') {
      const qi = evalCounter++;
      const next = ordered[i + 1];
      const fuEntry = (next && next.task === 'follow-up') ? next : null;
      if (fuEntry) i++;

      const evOut   = entry.output || {};
      const rat     = evOut.rating || {};
      const qd      = (entry.input || {}).question_details || {};
      const ab7     = `answer_eval.e${qi}`;
      const ab8     = `followup_decision.e${qi}`;

      const rubricScore = rat.score ?? 0;
      const rubricCls = rubricScore >= 9 ? 'gt-e' : rubricScore >= 7 ? 'gt-g'
                      : rubricScore >= 5 ? 'gt-a' : rubricScore >= 3 ? 'gt-i' : 'gt-p';
      const fuOut = fuEntry?.output || {};
      const shortQ = qd.question
        ? (qd.question.length > 80 ? qd.question.slice(0, 80) + '…' : qd.question) : '';
      const necessity = getScore(`${ab8}.necessity`);

      html += `
        <div class="di-eval-card">
          <div class="di-eval-header">
            <div>
              <span class="di-eval-title">Evaluation · Q${qi + 1}</span>
              ${shortQ ? `<div class="di-eval-qtext">${esc(shortQ)}</div>` : ''}
            </div>
            ${rat.rubric ? `<span class="di-rubric-badge ${rubricCls}">${esc(rat.rubric)} · ${rat.score}/10</span>` : ''}
          </div>

          ${qd.expected_answer_context ? `
            <details open class="expected-answer" style="margin-bottom:.6rem">
              <summary>Expected answer context</summary>
              <p>${esc(qd.expected_answer_context)}</p>
            </details>` : ''}

          <div class="ai-eval-box">
            ${evOut.what_was_answered ? `<div class="eval-answered"><strong>✓ Answered:</strong> ${esc(evOut.what_was_answered)}</div>` : ''}
            ${evOut.what_was_missed   ? `<div class="eval-missed"><strong>✗ Missed:</strong> ${esc(evOut.what_was_missed)}</div>` : ''}
            ${rat.reasoning ? `<details open class="ai-reasoning"><summary>Reasoning</summary><p>${esc(rat.reasoning)}</p></details>` : ''}
          </div>

          <div class="di-eval-ann">
            <div class="stage-section-label">Stage 7 — Answer Evaluation</div>
            ${rubricPanel('ANSWER_SCORE_ACCURACY',          `${ab7}.score_accuracy`)}
            ${rubricPanel('ANSWER_EVIDENCE_GROUNDING',      `${ab7}.evidence_grounding`)}
            ${rubricPanel('ANSWER_CLASSIFICATION_ACCURACY', `${ab7}.classification_accuracy`)}
            ${rubricPanel('ANSWER_GAP_STRENGTH',            `${ab7}.gap_strength`)}
          </div>

          <div class="di-followup-section">
            ${fuEntry
              ? `<div class="followup-box">
                   <div class="followup-header">Follow-up generated</div>
                   <div class="followup-text">${esc(fuOut.follow_up_question || '')}</div>
                   ${fuOut.expected_answer_context ? `
                     <details open class="expected-answer" style="padding:.3rem .7rem .5rem">
                       <summary>Expected context for follow-up</summary>
                       <p>${esc(fuOut.expected_answer_context)}</p>
                     </details>` : ''}
                 </div>`
              : `<div class="no-followup">No follow-up generated</div>`}

            <div class="di-followup-ann">
              <div class="stage-section-label">Stage 8 — Follow-Up Decision</div>
              <div class="rubric-panel veto">
                <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">
                  <span class="veto-badge">⚠ VETO</span>
                  <span style="font-size:.82rem;font-weight:600">8.1 Necessity Judgment</span>
                </div>
                <p style="font-size:.75rem;color:var(--text-mid);margin:0 0 .5rem">
                  ${fuEntry ? 'Follow-up was generated.' : 'No follow-up was generated.'}
                  Rate the decision: generate when score &lt;7, suppress when score ≥7.
                </p>
                <div class="binary-buttons" data-ann-key="${ab8}.necessity">
                  <button class="binary-btn ${necessity === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">✓ Correct</button>
                  <button class="binary-btn ${necessity === 'FAIL'    ? 'selected fail'    : ''}" data-value="FAIL">✗ Wrong</button>
                </div>
              </div>

              ${fuEntry ? `
                ${rubricPanel('FOLLOWUP_ANSWER_GROUNDING', `${ab8}.answer_grounding`)}
                ${rubricPanel('FOLLOWUP_CHAIN_COHERENCE',  `${ab8}.chain_coherence`)}
                ${rubricPanel('FOLLOWUP_FRAMING',          `${ab8}.framing`)}
              ` : ''}
            </div>
          </div>
        </div>`;
      continue;
    }

    if (entry.task === 'follow-up') continue;

    // ── Classification ────────────────────────────────────────────────────
    if (entry.task === 'classification') {
      const classif = entry.output?.classification || '';
      const ci  = classifCounter++;
      const ab6 = `flow_classification.c${ci}`;

      const classifCorrect = getScore(`${ab6}.classification`);
      const mqi    = entry.output?.matched_question_index ?? -1;
      const mqText = entry.output?.matched_question || '';
      const isEnd  = classif === 'Interview End';
      const isNewQ = classif === 'New Question';
      const isOop  = classif.startsWith('Out of Plan');
      const isCont = classif === 'Continuation';

      const badgeColorClass = isCont ? 'bc-cont' : isEnd ? 'bc-end' : isOop ? 'bc-oop' : 'bc-newq';
      const badgeIcon = isCont ? '🔄' : isEnd ? '🏁' : isOop ? '⚠️' : '✨';

      const hist = entry.input?.conversation_history || [];
      let convHtml = '';
      if (hist.length > 0) {
        convHtml += `<details class="conv-hist-details"><summary>💬 View prior context (${hist.length} messages)</summary><div class="conv-hist-body">`;
        for (let j = 0; j < hist.length; j++) {
          const role = Object.keys(hist[j])[0];
          const text = Object.values(hist[j])[0];
          const roleName = role === 'interviewer' ? interviewerName : (role === 'candidate' ? intervieweeName : role);
          const isRecruiter = role === 'interviewer' || role === 'recruiter';
          convHtml += `<div class="conv-hist-line"><span class="conv-hist-role ${isRecruiter ? 'recruiter' : 'candidate'}">${esc(roleName)}</span> <span class="conv-hist-text">${esc(text)}</span></div>`;
        }
        convHtml += '</div></details>';
      }

      const qInput = entry.input?.questions || {};
      const mainQs = qInput.main_questions || [];
      const fuQs = qInput.follow_up_questions || [];
      const mainCount = mainQs.length;
      const fuCount = fuQs.length;

      let availQsHtml = `<details class="avail-qs">
        <summary>📑 Available Questions (${mainCount} main, ${fuCount} follow-up)</summary>
        <div class="avail-qs-body">`;
      if (mainCount > 0) {
        availQsHtml += `<div class="avail-qs-label">MAIN QUESTIONS</div><ul>${mainQs.map(q => `<li>${esc(q)}</li>`).join('')}</ul>`;
      }
      if (fuCount > 0) {
        availQsHtml += `<div class="avail-qs-label">FOLLOW-UP QUESTIONS</div><ul>${fuQs.map(q => `<li>${esc(q)}</li>`).join('')}</ul>`;
      }
      availQsHtml += `</div></details>`;
      if (mainCount === 0 && fuCount === 0) availQsHtml = `<div class="avail-qs-empty">No Available Questions</div>`;

      const progressRaw = entry.input?.interview_progress_context || '';
      const progressLines = progressRaw.split('\n').map(l => l.trim()).filter(Boolean);
      let progressHtml = `<div class="progress-box"><ul>`;
      progressLines.forEach(l => { progressHtml += `<li>${esc(l)}</li>`; });
      progressHtml += `</ul></div>`;

      const reasoningHtml = entry.output?.reasoning ? `
        <details open class="classif-reasoning">
          <summary>Reasoning</summary>
          <p>${esc(entry.output.reasoning)}</p>
        </details>` : '';

      const evalQid   = getScore(`${ab6}.question_id`);
      const evalOop   = getScore(`${ab6}.oop_detection`);
      const evalSplit = getScore(`${ab6}.transcript_split`);

      const effectiveGt = classifCorrect === 'FAIL' ? getScore(`${ab6}.ground_truth`) : classif;
      const showNewQMetrics = effectiveGt === 'New Question';
      const showOopMetrics = effectiveGt?.startsWith('Out of Plan');

      let metricHtml = '';
      if (showNewQMetrics || showOopMetrics) {
        metricHtml += `<div class="section-label" style="margin-top:1.5rem">Flow Classification</div>
                       <div class="flow-metrics-box">`;

        if (showNewQMetrics) {
          metricHtml += `
            <div class="flow-metric">
              <details class="mb-sm rubric-details" data-rubric-id="6.4">
                <summary>View 6.4 Transcript Split Handling Rubric</summary>
                <div class="rubric-content">
                  ${state.rubrics['6.4']?.content || '<em>Rubric missing</em>'}
                </div>
              </details>
              <label class="di-annotate-label">Transcript Split Handling (6.4)</label>
              <div class="binary-buttons" data-ann-key="${ab6}.transcript_split">
                <button class="binary-btn ${evalSplit === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">Correct</button>
                <button class="binary-btn ${evalSplit === 'FAIL' ? 'selected fail' : ''}" data-value="FAIL">Fail</button>
              </div>
            </div>
            <div class="flow-metric">
              <details class="mb-sm rubric-details" data-rubric-id="6.2">
                <summary>View 6.2 Question Identification Rubric</summary>
                <div class="rubric-content">
                  ${state.rubrics['6.2']?.content || '<em>Rubric missing</em>'}
                </div>
              </details>
              <label class="di-annotate-label">Question Identification (6.2)</label>
              <div class="binary-buttons" data-ann-key="${ab6}.question_id">
                <button class="binary-btn ${evalQid === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">Correct</button>
                <button class="binary-btn ${evalQid === 'FAIL' ? 'selected fail' : ''}" data-value="FAIL">Fail</button>
              </div>
            </div>`;
        }

        if (showOopMetrics) {
          metricHtml += `
            <div class="flow-metric">
              <details class="mb-sm rubric-details" data-rubric-id="6.3">
                <summary>View 6.3 Out of Plan Detection Rubric</summary>
                <div class="rubric-content">
                  ${state.rubrics['6.3']?.content || '<em>Rubric missing</em>'}
                </div>
              </details>
              <label class="di-annotate-label">Out of Plan Detection (6.3)</label>
              <div class="binary-buttons" data-ann-key="${ab6}.oop_detection">
                <button class="binary-btn ${evalOop === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">Correct</button>
                <button class="binary-btn ${evalOop === 'PARTIAL' ? 'selected partial' : ''}" data-value="PARTIAL">Partial</button>
                <button class="binary-btn ${evalOop === 'FAIL' ? 'selected fail' : ''}" data-value="FAIL">Fail</button>
              </div>
            </div>`;
        }

        metricHtml += `</div>`;
      }

      html += `
        <div class="di-classif-card">
          <div class="di-classif-header">
            <div class="di-classif-header-left">
              <span class="di-classif-num">#${ci + 1}</span>
              <span class="di-classif-badge2 ${badgeColorClass}">${badgeIcon} ${esc(classif)}</span>
              <div class="di-classif-inline-ann" data-ann-key="${ab6}.classification" data-classif="${esc(classif)}">
                <button class="inline-btn ${classifCorrect === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT" title="6.1 Classification Accuracy">✓ Correct</button>
                <button class="inline-btn ${classifCorrect === 'FAIL' ? 'selected fail' : ''}" data-value="FAIL" title="6.1 Classification Accuracy">✗ Wrong</button>
              </div>
            </div>
            <div class="di-classif-header-right">
              ${classifCorrect === 'FAIL' ? `
                <span style="font-size:.7rem; color:var(--text-muted); margin-right:.4rem">Ground Truth:</span>
                <select class="di-select inline-select" data-ann-key="${ab6}.ground_truth">
                  <option value="">— select —</option>
                  ${CLASSIF_LABELS.map(l => `<option value="${l}" ${getScore(`${ab6}.ground_truth`) === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select>` : ''}
            </div>
          </div>

          <div class="di-classif-body">
            <div class="di-classif-left">
              <div class="section-label">Conversation History</div>
              <div style="margin-bottom:1rem;">${convHtml}</div>
              ${availQsHtml}
              ${reasoningHtml}
              <div class="ai-output-box">
                <div class="ai-output-header">🤖 Agent Intelligence</div>
                <div class="classif-extra-line"><span class="classif-extra-label">MATCHED Q</span> <span class="ai-output-value">${mqText ? esc(mqText) : '<span class="muted">—</span>'}</span></div>
                <div class="classif-extra-line"><span class="classif-extra-label">FOLLOW-UP</span> <span class="ai-output-value">${entry.output?.is_follow_up ? '<span style="color:var(--primary);font-weight:700">Yes</span>' : 'No'}</span></div>
              </div>
              ${metricHtml}
            </div>
            <div class="di-classif-right">
              <div class="section-label">Interview Progress</div>
              ${progressHtml}
            </div>
          </div>
        </div>`;

      // If this was the correctly-identified Interview End, offer to bulk-mark what follows
      if (ci === interviewEndCorrectCi && ci + 1 < totalClassifCount) {
        const remaining = totalClassifCount - ci - 1;
        html += `
        <div class="mark-remaining-container">
          <p class="mark-remaining-note">
            Interview end correctly identified and all prior evaluations are complete.
            The ${remaining} remaining classification${remaining > 1 ? 's' : ''} after this point
            ${remaining > 1 ? 'are' : 'is'} post-end continuation${remaining > 1 ? 's' : ''} — mark them all as Correct at once.
          </p>
          <button class="mark-remaining-btn" data-start-ci="${ci + 1}" data-total-ci="${totalClassifCount}">
            Mark remaining ${remaining} as Correct
          </button>
        </div>`;
      }

      continue;
    }
  }

  html += '</div>'; // /di-stream
  return html || '<div class="empty-state">No transcript entries found.</div>';
}
