// ═══════════════════════════════════════════════════════════════════════════
//  TAB — During Interview
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel, feedbackBox } from './utils.js';

const ANSWER_DIMS = [
  { key: 'ANSWER_SCORE_ACCURACY',          ann: 'score_accuracy'          },
  { key: 'ANSWER_EVIDENCE_GROUNDING',      ann: 'evidence_grounding'      },
  { key: 'ANSWER_CLASSIFICATION_ACCURACY', ann: 'classification_accuracy' },
  { key: 'ANSWER_GAP_STRENGTH',            ann: 'gap_strength'            },
];

const FOLLOWUP_DIMS = [
  { key: 'FOLLOWUP_ANSWER_GROUNDING', ann: 'answer_grounding' },
  { key: 'FOLLOWUP_CHAIN_COHERENCE',  ann: 'chain_coherence'  },
  { key: 'FOLLOWUP_FRAMING',          ann: 'framing'          },
];

function parseConversation(detail, interviewerName, intervieweeName) {
  if (!detail) return '<span class="muted" style="font-style:italic;font-size:.8rem">No conversation recorded.</span>';
  return detail.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const isRecruiter = line.startsWith('recruiter:');
    const text = line.replace(/^(recruiter|candidate):\s*/, '').trim();
    const name = isRecruiter ? interviewerName : intervieweeName;
    return `<div class="chat-line ${isRecruiter ? 'recruiter' : 'candidate'}">
      <span class="speaker">${esc(name)}</span>
      <span class="chat-text">${esc(text)}</span>
    </div>`;
  }).join('');
}

