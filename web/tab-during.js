// ═══════════════════════════════════════════════════════════════════════════
//  TAB — During Interview
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore } from './utils.js';

export const CLASSIF_LABELS = [
  'New Question',
  'Continuation',
  'Interview End',
  'Out of Plan New Question',
  'Out of Plan Follow-up Question',
];
export const EVAL_RUBRICS = ['Excellent', 'Good', 'Adequate', 'Inadequate', 'Poor'];

// ── Data helpers ──────────────────────────────────────────────────────────

function isNewQOrEnd(e) {
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
function buildDisplayOrder(pit) {
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
  const pit = d.prcoessed_interview_transcript;
  const intervieweeName = d.interviewee_name || 'Candidate';
  const interviewerName = d.interviewer_name || 'Interviewer';

  if (!pit || !pit.length) {
    return '<div class="empty-state">No live interview transcript found for this record.</div>';
  }

  let html = '';
  const ordered = buildDisplayOrder(pit);

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

      const evOut  = entry.output || {};
      const rat    = evOut.rating || {};
      const qd     = (entry.input || {}).question_details || {};
      const annBase = `during_interview.eval.${qi}`;

      const rubricScore = rat.score ?? 0;
      const rubricCls = rubricScore >= 9 ? 'gt-e' : rubricScore >= 7 ? 'gt-g'
                      : rubricScore >= 5 ? 'gt-a' : rubricScore >= 3 ? 'gt-i' : 'gt-p';
      const evalCorrect   = getScore(`${annBase}.eval_correct`);
      const fuAppropriate = getScore(`${annBase}.followup_appropriate`);
      const fuQuality     = getScore(`${annBase}.followup_quality`);
      const fuOut = fuEntry?.output || {};
      const shortQ = qd.question
        ? (qd.question.length > 80 ? qd.question.slice(0, 80) + '…' : qd.question) : '';

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
            <details class="expected-answer" style="margin-bottom:.6rem">
              <summary>Expected answer context</summary>
              <p>${esc(qd.expected_answer_context)}</p>
            </details>` : ''}

          <div class="ai-eval-box">
            ${evOut.what_was_answered ? `<div class="eval-answered"><strong>✓ Answered:</strong> ${esc(evOut.what_was_answered)}</div>` : ''}
            ${evOut.what_was_missed   ? `<div class="eval-missed"><strong>✗ Missed:</strong> ${esc(evOut.what_was_missed)}</div>` : ''}
            ${rat.reasoning ? `<details class="ai-reasoning"><summary>Reasoning</summary><p>${esc(rat.reasoning)}</p></details>` : ''}
          </div>

          <details class="eval-criteria-panel" style="margin-top:.8rem; background:var(--surface-alt); padding:.5rem; border-radius:var(--radius-sm); border:1px solid var(--border);">
            <summary style="font-size:.78rem; font-weight:600; color:var(--text-mid); cursor:pointer;">Evaluation Criteria & Decision Rules</summary>
            <div style="font-size:.75rem; color:var(--text-mid); margin-top:.4rem; line-height:1.5;">
              <div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="width:100px;font-weight:600;color:#15803d">Excellent 9–10</span><span>Comprehensive, specific detail. Exceeds expectations.</span></div>
              <div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="width:100px;font-weight:600;color:#2563eb">Good 7–8</span><span>Clear and relevant. Minor gaps.</span></div>
              <div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="width:100px;font-weight:600;color:#ca8a04">Adequate 5–6</span><span>Relevant but incomplete — partial answer.</span></div>
              <div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="width:100px;font-weight:600;color:#ea580c">Inadequate 3–4</span><span>Superficial. Misses most key elements.</span></div>
              <div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="width:100px;font-weight:600;color:#dc2626">Poor 1–2</span><span>Incorrect, irrelevant, or almost nothing answered.</span></div>
            </div>
          </details>

          <div class="di-eval-ann">
            <label class="di-annotate-label">Was the evaluation correct?</label>
            <div class="binary-buttons" data-ann-key="${annBase}.eval_correct" style="margin-top:.35rem">
              <button class="binary-btn ${evalCorrect === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">✓ Correct</button>
              <button class="binary-btn ${evalCorrect === 'FAIL'    ? 'selected fail'    : ''}" data-value="FAIL">✗ Wrong</button>
            </div>
            ${evalCorrect === 'FAIL' ? `
              <label class="di-annotate-label" style="margin-top:.5rem">Correct rubric:</label>
              <select class="di-select" data-ann-key="${annBase}.eval_gt" style="margin-top:.3rem">
                <option value="">— select —</option>
                ${EVAL_RUBRICS.map(r => `<option value="${r}" ${getScore(`${annBase}.eval_gt`) === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>` : ''}
          </div>

          <div class="di-followup-section">
            ${fuEntry
              ? `<div class="followup-box">
                   <div class="followup-header">Follow-up generated</div>
                   <div class="followup-text">${esc(fuOut.follow_up_question || '')}</div>
                   ${fuOut.expected_answer_context ? `
                     <details class="expected-answer" style="padding:.3rem .7rem .5rem">
                       <summary>Expected context for follow-up</summary>
                       <p>${esc(fuOut.expected_answer_context)}</p>
                     </details>` : ''}
                 </div>`
              : `<div class="no-followup">No follow-up generated</div>`}
            <div class="di-followup-ann">
              <label class="di-annotate-label">Was a follow-up appropriate? (Check 5.6 Follow-up Necessity)</label>
              <div class="binary-buttons" data-ann-key="${annBase}.followup_appropriate" style="margin-top:.35rem">
                <button class="binary-btn ${fuAppropriate === 'YES' ? 'selected correct' : ''}" data-value="YES">Yes</button>
                <button class="binary-btn ${fuAppropriate === 'NO'  ? 'selected fail'    : ''}" data-value="NO">No</button>
              </div>
              ${fuEntry ? `
                <label class="di-annotate-label" style="margin-top:.75rem">Quality of generated question:</label>
                <div class="binary-buttons" data-ann-key="${annBase}.followup_quality" style="margin-top:.35rem">
                  <button class="binary-btn ${fuQuality === 'GOOD' ? 'selected correct' : ''}" data-value="GOOD">Good</button>
                  <button class="binary-btn ${fuQuality === 'POOR' ? 'selected fail'    : ''}" data-value="POOR">Poor</button>
                </div>` : ''}
            </div>
          </div>
        </div>`;
      continue;
    }

    if (entry.task === 'follow-up') continue;

    // ── Classification ────────────────────────────────────────────────────
    if (entry.task === 'classification') {
      const classif = entry.output?.classification || '';
      const ci = classifCounter++;
      const annBase = `during_interview.classif.${ci}`;

      const classifCorrect = getScore(`${annBase}.correct`);
      const mqi    = entry.output?.matched_question_index ?? -1;
      const mqText = entry.output?.matched_question || '';
      const isEnd  = classif === 'Interview End';
      const isNewQ = classif === 'New Question';
      const isOop  = classif.startsWith('Out of Plan');
      const isCont = classif === 'Continuation';

      const badgeColorClass = isCont ? 'bc-cont' : isEnd ? 'bc-end' : isOop ? 'bc-oop' : 'bc-newq';

      const hist = entry.input?.conversation_history || [];
      let convHtml = '';
      if (hist.length > 0) {
        convHtml += `<details class="conv-hist-details"><summary>View prior context (${hist.length} messages)</summary><div class="conv-hist-body">`;
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
        <summary>Available Questions (${mainCount} main, ${fuCount} follow-up)</summary>
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
        <details class="classif-reasoning">
          <summary>Reasoning (click to expand)</summary>
          <p>${esc(entry.output.reasoning)}</p>
        </details>` : '';

      const evalQid = getScore(`${annBase}.qid`);
      const evalOop = getScore(`${annBase}.oop`);
      const evalSplit = getScore(`${annBase}.split`);

      const effectiveGt = classifCorrect === 'FAIL' ? getScore(`${annBase}.gt`) : classif;
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
              <div class="binary-buttons" data-ann-key="${annBase}.split">
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
              <div class="binary-buttons" data-ann-key="${annBase}.qid">
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
              <div class="binary-buttons" data-ann-key="${annBase}.oop">
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
              <span class="di-classif-badge2 ${badgeColorClass}">${esc(classif)}</span>
              <div class="di-classif-inline-ann" data-ann-key="${annBase}.correct" data-classif="${esc(classif)}">
                <button class="inline-btn ${classifCorrect === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT" title="6.1 Classification Accuracy">✓ Correct</button>
                <button class="inline-btn ${classifCorrect === 'FAIL' ? 'selected fail' : ''}" data-value="FAIL" title="6.1 Classification Accuracy">✗</button>
              </div>
            </div>
            <div class="di-classif-header-right">
              ${classifCorrect === 'FAIL' ? `
                <span style="font-size:.7rem; color:var(--text-muted); margin-right:.4rem">Ground Truth:</span>
                <select class="di-select inline-select" data-ann-key="${annBase}.gt">
                  <option value="">— select —</option>
                  ${CLASSIF_LABELS.map(l => `<option value="${l}" ${getScore(`${annBase}.gt`) === l ? 'selected' : ''}>${l}</option>`).join('')}
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
                <div class="ai-output-header">Parsed Output Info</div>
                <div class="classif-extra-line"><span class="classif-extra-label">MATCHED Q</span> <span class="ai-output-value">${mqText ? esc(mqText) : '<span class="muted">—</span>'}</span></div>
                <div class="classif-extra-line"><span class="classif-extra-label">FOLLOW-UP</span> <span class="ai-output-value">${entry.output?.is_follow_up ? '<span style="color:var(--primary);font-weight:600">Yes</span>' : 'No'}</span></div>
              </div>
              ${metricHtml}
            </div>
            <div class="di-classif-right">
              <div class="section-label">Interview Progress</div>
              ${progressHtml}
            </div>
          </div>
        </div>`;
      continue;
    }
  }

  html += '</div>'; // /di-stream
  return html || '<div class="empty-state">No transcript entries found.</div>';
}