export function renderDuringInterviewTab() {
  const d   = state.data;
  const buckets = d.interview_history_buckets;
  const intervieweeName = d.interviewee_name || 'Candidate';
  const interviewerName = d.interviewer_name || 'Interviewer';

  if (!buckets || !buckets.length || !buckets[0] || !buckets[0].length) {
    return '<div class="empty-state">No interview data found for this record.</div>';
  }

  const questions = buckets.flat();

  const cards = questions.map((item, i) => {
    const qd  = item.question_detail  || {};
    const ac  = item.answer_correctness || {};
    const fq  = item.follow_up_question || null;
    const rat = ac.rating || {};
    const ab7 = `answer_eval.e${i}`;
    const ab8 = `followup_decision.e${i}`;

    const rubricScore = rat.score || 0;
    const rubricCls   = rubricScore >= 9 ? 'gt-e' : rubricScore >= 7 ? 'gt-g'
                      : rubricScore >= 5 ? 'gt-a' : rubricScore >= 3 ? 'gt-i' : 'gt-p';

    const scored7    = ANSWER_DIMS.filter(dim => !!getScore(`${ab7}.${dim.ann}`)).length;
    const fu8Keys    = fq ? FOLLOWUP_DIMS.map(dim => getScore(`${ab8}.${dim.ann}`)) : [];
    const scored8    = fu8Keys.filter(Boolean).length;
    const totalSlots = ANSWER_DIMS.length + (fq ? FOLLOWUP_DIMS.length : 0);
    const scoredCount  = scored7 + scored8;
    const progressPct  = (scoredCount / totalSlots) * 100;
    const progressState = scoredCount === 0 ? 'untouched' : scoredCount === totalSlots ? 'complete' : 'partial';

    return `
      <div class="thread-card" data-progress="${progressState}" style="margin-bottom:.75rem;">
        <div class="thread-header">
          <span class="thread-num">QUESTION ${i + 1}</span>
          <div class="q-progress-wrap">
            <span class="q-progress-text">${scoredCount}/${totalSlots} rated</span>
            <div class="q-progress-track">
              <div class="q-progress-fill" style="width:${progressPct}%"></div>
            </div>
          </div>
        </div>

        <div class="thread-body" style="display:grid;grid-template-columns:1fr 1fr;gap:0;">

          <!-- ── Left: Data ─────────────────────────────────────────────── -->
          <div class="thread-left" style="padding:1.5rem;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:.85rem;">

            <div class="question-text" style="font-size:1.05rem;font-weight:600;color:var(--text);line-height:1.45;">
              ${esc(qd.shortened_question || '')}
            </div>

            <!-- Skills -->
            <div class="q-sub-box" style="border-left-color:var(--primary);">
              <div class="q-sub-box-label" style="color:var(--primary);">SKILLS TO BE ASSESSED</div>
              <div class="skills-assessed">
                ${(qd.skills_to_be_assessed || []).length
                  ? qd.skills_to_be_assessed.map(s => `<span class="jd-chip jd-chip-must">${esc(s)}</span>`).join('')
                  : '<span class="muted" style="font-size:.8rem;font-style:italic">None listed</span>'}
              </div>
            </div>

            <!-- Expected Answer Context -->
            <div class="q-sub-box" style="border-left-color:var(--s4);">
              <div class="q-sub-box-label" style="color:var(--s4);">EXPECTED ANSWER CONTEXT</div>
              <p class="context-p">${esc(qd.expected_answer_context || '')}</p>
            </div>

            <!-- Conversation -->
            <div class="q-sub-box" style="border-left-color:var(--s3);">
              <div class="q-sub-box-label" style="color:var(--s3);">CONVERSATION</div>
              <div class="conversation-scroll">
                ${parseConversation(item.conversation_detail, interviewerName, intervieweeName)}
              </div>
            </div>

            <!-- AI Answer Assessment -->
            <div class="q-sub-box" style="border-left-color:var(--s2);">
              <div class="q-sub-box-label" style="color:var(--s2);">AI ANSWER ASSESSMENT</div>
              ${ac.what_was_answered
                ? `<div class="eval-answered" style="margin-bottom:.5rem;"><strong>✓ Answered:</strong> ${esc(ac.what_was_answered)}</div>` : ''}
              ${ac.what_was_missed
                ? `<div class="eval-missed" style="margin-bottom:.5rem;"><strong>✗ Missed:</strong> ${esc(ac.what_was_missed)}</div>` : ''}
              ${rat.rubric
                ? `<div style="margin:.5rem 0;"><span class="di-rubric-badge ${rubricCls}">${esc(rat.rubric)} · ${rat.score}/10</span></div>` : ''}
              ${rat.reasoning
                ? `<details class="ai-reasoning"><summary>Reasoning</summary><p>${esc(rat.reasoning)}</p></details>` : ''}
            </div>

            <!-- Follow-up Question -->
            ${fq
              ? `<div class="q-sub-box" style="border-left-color:var(--s5);">
                   <div class="q-sub-box-label" style="color:var(--s5);">FOLLOW-UP GENERATED</div>
                   <div class="followup-text" style="margin-bottom:.75rem;">${esc(fq.follow_up_question || '')}</div>
                   ${fq.expected_answer_context
                     ? `<div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:.3rem;">Expected Context</div>
                        <p class="context-p">${esc(fq.expected_answer_context)}</p>` : ''}
                 </div>`
              : `<div class="q-sub-box" style="border-left-color:var(--border);">
                   <div class="no-followup">No follow-up generated</div>
                 </div>`}

          </div>

          <!-- ── Right: Evaluation ──────────────────────────────────────── -->
          <div class="thread-right" style="padding:1.5rem;display:flex;flex-direction:column;gap:.85rem;">

            <div class="stage-section-label">Stage 7 — Answer Evaluation</div>
            ${ANSWER_DIMS.map(dim => rubricPanel(dim.key, `${ab7}.${dim.ann}`)).join('')}

            <div class="stage-section-label" style="margin-top:.25rem;">Stage 8 — Follow-Up Decision</div>

            ${fq ? FOLLOWUP_DIMS.map(dim => rubricPanel(dim.key, `${ab8}.${dim.ann}`)).join('') : ''}

          </div>

        </div>
      </div>`;
  }).join('');

  return `
    <div class="during-tab">
      <div class="tab-header-label">
        <span class="icon">🎙</span>
        WHAT THE SYSTEM PRODUCED &amp; YOUR EVALUATION
      </div>
      <div class="during-list">
        ${cards}
      </div>
      ${feedbackBox('feedback.during')}
    </div>`;
}
